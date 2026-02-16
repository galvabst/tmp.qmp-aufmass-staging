

## Fix: Alle Akademie-Lektionen bis auf die letzte als abgeschlossen markieren

### Problem

Es gibt 49 Lektionen insgesamt, aber nur 24 wurden als "completed" eingetragen. Viele Lektionen in Modulen 1-12 fehlen, daher bleiben die Module wegen der sequenziellen Freischaltung gesperrt.

### Loesung

25 fehlende Lektionen als "completed" einfuegen. Nur die allerletzte Lektion **12-4 "Freigabe & Rezertifizierung"** bleibt offen -- das ist das letzte Video, das du dir dann anschauen kannst, um den kompletten Flow (Video -> Quiz -> Zertifikat) zu testen.

Fehlende Lektionen, die eingefuegt werden:

| Code | Titel |
|------|-------|
| 1-2 | Was ist nicht Bestandteil? |
| 2-1 | Auftreten & Kleidung |
| 2-3 | Strukturierte Gespraechsfuehrung |
| 2-4 | Umgang mit schwierigen Situationen |
| 2-5 | Erwartungsmanagement |
| 4-1 | Auftragsbriefing verstehen |
| 4-2 | Equipment- & Material-Check |
| 4-3 | Tool- & App-Setup |
| 5-1 | Standard-Ablauf Vor-Ort |
| 5-2 | Raum-/Objekt-Systematik |
| 5-4 | Kommunikation waehrend Aufnahme |
| 6-1 | Prinzipien guter Datenerhebung |
| 6-2 | Mess- & Aufnahme-Grundregeln |
| 6-3 | Dokumentationsstandard |
| 6-4 | Belegstandard: Foto-Qualitaet |
| 6-5 | Umgang mit fehlenden Informationen |
| 8-4 | Professionelle Verabschiedung |
| 9-5 | Schnittstellenfaelle |
| 10-1 | Qualitaetskriterien |
| 10-4 | Fehlerbibliothek |
| 11-1 | Shadowing-Regeln |
| 11-2 | Feedback-Routine |
| 11-3 | Dokumentationsreview |
| 12-1 | Theorie-Kurztest |
| 12-2 | Praxispruefung Vor-Ort |
| 12-3 | Dokumentationspruefung |

**Offen bleibt nur:** 12-4 "Freigabe & Rezertifizierung" (ID: `40cb6b00-96a1-4837-af9c-977ef68b81d0`)

### Technische Details

- **Nur Daten-INSERT** in `thermocheck.contractor_akademie_lektions_fortschritt`
- 26 neue Eintraege mit `status = 'completed'` fuer contractor_id `66912458-4735-4e2a-9942-9c3bb525f447`
- Kein Code-Aenderung noetig, kein Schema-Change

