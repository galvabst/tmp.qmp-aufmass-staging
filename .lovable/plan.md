

# Trainer-Bereich: Zwei Buttons für Mitfahrten & Praxistest-Freigabe

## Problem
Mitfahrten und Praxistest-Freigaben sind aktuell einfach untereinander gereiht -- der User Christian Born hat seinen Praxistest eingereicht, aber es ist nicht klar wo man das sieht. Es fehlt eine intuitive Navigation.

## Umsetzung

### ProfileView.tsx (Zeile 374-378)
Statt `TrainerProfileEditor` + `TrainerRideAlongs` direkt untereinander zu rendern, wird nach dem TrainerProfileEditor ein **Button-Paar** eingefügt:

```text
┌─────────────────────────────────────┐
│  Trainer-Profil (Video, Bio, Preis) │
├─────────────────────────────────────┤
│  [🚗 Meine Mitfahrten]  [🔔 Praxistest-Freigabe (1)] │
├─────────────────────────────────────┤
│  (je nach gewähltem Button:)        │
│  → Mitfahrten-Liste ODER            │
│  → Praxistest-Queue                 │
└─────────────────────────────────────┘
```

- **State**: `trainerTab: 'mitfahrten' | 'praxistests'` in ProfileView
- **Button 1**: "Meine Mitfahrten" -- zeigt `<TrainerRideAlongs>`
- **Button 2**: "Praxistest-Freigabe" mit Badge-Count -- zeigt eine neue kompakte Praxistest-Liste

### Neue Komponente: `TrainerPraxistestQueue.tsx`
- Nutzt `useMyCoachingRideAlongs` (bereits vorhanden, hat `praxistestEingereicht`, `praxistestScanUrl`, `praxistestVideoUrl`, `praxistestFreigabe`, `onboardingId`)
- Filtert auf `praxistestEingereicht && !praxistestFreigabe`
- Zeigt pro Trainee: Name, Avatar, Links zu 3D-Scan + Drohnenvideo, Freigabe-Button
- Nutzt `useApprovePraxistest` für die Freigabe-Mutation

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/ProfileView.tsx` | State + zwei Toggle-Buttons nach TrainerProfileEditor, bedingtes Rendern |
| `src/components/trainer/TrainerPraxistestQueue.tsx` | Neue Komponente: Praxistest-Freigabe-Liste |
| `src/components/trainer/TrainerRideAlongs.tsx` | Praxistest-Banner entfernen (wird jetzt separater Tab) |

