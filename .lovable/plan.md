

## Video-URL von Lektion 3-1 nach 1-3 verschieben

Die Video-URL `https://iframe.mediadelivery.net/play/591760/a9021913-0c3c-4986-a32e-11ac216e5edf` wurde versehentlich bei Lektion **3-1** hinterlegt, gehoert aber zu **1-3** (Auftreten beim Kunden).

### Aenderungen

**Datenbank-Migration (Test-Umgebung):**
- Video-URL bei `code = '3-1'` auf `NULL` setzen
- Video-URL bei `code = '1-3'` auf den Bunny-Stream-Link setzen

**Live-Umgebung:**
Da Daten nicht automatisch synchronisiert werden, muss dasselbe SQL manuell im Supabase SQL Editor mit ausgewaehlter **Live**-Umgebung ausgefuehrt werden.

### Technische Details

SQL-Migration:
```sql
UPDATE thermocheck.contractor_akademie_lektionen 
SET video_url = NULL 
WHERE code = '3-1';

UPDATE thermocheck.contractor_akademie_lektionen 
SET video_url = 'https://iframe.mediadelivery.net/play/591760/a9021913-0c3c-4986-a32e-11ac216e5edf' 
WHERE code = '1-3';
```

Keine Code-Aenderungen noetig -- nur Datenbank-Updates.

