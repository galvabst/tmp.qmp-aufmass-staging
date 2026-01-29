
# Plan: Akademie-Struktur mit 4 Hauptmodulen

## Analyse (NEUTRAL)

### Aktuelle Struktur
- Akademie ist 1 Schritt im 7-stufigen Onboarding
- Flache Liste von Modulen ohne Hierarchie
- `AkademieModul` Interface: `{ id, titel, beschreibung, videoUrl, dauerMinuten, reihenfolge, abgeschlossen }`
- Videos werden einzeln auf `/akademie/modul/:modulId` abgespielt

### Anforderung
4 Hauptmodule mit Unterpunkten:

| Hauptmodul | Unterpunkte |
|------------|-------------|
| **1. Einfuehrung und Grundlagen** | Einfuehrung und Begruessung, Kleidung und Verhalten, Sicherheitsdatenblatt, Aussenbereich |
| **2. Ausruestung und Vorbereitung** | Ausruestungsuebersicht |
| **3. Durchfuehrung Thermocheck** | Verschiedene Heizkreise, Autark, Fussbodenheizung, Heizkoerper, Raumweise Gebaeude, Datenerfassung, Thermografiebilder richtig erstellen, Besonderheiten bei Dachausbau und Keller |
| **4. Nachbearbeitung und Dokumentation** | Bilddokumentation, Zahlmodell, Rechnungsstellung |

---

## Kritische Bewertung (KRITIKER)

### Option A: 4 separate Onboarding-Schritte

| Pro | Contra |
|-----|--------|
| Klare visuelle Trennung | Bricht 7-Schritte-Konzept (wird zu 10 Schritte) |
| Fokus pro Themenblock | Erhoeht Onboarding-Komplexitaet |
| Fortschritt granularer | State-Management wird komplizierter |
| | Widerspricht "Akademie" als einzelner Schritt |

### Option B: 1 Schritt mit Accordion/Collapsible

| Pro | Contra |
|-----|--------|
| Behaelt 7-Schritte-Struktur | Koennte visuell ueberladen wirken |
| Klare Hierarchie (Modul > Unterpunkte) | Mehr UI-Komplexitaet in AcademyStep |
| Enterprise-Standard (Netflix-Style) | |
| Unterpunkte sequenziell freischaltbar | |
| Skalierbar fuer weitere Inhalte | |

### Option C: Hybrid (Sub-Steps innerhalb Akademie)

| Pro | Contra |
|-----|--------|
| Optische Aufteilung ohne Onboarding-Aenderung | Erfordert Sub-Navigation |
| Progressive Disclosure | Komplexer State |

---

## Strategische Loesung (STRATEGE)

**Empfehlung: Option B - Accordion-Struktur innerhalb eines Schrittes**

### Begruendung
1. **Enterprise-Standard**: Salesforce, Udemy, Coursera nutzen alle hierarchische Kurs-Strukturen
2. **Bewaehrtes Pattern**: 7-Schritte-Konzept bleibt intakt
3. **Progressive Disclosure**: User sieht Fortschritt pro Hauptmodul
4. **Zukunftssicher**: Weitere Unterpunkte einfach hinzufuegbar
5. **Fokussierte UX**: Ein Hauptmodul auf einmal, Unterpunkte sequenziell

---

## Datenmodell-Erweiterung

### Neuer Typ: AkademieHauptmodul

```typescript
// src/types/onboarding.ts - Erweiterung

export interface AkademieUnterpunkt {
  id: string;
  titel: string;
  beschreibung: string;
  videoUrl: string;
  dauerMinuten: number;
  reihenfolge: number;
  abgeschlossen: boolean;
  abgeschlossenAt?: string;
}

export interface AkademieHauptmodul {
  id: string;
  titel: string;
  beschreibung: string;
  reihenfolge: number;
  unterpunkte: AkademieUnterpunkt[];
}

// OnboardingState anpassen
export interface OnboardingState {
  // ... bestehende Felder
  
  // Schritt 5: Akademie (AKTUALISIERT)
  akademieHauptmodule: AkademieHauptmodul[];  // NEU: Hierarchische Struktur
  akademieTestBestanden: boolean;
  zertifikatUrl?: string;
}
```

---

## Mock-Daten (onboarding-config.ts)

