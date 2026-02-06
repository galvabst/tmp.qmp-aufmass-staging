

# Neue Akademie-Lektion 6.3.1 anlegen

## Was passiert

Eine neue Lektion wird in Modul 6 ("Datenerhebung: Qualitaet, Vollstaendigkeit, Nachvollziehbarkeit") eingefuegt -- mit dem Bunny Stream Video eingebettet.

## Aktuelle Struktur Modul 6

| Code | Reihenfolge | Titel |
|------|-------------|-------|
| 6-1  | 1           | Prinzipien guter Datenerhebung |
| 6-2  | 2           | Mess- & Aufnahme-Grundregeln |
| 6-3  | 3           | Dokumentationsstandard |
| **NEU** | **4** | **Raumweise Gebaeude Daten in der Software kurz erklaert** |
| 6-4  | 4 -> 5      | Belegstandard: Foto-Qualitaet |
| 6-5  | 5 -> 6      | Umgang mit fehlenden Informationen |

## Neue Struktur nach Aenderung

| Code  | Reihenfolge | Titel |
|-------|-------------|-------|
| 6-1   | 1           | Prinzipien guter Datenerhebung |
| 6-2   | 2           | Mess- & Aufnahme-Grundregeln |
| 6-3   | 3           | Dokumentationsstandard |
| 6-3-1 | 4           | Raumweise Gebaeude Daten in der Software kurz erklaert |
| 6-4   | 5           | Belegstandard: Foto-Qualitaet |
| 6-5   | 6           | Umgang mit fehlenden Informationen |

## Technische Umsetzung

Eine einzige SQL-Datenoperation (kein Schema-Change, daher per Insert-Tool):

**Schritt 1**: Bestehende Lektionen 6-4 und 6-5 in der Reihenfolge um 1 nach hinten verschieben.

**Schritt 2**: Neue Lektion einfuegen mit:
- `modul_id`: `a4cb8918-c503-4b7d-8c0c-84daca3aac65` (Modul 6)
- `code`: `6-3-1`
- `titel`: "Raumweise Gebaeude Daten in der Software kurz erklaert"
- `reihenfolge`: 4
- `video_url`: `https://iframe.mediadelivery.net/play/591760/8d31b459-c3b3-4539-915f-efa34341db03`
- `ist_aktiv`: true

## Kein Frontend-Code betroffen

Der `useAkademieContent`-Hook laedt alle aktiven Lektionen nach `reihenfolge` sortiert. Die neue Lektion erscheint automatisch an Position 4 im Modul. Das Video wird ueber den bestehenden `MultiSourceVideoPlayer` (Bunny Stream iframe) abgespielt.

## Offene Frage

Die `video_dauer_minuten` muss gesetzt werden (wird fuer die Fortschrittskontrolle/Unskippable-Logik genutzt). Ich setze einen Schaetzwert, der bei Bedarf angepasst werden kann -- oder kennst du die genaue Laenge des Videos?

