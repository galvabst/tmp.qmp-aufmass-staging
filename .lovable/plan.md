

## Fix: Lerninhalt sofort anzeigen wenn kein Video vorhanden

### Problem
Wenn eine Lektion kein Video hat aber Textinhalt, muss der User trotzdem warten (Timer laeuft), bevor die Lerninhalte freigeschaltet werden. Das ist sinnlos -- ohne Video gibt es nichts zum Anschauen.

### Loesung
In `AkademieModulContent` (Zeilen 282-283 in `AkademieModul.tsx`) wird die Freischaltung an Video-Progress gekoppelt. Wenn kein Video existiert (`!unterpunkt.videoUrl`), sollen `canUnlockTabs` und `canMarkComplete` sofort `true` sein.

### Technischer Plan

| Datei | Aenderung |
|---|---|
| `src/pages/AkademieModul.tsx` | Zeilen 282-283: `canUnlockTabs` und `canMarkComplete` erhalten eine zusaetzliche Bedingung: wenn `!unterpunkt.videoUrl`, dann sofort `true` |

Konkret:
```text
// Vorher:
const canUnlockTabs = isAlreadyCompleted || (isBunnyStream ? bunnyProgress.canUnlockTabs : fallbackProgress.canComplete);
const canMarkComplete = isAlreadyCompleted || (isBunnyStream ? bunnyProgress.canMarkComplete : fallbackProgress.canComplete);

// Nachher:
const hasVideo = !!unterpunkt.videoUrl;
const canUnlockTabs = !hasVideo || isAlreadyCompleted || (isBunnyStream ? bunnyProgress.canUnlockTabs : fallbackProgress.canComplete);
const canMarkComplete = !hasVideo || isAlreadyCompleted || (isBunnyStream ? bunnyProgress.canMarkComplete : fallbackProgress.canComplete);
```

Damit wird bei Lektionen ohne Video:
- Der Lerninhalt sofort sichtbar (kein Lock-Icon, kein Timer)
- Der "Als abgeschlossen markieren"-Button sofort klickbar
- Lektionen MIT Video funktionieren weiterhin wie bisher (Timer + Progress)

### Keine DB-Migration noetig
Reine Frontend-Logik-Aenderung, eine Datei, drei Zeilen.

