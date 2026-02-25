

# Fix: RescheduleModal - Accept schlaegt fehl mit "Auftrag bereits vergeben"

## Problem-Analyse

Der `RescheduleModal` ruft beim Annehmen `accept_pool_order` auf. Diese RPC hat eine Pruefung:

```sql
IF v_current_techniker IS NOT NULL THEN
  RETURN json_build_object('success', false, 'error', 'Auftrag bereits vergeben');
END IF;
```

Bei Reschedules ist der Auftrag aber **bereits dem Techniker zugewiesen** (`zugewiesener_techniker_id` ist gesetzt). Deswegen scheitert die Annahme. Das ist korrekt fuer Pool-Auftraege, aber falsch fuer Reschedules.

**Aktuelle Datenbank-Situation (live verifiziert):**
- Auftrag `a5fd85a1` hat `pipeline_status = 'termin_abwarten'` UND `zugewiesener_techniker_id = d27fc078` (= Thomas Wermke Auftrag)
- 3 Terminvorschlaege mit `status = 'vorgeschlagen'` existieren
- `accept_pool_order` schlaegt fehl, weil der Techniker-Check blockt

## Loesung

Neue dedizierte RPC `accept_thermocheck_reschedule` fuer den Reschedule-Anwendungsfall. Separate RPC statt Modifikation von `accept_pool_order`, weil die Semantik unterschiedlich ist:
- **Pool**: Unzugewiesener Auftrag → Techniker zuweisen + annehmen
- **Reschedule**: Bereits zugewiesener Auftrag → Nur Termin wechseln

### Neue RPC: `thermocheck.accept_thermocheck_reschedule(p_termin_id uuid)`

Logik:
1. `contractor_onboarding.id` fuer `auth.uid()` ermitteln
2. `thermocheck_auftrag_id` vom Termin laden
3. Auftrag sperren (`FOR UPDATE`) → Race-Condition-Schutz
4. Validieren: `zugewiesener_techniker_id = v_contractor_id` (muss dem aufrufenden Techniker gehoeren)
5. Validieren: `pipeline_status = 'termin_abwarten'`
6. Gewaehlten Termin: `status = 'angenommen'`, `angenommen_von = auth.uid()`, `angenommen_am = now()`
7. Andere Vorschlaege: `status = 'abgelehnt'`
8. `pipeline_status` auf `wc1_durchfuehren` setzen
9. `zugewiesener_techniker_id` bleibt unveraendert

### Public Wrapper

```sql
CREATE FUNCTION public.accept_thermocheck_reschedule(p_termin_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN RETURN thermocheck.accept_thermocheck_reschedule(p_termin_id); END; $$;
```

### Decline-RPC Pruefung

`decline_thermocheck_reschedule` wurde verifiziert und funktioniert korrekt:
- Prueft `zugewiesener_techniker_id = v_contractor_id` (Ownership-Check)
- Setzt alle `vorgeschlagen` auf `abgelehnt`
- Loescht `zugewiesener_techniker_id` → Auftrag erscheint im Pool (`usePoolOrders` filtert auf `zugewiesener_techniker_id=is.null`)
- `pipeline_status` bleibt `termin_abwarten` → Pool-Bedingung erfuellt

### Frontend: `src/components/RescheduleModal.tsx`

`handleAccept` aendern: `accept_thermocheck_reschedule` statt `accept_pool_order` aufrufen.

### Types: `src/integrations/supabase/types.ts`

Neue RPC-Signatur `accept_thermocheck_reschedule` hinzufuegen (gleiche Signatur wie `accept_pool_order`).

## Rollen-Matrix

| Rolle | accept_thermocheck_reschedule | Ergebnis |
|---|---|---|
| user (zugewiesener Techniker) | Ja | Erfolgreich - eigener Auftrag |
| user (anderer Techniker) | Nein | "Auftrag nicht zugewiesen" |
| user (ohne contractor_onboarding) | Nein | "Kein Contractor-Profil" |
| admin/manager | Nein | Kein contractor_onboarding-Eintrag |

| Rolle | decline_thermocheck_reschedule | Ergebnis |
|---|---|---|
| user (zugewiesener Techniker) | Ja | Techniker entfernt, zurueck im Pool |
| user (anderer Techniker) | Nein | "nicht zugewiesen" |

## Edge Cases

| Szenario | Handling |
|---|---|
| Techniker nimmt an, aber Auftrag wurde parallel von Admin umgewiesen | FOR UPDATE Lock + ownership-check blockt |
| 3 Vorschlaege, 1 angenommen | 1x angenommen, 2x abgelehnt |
| 1 Vorschlag | 1x angenommen, 0x abgelehnt |
| Termin-ID existiert nicht | "Termin nicht gefunden" |
| Auftrag nicht mehr in termin_abwarten | "Auftrag nicht im Reschedule-Status" |
| Doppelklick / zweimal annehmen | FOR UPDATE + status-check blockiert |

## Datenmigration

Keine noetig. Der einzige aktive Reschedule-Auftrag (`a5fd85a1`) hat korrekte Daten. Nach Deploy der neuen RPC funktioniert der Annehmen-Flow sofort.

## Dateien

| Datei | Aenderung |
|---|---|
| SQL Migration | Neue RPC `thermocheck.accept_thermocheck_reschedule` + public Wrapper |
| `src/components/RescheduleModal.tsx` | `accept_pool_order` → `accept_thermocheck_reschedule` |
| `src/integrations/supabase/types.ts` | Neue RPC-Signatur |
| `.lovable/validation-reschedule-accept.md` | Validierungsdokumentation |

