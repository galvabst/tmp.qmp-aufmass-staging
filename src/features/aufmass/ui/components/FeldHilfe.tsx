import { useState, type ReactNode } from 'react';
import { HelpCircle, MapPin, ListChecks, AlertTriangle, Sparkles, Send, Loader2, type LucideIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { feldHilfe } from '../../data/feld-hilfe';
import { frageFeldHilfe } from '../../data/feld-hilfe-chat-client';

/**
 * Ebene-2/3-Hilfe als Bottom-Sheet (NICHT Popover — Touch/Handschuhe/Sonne).
 * Trigger ist ein dezenter „Hilfe"-Knopf neben dem Label; im Sheet stehen
 * „Wo finde ich das?"-Quellen, Vorgehen, typische Werte, Fallstricke und — bei
 * schweren Feldern — eine „KI fragen"-Eskalation. Rendert nichts, wenn das Feld
 * keine Tiefe (sheet/kiFrage) hat.
 */
export function FeldHilfeSheet({ hilfeKey }: { hilfeKey: string }) {
  const h = feldHilfe(hilfeKey);
  const [frage, setFrage] = useState('');
  const [antwort, setAntwort] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!h || (!h.sheet && !h.kiFrage)) return null;
  const s = h.sheet;
  const kiFrage = h.kiFrage;
  const titel = s?.titel ?? 'Wo finde ich das?';

  const stelleFrage = async (q: string) => {
    const text = q.trim();
    if (!text || loading) return;
    setLoading(true);
    setAntwort(null);
    const a = await frageFeldHilfe(hilfeKey, text);
    setAntwort(a ?? 'Die KI-Hilfe ist gerade nicht erreichbar (z. B. offline). Nutze die Tipps oben oder frag den Eigentümer.');
    setLoading(false);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary shrink-0 rounded-md px-1.5 py-1 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Hilfe zu „${titel}“`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Hilfe</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary shrink-0" />
            {titel}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4 text-sm">
          {h.inline && <p className="text-foreground leading-relaxed">{h.inline}</p>}

          {s?.bildUrl && (
            <img src={s.bildUrl} alt="" className="w-full rounded-xl border border-border" loading="lazy" />
          )}

          {s?.quellen && s.quellen.length > 0 && (
            <HilfeBlock icon={MapPin} titel="Wo finde ich das?">
              <ol className="list-decimal pl-5 space-y-1">
                {s.quellen.map((q, i) => <li key={i}>{q}</li>)}
              </ol>
            </HilfeBlock>
          )}

          {s?.schritte && s.schritte.length > 0 && (
            <HilfeBlock icon={ListChecks} titel="So gehst du vor">
              <ol className="list-decimal pl-5 space-y-1">
                {s.schritte.map((q, i) => <li key={i}>{q}</li>)}
              </ol>
            </HilfeBlock>
          )}

          {s?.typisch && (
            <HilfeBlock icon={ListChecks} titel="Typische Werte">
              <p>{s.typisch}</p>
            </HilfeBlock>
          )}

          {s?.fallstricke && (
            <HilfeBlock icon={AlertTriangle} titel="Achtung" tone="warn">
              <p>{s.fallstricke}</p>
            </HilfeBlock>
          )}

          {kiFrage && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles className="w-4 h-4" /> Immer noch unklar? Frag die KI
              </p>
              <div className="flex gap-2">
                <Input
                  value={frage}
                  onChange={(e) => setFrage(e.target.value)}
                  placeholder={kiFrage}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      stelleFrage(frage || kiFrage);
                    }
                  }}
                />
                <Button type="button" size="icon" disabled={loading} onClick={() => stelleFrage(frage || kiFrage)} aria-label="Frage senden">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              <button
                type="button"
                className="text-xs text-primary underline underline-offset-2"
                onClick={() => { setFrage(kiFrage); stelleFrage(kiFrage); }}
              >
                „{kiFrage}“ fragen
              </button>
              {antwort && (
                <p className="text-xs text-foreground whitespace-pre-wrap border-t border-primary/20 pt-2 leading-relaxed">{antwort}</p>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function HilfeBlock({ icon: Icon, titel, children, tone }: {
  icon: LucideIcon;
  titel: string;
  children: ReactNode;
  tone?: 'warn';
}) {
  return (
    <div>
      <p className={`flex items-center gap-1.5 text-xs font-semibold ${tone === 'warn' ? 'text-amber-600' : 'text-muted-foreground'}`}>
        <Icon className="w-3.5 h-3.5 shrink-0" />
        {titel}
      </p>
      <div className="mt-1 text-foreground leading-relaxed">{children}</div>
    </div>
  );
}
