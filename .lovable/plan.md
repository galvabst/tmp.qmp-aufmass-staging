

# Akademie-Module 12 und 13 entfernen

## Problem

In der Akademie gibt es zwei Module, die nicht dorthin gehören:
- **Modul 12** ("Praxisphase: Training on the Job") - gehört zum Coaching-Schritt (Schritt 7 im Onboarding)
- **Modul 13** ("Prüfung & Zertifizierung") - ist bereits durch den Abschlusstest in der Akademie abgedeckt

## Lösung

Die Module werden in der Datenbank deaktiviert (`ist_aktiv = false`). Dadurch werden sie vom `useAkademieContent`-Hook automatisch nicht mehr geladen, da dieser nur `ist_aktiv = true` abfragt.

Es ist **keine Frontend-Änderung** nötig.

## Betroffene DB-Einträge

| Modul | ID | Aktion |
|---|---|---|
| Praxisphase: Training on the Job (reihenfolge 11) | `c9715b06-9638-4dc4-8837-bebbc66be074` | `ist_aktiv = false` |
| Prüfung & Zertifizierung (reihenfolge 12) | `68ea9e78-ab4f-4684-9c9e-1e497fce006a` | `ist_aktiv = false` |

## Technische Umsetzung

Eine einzelne SQL-Migration:

```sql
UPDATE thermocheck.contractor_akademie_module
SET ist_aktiv = false, updated_at = now()
WHERE id IN (
  'c9715b06-9638-4dc4-8837-bebbc66be074',
  '68ea9e78-ab4f-4684-9c9e-1e497fce006a'
);
```

## Warum kein Frontend-Code betroffen ist

Der Hook `useAkademieContent` filtert bereits mit `.eq('ist_aktiv', true)` - deaktivierte Module werden automatisch nicht mehr angezeigt. Auch zugehörige Lektionen dieser Module werden nicht mehr geladen, da sie über `modul_id` verknüpft sind und nur Lektionen aktiver Module im UI erscheinen.

## Risiken

Keine. Die Daten bleiben erhalten und können jederzeit durch `ist_aktiv = true` reaktiviert werden. Bestehender Lernfortschritt von Usern für diese Module bleibt in der DB gespeichert.

