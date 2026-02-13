

## Video-Fortschritt persistieren -- Kein Fortschrittsverlust mehr bei Seitenreloads

### Problem

Wenn ein Nutzer ein laengeres Akademie-Video anschaut, geht bei jedem Page-Reload der komplette Videofortschritt verloren. Die `watchedSeconds` und `maxReachedTime` leben ausschliesslich im React-State (`useState`/`useRef`) und werden nirgendwo persistiert. Moegliche Reload-Ursachen: Lovable Preview HMR, Browser-Tab-Wechsel, Auth-Token-Refresh, oder sonstige Navigations-Events.

### Loesung: Duale Persistierung (localStorage + DB)

Video-Fortschritt wird auf zwei Ebenen gespeichert:

1. **localStorage** -- Schnell, bei jedem Timeupdate (~alle 2-3 Sekunden) aktualisiert. Ueberlebt Page-Reloads sofort.
2. **Datenbank** -- Die bestehende Spalte `video_progress_seconds` in `contractor_akademie_lektions_fortschritt` wird als langfristiger Speicher genutzt (alle 15 Sekunden + bei Tab-Wechsel).

Beim Laden einer Lektion wird der hoechste Wert aus localStorage und DB genommen und der Player per `player.setCurrentTime()` an die gespeicherte Position gespult.

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/hooks/useVideoProgress.ts` | `useBunnyPlayerProgress` erhaelt neuen Parameter `lessonId`, persistiert `watchedSeconds` + `maxReachedTime` in localStorage, stellt beim Mount wieder her, spult Player nach `ready`-Event an gespeicherte Position |
| `src/pages/AkademieModul.tsx` | Uebergibt `lessonId` (= `unterpunkt.id`) an `useBunnyPlayerProgress`, speichert periodisch in DB via `video_progress_seconds` |
| `src/hooks/useAkademieFortschritt.ts` | Neue Funktion `useSaveVideoProgress()` -- upsert in `contractor_akademie_lektions_fortschritt` mit throttle (alle 15s) |
| `src/components/onboarding/IntroVideo.tsx` | Uebergibt `lessonId` = `'intro-video'` an den Hook |

### Technische Details

**1. localStorage-Persistierung in `useBunnyPlayerProgress`**

- Neuer optionaler Parameter: `lessonId?: string`
- Storage-Key: `akademie_video_progress:{lessonId}`
- Gespeicherte Daten: `{ watchedSeconds: number, maxReachedTime: number, timestamp: number }`
- Schreiben: Bei jedem `timeupdate`-Event (Bunny Player feuert ~4x/sec, wir throtteln auf alle 3 Sekunden)
- Lesen: Einmalig bei Hook-Mount, Werte werden als Initialwerte fuer `watchedSeconds` und `maxReachedTimeRef` gesetzt
- Nach `player.on('ready')`: `player.setCurrentTime(savedMaxReachedTime)` um den Bunny Player an die richtige Stelle zu spulen
- TTL: Eintraege aelter als 7 Tage werden beim Laden ignoriert (Cleanup)

**2. DB-Persistierung in `useSaveVideoProgress`**

- Nutzt `thermocheck.contractor_akademie_lektions_fortschritt.video_progress_seconds` (existiert bereits!)
- Upsert-Logik: `INSERT ... ON CONFLICT (contractor_id, lektion_id) DO UPDATE SET video_progress_seconds = $1`
- Throttle: Maximal alle 15 Sekunden + einmal bei `visibilitychange` (Tab-Wechsel) + bei `beforeunload`
- Wert wird beim Laden der Lektion aus DB geholt (bereits via `useAkademieFortschritt` verfuegbar, muss nur `video_progress_seconds` mitlesen)

**3. Restore-Logik beim Laden**

```text
savedSeconds = MAX(localStorage.watchedSeconds, db.video_progress_seconds)
savedMaxTime = MAX(localStorage.maxReachedTime, db.video_progress_seconds)

-> setWatchedSeconds(savedSeconds)
-> maxReachedTimeRef.current = savedMaxTime
-> player.setCurrentTime(savedMaxTime)  // nach 'ready'-Event
```

**4. Skip-Schutz bleibt intakt**

- `maxReachedTimeRef` wird aus dem gespeicherten Wert wiederhergestellt
- Nutzer koennen nicht ueber ihre gespeicherte Position hinaus springen
- Vorwaerts-Springen bleibt blockiert (nur bis `maxReachedTime`)
- Rueckwaerts-Springen bleibt erlaubt

**5. Bereits abgeschlossene Lektionen**

- Wenn `isAlreadyCompleted = true` (Lektion fertig): Skip-Schutz ist sowieso deaktiviert (`allowSeeking`)
- Kein Progress-Saving noetig fuer abgeschlossene Lektionen

### Edge Cases

| Szenario | Verhalten |
|----------|-----------|
| Page-Reload waehrend Video | localStorage + DB-Wert wird geladen, Player springt zur gespeicherten Position |
| Browser/Tab geschlossen | `beforeunload` speichert letzten Stand, beim naechsten Besuch wird fortgesetzt |
| Anderes Geraet | DB-Wert wird geladen (localStorage ist geraetespezifisch) |
| localStorage geloescht | DB-Wert greift als Fallback |
| Video kuerzer als gespeicherte Position | `setCurrentTime` clampt automatisch, Progress zaehlt weiter ab aktueller Position |
| Mehrere Lektionen parallel | Jede Lektion hat eigenen localStorage-Key |
| Lektion bereits abgeschlossen | Kein Saving, `allowSeeking = true` |
| IntroVideo | Nutzt `lessonId = 'intro-video'`, gleiche Persistierung |

### Keine Migration noetig

- Die Spalte `video_progress_seconds` existiert bereits in der DB
- Bestehende Fortschrittsdaten (completed lektionen) bleiben unberuehrt
- Kein Schema-Change erforderlich

### RLS-Pruefung

- `contractor_akademie_lektions_fortschritt` wird bereits via `useAkademieFortschritt` gelesen -- RLS erlaubt SELECT fuer eigene Daten
- Fuer das Upsert muss geprueft werden ob INSERT/UPDATE RLS-Policies bestehen (wird bei Implementation gecheckt)
- Falls keine Policy existiert: Upsert via den bestehenden Thermocheck-Client mit anon-Key (wie bereits im Einsatz)
