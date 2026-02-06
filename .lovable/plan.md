

# Countdown-Redesign: Von Info-Leiste zu Druck-Element

## Problem

Der aktuelle Countdown ist eine schmale orange Leiste, die farblich mit dem Header verschmilzt. Es fehlt der visuelle "Alarm-Effekt" - er wirkt wie ein normales UI-Element statt wie eine Deadline.

## Design-Konzept

Statt einer einfachen Zeile wird der Countdown ein eigenstaendiger, visuell abgesetzter Block mit:

1. **Dunkler Hintergrund** (slate-900/schwarz) - sticht sofort gegen den orangen Header hervor
2. **Grosse Countdown-Ziffern** in einzelnen "Flip-Clock"-Kacheln (wie bei Countdowns auf Landingpages)
3. **Fortschrittsbalken** der zeigt wie viel der 7 Tage bereits verstrichen sind (visueller Druck)
4. **Kontexttext** der sich aendert je nach verbleibender Zeit:
   - Ab 7 Tagen: "Schliesse dein Onboarding in X Tagen ab"
   - Ab 3 Tagen: "Nur noch X Tage! Bitte beeile dich."
   - Ab 1 Tag: "LETZTE CHANCE - Frist laeuft morgen ab!"
   - Abgelaufen: "Frist abgelaufen - kontaktiere deinen Ansprechpartner"
5. **Farbstufen**: Balken und Akzente wechseln von gruen (viel Zeit) ueber gelb/orange (wenig) zu rot (kritisch)

## Visueller Aufbau (vereinfacht)

```text
┌──────────────────────────────────────────────────────┐
│  (dunkler Hintergrund, slate-900)                    │
│                                                      │
│  Schliesse dein Onboarding ab bis zum 13. Feb 2026   │
│                                                      │
│   ┌────┐   ┌────┐   ┌────┐   ┌────┐                 │
│   │ 05 │   │ 22 │   │ 14 │   │ 33 │                 │
│   │Tage│   │ Std│   │ Min│   │ Sek│                 │
│   └────┘   └────┘   └────┘   └────┘                 │
│                                                      │
│  ████████████░░░░░░░  (Fortschritt: 17% verbraucht)  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Technische Aenderungen

Nur eine Datei betroffen: `src/components/onboarding/OnboardingCountdown.tsx`

### Aenderungen im Detail:

1. **Layout**: Von einzeiliger Leiste zu mehrzeiligem Block mit padding
2. **Hintergrund**: `bg-slate-900` (dunkel) statt `bg-amber-500` - kontrastreicher gegen den orangen Header
3. **Countdown-Kacheln**: Vier separate Boxen (Tage, Stunden, Minuten, Sekunden) mit `bg-slate-800` Hintergrund, groessere Schrift (`text-2xl font-bold`)
4. **Labels unter den Zahlen**: "Tage", "Std", "Min", "Sek" in kleiner Schrift
5. **Fortschrittsbalken**: Berechnet aus `(verstrichene Zeit / 7 Tage) * 100`, zeigt visuell wie viel Zeit schon weg ist
6. **Dynamischer Text**: Wechselt basierend auf `timeLeft.days` (motivierend -> warnend -> alarmierend)
7. **Farb-Eskalation**:
   - Mehr als 3 Tage: Balken gruen (`bg-emerald-500`), Text weiss
   - 1-3 Tage: Balken orange (`bg-amber-500`), leichtes Pulsieren
   - Unter 1 Tag: Balken rot (`bg-red-500`), staerkeres Pulsieren
   - Abgelaufen: Komplett rot mit Warnsymbol
8. **Deadline-Datum anzeigen**: Berechnet aus `erstelltAm + 7 Tage`, als lesbares Datum ("bis zum 13. Februar 2026")

### Keine weiteren Dateien betroffen

Die Prop-Schnittstelle (`erstelltAm`, `deadlineDays`) bleibt identisch. Nur das interne Rendering aendert sich.

