
## Ziel
Beim Klick auf ein Akademie‑Modul wird aktuell eine alte (Mock-)ID wie `up-1-1` in die URL geschrieben (`/akademie/modul/up-1-1`). Seitdem das `thermocheck`‑Schema live genutzt wird, erwartet Supabase an dieser Stelle aber eine echte UUID. Ergebnis: `400 Bad Request` und die Seite zeigt „Modul nicht gefunden“.

## Was gerade passiert (Ursache)
- Die **Akademie-Liste** in der Onboarding-Ansicht kommt aus `useOnboardingState` → `state.akademieHauptmodule`.
- `useOnboardingState` lädt zuerst aus `localStorage` (Key: `thermocheck_onboarding_state_v2`).
- In deinem Browser ist dort noch eine **alte, gespeicherte Akademie-Struktur** mit IDs wie `up-1-1`.
- `AcademyStep` navigiert dann konsequent zu:
  - `navigate(/akademie/modul/${unterpunkt.id})` → also `/akademie/modul/up-1-1`
- `AkademieModul` ruft `useAkademieUnterpunkt(modulId)` auf und Supabase versucht `id = 'up-1-1'` (UUID-Spalte) zu filtern → **400**.

## Lösungsidee (ohne dass du manuell im Browser etwas löschen musst)
Wir bauen eine „Selbstheilung“ ein:
1) **Automatische Migration/Reset**: Wenn gespeicherte Akademie‑IDs keine UUIDs sind, wird nur der Akademie‑Teil aus dem localStorage-State verworfen.
2) **Hydrierung aus der DB**: Die echten Module/Lektionen werden per `useAkademieContent()` aus `thermocheck.contractor_akademie_*` geladen und in den Onboarding‑State übernommen (mit Merge, damit Fortschritt nicht verloren geht).
3) **Schutz im Modul‑Screen**: Wenn jemand (oder ein alter Bookmark) trotzdem `/akademie/modul/up-1-1` aufruft, zeigen wir eine klare Meldung „Veralteter Link“ + Button „Daten aktualisieren“, der intern den Cache repariert und zurück zur Akademie führt.

---

## Geplante Änderungen (konkret)

### A) UUID-Check Helper einführen
**Datei:** `src/lib/utils.ts` (oder kleine neue Utility-Datei)
- Funktion `isUuid(value: string): boolean` (Regex-basiert).
- Nutzen wir an mehreren Stellen für sichere Entscheidungen.

### B) Onboarding-State: gespeicherte Akademie-Daten validieren & migrieren
**Datei:** `src/hooks/useOnboardingState.ts`
1. In `loadPersistedState(...)`:
   - Nach dem JSON-Parse prüfen:
     - Gibt es `parsed.akademieHauptmodule`?
     - Haben `hauptmodul.id` und besonders `unterpunkte[].id` ein UUID-Format?
   - Wenn nicht UUID:
     - Setze `akademieHauptmodule` auf `initial.akademieHauptmodule` (aktuell leer)
     - Optional: Setze `akademieModule` (Legacy) ebenfalls zurück
     - Wichtig: Alle anderen Onboarding-Felder (Profil, Dokumente, Bestellungen etc.) bleiben erhalten.
   - Ziel: Alte `up-...` IDs verschwinden automatisch.

### C) Onboarding-State: Akademie aus der DB laden und in State „hydratisieren“
**Dateien:**  
- `src/hooks/useOnboardingState.ts`  
- `src/hooks/useAkademieContent.ts` (nur falls kleine Anpassungen nötig sind)

Vorgehen:
1. In `useOnboardingState` zusätzlich `useAkademieContent()` aufrufen.
2. Wenn DB-Daten geladen sind (`data` vorhanden):
   - `setState(prev => ...)` und `prev.akademieHauptmodule` mit DB-Inhalt ersetzen/mergen:
     - Module/Lektionen aus DB sind der „Katalog“
     - `abgeschlossen` und `abgeschlossenAt` wird aus `prev` übernommen (wenn IDs matchen)
3. Schutz gegen Endlos-Updates:
   - Nur hydratisieren, wenn:
     - `prev.akademieHauptmodule` leer ist, oder
     - IDs/Anzahl anders sind (ein einfacher Vergleich der ID-Listen reicht)

Ergebnis:
- Nach einem Reload kommen die Module aus der DB, und die Klick-URLs sind UUIDs.

### D) Akademie-Modulseite robuster machen (alte URL abfangen)
**Datei:** `src/pages/AkademieModul.tsx`
1. Vor dem Hook-Aufruf/Rendering prüfen:
   - Wenn `modulId` fehlt oder `!isUuid(modulId)`:
     - Zeige spezielle „Veralteter Link / Daten aktualisieren“ UI
     - Button:
       - löscht/cleart gezielt `thermocheck_onboarding_state_v2` ODER nur den akademie-Teil (je nach gewünschtem Verhalten)
       - navigiert nach `/` (Onboarding)
2. Optional zusätzlich:
   - `useAkademieUnterpunkt` nur `enabled`, wenn UUID, damit keine 400er Requests mehr entstehen.

### E) (Optional, aber empfehlenswert) LocalStorage-Key Konsistenz in Index-Seite
**Datei:** `src/pages/Index.tsx`
- `Index.tsx` liest aktuell noch `thermocheck_onboarding_state` (ohne `_v2`) für Profil/Status.
- Das ist inkonsistent und kann später für Verwirrung sorgen.
- Plan: auf `thermocheck_onboarding_state_v2` umstellen (oder bewusst beide unterstützen, mit Fallback).

---

## Testplan (End-to-End)
1. Öffnen der App und zum Onboarding → Schritt „Akademie“ navigieren.
2. Prüfen, dass die Akademie-Liste **nach Reload** weiterhin erscheint (jetzt aus DB).
3. Auf eine Lektion klicken:
   - URL muss wie `/akademie/modul/<uuid>` aussehen (nicht `up-1-1`).
   - Seite lädt Inhalte ohne „Modul nicht gefunden“.
4. Direkt alte URL testen:
   - `/akademie/modul/up-1-1`
   - Erwartung: „Veralteter Link“ UI + „Daten aktualisieren“ Button, kein 400-Request-Spam.
5. Regression-Check: Profil/Dokumente/Bestellungen bleiben unverändert gespeichert.

---

## Risiken / Hinweise
- Falls auf den `thermocheck.contractor_akademie_*` Tabellen **RLS aktiv** ist und keine SELECT-Policy existiert, sehen wir nach der Migration ggf. **401/403** statt 400. Dann müssten wir eine sichere Read-Policy ergänzen (für Trainingsinhalte meist ok).
- Der Console-Warnhinweis „Function components cannot be given refs“ ist unabhängig vom 400/UUID-Problem. Kann man separat fixen, sobald das Laden stabil ist.

---

## Feature‑Vorschläge (als nächstes sinnvoll)
1) End-to-End prüfen: Akademie öffnen → Lektion starten → als abgeschlossen markieren → zurück ins Onboarding, Fortschritt sichtbar.  
2) Akademie-Fortschritt in Supabase speichern (statt nur localStorage), damit es geräteübergreifend funktioniert.  
3) Admin-Ansicht zum Pflegen von Modulen/Lektionen/Quizfragen im `thermocheck` Schema.  
4) Sequenzielles Unlocking wieder aktivieren (aktuell ist alles „TEMP: unlocked“).  
5) Besseres Error-Handling: Ladezustände + „Keine Inhalte vorhanden“ UI, falls DB leer ist.
