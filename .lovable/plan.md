

# Plan: Echte Contractor-Onboarding-Daten in Admin-Ansicht

## Ist-Zustand (Problem)

Die `ContractorListView` zeigt aktuell **6 hardcodierte Mock-Techniker**. Keine echten Daten werden gefetcht. Der Admin sieht nicht:
- Wer beim Onboarding wo steht (welcher Schritt, welche Steps completed)
- Akademie-Fortschritt (welche Lektionen abgeschlossen, Video-Sekunden)
- Quiz-Versuche und Ergebnisse
- Bestellungs-Status (bezahlt/offen)
- Equipment-Nachweise
- Coaching-Status

## Datenlage (verifiziert)

| Tabelle | RLS für Admin SELECT | Daten vorhanden |
|---------|---------------------|-----------------|
| `thermocheck.contractor_onboarding` | ✅ `true` (alle auth users) | 20 Records |
| `public.profiles` | ✅ (via auth) | Name, Email, Telefon, Avatar |
| `thermocheck.contractor_akademie_lektions_fortschritt` | ✅ `true` (ALL) | 8 Contractors mit Fortschritt |
| `thermocheck.contractor_akademie_quiz_ergebnis` | ✅ `true` (ALL) | 6 Contractors mit Quiz-Daten |
| `thermocheck.contractor_bestellungen` | ❌ Nur eigene! | Muss RLS-Policy ergänzt werden |

**Kritischer RLS-Fix nötig:** `contractor_bestellungen` hat nur eine Policy für eigene Rows. Admins brauchen eine SELECT-Policy um Bestellungen aller Contractors zu sehen.

## Verfügbare Daten pro Contractor (aus DB)

```text
┌─ Profil: Vorname, Nachname, Email, Telefon, Avatar
├─ Onboarding-Status: onboarding_status, onboarding_substatus
├─ Aktueller Schritt: current_step (profil/dokumente/bestellungen/equipment/akademie/coaching/nachweise)
├─ Abgeschlossene Schritte: completed_steps[]
├─ Gewerbeschein: URL oder "später"
├─ Equipment: JSONB mit hatEigenes + nachweisUrl pro Item
├─ Akademie:
│   ├─ Lektionen: X von 51 abgeschlossen, Y in Bearbeitung
│   ├─ Video-Fortschritt pro Lektion (Sekunden)
│   ├─ Quiz: Versuche, Best-Score, bestanden ja/nein
│   └─ akademie_test_bestanden (Abschlusstest)
├─ Coaching: coaching_bewertung (ausstehend/bestanden/nicht_bestanden)
├─ Bestellungen: X von Y bezahlt
├─ Intern-Flags: vertrag_geprueft, kleidung_bestellt, lizenzen_bereitgestellt
└─ Trainer: is_trainer, trainer_freigabe
```

## Umsetzungsplan

### 1. RLS-Policy für Admin-Lesezugriff auf Bestellungen (Migration)

```sql
CREATE POLICY "Admin kann alle Bestellungen lesen"
ON thermocheck.contractor_bestellungen
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM iam.user_system_roles usr
    WHERE usr.user_id = auth.uid()
    AND usr.role IN ('superadmin', 'admin', 'manager')
  )
);
```

### 2. Neuer Hook: `useAdminContractorList` 

Datei: `src/features/contractors/hooks/useAdminContractorList.ts`

Fetcht alle Daten parallel via `supabaseTC`:
- `contractor_onboarding` (alle Felder)
- `profiles` (Name, Email, Telefon, Avatar) — via public client
- `contractor_akademie_lektions_fortschritt` (aggregiert per contractor_id)
- `contractor_akademie_quiz_ergebnis` (aggregiert per contractor_id)
- `contractor_bestellungen` (aggregiert per onboarding_id)

