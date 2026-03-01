

# Fix: Foto-Vorschau zeigt immer dasselbe Bild

## Root Cause

Zwei zusammenwirkende Probleme:

### 1. Storage-Pfad-Kollision (Hauptursache)
`buildImageStoragePath` erzeugt deterministische Pfade: `{kategorie}_{001}.jpg`, `{kategorie}_{002}.jpg` etc. Der Upload nutzt `upsert: true`. Wenn ein Bild gelöscht und ein neues hochgeladen wird, kann der neue Index mit einem existierenden Pfad kollidieren und die Datei im Storage überschreiben. Beide Metadaten-Einträge zeigen dann auf dieselbe physische Datei.

### 2. Thumbnail-State wird komplett ersetzt
`setThumbnails(urls)` in der `useEffect` ersetzt bei jedem Lauf den gesamten State statt zu mergen. Bei schnellen Uploads (Effect feuert mehrfach parallel) kann ein älterer Lauf einen neueren überschreiben.

## Lösung

### A) Eindeutige Storage-Pfade (`storage-path.ts`)
Einen kurzen Timestamp-Suffix an den Dateinamen hängen, um Kollisionen zu verhindern:
```
{kategorie}_{index}_{timestamp}.{ext}
```
So überschreibt `upsert: true` keine fremden Dateien mehr.

### B) Thumbnails mergen statt ersetzen (`PhotoUploadField.tsx`)
- `setThumbnails(prev => ({ ...prev, ...urls }))` statt komplettem Replace
- Abbruch-Flag für veraltete Effect-Runs (stale closure protection)
- Nur fehlende URLs nachladen statt alle bei jedem Render

## Dateien

| Datei | Änderung |
|---|---|
| `storage-path.ts` | Timestamp in `buildImageStoragePath` |
| `PhotoUploadField.tsx` | Thumbnail-Laden mit Merge + Stale-Protection |

