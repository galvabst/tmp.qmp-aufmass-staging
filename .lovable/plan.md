
## Ziel

Den im Projekt **salesos** vorhandenen "Aufstellort-AI-Planner" (Foto-Wizard + Gemini-Analyse + Norm-Check für Vitocal R290) direkt in den Aufmaß-/VOT-Formular-Schritt **„Aufstellort"** im Thermocheck einbauen. Der Techniker fotografiert vor Ort, die AI bewertet (geht / mit Auflagen / nicht möglich), das Ergebnis wird in das VOT-Formular geschrieben.

## Glücksfall: gemeinsame Supabase-Instanz

Beide Projekte (salesos + thermocheck) teilen sich dieselbe Supabase-DB. Die komplette Backend-Infrastruktur ist also schon da:

| Asset | Status |
|---|---|
| `public.sales_zaehlerschrank_pruefungen` (mit `pruefung_typ='aufstellort'`) | ✅ existiert, FK `lead_id → leads(id)` |
| `public.sales_zaehlerschrank_fotos` | ✅ existiert |
| `public.sales_zaehlerschrank_chat_messages` | ✅ existiert |
| Storage-Bucket `sales-zaehlerschrank-photos` | ✅ existiert |
| Edge-Function `sales-zaehlerschrank-analyze` | ✅ deployed, hat schon den `SYSTEM_PROMPT_AUFSTELLORT` |
| RLS | ✅ erlaubt jedem authentifizierten User SELECT + INSERT (created_by = auth.uid()) |

Außerdem hat `thermocheck.thermocheck_auftraege.lead_id` denselben FK-Pfad — wir können die `lead_id` des Auftrags direkt als `lead_id` für die Prüfung verwenden. **Keine neuen Tabellen, keine neue Edge Function, keine Migrations nötig.**

## Was umgesetzt wird

### 1. Hook portieren — `src/features/aufmass/hooks/useAufstellortPruefung.ts` (neu)

Adaptierte Kopie von `useElektroPruefung` aus salesos, fest auf `type='aufstellort'`:
- Liest aktuellste Prüfung pro `lead_id` (aus Auftrag).
- `uploadFotos` mit EXIF-Stripping + Upload via Standard-supabase-Client (kein `uploadWithRetry`-Wrapper, stattdessen direkter `storage.upload`).
- `startAnalysis` ruft Edge Function `sales-zaehlerschrank-analyze` mit `{ pruefung_id }`.
- Polling bei Status `analyzing` / `waiting_for_photos` alle 3 s.
- Auth via `supabase.auth.getUser()` statt salesos-`AuthContext`.

### 2. Komponenten portieren (1:1, nur Auth- und Import-Pfade angepasst)

- `src/features/aufmass/ui/aufstellort-ai/AufstellortFotoWizard.tsx` — 5 Pflicht-Views (Übersicht / Links 90° / Rechts 90° / Boden / Wand) + optional „Mit Zollstock/A4" für High-Confidence.
- `src/features/aufmass/ui/aufstellort-ai/AufstellortAIRequest.tsx` — Nachforder-UI wenn die AI mehr Fotos braucht.
- `src/features/aufmass/ui/aufstellort-ai/AufstellortResult.tsx` — Ergebnis-Karte (4 Empfehlungs-Level, Reasoning, Red Flags, Komponenten-Inventar, Maßnahmen, Konfidenz, Kosten).
- `src/features/aufmass/ui/aufstellort-ai/AufstellortAIPanel.tsx` — Container, der Wizard / Loading / AIRequest / Result je nach `pruefung.status` switcht.

### 3. In bestehende `AufstellortSection.tsx` einbauen

Oberhalb der schon vorhandenen Felder (Pflicht-Fotos, Distanzen, Aufstellort-Änderung, Kundenbestätigung) ein **Collapsible „AI-Aufstellort-Check"** (default geöffnet wenn noch keine Prüfung läuft).

