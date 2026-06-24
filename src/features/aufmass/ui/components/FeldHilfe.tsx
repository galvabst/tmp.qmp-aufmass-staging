import { type ReactNode } from 'react';
import { HelpCircle, MapPin, ListChecks, AlertTriangle, type LucideIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { feldHilfe } from '../../data/feld-hilfe';
import { FeldHilfeChat } from './FeldHilfeChat';

/**
 * Ebene-2/3-Hilfe als Bottom-Sheet (NICHT Popover — Touch/Handschuhe/Sonne).
 * Trigger ist ein dezenter „Hilfe"-Knopf neben dem Label; im Sheet stehen
 * „Wo finde ich das?"-Quellen, Vorgehen, typische Werte, Fallstricke und — bei
 * schweren Feldern — der hartnäckige „KI fragen"-Chat (mit Foto-Auswertung).
 * Rendert nichts, wenn das Feld keine Tiefe (sheet/kiFrage) hat.
 */
export function FeldHilfeSheet({ hilfeKey, trigger }: { hilfeKey: string; trigger?: ReactNode }) {
  const h = feldHilfe(hilfeKey);

  if (!h || (!h.sheet && !h.kiFrage)) return null;
  const s = h.sheet;
  const kiFrage = h.kiFrage;
  const titel = s?.titel ?? 'Wo finde ich das?';

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary shrink-0 rounded-lg px-2.5 py-1.5 active:scale-95 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition"
            aria-label={`Hilfe zu „${titel}“`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Hilfe</span>
          </button>
        )}
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

          {kiFrage && <FeldHilfeChat feldKey={hilfeKey} startfrage={kiFrage} />}
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
