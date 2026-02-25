

# Plan: Mobile-Fixes — Zurueck-Button + Datei-Upload

## Probleme

Zwei separate Mobile-Bugs:

### 1. Zurueck-Button nicht tappbar

Der Zurueck-Pfeil oben links ist `fixed top-4 left-4 z-20` und liegt damit im **Safe-Area-Bereich** (Notch/Dynamic Island auf iPhones). Mobile Browser blockieren Touches in diesem Bereich. Ausserdem ueberlappt er mit dem sticky Header, was auf Touch-Geraeten zu Event-Konflikten fuehrt.

**Fix**: Den Zurueck-Button aus dem separaten `<button>` entfernen und stattdessen **in den Header** des Steppers integrieren. So ist er immer sichtbar, immer tappbar, und ausserhalb der Safe Area.

### 2. Datei/Kamera-Buttons funktionieren nicht

`document.createElement('input')` + `input.click()` ohne das Element ins DOM einzufuegen funktioniert auf **iOS Safari nicht**. Mobile Browser verlangen, dass das Input-Element Teil des DOMs ist, bevor ein programmatischer Click als User-Geste akzeptiert wird.

**Fix**: Das Input-Element ans DOM anhaengen (`document.body.appendChild`), Click ausfuehren, und nach dem Change-Event wieder entfernen (`input.remove()`).

## Aenderungen

### 1. `src/features/aufmass/ui/AufmassFormStepper.tsx`

Neuer Prop `onBack: () => void` fuer die Exit-Navigation. Der Zurueck-Button wird links im Header neben dem Step-Icon platziert:

```text
Header-Layout (vorher):
  [Icon] [Step-Titel]          [Visited-Badge]

Header-Layout (nachher):
  [←] [Icon] [Step-Titel]     [Visited-Badge]
```

Der `←`-Button ruft `onBack()` auf und ist klar vom internen "vorheriger Step"-Button in der Bottom-Navigation getrennt.

### 2. `src/features/aufmass/ui/AufmassFormPage.tsx`

- Den separaten `<button>` mit `fixed top-4 left-4` **entfernen**
- Stattdessen `onBack` als Prop an `AufmassFormStepper` uebergeben mit der gleichen Navigationslogik (History-Check + Fallback auf `/`)

### 3. `src/features/aufmass/ui/components/PhotoUploadField.tsx`

Beide Button-Clicks (Datei + Kamera) aendern: Input-Element ins DOM einfuegen bevor `.click()` aufgerufen wird, und danach wieder entfernen:

```typescript
const input = document.createElement('input');
input.type = 'file';
input.accept = 'image/*';
input.multiple = true;
input.style.display = 'none';      // NEU
document.body.appendChild(input);   // NEU
input.onchange = () => {
  handleFileUpload(input.files);
  input.remove();                   // NEU: Cleanup
};
input.click();
```

Gleiche Aenderung fuer den Kamera-Button (mit `capture = 'environment'`).

## Dateien

| Aktion | Datei |
|---|---|
| Aendern | `src/features/aufmass/ui/AufmassFormStepper.tsx` |
| Aendern | `src/features/aufmass/ui/AufmassFormPage.tsx` |
| Aendern | `src/features/aufmass/ui/components/PhotoUploadField.tsx` |

