
# Profil-Tab: Dummy-Daten durch echte DB-Daten ersetzen

Das Profil-Tab zeigt aktuell hartcodierte Mock-Daten ("Max Mustermann", 127 Auftraege, 98% Annahmerate, etc.). Diese sollen durch echte Daten aus der Datenbank ersetzt werden.

## Was sich aendert

### 1. Profildaten aus DB laden (Name, Email, Telefon, Avatar, Region)

Die Daten kommen aus:
- `public.profiles` (Vorname, Nachname, Email, Telefon, Avatar)
- `thermocheck.contractor_onboarding` via `get_contractor_onboarding_state` RPC (Adresse/Region)
- `contractor_onboarding.erstellt_am` fuer "Techniker seit"

Der bestehende `useContractorProfile` Hook liefert diese Daten bereits.

### 2. Statistiken (Auftraege, Annahmerate, Bewertung)

Aktuell gibt es keine echten Auftrags-Statistiken in der DB. Da diese Daten noch nicht existieren, werden die Stats-Werte auf **0 / 0% / -** gesetzt (statt falsche Dummy-Werte anzuzeigen). Spaeter koennen echte Aggregate ergaenzt werden.

### 3. Kontingent (Quartal Q1/2026)

Auch hier gibt es keine echte DB-Tabelle. Die Werte werden auf 0/24 gesetzt, um keine falschen Daten anzuzeigen.

### 4. Onboarding-Fortschritt aus DB

Der Onboarding-Status kommt bereits aus `useContractorOnboardingStatus`. Statt Mock-Steps wird der echte Fortschritt (completed_steps, current_step) aus der DB angezeigt.

### 5. Zertifikate

Aktuell keine echte Zertifikat-Tabelle. Leeres Array statt Fake-Zertifikate.

## Technische Umsetzung

### Datei: `src/pages/Index.tsx`
- `useContractorProfile` Hook importieren und verwenden
- Profil-State aus DB-Daten aufbauen statt aus `mockTechnicianProfile`
- Onboarding-Record Daten (completed_steps, current_step) fuer Fortschrittsanzeige nutzen
- `loadOnboardingProfile()` und `loadOnboardingStatus()` Hilfsfunktionen entfernen

### Datei: `src/components/ProfileView.tsx`
- Onboarding-Steps aus den echten `completed_steps` des DB-Records ableiten
- "Techniker seit" aus `erstellt_am` berechnen (Format: "2026-01")

### Datei: `src/data/mockTechnicianData.ts`
- `mockTechnicianProfile`, `mockOnboardingProgress`, `mockKontingent`, `mockCertificates` entfernen (die Mock-Orders bleiben vorerst fuer die anderen Tabs)

### Datei: `src/types/technician.ts`
- Keine Aenderungen noetig, das Interface passt bereits

## Was NICHT geaendert wird

- Die anderen Tabs (Pool, Bookings, Active, Review) nutzen weiterhin `mockTechnicianOrders` - das ist ein separates Thema
- Keine neuen DB-Tabellen - wir zeigen nur an, was die DB bereits hat