Gibt ein Array zurück mit aggregierten Daten pro Contractor:
```typescript
interface AdminContractor {
  id: string;                    // contractor_onboarding.id
  profileId: string;
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  avatarUrl?: string;
  ort: string;
  // Onboarding
  onboardingStatus: string;
  onboardingSubstatus: string | null;
  currentStep: string | null;
  completedSteps: string[];
  isTrainer: boolean;
  erstelltAm: string;
  // Akademie
  lektionenCompleted: number;
  lektionenInProgress: number;
  lektionenTotal: number;        // 51
  akademieTestBestanden: boolean;
  quizVersuche: number;
  quizBestScore: number;
  quizBestanden: boolean;
  // Bestellungen
  bestellungenTotal: number;
  bestellungenBezahlt: number;
  // Equipment
  equipmentStatus: Record<string, { hatEigenes: boolean; nachweisUrl?: string }>;
  // Coaching
  coachingBewertung: string;
  coachingTermin?: string;
  coachName?: string;
  // Intern
  vertragGeprueft: boolean;
  kleidungBestellt: boolean;
  lizenzenBereitgestellt: boolean;
  gewerbescheinUrl?: string;
  gewerbescheinSpaeter: boolean;
}
```

### 3. UI: `ContractorListView` komplett auf echte Daten umbauen

- Mock-Daten entfernen
- Hook `useAdminContractorList` nutzen
- Pipeline-Cards basierend auf `onboarding_status` (started, in_progress, mitfahrt, ready, deaktiviert)
- Jede Contractor-Karte zeigt:
  - Avatar + Name + Ort
  - Status-Badge (onboarding_substatus als menschenlesbares Label)
  - **Fortschrittsbalken** (completed_steps.length / 7)
  - Aktueller Schritt als Text
  - Akademie: "X/51 Lektionen" + Quiz-Status
  - Bestellungen: "X/Y bezahlt"

### 4. Detail-Ansicht: `ContractorDetailView` (neu)

Datei: `src/features/contractors/ui/ContractorDetailView.tsx`

Klick auf Contractor öffnet Detail-Ansicht (Sheet/Drawer oder inline) mit:

**Übersicht-Header:**
- Avatar, Name, Email, Telefon, Ort
- Status-Badge + Trainer-Badge
- Registriert seit (erstellt_am)

**7-Schritte-Fortschritt** (visueller Stepper):
```text
[✓ Profil] ─ [✓ Dokumente] ─ [✓ Bestellungen] ─ [→ Equipment] ─ [○ Akademie] ─ [○ Coaching] ─ [○ Nachweise]
```

**Detailsektionen (Accordion):**
1. **Dokumente**: Gewerbeschein-Status (URL-Link oder "Später")
2. **Bestellungen**: Tabelle mit Produkt, Betrag, Zahlungsstatus, Datum
3. **Equipment**: Liste mit hatEigenes/Nachweis-Foto-Link pro Item
4. **Akademie**: 
   - Fortschrittsbalken Lektionen (X/51)
   - Quiz-Versuche + Best-Score
   - Abschlusstest bestanden/nicht bestanden
5. **Coaching**: Bewertung, Termin, Coach-Name
6. **Intern-Flags**: Checkboxen (read-only) für vertrag_geprueft, kleidung_bestellt, lizenzen_bereitgestellt

### 5. Betroffene Dateien

| Datei | Aktion |
|-------|--------|
| Migration SQL | RLS-Policy für `contractor_bestellungen` admin SELECT |
| `src/features/contractors/hooks/useAdminContractorList.ts` | Neu |
| `src/features/contractors/ui/ContractorListView.tsx` | Komplett umschreiben |
| `src/features/contractors/ui/ContractorDetailView.tsx` | Neu |

### 6. Rollen-Matrix

| Rolle | Zugriff | Daten sichtbar |
|-------|---------|----------------|
| superadmin/admin | ✅ via ProtectedAdminRoute | Alle Contractors + alle Details |
| manager | ✅ | Alle Contractors + alle Details |
| user | ❌ AccessDeniedScreen | Nichts |

### 7. Edge Cases

- Contractor ohne profile_id → Fallback "Kein Profil"
- Contractor ohne Fortschritts-Daten → 0/51 anzeigen
- Deaktivierte Contractors → Status "Deaktiviert" Badge, weiterhin sichtbar
- Trainer → eigenes Badge, bypass-Info
- Leere Bestellungen → "Keine Bestellungen"
- Equipment-Status ist JSONB → defensives Parsing

