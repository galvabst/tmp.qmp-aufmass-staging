
## Ziel
Die riesigen „blauen Ränder“ im Bunny-Video sollen verschwinden, sodass das Video den verfügbaren Player-Bereich wirklich ausfüllt (auf Mobile idealerweise als „Hero“ fast/komplett screenfüllend). Zusätzlich soll klar sein, **warum** es passiert: aktuell wird ein Bunny-Player-Link genutzt, der im iFrame offenbar **nicht responsive** rendert (Video wird innerhalb des Players klein zentriert → großer Hintergrundbereich).

---

## Was ich anhand der Screenshots + Code als Ursache sehe (Fakten)
1. Der blaue Bereich ist **nicht unser Tailwind-Background**, sondern kommt **aus dem Bunny-Player innerhalb des iFrames** (cross-origin).
2. In der DB/Migration ist ein Bunny-Link der Form gespeichert:
   - `https://iframe.mediadelivery.net/play/{libraryId}/{videoId}`
3. Bunny empfiehlt für iFrame-Embeds in der Regel die **/embed/**-Variante und `responsive=true`. Das `/play/`-Format ist eher „direct play“ und kann im iFrame dazu führen, dass der Player intern eine feste/kleinere Layout-Breite nutzt → Ergebnis: „Video klein in der Mitte“.

Wichtig: Selbst mit perfektem iFrame kann es bei nicht-16:9-Videos immer noch leichte Balken geben (Letterboxing), weil der Player das Seitenverhältnis schützt. Aber der „geisteskrank große“ Rahmen in deinem Screenshot sieht nach **nicht-responsive Player Layout** aus – das können wir sehr wahrscheinlich beheben.

---

## Umsetzung (konkret)

### 1) Bunny-URL im Frontend normalisieren (ohne DB-Änderung)
**Datei:** `src/components/akademie/MultiSourceVideoPlayer.tsx`

- Eine kleine Helper-Funktion hinzufügen, die Bunny-URLs robust umschreibt:
  - `/play/` → `/embed/`
  - Optional: Host belassen (`iframe.mediadelivery.net`) oder (falls sinnvoll) auf den neuen Player umstellen (`player.mediadelivery.net`) – das testen wir direkt.
  - Query-Params hinzufügen/ergänzen (ohne bestehende zu zerstören):
    - `responsive=true`
    - `autoplay=false` (oder so belassen, wie es aktuell ist – wir setzen hier bewusst auf stabil/konservativ)
- Dann im `BunnyStreamPlayer` nicht `src={url}`, sondern `src={normalizedUrl}` verwenden.

**Warum das hilft:** Der `/embed/`-Player ist genau für responsive iFrames gedacht. Damit sollte das Video im iFrame die verfügbare Fläche ausfüllen statt „klein mittig“ zu bleiben.

---

### 2) „Echter Hero“-Modus: Video nimmt (fast) den kompletten Screen ein
Aktuell ist der Container `h-[50vh] ...`. Du willst aber „kompletter Screen“.

**Datei:** `src/components/akademie/MultiSourceVideoPlayer.tsx` **oder** (besser) `src/pages/AkademieModul.tsx`

Ich setze das als „Hero“ um, damit es nicht die gesamte Seite zerstört:

- **Mobile:** Video-Höhe = `100svh` minus Header-Höhe (damit Header sichtbar bleibt)  
- **Desktop:** etwas moderater (z.B. `70svh` oder capped), damit nicht alles nur Video ist

Technisch sauber (ohne Raten von Header-Pixeln):
- In `AkademieModul.tsx`:
  - Header bekommt ein `ref`
  - per `ResizeObserver` / `useLayoutEffect` wird die Headerhöhe gemessen
  - diese Höhe wird als CSS-Variable gesetzt (z.B. `--akademie-header-h: 64px`)
- Der Video-Wrapper bekommt dann:
  - `height: calc(100svh - var(--akademie-header-h))` (Mobile)
  - auf Desktop z.B. `min(70svh, 720px)` (oder ähnlich)

**Warum so:** Dann ist es wirklich screenfüllend auf Handy, ohne dass wir harte Werte raten müssen.

---

### 3) Optik: keine „Umrandung“ aus unserer Seite
Selbst wenn Bunny intern noch minimale Balken macht:
- Außenrum muss es „clean“ sein:
  - Player-Wrapper: `bg-black`, `overflow-hidden`, keine Padding/Margins
  - iFrame: `display:block` (verhindert inline-gap), `border-0`

---

## Test/Verifikation (Pflicht, damit wir nicht wieder im Kreis drehen)
1. Auf `/akademie/modul/f10b3df0-1a58-4d2a-80a1-164b38a21292` prüfen:
   - Wird das Video im Player groß/flächig angezeigt (nicht mehr klein zentriert)?
2. In Lovable Preview oben rechts Device-Switch:
   - Mobile (z.B. iPhone 390x844): Video sollte „Hero“ sein (fast Screen).
   - Desktop: Video breit und prominent, aber nicht „komisch“.
3. Fullscreen-Button im Bunny-Player testen (iFrame `allowFullScreen` ist schon gesetzt; bleibt so).

---

## Risiken / Grenzen (kritisch, damit Erwartung sauber ist)
- Wenn das Originalvideo ein ungewöhnliches Seitenverhältnis hat, kann Bunny weiterhin Balken anzeigen, weil es nicht croppt.  
  Was wir fixen: den „Player rendert klein in der Mitte“-Bug durch falschen Embed-Link.
- „Video soll IMMER ohne Balken“ bedeutet technisch „cover/crop“. Das lässt sich in einem cross-origin iFrame meistens nicht erzwingen. Falls du wirklich immer „ohne Balken“ willst, bräuchten wir statt iFrame einen eigenen `<video>`-Player mit Stream-URL (HLS/MP4) von Bunny (höhere Komplexität + saubere, stabile Stream-URLs nötig).

---

## Dateien, die ich ändern werde
1. `src/components/akademie/MultiSourceVideoPlayer.tsx`
   - Bunny-URL Normalisierung (/play → /embed, responsive=true)
   - Hero-Container-Styles (oder per Prop steuerbar)
2. `src/pages/AkademieModul.tsx` (optional aber empfohlen)
   - Headerhöhe messen und als CSS-Variable bereitstellen, damit Hero wirklich „perfekt“ wird

---