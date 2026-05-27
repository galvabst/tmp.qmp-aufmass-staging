# Onboarding vs. Aktive — Switch in der Techniker-Liste

## Ziel
Die beiden Innendienst-Personen (Onboarding-Manager und Aktiv-Manager) sollen in der Admin-Technikerliste oben einen klaren Switch haben, mit dem die Liste auf ihren Verantwortungsbereich gefiltert wird — ohne jedes Mal über Status-Chips fummeln zu müssen.

## Scope
Nur Frontend, eine Datei: `src/features/contractors/ui/ContractorListView.tsx`.
Keine DB-, RPC- oder Hook-Änderungen.

## Änderungen

### 1. Neuer Top-Switch (Segmented Control, Apple-Stil)
Über der Suchleiste, prominent gerendert:

```
[ Im Onboarding (n) ] [ Aktive (n) ] [ Alle (n) ]
```

Drei Modi:
- **Onboarding** — `onboardingStatus ∈ { angelegt, invited, started, in_progress, mitfahrt, blocked }` (alles vor `ready`, ohne Ehemalige/Inaktiv)
- **Aktive** — `onboardingStatus === 'ready'` **oder** `isTrainer === true`
- **Alle** — heutige Default-Logik (aktive + ggf. Inaktive über separaten Toggle)

Counts pro Tab werden live aus `contractors` berechnet (analog zur bestehenden `kpis`-Memo).

### 2. Persistenz
Auswahl wird in `localStorage` unter `admin.contractorList.viewMode` gespeichert, damit der Reload den Tab nicht verliert. Default beim ersten Besuch: **Alle** (um keine Regression für bestehende Nutzer zu erzeugen).

### 3. Wechselwirkung mit bestehenden Filtern
- **Suche** (`searchQuery`) bleibt, wirkt zusätzlich.
- **Status-Chips** (`statusFilter`) werden modus-sensitiv:
  - Im **Onboarding**-Modus: nur Onboarding-Statuses als Chips.
  - Im **Aktive**-Modus: Chip-Leiste ausgeblendet (es gibt effektiv nur einen Status).
  - Im **Alle**-Modus: heutiges Verhalten.
  - Beim Modus-Wechsel wird `statusFilter` zurückgesetzt, wenn die gewählte Status nicht zum neuen Modus passt.
- **Inaktiv-Toggle** (`showInaktiv`) bleibt nur im **Alle**-Modus sichtbar.
- **KPI-Cards** oberhalb bleiben unverändert (zeigen weiterhin Gesamtbild).

### 4. Filter-Logik
`filtered = useMemo` bekommt einen zusätzlichen Vorschritt:
```
mode === 'onboarding' → activeNonReady && !isTrainer
mode === 'aktiv'      → onboardingStatus === 'ready' || isTrainer
mode === 'alle'       → bestehende Logik
```
Danach laufen Suche/Status-Chip/Inaktiv-Toggle wie heute.

### 5. Subtitle des `AdminLayout`
Anpassen je nach Modus: „Onboarding" / „Aktive Thermotrackler" / „Alle Techniker" — damit der Header sofort signalisiert, in welcher Sicht man steht.

## Technische Notizen
- Komponente: `Tabs` aus `@/components/ui/tabs` (shadcn) — passt visuell, hat A11y eingebaut.
- LOC-Budget: aktuell 505 LOC, das Limit ist 350 für Components. Da wir ohnehin anpacken, bei der Gelegenheit `ContractorRow` in eine eigene Datei `ContractorRow.tsx` auslagern (~150 LOC), damit `ContractorListView.tsx` unter dem Cap bleibt.
- Kein neuer Datenfetch, keine neue Query-Invalidierung nötig.

## Validierung
1. Switch auf **Onboarding** → nur Techniker mit Status `angelegt`/`invited`/`started`/`in_progress`/`mitfahrt`/`blocked` sichtbar; `ready` und Trainer ausgeblendet; Counts in Tabs stimmen mit Filterergebnis überein.
2. Switch auf **Aktive** → nur `ready` und `isTrainer === true`; Status-Chips weg; Subtitle = „Aktive Thermotrackler".
3. Switch auf **Alle** → identisches Verhalten zu heute, inkl. Inaktiv-Toggle und Ehemalige-Logik.
4. Reload nach Modus-Wahl → gleicher Modus wieder aktiv (localStorage).
5. Suche + Modus kombinieren → korrekte Schnittmenge.
6. `wc -l` für die zerlegten Dateien bestätigt LOC-Cap eingehalten.

## Out of scope
- Keine Änderungen am `AdminDashboardView` oder am `SubscriptionHealthPanel` (die haben eigene Funnel-Logik).
- Keine Server-seitige Filterung (Datenmenge ist klein, Client-Filter reicht und ist konsistent mit heutigem Pattern).
- Kein Rollen-basiertes Default (kein automatisches „Onboarding-Manager sieht zuerst Onboarding") — der User-Wunsch ist ein manueller Switch, das halten wir explizit.