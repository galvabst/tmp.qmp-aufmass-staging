

# Plan: Akademie-Module mit Text + Video & Single Source of Truth

## Analyse (NEUTRAL)

### Aktuelle Situation
- **AkademieModul.tsx** zeigt derzeit: Video-Platzhalter + kurze Beschreibung
- Content ist **hardcoded** in `onboarding-config.ts`
- Nur Entwickler können Content ändern (Code-Deployment nötig)
- Kein Supabase-Schema für Akademie-Content vorhanden

### Anforderung
1. **Layout**: Jedes Modul braucht Video UND begleitenden Text (nicht nur Video)
2. **Single Source of Truth**: Content soll ohne Code-Änderungen anpassbar sein

## Kritische Bewertung (KRITIKER)

### Option A: CMS-Integration (Notion, Strapi, Contentful)

| Pro | Contra |
|-----|--------|
| Professionelle Editoren | Externe Abhängigkeit |
| Echtzeit-Vorschau | Zusätzliche Kosten |
| Versionierung | Webhooks für Sync nötig |
| | Komplexere Architektur |
| | Verstößt gegen LOVABLE_BEHAVIOUR.txt (Regel 11: "Komplexität ohne Modularisierung") |

### Option B: Supabase-Tabellen für Content

| Pro | Contra |
|-----|--------|
| Bereits integriert | Kein WYSIWYG-Editor |
| Kein externes System | Admin-UI für Content nötig |
| RLS für Zugriffskontrolle | Manuelles Markdown |
| Video-URLs + Text in DB | |
| Kostenlos | |
| Volle Kontrolle | |

### Option C: Hybrid (Supabase + Supabase Storage für Videos)

| Pro | Contra |
|-----|--------|
| Alles in einem System | Video-Upload via SQL Editor umständlich |
| Videos sicher gehostet | |
| Skalierbar | |

## Strategische Lösung (STRATEGE)

**Empfehlung: Option B - Supabase-Tabellen + Video-Hosting extern**

### Begründung (nach LOVABLE_BEHAVIOUR.txt)

1. **Single Source of Truth** (Regel 1): Daten in Supabase
2. **Kein externes CMS** (Regel 11: minimale Abhängigkeiten)
3. **Schema-Organisation** (Regel 12): `onboarding_akademie` Schema oder Prefix
4. **Skalierbar**: Content Manager können direkt in Supabase Table Editor arbeiten

### Vorgeschlagenes DB-Schema

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Tabelle: onboarding_akademie.pflicht_videos (oder public.onboarding_pflicht_videos)
├─────────────────────────────────────────────────────────────────────────────────┤
│ id                  │ uuid           │ PK                                       │
│ hauptmodul_id       │ text           │ z.B. "grundlagen", "durchfuehrung"       │
│ hauptmodul_titel    │ text           │ z.B. "Einführung und Grundlagen"         │
│ hauptmodul_beschreibung │ text       │ Kurzbeschreibung des Moduls              │
│ hauptmodul_reihenfolge │ int         │ Sortierung                               │
│                                                                                 │
│ unterpunkt_id       │ text           │ z.B. "einfuehrung", "kleidung"           │
│ unterpunkt_titel    │ text           │ z.B. "Einführung und Begrüßung"          │
│ unterpunkt_beschreibung │ text       │ Kurzbeschreibung                         │
│ unterpunkt_reihenfolge │ int         │ Sortierung innerhalb Hauptmodul          │
│                                                                                 │
│ video_url           │ text           │ URL zu Vimeo/YouTube/Storage             │
│ video_dauer_minuten │ int            │ Länge in Minuten                         │
│                                                                                 │
│ text_inhalt         │ text           │ Begleitender Lerntext (Markdown/HTML)    │
│ text_zusammenfassung│ text           │ Zusammenfassung/Key Takeaways            │
│ zusatzmaterial_urls │ jsonb          │ Optional: PDFs, Links etc.               │
│                                                                                 │
│ ist_aktiv           │ boolean        │ Default true                             │
│ created_at          │ timestamptz    │ Standard                                 │
│ updated_at          │ timestamptz    │ Standard                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Alternative: Normalisierte Struktur (2 Tabellen)

