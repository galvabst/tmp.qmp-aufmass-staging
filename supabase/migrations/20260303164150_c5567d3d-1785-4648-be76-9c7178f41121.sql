-- Insert ~13 answers across threads
INSERT INTO thermocheck.contractor_forum_antworten (id, thread_id, autor_profile_id, inhalt, ist_trainer_antwort, erstellt_am, aktualisiert_am)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'ae1318c8-39ca-461a-bff5-44c5ff6ad537',
   'Hatte ich letztens auch! Ich dokumentiere immer alle vorhandenen Heizkörper mit Typ und Größe. Die Heizlastberechnung macht dann die Planung. Wichtig ist, dass du die Vorlauftemperatur im Formular einträgst.',
   false, '2026-02-10 10:15:00+01', '2026-02-10 10:15:00+01'),

  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001',
   'd7140c90-512b-43b0-9751-f62f308f05e7',
   'Genau richtig, Cem! Im Aufmaß dokumentiert ihr die IST-Situation: Heizkörpertyp, Größe, Anzahl pro Raum und die aktuelle Vorlauftemperatur. Die Heizlastberechnung ist NICHT eure Aufgabe — das macht die Planung. Aber: Bitte unbedingt auch die Fenster (Baujahr, Verglasung) und Dämmung fotografieren, das brauchen die Planer für die Berechnung. Bei 70°C VL wird wahrscheinlich ein Heizkörpertausch nötig sein.',
   true, '2026-02-10 14:30:00+01', '2026-02-10 14:30:00+01'),

  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001',
   '69e1b81d-4bf9-4453-8e60-4c937557a4d7',
   'Super, danke Marina! Das mit den Fenstern und der Dämmung ist ein guter Hinweis, das vergesse ich manchmal. Markiere ich als gelöst 👍',
   false, '2026-02-11 14:20:00+01', '2026-02-11 14:20:00+01'),

  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002',
   '15a5761d-9321-4071-a5f6-acf2e397ccb8',
   'Ja, das Problem kenne ich! Bei mir hilft es, den Raum in zwei Hälften zu scannen und dann zusammenzusetzen. Nicht ideal, aber funktioniert als Workaround.',
   false, '2026-02-12 14:20:00+01', '2026-02-12 14:20:00+01'),

  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002',
   '26f3825e-2f04-4ec6-840c-2bbf1926186a',
   'Bei mir stürzt sie auch ab, aber nur auf dem iPhone. Auf meinem alten Samsung Galaxy läuft sie stabiler. Vielleicht ein iOS-Problem?',
   false, '2026-02-13 08:30:00+01', '2026-02-13 08:30:00+01'),

  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002',
   'c0893b68-bc58-4694-94dc-9d991efdec12',
   'Das ist ein bekanntes Problem mit der aktuellen App-Version auf iOS. Ein Update ist in Arbeit. Bis dahin: Michaels Tipp mit dem Aufteilen in zwei Scans ist der beste Workaround. Alternativ könnt ihr bei sehr großen Räumen auch manuell messen und die Maße direkt im Aufmaß-Formular eintragen.',
   true, '2026-02-14 09:10:00+01', '2026-02-14 09:10:00+01'),

  ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000003',
   'ae1318c8-39ca-461a-bff5-44c5ff6ad537',
   'Ich hatte mal einen ähnlichen Fall. Der Planer hat dann gesagt, 3m Abstand zur Grundstücksgrenze wäre ideal. Aber ich glaube, das hängt auch von der Gemeinde ab.',
   false, '2026-02-14 09:00:00+01', '2026-02-14 09:00:00+01'),

  ('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000003',
   'd7140c90-512b-43b0-9751-f62f308f05e7',
   'Die Mindestabstände sind laut TA Lärm und den jeweiligen Landesbauordnungen geregelt. Als Faustregel: mindestens 3m zur Grundstücksgrenze, idealerweise mehr. Im Aufmaß dokumentiert ihr bitte: den geplanten Aufstellort mit Foto, den Abstand zum Nachbargebäude (messen!) und ob es schallreflektierende Wände in der Nähe gibt (z.B. Garagenwand). Die endgültige Berechnung macht die Planung, aber eure Doku ist die Grundlage dafür!',
   true, '2026-02-15 16:40:00+01', '2026-02-15 16:40:00+01'),

  ('b1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000004',
   '0ee3d0a1-fea8-44fe-9893-4bba39ba3e63',
   'Foto von der Luke ist auf jeden Fall wichtig. Ich schreibe auch immer in die Notizen, warum der Raum nicht begehbar war. Manchmal fragt die Planung nach.',
   false, '2026-02-17 16:30:00+01', '2026-02-17 16:30:00+01'),

  ('b1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000004',
   '69e1b81d-4bf9-4453-8e60-4c937557a4d7',
   'Im Formular gibt es ja den Bereich "Unbegehbare Räume" — dort einfach den Raum eintragen, Grund angeben und Foto hochladen. Wenn der Kunde weiß, was oben ist (z.B. Dämmung), das auch notieren. Hab ich schon öfter so gemacht, kam nie eine Rückfrage.',
   false, '2026-02-18 10:30:00+01', '2026-02-18 10:30:00+01'),

  ('b1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000005',
   '15a5761d-9321-4071-a5f6-acf2e397ccb8',
   'Soweit ich weiß, braucht man bei reiner FBH keinen Pufferspeicher, weil die FBH selbst als Puffer dient. Aber ich bin kein Planer 😅',
   false, '2026-02-20 11:00:00+01', '2026-02-20 11:00:00+01'),

  ('b1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000005',
   'd7140c90-512b-43b0-9751-f62f308f05e7',
   'Michael hat recht — bei reiner Fußbodenheizung ist in der Regel kein Pufferspeicher nötig, da die FBH selbst genug Speichermasse hat. ABER: Wenn es Mischsysteme gibt (z.B. FBH im EG + Radiatoren im OG), dann wird meistens ein Puffer eingeplant. Im Aufmaß bitte dokumentieren: welche Heizkreise gibt es, welche Stockwerke haben FBH und welche Radiatoren. Das reicht für die Planung.',
   true, '2026-02-21 11:00:00+01', '2026-02-21 11:00:00+01'),

  ('b1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000006',
   '26f3825e-2f04-4ec6-840c-2bbf1926186a',
   'Gute Frage! Bei uns in NRW sagt der Elektriker meistens, dass alles vor 2007 getauscht werden muss. Ich fotografiere immer das Typenschild vom Zählerschrank mit — dann kann die Planung entscheiden.',
   false, '2026-02-23 08:45:00+01', '2026-02-23 08:45:00+01');

-- Mark 2 threads as solved with accepted answer
UPDATE thermocheck.contractor_forum_threads
SET akzeptierte_antwort_id = 'b1000000-0000-0000-0000-000000000002'
WHERE id = 'a1000000-0000-0000-0000-000000000001';

UPDATE thermocheck.contractor_forum_threads
SET akzeptierte_antwort_id = 'b1000000-0000-0000-0000-000000000008'
WHERE id = 'a1000000-0000-0000-0000-000000000003';
