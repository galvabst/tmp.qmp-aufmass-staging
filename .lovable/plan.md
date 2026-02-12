
## Preise in der Datenbank aktualisieren

Folgende Preise werden direkt in der Datenbank angepasst (brutto inkl. 19% MwSt, netto wird berechnet):

| Produkt | Aktuell (brutto) | Neu (brutto) | Neu (netto) |
|---------|------------------|--------------|-------------|
| T-Shirt | 29,69 EUR | **38,99 EUR** | 32,76 EUR |
| Poloshirt | 41,59 EUR | **47,99 EUR** | 40,33 EUR |
| Schlappen | 23,74 EUR | **36,99 EUR** | 31,08 EUR |
| Pullover (Zip-Jacke) | 59,44 EUR | **78,99 EUR** | 66,38 EUR |
| Ausweiskarte | 11,84 EUR | **21,99 EUR** | 18,48 EUR |

Scanner-Lizenz (199,00 EUR) und Google Workspace (34,99 EUR) bleiben unverändert, da sie bereits korrekt sind.

### Technische Details

5 UPDATE-Statements auf `thermocheck.contractor_produkte` mit den neuen Brutto-Preisen und berechneten Netto-Preisen (brutto / 1.19, gerundet auf 2 Dezimalstellen). Danach Verifikation per SELECT-Query.
