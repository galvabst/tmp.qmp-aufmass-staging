-- Insert 8 forum threads with staggered timestamps
INSERT INTO thermocheck.contractor_forum_threads (id, autor_profile_id, titel, inhalt, erstellt_am, aktualisiert_am, ist_geloest)
VALUES
  -- Thread 1: Alexander — Vorlauftemperatur (gelöst)
  ('a1000000-0000-0000-0000-000000000001', '69e1b81d-4bf9-4453-8e60-4c937557a4d7',
   'Vorlauftemperatur bei Altbau mit Radiatoren?',
   'Hallo zusammen, ich habe nächste Woche einen ThermoCheck bei einem Altbau (Bj. 1965) mit klassischen Gusseisen-Radiatoren. Die aktuelle Vorlauftemperatur liegt laut Kunde bei 70°C. Wie gehe ich damit im Aufmaß um? Dokumentiere ich einfach die bestehenden Heizkörper oder muss ich auch eine Heizlastberechnung anstoßen? Danke für eure Tipps!',
   '2026-02-10 08:30:00+01', '2026-02-11 14:20:00+01', true),

  -- Thread 2: Nazmi — Raumscan-App (offen, mit Antworten)
  ('a1000000-0000-0000-0000-000000000002', '0ee3d0a1-fea8-44fe-9893-4bba39ba3e63',
   'Raumscan-App stürzt bei großen Räumen ab',
   'Hat noch jemand das Problem, dass die Raumscan-App bei Räumen über 40m² einfach abstürzt? Passiert mir jetzt schon zum dritten Mal. iPhone 14 Pro, neueste App-Version. Habt ihr eine Alternative oder einen Workaround?',
   '2026-02-12 11:45:00+01', '2026-02-14 09:10:00+01', false),

  -- Thread 3: Michael — Mindestabstände (gelöst)
  ('a1000000-0000-0000-0000-000000000003', '15a5761d-9321-4071-a5f6-acf2e397ccb8',
   'Mindestabstände Außengerät — was gilt?',
   'Moin! Beim letzten Aufmaß war der einzige mögliche Aufstellort für das Außengerät direkt an der Grundstücksgrenze (ca. 1,5m Abstand zum Nachbarn). Der Kunde fragt, ob das reicht. Ich bin unsicher — gibt es eine klare Regel, die wir im ThermoCheck dokumentieren sollen? Oder ist das Sache der Planung?',
   '2026-02-14 07:15:00+01', '2026-02-15 16:40:00+01', true),

  -- Thread 4: Dominik — Unbegehbare Räume (offen, 2 Antworten)
  ('a1000000-0000-0000-0000-000000000004', '26f3825e-2f04-4ec6-840c-2bbf1926186a',
   'Unbegehbare Räume im Aufmaß dokumentieren?',
   'Hatte heute einen ThermoCheck wo der Dachboden nicht begehbar war (keine Treppe, nur Luke). Wie dokumentiert ihr das im Formular? Einfach als "nicht begehbar" markieren und Foto von der Luke machen? Oder muss ich da mehr machen?',
   '2026-02-17 14:00:00+01', '2026-02-18 10:30:00+01', false),

  -- Thread 5: Cem — Pufferspeicher (offen, Antworten vorhanden)
  ('a1000000-0000-0000-0000-000000000005', 'ae1318c8-39ca-461a-bff5-44c5ff6ad537',
   'Pufferspeicher bei Fußbodenheizung nötig?',
   'Frage an die erfahrenen Kollegen: Wenn ein Haus komplett Fußbodenheizung hat, braucht man dann trotzdem einen Pufferspeicher? Mein letzter Kunde hatte das gefragt und ich war mir nicht sicher. Dokumentieren wir das überhaupt im Aufmaß oder ist das reine Planungssache?',
   '2026-02-20 09:30:00+01', '2026-02-21 11:00:00+01', false),

  -- Thread 6: Till — Zählerplatz (offen, 1 Antwort)
  ('a1000000-0000-0000-0000-000000000006', 'c0893b68-bc58-4694-94dc-9d991efdec12',
   'Wann braucht man einen neuen Zählerplatz?',
   'Mir ist aufgefallen, dass viele Altbauten noch alte Zählerschränke haben (vor 2010). Ab wann muss der Zählerplatz erneuert werden, wenn eine WP installiert wird? Gibt es da eine Faustregel, die wir im Elektrik-Teil des Aufmaßes beachten sollten?',
   '2026-02-22 16:20:00+01', '2026-02-23 08:45:00+01', false),

  -- Thread 7: Alexander — Fotos Best Practice (unbeantwortet)
  ('a1000000-0000-0000-0000-000000000007', '69e1b81d-4bf9-4453-8e60-4c937557a4d7',
   'Fotos Heizungsraum — Best Practice?',
   'Ich merke, dass meine Fotos vom Heizungsraum manchmal nicht aussagekräftig genug sind für die Planer. Hat jemand Tipps, welche Perspektiven man unbedingt fotografieren sollte? Typschild Kessel ist klar, aber was noch? Verrohrung? Abgasführung? Pufferspeicher-Anschlüsse?',
   '2026-02-26 10:00:00+01', '2026-02-26 10:00:00+01', false),

  -- Thread 8: Nazmi — Schallschutz (unbeantwortet, ganz neu)
  ('a1000000-0000-0000-0000-000000000008', '0ee3d0a1-fea8-44fe-9893-4bba39ba3e63',
   'Schallschutznachweis — wer ist zuständig?',
   'Hatte gestern einen Kunden, der wegen Schallschutz besorgt war. Nachbar hatte wohl schon Stress mit einer anderen WP-Installation in der Straße. Müssen wir als Techniker da irgendwas dokumentieren oder ist der Schallschutznachweis komplett Planungssache? Will beim nächsten Mal vorbereitet sein.',
   '2026-03-02 08:00:00+01', '2026-03-02 08:00:00+01', false);
