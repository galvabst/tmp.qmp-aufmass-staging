

# Plan: Forum mit realistischen Beispieldaten befüllen

## Vorgehen
Direkte SQL-Inserts über das Supabase Insert-Tool in die Tabellen `thermocheck.contractor_forum_threads` und `thermocheck.contractor_forum_antworten`. Die RLS-Policies erfordern authentifizierte "ready contractors", daher werden die Inserts über das Admin-Tool ausgeführt, das RLS umgeht.

## Daten

**8 Threads** von verschiedenen echten Profilen (Till, Alexander, Michael, Dominik, Nazmi, Cem etc.) mit gestaffelten Zeitstempeln über die letzten 3 Wochen:

1. "Vorlauftemperatur bei Altbau mit Radiatoren?" — Alexander (gelöst, mit akzeptierter Trainer-Antwort)
2. "Raumscan-App stürzt bei großen Räumen ab" — Nazmi (3 Antworten inkl. Trainer)
3. "Mindestabstände Außengerät — was gilt?" — Michael (gelöst, Trainer-Antwort akzeptiert)
4. "Unbegehbare Räume im Aufmaß dokumentieren?" — Dominik (2 Antworten)
5. "Pufferspeicher bei Fußbodenheizung nötig?" — Cem (Trainer-Antwort + Community)
6. "Wann braucht man einen neuen Zählerplatz?" — Till (1 Antwort)
7. "Fotos Heizungsraum — Best Practice?" — Alexander (unbeantwortet)
8. "Schallschutznachweis — wer ist zuständig?" — Nazmi (unbeantwortet, ganz neu)

**~15 Antworten** verteilt auf die Threads, davon 4-5 als `ist_trainer_antwort = true` (von Marina oder Till als Trainer). 2 Threads als `ist_geloest = true` mit `akzeptierte_antwort_id`.

## Technisch
- Inserts via Supabase Insert-Tool (umgeht RLS)
- Erst Threads einfügen, dann Antworten (wegen FK auf thread_id)
- Dann 2 Threads updaten mit `akzeptierte_antwort_id` und `ist_geloest = true`
- Keine Code-Änderungen nötig

