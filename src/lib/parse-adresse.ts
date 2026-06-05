// Adresse: Straße + Hausnummer werden in der DB als ein Feld (anschrift_strasse)
// gespeichert. Diese Helfer trennen/verbinden robust für gängige deutsche
// Hausnummern-Formate (12, 12a, 12-14, 12/3) — auch bei Straßennamen mit Zahl.

export interface StrasseHausnummer {
  strasse: string;
  hausnummer: string;
}

// Hausnummer = letzter Block am Ende, der mit einer Ziffer beginnt und
// Zusätze wie "a", Bereiche "-14" oder "/3" enthalten darf.
const HAUSNUMMER_AM_ENDE = /^(.*\S)\s+(\d+[a-zA-Z]?(?:[-/]\d+[a-zA-Z]?)*)$/;

export function parseStrasseHausnummer(input: string | null | undefined): StrasseHausnummer {
  const trimmed = (input ?? '').trim();
  if (!trimmed) return { strasse: '', hausnummer: '' };

  const match = trimmed.match(HAUSNUMMER_AM_ENDE);
  if (match) {
    return { strasse: match[1].trim(), hausnummer: match[2] };
  }
  // Keine erkennbare Hausnummer → alles ist Straße
  return { strasse: trimmed, hausnummer: '' };
}

export function joinStrasseHausnummer(strasse: string, hausnummer: string): string {
  return [strasse?.trim(), hausnummer?.trim()].filter(Boolean).join(' ');
}
