

## Fix: RPC und Hooks an korrekten FK anpassen

### Kernproblem

Die RPC `accept_pool_order` schreibt `auth.uid()` (= profile_id) direkt in `zugewiesener_techniker_id`. Aber der FK zeigt auf `contractor_onboarding(id)` -- das ist eine andere ID. Die Hooks filtern ebenfalls mit `auth.uid()` statt mit der contractor_onboarding-ID.

**Der FK ist korrekt so wie er ist.** Die RPC und Hooks muessen angepasst werden.

### Aenderungen

#### 1. SQL-Migration: RPC `accept_pool_order` anpassen

Die RPC muss zuerst die `contractor_onboarding.id` fuer den aktuellen User nachschlagen:

```sql
CREATE OR REPLACE FUNCTION thermocheck.accept_pool_order(p_termin_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
DECLARE
  v_auftrag_id UUID;
  v_contractor_id UUID;
  v_current_techniker UUID;
  v_pipeline_status TEXT;
BEGIN
  -- NEU: contractor_onboarding-ID fuer aktuellen User ermitteln
  SELECT id INTO v_contractor_id
  FROM thermocheck.contractor_onboarding
  WHERE profile_id = auth.uid();

  IF v_contractor_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 
      'Kein Contractor-Profil gefunden');
  END IF;

  -- Termin -> Auftrag-ID
  SELECT thermocheck_auftrag_id INTO v_auftrag_id
  FROM thermocheck.thermocheck_terminvorschlaege
  WHERE id = p_termin_id;

  IF v_auftrag_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Termin nicht gefunden');
  END IF;

  -- Auftrag sperren + validieren
  SELECT zugewiesener_techniker_id, pipeline_status
  INTO v_current_techniker, v_pipeline_status
  FROM thermocheck.thermocheck_auftraege
  WHERE id = v_auftrag_id
  FOR UPDATE;

  IF v_pipeline_status != 'termin_abwarten' THEN
    RETURN json_build_object('success', false, 'error', 
      'Auftrag ist nicht mehr im Pool');
  END IF;

  IF v_current_techniker IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 
      'Auftrag bereits vergeben');
  END IF;

  -- GEAENDERT: contractor_onboarding-ID statt auth.uid()
  UPDATE thermocheck.thermocheck_auftraege
  SET zugewiesener_techniker_id = v_contractor_id
  WHERE id = v_auftrag_id;

  RETURN json_build_object(
    'success', true,
    'auftrag_id', v_auftrag_id,
    'contractor_id', v_contractor_id
  );
END;
$$;
```

#### 2. Hook `useMyAssignedOrders` anpassen

Aktuell filtert der Hook mit `zugewiesener_techniker_id=eq.{userId}` wobei userId = auth.uid(). Das muss ueber contractor_onboarding gehen:

1. Zuerst `contractor_onboarding` laden wo `profile_id = auth.uid()`
2. Dann Auftraege filtern mit `zugewiesener_techniker_id=eq.{contractorOnboardingId}`

#### 3. Daten zuruecksetzen (falls noetig)

Falls die vorherige manuelle Korrektur bereits ausgefuehrt wurde (profile_id statt onboarding-ID eingetragen), muss das zurueckgesetzt werden:

```sql
-- Falls bereits auf profile_id geaendert: zurueck zur contractor_onboarding-ID
UPDATE thermocheck.thermocheck_auftraege
SET zugewiesener_techniker_id = '643d967e-b30e-437c-a4d9-312bf8a329cd'
WHERE id = 'c9f59cdc-c64e-485d-8573-3e4b0e824d54'
  AND zugewiesener_techniker_id = 'c0893b68-bc58-4694-94dc-9d991efdec12';
```

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| SQL-Migration | RPC `accept_pool_order` anpassen: Lookup contractor_onboarding.id statt auth.uid() |
| `src/hooks/useMyAssignedOrders.ts` | Erst contractor_onboarding-ID laden, dann damit filtern |
| Manuelles SQL (optional) | Daten zuruecksetzen falls schon geaendert |

### Warum dieser Ansatz besser ist

| Kriterium | FK auf profiles (mein alter Vorschlag) | FK auf contractor_onboarding (dein Ansatz) |
|---|---|---|
| Domain-Kontext | Verloren -- jeder User koennte zugewiesen werden | Nur ongeboardete Techniker moeglich |
| Multi-System | Problematisch -- gleiche ID in allen Systemen | Sauber getrennt pro Software |
| Datenintegritaet | Schwaecher | Staerker (FK garantiert gueltigen Contractor) |
| Komplexitaet | Einfacher (kein Lookup noetig) | Ein Lookup-Step mehr in RPC/Hooks |
| Enterprise-Standard | Nein | Ja (SAP, Salesforce, etc.) |

Der eine Extra-Lookup ist ein minimaler Preis fuer die sauberere Architektur.

