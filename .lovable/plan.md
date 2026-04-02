

# Hiring-Map im Admin-Dashboard

## Übersicht
Eine interaktive Leaflet-Karte im Admin-Dashboard, die Vertriebler (mit 60km-Umkreis) und Thermo-Checker (aktiv vs. im Onboarding) auf einer Deutschlandkarte zeigt. Ziel: sofort erkennen, wo Techniker-Abdeckung fehlt.

## Datenquellen

**Vertriebler**: `public.mitarbeiter` (status = 'Aktiv', taetigkeit = 'field_sales')
- Felder: `name`, `plz_hauptstandort`, `hauptstandort_lat`, `hauptstandort_lng`
- Einige haben bereits Koordinaten, für den Rest → PLZ-Geocoding via bestehender `plz-geocoder.ts`
- 60km-Radius-Kreis um jeden Standort

**Thermo-Checker**: `thermocheck.contractor_onboarding`
- `anschrift_plz` + `anschrift_ort` → Geocoding
- `onboarding_status`: `ready` = aktiv (grün), alles andere = im Onboarding (orange/gelb)
- Name aus `public.profiles` (vorname, nachname)

**Wunschgebiet der Checker**: Aktuell gibt es kein Feld dafür in der DB. `contractor_onboarding` hat kein `wunsch_radius` o.ä.

## Was gebaut wird

### 1. Neuer Hook: `useAdminHiringMap`
Lädt Vertriebler und Contractors mit PLZ/Koordinaten. Geocodet fehlende Koordinaten via bestehendem Batch-Geocoder.

### 2. Neue Komponente: `AdminHiringMap`
- Leaflet-Karte (wie bestehende `PoolMap`, gleiches Pattern)
- **Blaue Marker + 60km-Kreis**: Vertriebler (field_sales)
- **Grüne Marker**: Aktive Thermo-Checker (status = ready)
- **Orange Marker**: Onboarding-Checker (status ≠ ready)
- Popup bei Klick: Name, PLZ, Status
- Legende unten/oben
- Toggle-Buttons: Vertriebler ein/aus, Checker ein/aus

### 3. Integration im Dashboard
- Neue Card unterhalb der KPI-Row oder als eigener Bereich
- Zusammenklappbar (Collapsible), standardmäßig offen
- Höhe ca. 400px

### 4. DB-Migration: `wunsch_radius_km` Feld
- Neues Feld in `thermocheck.contractor_onboarding`: `wunsch_radius_km INTEGER DEFAULT 60`
- Wird im Onboarding-Profil-Step als Slider abgefragt ("Wie weit bist du bereit zu fahren?")
- Auf der Map als andersfarbiger Kreis (z.B. grün/orange halbtransparent) dargestellt

### 5. Onboarding ProfileStep Erweiterung
- Neuer Slider/Input: "Wunschumkreis (km)" — Default 60km
- Wird beim Profil-Speichern mitgeschrieben

## Technische Details

```text
┌─────────────────────────────────────────────┐
│  Admin Dashboard                            │
│  ┌─ KPI Cards ───────────────────────────┐  │
│  └───────────────────────────────────────┘  │
│  ┌─ Hiring-Map (Collapsible) ────────────┐  │
│  │  [Legende: 🔵 Vertriebler  🟢 Aktiv  │  │
│  │            🟠 Onboarding]             │  │
│  │  ┌──────────────────────────────────┐ │  │
│  │  │        Leaflet Map               │ │  │
│  │  │   🔵──60km──  🟢  🟠            │ │  │
│  │  │        🟢──Wunsch──              │ │  │
│  │  └──────────────────────────────────┘ │  │
│  └───────────────────────────────────────┘  │
│  ┌─ Funnel / Performance ... ────────────┐  │
└─────────────────────────────────────────────┘
```

**Migration**:
```sql
ALTER TABLE thermocheck.contractor_onboarding 
ADD COLUMN IF NOT EXISTS wunsch_radius_km integer DEFAULT 60;
```

**Dateien**:
- `src/features/admin/hooks/useAdminHiringMap.ts` — Daten laden
- `src/features/admin/ui/AdminHiringMap.tsx` — Leaflet-Karte
- `src/features/admin/ui/AdminDashboardView.tsx` — Map einbinden
- `src/components/onboarding/steps/ProfileStep.tsx` — Wunschumkreis-Slider
- `src/hooks/useContractorProfile.ts` — Feld mitspeichern
- 1 Migration für `wunsch_radius_km`

