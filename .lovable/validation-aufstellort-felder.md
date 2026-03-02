# Validation: Aufstellort – 6 neue Felder

**Datum:** 2026-03-02

## Getestete Änderungen
- 6 neue Spalten auf `thermocheck.thermocheck_vot_formulare` (nullable)
- Zod Draft-Schema: 6 optionale Felder
- Zod Submit-Schema: 3 Distanzfelder + `aufstellort_aenderung` required; `distanz_alter_neuer_aufstellort` conditional; `raumscan_url` optional
- UI: Distanz-Block, Aufstellort-Änderung Toggle, Raumscan-URL mit externem Link

## RLS Policy Matrix
| Policy | Operation | Bedingung |
|---|---|---|
| `auth_insert_vot` | INSERT | `auth.uid() IS NOT NULL` |
| `auth_select_vot` | SELECT | `auth.uid() IS NOT NULL` |
| `auth_update_vot` | UPDATE | `auth.uid() IS NOT NULL` |

Neue Spalten werden automatisch abgedeckt. Keine Policy-Änderung nötig.

## Edge Cases
| Szenario | Status |
|---|---|
| Bestehende Formulare ohne neue Felder | ✅ nullable, UI zeigt leer |
| Auto-Save mit leeren neuen Feldern | ✅ null wird gespeichert |
| `aufstellort_aenderung = false` → Distanzfeld leer | ✅ Submit OK |
| `aufstellort_aenderung = true` → Distanzfeld leer | ✅ Submit blockiert |
| `raumscan_url` leer | ✅ optional |
| isReadOnly (abgeschlossenes Formular) | ✅ disabled durchgereicht |
| NaN bei leerem number-Input | ✅ valueAsNumber → NaN → Zod .min(0) fängt ab |

## Known Issues
Keine.