```typescript
export const MOCK_AKADEMIE_HAUPTMODULE: AkademieHauptmodul[] = [
  {
    id: 'hauptmodul-1',
    titel: 'Einfuehrung und Grundlagen',
    beschreibung: 'Grundlagen fuer erfolgreiche Thermochecks',
    reihenfolge: 1,
    unterpunkte: [
      {
        id: 'up-1-1',
        titel: 'Einfuehrung und Begruessung',
        beschreibung: 'Willkommen bei Thermocheck',
        videoUrl: 'https://...',
        dauerMinuten: 5,
        reihenfolge: 1,
        abgeschlossen: false,
      },
      {
        id: 'up-1-2',
        titel: 'Kleidung und Verhalten beim Kunden',
        beschreibung: 'Professionelles Auftreten',
        videoUrl: 'https://...',
        dauerMinuten: 8,
        reihenfolge: 2,
        abgeschlossen: false,
      },
      {
        id: 'up-1-3',
        titel: 'Sicherheitsdatenblatt',
        beschreibung: 'Wichtige Sicherheitshinweise',
        videoUrl: 'https://...',
        dauerMinuten: 10,
        reihenfolge: 3,
        abgeschlossen: false,
      },
      {
        id: 'up-1-4',
        titel: 'Aussenbereich',
        beschreibung: 'Arbeiten im Aussenbereich',
        videoUrl: 'https://...',
        dauerMinuten: 7,
        reihenfolge: 4,
        abgeschlossen: false,
      },
    ],
  },
  {
    id: 'hauptmodul-2',
    titel: 'Ausruestung und Vorbereitung',
    beschreibung: 'Deine Werkzeuge im Ueberblick',
    reihenfolge: 2,
    unterpunkte: [
      {
        id: 'up-2-1',
        titel: 'Ausruestungsuebersicht',
        beschreibung: 'Alle Tools die du brauchst',
        videoUrl: 'https://...',
        dauerMinuten: 12,
        reihenfolge: 1,
        abgeschlossen: false,
      },
    ],
  },
  {
    id: 'hauptmodul-3',
    titel: 'Durchfuehrung Thermocheck',
    beschreibung: 'Der praktische Ablauf vor Ort',
    reihenfolge: 3,
    unterpunkte: [
      {
        id: 'up-3-1',
        titel: 'Verschiedene Heizkreise',
        beschreibung: 'Heizkreise verstehen',
        videoUrl: 'https://...',
        dauerMinuten: 15,
        reihenfolge: 1,
        abgeschlossen: false,
      },
      {
        id: 'up-3-2',
        titel: 'Autark',
        beschreibung: 'Autarke Systeme',
        videoUrl: 'https://...',
        dauerMinuten: 10,
        reihenfolge: 2,
        abgeschlossen: false,
      },
      {
        id: 'up-3-3',
        titel: 'Fussbodenheizung',
        beschreibung: 'Thermografie bei Fussbodenheizung',
        videoUrl: 'https://...',
        dauerMinuten: 12,
        reihenfolge: 3,
        abgeschlossen: false,
      },
      {
        id: 'up-3-4',
        titel: 'Heizkoerper',
        beschreibung: 'Analyse von Heizkoerpern',
        videoUrl: 'https://...',
        dauerMinuten: 8,
        reihenfolge: 4,
        abgeschlossen: false,
      },
      {
        id: 'up-3-5',
        titel: 'Raumweise Gebaeude',
        beschreibung: 'Systematische Raumerfassung',
        videoUrl: 'https://...',
        dauerMinuten: 10,
        reihenfolge: 5,
        abgeschlossen: false,
      },
      {
        id: 'up-3-6',
        titel: 'Datenerfassung',
        beschreibung: 'Korrekte Datenaufnahme',
        videoUrl: 'https://...',
        dauerMinuten: 15,
        reihenfolge: 6,
        abgeschlossen: false,
      },
      {
        id: 'up-3-7',
        titel: 'Thermografiebilder richtig erstellen',
        beschreibung: 'Professionelle Waermebilder',
        videoUrl: 'https://...',
        dauerMinuten: 20,
        reihenfolge: 7,
        abgeschlossen: false,
      },
      {
        id: 'up-3-8',
        titel: 'Besonderheiten bei Dachausbau und Keller',
        beschreibung: 'Spezialfaelle meistern',
        videoUrl: 'https://...',
        dauerMinuten: 12,
        reihenfolge: 8,
        abgeschlossen: false,
      },
    ],
  },
  {
    id: 'hauptmodul-4',
    titel: 'Nachbearbeitung und Dokumentation',
    beschreibung: 'Nach dem Thermocheck',
    reihenfolge: 4,
    unterpunkte: [
      {
        id: 'up-4-1',
        titel: 'Bilddokumentation',
        beschreibung: 'Bilder richtig dokumentieren',
        videoUrl: 'https://...',
        dauerMinuten: 10,
        reihenfolge: 1,
        abgeschlossen: false,
      },
      {
        id: 'up-4-2',
        titel: 'Zahlmodell',
        beschreibung: 'Provisionen und Abrechnungen',
        videoUrl: 'https://...',
        dauerMinuten: 8,
        reihenfolge: 2,
        abgeschlossen: false,
      },
      {
        id: 'up-4-3',
        titel: 'Rechnungsstellung',
        beschreibung: 'Rechnungen erstellen',
        videoUrl: 'https://...',
        dauerMinuten: 10,
        reihenfolge: 3,
        abgeschlossen: false,
      },
    ],
  },
];
```

---

## UI-Design: AcademyStep.tsx

### Visuelles Konzept

