## Ziel
Marius Hofmann (`mariuhofma@gmail.com`, onboarding `d6c4678f-7884-4911-9e45-a135da7411a4`) manuell als komplett freigegeben markieren — "der Mann ist durch".

## Aktueller DB-Stand
- `onboarding_status = mitfahrt`
- `current_step = nachweise`
- `coaching_bewertung = nicht_bestanden`  ← blockiert
- `trainer_freigabe = false`
- `praxistest_freigabe = false`
- `einweisung_freigabe = false`

## Geplante Datenänderung (eine Migration / Insert-RPC-freier Update)

UPDATE `thermocheck.contractor_onboarding` WHERE `id = 'd6c4678f-7884-4911-9e45-a135da7411a4'`:
- `coaching_bewertung = 'bestanden'`
- `coaching_bewertung_am = now()` (falls null)
- `trainer_freigabe = true`, `trainer_freigabe_am = now()`
- `praxistest_freigabe = true`, `praxistest_freigabe_am = now()`, `praxistest_eingereicht_am = COALESCE(praxistest_eingereicht_am, now())`
- `praxistest_scan_freigegeben = true`, `praxistest_video_freigegeben = true`
- `einweisung_freigabe = true`
- `akademie_test_bestanden = true`
- `intro_video_watched = true`, `outro_video_watched = true`
- `current_step = 'fertig'` (bzw. höchster Step), `completed_steps` erweitern um `coaching`, `nachweise`, `praxistest`, `einweisung`
- `onboarding_status = 'ready'`
- `aktualisiert_am = now()`

Keine Code-Änderungen — reine Datenkorrektur, analog zum Vorgehen bei Michel.

## Rückfrage
Falls du nur Coaching/Trainer-Freigabe willst (also nicht den ganzen Onboarding-Rest), sag Bescheid — dann setze ich nur `coaching_bewertung=bestanden` + `trainer_freigabe=true` und schiebe ihn auf `current_step='nachweise'`, alles weitere durchläuft er regulär.
