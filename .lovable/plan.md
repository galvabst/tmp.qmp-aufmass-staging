

# Einsatzradius nach oben verschieben

## Änderung
Den Einsatzradius-Block (Zeilen 544-576) von seiner aktuellen Position (unterhalb der Akademie-Sektion) direkt nach dem Quartals-Kontingent-Block (nach Zeile 315) verschieben.

## Technisch

**Datei: `src/components/ProfileView.tsx`**

1. Den gesamten `{/* Einsatzradius */}`-Block (Zeilen 544-576) ausschneiden
2. Einfügen direkt nach `</section>` des Quartals-Kontingent-Blocks (nach Zeile 315, vor der Boni-Übersicht)

Die Reihenfolge wird dann: Stats → Kontingent → **Einsatzradius** → Boni → Pünktlichkeit → Aktivität → Akademie → Kontaktdaten

