

# Heizungsraum-Verlegung: Anschlüsse erfassen

## Ziel
Neue Frage im Heizungsraum-Step: "Soll der Heizungsraum verlegt werden?" Bei Ja → für jede Leitung (Vorlauf, Rücklauf, Warmwasser, Kaltwasser, Zirkulationsleitung) erfassen: vorhanden ja/nein + Distanz zur Wärmepumpe in Metern.

## Änderungen

| Datei | Änderung |
|-------|----------|
| DB-Migration | 11 neue nullable Spalten auf `thermocheck_vot_formulare` |
| `aufmass-schema.ts` | 11 neue Felder in Draft + Submit Schema, conditional validation |
| `HeizungsraumSection.tsx` | UI: Toggle "Heizungsraum verlegen?" + 5 Anschluss-Rows |

### DB-Spalten (alle nullable)

```
heizungsraum_verlegen          BOOLEAN
anschluss_vorlauf_vorhanden    BOOLEAN
anschluss_vorlauf_distanz      NUMERIC
anschluss_ruecklauf_vorhanden  BOOLEAN
anschluss_ruecklauf_distanz    NUMERIC
anschluss_warmwasser_vorhanden BOOLEAN
anschluss_warmwasser_distanz   NUMERIC
anschluss_kaltwasser_vorhanden BOOLEAN
anschluss_kaltwasser_distanz   NUMERIC
anschluss_zirkulation_vorhanden BOOLEAN
anschluss_zirkulation_distanz  NUMERIC
```

### Zod Schema

- **Draft**: Alle 11 Felder optional
- **Submit**: `heizungsraum_verlegen` required (boolean). Wenn `true` → alle 5 `_vorhanden`-Felder required, alle 5 `_distanz`-Felder required (min 0) via `superRefine`

### UI (HeizungsraumSection)

Nach dem bestehenden "Mehr Bilder?" Block:

```text
┌─────────────────────────────────────┐
│ Heizungsraum verlegen? *            │
│ [Ja] [Nein]                         │
│                                     │
│ ── Nur wenn Ja: ──                  │
│                                     │
│ Vorlauf     [Ja][Nein]  [__] m      │
│ Rücklauf    [Ja][Nein]  [__] m      │
│ Warmwasser  [Ja][Nein]  [__] m      │
│ Kaltwasser  [Ja][Nein]  [__] m      │
│ Zirkulation [Ja][Nein]  [__] m      │
└─────────────────────────────────────┘
```

Jede Zeile: Label links, Ja/Nein-Toggle Mitte, Distanz-Input rechts (number, Suffix "m"). Die Distanz wird immer abgefragt, egal ob vorhanden oder nicht — sie gibt die Entfernung zur Wärmepumpe an.

