# Validation: Contractor Boni System
Datum: 2026-03-04

## Features
1. **Bonus-Tabelle** `thermocheck.contractor_boni` mit Enums `contractor_bonus_typ_enum` und `contractor_bonus_status_enum`
2. **Bewertungsnachweis-Upload** als optionales Feld im Abschluss-Step des Aufmaß-Formulars
3. **Bonus-Anzeige** in ReviewView (3-spaltig) und ProfileView (Boni-Übersicht)

## DB-Schema
- `contractor_boni` mit UNIQUE-Constraint auf `(thermocheck_auftrag_id, bonus_typ)` → verhindert Doppelboni
- Bonus-Typen: `lead_conversion`, `bewertung_google`, `bewertung_trustpilot`
- Status: `ausstehend`, `freigegeben`, `ausgezahlt`, `abgelehnt`
- Bild-Kategorie `bewertung_nachweis` zum Enum hinzugefügt

## RPCs
- `erstelle_bewertungs_bonus(p_auftrag_id, p_bonus_typ, p_nachweis_path)` — SECURITY DEFINER, prüft Techniker-Zuordnung
- `get_my_contractor_boni()` — gibt eigene Boni mit Lead-Name zurück

## RLS Policies
| Policy | Operation | Bedingung |
|--------|-----------|-----------|
| contractor_boni_select_own | SELECT | contractor_onboarding.profile_id = auth.uid() |
| contractor_boni_select_admin | SELECT | is_admin() |
| contractor_boni_update_admin | UPDATE | is_admin() |
| contractor_boni_insert_admin | INSERT | is_admin() |

INSERT für Techniker erfolgt über SECURITY DEFINER RPC, nicht direkt.

## Bonus-Logik
- Einzelne Bewertung (Google ODER Trustpilot): 10 €
- Beide Bewertungen für selben Auftrag: 25 € + 25 € = 50 € gesamt
- Lead-Conversion-Bonus: 50 € (noch kein automatischer Trigger, muss manuell/per Admin erstellt werden)

## Offene Punkte
- [x] Lead-Conversion-Trigger: DB-Trigger `trg_lead_conversion_bonus` auf `public.auftraege` — feuert wenn `anzahlung_eingang_datum` von NULL auf Wert wechselt, erstellt 50€ Bonus via `thermocheck.erstelle_lead_conversion_bonus()` mit ON CONFLICT DO NOTHING
- [ ] Admin-UI für Bonus-Freigabe/Auszahlung
- [ ] Auszahlungs-Export (monatlich)

## Edge Cases
- Duplikat-Upload: DB UNIQUE Constraint verhindert doppelte Boni pro Auftrag+Typ
- Nicht-zugewiesener Techniker: RPC prüft `zugewiesener_techniker_id` Match
- Bewertungsnachweis ist optional (minAnzahl: 0)
