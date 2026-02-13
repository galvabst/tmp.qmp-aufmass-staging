

## Zwei Fixes: Video-Skipschutz verbessern + Redirect nach Bestellung korrigieren

### Problem 1: Videos koennen per Fortschrittsbalken vorgespult werden

Der Bunny Stream Player zeigt eine native Fortschrittsleiste (Seekbar) im iframe an. Obwohl der `useBunnyPlayerProgress`-Hook Spruenge nach vorne erkennt und zuruecksetzt (`player.setCurrentTime(maxReached)`), kann der Nutzer trotzdem kurz vorspulen, weil der Reset erst beim naechsten `timeupdate`-Event greift. Die Seekbar selbst kann nicht per JS versteckt werden, weil sie INNERHALB des Bunny-iframes liegt.

**Loesung:** CSS-Overlay ueber den unteren Bereich des iframes legen, der die Seekbar physisch verdeckt. Das Overlay wird nur beim **ersten Durchgang** angezeigt (wenn die Lektion noch nicht abgeschlossen ist). Sobald die Lektion als `abgeschlossen` markiert ist (`allowSeeking = true`), verschwindet das Overlay und die Seekbar wird nutzbar.

### Problem 2: Nach Stripe-Zahlung wird das Introvideo erneut angezeigt

Nach einer erfolgreichen Stripe-Zahlung leitet Stripe den Nutzer zurueck auf `/?payment=success&session_id=...`. Die `OnboardingScreen`-Komponente rendert aber ZUERST das Introvideo-Gate (Zeile 376), BEVOR der Payment-Handler (Zeile 324) den Step auf `bestellungen` setzen kann. Der State `introVideoWatched` wird zwar aus der DB hydriert, aber das passiert asynchron -- beim initialen Render ist er noch `false`.

**Loesung:** Wenn `?payment=success` in der URL steht, das Introvideo-Gate ueberspringen und direkt zum Bestellungen-Step navigieren. Zusaetzlich: Bessere Toast-Meldungen fuer Erfolg und Fehler.

---

### Technische Aenderungen

#### 1. MultiSourceVideoPlayer.tsx -- Seekbar-Overlay

Neues optionales Prop: `hideSeekbar?: boolean`

Wenn `hideSeekbar = true`:
- Ein halbtransparentes `div` wird als CSS-Overlay ueber die unteren ~50px des iframes gelegt
- `pointer-events: none` auf das Overlay, damit Play/Pause im oberen Bereich weiter funktioniert
- Tatsaechlich: `pointer-events: auto` NUR auf dem Overlay-Streifen, um Klicks auf die Seekbar zu blockieren

```text
+----------------------------------+
|                                  |
|        Video (klickbar)          |
|                                  |
|                                  |
+----------------------------------+
| ████ Overlay (blockiert Seekbar) |  <-- 48px hoch, pointer-events: auto
+----------------------------------+
```

#### 2. AkademieModul.tsx -- Overlay an Completion-Status koppeln

- Wenn `isAlreadyCompleted = false` (Lektion noch nicht abgeschlossen): `hideSeekbar={true}`
- Wenn `isAlreadyCompleted = true`: `hideSeekbar={false}` (Seekbar sichtbar, freies Spulen)

#### 3. IntroVideo.tsx -- Seekbar immer versteckt + Payment-Skip

- `hideSeekbar={true}` immer aktiv (Introvideo soll nie skippbar sein)

#### 4. OnboardingScreen.tsx -- Payment-Redirect-Fix

Aenderung im Introvideo-Gate (Zeile 376):

```text
Vorher:
  if (!state.introVideoWatched && !isPreview) {
    return <IntroVideo ... />;
  }

Nachher:
  if (!state.introVideoWatched && !isPreview && !hasPaymentSuccess) {
    return <IntroVideo ... />;
  }
```

Das stellt sicher, dass bei `?payment=success` das Video uebersprungen und direkt der Payment-Handler ausgefuehrt wird. Der Payment-Handler setzt dann `goToStep('bestellungen')`.

Zusaetzlich: Bei `?payment=cancelled` eine Fehlermeldung anzeigen:

```text
Vorher:  toast.info('Zahlung abgebrochen');
Nachher: toast.error('Es gab ein Problem mit deiner Bestellung. Bitte versuche es erneut.');
```

---

### Zusammenfassung der Dateiaenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/components/akademie/MultiSourceVideoPlayer.tsx` | Neues Prop `hideSeekbar`, rendert CSS-Overlay ueber iframe-Unterseite |
| `src/pages/AkademieModul.tsx` | Uebergibt `hideSeekbar={!isAlreadyCompleted}` an den Player |
| `src/components/onboarding/IntroVideo.tsx` | Uebergibt `hideSeekbar={true}` an den Player |
| `src/components/OnboardingScreen.tsx` | Introvideo-Gate ueberspringen bei `?payment=success`; bessere Error-Toasts |

### Keine DB-Aenderungen noetig

Die Information "Lektion bereits abgeschlossen" kommt aus `contractor_akademie_lektions_fortschritt` (bereits vorhanden). Fuer das Introvideo kommt sie aus `intro_video_watched` in `contractor_onboarding` (bereits vorhanden).
