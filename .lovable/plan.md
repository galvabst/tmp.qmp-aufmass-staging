# Fix: Reload-Loop + DB-Verknüpfung (ERLEDIGT ✅)

## Status: Implementiert am 2026-02-05

### Gelöste Probleme

1. **Reload-Loop behoben**: State-Reset ohne `window.location.reload()` via `forceReset`-Flag
2. **Profildaten aus DB**: Neuer `useContractorProfile` Hook lädt aus `public.profiles` + `thermocheck.contractor_onboarding`
3. **Avatar-Upload**: Storage-Bucket `contractor-avatars` mit RLS-Policies angelegt
4. **Adress-Updates**: RPC-Funktion `update_contractor_onboarding_address` erstellt

### Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `src/hooks/useOnboardingState.ts` | `forceReset` Parameter hinzugefügt |
| `src/components/OnboardingScreen.tsx` | State-Reset ohne Reload, useContractorProfile integriert |
| `src/hooks/useContractorProfile.ts` | NEUER Hook für DB-Profildaten |
| `src/pages/Index.tsx` | `profileId` an OnboardingScreen übergeben |

### Architektur

```
DB (SSoT)
├── public.profiles (Name, Email, Telefon, Avatar)
│   └── avatar_url → storage.contractor-avatars
└── thermocheck.contractor_onboarding (Adresse)
    └── RPC: update_contractor_onboarding_address()
```

### Nächste Schritte (optional)

- [ ] ProfileStep mit echten DB-Updates verknüpfen (onChange → saveProfileToDb)
- [ ] Avatar-Upload im ProfileStep testen
- [ ] E-Mail als readonly markieren (auth-gebunden)
