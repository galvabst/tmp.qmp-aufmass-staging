
# Fix: Authentication Flow - Session-Transfer von Sales OS

## Problem

Du loggst dich erfolgreich auf **Sales OS** ein (die Auth-Logs zeigen erfolgreiche Logins), aber die Session wird nicht auf **quick-measure-pro.lovable.app** übertragen.

**Ursache:** Die geplante `Auth.tsx`-Komponente zum Empfangen der Session existiert nicht im Code. Die App kann Session-Tokens aus der URL (`#access_token=...&refresh_token=...&type=session_transfer`) nicht verarbeiten.

## Lösung

Implementiere den Cross-Domain Session-Transfer in 3 Schritten:

### 1. Auth-Page erstellen (`src/pages/Auth.tsx`)

Neue Seite die:
- URL-Fragment parst (`#access_token=...`)
- `supabase.auth.setSession()` aufruft
- Bei Erfolg nach `/` weiterleitet

```text
Ablauf:
Sales OS → https://quick-measure-pro.lovable.app/auth#access_token=xxx&refresh_token=yyy
                                ↓
                        Auth.tsx parst Hash
                                ↓
                        supabase.auth.setSession()
                                ↓
                        Redirect nach /
```

### 2. Route registrieren (`src/App.tsx`)

```tsx
<Route path="/auth" element={<Auth />} />
```

### 3. Session-Reaktivität verbessern (`src/hooks/useSupabaseSession.ts`)

Neuer Hook der:
- `onAuthStateChange` listener nutzt (statt nur `getSession`)
- Loading-State korrekt verwaltet
- React Query Keys invalidiert bei Session-Änderung

### 4. Index.tsx Session-Check verbessern

- Nutze `useSupabaseSession` für reaktive Session-Updates
- Zeige "Nicht eingeloggt" statt "Kein Contractor-Zugang" wenn keine Session

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/pages/Auth.tsx` | **NEU** - Session-Transfer Handler |
| `src/App.tsx` | Route `/auth` hinzufügen |
| `src/hooks/useSupabaseSession.ts` | **NEU** - Reaktiver Session-Hook |
| `src/hooks/useContractorOnboardingStatus.ts` | Session-Hook integrieren |
| `src/hooks/useIAM.ts` | Session-Hook integrieren |
| `src/pages/Index.tsx` | Session-Check + bessere Fehlermeldung |
| `src/components/ui/AuthRequiredScreen.tsx` | **NEU** - "Bitte einloggen" UI |

## Fluss nach Implementation

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ USER FLOW                                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Sales OS                     quick-measure-pro.lovable.app                  │
│  ─────────                    ─────────────────────────────                  │
│                                                                              │
│  1. User loggt sich ein                                                      │
│         │                                                                    │
│         ▼                                                                    │
│  2. Sales OS generiert                                                       │
│     Redirect-URL mit Tokens                                                  │
│         │                                                                    │
│         ▼                                                                    │
│  3. Redirect zu ─────────────► /auth#access_token=xxx&refresh_token=yyy      │
│                                      │                                       │
│                                      ▼                                       │
│                               4. Auth.tsx parst Hash                         │
│                                      │                                       │
│                                      ▼                                       │
│                               5. setSession() speichert                      │
│                                  in localStorage                             │
│                                      │                                       │
│                                      ▼                                       │
│                               6. Redirect nach /                             │
│                                      │                                       │
│                                      ▼                                       │
│                               7. Index.tsx prüft Session ✓                   │
│                                      │                                       │
│                                      ▼                                       │
│                               8. Onboarding oder App                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Technische Details

### Auth.tsx Token-Parsing

```tsx
// Parse hash: #access_token=xxx&refresh_token=yyy&type=session_transfer
const hashParams = new URLSearchParams(window.location.hash.substring(1));
const accessToken = hashParams.get('access_token');
const refreshToken = hashParams.get('refresh_token');

if (accessToken && refreshToken) {
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  
  if (!error) {
    navigate('/', { replace: true });
  }
}
```

### useSupabaseSession Hook

```tsx
export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // Invalidate all auth-dependent queries
        queryClient.invalidateQueries({ queryKey: ['contractor-onboarding-status'] });
        queryClient.invalidateQueries({ queryKey: ['iam'] });
      }
    );

    return () => subscription.unsubscribe();
  }, [queryClient]);

  return { session, isLoading, user: session?.user ?? null };
}
```

## Was Sales OS tun muss

Nach Implementation muss Sales OS die User zu dieser URL weiterleiten:

```
https://quick-measure-pro.lovable.app/auth#access_token=<TOKEN>&refresh_token=<TOKEN>&type=session_transfer
```

Aktuell leitet Sales OS vermutlich direkt zu `/` weiter, wo keine Token-Verarbeitung stattfindet.

## Nächste Schritte nach Auth-Fix

1. ✅ Session-Transfer funktioniert
2. Onboarding-Flow testen
3. Stripe-Integration für Bestellungen
