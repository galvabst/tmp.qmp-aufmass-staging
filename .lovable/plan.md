

# Plan: Akademie freischalten mit Bunny Stream Integration

## Zusammenfassung

Die Akademie zeigt aktuell **keine Videos**, weil:
1. Der `VideoPlayer` nur Supabase Storage signierte URLs kann (nicht Bunny iframe)
2. Alle `video_url` in der DB sind `NULL`
3. RLS erlaubt nur `authenticated` User, aber es gibt noch keinen Login

Dieser Plan macht **alle Module sofort betrachtbar** mit Bunny Stream Videos.

---

## Technische Änderungen

### 1. Multi-Source Video Player

**Datei:** `src/pages/AkademieModul.tsx`

Der aktuelle `VideoPlayer` erkennt nur Supabase Storage Pfade. Neuer Flow:

```text
videoUrl prüfen:
├─ leer/null → "Kein Video verfügbar"
├─ iframe.mediadelivery.net → <iframe> (Bunny Stream)
├─ youtube.com / youtu.be → <iframe> (YouTube Embed)
├─ endet auf .mp4/.webm → <video> (Direktlink)
└─ sonstiger Pfad → useSignedVideoUrl (Supabase Storage)
```

**Bunny Stream Embed:**
```jsx
<iframe
  src="https://iframe.mediadelivery.net/play/591760/5950ea70-de80-4a18-8e04-f516cd78fcf6"
  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
  className="w-full aspect-video"
/>
```

### 2. Akademie-Daten aus thermocheck-Schema laden

**Datei:** `src/hooks/useAkademieContent.ts`

Aktuell lädt der Hook primär aus Mock-Daten (`MOCK_AKADEMIE_HAUPTMODULE`). 

**Änderung:**
- Primär aus `thermocheck.techniker_akademie_module` + `techniker_akademie_lektionen` laden
- Mock-Daten nur als Fallback wenn Query fehlschlägt
- Mapping von DB-Feldern auf App-Typen:
  - `modul.titel` → `hauptmodul.titel`
  - `lektion.video_url` → `unterpunkt.videoUrl`

### 3. RLS für anonymen Lesezugriff (temporär)

**Datenbankänderung (Migration):**

Aktuelle Policies erlauben nur `authenticated`. Für die Aufbauphase:

```sql
-- Temporär: Anon-Zugriff auf aktive Module/Lektionen
CREATE POLICY "Public read active modules"
ON thermocheck.techniker_akademie_module
FOR SELECT TO anon
USING (ist_aktiv = true);

CREATE POLICY "Public read active lektionen"
ON thermocheck.techniker_akademie_lektionen
FOR SELECT TO anon
USING (ist_aktiv = true);
```

**Hinweis:** Später (wenn Auth implementiert) werden diese auf `authenticated` umgestellt.

### 4. Video-URL in Datenbank eintragen

**Datenänderung:**

Für die erste Lektion "Was ist der Thermocheck?" die Bunny URL setzen:

```sql
UPDATE thermocheck.techniker_akademie_lektionen
SET video_url = 'https://iframe.mediadelivery.net/play/591760/5950ea70-de80-4a18-8e04-f516cd78fcf6'
WHERE titel = 'Was ist der Thermocheck?'
  AND ist_aktiv = true;
```

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/pages/AkademieModul.tsx` | Multi-Source VideoPlayer (iframe/video/signed) |
| `src/hooks/useAkademieContent.ts` | Primär aus thermocheck-Schema laden |
| **Migration (SQL)** | RLS Policies für anon-Zugriff |
| **Daten-Update (SQL)** | video_url für erste Lektion setzen |

---

## Spätere Erweiterungen (nicht Teil dieses Plans)

- **Locking wieder aktivieren:** Wenn Auth implementiert, Policies auf `authenticated` + Fortschritts-Logik
- **Admin-Oberfläche:** Video-URLs ohne SQL pflegen
- **Infos/Zusammenfassungen:** Markdown-Editor für `text_inhalt` und `text_zusammenfassung`

---

## Ergebnis nach Umsetzung

1. Alle Akademie-Module sind sichtbar (kein Lock)
2. Videos werden als Bunny Stream iframe eingebettet
3. Daten kommen aus der echten Datenbank (nicht Mock)
4. Du kannst weitere Videos per SQL-Update zuordnen:
   ```sql
   UPDATE thermocheck.techniker_akademie_lektionen
   SET video_url = 'https://iframe.mediadelivery.net/play/591760/[VIDEO-ID]'
   WHERE titel = '[LEKTIONSTITEL]';
   ```

