import { useRef, useState } from 'react';
import { Camera, Loader2, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { scanTypenschild, type TypenschildScan } from '../../data/typenschild-scan-client';

interface Props {
  disabled?: boolean;
  /** Übernimmt die erkannte Brennstoff-Kategorie als Heizungsart (Pflicht-Klick, kein Auto-Wert). */
  onHeizungsart?: (kat: 'gas' | 'oel' | 'sonstige') => void;
}

const KAT_LABEL: Record<'gas' | 'oel' | 'sonstige', string> = { gas: 'Gas', oel: 'Öl', sonstige: 'Sonstige' };

/**
 * „Typenschild scannen" — das EINE verbindliche KI-Foto-Feature. Liest das Typenschild
 * der bestehenden Heizung (Hersteller, Modell, Leistung, Brennstoff) und schlägt die
 * Heizungsart vor. Alles ist VORSCHLAG mit Pflicht-Bestätigung; Baujahr nur, wenn es
 * im Klartext auf dem Schild steht (nie aus der Seriennummer geraten).
 */
export function TypenschildScanButton({ disabled, onHeizungsart }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [scan, setScan] = useState<TypenschildScan | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // gleiche Datei erneut wählbar machen
    if (!file) return;
    setLoading(true);
    setFehler(null);
    setScan(null);
    const result = await scanTypenschild(file);
    if (!result) {
      setFehler('Konnte das Typenschild nicht auslesen (z. B. offline). Bitte die Werte manuell eintragen.');
    } else {
      setScan(result);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
        disabled={disabled}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={disabled || loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        {loading ? 'Typenschild wird gelesen…' : 'Typenschild scannen (füllt Heizungsart aus)'}
      </Button>

      {fehler && (
        <p className="flex items-start gap-1.5 text-xs text-amber-600">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{fehler}
        </p>
      )}

      {scan && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2 text-sm">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Sparkles className="w-4 h-4" /> KI-Vorschlag vom Typenschild — bitte prüfen
          </p>

          {scan.lesbar ? (
            <ul className="space-y-0.5 text-foreground">
              {scan.hersteller && <li><span className="text-muted-foreground">Hersteller:</span> {scan.hersteller} {scan.modell ?? ''}</li>}
              {scan.leistung_kw != null && <li><span className="text-muted-foreground">Leistung:</span> {scan.leistung_kw} kW</li>}
              {scan.brennstoff && <li><span className="text-muted-foreground">Brennstoff:</span> {scan.brennstoff}</li>}
              <li>
                <span className="text-muted-foreground">Baujahr:</span>{' '}
                {scan.baujahr_klartext != null
                  ? `${scan.baujahr_klartext} (laut Schild)`
                  : 'nicht aufgedruckt — beim Eigentümer/Schornsteinfeger erfragen'}
              </li>
              {scan.seriennummer && <li className="text-xs text-muted-foreground break-all">Serien-Nr.: {scan.seriennummer}</li>}
            </ul>
          ) : (
            <p className="text-xs text-amber-600">Typenschild nicht sicher lesbar — bitte näher heran & scharf fotografieren oder die Werte manuell eintragen.</p>
          )}

          {scan.hinweis && <p className="text-xs text-muted-foreground">{scan.hinweis}</p>}

          {scan.brennstoff_kategorie && onHeizungsart && (
            <Button
              type="button"
              size="sm"
              className="w-full"
              disabled={disabled}
              onClick={() => onHeizungsart(scan.brennstoff_kategorie!)}
            >
              <CheckCircle2 className="w-4 h-4" /> Heizungsart „{KAT_LABEL[scan.brennstoff_kategorie]}" übernehmen
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
