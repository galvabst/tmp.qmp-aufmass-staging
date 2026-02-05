
# Automatische Weiterleitung für Admins

## Problem
Du (als superadmin) landest auf `/` und siehst "Kein Contractor-Zugang", weil:
- `/` ist die Techniker-App
- Sie erwartet einen `contractor_onboarding` Datensatz
- Du hast keinen, weil du Admin bist, kein Techniker

## Lösung: Smart Routing

Die App soll automatisch erkennen:
- **Admin ohne Contractor-Record** → Weiterleitung zu `/admin`
- **Techniker mit Contractor-Record** → normale Techniker-App
- **Admin MIT Contractor-Record** → kann beide Ansichten nutzen

### Änderungen

#### 1. Index.tsx anpassen

Erweitere die Logik in der `NoContractorAccessScreen` Entscheidung:

```typescript
// Neue Imports
import { useIsAdmin } from '@/hooks/useIAM';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

// In der Komponente:
const isAdmin = useIsAdmin();
const navigate = useNavigate();

// Vor dem Rendering:
// Wenn Admin OHNE Contractor-Record → automatisch zu /admin
useEffect(() => {
  if (isAdmin === true && !hasContractorRecord) {
    navigate('/admin', { replace: true });
  }
}, [isAdmin, hasContractorRecord, navigate]);

// Loading erweitern
if (isDbLoading || isAdmin === undefined) {
  return <OnboardingLoadingScreen message="Prüfe Zugriffsrechte..." />;
}
```

#### 2. NoContractorAccessScreen.tsx erweitern

Falls kein Auto-Redirect (Admin === false), zeige trotzdem einen Link zum Admin-Bereich für manuelle Navigation:

```tsx
// Optional: Link zum Admin-Bereich wenn kein Contractor
{/* Nur für Debugging/Entwicklung */}
<Button 
  variant="link" 
  onClick={() => window.location.href = '/admin'}
>
  Zur Admin-Ansicht
</Button>
```

### Flussdiagramm

```text
User besucht /
       │
       ▼
┌──────────────────┐
│ Lade IAM Rollen  │
│ + Contractor DB  │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ Hat Contractor-Record?                 │
├────────────────────────────────────────┤
│ JA → Normale Techniker-App zeigen      │
│ NEIN → Ist Admin?                      │
│   ├─ JA → Redirect zu /admin           │
│   └─ NEIN → NoContractorAccessScreen   │
└────────────────────────────────────────┘
```

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/pages/Index.tsx` | Auto-Redirect für Admins ohne Contractor-Record |
| `src/components/ui/NoContractorAccessScreen.tsx` | Optional: Admin-Link hinzufügen |

## Risiken

- **Race Condition**: Loading-States von IAM und Contractor-Check müssen beide abgewartet werden
- **Mitigation**: Beide Loading-States prüfen vor jeder Entscheidung

## Ergebnis

Nach Implementation:
- Du gehst auf `/` → wirst automatisch zu `/admin` weitergeleitet
- Techniker gehen auf `/` → sehen ihre App oder Onboarding
- Du kannst jederzeit manuell zu `/` gehen, wenn du dich selbst als Techniker testen willst (dann brauchst du einen Contractor-Record)
