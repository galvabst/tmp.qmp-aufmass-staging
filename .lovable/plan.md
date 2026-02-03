# Plan: Akademie freischalten mit Bunny Stream Integration

## ✅ STATUS: UMGESETZT

---

## Was wurde gemacht

### 1. ✅ Multi-Source Video Player
- Neue Komponente `src/components/akademie/MultiSourceVideoPlayer.tsx`
- Erkennt automatisch: Bunny Stream, YouTube, direkte MP4s, Supabase Storage
- Bunny Stream wird als iframe eingebettet

### 2. ✅ Akademie-Daten aus thermocheck-Schema
- Hook `useAkademieContent` lädt jetzt primär aus `thermocheck.techniker_akademie_module` + `techniker_akademie_lektionen`
- Separater Supabase-Client mit `schema: 'thermocheck'`
- Fallback auf Legacy-Tabellen und Mock-Daten

### 3. ✅ RLS für anonymen Lesezugriff (temporär)
- Policy "Public read active modules" auf `thermocheck.techniker_akademie_module`
- Policy "Public read active lektionen" auf `thermocheck.techniker_akademie_lektionen`

### 4. ✅ Video-URL in Datenbank eingetragen
- Lektion "Was ist der Thermocheck?" hat jetzt die Bunny Stream URL

---

## Weitere Videos zuordnen

```sql
UPDATE thermocheck.techniker_akademie_lektionen
SET video_url = 'https://iframe.mediadelivery.net/play/591760/[VIDEO-ID]'
WHERE titel = '[LEKTIONSTITEL]';
```

---

## Spätere Erweiterungen

- **Locking aktivieren:** Wenn Auth implementiert, Policies auf `authenticated` umstellen
- **Admin-Oberfläche:** Video-URLs ohne SQL pflegen
- **Fortschritts-Tracking:** Watchtime speichern, Abschluss erst nach Video-Ende
