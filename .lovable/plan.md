

# Fix: "Kein Contractor-Zugang" Flash nach Login

## Problem
Nach dem Einloggen feuert `onAuthStateChange` mit `SIGNED_IN`, setzt die Session sofort, und der `useContractorOnboardingStatus`-Query läuft los -- aber der Auth-Token ist noch nicht vollständig propagiert. Das RPC `get_my_contractor_onboarding` gibt leer zurück (weil `auth.uid()` serverseitig noch null ist), und der User sieht kurz "Kein Contractor-Zugang", bis er manuell refresht.

## Lösung

### 1. `useSupabaseSession.ts` -- Verzögerte Invalidierung nach SIGNED_IN
Bei `SIGNED_IN` die Query-Invalidierung um ~1.5 Sekunden verzögern, damit der Token serverseitig ankommt:

```typescript
if (event === 'SIGNED_IN') {
  // Token braucht kurz, um serverseitig zu propagieren
  setTimeout(() => {
    queryClient.invalidateQueries({ queryKey: ['contractor-onboarding-status'] });
    queryClient.invalidateQueries({ queryKey: ['iam'] });
  }, 1500);
} else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
  queryClient.invalidateQueries({ queryKey: ['contractor-onboarding-status'] });
  queryClient.invalidateQueries({ queryKey: ['iam'] });
}
```

### 2. `useContractorOnboardingStatus.ts` -- Retry bei leerem Ergebnis
Wenn die Query ein leeres Ergebnis liefert (kein Record), aber ein gültiger `userId` da ist, automatisch 2x mit Verzögerung retrien:

- `retry: 2` und custom `retryDelay: 1500`
- Leeres Ergebnis als Fehler werfen (nur beim ersten Versuch), damit React Query den Retry-Mechanismus nutzt

Alternativ einfacher: `refetchInterval` von 2 Sekunden setzen, solange `hasRecord === false && isFetched && !!userId`, und nach 3 Versuchen stoppen.

### 3. `Index.tsx` -- Grace-Period nach frischem Login
Wenn `!hasContractorRecord && !isAdmin && isFetched` innerhalb der ersten 5 Sekunden nach Session-Start, Loading-Screen statt Fehler-Screen zeigen:

```typescript
const [sessionAge, setSessionAge] = useState(0);
// Track wann die Session gesetzt wurde
// Wenn sessionAge < 5s → Loading statt NoContractorAccessScreen
```

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/hooks/useSupabaseSession.ts` | Verzögerte Invalidierung bei SIGNED_IN |
| `src/hooks/useContractorOnboardingStatus.ts` | Auto-Retry bei leerem Ergebnis |
| `src/pages/Index.tsx` | Grace-Period nach Login, kein sofortiger Fehler-Screen |

## Ergebnis
Nach dem Login sieht der User "Prüfe Zugriffsrechte..." für max. 3 Sekunden, dann kommt er direkt in die App -- kein "Kein Contractor-Zugang"-Flash mehr.

