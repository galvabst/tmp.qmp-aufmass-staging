

# Plan: Akademie-Videos Storage & Player einrichten

## Aktueller Stand

Der Bucket `akademie-videos` existiert bereits mit korrekten Sicherheitseinstellungen:
- Nicht public (nur authentifizierte Nutzer)
- RLS: Lesen für alle Auth-User, Schreiben nur für Admins
- Limit: **200MB** (zu klein)

---

## Änderungen

### 1. Dateilimit auf 1GB erhöhen

Das aktuelle 200MB-Limit muss auf 1GB erhöht werden:

```sql
UPDATE storage.buckets 
SET file_size_limit = 1073741824  -- 1GB
WHERE id = 'akademie-videos';
```

### 2. INSERT Policy hinzufügen

Es fehlt eine INSERT Policy für Admins zum Hochladen:

```sql
CREATE POLICY "akademie_videos_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'akademie-videos' 
  AND iam.is_admin_or_manager()
);
```

### 3. Video-Player im Frontend anpassen

Da der Bucket nicht public ist, muss der Video-Player eine signierte URL verwenden:

**Datei:** `src/pages/AkademieModul.tsx`

```typescript
// Signierte URL für private Videos generieren
const { data } = await supabase.storage
  .from('akademie-videos')
  .createSignedUrl('pfad/zum/video.mp4', 3600); // 1 Stunde gültig

<video src={data.signedUrl} controls className="w-full h-full" />
```

---

## Upload-Anleitung für dich

Nach Genehmigung dieses Plans:

1. Öffne das Supabase Dashboard → Storage → `akademie-videos`
2. Klicke "Upload files" und wähle dein 600MB Video
3. Notiere dir den Dateinamen (z.B. `was-ist-thermocheck.mp4`)
4. Teile mir den Dateinamen mit - ich trage die URL dann in die Lektion ein

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| **Migration (SQL)** | Bucket-Limit erhöhen, INSERT Policy |
| `src/pages/AkademieModul.tsx` | Video-Player mit signierter URL |
| `src/hooks/useAkademieContent.ts` | Optional: Helper für signierte URLs |

---

## Ergebnis

- Bucket akzeptiert Videos bis 1GB
- Nur authentifizierte App-Nutzer können Videos sehen
- Video-Player lädt Videos über sichere, zeitlich begrenzte URLs

