

## Plan: Automatische Status-Transitions + Trainer-Flag Fix

### Problem-Analyse

Drei Lücken im System:

1. **`onboarding_status` bleibt ewig auf `invited`**: Der RPC `update_contractor_onboarding_progress` aktualisiert nur `current_step` und `completed_steps`, aber NICHT `onboarding_status`. Die 7 ENUM-Werte (`angelegt`, `invited`, `in_progress`, `started`, `ready`, `blocked`, `deaktiviert`) werden nie automatisch gesetzt.

2. **`onboarding_substatus` bleibt ewig auf `neu_angelegt`**: Die 11 ENUM-Werte (`stammdaten_erfasst`, `vertrag_geprueft`, `akademie_gestartet`, `akademie_abgeschlossen` etc.) werden nirgends automatisch gesetzt.

3. **Till Ibendorf ist in der DB nicht als Trainer markiert**: `is_trainer = false` bei allen 6 Usern. Das DB-Feld wurde nie aktualisiert.

---

### Loesung: Automatische Status-Transitionen via DB-Trigger

Anstatt jeden einzelnen RPC anzupassen, wird ein **PostgreSQL-Trigger** auf `contractor_onboarding` erstellt, der bei jedem UPDATE automatisch `onboarding_status` und `onboarding_substatus` basierend auf den tatsaechlichen Fortschrittsdaten ableitet.

#### Status-Mapping-Logik:

```text
onboarding_status    Bedingung
──────────────────────────────────────────────────────
invited              Kein current_step, keine completed_steps
started              current_step gesetzt ODER mindestens 1 completed_step
in_progress          Mindestens 3 completed_steps
ready                Alle 7 Schritte completed + trainer_freigabe + alle intern-Checks
blocked/deaktiviert  Nur manuell setzbar (Admin-Eingriff)
```

```text
onboarding_substatus    Bedingung
──────────────────────────────────────────────────────
neu_angelegt            Keine Fortschrittsdaten
stammdaten_erfasst      'profil' in completed_steps
vertrag_geprueft        vertrag_geprueft_intern = true
kleidung_bestellen      'bestellungen' in completed_steps
akademie_gestartet      current_step = 'akademie'
akademie_abgeschlossen  akademie_test_bestanden = true
(weitere nach Bedarf)
```

#### SQL-Migration:

1. **Trigger-Funktion** `thermocheck.sync_onboarding_status()`:
   - Wird bei jedem UPDATE auf `contractor_onboarding` ausgefuehrt
   - Berechnet `onboarding_status` und `onboarding_substatus` aus den Ist-Daten
   - Ueberschreibt NICHT manuell gesetzte `blocked`/`deaktiviert`-Status

2. **Bestehende Daten korrigieren**: Ein einmaliges UPDATE auf alle 6 Eintraege, das den korrekten Status basierend auf den vorhandenen `completed_steps` setzt:
   - Maximale Mustermann: Hat alle 7 Schritte + ready + trainer_freigabe → bleibt `ready`, substatus `akademie_abgeschlossen`
   - Marius Hofmann & THCler: 4 completed steps, current_step = akademie → `in_progress`, substatus `akademie_gestartet`
   - Die anderen 3 ohne Fortschritt → bleiben `invited`, substatus `neu_angelegt`

3. **Till Ibendorf als Trainer markieren**:
   ```
   UPDATE thermocheck.contractor_onboarding 
   SET is_trainer = true 
   WHERE profile_id = 'c0893b68-bc58-4694-94dc-9d991efdec12';
   ```

#### Keine Frontend-Aenderungen noetig

Der Trigger arbeitet rein auf DB-Ebene. Alle bestehenden RPCs (`update_contractor_onboarding_progress`, `update_contractor_gewerbeschein`, etc.) loesen den Trigger automatisch aus. Die Frontend-Hooks lesen `onboarding_status` bereits korrekt aus.

---

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| Neue SQL-Migration | Trigger-Funktion `sync_onboarding_status`, Daten-Korrektur, Till als Trainer |
| Keine Frontend-Dateien | Trigger arbeitet transparent auf DB-Ebene |

### Edge Cases

| Szenario | Verhalten |
|---|---|
| Admin setzt manuell `blocked` | Trigger ueberschreibt `blocked`/`deaktiviert` NICHT |
| User macht keinen Fortschritt | Status bleibt `invited` |
| User schliesst alle Schritte ab, kein trainer_freigabe | Status = `in_progress` (nicht `ready`) |
| Trigger bei INSERT (neuer Contractor) | Status = `invited`, substatus = `neu_angelegt` (Default) |

