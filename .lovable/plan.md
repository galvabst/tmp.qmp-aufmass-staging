

# Einheitliche Accordion-Lektionen + Abschlusspruefung beibehalten

## Was der User will

Aktuell gibt es zwei verschiedene Darstellungen innerhalb eines Moduls:
- **Einzel-Lektionen** (6.1, 6.2, 6.4, 6.5): Flache Zeilen mit Play-Button, direkt sichtbar
- **Gruppen-Lektionen** (6.3): Aufklappbares Accordion mit Kindern drin

Der User will: **ALLE Lektionen einheitlich als aufklappbare Zeilen**, genau wie 6.3 es schon macht. Auch wenn eine Lektion keine Kinder hat, wird sie trotzdem als Accordion dargestellt -- beim Aufklappen sieht man dann die eine Lerneinheit darin.

Zusaetzlich: Die **Abschlusspruefung** (globaler Test + "bestanden"-Anzeige) wurde im letzten Refactor beibehalten (Zeilen 324-342), ist aber im Screenshot nicht sichtbar -- moeglicherweise scrollt der User nicht weit genug. Sie bleibt auf jeden Fall erhalten.

## Aenderungen

**Nur eine Datei:** `src/components/onboarding/steps/AcademyStep.tsx`

### A) Einzel-Lektionen werden zu Mini-Accordions

Statt `LektionRow` direkt zu rendern, wird JEDE Lektion (ob Gruppe oder Einzel) als aufklappbare Zeile dargestellt:

```text
Vorher (Modul 6 aufgeklappt):
  [Play] 6.1 Prinzipien guter Datenerhebung  8 Min.  [>]    ← flache Zeile
  [Play] 6.2 Mess- & Aufnahme-Grundregeln   10 Min.  [>]    ← flache Zeile
  [v]   6.3 Dokumentationsstandard            1/2  [v]       ← Accordion
  [Play] 6.4 Belegstandard                    8 Min.  [>]    ← flache Zeile

Nachher (Modul 6 aufgeklappt):
  [v]   6.1 Prinzipien guter Datenerhebung          0/1 [v]  ← Accordion
  [v]   6.2 Mess- & Aufnahme-Grundregeln             0/1 [v]  ← Accordion
  [v]   6.3 Dokumentationsstandard                    0/2 [v]  ← Accordion (wie bisher)
  [v]   6.4 Belegstandard: Foto-Qualitaet            0/1 [v]  ← Accordion
  [v]   6.5 Umgang mit fehlenden Informationen        0/1 [v]  ← Accordion
```

Beim Aufklappen einer Einzel-Lektion (z.B. 6.1) erscheint darin die eine Lerneinheit als klickbare Zeile (mit Dauer, Play-Icon, Navigations-Link).

### B) Vereinheitlichte Komponente

Die bisherige Trennung `LektionRow` vs. `GruppenLektion` wird zusammengefuehrt zu einer einzigen `LektionAccordion`-Komponente:

- Zeigt immer: Code (Punkt-Notation), Titel, Fortschritts-Badge (x/y), Aufklapp-Chevron
- Aufgeklappt: Zeigt Kind-Lektionen (bei Gruppen) ODER sich selbst als einzelne klickbare Lerneinheit (bei Einzel-Lektionen)
- Einheitliche Farben: Orange Icon-Kreis (offen), gruener Haken (abgeschlossen)

### C) Farbvereinheitlichung

- Alle Lektions-Accordions: Gleicher Rahmen (`border`), gleicher Hintergrund (weiss/card)
- Status-Icon links: Einheitlich orange Kreis (offen) oder gruen (abgeschlossen)
- Badge rechts: Einheitlich `0/1` oder `0/2` Format

### D) Abschlusspruefung bleibt

Die globale Abschlusspruefung (Zeilen 324-342) bleibt exakt wie sie ist:
- Erscheint wenn `allModulesComplete && !testBestanden`
- "Test starten"-Button
- Gruene "bestanden"-Anzeige nach Bestehen

Kein Change an dieser Logik.

## Technische Details

| Was | Wie |
|-----|-----|
| `LektionRow` | Wird zur internen Darstellung innerhalb eines aufgeklappten Accordions (nur Klick-Zeile mit Play + Dauer) |
| `GruppenLektion` | Wird zur generischen `LektionAccordion`-Komponente die sowohl Gruppen als auch Einzel-Lektionen handelt |
| Einzel-Lektion ohne Kinder | Accordion mit einer einzelnen `LektionRow` darin (die Lektion selbst) |
| Gruppen-Lektion mit Kindern | Accordion mit mehreren `LektionRow` darin (wie bisher bei 6.3) |
| Rendering im Hauptmodul | Alle `unterpunkte` werden einheitlich als `LektionAccordion` gerendert -- kein `if/else` mehr |
| Abschlusspruefung | Keine Aenderung, bleibt nach dem Modul-Accordion |

## Betroffene Dateien

Nur **eine Datei**: `src/components/onboarding/steps/AcademyStep.tsx`

Keine Logik-, Hook- oder DB-Aenderungen noetig.

