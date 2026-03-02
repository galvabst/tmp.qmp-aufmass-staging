

# Fix: Grundpreise auf bestehende Auftraege migrieren + UI absichern

## Ursache

- Die DB-Migration hat `vereinbarter_preis` als neue Spalte hinzugefuegt, aber alle **bestehenden** zugewiesenen Auftraege haben `NULL`.
- Die `accept_pool_order` RPC setzt den Preis nur fuer **neue** Annahmen.
- Im Frontend rendert `ReviewView` bei `billableAmount === undefined` ein nacktes "€ €" ohne Betrag.

## Aenderungen

### 1. Daten-Migration (SQL)

Alle bestehenden zugewiesenen Auftraege rueckwirkend mit dem Contractor-Grundpreis befuellen:

```sql
UPDATE thermocheck.thermocheck_auftraege a
SET vereinbarter_preis = cg.betrag_netto
FROM thermocheck.contractor_grundpreise cg
WHERE a.zugewiesener_techniker_id = cg.contractor_id
  AND COALESCE(a.auftragstyp, 'thermocheck') = cg.auftragstyp
  AND a.vereinbarter_preis IS NULL;
```

Das nimmt fuer jeden Auftrag den aktuellen Grundpreis des zugewiesenen Contractors. Da es bisher keine Preisaenderungen gab, ist das korrekt.

### 2. Frontend-Fix: ReviewView

Zeile 130-133 absichern -- wenn `billableAmount` undefined/null ist, "–" anzeigen statt leeres Euro-Zeichen:

```tsx
{order.billableAmount != null
  ? `${order.billableAmount.toFixed(2)} €`
  : '–'}
```

Gleiche Absicherung bei den Summary-Betraegen (pendingAmount, approvedAmount) -- die `reduce` summiert bereits mit `|| 0`, das ist okay.

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| Migration SQL | UPDATE bestehende Auftraege mit Grundpreis |
| `src/components/ReviewView.tsx` | Null-Check fuer billableAmount-Anzeige |

