

# Auto-Trigger: Lead-Conversion-Bonus (50 €)

## Problem
Der Lead-Conversion-Bonus (50 €) wird aktuell **nie automatisch erstellt** — das war als offener Punkt in der Boni-Validation dokumentiert. Wenn ein Lead zum Kunden wird (Anzahlung bezahlt), muss der Techniker, der den Thermocheck gemacht hat, automatisch 50 € Bonus erhalten.

## Lösung: DB-Trigger auf `leads`

Eine neue SQL-Migration erstellt einen Trigger auf der `public.leads`-Tabelle, der bei Update von `anzahlung_eingang_datum` (von NULL auf einen Wert) automatisch einen `lead_conversion`-Bonus für den zugewiesenen Techniker anlegt.

### Trigger-Logik (Pseudocode)
```text
WHEN leads.anzahlung_eingang_datum changes from NULL → non-NULL:
  1. Finde thermocheck_auftraege WHERE lead_id = leads.id
  2. Für jeden Auftrag mit zugewiesener_techniker_id:
     → INSERT contractor_boni (lead_conversion, 50€, ausstehend)
     → ON CONFLICT DO NOTHING (Duplikatschutz)
```

### Migration

| Objekt | Schema | Beschreibung |
|--------|--------|-------------|
| `thermocheck.erstelle_lead_conversion_bonus()` | Function | SECURITY DEFINER, erstellt 50€ Bonus für zugewiesenen Techniker |
| `trg_lead_conversion_bonus` | Trigger | AFTER UPDATE auf `public.leads`, feuert wenn `anzahlung_eingang_datum` gesetzt wird |

Die Funktion:
- Sucht alle `thermocheck_auftraege` mit passender `lead_id`
- Prüft ob `zugewiesener_techniker_id` vorhanden
- Inserted mit `ON CONFLICT (thermocheck_auftrag_id, bonus_typ) DO NOTHING` → keine Duplikate
- Betrag: fest 50 €

### Kein Frontend-Änderung nötig
Die bestehende `get_my_contractor_boni` RPC und die ReviewView/ProfileView zeigen den Bonus automatisch an, sobald er in der DB existiert.

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| Neue Migration (SQL) | Trigger-Funktion + Trigger auf `public.leads` |

