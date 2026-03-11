

# Praxistest-Freigabe sichtbar machen: Badges + Trainer-Hinweis

## Problem
1. **Admin**: Die "Abnahme"-Tab im Admin hat zwar einen Praxistests-Sub-Tab, aber es gibt **kein Badge** auf dem Tab selbst -- man sieht also nicht, dass etwas zur Prüfung ansteht, ohne reinzuklicken.
2. **Trainer**: Trainer sehen Praxistest-Links auf den Mitfahrt-Karten, haben aber **keinen eigenen Freigabe-Button** und keine Benachrichtigung, dass Praxistests eingereicht wurden.

## Umsetzung

### 1. Admin: Badge auf "Abnahme"-Tab
**Datei: `src/pages/Admin.tsx`**
- `useAdminQGPraxistests` Hook importieren und aufrufen
- Die Anzahl pendenter Praxistests als `badges` Prop an `AdminBottomNav` übergeben:
  ```tsx
  <AdminBottomNav badges={{ 'quality-gate': praxisCount }} ... />
  ```
- So sieht jeder Admin/Superadmin sofort einen roten Badge mit der Zahl ausstehender Praxistests auf dem "Abnahme"-Tab.

### 2. Trainer: Praxistest-Freigabe direkt auf der Mitfahrt-Karte
**Datei: `src/components/trainer/TrainerRideAlongs.tsx`**
- Wenn ein Trainee `praxistestEingereicht === true` und noch keine Freigabe hat, einen **"Praxistest prüfen & freigeben"-Button** auf der TraineeCard anzeigen.
- Den `useApprovePraxistest` Hook importieren und den Button mit der Approve-Mutation verbinden.
- So können Trainer direkt aus ihrer Mitfahrten-Übersicht den Praxistest freigeben, ohne in den Admin-Bereich wechseln zu müssen.

**Datei: `src/hooks/useMyCoachingRideAlongs.ts`**
- Das Feld `praxistestFreigabe` (boolean) zum Interface und zur Query hinzufügen (`praxistest_freigabe` aus `contractor_onboarding`), damit die Karte den Freigabe-Status kennt.

### 3. Trainer-Profil: Hinweis-Banner
**Datei: `src/components/trainer/TrainerRideAlongs.tsx`**
- Oberhalb der Mitfahrten-Liste ein kompaktes Banner einblenden, wenn es mindestens einen Trainee mit `praxistestEingereicht && !praxistestFreigabe` gibt:
  > "🔔 X Praxistest(s) warten auf deine Freigabe"

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/pages/Admin.tsx` | Badge-Count an BottomNav übergeben |
| `src/components/trainer/TrainerRideAlongs.tsx` | Freigabe-Button + Banner |
| `src/hooks/useMyCoachingRideAlongs.ts` | `praxistestFreigabe` Feld hinzufügen |

