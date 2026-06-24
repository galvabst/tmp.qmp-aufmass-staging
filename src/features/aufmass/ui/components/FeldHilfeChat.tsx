import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, Loader2, ImagePlus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { bildAlsKiBase64 } from '../../data/foto-verarbeitung';
import { frageFeldHilfeChat, type ChatNachricht } from '../../data/feld-hilfe-chat-client';

interface Props {
  /** Feld-Schlüssel (steuert den Hilfe-Kontext, den die KI mitbekommt). */
  feldKey: string;
  /** Vorbefüllte Einstiegsfrage als antippbarer Chip (leerer Chat). */
  startfrage?: string;
}

const OFFLINE_FALLBACK =
  'Die KI-Hilfe ist gerade nicht erreichbar (z. B. offline). Nutze die Tipps oben, frag den Eigentümer — oder mach ein Foto für später.';

/**
 * Echter, hartnäckiger KI-Chat im Hilfe-Sheet (Ebene 3) — mobile-first wie eine
 * Handy-Chat-App (große Tap-Targets, lesbare Blasen, 16-px-Eingabe gegen iOS-Zoom,
 * Safe-Area unten). Der Laie kann frei fragen und Fotos anhängen; die KI behält den
 * ganzen Verlauf, wertet Bilder aus und bleibt dran, bis der Wert gefunden ist (sie
 * bietet KEINEN bequemen „unbekannt"-Ausweg an). Rein beratend — setzt nie einen Wert.
 */
export function FeldHilfeChat({ feldKey, startfrage }: Props) {
  const [verlauf, setVerlauf] = useState<ChatNachricht[]>([]);
  const [eingabe, setEingabe] = useState('');
  const [bild, setBild] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endeRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => {
    endeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [verlauf]);

  const fotoWaehlen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // gleiche Datei erneut wählbar machen
    if (!file) return;
    setFehler(null);
    try {
      const { base64, mimeType } = await bildAlsKiBase64(file);
      if (base64) setBild(`data:${mimeType};base64,${base64}`);
      else setFehler('Das Foto konnte nicht verarbeitet werden — bitte ein anderes wählen.');
    } catch {
      setFehler('Das Foto konnte nicht verarbeitet werden — bitte ein anderes wählen.');
    }
  };

  const sendeNachricht = async (rohtext: string) => {
    const text = rohtext.trim();
    if ((!text && !bild) || loading) return;

    const userNachricht: ChatNachricht = {
      rolle: 'user',
      text: text || 'Ich habe ein Foto angehängt.',
      ...(bild ? { bildDataUrl: bild } : {}),
    };
    const neuerVerlauf = [...verlauf, userNachricht];
    setVerlauf(neuerVerlauf);
    setEingabe('');
    setBild(null);
    setFehler(null);
    setLoading(true);
    const antwort = await frageFeldHilfeChat(feldKey, neuerVerlauf);
    if (!mountedRef.current) return; // Sheet zwischenzeitlich geschlossen
    setVerlauf((v) => [...v, { rolle: 'ki', text: antwort ?? OFFLINE_FALLBACK }]);
    setLoading(false);
  };

  const leer = verlauf.length === 0;

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] overflow-hidden">
      <div className="flex items-center gap-1.5 border-b border-primary/15 px-3.5 py-2.5 text-xs font-semibold text-primary">
        <Sparkles className="w-4 h-4 shrink-0" />
        KI-Assistent — fragt so lange nach, bis ihr den Wert habt
      </div>

      <div
        className="max-h-[46vh] min-h-[26vh] overflow-y-auto overscroll-contain px-3 py-3 space-y-3"
        aria-live="polite"
        aria-label="Chat-Verlauf"
      >
        {leer && (
          <>
            <KiBlase>
              Hi! Ich helfe dir, den richtigen Wert für dieses Feld <strong>herauszufinden</strong> — frag
              mich einfach, oder häng ein Foto an (z. B. Typenschild, Dokument, Heizkessel). Ich werte es aus.
            </KiBlase>
            {startfrage && (
              <button
                type="button"
                disabled={loading}
                onClick={() => void sendeNachricht(startfrage)}
                className="ml-9 inline-block rounded-full border border-primary/40 bg-background px-4 py-2 text-sm text-primary active:scale-[0.98] hover:bg-primary/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition"
              >
                „{startfrage}" fragen
              </button>
            )}
          </>
        )}

        {verlauf.map((n, i) =>
          n.rolle === 'ki' ? (
            <KiBlase key={i}>{n.text}</KiBlase>
          ) : (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground whitespace-pre-wrap">
                {n.bildDataUrl && (
                  <img src={n.bildDataUrl} alt="Angehängtes Foto" className="mb-1.5 w-40 max-w-[60%] rounded-lg" />
                )}
                {n.text}
              </div>
            </div>
          ),
        )}

        {loading && (
          <KiBlase>
            <span className="inline-flex gap-1 py-1" aria-label="KI denkt nach">
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" />
            </span>
          </KiBlase>
        )}
        <div ref={endeRef} />
      </div>

      <div className="border-t border-primary/15 px-2 pt-2 space-y-2 pb-[calc(0.5rem_+_env(safe-area-inset-bottom))]">
        {bild && (
          <div className="flex items-center gap-2 rounded-xl bg-background border border-border p-1.5">
            <img src={bild} alt="Vorschau des angehängten Fotos" className="h-14 w-14 rounded-lg object-cover" />
            <span className="flex-1 text-sm text-muted-foreground">Foto angehängt</span>
            <button
              type="button"
              onClick={() => setBild(null)}
              aria-label="Foto entfernen"
              className="rounded-lg p-2 text-muted-foreground active:scale-95 hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {fehler && <p className="px-1 text-sm text-amber-600" role="status">{fehler}</p>}

        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => void fotoWaehlen(e)}
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-11 w-11 shrink-0 rounded-xl active:scale-95"
            onClick={() => fileRef.current?.click()}
            aria-label="Foto anhängen"
          >
            <ImagePlus className="w-5 h-5" />
          </Button>
          <Input
            value={eingabe}
            onChange={(e) => setEingabe(e.target.value)}
            placeholder="Frag die KI oder beschreib, was du siehst…"
            aria-label="Nachricht an die KI"
            enterKeyHint="send"
            autoComplete="off"
            className="flex-1 h-11 rounded-xl text-base"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void sendeNachricht(eingabe);
              }
            }}
          />
          <Button
            type="button"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl active:scale-95"
            disabled={loading || (!eingabe.trim() && !bild)}
            onClick={() => void sendeNachricht(eingabe)}
            aria-label="Nachricht senden"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** KI-Nachricht: kleines Sparkles-Avatar + Sprechblase links. */
function KiBlase({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-border bg-background px-3.5 py-2.5 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
        {children}
      </div>
    </div>
  );
}
