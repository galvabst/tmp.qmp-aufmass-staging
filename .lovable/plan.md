

# VOT-Formular unabhängig vom Pipeline-Status zugänglich machen

## Analyse: Was blockiert aktuell?

### Problem 1: UI-Button versteckt (HAUPTPROBLEM)
In `TechnicianOrderDetail.tsx` Zeile 599:
```typescript
{(isBookedOrder || isInProgress) && (
  <Button onClick={() => navigate(`/thermocheck/aufmass/${order.auftragId}`)}>
    Aufmaß-Formular öffnen
  </Button>
)}
```
Orders mit Status `submitted`, `in_review`, `rework_required` oder `approved` sehen den Button **nicht**. Der Contractor kann das Formular nicht erreichen.

### Problem 2: Check-in RPC hat Pipeline-Guard
`checkin_thermocheck_auftrag` erlaubt nur:
- `vot_formular_abfragen`
- `vot_formular_in_verzug`  
- `termin_abwarten`

Das bedeutet: Wenn ein Auftrag z.B. in "Verzögerung" steht (andere pipeline_status-Werte), kann der Contractor weder einchecken noch das Formular öffnen.

### Kein Problem: Formular-Seite selbst
`AufmassFormPage.tsx` hat **keinen Pipeline-Status-Guard**. `isReadOnly` prüft nur `formular.status === 'abgeschlossen'`. Die Seite funktioniert für jeden, der sie erreicht.

### Kein Problem: Formular-Upsert (DB)
`useUpsertVotFormular` schreibt direkt auf `thermocheck_vot_formulare` ohne Pipeline-Check. Kein Blocker.

## User Stories

| Story | Flow |
|-------|------|
| Contractor öffnet Formular bei `booked` | Klick → navigate → Form → funktioniert ✓ |
| Contractor öffnet Formular bei `in_progress` | Klick → navigate → Form → funktioniert ✓ |
| Contractor öffnet Formular bei `submitted` | Button fehlt → **BLOCKIERT** |
| Contractor öffnet Formular bei `rework_required` | Button fehlt → **BLOCKIERT** |
| Contractor öffnet Formular bei `in_verzug` (pipeline) | Check-in scheitert → bleibt `booked` → Button sichtbar, aber Check-in geht nicht → **TEIL-BLOCKIERT** |

## Umsetzungsplan

### 1. UI: Button-Bedingung erweitern
**Datei:** `src/components/TechnicianOrderDetail.tsx`

Zeile 599 ändern von:
```typescript
{(isBookedOrder || isInProgress) && (
```
zu:
```typescript
{!isPoolOrder && (
```

Das zeigt den Button für ALLE zugewiesenen Aufträge (booked, in_progress, submitted, in_review, rework_required, approved). Bei `approved` und `submitted` wird das Formular im Read-Only-Modus geöffnet (weil `formular.status === 'abgeschlossen'`), was korrekt ist — der Contractor kann nachschauen, was er eingereicht hat.

### 2. Button-Label dynamisch
Wenn der Auftrag submitted/approved ist, sollte der Button "Formular ansehen" statt "Formular öffnen" sagen:

```typescript
{!isPoolOrder && (
  <Button ...>
    <ClipboardList className="w-5 h-5 mr-2" />
    {isSubmitted || isApproved ? 'Aufmaß-Formular ansehen' : 'Aufmaß-Formular öffnen'}
  </Button>
)}
```

### 3. Check-in RPC: Pipeline-Guard erweitern
**Migration:** `checkin_thermocheck_auftrag` erweitern um weitere erlaubte Statuses.

Aktuell erlaubt: `vot_formular_abfragen`, `vot_formular_in_verzug`, `termin_abwarten`

Muss auch erlauben: `rework_required` (für Nacharbeit), und potenziell `vot_auswertung_ag` (wenn Formular nochmal eingereicht werden muss nach Rework).

Aber ACHTUNG: Die `rework_required`-Logik wird über `handleStartRework` → `checkin_thermocheck_auftrag(phase='nachbearbeitung')` angestossen. Wenn der pipeline_status dann z.B. auf `vot_auswertung_ag` steht (weil das Formular schon eingereicht wurde), scheitert der Check-in.

Erweiterung auf:
```sql
IF coalesce(v_row.pipeline_status::text, 'NULL') NOT IN (
  'vot_formular_abfragen', 'vot_formular_in_verzug', 'termin_abwarten',
  'vot_auswertung_ag', 'ergebnis_abwarten'
) THEN
  RETURN jsonb_build_object('success', false, 'error', ...);
END IF;
```

Dies erlaubt Nacharbeit auch bei bereits eingereichten Aufträgen.

### 4. AufmassFormPage: isReadOnly-Logik prüfen
Aktuell: `isReadOnly = formular.status === 'abgeschlossen'`

Bei Nacharbeit (`rework_required`) muss das Formular **editierbar** sein. Der Checkout-RPC setzt `eingereicht_am` und `pipeline_status = 'vot_auswertung_ag'`, aber der Formular-Status bleibt `abgeschlossen`.

Für Nacharbeit brauchen wir eine Reset-Logik: Wenn der Admin den Auftrag auf `rework_required` setzt, muss der Formular-Status zurück auf `entwurf` gesetzt werden, damit der Contractor editieren kann.

Prüfung nötig: Wird das aktuell schon im QG-Flow gemacht? Ich muss den QG-Flow prüfen.

## Edge Cases

| Case | Verhalten |
|------|-----------|
| Formular bei `approved` öffnen | Read-Only ✓ (formular.status = abgeschlossen) |
| Formular bei `rework_required` | Muss editierbar sein → formular.status muss auf 'entwurf' resetten |
| Formular bei `submitted` öffnen | Read-Only ✓ |
| Formular bei `booked` (kein Check-in) | Editierbar ✓ (wie bisher) |
| Formular bei `in_verzug` Pipeline | Check-in erlaubt → Editierbar ✓ |
| Direkte URL /thermocheck/aufmass/:id | Funktioniert unabhängig vom Button (kein Guard) |

## Rollen-Matrix

| Aktion | Contractor (User) | Admin |
|--------|-------------------|-------|
| Formular öffnen (jeder Status) | ✓ (nach Fix) | n/a |
| Formular editieren | Nur wenn formular.status ≠ abgeschlossen | n/a |
| Formular einreichen | Via Nachbearbeitung-Checkout | n/a |
| Formular auf Nacharbeit setzen | ✗ | ✓ (QG-Flow) |

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/TechnicianOrderDetail.tsx` | Button-Condition + dynamisches Label |
| DB-Migration | `checkin_thermocheck_auftrag` Pipeline-Guard erweitern |
| `.lovable/validation-aufmass-upload.md` | Update mit neuen Edge Cases |

## Offener Punkt: Rework-Formular-Reset

Muss vor Implementierung geprüft werden: Setzt der QG-Rework-Flow den `thermocheck_vot_formulare.status` zurück auf `entwurf`? Falls nicht, muss das in die Migration mit rein (Trigger oder QG-RPC-Update).

