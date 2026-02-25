

# Plan: Einheitliches Premium-Design ueber alle Views

## Problem-Analyse

Aktuell gibt es 3 verschiedene Header-Stile in der App:

| View | Header-Stil | Logo | Problem |
|---|---|---|---|
| PoolView | `bg-gradient-to-br from-primary to-primary/85` | `variant="white"` ✓ | Referenz-Design |
| ProfileView | `bg-gradient-to-br from-primary to-primary/85` | `variant="white"` ✓ | OK |
| BookingsView | `bg-primary` (flach) | `size="sm"` (SCHWARZ!) | Logo schwarz auf orange |
| ActiveOrdersView | `bg-primary` (flach) | `size="sm"` (SCHWARZ!) | Logo schwarz auf orange |
| ReviewView | `bg-primary` (flach) | `size="sm"` (SCHWARZ!) | Logo schwarz auf orange |
| ForumView | `bg-card border-b` (weiss) | Kein Logo | Komplett anderer Stil |

Die Screenshots zeigen: BookingsView hat das schwarze Logo auf orangem Hintergrund. Das sieht unprofessionell aus.

## Loesung: Einheitlicher Premium-Header

Alle 6 Views bekommen den gleichen Header-Stil wie PoolView (das "Apple-Design"):
- Gradient: `bg-gradient-to-br from-primary to-primary/85`
- Logo: `<GalvanekLogo size="sm" variant="white" className="opacity-95" />`
- Typografie: `text-2xl font-bold tracking-tight` fuer Titel
- Subtitle: `text-primary-foreground/70 text-sm`

## Betroffene Dateien & Aenderungen

### 1. `src/components/BookingsView.tsx` (Zeile 45-58)
- Header: `bg-primary` → `bg-gradient-to-br from-primary to-primary/85`
- Logo: `<GalvanekLogo size="sm" />` → `<GalvanekLogo size="sm" variant="white" className="opacity-95" />`
- Titel: `text-xl` → `text-2xl font-bold tracking-tight`
- Subtitle: `text-primary-foreground/80` → `text-primary-foreground/70`

### 2. `src/components/ActiveOrdersView.tsx` (Zeile 104-116)
- Gleiche Aenderungen wie BookingsView

### 3. `src/components/ReviewView.tsx` (Zeile 38-50)
- Gleiche Aenderungen wie BookingsView

### 4. `src/features/forum/ui/ForumView.tsx` (Zeile 38)
- Header komplett ersetzen: `bg-card border-b` → Premium-Gradient-Header mit Logo
- Filter-Buttons: Glassmorphism-Stil (`bg-white/15 backdrop-blur-sm border-white/10`) passend zum PoolView Tab-Switcher
- "Frage stellen" Button: `bg-white text-primary` statt Standard-Primary (damit er auf Orange sichtbar ist)

### 5. `src/components/TechnicianOrderCard.tsx`
- Karte leicht verfeinern: `rounded-2xl` bleibt, `shadow-sm` → `shadow-card` fuer Konsistenz mit dem Design-System

### 6. `src/components/BottomNav.tsx`
- Leichte Verfeinerung: Schriftgroesse von `text-[9px]` → `text-[10px]` fuer bessere Lesbarkeit
- Icon-Stroke bei aktiv: bereits `stroke-[2.5px]` ✓

## Design-Sprache (Apple-inspiriert)

```text
┌─────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← Gradient Header (orange)
│ Logo (weiss)        [Actions]   │
│ Titel (2xl, bold, tracking)     │
│ Subtitle (70% opacity)         │
├─────────────────────────────────┤
│                                 │  ← Weisser Content-Bereich
│  ┌───────────────────────────┐  │
│  │ Card (rounded-2xl,       │  │
│  │       shadow-card)       │  │
│  └───────────────────────────┘  │
│                                 │
├─────────────────────────────────┤
│ ○ Pool  ○ Buch  ○ Aktiv  ○ ... │  ← Bottom Nav
└─────────────────────────────────┘
```

## Keine DB-Aenderungen, keine neuen Dependencies

Rein visuelle Anpassungen in 5 Dateien. Alle Aenderungen nutzen existierende CSS-Variablen und Tailwind-Klassen.

