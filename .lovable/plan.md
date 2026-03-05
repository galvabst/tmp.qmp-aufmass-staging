

# Fix: Contractor-Detail zeigt falsche/leere Daten

## Analyse der Probleme

### 1. Akademie zeigt "Nicht bestanden" obwohl Marius beim Coaching ist
- DB: `akademie_test_bestanden = false`, aber `akademie` ist in `completed_steps`
- Es gibt 0 Lektionen-Fortschritt-Records und 0 Quiz-Ergebnisse für Marius
- **Fix**: Frontend soll `akademie_test_bestanden` ODER `completedSteps.includes('akademie')` als "bestanden" werten (defensive Logik)
- **DB-Fix**: Migration setzt `akademie_test_bestanden = true` für alle wo `akademie` in `completed_steps` ist

### 2. Bestellungen zeigen nur "6 von 9" ohne Details
Marius hat 9 Bestellungen: tshirt(paid), poloshirt(paid), pullover(paid), ausweiskarte(paid), scanner-lizenz(paid), google-workspace(paid), schlappen(pending), 2x tshirt(pending)

**Fix**: Individuelle Produkte mit Status-Chips anzeigen statt nur Summe

### 3. Dokumente zeigen keine hochgeladenen Dateien
Gewerbeschein-URL und andere Dokument-Links werden nicht angezeigt (sind null bei Marius, aber generell muss die UI das richtig darstellen)

## Änderungen

| Datei | Änderung |
|-------|----------|
| `useAdminContractorList.ts` | Bestellungen als Array mit `{produktKey, status}` statt nur Summe zurückgeben |
| `ContractorDetailView.tsx` | Bestellungen: individuelle Produkt-Chips. Akademie: defensive Logik (`completedSteps` als Fallback). Dokumente: Gewerbeschein-Link wenn vorhanden |
| Migration (SQL) | `akademie_test_bestanden = true` setzen wo `akademie` in `completed_steps` |

### Bestellungen-UI (neu)
Jedes Produkt als Zeile: `Poloshirt ✓ bezahlt` / `Schlappen ○ offen` — statt nur "6 von 9"

### Akademie-UI (Fix)
- Wenn `akademie` in `completedSteps`: Abschlusstest = "Bestanden" (grüner Badge)
- Lektionen 0/51 nur wenn wirklich keine Fortschritt-Records existieren (korrekt für Marius da keine Records)

