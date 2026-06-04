## Problem

Bereits einsatzbereite Techniker (Thorsten u.a.) werden vom `PflichtVideoOverlay` blockiert, sobald im Akademie-Backend eine neue Lektion als Pflicht („nur_fuer_neue=false") markiert wird. Sie können die App nicht mehr nutzen, bis sie das Video gesehen haben.

Das Overlay greift aktuell für jeden `onboarding_status='ready'`-Techniker, dessen `completed_steps` den Eintrag `'akademie'` nicht enthält oder der die spezifische Lektion noch nicht abgeschlossen hat.

## Lösung (Frontend only)

Pflicht-Video-Gating komplett deaktivieren, sobald ein Techniker `einsatzbereit` ist. Pflichtvideos sind dann ein reines Onboarding-Konstrukt; nachträglich hinzugefügte Pflicht-Lektionen blockieren niemanden mehr.

### Änderung

**`src/hooks/usePflichtVideos.ts`**
- Hook gibt sofort `[]` zurück, sobald `onboardingStatus === 'ready'` ist – unabhängig von `completed_steps` oder `contractor_akademie_lektions_fortschritt`.
- `enabled` entsprechend angepasst: Query nur noch laufen lassen, wenn Status ≠ `'ready'` (de facto deaktiviert sie sich, weil das Overlay ohnehin nur bei `'ready'` getriggert würde → effektiv kein Overlay mehr).

Da das Overlay in `src/pages/Index.tsx` nur rendert, wenn `pflichtVideos.length > 0`, verschwindet der Block automatisch. Keine weiteren Aufruferänderungen nötig.

### Was bleibt unverändert

- Onboarding-Flow (Academy als Schritt) – funktioniert weiter, weil dort Status noch nicht `'ready'` ist.
- Admin kann weiter Lektionen als Pflicht markieren – sie gelten nur für neue Techniker im Onboarding.
- DB-Schema, RPCs, RLS: keine Änderungen.

### Validierung

- `Index.tsx` reload: Thorsten (ready, ohne Lektionsfortschritt) sieht kein Overlay.
- Neuer Techniker (Status `onboarding`) sieht weiterhin Pflicht-Videos im Onboarding-Schritt.
