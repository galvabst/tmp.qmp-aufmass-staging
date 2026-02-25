

# Plan: Aufmaß-Button sichtbarer machen

## Problem

Der "Aufmaß erfassen"-Button (Zeile 617-627 in `TechnicianOrderDetail.tsx`) ist als `variant="outline"` gestylt — ein duenner Rahmen auf weissem Hintergrund, der zwischen den Cards untergeht. Auf dem Screenshot ist er kaum erkennbar. Ausserdem sitzt er zwischen dem Content und der fixen Action-Bar am unteren Rand, wo er leicht uebersehen oder ueberlappt wird.

## Loesung

Den Button deutlich prominenter gestalten:

1. **Eigene Card** statt nackter Button — gleicher Stil wie die anderen Info-Cards (rounded-xl, shadow-card, padding)
2. **Primary-Farbe** statt outline — `bg-primary text-primary-foreground` damit er im Orange der CI sofort auffaellt
3. **Groessere Darstellung** — `size="lg"` fuer mehr Tap-Target auf Mobile
4. **Icon + Text deutlicher** — ClipboardList-Icon bleibt, Text wird "Aufmaß-Formular öffnen"

## Aenderung

### `src/components/TechnicianOrderDetail.tsx` (Zeilen 617-627)

Vorher:
```tsx
{(isBookedOrder || isInProgress) && (
  <Button className="w-full" variant="outline"
    onClick={() => navigate(`/thermocheck/aufmass/${order.auftragId || order.id}`)}>
    <ClipboardList className="w-4 h-4 mr-2" />
    Aufmaß erfassen
  </Button>
)}
```

Nachher:
```tsx
{(isBookedOrder || isInProgress) && (
  <div className="bg-card rounded-xl p-4 shadow-card">
    <Button
      size="lg"
      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-base font-semibold"
      onClick={() => navigate(`/thermocheck/aufmass/${order.auftragId || order.id}`)}
    >
      <ClipboardList className="w-5 h-5 mr-2" />
      Aufmaß-Formular öffnen
    </Button>
  </div>
)}
```

Der Button bekommt eine eigene Card-Umrandung und Primary-Styling (Orange), sodass er visuell genauso gewichtet wird wie der "Navigation starten"-Button und sofort ins Auge faellt.

## Dateien

| Aktion | Datei |
|---|---|
| Aendern | `src/components/TechnicianOrderDetail.tsx` |

