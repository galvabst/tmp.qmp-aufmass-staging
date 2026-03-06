

# Logout-Button in der Admin Console

## Problem
Die Admin Console (`/admin`) hat keinen Abmelden-Button. Der einzige Logout existiert in der Contractor `ProfileView`, die Admins nie sehen.

## Lösung

**Datei:** `src/features/admin/ui/AdminLayout.tsx`

Einen Logout-Button im sticky Header rechts oben einfügen (LogOut-Icon von lucide-react). Klick → `supabase.auth.signOut()` → `window.location.reload()` → landet auf Login.

Da alle Admin-Subviews (`AdminDashboardView`, `ContractorListView`, etc.) das `AdminLayout` nutzen, ist der Button automatisch auf **jedem Tab** sichtbar.

**Umsetzung:**
- Import `supabase` + `LogOut` Icon + `toast`
- Button rechts im Header neben dem optionalen `actionButton`
- Styling: `ghost` variant, `text-muted-foreground hover:text-destructive`

Ein einziger File-Edit, ca. 15 Zeilen.

