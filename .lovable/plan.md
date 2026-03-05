

# Admin-Console Überarbeitung: Auftragnehmer, Pool & Buchungen

## Probleme

1. **Auftragnehmer**: Trainer wie Till Ibendorf zeigen "In Bearbeitung" statt "Einsatzbereit" -- Trainer sind immer einsatzbereit. Kein Dashboard mit Zusammenfassung.
2. **Pool**: Zeigt alle Objektaufträge mit abgeleitetem Status. Soll nur echte Terminvorschläge zeigen (pipeline_status = termin_abwarten, kein Techniker zugewiesen) -- wie der Vertriebler-Pool.
3. **Buchungen**: Kein Techniker-Name sichtbar, kein Filter nach Techniker, keine Statistik zu aktiven Terminen pro Techniker.

---

## 1. Auftragnehmer: Trainer-Fix + Dashboard

### Trainer-Status-Fix
In `useAdminContractorList.ts`: Wenn `is_trainer === true`, wird `onboardingStatus` auf `'ready'` gemappt, unabhängig vom DB-Wert. Das behebt das Problem mit Till Ibendorf.

### Dashboard-Header
In `ContractorListView.tsx`: Oberhalb der Pipeline-Cards ein kompaktes Dashboard einfügen:
- **Gesamt-Techniker** | **Einsatzbereit** | **In Onboarding** | **Trainer** (jeweils als Zahl)
- Kompakte Card-Zeile mit 4 KPI-Kacheln

---

## 2. Pool: Nur Terminvorschläge

### Hook komplett umbauen (`useAdminObjectOrders.ts`)
Statt alle Aufträge zu laden und Status abzuleiten: Nur `thermocheck_terminvorschlaege` laden mit Status `vorgeschlagen` (nicht angenommen/abgelehnt), verknüpft mit Aufträgen wo `pipeline_status = 'termin_abwarten'` und `zugewiesener_techniker_id IS NULL`.

### Interface ändern
Neues Interface `AdminPoolTermin` mit: Termin-ID, Auftrag-ID, Datum, Zeit, Kundenname, Adresse, PLZ, Ort.

### View umbauen (`ObjectOrderListView.tsx`)
- Titel: "Pool-Terminvorschläge" statt "Objektaufträge"
- Keine Pipeline-Status-Cards (alles ist "offen")
- Einfache Liste: Datum, Kundenname, Adresse, PLZ/Ort
- Suche nach Adresse/Name beibehalten
- Karten-Ansicht beibehalten
- Kein "+ Neu" Button (Termine kommen vom Vertrieb)

---

## 3. Buchungen: Techniker-Info + Filter + Statistik

### Hook erweitern (`useAdminBookings.ts`)
- Techniker-Name auflösen: `zugewiesener_techniker_id` → `contractor_onboarding.profile_id` → `profiles.vorname/nachname`
- Neues Feld `technikerName: string` im Interface
- Neues Feld `technikerProfileId: string | null`

### View umbauen (`BookingListView.tsx`)
- **Statistik-Header**: Cards mit "Gesamt Buchungen", "Pro Techniker" (Durchschnitt), "Bestätigt", "Ausstehend"
- **Techniker-Filter**: Dropdown mit allen Technikern die Buchungen haben
- **Techniker-Name** in jeder Booking-Card anzeigen (Avatar + Name)
- **Techniker-Zusammenfassung**: Optionaler Bereich der zeigt, wie viele aktive Termine jeder Techniker hat (sortiert absteigend)

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `useAdminContractorList.ts` | Trainer → ready-Mapping |
| `ContractorListView.tsx` | Dashboard-KPIs oben |
| `useAdminObjectOrders.ts` | Komplett umbauen auf Terminvorschläge |
| `ObjectOrderListView.tsx` | Umbauen auf Pool-Terminliste |
| `useAdminBookings.ts` | Techniker-Name auflösen |
| `BookingListView.tsx` | Techniker-Filter, Stats, Name in Cards |

