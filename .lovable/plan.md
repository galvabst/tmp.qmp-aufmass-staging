

# Testaccount livab32434@advarm.com freischalten

## Ist-Zustand

| Feld | Wert |
|---|---|
| completed_steps | profil, dokumente, bestellungen, equipment, akademie, coaching (6/7) |
| current_step | nachweise |
| onboarding_status | mitfahrt |
| onboarding_substatus | mitfahrt_gebucht |
| trainer_freigabe | true |
| vertrag_geprueft_intern | true |
| kleidung_bestellt_intern | true |
| lizenzen_bereitgestellt_intern | true |

## Was fehlt

Nur der letzte Schritt `nachweise` muss in `completed_steps` aufgenommen werden. Danach muss `onboarding_status` auf `ready` stehen, damit der `isReady`-Check im Frontend greift.

## Loesung: Eine SQL-Migration

```text
UPDATE thermocheck.contractor_onboarding
SET 
  completed_steps = ARRAY['profil','dokumente','bestellungen','equipment','akademie','coaching','nachweise'],
  current_step = 'nachweise',
  onboarding_status = 'ready',
  onboarding_substatus = 'bereit'
WHERE profile_id = 'd88929cb-5156-45e1-8082-b4c22c42c472';
```

Falls der `sync_onboarding_status`-Trigger den Status automatisch auf `ready` setzt wenn alle 7 Schritte komplett sind, wird das UPDATE konsistent sein. Falls der Trigger einen ungueltigen Substatus-Wert ablehnt, wird `onboarding_substatus` auf den korrekten ENUM-Wert gesetzt (muss ggf. geprueft werden -- `bereit` vs. anderer Wert).

## Validierung des isReady-Checks

Der Hook `useContractorOnboardingStatus` prueft:
1. `onboarding_status = 'ready'` -- wird gesetzt
2. `trainer_freigabe = true` -- bereits true
3. `vertrag_geprueft_intern = true` -- bereits true
4. `kleidung_bestellt_intern = true` -- bereits true
5. `lizenzen_bereitgestellt_intern = true` -- bereits true

Alle Bedingungen erfuellt. Nach der Migration wird der Pool sofort sichtbar.

## Kein Frontend-Code noetig

Reine Daten-Korrektur in einer Zeile.

