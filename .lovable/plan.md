

# Quick-Aktionen für Techniker direkt aus der Hiring-Map

## Ziel

Du sollst Techniker-Pins auf der Hiring-Map direkt anklicken und von dort aus pausieren, endgültig deaktivieren oder zum Detailprofil springen können — ohne erst in den "Auftragnehmer"-Tab wechseln zu müssen.

## Was sich ändert

### 1. Pin-Popup eines Technikers bekommt Aktions-Buttons

Statt nur Name + Status anzuzeigen, hat das Popup künftig:

```text
┌──────────────────────────────┐
│ Max Mustermann               │
│ 📍 12345 Berlin              │
│ ✅ Aktiv · 60 km             │
│ 🔥 8 THCs im Umkreis         │
├──────────────────────────────┤
│ [Profil öffnen]              │
│ [⏸ Pausieren] [🚫 Feuern]   │
└──────────────────────────────┘
```

- **Profil öffnen** → springt in den Tab "Auftragnehmer" und öffnet die Detailseite des Technikers (nutzt den vorhandenen `onSelectContractor`-Mechanismus aus dem Dashboard).
- **Pausieren** → setzt `onboarding_status = 'inaktiv'` (der Techniker bleibt grau/gestrichelt sichtbar als "pausiert").
- **Endgültig deaktivieren** → setzt `onboarding_status = 'gefeuert'` (Techniker verschwindet komplett von der Map und allen aktiven Listen).
- Bei bereits pausierten Technikern erscheint stattdessen ein **Reaktivieren**-Button, der den Status auf `in_progress` zurücksetzt.

### 2. Bestätigungsdialog vor jeder Aktion

Sicherheitsdialog (analog zur Contractor-Liste) verhindert versehentliches Klicken — vor allem für die destruktive "Endgültig deaktivieren"-Aktion. Toast bestätigt das Ergebnis.

### 3. Sichtbarkeit auf der Map

- `'gefeuert'` → bereits jetzt aus der Map gefiltert, bleibt so. Wer endgültig deaktiviert wird, verschwindet sofort.
- `'inaktiv'` → bleibt **grau/gestrichelt sichtbar** wie bisher (deine bevorzugte Sichtbarkeit).
- Die KPI-Zeile oben über der Map ("X Aktive · Y Onboarding") bleibt unverändert.

### 4. Cache-Invalidierung

Nach jeder Status-Änderung werden die Hiring-Map-Daten und die Contractor-Liste automatisch neu geladen — der Techniker verschwindet/ändert sich sofort, ohne Reload.

## Technische Details

- **`useAdminHiringMap.ts`**:
  - `ContractorMapEntry` bekommt zusätzlich `onboardingId` (Row-ID aus `contractor_onboarding`, nötig für UPDATE).
  - Query-Select wird um `id` erweitert.
- **`AdminHiringMap.tsx`**:
  - Neue optionale Prop `onSelectContractor?: (profileId: string) => void`.
  - Marker-Popup nutzt jetzt `L.popup` mit React-rendered Content (oder bindet HTML-Buttons mit `popupopen`-Event-Handler analog zu `PoolMap.tsx`).
  - Lokaler State für Bestätigungsdialog (`AlertDialog` von shadcn).
  - Mutation per `supabaseTC.from('contractor_onboarding').update({ onboarding_status }).eq('id', onboardingId)` + `queryClient.invalidateQueries` für `admin-hiring-map-contractors` und `admin-contractor-list`.
- **`AdminDashboardView.tsx`**: Reicht die existierende `onSelectContractor`-Prop einfach an `<AdminHiringMap onSelectContractor={onSelectContractor} />` weiter.

Keine DB-Migration nötig — die Status-Werte `inaktiv`, `gefeuert`, `in_progress` sind bereits Bestandteil des Onboarding-Status-Enums und werden von der Contractor-Liste schon genauso verwendet.

