
# Onboarding: Session-Verlust, Gewerbeschein und Redirect beheben

## Problem-Zusammenfassung

1. **Stripe oeffnet neuen Tab** -- nach Zahlung hat man 2 Tabs offen
2. **Fortschritt geht verloren** -- nach Stripe-Redirect landet man bei Schritt 1/7
3. **Gewerbeschein wird nicht gespeichert** -- Upload nutzt temporaere Blob-URLs
4. **"Spaeter nachreichen" wird vergessen** -- Flag nur im localStorage, das durch forceReset geloescht wird

## Ursache

Die Kette ist:

```text
Stripe oeffnet neuen Tab (window.open _blank)
  -> Stripe leitet nach Zahlung zurueck -> neuer Tab laedt App frisch
  -> DB sagt onboarding_status = "invited"
  -> forceReset-Logik erkennt localStorage als "veraltet"
  -> localStorage wird geloescht -> User bei Schritt 1
```

Gewerbeschein: `URL.createObjectURL(file)` erzeugt nur temporaere URLs, die beim Neuladen verschwinden. Kein Upload nach Supabase Storage, kein DB-Eintrag.

## Loesung in 5 Teilen

### Teil 1: Stripe im gleichen Tab oeffnen

**Datei:** `src/hooks/useStripeCheckout.ts`

- `window.open(data.checkout_url, '_blank')` aendern zu `window.location.href = data.checkout_url`
- Polling-State (`isWaitingForPayment`, `waitingForProductKey`, `stopWaiting`) entfernen -- nicht mehr noetig, da der gleiche Tab nach Stripe-Redirect zurueckkommt
- Hook wird dadurch deutlich einfacher

### Teil 2: ForceReset-Logik reparieren

**Datei:** `src/components/OnboardingScreen.tsx` (Zeilen 64-90)

Die "stale localStorage" Erkennung ist zu aggressiv. Aenderungen:

- Wenn `?payment=success` in der URL steht: **niemals** forceReset ausfuehren
- `bestellungenBestaetigt.length > 0` aus der Stale-Erkennung entfernen (bezahlte Bestellungen sind valider Fortschritt, kein Zeichen fuer veraltete Daten)
- Nur bei wirklich unmoeglich-validem Zustand resetten (z.B. `coachingAbgeschlossen = true` bei DB "invited")

### Teil 3: Gewerbeschein in Supabase Storage hochladen

**Datenbank-Migration:**

- Storage-Bucket `contractor-documents` erstellen (aehnlich wie `contractor-avatars`)
- RLS-Policies: User kann eigene Dateien hochladen und lesen
- Spalten in `thermocheck.contractor_onboarding` hinzufuegen: `gewerbeschein_url` (text), `gewerbeschein_spaeter` (boolean default false)

**Datei:** `src/components/OnboardingScreen.tsx`

- `handleGewerbescheinUpload`: Datei nach Supabase Storage hochladen (Pfad: `{userId}/gewerbeschein-{timestamp}.{ext}`), permanente URL im State speichern
- `handleNext` bei Schritt `dokumente`: Gewerbeschein-URL und/oder Spaeter-Flag via RPC in DB schreiben

### Teil 4: Onboarding-Fortschritt in DB speichern

**Datenbank-Migration:**

- Spalten in `thermocheck.contractor_onboarding`: `current_step` (text), `completed_steps` (text[])
- RPC-Funktion `update_contractor_onboarding_progress(p_current_step text, p_completed_steps text[])` erstellen

**Datei:** `src/components/OnboardingScreen.tsx`

- `handleNext`: Nach jedem Schrittwechsel `current_step` und `completed_steps` in DB schreiben
- Beim Laden: DB-Werte (`current_step`, `completed_steps`) bevorzugen gegenueber localStorage

### Teil 5: Fortschritt und Gewerbeschein beim Start aus DB laden

**Datei:** `src/hooks/useContractorProfile.ts`

- Die RPC `get_contractor_address` erweitern oder eine neue RPC `get_contractor_onboarding_state` erstellen, die auch `current_step`, `completed_steps`, `gewerbeschein_url` und `gewerbeschein_spaeter` zurueckgibt

**Datei:** `src/components/OnboardingScreen.tsx`

- Beim Hydrations-Effekt: DB-Werte fuer Fortschritt und Gewerbeschein in den State uebernehmen

## Zusammenfassung der Aenderungen

| Bereich | Datei/Resource | Aenderung |
|---------|---------------|-----------|
| Stripe Redirect | `useStripeCheckout.ts` | `window.open` zu `window.location.href`, Polling entfernen |
| ForceReset | `OnboardingScreen.tsx` | Payment-Success und bezahlte Bestellungen vom Reset ausnehmen |
| Gewerbeschein Storage | DB-Migration | Bucket `contractor-documents` + Spalten `gewerbeschein_url`, `gewerbeschein_spaeter` |
| Gewerbeschein Upload | `OnboardingScreen.tsx` | Upload zu Supabase Storage statt Blob-URL |
| Fortschritt DB | DB-Migration | Spalten `current_step`, `completed_steps` + RPC |
| Fortschritt laden | `useContractorProfile.ts` | Erweiterte RPC mit Fortschritts-Feldern |
| Fortschritt speichern | `OnboardingScreen.tsx` | Bei handleNext in DB schreiben, beim Start aus DB lesen |

## Resultat nach Umsetzung

```text
User klickt "Jetzt bestellen"
  -> gleicher Tab geht zu Stripe
  -> User zahlt
  -> Stripe leitet zurueck auf gleichen Tab: /?payment=success
  -> App erkennt Payment, laedt Bestellungen neu
  -> Fortschritt aus DB: current_step = "bestellungen", completed_steps korrekt
  -> Naechstes Produkt wird angezeigt (kein Zurueckspringen)
```
