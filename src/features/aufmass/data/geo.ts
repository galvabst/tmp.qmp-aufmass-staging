/**
 * Geo-Abgleich-Policy: ist der erfasste Geräte-Standort nah genug an der
 * Kundenadresse? Falls nicht → Abzug (kein Block, damit die Daten trotzdem
 * ankommen). Schwelle + Abzug bewusst zentral, damit leicht anpassbar.
 */

/** Radius, innerhalb dessen der Standort als „vor Ort" gilt.
 *  400 m deckt GPS-Ungenauigkeit (innen!) + Geocoding-Toleranz ab. */
export const GEO_OK_RADIUS_M = 400;

/** Abzug in €, wenn der Standort von der Kundenadresse abweicht. */
export const GEO_ABZUG_EUR = 20;

export type GeoStatus = 'ok' | 'abweichung';

export interface GeoBewertung {
  status: GeoStatus;
  /** Abzug in € (0 bei ok). */
  abzug: number;
}

export function bewerteGeo(distanzM: number): GeoBewertung {
  // Ungültige Distanz (negativ, NaN, Infinity) ist ein Mess-/Rechenfehler — sie
  // darf NICHT das „vor Ort"-Gratis-OK (`-50 <= 400`) erhalten. Sie wird als
  // `abweichung` ohne Abzug behandelt: kein falsches OK, aber auch keine Strafe
  // für einen System-Glitch (fail-open-Linie der Geo-Policy).
  if (!Number.isFinite(distanzM) || distanzM < 0) return { status: 'abweichung', abzug: 0 };
  if (distanzM <= GEO_OK_RADIUS_M) return { status: 'ok', abzug: 0 };
  return { status: 'abweichung', abzug: GEO_ABZUG_EUR };
}

/** Distanz menschenlesbar: „120 m" oder „3,2 km". */
export function formatDistanz(distanzM: number): string {
  if (!Number.isFinite(distanzM)) return 'unbekannt';
  if (distanzM < 1000) return `${Math.round(distanzM)} m`;
  return `${(distanzM / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} km`;
}

/**
 * Soll der Standort-Check das Einreichen pausieren? Reine, testbare Entscheidung
 * für den Submit-Pfad.
 *
 * Bewusst fail-open: `nicht_pruefbar` (Geocoding-/Edge-Function-Ausfall — KEINE
 * Verweigerung durch den Nutzer) darf NIE blocken, sonst hängt eine ehrliche
 * Abgabe an einem System-Ausfall. `abweichung` blockt ebenfalls nicht (das ist
 * der dokumentierte Abzug-statt-Block-Trade-off).
 *
 * Geblockt wird nur, solange der Check noch NICHT abgeschlossen ist
 * (`idle`/`locating`/`checking`) — dann ist „vor Ort" schlicht noch unbestätigt
 * und der Techniker soll kurz warten, statt versehentlich ohne Nachweis
 * abzusenden. Ob `kein_gps` (aktive Verweigerung) hart blocken soll, ist eine
 * Produkt-/Policy-Entscheidung und hier bewusst NICHT als Hard-Block verdrahtet
 * (würde Auszahlungs-Anreize verschieben und legitime Innen-GPS-Ausfälle
 * bestrafen).
 */
export type GeoPhaseLike =
  | 'idle' | 'locating' | 'checking' | 'ok' | 'abweichung' | 'kein_gps' | 'nicht_pruefbar';

export function geoCheckLaeuftNoch(phase: GeoPhaseLike): boolean {
  return phase === 'idle' || phase === 'locating' || phase === 'checking';
}
