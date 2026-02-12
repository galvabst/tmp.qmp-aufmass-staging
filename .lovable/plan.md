

## Willkommens-Modul zu einem einzelnen Video-Punkt umbauen

Aktuell hat Modul 0 ("Willkommen & Orientierung") drei leere Lektionen:
- 0-1: Ziel der Akademie
- 0-2: Rolle im Gesamtprozess
- 0-3: Lernpfad, Ablauf & Freigaben

Keine davon hat eine Video-URL oder Textinhalt -- sie werden also momentan im UI ausgeblendet (visibility logic).

### Aenderungen

**Datenbank (manuell im SQL Editor):**

1. Lektion **0-1** bekommt die Video-URL und wird zur einzigen sichtbaren Lektion -- Titel wird zu "Willkommen" (oder ein passenderer Titel nach Wunsch) geaendert
2. Lektionen **0-2** und **0-3** werden deaktiviert (`ist_aktiv = false`), damit sie nicht mehr zaehlen

```sql
-- Lektion 0-1: Video hinterlegen + Titel anpassen
UPDATE thermocheck.contractor_akademie_lektionen 
SET video_url = 'https://iframe.mediadelivery.net/play/591760/6f2c34c0-76aa-4cc2-9f1c-a1b7205738b3',
    titel = 'Willkommen'
WHERE code = '0-1';

-- Lektionen 0-2 und 0-3 deaktivieren
UPDATE thermocheck.contractor_akademie_lektionen 
SET ist_aktiv = false 
WHERE code IN ('0-2', '0-3');
```

Dieses SQL muss in beiden Umgebungen (Test + Live) im Supabase SQL Editor ausgefuehrt werden.

### Keine Code-Aenderungen noetig

Das Frontend blendet Lektionen ohne Inhalt automatisch aus und zeigt nur aktive Lektionen mit Video/Text an. Sobald 0-1 ein Video hat und 0-2/0-3 deaktiviert sind, erscheint das Modul mit genau einem Punkt.

### Hinweis zum Titel

Falls "Willkommen" nicht der gewuenschte Titel ist, kann er im SQL einfach angepasst werden. Auch der Modultitel "Willkommen & Orientierung" kann bei Bedarf geaendert werden.

