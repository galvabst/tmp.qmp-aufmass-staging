

# Neue Akademie-Lektion 6.3.2 anlegen

## Was passiert

Eine weitere Lektion wird in Modul 6 eingefuegt -- direkt nach der gerade angelegten 6.3.1.

## Aktuelle Struktur Modul 6 (nach letzter Aenderung)

| Code  | Reihenfolge | Titel |
|-------|-------------|-------|
| 6-1   | 1           | Prinzipien guter Datenerhebung |
| 6-2   | 2           | Mess- & Aufnahme-Grundregeln |
| 6-3   | 3           | Dokumentationsstandard |
| 6-3-1 | 4           | Raumweise Gebaeude Daten in der Software kurz erklaert |
| 6-4   | 5           | Belegstandard: Foto-Qualitaet |
| 6-5   | 6           | Umgang mit fehlenden Informationen |

## Neue Struktur nach Aenderung

| Code  | Reihenfolge | Titel |
|-------|-------------|-------|
| 6-1   | 1           | Prinzipien guter Datenerhebung |
| 6-2   | 2           | Mess- & Aufnahme-Grundregeln |
| 6-3   | 3           | Dokumentationsstandard |
| 6-3-1 | 4           | Raumweise Gebaeude Daten in der Software kurz erklaert |
| **6-3-2** | **5** | **Heizlastberechnung: Allgemeine Standards und Grundlagen** |
| 6-4   | 6           | Belegstandard: Foto-Qualitaet |
| 6-5   | 7           | Umgang mit fehlenden Informationen |

## Technische Umsetzung

Eine SQL-Datenoperation (kein Schema-Change):

**Schritt 1**: Bestehende Lektionen ab Reihenfolge 5 um 1 nach hinten verschieben.

**Schritt 2**: Neue Lektion einfuegen mit:
- `modul_id`: `a4cb8918-c503-4b7d-8c0c-84daca3aac65` (Modul 6)
- `code`: `6-3-2`
- `titel`: "Heizlastberechnung: Allgemeine Standards und Grundlagen"
- `reihenfolge`: 5
- `video_url`: `https://iframe.mediadelivery.net/play/591760/338cc614-9947-4e96-aae3-a5a524f47779`
- `video_dauer_minuten`: 5 (Schaetzwert -- bei Bedarf anpassbar)
- `ist_aktiv`: true

## Kein Frontend-Code betroffen

Gleicher Mechanismus wie bei 6.3.1: Der Hook laedt alle aktiven Lektionen nach Reihenfolge sortiert, die neue erscheint automatisch.

