

# Fix: `thermocheck.is_admin()` does not exist

## Ursache

Die Migration `20260304221658` hat die `admin_upsert_akademie_lektion` RPC neu erstellt, aber dabei auf Zeile 21 `thermocheck.is_admin()` referenziert. Die Funktion heißt aber `public.is_admin()`. Die Original-Migration (`20260302`) hatte es korrekt mit `public.is_admin()`.

## Fix

Eine neue Migration, die die `thermocheck.admin_upsert_akademie_lektion` Funktion mit dem korrekten `public.is_admin()`-Aufruf neu erstellt. Identischer Code, nur Zeile 21 korrigiert.

### Betroffene Dateien
| Datei | Änderung |
|-------|----------|
| Neue Migration SQL | `CREATE OR REPLACE FUNCTION thermocheck.admin_upsert_akademie_lektion` mit `public.is_admin()` statt `thermocheck.is_admin()` |

Keine Code-Änderungen nötig — nur der DB-Fix.

