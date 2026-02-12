

# Unskippable Intro-Video vor dem Onboarding

## Was passiert

Beim **allerersten Einloggen** sieht ein neuer Contractor ein Fullscreen-Intro-Video, bevor das Onboarding startet. Das Video erklaert den Vertrag und die Anforderungen. Es ist **nicht ueberspringbar** -- erst wenn es komplett durchgelaufen ist, kann der User weiter.

**Video-URL:** `https://iframe.mediadelivery.net/play/591760/304c7347-3b6f-4231-988b-59e5b8082e32`

## Ablauf aus Nutzersicht

1. Neuer User loggt sich ein
2. Fullscreen schwarzer Bildschirm mit Galvanek-Logo und dem Intro-Video
3. Video laeuft ab (unskippable, kein Vorspulen moeglich)
4. Nach Ende des Videos erscheint ein "Weiter"-Button
5. Klick auf "Weiter" bringt den User zum normalen Onboarding (Schritt 1: Profil)
6. Beim naechsten Login wird das Intro-Video **nicht** mehr angezeigt

## Technische Umsetzung

### 1. Neue Komponente: `src/components/onboarding/IntroVideo.tsx`

- Fullscreen-Overlay mit schwarzem Hintergrund
- Galvanek-Logo oben mittig
- `MultiSourceVideoPlayer` fuer das Bunny Stream Video
- `useBunnyPlayerProgress` Hook fuer Skip-Schutz (gleiche Logik wie Akademie-Videos)
- Fortschritts-Anzeige ("X:XX verbleibend")
- "Weiter zum Onboarding"-Button, erst aktiv wenn `isVideoEnded === true`
- Callback `onComplete` wenn der User auf "Weiter" klickt

### 2. State-Tracking

**localStorage** (`OnboardingState`):
- Neues Feld `introVideoWatched: boolean` (Default: `false`)

**Datenbank** (`thermocheck.contractor_onboarding`):
- Neue Spalte `intro_video_watched boolean DEFAULT false`
- RPC-Funktion erweitern um dieses Feld zurueckzugeben/zu speichern

### 3. Dateiaenderungen

| Datei | Aenderung |
|---|---|
| **NEU** `src/components/onboarding/IntroVideo.tsx` | Fullscreen Intro-Video Komponente mit Skip-Schutz |
| `src/types/onboarding.ts` | `OnboardingState` um `introVideoWatched: boolean` erweitern |
| `src/lib/onboarding-config.ts` | `createInitialOnboardingState()` mit `introVideoWatched: false` |
| `src/components/OnboardingScreen.tsx` | Vor Step-Rendering pruefen: wenn `!introVideoWatched`, dann `IntroVideo` rendern |
| `src/hooks/useOnboardingState.ts` | Neuer Callback `setIntroVideoWatched` |
| `src/hooks/useContractorProfile.ts` | `saveProgress` erweitern um `intro_video_watched` |
| SQL Migration | `ALTER TABLE` + RPC-Erweiterung fuer `intro_video_watched` |

### 4. Vorhandene Infrastruktur (wird wiederverwendet)

- `MultiSourceVideoPlayer` -- rendert Bunny Stream iframes
- `useBunnyPlayerProgress` -- trackt Wiedergabezeit, verhindert Vorspulen, erkennt Video-Ende
- Player.js API -- bereits in `index.html` eingebunden

