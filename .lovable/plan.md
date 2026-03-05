

# Akademie Admin: Abschlusstest-Fragenpool und Praxistest-Überblick ergänzen

## Problem

Die Akademie Admin-Ansicht zeigt zwei wichtige Bereiche nicht:

1. **Abschlusstest-Fragenpool**: Die Quiz-Fragen sind zwar pro Modul sichtbar (wenn man das Modul aufklappt), aber es gibt keine Gesamtübersicht aller aktiven Fragen, die im Abschlusstest vorkommen. Der Admin muss jedes einzelne Modul aufklappen um den vollen Fragenpool zu sehen.

2. **Praxistest-Anforderungen**: Nach dem Abschlusstest müssen Contractors einen 3D-Scan-Link und ein Drohnenflug-Video einreichen. Diese Phase ist im Admin-Bereich der Akademie nicht sichtbar — man sieht nicht, was die Contractors dort genau tun müssen.

## Lösung

**Datei:** `src/features/admin/ui/akademie/AkademieAdminView.tsx`

Unterhalb der Modul-Accordion zwei neue Sektionen ergänzen:

### 1. Abschlusstest-Zusammenfassung
Ein eigener Bereich "Abschlusstest (Fragenpool)" der alle aktiven Quiz-Fragen aller Module aggregiert anzeigt — mit Modul-Zuordnung, Frage, Antworten (grün/grau). Das sind die gleichen `QuizFrageListItem`-Komponenten, nur gruppiert nach Modul mit Modul-Titel als Überschrift.

```
┌─ 📝 Abschlusstest — Fragenpool (30 aktive Fragen) ────────┐
│                                                              │
│ Modul 1: Grundlagen (3 Fragen)                              │
│  ┌ Frage 1 ... ┐                                            │
│  └ ✓/✗ Antworten ┘                                          │
│                                                              │
│ Modul 6: Datenerhebung (8 Fragen)                           │
│  ┌ Frage 1 ... ┐                                            │
│  └ ✓/✗ Antworten ┘                                          │
│  ...                                                         │
└──────────────────────────────────────────────────────────────┘
```

### 2. Praxistest-Info
Ein Info-Block der zeigt, was nach dem Abschlusstest kommt:
- 3D-Scan-Link (URL-Eingabe)
- Drohnenflug-Video (Upload)
- Admin-Freigabe erforderlich (Verweis auf Quality Gate > Praxistests)

Rein informativer Überblick, keine Bearbeitungsfunktion — die Freigabe passiert im Quality Gate.

### Betroffene Datei
- `src/features/admin/ui/akademie/AkademieAdminView.tsx` — zwei neue Sektionen unterhalb des Modul-Accordions

