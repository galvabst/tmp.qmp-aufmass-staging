
# Plan: Akademie Locking temporär deaktivieren

## Zusammenfassung

Die Akademie zeigt alle Module außer dem ersten als **gesperrt** an. Das ist korrektes Verhalten laut Locking-Logik, aber du willst während der Aufbauphase **alle Module betrachtbar** haben.

**Zusätzlich:** Das Video wurde zur falschen Lektion zugeordnet. "Was ist der Thermocheck?" ist in Modul 2 ("Grundlagen"), aber Modul 2 ist gesperrt.

---

## Technische Änderungen

### 1. Locking temporär deaktivieren

**Datei:** `src/components/onboarding/steps/AcademyStep.tsx`

Die Funktionen `isHauptmodulUnlocked()` und `isUnterpunktUnlocked()` werden so angepasst, dass sie während der Aufbauphase **immer `true` zurückgeben**:

**Änderung in Zeile 25-30:**
```tsx
// Helper: Prüft ob Hauptmodul freigeschaltet ist
function isHauptmodulUnlocked(index: number, hauptmodule: AkademieHauptmodul[]): boolean {
  // TEMP: Alle Module freigeschaltet während Aufbauphase
  return true;
  
  // Original-Logik (später reaktivieren):
  // if (index === 0) return true;
  // const prev = hauptmodule[index - 1];
  // const prevUnterpunkte = prev?.unterpunkte || [];
  // return prevUnterpunkte.every(u => u.abgeschlossen);
}
```

**Änderung in Zeile 49-65:**
```tsx
// Helper: Prüft ob ein Unterpunkt freigeschaltet ist
function isUnterpunktUnlocked(
  hauptmodulIndex: number, 
  unterpunktIndex: number, 
  hauptmodule: AkademieHauptmodul[]
): boolean {
  // TEMP: Alle Unterpunkte freigeschaltet während Aufbauphase
  return true;
  
  // Original-Logik (später reaktivieren):
  // if (!isHauptmodulUnlocked(hauptmodulIndex, hauptmodule)) return false;
  // if (unterpunktIndex === 0) return true;
  // const hauptmodul = hauptmodule[hauptmodulIndex];
  // const unterpunkte = hauptmodul?.unterpunkte || [];
  // return unterpunkte[unterpunktIndex - 1]?.abgeschlossen ?? false;
}
```

### 2. Video-URL für eine testbare Lektion setzen

Die Lektion "Was ist der Thermocheck?" hat die Video-URL, aber sie ist in Modul 2 (momentan gesperrt). Nach dem Entsperren kannst du sie testen.

**Alternativ** kann ich die Video-URL auch zur ersten Lektion ("Ziel der Akademie") kopieren, damit du sofort im ersten Modul testen kannst:

```sql
UPDATE thermocheck.techniker_akademie_lektionen
SET video_url = 'https://iframe.mediadelivery.net/play/591760/5950ea70-de80-4a18-8e04-f516cd78fcf6'
WHERE titel = 'Ziel der Akademie';
```

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/onboarding/steps/AcademyStep.tsx` | Locking-Funktionen geben temporär immer `true` zurück |
| (Optional) SQL Update | Video-URL auch für "Ziel der Akademie" setzen |

---

## Ergebnis nach Umsetzung

1. ✅ Alle Module und Lektionen sind klickbar (kein Schloss-Symbol mehr)
2. ✅ Jede Lektion navigiert zu `/akademie/modul/:id`
3. ✅ Videos werden als Bunny Stream iframe angezeigt
4. ✅ Du kannst in Ruhe alle Inhalte aufbauen und testen

---

## Spätere Reaktivierung

Wenn das Akademie-System produktionsreif ist, einfach die `return true;` Zeilen entfernen und die auskommentierte Original-Logik wieder aktivieren.

