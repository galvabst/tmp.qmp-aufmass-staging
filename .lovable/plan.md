
## Fix-Plan: Mehrfach-Upload aus Galerie lädt nur 1 Bild

### Befund
Ich habe den Upload-Flow geprüft. In `PhotoUploadField.tsx` wird im `onChange` sofort `event.target.value = ''` gesetzt, **bevor** der asynchrone Mehrfach-Upload fertig ist.  
Da `event.target.files` (FileList) an das Input gebunden ist, kann sie dadurch während der Schleife geleert werden – dann bleibt effektiv nur das erste Bild übrig.

Zusätzlich: Dein Screenshot ist von der **Published URL**. Die aktuell im Code vorhandenen letzten Fixes (Timestamp-Pfad) sind dort vermutlich noch nicht live.

### Umsetzung (Datei)
`src/features/aufmass/ui/components/PhotoUploadField.tsx`

1. **FileList sofort in ein stabiles Array kopieren**
   - `const files = Array.from(event.target.files ?? [])`
   - Dann `event.target.value = ''`
   - Danach Upload mit dem Array starten (nicht mit live `FileList`)

2. **Upload-Handler auf `File[]` umstellen**
   - Signatur von `FileList | null` auf `File[]`
   - Schleife läuft stabil über alle ausgewählten Bilder

3. **Robuste Reihenfolge-Zählung im Batch**
   - `baseIndex = existingBilder.length`
   - Nur bei tatsächlich hochgeladenen Bildern hochzählen (kein Fehlsprung bei ungültigen Dateien)

4. **Fehler pro Datei abfangen, Batch nicht komplett abbrechen**
   - Wenn ein Bild fehlschlägt: Toast + weiter mit den restlichen Bildern

### Technische Details (kurz & klar)
- **Root Cause:** Live-`FileList` wird durch sofortiges Reset des Inputs während async Upload unzuverlässig.
- **Kein DB-Migrationsbedarf:** Problem liegt im Frontend Event-/State-Handling.
- **Betroffene Komponente:** nur `PhotoUploadField`; keine anderen Upload-Komponenten mit gleichem Muster gefunden.

### Validierung nach Fix
1. Auf mobil und desktop je 3–5 Bilder über **Datei** auswählen.
2. Prüfen: Anzahl Thumbnails = Anzahl ausgewählter Bilder.
3. In DB prüfen: entsprechende Anzahl neuer `thermocheck_vot_bilder`-Zeilen.
4. Falls Test auf Published erfolgen soll: nach Merge/Deploy einmal **publizieren**, sonst testest du weiter den alten Stand.
