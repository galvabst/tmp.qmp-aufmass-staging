import { useState, useEffect, useCallback, useId, useSyncExternalStore, type ChangeEvent } from 'react';
import { Camera, X, Loader2, Check, AlertTriangle } from 'lucide-react';
import { BILD_KATEGORIEN, VotBildKategorie } from '../../data/bild-kategorien';
import { VotBild, useUploadVotBild, useDeleteVotBild, getSignedImageUrl } from '../../hooks/useVotBilder';
import { verarbeiteFotoFuerUpload } from '../../data/foto-verarbeitung';
import { pruefeFotoInhalt } from '../../data/ki-foto-check-client';
import { ladeBildBlob } from '../../data/foto-inhalt-pruefung';
import {
  setFotoStatus,
  getFotoStatus,
  subscribeFotoPruefung,
  getFotoPruefVersion,
  type FotoStatusEintrag,
} from '../../state/foto-pruefung-store';
import { toast } from 'sonner';

interface PhotoUploadFieldProps {
  kategorie: VotBildKategorie;
  existingBilder: VotBild[];
  votFormularId: string | undefined;
  leadName: string;
  leadId: string;
  auftragId: string;
  disabled?: boolean;
}

export function PhotoUploadField({
  kategorie,
  existingBilder,
  votFormularId,
  leadName,
  leadId,
  auftragId,
  disabled = false,
}: PhotoUploadFieldProps) {
  const config = BILD_KATEGORIEN[kategorie];
  const uploadMutation = useUploadVotBild();
  const deleteMutation = useDeleteVotBild();
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [pruefen, setPruefen] = useState<Record<string, boolean>>({});

  // Re-render, sobald sich der geteilte KI-Prüfstatus ändert (Check beim Laden,
  // Nachprüfung am Submit, Cross-Step-Updates).
  useSyncExternalStore(subscribeFotoPruefung, getFotoPruefVersion);

  // Unique IDs for label-input association (iOS Safari safe)
  const reactId = useId();
  const cameraInputId = `camera-${reactId}`;
  const fileInputId = `file-${reactId}`; // Dev/Test: Datei-Upload OHNE capture (Desktop)

  /** Schreibt das KI-Ergebnis in den geteilten Store (ok/passt_nicht/ungeprueft). */
  const speichereStatus = useCallback(
    (bildId: string, erg: Awaited<ReturnType<typeof pruefeFotoInhalt>>, blobOk: boolean) => {
      if (erg?.geprueft) {
        setFotoStatus(bildId, {
          status: erg.passt ? 'ok' : 'passt_nicht',
          kategorieLabel: config.label,
          begruendung: erg.begruendung,
          abzugEuro: config.abzugEuro,
        });
      } else {
        // KI nicht erreichbar / Bild nicht ladbar → sichtbar „ungeprüft".
        // Fail-closed: blockiert das Einreichen (Bewertung im Submit-Gate).
        setFotoStatus(bildId, {
          status: 'ungeprueft',
          kategorieLabel: config.label,
          begruendung: blobOk ? 'KI-Prüfung nicht verfügbar' : 'Bild konnte nicht geladen werden',
        });
      }
    },
    [config.label, config.abzugEuro],
  );

  // Load signed URLs for thumbnails — merge incrementally, skip already-loaded
  useEffect(() => {
    let stale = false;
    const loadUrls = async () => {
      const missing = existingBilder.filter(b => !thumbnails[b.id]);
      if (missing.length === 0) return;
      const newUrls: Record<string, string> = {};
      for (const bild of missing) {
        if (stale) return;
        const url = await getSignedImageUrl(bild.storage_path);
        if (url) newUrls[bild.id] = url;
      }
      if (!stale) setThumbnails(prev => ({ ...prev, ...newUrls }));
    };
    if (existingBilder.length > 0) loadUrls();
    return () => { stale = true; };
  // Abhängigkeiten bewusst ausgelassen: getSignedImageUrl ist ein stabiler Modul-Export;
  // thumbnails wird nur gelesen (über prev), als Dep würde es bei jedem Lade-Ergebnis
  // re-triggern. Nur existingBilder soll den Lauf auslösen.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingBilder]);

  // KI-Inhaltsprüfung für bereits vorhandene Fotos (aus früherer Sitzung), die
  // noch KEINEN Status haben — sonst blieben sie bis zum Submit „ungeprüft".
  // Nur einmal je Foto: ein bestehender Status (auch 'ungeprueft') wird nicht
  // bei jedem Mount neu geprüft (Retry passiert gezielt am Submit).
  useEffect(() => {
    let stale = false;
    const run = async () => {
      for (const bild of existingBilder) {
        if (stale) return;
        if (getFotoStatus(bild.id)) continue; // schon ein Status vorhanden
        setPruefen((p) => ({ ...p, [bild.id]: true }));
        const blob = await ladeBildBlob(bild);
        const erg = blob ? await pruefeFotoInhalt(blob, kategorie) : null;
        if (stale) return;
        speichereStatus(bild.id, erg, !!blob);
        setPruefen((p) => ({ ...p, [bild.id]: false }));
      }
    };
    if (existingBilder.length > 0) run();
    return () => { stale = true; };
  // Abhängigkeiten bewusst ausgelassen: pruefeFotoInhalt/ladeBildBlob/getFotoStatus sind
  // stabile Modul-Exports, speichereStatus ist ein useCallback mit stabilen Deps
  // (config.label/abzugEuro). Keine reaktiven Werte → kein Stale-Closure-Risiko; nur
  // existingBilder/kategorie sollen den Lauf auslösen.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingBilder, kategorie]);

  const handleFileUpload = useCallback(async (files: File[]) => {
    if (files.length === 0 || !votFormularId) return;

    let uploadedCount = 0;
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} ist kein Bild`);
        continue;
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (['heic', 'heif'].includes(ext) || ['image/heic', 'image/heif'].includes(file.type)) {
        toast.error(`${file.name}: HEIC-Format wird nicht unterstützt. Bitte als JPG oder PNG hochladen.`);
        continue;
      }

      try {
        const verarbeitet = await verarbeiteFotoFuerUpload(file);
        const jpg = new File([verarbeitet.blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
        const nextIndex = existingBilder.length + uploadedCount + 1;

        const result = await uploadMutation.mutateAsync({
          file: jpg,
          votFormularId,
          kategorie,
          leadName,
          leadId,
          auftragId,
          reihenfolge: nextIndex,
          sha256: verarbeitet.sha256,
          phash: verarbeitet.phash,
          fileSizeBytes: verarbeitet.groesseBytes,
        });
        uploadedCount++;

        if (result.duplikat) {
          const d = result.duplikat;
          if (d.abzug) {
            toast.error(`Duplikat erkannt – ${d.abzug} € Abzug`, {
              description: `Dieses Hausschuh-Foto wurde schon bei „${d.kunde}" verwendet. Das verstößt gegen die Vereinbarung – ${d.abzug} € werden von deiner Rechnung abgezogen. Bitte ein echtes, neues Foto machen.`,
              duration: 10000,
            });
          } else {
            toast.warning('Bild schon einmal verwendet', {
              description: `Dieses Foto gibt es bereits bei „${d.kunde}". Bitte prüfen.`,
              duration: 8000,
            });
          }
        }

        // KI-Inhaltsprüfung: zeigt das Bild das Geforderte? Ergebnis → Store.
        // Fail-closed: bei Ausfall „ungeprüft" (blockiert das Einreichen).
        const bildId = result.bild?.id;
        if (bildId) {
          setPruefen((prev) => ({ ...prev, [bildId]: true }));
          pruefeFotoInhalt(jpg, kategorie)
            .then((erg) => {
              speichereStatus(bildId, erg, true);
              if (erg?.geprueft && !erg.passt) {
                toast.error(
                  config.abzugEuro
                    ? `−${config.abzugEuro} € Abzug – Verstoß gegen die Vereinbarung`
                    : `Foto passt nicht zu „${config.label}"`,
                  {
                    description: config.abzugEuro
                      ? `Dieses Foto zeigt nicht die geforderten „${config.label}". Pro Verstoß werden ${config.abzugEuro} € von deiner Rechnung abgezogen. Bitte ein echtes Foto direkt beim Kunden aufnehmen.`
                      : (erg.begruendung || 'Die KI erkennt nicht das Geforderte. Bitte ein echtes Foto aufnehmen.'),
                    duration: 10000,
                  },
                );
              }
            })
            .finally(() => setPruefen((prev) => ({ ...prev, [bildId]: false })));
        }
      } catch (err) {
        console.error(`Upload fehlgeschlagen für ${file.name}:`, err);
        // toast already shown by mutation onError – continue with remaining files
      }
    }
  }, [votFormularId, existingBilder.length, kategorie, leadName, leadId, auftragId, uploadMutation, config.label, config.abzugEuro, speichereStatus]);

  const handleDelete = useCallback(async (bild: VotBild) => {
    await deleteMutation.mutateAsync({ bild });
    // Gelöschtes Foto blockiert nicht mehr.
    setFotoStatus(bild.id, null);
  }, [deleteMutation]);

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    // Copy FileList to stable array BEFORE resetting the input
    const fileArray = Array.from(event.target.files ?? []);
    event.target.value = ''; // Reset so same file can be re-selected
    void handleFileUpload(fileArray);
  }, [handleFileUpload]);

  const isUploading = uploadMutation.isPending;
  const missingCount = Math.max(0, config.minAnzahl - existingBilder.length);
  const inputsDisabled = isUploading || !votFormularId;

  // Fotos, die die KI als „passt nicht" eingestuft hat → lautes Warn-Banner
  const fehlerhafte = existingBilder
    .map((b) => getFotoStatus(b.id))
    .filter((e): e is FotoStatusEintrag => !!e && e.status === 'passt_nicht');

  // „ungeprüft" = KI-Prüfung lief, war aber nicht erreichbar. Fail-closed sperrt
  // das Einreichen → der Techniker MUSS sehen WARUM + was zu tun ist, sonst sieht
  // er nur das graue Symbol und meldet sich beim Innendienst.
  const ungepruefteAnzahl = existingBilder
    .map((b) => getFotoStatus(b.id))
    .filter((e): e is FotoStatusEintrag => !!e && e.status === 'ungeprueft').length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-foreground text-sm">{config.label} *</p>
          {config.hinweis && <p className="text-xs text-muted-foreground">{config.hinweis}</p>}
        </div>
        {missingCount > 0 && (
          <span className="text-xs text-destructive font-medium">
            Min. {config.minAnzahl} Fotos
          </span>
        )}
      </div>

      {/* Thumbnails mit KI-Prüfstatus (Spinner → grüner/roter/grauer Ring) */}
      {existingBilder.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {existingBilder.map((bild) => {
            const eintrag = getFotoStatus(bild.id);
            const laeuft = !!pruefen[bild.id];
            const status = laeuft ? 'laeuft' : eintrag?.status; // undefined = noch nie geprüft
            const ring =
              status === 'laeuft'
                ? 'border-amber-400'
                : status === 'ok'
                  ? 'border-emerald-500'
                  : status === 'passt_nicht'
                    ? 'border-destructive'
                    : status === 'ungeprueft'
                      ? 'border-muted-foreground' // KI-Ausfall: geprüft wurde versucht, lief aber nicht
                      : 'border-border'; // wirklich noch nie geprüft
            return (
              <div key={bild.id} className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 ${ring}`}>
                {thumbnails[bild.id] ? (
                  <img src={thumbnails[bild.id]} alt={bild.dateiname} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted animate-pulse" />
                )}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleDelete(bild)}
                    className="absolute top-0.5 right-0.5 p-0.5 bg-destructive text-destructive-foreground rounded-full"
                    disabled={deleteMutation.isPending}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                {laeuft && (
                  <div className="absolute inset-0 bg-black/45 grid place-items-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
                {(status === 'ok' || status === 'passt_nicht') && (
                  <div
                    title={eintrag?.begruendung}
                    className={`absolute bottom-0.5 left-0.5 rounded-full p-1 text-white ${status === 'ok' ? 'bg-emerald-500' : 'bg-destructive'}`}
                  >
                    {status === 'ok' ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  </div>
                )}
                {status === 'ungeprueft' && (
                  <div
                    title="KI-Prüfung nicht verfügbar – Einreichen ist gesperrt, bis das Foto geprüft ist"
                    className="absolute bottom-0.5 left-0.5 rounded-full bg-muted-foreground p-1 text-background"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lautes Warn-Banner: Foto zeigt nicht das Geforderte (+ ggf. Vertragsstrafe) */}
      {fehlerhafte.map((e, i) => (
        <div
          key={i}
          className="flex items-start gap-2 rounded-lg border-2 border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">
              {config.abzugEuro
                ? `−${config.abzugEuro} € Abzug: Dieses Foto verstößt gegen die Vereinbarung.`
                : `KI: Das Foto passt nicht zu „${config.label}".`}
            </p>
            <p className="font-normal text-destructive/90">
              {e.begruendung || 'Das Bild zeigt vermutlich nicht das Geforderte.'}{' '}
              {config.abzugEuro
                ? `Pro Verstoß werden ${config.abzugEuro} € von deiner Rechnung abgezogen. `
                : ''}
              Bitte das Foto löschen und ein korrektes direkt vor Ort aufnehmen.
            </p>
          </div>
        </div>
      ))}

      {/* „Ungeprüft": KI gerade nicht erreichbar → erklären + beruhigen + Handlung
          nennen, damit niemand nur das graue Symbol sieht und den Innendienst anruft. */}
      {ungepruefteAnzahl > 0 && (
        <div className="flex items-start gap-2 rounded-lg border-2 border-amber-400/50 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">
              {ungepruefteAnzahl === 1
                ? 'Dieses Foto wurde noch nicht automatisch geprüft.'
                : `${ungepruefteAnzahl} Fotos wurden noch nicht automatisch geprüft.`}
            </p>
            <p className="font-normal text-amber-800/90">
              Die automatische Foto-Prüfung ist gerade nicht erreichbar – das liegt nicht an dir und ist kein Fehler im
              Foto selbst. Beim Absenden wird automatisch erneut geprüft; das Einreichen ist erst möglich, wenn jedes
              Pflichtfoto geprüft wurde. <strong>Was tun:</strong> kurz die Internetverbindung (WLAN/Mobilfunk) prüfen
              und erneut versuchen. Bleibt das graue Zeichen bei <em>allen</em> Fotos bestehen, ist die Prüfung kurz
              serverseitig aus – dann beim Innendienst melden.
            </p>
          </div>
        </div>
      )}

      {/* Nur Kamera — kein Galerie-Upload (capture erzwingt auf dem Handy die Kamera) */}
      {!disabled && (
        <div className="space-y-1.5">
          <input
            id={cameraInputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={handleInputChange}
            disabled={inputsDisabled}
            className="sr-only"
            tabIndex={-1}
          />
          <label
            htmlFor={inputsDisabled ? undefined : cameraInputId}
            className={`inline-flex items-center gap-1.5 rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors ${
              inputsDisabled
                ? 'opacity-50 pointer-events-none'
                : 'cursor-pointer hover:bg-accent hover:text-accent-foreground active:bg-accent/80'
            }`}
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            Foto aufnehmen
          </label>
          <p className="text-xs text-muted-foreground">Nur Kamera – kein Upload aus der Galerie.</p>
          {/* Nur im Dev/localhost: Datei-Upload ohne `capture`, damit am Desktop mit
              Beispielbildern getestet werden kann. In Prod (gebaute App) NIE sichtbar. */}
          {import.meta.env.DEV && (
            <div className="pt-1">
              <input
                id={fileInputId}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleInputChange}
                disabled={inputsDisabled}
                className="sr-only"
                tabIndex={-1}
              />
              <label
                htmlFor={inputsDisabled ? undefined : fileInputId}
                className={`inline-flex items-center gap-1.5 rounded-lg border border-dashed border-input bg-muted/40 px-3 py-1.5 text-xs font-medium ${
                  inputsDisabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-accent'
                }`}
              >
                📁 Aus Datei wählen (nur Dev/Test)
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
