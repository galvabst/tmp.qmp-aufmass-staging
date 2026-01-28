
# Plan: Beispielbilder für Profilfoto-Upload hinzufügen

## Zusammenfassung
Im ProfileStep werden die hochgeladenen Beispielbilder hinzugefügt, die zeigen:
1. **Gutes Beispiel**: Professionelles Foto mit neutralem Hintergrund, guter Beleuchtung
2. **Schlechtes Beispiel**: Ganzkörperfoto, zu weit weg, unprofessionell

## Hochgeladene Bilder

| Bild | Verwendung |
|------|------------|
| `image-12.png` | ✓ Gutes Beispiel - klares Porträt, neutraler Hintergrund |
| `image-13.png` | ✗ Schlechtes Beispiel - Ganzkörper, zu weit weg |

## UI-Design

### Neue Sektion unter dem Avatar-Upload

```text
┌──────────────────────────────────────────────────────────┐
│              [Avatar Upload wie bisher]                  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  💡 So sollte dein Foto aussehen                   │  │
│  │                                                    │  │
│  │  Dein Foto erscheint auf deiner offiziellen        │  │
│  │  Thermocheck-Ausweiskarte. Ein professionelles     │  │
│  │  Foto macht einen guten ersten Eindruck beim Kunden│  │
│  │                                                    │  │
│  │  Tipps für ein gutes Foto:                        │  │
│  │  ✓ Neutraler, einfarbiger Hintergrund             │  │
│  │  ✓ Gute Beleuchtung, Gesicht klar erkennbar       │  │
│  │  ✓ Nahaufnahme (Kopf und Schultern)               │  │
│  │  ✓ Freundlicher, professioneller Ausdruck         │  │
│  │                                                    │  │
│  │  ┌─────────────────┐    ┌─────────────────┐       │  │
│  │  │      ✓ So       │    │    ✗ So nicht   │       │  │
│  │  │   [Gutes Bild]  │    │ [Schlechtes Bild]│       │  │
│  │  │                 │    │                  │       │  │
│  │  │  Nahaufnahme,   │    │  Ganzkörper,     │       │  │
│  │  │  gute Beleucht. │    │  zu weit weg     │       │  │
│  │  └─────────────────┘    └─────────────────┘       │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Änderungen

### 1. Bilder in Projekt kopieren

```text
src/assets/onboarding/
  ├── foto-beispiel-gut.png    (aus image-12.png)
  └── foto-beispiel-schlecht.png (aus image-13.png)
```

### 2. ProfileStep.tsx erweitern

Eine neue "PhotoGuidelines" Sektion wird nach dem Avatar-Upload eingefügt:

```tsx
import fotoGut from '@/assets/onboarding/foto-beispiel-gut.png';
import fotoSchlecht from '@/assets/onboarding/foto-beispiel-schlecht.png';
import { Lightbulb, Check, X } from 'lucide-react';

// Nach dem Avatar-Upload Block:
<div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
  <div className="flex items-center gap-2 text-amber-800">
    <Lightbulb className="w-5 h-5" />
    <h4 className="font-semibold">So sollte dein Foto aussehen</h4>
  </div>
  
  <p className="text-sm text-amber-900">
    Dein Foto erscheint auf deiner offiziellen Thermocheck-Ausweiskarte. 
    Ein professionelles Foto macht einen guten ersten Eindruck beim Kunden.
  </p>
  
  {/* Tipps-Liste */}
  <div className="space-y-2 text-sm text-amber-900">
    <p className="font-medium">Tipps für ein gutes Foto:</p>
    <ul className="space-y-1.5">
      <li className="flex items-start gap-2">
        <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
        <span>Neutraler, einfarbiger Hintergrund</span>
      </li>
      <li className="flex items-start gap-2">
        <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
        <span>Gute Beleuchtung, Gesicht klar erkennbar</span>
      </li>
      <li className="flex items-start gap-2">
        <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
        <span>Nahaufnahme (Kopf und Schultern)</span>
      </li>
      <li className="flex items-start gap-2">
        <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
        <span>Freundlicher, professioneller Ausdruck</span>
      </li>
    </ul>
  </div>
  
  {/* Gut vs. Schlecht Vergleich */}
  <div className="grid grid-cols-2 gap-4 pt-2">
    <div className="text-center space-y-2">
      <div className="relative inline-block">
        <img 
          src={fotoGut} 
          alt="Gutes Beispiel" 
          className="w-32 h-40 object-cover object-top rounded-lg shadow-md"
        />
        <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 shadow">
          <Check className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-sm font-medium text-green-700">So geht's</p>
      <p className="text-xs text-muted-foreground">
        Nahaufnahme, gute Beleuchtung
      </p>
    </div>
    
    <div className="text-center space-y-2">
      <div className="relative inline-block">
        <img 
          src={fotoSchlecht} 
          alt="Schlechtes Beispiel" 
          className="w-32 h-40 object-cover object-top rounded-lg shadow-md opacity-80"
        />
        <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow">
          <X className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-sm font-medium text-red-700">So nicht</p>
      <p className="text-xs text-muted-foreground">
        Ganzkörper, zu weit entfernt
      </p>
    </div>
  </div>
</div>
```

## Dateien die geändert/erstellt werden

| Datei | Aktion |
|-------|--------|
| `src/assets/onboarding/foto-beispiel-gut.png` | Neu (kopiert von user-uploads) |
| `src/assets/onboarding/foto-beispiel-schlecht.png` | Neu (kopiert von user-uploads) |
| `src/components/onboarding/steps/ProfileStep.tsx` | Erweitert mit PhotoGuidelines Sektion |

## Technische Details

### Import-Struktur in ProfileStep.tsx
```typescript
import { useState } from 'react';
import { Camera, User, Lightbulb, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ApplicantProfile } from '@/types/onboarding';

// Beispielbilder importieren
import fotoGut from '@/assets/onboarding/foto-beispiel-gut.png';
import fotoSchlecht from '@/assets/onboarding/foto-beispiel-schlecht.png';
```

### Platzierung im Layout
Die neue Sektion wird nach dem Avatar-Upload Block eingefügt (ca. Zeile 65), vor den "Persönliche Daten".

## Hinweis zu den Bildern

Die hochgeladenen Bilder zeigen bereits:
- **Gutes Beispiel**: Professionelle Nahaufnahme mit neutralem Hintergrund
- **Schlechtes Beispiel**: Ganzkörperfoto mit rotem X darüber

Die Bilder enthalten noch echte Namen (Mark Röder), aber da sie als Beispielbilder für das richtige Format dienen (nicht als echte Personendaten), sollte das akzeptabel sein. Falls gewünscht, können wir später anonymisierte Versionen erstellen.
