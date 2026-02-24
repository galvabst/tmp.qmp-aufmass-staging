

# Pool-Header Redesign + Map-Bug Fix

## Probleme

1. **"29 in deiner Region"** ist falsch -- es sind 29 insgesamt verfuegbare Auftraege, nicht regional gefiltert
2. **Karten-Tab funktioniert nicht** -- Map-Container bekommt keine Hoehe weil `h-[calc(100vh-200px)]` nicht greift wenn die Filter darueber dynamische Hoehe haben
3. **Logo: Orange auf Orange** sieht schlecht aus, zu klein, schlecht lesbar
4. **UI insgesamt zu generisch** -- soll hochwertiger/professioneller wirken (Apple-Aesthetik)

## Design-Konzept: Premium Header

Statt dem aktuellen flachen Orange-Header mit eingequetschtem Logo wird ein cleaner, minimalistischer Header im Apple-Stil gebaut:

```text
+--------------------------------------------------+
|  Galvanek (Logo, weiss invertiert)    [Liste|Map] |
|                                                    |
|  Verfuegbare Auftraege                             |
|  29 Auftraege                                      |
+--------------------------------------------------+
```

### Design-Prinzipien:
- **Logo weiss invertiert** auf dem orangenen Header statt dem schwarz-orangenen PNG -- dadurch sieht man es klar
- Logo **links oben** positioniert, nicht rechts gequetscht neben dem Tab-Switcher
- **Subtiler Gradient** statt flachem Orange: `from-primary to-primary/90`
- **Groesserer, luftigerer Header** mit mehr Padding
- **"29 Auftraege"** statt "29 in deiner Region" (korrekte Beschreibung)
- **Tab-Switcher** mit Glassmorphism-Effekt (backdrop-blur, semi-transparenter Hintergrund)
- **Order Cards** mit subtileren Schatten und leichtem Hover-Effekt

### Profil-Header ebenfalls aufgeraeumt:
- Logo dort ebenfalls weiss invertiert oder ganz entfernen (redundant)

---

## Technische Aenderungen

### 1. `src/components/GalvanekLogo.tsx`
- Neue Variante `variant?: 'default' | 'white'` hinzufuegen
- Bei `white`: CSS-Filter `brightness(0) invert(1)` auf das PNG anwenden -- damit wird das schwarze Logo weiss, ohne ein zweites Asset zu brauchen

### 2. `src/components/PoolView.tsx` -- Header Redesign
- Logo nach links oben, weisse Variante
- Text aendern: `{poolOrders.length} Aufträge` statt `{poolOrders.length} in deiner Region`
- Header-Layout umstrukturieren: Logo + Title links, Tab-Switcher rechts
- Subtiler Gradient-Hintergrund
- Tab-Switcher mit `bg-white/15 backdrop-blur-sm` fuer Glassmorphism
- Mehr Padding/Spacing fuer Premium-Gefuehl

### 3. `src/components/PoolView.tsx` -- Map-Bug Fix
- Map-Container: Statt feste `h-[calc(100vh-200px)]` eine flexible Berechnung nutzen
- `flex-1` Layout verwenden: Header + Filter als feste Elemente, Content-Bereich fuellt den Rest
- Gesamtes Layout auf `flex flex-col h-screen` umstellen

### 4. `src/components/TechnicianOrderCard.tsx` -- Subtile Verbesserungen
- Leicht verfeinerte Schatten und Hover-Animationen
- Badge-Styling eleganter: statt harter secondary-Farbe ein subtileres Chip-Design

### 5. `src/components/ProfileView.tsx` -- Logo-Bereich aufgeraeumt
- Logo weisse Variante verwenden oder alternativ entfernen (da Header bereits orange ist)

### 6. `src/components/FilterRow.tsx` -- keine Aenderungen noetig

---

## Dateien

| Datei | Aenderung |
|---|---|
| `src/components/GalvanekLogo.tsx` | `variant='white'` mit CSS-Filter |
| `src/components/PoolView.tsx` | Header-Redesign, Text-Fix, Map-Height-Fix mit Flex-Layout |
| `src/components/TechnicianOrderCard.tsx` | Subtilere Card-Aesthetik |
| `src/components/ProfileView.tsx` | Logo-Variante anpassen |

