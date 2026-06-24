import { useRef, useState } from 'react';
import { Camera, Loader2, Sparkles, CheckCircle2, AlertTriangle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { holeBildHinweis, type BildHinweis, type BildHinweisArt } from '../../data/bild-hinweis-client';
import { FeldHilfeSheet } from './FeldHilfe';

interface Props {
  art: BildHinweisArt;
  disabled?: boolean;
  /** Dach: true=gedämmt, false=nicht gedämmt (nur bei eindeutigem Ergebnis). */
  onDach?: (gedaemmt: boolean) => void;
  /** Verglasung: Basis-Typ (Wärmeschutz ggf. manuell verfeinern). */
  onVerglasung?: (wert: 'einfach' | 'zweifach' | 'dreifach') => void;
}

const DACH_MAP: Record<string, { label: string; gedaemmt: boolean } | undefined> = {
  daemmung_sichtbar: { label: 'Dämmung sichtbar → „gedämmt" übernehmen', gedaemmt: true },
  keine_daemmung_sichtbar: { label: 'Keine Dämmung sichtbar → „nicht gedämmt" übernehmen', gedaemmt: false },
};
const VERG_MAP: Record<string, 'einfach' | 'zweifach' | 'dreifach' | undefined> = {
  einfach: 'einfach', zweifach: 'zweifach', dreifach: 'dreifach',
};

/**
 * UNVERBINDLICHER Foto-Tipp für „Dach gedämmt?" bzw. „Verglasung". Research-Urteil:
 * nur Hinweis, nie Auto-Wert → Ergebnis wird nur per Pflicht-Klick übernommen, mit
 * Option „nicht beurteilbar"/„unklar" (dann kein Übernehmen, Laie entscheidet selbst).
 * Wer unsicher ist, öffnet per „Frag die KI" den hartnäckigen Chat (Fotos + Rückfragen).
 */
export function BildHinweisButton({ art, disabled, onDach, onVerglasung }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<BildHinweis | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setLoading(true);
    setFehler(null);
    setRes(null);
    const r = await holeBildHinweis(file, art);
    if (!r) setFehler('Konnte das Foto nicht auswerten (z. B. offline). Bitte selbst beurteilen oder die KI fragen.');
    else setRes(r);
    setLoading(false);
  };

  const hilfeKey = art === 'dach' ? 'dach_gedaemmt' : 'verglasung';
  const triggerText = art === 'dach' ? 'Foto-Tipp: Dachboden fotografieren' : 'Foto-Tipp: Reflexe am Glas zählen lassen';
  const dachMap = res ? DACH_MAP[res.ergebnis] : undefined;
  const vergMap = res ? VERG_MAP[res.ergebnis] : undefined;
  const eindeutig = art === 'dach' ? !!dachMap : !!vergMap;

  const chatEskalation = (
    <FeldHilfeSheet
      hilfeKey={hilfeKey}
      trigger={
        <Button type="button" variant="ghost" size="sm" className="w-full justify-start text-xs h-auto py-1.5 text-primary">
          <MessageCircle className="w-3.5 h-3.5" /> Unsicher? Frag die KI im Chat (Fotos + Rückfragen)
        </Button>
      }
    />
  );

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} disabled={disabled} />
      <Button type="button" variant="ghost" size="sm" className="text-xs h-auto py-1.5" disabled={disabled || loading} onClick={() => inputRef.current?.click()}>
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
        {loading ? 'Foto wird ausgewertet…' : triggerText}
      </Button>

      {art === 'verglasung' && !res && !loading && (
        <p className="text-xs text-muted-foreground leading-snug">
          So geht's: Handy-Blitz/Taschenlampe schräg ans Glas halten und das Foto mit den Spiegelbildern machen —
          die KI zählt die Reflexe (2 = einfach, 4 = zweifach, 6 = dreifach). Kein „Glasrand"-Code nötig.
        </p>
      )}

      {fehler && (
        <p className="flex items-start gap-1.5 text-xs text-amber-600">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{fehler}
        </p>
      )}

      {res && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2 text-sm">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Sparkles className="w-4 h-4" /> Unverbindlicher KI-Tipp — du entscheidest
          </p>
          {res.begruendung && <p className="text-xs text-foreground">{res.begruendung}</p>}

          {eindeutig ? (
            art === 'dach' && dachMap && onDach ? (
              <Button type="button" size="sm" className="w-full" disabled={disabled} onClick={() => onDach(dachMap.gedaemmt)}>
                <CheckCircle2 className="w-4 h-4" /> {dachMap.label}
              </Button>
            ) : art === 'verglasung' && vergMap && onVerglasung ? (
              <Button type="button" size="sm" className="w-full" disabled={disabled} onClick={() => onVerglasung(vergMap)}>
                <CheckCircle2 className="w-4 h-4" /> „{vergMap === 'einfach' ? '1-fach' : vergMap === 'zweifach' ? '2-fach' : '3-fach'}" übernehmen
              </Button>
            ) : null
          ) : (
            <p className="text-xs text-amber-600">Nicht eindeutig erkennbar — frag die KI, sie hilft dir mit Fotos &amp; Rückfragen Schritt für Schritt weiter:</p>
          )}
        </div>
      )}

      {chatEskalation}
    </div>
  );
}
