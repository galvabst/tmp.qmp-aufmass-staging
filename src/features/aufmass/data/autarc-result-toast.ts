// Toast-Darstellung des T4-autarc-Gate-Urteils — herausgezogen aus AufmassFormPage,
// damit der Submit-Hook (useAufmassSubmit) das Urteil identisch melden kann.
import { toast } from 'sonner';
import type { GateResult } from './autarc-gate';
import type { AutarcDiffEntry } from './autarc-diff';

/** Klartext-Liste der autarc-Abweichungen für die Toast-Beschreibung (max. 8). */
export function autarcAbweichungenText(abw: AutarcDiffEntry[]): string {
  const zeilen = abw.slice(0, 8).map((a) =>
    a.art === 'fehlt'
      ? `• ${a.feld}: in autarc nicht angekommen`
      : `• ${a.feld}: gesendet ${JSON.stringify(a.gesendet)} → autarc ${JSON.stringify(a.autarc)}`,
  );
  if (abw.length > 8) zeilen.push(`• … und ${abw.length - 8} weitere`);
  return zeilen.join('\n');
}

/** Zeigt das T4-autarc-Gate-Urteil als Toast: Erfolg / handlungsrelevant / informativ. */
export function showAutarcResult(r: GateResult): void {
  if (r.status === 'freigegeben') {
    toast.success(r.meldung, { duration: 6000 });
    return;
  }
  if (r.status === 'abweichung') {
    // Handlungsrelevant: lange sichtbar + konkrete Feld-Abweichungen als Beschreibung.
    toast.error(r.meldung, {
      duration: 16000,
      description: r.abweichungen?.length ? autarcAbweichungenText(r.abweichungen) : undefined,
    });
    return;
  }
  if (r.status === 'kein_projekt' || r.status === 'fehler') {
    toast.error(r.meldung, { duration: 14000 });
    return;
  }
  // ok | eingereicht | unvollstaendig | ausstehend → informativ (nichts ging verloren).
  toast(r.meldung, { duration: 9000 });
}
