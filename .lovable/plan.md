

# Ampelsystem & Aktive Techniker im Dashboard

## Übersicht

Zwei Erweiterungen der Dashboard-Ansicht:

**A) Onboarding-Ampel**: Jeder Techniker im Onboarding bekommt einen farbcodierten Indikator (Grün/Orange/Rot) basierend auf verbleibender Zeit vs. aktuellem Schritt, plus Anzeige "X Tage verbleibend".

**B) Aktive Techniker-Sektion**: Neue Card unterhalb des Onboarding-Bereichs, die alle `ready`-Techniker mit Quartalskontingent-Fortschritt und Ampel zeigt.

---

## A) Onboarding-Ampel (7-Tage-Deadline)

**Datei: `AdminDashboardView.tsx`**

Logik für die Ampelfarbe pro Onboarding-Techniker:

```text
Tag 0-2: Grün, solange mindestens "Bestellungen" erreicht
Tag 3-4: Orange, wenn noch nicht bei "Akademie"
Tag 5+:  Rot, wenn Akademie nicht abgeschlossen
Tag 7+:  Rot ("Überfällig")
```

Konkrete Regeln:
- **Grün**: `verbleibend >= 5` ODER `currentStep` ist `akademie`/`coaching`/`nachweise`
- **Orange**: `verbleibend >= 3` UND `currentStep` ist noch `profil`/`dokumente`/`bestellungen`/`equipment`
- **Rot**: `verbleibend < 3` UND Akademie nicht erreicht, ODER `verbleibend < 0` (überfällig)

Anzeige pro Zeile in der Techniker-Liste:
- Farbiger Punkt (●) links neben dem Namen
- Text: "5 Tage verbleibend" / "Überfällig (+2 Tage)"

**Berechnung**: `verbleibend = 7 - differenceInDays(now, erstelltAm)`

Gilt für alle Tabs im "Techniker im Onboarding"-Bereich.

---

## B) Aktive Techniker (Ready) mit Kontingent-Ampel

**Datei: `AdminDashboardView.tsx`**

Neue Card "Aktive Techniker (X)" nach dem Onboarding-Block:

- Listet alle Contractors mit `onboardingStatus === 'ready'` (ohne Trainer)
- Pro Techniker: Name, Avatar, Quartalskontingent-Fortschritt

**Kontingent-Ampel (24 TCs/Quartal)**:

```text
Quartal = 13 Wochen
Erwartete TCs zum aktuellen Zeitpunkt = (vergangene Wochen / 13) × 24
Ist-Stand = Anzahl abgeschlossener TCs im laufenden Quartal

Grün:  Ist >= 80% des Erwarteten
Orange: Ist >= 50% des Erwarteten  
Rot:   Ist < 50% des Erwarteten
```

**Datenquelle**: `useAdminDashboardStats` liefert bereits `auslastung` (Aufträge pro Techniker). Diese Daten werden mit den `ready`-Contractors gejoint.

Anzeige pro Zeile:
- Farbiger Ampel-Punkt
- "X / 24 TCs" als kompakte Badge
- Kleiner Fortschrittsbalken

---

## Technisch

### Dateien

| Datei | Änderung |
|---|---|
| `AdminDashboardView.tsx` | Ampel-Punkt + verbleibende Tage bei Onboarding-Liste; neue "Aktive Techniker"-Card mit Kontingent-Ampel |
| `useAdminContractorList.ts` | Keine Änderung nötig — `erstelltAm` und `onboardingStatus` sind bereits vorhanden |
| `useAdminDashboardStats.ts` | Quartalsdaten erweitern: TCs pro Techniker im aktuellen Quartal filtern (statt alle Zeit) |

### Ampel-Helper (in AdminDashboardView)

```typescript
function getOnboardingTrafficLight(c: AdminContractor): 'green' | 'orange' | 'red' {
  const daysLeft = 7 - differenceInDays(new Date(), parseISO(c.erstelltAm));
  const stepIndex = ONBOARDING_STEPS.indexOf(c.currentStep);
  // Akademie = index 4
  if (daysLeft <= 0) return 'red';
  if (stepIndex >= 4) return 'green'; // Akademie oder weiter
  if (daysLeft <= 2) return 'red';
  if (daysLeft <= 4 && stepIndex < 3) return 'orange';
  return 'green';
}
```

### Quartal-Filter in useAdminDashboardStats

Aktuelles Quartal berechnen (Q1=Jan-Mar, Q2=Apr-Jun, etc.), dann nur Aufträge zählen deren `termin_datum` im aktuellen Quartal liegt.