Wenn die AI eine Empfehlung liefert, "In Formular übernehmen"-Button:
- `empfehlung === 'sanierung'` → setzt `aufstellort_aenderung = true` automatisch (und zeigt einen Hinweis "AI empfiehlt neuen Aufstellort").
- `findings.components` mit Distanzschätzungen (z. B. „Abstand Außeneinheit ↔ Wand: 1.2 m ±10 cm") werden als Vorbelegung in die Distanz-Inputs gepusht, der Techniker kann sie korrigieren.
- Reasoning + AI-Modell + Confidence werden zusätzlich in einem neuen Feld `aufstellort_ai_zusammenfassung` (Text) gespeichert.

### 4. Persistenz im VOT-Formular

Drei neue Spalten auf `thermocheck.thermocheck_vot_formulare` (Migration nötig — die einzige im Plan):
- `aufstellort_ai_pruefung_id uuid` (Referenz zur sales_zaehlerschrank_pruefungen)
- `aufstellort_ai_empfehlung text` (Snapshot der Empfehlung beim Einreichen)
- `aufstellort_ai_zusammenfassung text` (Reasoning-Snapshot)

`aufmassDraftSchema` + `aufmassSubmitSchema` werden um diese drei optionalen Felder erweitert.

### 5. Was nicht angefasst wird

- Edge Function bleibt unangetastet (der `SYSTEM_PROMPT_AUFSTELLORT` ist schon korrekt für Vitocal R290 + Galvanek-Regeln).
- Keine Änderung am salesos-Projekt.
- Keine RLS-Änderungen (bestehende Policies passen).
- Bestehende manuelle Foto-Uploads (`aufstellort_option_1`, `aufstellort_umgebung_1`, etc.) bleiben **zusätzlich** verfügbar — die AI-Bilder leben in einem separaten Bucket und sind nicht Teil des VOT-Bilder-Sets.

## Technische Details

```text
┌─────────────────────────────────────────────────────────┐
│ AufmassFormPage  →  AufstellortSection (Schritt N)      │
│                                                         │
│  ┌─ Collapsible: "AI-Aufstellort-Check" ─────────────┐  │
│  │  <AufstellortAIPanel auftrag={...} leadId={...}/> │  │
│  │   useAufstellortPruefung({ leadId })              │  │
│  │     ├── status='draft'           → FotoWizard     │  │
│  │     ├── status='photo_uploaded'  → CTA "Analyse"  │  │
│  │     ├── status='analyzing'       → Spinner        │  │
│  │     ├── status='waiting_photos'  → AIRequest      │  │
│  │     └── status='completed'       → Result + ÜN    │  │
│  │                                                   │  │
│  │  on "In Formular übernehmen":                     │  │
│  │    form.setValue(aufstellort_aenderung, ...)      │  │
│  │    form.setValue(aufstellort_ai_*, snapshot)      │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  [bestehende Felder: Pflichtfotos, Distanzen, etc.]     │
└─────────────────────────────────────────────────────────┘

DB:                                       Storage:
sales_zaehlerschrank_pruefungen           sales-zaehlerschrank-photos
   ↑ lead_id (FK → leads)                    {user_id}/{pruefung_id}/...
   ↑ pruefung_typ='aufstellort'

Edge Fn: sales-zaehlerschrank-analyze
   → Gemini 2.5 Pro Vision + Tools
   → schreibt findings, empfehlung, confidence zurück
```

**Validierung nach Implementierung (gemäß 7-Step-Protocol):**
1. Hook lädt Prüfung korrekt für `lead_id` des Auftrags.
2. Upload → Foto erscheint in `sales_zaehlerschrank_fotos` mit `is_ai_requested=true` + korrektem View-Slug.
3. `startAnalysis` triggert Edge Fn, Status wechselt auf `analyzing` → später `completed` oder `waiting_for_photos`.
4. „In Formular übernehmen" setzt `aufstellort_aenderung`, AI-Snapshot-Felder + persistiert beim Draft-Save.
5. RLS-Test: Anderer Techniker kann die Prüfung sehen (SELECT erlaubt) aber nicht updaten.
6. Read-Only-Modus (eingereichtes Formular): AI-Panel zeigt nur das Ergebnis, kein Upload/Reset möglich.
7. Keine Änderung am salesos-Verhalten (gleicher Pruefung-Datensatz wäre auch dort sichtbar — bewusst, weil Lead-bezogen).

## Offene Frage vor Start

Soll der „In Formular übernehmen"-Schritt **automatisch** beim Abschluss der AI-Analyse passieren, oder bleibt es ein expliziter Button-Klick durch den Techniker? Ich würde **Button** empfehlen — der Techniker bleibt Entscheider, AI ist Assistenz.
