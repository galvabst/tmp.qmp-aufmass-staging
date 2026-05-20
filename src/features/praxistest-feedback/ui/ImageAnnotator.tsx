import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, MoveUpRight, Type, Undo2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tool = 'pen' | 'arrow' | 'text';

interface Sticky {
  id: string;
  x: number;
  y: number;
  text: string;
}

interface Props {
  source: File | string; // File from upload, or url
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}

const ACCENT = '#ef4444'; // red-500
const LINE_WIDTH = 3;

/**
 * Einfacher Bild-Annotator: Freihand, Pfeil, Text-Sticky (eine Farbe).
 * Beim Speichern werden Stickies auf das Canvas gebrannt und ein PNG-Blob geliefert.
 */
export function ImageAnnotator({ source, onSave, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [stickies, setStickies] = useState<Sticky[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const arrowStartRef = useRef<{ x: number; y: number } | null>(null);
  const baseRef = useRef<string | null>(null); // snapshot before arrow drag

  // Load image into canvas
  useEffect(() => {
    const url = typeof source === 'string' ? source : URL.createObjectURL(source);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const maxW = 900;
      const scale = Math.min(1, maxW / img.naturalWidth);
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      imgRef.current = img;
      setIsReady(true);
      setHistory([canvas.toDataURL('image/png')]);
    };
    img.onerror = () => {
      console.error('[ImageAnnotator] Bild konnte nicht geladen werden');
    };
    img.src = url;
    return () => {
      if (typeof source !== 'string') URL.revokeObjectURL(url);
    };
  }, [source]);

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setHistory((h) => [...h.slice(-19), canvas.toDataURL('image/png')]);
  }, []);

  const restoreFromDataUrl = (url: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = url;
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const next = history.slice(0, -1);
    setHistory(next);
    restoreFromDataUrl(next[next.length - 1]);
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.currentTarget.width / rect.width;
    const sy = e.currentTarget.height / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getPos(e);
    if (tool === 'text') {
      const text = window.prompt('Notiz eingeben:')?.trim();
      if (!text) return;
      setStickies((s) => [...s, { id: crypto.randomUUID(), x: pos.x, y: pos.y, text }]);
      return;
    }
    drawingRef.current = true;
    lastRef.current = pos;
    if (tool === 'arrow') {
      arrowStartRef.current = pos;
      baseRef.current = canvas.toDataURL('image/png');
    }
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }) => {
    const headLen = 14;
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    ctx.strokeStyle = ACCENT;
    ctx.fillStyle = ACCENT;
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 6), to.y - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 6), to.y - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const pos = getPos(e);
    if (tool === 'pen' && lastRef.current) {
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(lastRef.current.x, lastRef.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastRef.current = pos;
    } else if (tool === 'arrow' && arrowStartRef.current && baseRef.current) {
      // Redraw base then preview arrow
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        drawArrow(ctx, arrowStartRef.current!, pos);
      };
      img.src = baseRef.current;
    }
  };

  const handleMouseUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastRef.current = null;
    arrowStartRef.current = null;
    baseRef.current = null;
    pushHistory();
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    try {
      // Burn stickies onto canvas
      const ctx = canvas.getContext('2d');
      if (ctx && stickies.length > 0) {
        ctx.font = 'bold 16px system-ui, sans-serif';
        for (const s of stickies) {
          const padX = 8;
          const padY = 6;
          const metrics = ctx.measureText(s.text);
          const w = metrics.width + padX * 2;
          const h = 24;
          ctx.fillStyle = ACCENT;
          ctx.fillRect(s.x, s.y, w, h);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(s.text, s.x + padX, s.y + h - padY - 1);
        }
      }
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.92));
      if (!blob) throw new Error('Konvertierung fehlgeschlagen');
      onSave(blob);
    } catch (err) {
      console.error('[ImageAnnotator] Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToolBtn active={tool === 'pen'} onClick={() => setTool('pen')} icon={<Pencil className="w-4 h-4" />} label="Stift" />
        <ToolBtn active={tool === 'arrow'} onClick={() => setTool('arrow')} icon={<MoveUpRight className="w-4 h-4" />} label="Pfeil" />
        <ToolBtn active={tool === 'text'} onClick={() => setTool('text')} icon={<Type className="w-4 h-4" />} label="Notiz" />
        <Button type="button" size="sm" variant="outline" onClick={handleUndo} disabled={history.length <= 1} className="gap-1.5 ml-auto">
          <Undo2 className="w-4 h-4" /> Rückgängig
        </Button>
      </div>

      <div className="relative bg-muted/30 rounded-lg border border-border overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={cn('max-w-full block', tool === 'text' ? 'cursor-text' : 'cursor-crosshair')}
        />
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Bild wird geladen…
          </div>
        )}
        {/* Sticky preview overlay */}
        {stickies.map((s) => {
          const canvas = canvasRef.current;
          if (!canvas) return null;
          const rect = canvas.getBoundingClientRect();
          const sx = rect.width / canvas.width;
          const sy = rect.height / canvas.height;
          return (
            <div
              key={s.id}
              className="absolute pointer-events-none px-2 py-0.5 text-xs font-bold text-white rounded-sm"
              style={{ left: s.x * sx, top: s.y * sy, backgroundColor: ACCENT }}
            >
              {s.text}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          Abbrechen
        </Button>
        <Button type="button" size="sm" onClick={handleSave} disabled={!isReady || saving}>
          {saving && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
          Markierung übernehmen
        </Button>
      </div>
    </div>
  );
}

function ToolBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <Button type="button" size="sm" variant={active ? 'default' : 'outline'} onClick={onClick} className="gap-1.5">
      {icon} {label}
    </Button>
  );
}