```text
┌─────────────────────────────────────────────────────────┐
│  [Icon] Akademie-Schulung                               │
│  4 von 16 Unterpunkten abgeschlossen          [25%]     │
│  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ▼  1. Einfuehrung und Grundlagen           [4/4] ✓     │  ← Accordion-Trigger
├─────────────────────────────────────────────────────────┤
│     ┌─────────────────────────────────────────────────┐ │
│     │ ✓  Einfuehrung und Begruessung        5 Min.   │ │  ← Abgeschlossen
│     └─────────────────────────────────────────────────┘ │
│     ┌─────────────────────────────────────────────────┐ │
│     │ ✓  Kleidung und Verhalten             8 Min.   │ │
│     └─────────────────────────────────────────────────┘ │
│     ┌─────────────────────────────────────────────────┐ │
│     │ ✓  Sicherheitsdatenblatt             10 Min.   │ │
│     └─────────────────────────────────────────────────┘ │
│     ┌─────────────────────────────────────────────────┐ │
│     │ ✓  Aussenbereich                      7 Min.   │ │
│     └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ▶  2. Ausruestung und Vorbereitung         [0/1]       │  ← Collapsed, aktiv
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🔒 3. Durchfuehrung Thermocheck            [0/8]       │  ← Gesperrt
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🔒 4. Nachbearbeitung und Dokumentation    [0/3]       │  ← Gesperrt
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🔒 Abschlusstest                                       │
│     Verfuegbar nach Abschluss aller Module              │
└─────────────────────────────────────────────────────────┘
```

### Logik

1. **Sequenzielle Freischaltung**: Hauptmodul N+1 wird erst nach Abschluss aller Unterpunkte von Modul N freigeschaltet
2. **Accordion**: Nur aktives/abgeschlossenes Modul kann geoeffnet werden
3. **Unterpunkt-Navigation**: Klick auf Unterpunkt oeffnet `/akademie/modul/:unterpunktId`
4. **Fortschrittsanzeige**: Jedes Hauptmodul zeigt `[erledigt/gesamt]`

---

## Dateien die geaendert werden

| Datei | Aenderung |
|-------|-----------|
| `src/types/onboarding.ts` | `AkademieHauptmodul`, `AkademieUnterpunkt` Interfaces |
| `src/lib/onboarding-config.ts` | `MOCK_AKADEMIE_HAUPTMODULE` mit allen 4 Modulen und 16 Unterpunkten |
| `src/components/onboarding/steps/AcademyStep.tsx` | Kompletter Umbau zu Accordion-Struktur |
| `src/hooks/useOnboardingState.ts` | Anpassung fuer hierarchische Akademie-Struktur |
| `src/pages/AkademieModul.tsx` | Anpassung fuer Unterpunkt-IDs |

---

## Technische Details

### Verwendete Komponenten
- `@/components/ui/accordion` (bereits vorhanden)
- `@/components/ui/collapsible` (bereits vorhanden)
- `@/components/ui/progress` (bereits vorhanden)
- `@/components/ui/badge` (bereits vorhanden)

### Neue Helper-Funktionen

```typescript
// Berechnet Fortschritt eines Hauptmoduls
function getHauptmodulProgress(hauptmodul: AkademieHauptmodul): { completed: number; total: number } {
  const completed = hauptmodul.unterpunkte.filter(u => u.abgeschlossen).length;
  return { completed, total: hauptmodul.unterpunkte.length };
}

// Prueft ob Hauptmodul freigeschaltet ist
function isHauptmodulUnlocked(index: number, hauptmodule: AkademieHauptmodul[]): boolean {
  if (index === 0) return true;
  const prev = hauptmodule[index - 1];
  return prev.unterpunkte.every(u => u.abgeschlossen);
}

// Gesamtfortschritt ueber alle Module
function getTotalAkademieProgress(hauptmodule: AkademieHauptmodul[]): number {
  const total = hauptmodule.reduce((acc, m) => acc + m.unterpunkte.length, 0);
  const completed = hauptmodule.reduce(
    (acc, m) => acc + m.unterpunkte.filter(u => u.abgeschlossen).length, 0
  );
  return Math.round((completed / total) * 100);
}
```

---

## Risiken und Mitigierung

| Risiko | Mitigierung |
|--------|-------------|
| State-Migration bestehender User | Migrations-Funktion in useOnboardingState die altes Format erkennt |
| Komplexitaet erhoeht | Modulare Komponenten: HauptmodulAccordion, UnterpunktItem |
| Lange Ladezeiten bei vielen Videos | Lazy Loading fuer Video-Komponenten |
| Unuebersichtlich bei vielen Unterpunkten | Collapsible-Design zeigt nur aktives Modul |

---

## Erwartetes Ergebnis

- Hierarchische Akademie-Struktur mit 4 Hauptmodulen
- Klare visuelle Trennung durch Accordion
- Sequenzielle Freischaltung (Enterprise-Pattern)
- Fortschrittsanzeige pro Modul und gesamt
- Konsistent mit 7-Schritte-Onboarding-Konzept
- Skalierbar fuer zukuenftige Inhalte