```text
┌─────────────────────────────────────────┐
│ onboarding_akademie.hauptmodule         │
├─────────────────────────────────────────┤
│ id                  │ uuid              │
│ code                │ text UNIQUE       │ ← "grundlagen"
│ titel               │ text              │
│ beschreibung        │ text              │
│ reihenfolge         │ int               │
│ ist_aktiv           │ boolean           │
└─────────────────────────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────────────────────┐
│ onboarding_akademie.unterpunkte         │
├─────────────────────────────────────────┤
│ id                  │ uuid              │
│ hauptmodul_id       │ uuid FK           │
│ code                │ text              │
│ titel               │ text              │
│ beschreibung        │ text              │
│ reihenfolge         │ int               │
│                                         │
│ video_url           │ text              │
│ video_dauer_minuten │ int               │
│                                         │
│ text_inhalt         │ text              │ ← MARKDOWN
│ text_zusammenfassung│ text              │ ← Key Points
│ zusatzmaterial_urls │ jsonb             │
│                                         │
│ ist_aktiv           │ boolean           │
└─────────────────────────────────────────┘
```

## UI-Layout: Modul-Seite (AkademieModul.tsx)

### Visuelles Konzept

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ← Zurück │ Einführung und Grundlagen                                            │
│          │ 1. Einführung und Begrüßung                     ⏱ 5 Minuten          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │                        VIDEO PLAYER (16:9)                              │   │
│  │                                                                         │   │
│  │                           ▶ Play                                        │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  📖 LERNINHALT                                              [Tabs?]    │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                         │   │
│  │  ## Willkommen bei Thermocheck!                                         │   │
│  │                                                                         │   │
│  │  In diesem Modul lernst du:                                             │   │
│  │  - Die Geschichte und Mission von Thermocheck                           │   │
│  │  - Deine Rolle als zertifizierter Techniker                             │   │
│  │  - Den Ablauf des Onboardings                                           │   │
│  │                                                                         │   │
│  │  ### Wichtige Punkte                                                    │   │
│  │                                                                         │   │
│  │  1. **Qualität steht an erster Stelle**                                 │   │
│  │     Jeder Thermocheck folgt unserem standardisierten...                 │   │
│  │                                                                         │   │
│  │  2. **Der Kunde ist König**                                             │   │
│  │     Professionelles Auftreten ist Pflicht...                            │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  📎 ZUSATZMATERIAL (optional)                                           │   │
│  │  • Thermocheck Leitfaden (PDF)                                          │   │
│  │  • Sicherheitsdatenblatt                                                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│           [ ✓ Als abgeschlossen markieren ]                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Workflow für Content-Manager

```text
1. Content Manager öffnet Supabase Dashboard
2. Navigiert zu Tabelle "onboarding_akademie.unterpunkte"
3. Findet das Modul (z.B. "Kleidung und Verhalten")
4. Bearbeitet:
   - video_url: Neue Vimeo/YouTube URL
   - text_inhalt: Markdown-Text aktualisieren
   - text_zusammenfassung: Key Takeaways anpassen
5. Speichern → Änderung sofort live!
```

**Kein Deployment nötig!**

## Technische Umsetzung

### 1. Datenbank-Migration

