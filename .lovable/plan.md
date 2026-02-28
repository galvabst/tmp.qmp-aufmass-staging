

# Fix: Flash of "Kein Contractor-Zugang" Screen

## Root Cause

In `useContractorOnboardingStatus`, the query runs immediately and calls `getSession()` inside the queryFn. On login, the query can fire before the auth state change propagates, returning "no authenticated user" → `hasContractorRecord = false`. This causes `Index.tsx` to briefly show `NoContractorAccessScreen` before the query re-fetches with the valid session.

## Fix

**File: `src/hooks/useContractorOnboardingStatus.ts`**

Pass the session from `useSupabaseSession()` and use `enabled: !!session` so the query only runs when a session exists. Remove the internal `getSession()` call.

**File: `src/pages/Index.tsx`**

Pass session to the hook (or the hook reads it internally). Add a guard: if `isAdmin` is resolved but the contractor query is still in its initial state (hasn't fetched yet), keep showing the loading screen.

### Concrete changes

1. **`useContractorOnboardingStatus.ts`**: Add `userId` parameter, use `enabled: !!userId`, use `userId` in queryKey. Remove internal `getSession()` call — use the passed userId directly.

2. **`Index.tsx`**: Pass `session?.user?.id` to the hook. The existing guard `isDbLoading || isAdmin === undefined` already covers loading, but because `useQuery` with `enabled: false` has `isLoading: false` and `data: undefined`, we need to also check `!session || isDbLoading` to prevent the flash.

Specifically in Index.tsx, change the guard:
```tsx
// Before
if (isDbLoading || isAdmin === undefined) {
  return <OnboardingLoadingScreen message="Prüfe Zugriffsrechte..." />;
}

// After — also gate on "query hasn't run yet"
const isStillInitializing = isDbLoading || isAdmin === undefined || (session && !onboardingRecord && !isDbError && !hasRecord);
// hasRecord is false when query hasn't returned OR genuinely no record.
// We need a more reliable signal: use fetchStatus from react-query
```

Better approach: expose `isFetched` from the hook (react-query provides this). Then:

```tsx
if (isDbLoading || isAdmin === undefined || !isDbFetched) {
  return <OnboardingLoadingScreen message="Prüfe Zugriffsrechte..." />;
}
```

### Changes summary

| File | Change |
|---|---|
| `src/hooks/useContractorOnboardingStatus.ts` | Add `enabled: !!userId` param, expose `isFetched`, remove internal `getSession()` |
| `src/pages/Index.tsx` | Pass `session?.user?.id`, use `isFetched` in loading guard |

