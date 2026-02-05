

# Admin-View Implementation Plan

## Übersicht

Du brauchst eine Admin-Ansicht, um alle Aufträge und Techniker zu sehen - nicht nur deine eigenen. Die gute Nachricht: Die Infrastruktur dafür existiert bereits größtenteils!

**Was bereits vorhanden ist:**
- `/admin` Route (aktuell deaktiviert → zeigt NotFound)
- Admin-Komponenten (`AdminLayout`, `AdminBottomNav`)
- Feature-Views (`ContractorListView`, `ObjectOrderListView`, etc.)
- Datenbank-Funktionen: `is_admin()` und `get_user_iam_roles()`
- Du hast bereits `superadmin`-Rolle in `iam.user_system_roles`

**Was fehlt:**
1. Route aktivieren + Zugriffsschutz
2. `useIAM` Hook erweitern, um echte Rollen aus der DB zu laden
3. RLS-Policies für Admin-Lesezugriff auf relevante Tabellen

---

## Implementierungsschritte

### Schritt 1: useIAM Hook auf echte IAM-Rollen umstellen

Der Hook fragt aktuell nur `profiles` ab. Er muss die echten System-Rollen aus `iam.user_system_roles` laden.

**Änderung in `src/hooks/useIAM.ts`:**
- RPC-Aufruf zu `get_user_iam_roles()` statt Profil-Check
- `useIsAdmin()` prüft auf `superadmin`, `admin` oder `manager`

### Schritt 2: Protected Admin Route

**Änderungen in `src/App.tsx`:**
- Admin-Route aktivieren (nicht mehr auf NotFound)
- Neue `AdminRoute`-Wrapper-Komponente erstellen

**Neue Komponente: `src/components/auth/ProtectedAdminRoute.tsx`**
- Prüft mit `useIsAdmin()` ob User Zugriff hat
- Zeigt Loading während Check
- Zeigt "Zugriff verweigert" wenn keine Berechtigung

### Schritt 3: RLS-Policies für Admin-Lesezugriff

Damit Admins alle Daten sehen können, brauchen relevante Tabellen SELECT-Policies:

**Tabellen mit neuen Policies:**
- `thermocheck.contractor_onboarding` → Admins sehen alle Techniker
- `thermocheck.contractor_bestellungen` → Admins sehen alle Bestellungen
- `thermocheck.contractor_akademie_lektions_fortschritt` → Admins sehen Fortschritte

**Policy-Pattern:**
```sql
CREATE POLICY "Admin kann alle lesen"
ON thermocheck.tabelle FOR SELECT TO authenticated
USING (
  public.is_admin() 
  OR [existing user-specific condition]
);
```

### Schritt 4: Admin-Views mit echten Daten verbinden

Die Views (`ContractorListView`, `ObjectOrderListView`) nutzen aktuell Mock-Daten. Sie müssen:
- `useQuery` für Supabase-Abfragen verwenden
- Die Daten aus den entsprechenden Tabellen laden

---

## Architektur-Diagramm

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         App.tsx Routes                              │
├─────────────────────────────────────────────────────────────────────┤
│  /         → Index.tsx (Techniker-App)                              │
│  /admin    → ProtectedAdminRoute → Admin.tsx                        │
│  /akademie → AkademieModul.tsx                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ProtectedAdminRoute                              │
├─────────────────────────────────────────────────────────────────────┤
│  useIsAdmin() → true  → <Admin />                                   │
│  useIsAdmin() → false → <AccessDenied />                            │
│  useIsAdmin() → undefined → <Loading />                             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         useIAM Hook                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Ruft RPC get_user_iam_roles() auf                                  │
│  Cached Rollen: ['superadmin'] / ['admin'] / ['manager'] / ['user'] │
│  useIsAdmin() = role in (superadmin, admin, manager)                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Supabase RLS Layer                               │
├─────────────────────────────────────────────────────────────────────┤
│  Techniker: Sieht nur eigene Daten (profile_id = auth.uid())        │
│  Admin: is_admin() = true → Sieht alle Daten                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Technische Details

### 1. useIAM Hook Update

```typescript
// Neue Query-Funktion
const queryFn = async () => {
  const { data, error } = await supabase.rpc('get_user_iam_roles');
  if (error) throw error;
  return data || [];
};

// useIsAdmin prüft echte Rollen
export function useIsAdmin(): boolean | undefined {
  const { systemRoles, loading } = useIAM();
  if (loading) return undefined;
  return ['superadmin', 'admin', 'manager'].some(r => systemRoles.includes(r));
}
```

### 2. Neue Dateien

| Datei | Zweck |
|-------|-------|
| `src/components/auth/ProtectedAdminRoute.tsx` | Wrapper für Admin-Routen |
| `src/components/ui/AccessDeniedScreen.tsx` | UI für fehlende Berechtigung |

### 3. RLS Migration

```sql
-- Beispiel: contractor_onboarding Admin-Zugriff
CREATE POLICY "Admin sieht alle Onboardings"
ON thermocheck.contractor_onboarding FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR profile_id = auth.uid()
);
```

---

## Risiken & Mitigationen

| Risiko | Mitigation |
|--------|------------|
| RLS-Policy-Konflikt | Bestehende Policies prüfen, ggf. kombinieren statt neue erstellen |
| Performance bei vielen Einträgen | Pagination in Admin-Views implementieren |
| Cache-Probleme | QueryClient Invalidation bei Auth-Änderungen |

---

## Reihenfolge der Implementation

1. **useIAM Hook updaten** → Echte Rollen laden
2. **ProtectedAdminRoute erstellen** → Zugriffsschutz
3. **Route aktivieren** → `/admin` zeigt Admin.tsx
4. **RLS-Policies hinzufügen** → Admin-Lesezugriff
5. **Views mit echten Daten** → Mock-Daten ersetzen

Soll ich mit der Implementierung beginnen?