```sql
-- Schema für Onboarding-Akademie
CREATE TABLE public.onboarding_akademie_hauptmodule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  titel text NOT NULL,
  beschreibung text,
  reihenfolge int NOT NULL DEFAULT 0,
  ist_aktiv boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.onboarding_akademie_unterpunkte (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hauptmodul_id uuid NOT NULL REFERENCES public.onboarding_akademie_hauptmodule(id) ON DELETE CASCADE,
  code text NOT NULL,
  titel text NOT NULL,
  beschreibung text,
  reihenfolge int NOT NULL DEFAULT 0,
  
  -- Video
  video_url text,
  video_dauer_minuten int DEFAULT 5,
  
  -- Lerninhalt (Markdown)
  text_inhalt text,
  text_zusammenfassung text,
  zusatzmaterial_urls jsonb DEFAULT '[]',
  
  ist_aktiv boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(hauptmodul_id, code)
);

-- Indexes für Performance
CREATE INDEX idx_akademie_unterpunkte_hauptmodul ON public.onboarding_akademie_unterpunkte(hauptmodul_id);
CREATE INDEX idx_akademie_unterpunkte_reihenfolge ON public.onboarding_akademie_unterpunkte(reihenfolge);

-- RLS: Jeder eingeloggte User kann lesen (Onboarding-Content)
ALTER TABLE public.onboarding_akademie_hauptmodule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_akademie_unterpunkte ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read hauptmodule"
  ON public.onboarding_akademie_hauptmodule FOR SELECT
  TO authenticated
  USING (ist_aktiv = true);

CREATE POLICY "Authenticated users can read unterpunkte"
  ON public.onboarding_akademie_unterpunkte FOR SELECT
  TO authenticated
  USING (ist_aktiv = true);

-- Admin kann alles (über is_admin() Helper)
CREATE POLICY "Admins can manage hauptmodule"
  ON public.onboarding_akademie_hauptmodule FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can manage unterpunkte"
  ON public.onboarding_akademie_unterpunkte FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
```

### 2. Initial-Daten (Seed)

Die 4 Hauptmodule und 16 Unterpunkte werden initial mit Platzhalter-Texten eingefügt.

### 3. React-Query Hook

```typescript
// src/hooks/useAkademieContent.ts

export function useAkademieContent() {
  return useQuery({
    queryKey: ['akademie-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_akademie_hauptmodule')
        .select(`
          *,
          unterpunkte:onboarding_akademie_unterpunkte(*)
        `)
        .eq('ist_aktiv', true)
        .order('reihenfolge')
        .order('reihenfolge', { referencedTable: 'onboarding_akademie_unterpunkte' });
      
      if (error) throw error;
      return data;
    },
  });
}
```

### 4. Markdown-Rendering

```typescript
// Einfache Lösung: react-markdown oder eigene Komponente
import ReactMarkdown from 'react-markdown';

<div className="prose prose-sm max-w-none">
  <ReactMarkdown>{unterpunkt.text_inhalt}</ReactMarkdown>
</div>
```

Alternativ: Ohne Abhängigkeit mit einfachem HTML-Text.

## Dateien die geändert werden

| Datei | Änderung |
|-------|----------|
| **Migration** | Neue Tabellen `onboarding_akademie_hauptmodule` + `unterpunkte` |
| `src/hooks/useAkademieContent.ts` | **NEU**: React-Query Hook für DB-Content |
| `src/pages/AkademieModul.tsx` | Layout erweitern: Video + Lerntext + Zusatzmaterial |
| `src/components/onboarding/steps/AcademyStep.tsx` | Daten aus DB statt Mock laden |
| `src/lib/onboarding-config.ts` | Mock-Daten als Fallback behalten |
| `package.json` | Optional: `react-markdown` für Textrendering |

## Risiken und Mitigierung

| Risiko | Mitigierung |
|--------|-------------|
| DB-Ausfall → Akademie nicht ladbar | Fallback auf Mock-Daten |
| Markdown-Injection | Sanitized Rendering |
| Content Manager löscht aus Versehen | Soft Delete mit `ist_aktiv` statt hartem DELETE |
| Videos offline/geändert | URL-Validierung bei Speichern |

## Erwartetes Ergebnis

- **Layout**: Video + Lerntext + optionales Zusatzmaterial
- **Single Source of Truth**: Supabase-Tabellen
- **Content-Management**: Über Supabase Table Editor (kein Code nötig)
- **Dynamische Inhalte**: Änderungen sofort live
- **Skalierbar**: Weitere Module einfach hinzufügbar
- **Enterprise-Pattern**: Normalisierte DB-Struktur

