## Befund

Die Nutzer sind nicht im normalen Onboarding hängen geblieben. Sie sind `ready`, werden aber auf der Startseite durch das neue Pflichtvideo-Gate blockiert.

Konkrete Evidenz aus der DB:

```text
Michel Süße
onboarding_status = ready
completed_steps = profil, dokumente, bestellungen, equipment, akademie, coaching, nachweise
trainer_freigabe = true
abgeschlossene Lektionen = 10
```

Gleichzeitig sind aktuell 20 aktive Lektionen so markiert:

```text
ist_aktiv = true
nur_fuer_neue = false
video_url IS NOT NULL
```

Diese Kombination bedeutet im aktuellen Code: Alle bereits einsatzbereiten Techniker müssen plötzlich diese aktiven Videos nochmal vollständig schauen, sonst kommen sie nicht in die App.

## Wahrscheinliche Ursache

`usePflichtVideos()` interpretiert `nur_fuer_neue = false` als „Pflicht für alle ready Nutzer“. Dadurch werden Bestandsnutzer wie Michel blockiert, sobald neue oder alte Akademie-Videos so markiert sind und kein Abschlussdatensatz in `contractor_akademie_lektions_fortschritt` existiert.

Zusätzlich ist der Abschluss im Overlay technisch fragil: `PflichtVideoOverlay` wartet auf `postMessage`-Events des iframe-Players. Wenn Bunny/Embed das Ende nicht zuverlässig sendet, bleibt der Button „weiter/abschließen“ unsichtbar, obwohl das Video gesehen wurde.

## Fix-Plan

1. **Bestands-Ready-Nutzer sofort entsperren**
   - Das Pflichtvideo-Gate darf `ready`-Techniker mit bereits abgeschlossener Akademie/Onboarding nicht blockieren.
   - Für diese Nutzer soll das Video maximal freiwillig oder überspringbar sein, aber nicht den App-Zugang verhindern.

2. **Pflichtvideo-Query fachlich absichern**
   - `usePflichtVideos()` so anpassen, dass es nicht pauschal alle `ready`-Nutzer blockiert.
   - Blocking nur für echte neue Pflichtinhalte, wenn diese eindeutig als nachträgliche Pflichtschulung gedacht sind.
   - Bestandsregel: Wenn `onboarding_status = ready` und `completed_steps` enthält `akademie`, dann kein blockierendes Overlay.

3. **Overlay robust machen**
   - Falls das Overlay später bewusst genutzt wird, darf es nicht vom unsicheren iframe-Endevent allein abhängen.
   - Fallback einbauen: wenn der Player kein Ende meldet, wird nach einer sinnvollen Mindestzeit bzw. anhand der vorhandenen Progress-Logik ein Fortfahren möglich.
   - DB-Upsert-Fehler explizit behandeln und Nutzer nicht still blockieren.

4. **Datenbank-Konfiguration prüfen, aber nicht blind ändern**
   - Prüfen, ob die 20 Lektionen wirklich absichtlich `nur_fuer_neue = false` haben.
   - Falls das fachlich falsch ist, gezielt diese Inhalte auf `nur_fuer_neue = true` setzen oder eine bessere Spalte/Logik für „nachträglich verpflichtend“ nutzen.
   - Keine Massenänderung ohne vorherige Liste der betroffenen Lektionen.

5. **Validierung**
   - Für Michel prüfen: Startseite darf nach Fix nicht mehr im Pflichtvideo-Overlay hängen.
   - Für zukünftige Onboarding-Nutzer prüfen: normale Akademie-Videos bleiben weiterhin Pflicht im Onboarding.
   - Für wirklich neue Pflichtschulung prüfen: Gate funktioniert nur dann, wenn explizit dafür vorgesehen.

## Umsetzung

Ich werde zuerst den Frontend-Gate-Fix bauen, weil er sofort verhindert, dass einsatzbereite Techniker arbeitsunfähig sind. Danach prüfe ich die betroffenen Lektionen als separate Datenkorrektur, falls die Markierung `nur_fuer_neue = false` fachlich falsch gesetzt wurde.