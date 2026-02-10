

# Modul 7 umstrukturieren und Minutenanzeige entfernen

## Was sich aendert

### 1. Minutenanzeige im UI entfernen
Die Uhr-Icons mit "X Min." werden aus der Lektionsliste entfernt — sowohl in der inneren Zeile (LektionInnerRow) als auch ueberall sonst, wo die Dauer angezeigt wird. Die Dauer bleibt in der Datenbank fuer spaetere Nutzung, wird aber nicht mehr im UI gezeigt.

**Datei:** `src/components/onboarding/steps/AcademyStep.tsx`
- Clock-Icon und Daueranzeige aus `LektionInnerRow` entfernen (Zeilen 93-96)

### 2. Modul 7 in der Datenbank umstrukturieren

Aktuelle Struktur:
- 7-1 "Datenerfassung im System" (Gruppe, kein Video)
  - 7-1-1 "Praxisbeispiel: Zoho Forms" (Video)
  - 7-1-2 "Praxisbeispiel: Raumscann APP" (Video)
- 7-2 bis 7-4 (kein Video, werden ausgeblendet)

Neue flache Struktur — alle direkt unter dem Modul, ohne Nummerierung:
- "Praxis: Raeume scannen" (neues Video: `3d205096-...`)
- "Praxis: Zoho Forms" (bestehendes Video von 7-1-1)
- "Praxis: Raumscann APP" (bestehendes Video von 7-1-2)

**Datenbank-Aenderungen (Migration):**
1. Bestehende Lektionen 7-1-1 und 7-1-2 umcodieren zu eigenstaendigen Codes (z.B. `7-1`, `7-2`) und umbenennen
2. Neue Lektion einfuegen fuer "Praxis: Raeume scannen" mit dem neuen Video
3. Alte leere Lektionen (7-1 bis 7-4 ohne Video) deaktivieren (`ist_aktiv = false`)
4. Reihenfolge anpassen, damit die Sortierung stimmt

**Konkrete SQL-Schritte:**

```text
-- Alte leere Lektionen deaktivieren
UPDATE thermocheck.contractor_akademie_lektionen
SET ist_aktiv = false, updated_at = now()
WHERE code IN ('7-1', '7-2', '7-3', '7-4')
  AND video_url IS NULL;

-- 7-1-1 (Zoho Forms) -> eigenstaendig, neue Reihenfolge
UPDATE thermocheck.contractor_akademie_lektionen
SET code = '7-b', titel = 'Praxis: Zoho Forms', reihenfolge = 2, updated_at = now()
WHERE id = '7e450a86-8d49-4a5c-84f2-2a11347b9551';

-- 7-1-2 (Raumscann APP) -> eigenstaendig, neue Reihenfolge
UPDATE thermocheck.contractor_akademie_lektionen
SET code = '7-c', titel = 'Praxis: Raumscann APP', reihenfolge = 3, updated_at = now()
WHERE id = 'e34ef996-6c92-489f-bbb4-7f40ebd793a4';

-- Neue Lektion: Praxis Raeume scannen (als erstes Video)
INSERT INTO thermocheck.contractor_akademie_lektionen
  (modul_id, code, titel, reihenfolge, video_url, video_dauer_minuten, ist_aktiv)
VALUES
  ((SELECT id FROM thermocheck.contractor_akademie_module WHERE code LIKE 'modul-7%'),
   '7-a', 'Praxis: Raeume scannen', 1,
   'https://iframe.mediadelivery.net/play/591760/3d205096-67ca-4ff4-be0c-37e729fc61e3',
   10, true);
```

### Zusammenfassung der Dateiaenderungen

| Datei | Aenderung |
|---|---|
| `src/components/onboarding/steps/AcademyStep.tsx` | Minutenanzeige (Clock + "X Min.") entfernen |
| Neue Migration | DB: Modul 7 flach umstrukturieren, neues Video einfuegen |

