

# Plan: Formulare-Tab fuer Buchungen hinzufuegen

## Zusammenfassung

Ein neuer "Formulare"-Tab wird zur Auftragsdetail-Ansicht hinzugefuegt. Dort koennen Links zu externen Formularen (z.B. Google Forms, Checklisten) hinterlegt und aufgerufen werden.

## Datenmodell-Erweiterung

### TechnicianOrder erweitern (`src/types/technician.ts`)

```typescript
// Neuer Typ fuer Formular-Links
export interface FormLink {
  id: string;
  label: string;      // "Kundenprotokoll", "Checkliste Thermocheck"
  url: string;        // https://forms.google.com/...
  createdAt: string;
}

// In TechnicianOrder hinzufuegen:
export interface TechnicianOrder {
  // ... bestehende Felder
  formLinks?: FormLink[];  // NEU
}
```

## UI-Aenderungen

### TechnicianOrderDetail.tsx umbauen

**Vorher:** Lineare Scroll-Ansicht mit allen Informationen

**Nachher:** Zwei Tabs - "Details" und "Formulare"

```text
┌─────────────────────────────────────────┐
│  ← Auftragsdetails           [Gebucht]  │
├─────────────────────────────────────────┤
│  [ Details ]  [ Formulare ]             │  ← Tab-Navigation
├─────────────────────────────────────────┤
│                                         │
│  (Tab-Inhalt je nach Auswahl)           │
│                                         │
└─────────────────────────────────────────┘
```

### Details-Tab (bestehender Inhalt)

Alle aktuellen Inhalte (Kunde, Datum, Adresse, Kontakt, etc.) bleiben im "Details"-Tab.

### Formulare-Tab (neu)

```text
┌─────────────────────────────────────────┐
│  Verknuepfte Formulare                  │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 📋 Kundenprotokoll       [→]   │    │  ← Klickbar, oeffnet URL
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ ✓ Checkliste Thermocheck [→]   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  + Formular hinzufuegen        │    │  ← Button zum Hinzufuegen
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### Formular hinzufuegen Dialog

Ein einfacher Dialog mit zwei Feldern:
- **Name/Label**: z.B. "Kundenprotokoll"
- **URL**: z.B. "https://forms.google.com/..."

```typescript
// Input-Validierung mit zod
const formLinkSchema = z.object({
  label: z.string().trim().min(1, "Name erforderlich").max(100),
  url: z.string().trim().url("Gueltige URL erforderlich"),
});
```

## Mock-Daten erweitern

```typescript
// In mockTechnicianData.ts - bei gebuchten Auftraegen
formLinks: [
  {
    id: 'fl1',
    label: 'Kundenprotokoll',
    url: 'https://forms.google.com/example1',
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'fl2',
    label: 'Checkliste Thermocheck',
    url: 'https://forms.google.com/example2',
    createdAt: '2026-01-20T10:05:00Z',
  },
],
```

## Dateien die geaendert werden

| Datei | Aenderung |
|-------|-----------|
| `src/types/technician.ts` | `FormLink` Interface + `formLinks` Feld |
| `src/components/TechnicianOrderDetail.tsx` | Tabs-UI, Formulare-Tab, Dialog zum Hinzufuegen |
| `src/data/mockTechnicianData.ts` | Beispiel-FormLinks bei gebuchten Auftraegen |

## Technische Details

- **Tabs-Komponente**: Verwendung von `@/components/ui/tabs` (bereits im Projekt)
- **Dialog**: Verwendung von `@/components/ui/dialog` fuer "Formular hinzufuegen"
- **URL-Validierung**: zod-Schema zur Eingabevalidierung
- **Externe Links**: `target="_blank" rel="noopener noreferrer"` fuer Sicherheit

## Sichtbarkeit

Der Formulare-Tab ist nur sichtbar bei:
- `status === 'booked'` (Gebuchte Auftraege)
- `status === 'in_progress'` (Aktive Auftraege)
- `status === 'rework_required'` (Nacharbeit erforderlich)

**Nicht** bei Pool-Auftraegen (`published`) oder abgeschlossenen (`submitted`, `in_review`, `approved`).

