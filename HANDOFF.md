# T4 autarc-Validierungs-Gate + Wasserdicht-Loop — HANDOFF

**Datum:** 2026-06-21
**Branch:** `feature/t4-autarc-gate-loop`
**Worktree:** `C:\Users\aberg\Downloads\dev\.worktrees\qmp-t4-autarc-gate`
**Spec (Quelle der Wahrheit):** `_specs/2026-06-21-aufmass-t4-autarc-gate-loop-design.md`
**Build-Contract:** `T4-BUILD-CONTRACT.md` (im Worktree-Root)

---

## ✅ KONVERGENZ-STATUS (zuerst lesen)

- **converged = true** — `dryStreak` am Ende = **2**.
- **DoD erfüllt — 2 Runden in Folge dry.** Die letzten beiden Loop-Runden (R10, R11) fanden **0 neue Löcher** und liefen beim ERSTEN Lauf grün. Damit ist das Stopp-Kriterium aus Spec §10/§13 („2 Runden in Folge ohne neues Loch") **sauber erfüllt** — nicht mehr nur inhaltlich plausibel wie nach R6, sondern formal lückenlos.
- **Tests sind GRÜN.** Alle Suiten laufen sauber durch (echte Zahlen unten), `tsc --noEmit` ohne Fehler (Exit 0).
- **Verlauf bis hierher (ehrlich):** R3 und R6 waren je dry, aber R4/R5 dazwischen waren abgestürzt („agent returned null"), darum war das DoD bis R6 NICHT sauber erreicht. Die Bestätigungs-/Konvergenzrunden R7–R11 wurden nachgefahren. R9 fand noch **1** echtes Loch (siehe unten) — das beweist, dass die späten Runden keine Pro-forma-Runden waren, sondern echt geprüft haben. Erst R10 **und** R11 waren beide dry → Konvergenz.

---

## 1. Was gebaut wurde (Dateien)

### Kern-Module (reine TS, laufen in Vitest, kein Deno/Netz)
| Datei | Zweck |
|-------|-------|
| `src/features/aufmass/data/autarc-diff.ts` | Normalisierung + Diff gesendet ↔ zurückgelesen (Float-Toleranz, Enum/Bool exakt, `"200"`==`200`, heatingCircuits strukturell pro Index, computed-Felder ignoriert). |
| `src/features/aufmass/data/autarc-match.ts` | Projekt-Auflösung: primär gespeicherte ID, sonst Fallback `customers?search → projects?customerId`. Injizierbares `fetch`. |
| `src/features/aufmass/data/autarc-gate.ts` | Status-Automat (7-stufige Prioritätskette) + konkrete DE-„was fehlt"-Meldungen. Reine Entscheidungslogik, keine I/O. |
| `src/features/aufmass/data/autarc-verify-core.ts` | Orchestriert match → PATCH → readback → diff → rooms → Heizlast-Poll → `evaluateGate`. Injiziertes `fetch`, fängt jeden throw/Non-2xx → `fehler`. |

### Edge Function (dünner Deno-Wrapper)
| Datei | Zweck |
|-------|-------|
| `supabase/functions/autarc-patch-verify/index.ts` | `Deno.serve`-Glue: liest `AUTARC_API_KEY` serverseitig, reicht echtes `fetch` in den Core, schreibt Ergebnis nach `thermocheck.thermocheck_vot_formulare`. Folgt `admin-impersonate`-Stil. NICHT deployed. |

### Migration (nur Datei, NICHT angewendet)
| Datei | Zweck |
|-------|-------|
| `supabase/migrations/20260621143500_t4_autarc_sync_status.sql` | Additive Spalten auf `thermocheck.thermocheck_vot_formulare` (`autarc_project_id`, `autarc_sync_status`, `autarc_sync_diff`, `autarc_sync_error`, `autarc_synced_at`), alle `IF NOT EXISTS`, idempotent. RLS unverändert. **Nicht angewendet.** |

### Tests + Wasserdicht-Loop
| Datei | Zweck |
|-------|-------|
| `src/features/aufmass/data/autarc-diff.test.ts` | Unit-Tests Diff/Normalisierung. |
| `src/features/aufmass/data/autarc-match.test.ts` | Unit-Tests Match/Fallback (Mock-fetch); +Fixes-Pins aus R2. |
| `src/features/aufmass/data/autarc-gate.test.ts` | Unit-Tests Status-Automat + Meldungen. |
| `src/features/aufmass/data/autarc-verify-core.test.ts` | Integrationstest Kern gegen Mock-fetch (Happy + Pannen); +Fix-Pin aus R2. |
| `src/features/aufmass/data/aufmass-watertight-t4.ts` | T4-Harness: `mockFetchFor`/`runT4Case`/`judgedCorrectly`/`findT4Holes` gegen den echten `autarcVerifyCore`; AutarcMock mit Pannen-Schaltern (wrongShape/nullBody/readbackEmpty/httpStatus/brokenJson/networkError/heatLoadAppearsAfterReads). |
| `src/features/aufmass/data/aufmass-watertight-t4-cases.ts` | `T4Case`-Interface + Seed-Fälle + Wiring `T4_CASES = [...SEED, ...R1, ...R2, ...R3, ...R6, ...R7, ...R8, ...R9, ...R10, ...R11]`. |
| `src/features/aufmass/data/aufmass-watertight-t4-cases.r1.ts` | 23 R1-Fälle (Pannen/Diff/Match/Status/Meldung). |
| `src/features/aufmass/data/aufmass-watertight-t4-cases.r2.ts` | 20 R2-Fälle (Match-Robustheit, verkleidete Pannen, Diff-Edges). |
| `src/features/aufmass/data/aufmass-watertight-t4-cases.r3.ts` | 13 R3-Fälle (abgeleitete Felder, Boolean strikt, Heizkreis-Index, Pannen an neuen Stellen) — dry. |
| `src/features/aufmass/data/aufmass-watertight-t4-cases.r6.ts` | 12 R6-Fälle (String-Enum-Normalisierung, Float-Toleranz direkt, Extra-Skalarfeld, savedId-Trim, Match-Priorität, negativ-Null) — dry, per Mutationstest abgesichert. |
| `src/features/aufmass/data/aufmass-watertight-t4-cases.r7.ts` | R7-Fälle (neue HTTP-Codes 429/403, fehlt-Wortlaut, Meldungs-Kürzung >3, Heizkreis-Rücklauf, große Zahlen, ZWSP-ID, Heizlast=Infinity) — dry. |
| `src/features/aufmass/data/aufmass-watertight-t4-cases.r8.ts` | R8-Fälle (Locale-Komma/Unterstrich, Tab/Newline/NBSP-Trim, Mehrfach-Abweichung kombiniert, Poll-Grenzfall, exotische HTTP 502/409/418/408, HTTP-400-Grenze, leere customers[0].id) — dry. |
| `src/features/aufmass/data/aufmass-watertight-t4-cases.r9.ts` | R9-Fälle (JS-Radix-Strings Hex/Binär, e-Notation-Mismatch, "Infinity"-String, HTTP-300/302-Obergrenze, Skalar-readback-als-Objekt, Heizkreis-readback-als-Objekt, Toleranz-just-over, Whitespace-Index, Heizlast-winzig-positiv/MIN_VALUE, viele Räume, gepaddeter Name, Newline-only-ID, leeres readback-Array) — **1 Loch gefunden+gefixt**. |
| `src/features/aufmass/data/aufmass-watertight-t4-cases.r10.ts` | R10-Fälle (Prioritätskette bei Mehrfach-Problemen, 2xx-non-200-Erfolg 201/204/206, HTTP-0, id===0-readback, Heizkreis-Key-fehlt, Float-negativ-Richtung, Bool-an-Zahlfeld, ZWSP-Name, Heizlast=-0.0001, Pannen-Präzedenz) — dry. |
| `src/features/aufmass/data/aufmass-watertight-t4-cases.r11.ts` | R11-Fälle (NaN am Skalarfeld, whitespace-only-String, Zahl-mit-Einheit, "+140"-Plus, Bool=false-an-Zahlfeld, Heizlast-als-Array, rooms-mit-Nicht-Objekten, abgeleitetes Heizungs-Baujahr positiv, Baualtersklassen-Grenze 2001/2002, rooms-Netz-Abbruch-nach-ok-diff) — dry. |
| `src/features/aufmass/data/aufmass-watertight-t4.test.ts` | Regressionstest über alle aktiven T4-Fälle + Invarianten. |

### Wiederverwendet (nicht neu gebaut)
- `src/features/aufmass/data/aufmass-to-autarc.ts` — `mapAufmassToAutarc(values).payload` als gesendetes PATCH-Payload (`technicalFeasibilityAssesment` taucht dort spec-konform nicht auf).

---

## 2. ECHTE Testzahlen (selbst ausgeführt, Stand 2026-06-21 ~15:46)

Befehl: `cd .worktrees/qmp-t4-autarc-gate && npx vitest run <pfad>`

| Suite | Ergebnis |
|-------|----------|
| **Volle Aufmaß-Regression** `npx vitest run src/features/aufmass/` | **803 / 803 GRÜN** (9 Test-Dateien, 0 fails, 0 skips) |
| davon **T4-Harness** `aufmass-watertight-t4.test.ts` | **175 Tests GRÜN** (alle aktiven T4-Fälle, 0 skips) |
| davon **autarc-Verify-Core** `autarc-verify-core.test.ts` | **15 GRÜN** |
| davon **T0–T3 Wasserdicht** `aufmass-watertight.test.ts` | **526 GRÜN** |
| davon **Analyse** `aufmass-watertight.analyze.test.ts` | **2 GRÜN** (Resttriage-Report) |
| **TypeScript** `npx tsc -p tsconfig.app.json --noEmit` | **0 Fehler** (Exit 0, keine Ausgabe) |

**Gesamtstatus: GRÜN.** Volle Suite-Dauer ~1.2 s.

> Hinweis: In der Regression taucht eine Fremddatei `src/features/aufmass/data/__probe.test.ts` (10 Tests, nur `console.log`-Proben einer anderen Session) auf — erzeugt nur stdout-Rauschen, keine echten Assertions. Bewusst NICHT gelöscht (nicht aus diesem Build, Guardrail „nur eigenen Müll aufräumen"). Sollte vor Merge entfernt werden.

---

## 3. Wasserdicht-Loop — Rundenprotokoll

**Stopp-Kriterium (Spec §10/§13):** 2 Runden in Folge ohne neues Loch (dry). **SAUBER ERREICHT** (`converged=true`, `dryStreak=2` nach R10+R11).

| Runde | neue Fälle | neue Löcher | gefixt | aktive Fälle | alle grün | Status |
|-------|-----------|-------------|--------|--------------|-----------|--------|
| R1 | 23 | 3 | 3 | 46 | ja | Löcher gestopft |
| R2 | 20 | 3 | 3 | 66 | ja | Löcher gestopft |
| R3 | 13 | 0 | 0 | 79 | ja | **dry** |
| R4 | – | — | — | — | — | ABGEBROCHEN (agent returned null) |
| R5 | – | — | — | — | — | ABGEBROCHEN (agent returned null) |
| R6 | 12 | 0 | 0 | 96 | ja | **dry** (mutationsgetestet) |
| R7 | — | — | — | — | ja | **dry** |
| R8 | — | 0 | 0 | 125 | ja | **dry** |
| R9 | — | **1** | 1 | 146 | ja | Loch gestopft |
| R10 | — | 0 | 0 | 161 | ja | **dry** |
| R11 | — | 0 | 0 | (siehe Harness) | ja | **dry** → Konvergenz |

> Hinweis zu den „aktive Fälle"-Zahlen: das Wiring in `aufmass-watertight-t4-cases.ts` summiert alle Runden auf; der Harness `aufmass-watertight-t4.test.ts` meldet **175** Tests über den vollständigen aktiven Katalog (Stand 2026-06-21). Die Spalte oben bildet die je Runde gemeldeten loopLog-Stände ab.

**In R7–R11 neu gefundene + gefixte Löcher (echte Gate-Bugs, kein Test wurde aufgeweicht):**

- **R9 — 1 Loch (Konvergenzrunde):** In R9 wurde an einer bis dahin ungetesteten Stelle der Diff-Normalisierung eine Lücke gefunden und geschlossen. Die R9-Runde zielte gezielt auf bisher nicht getroffene Zweige: JS-Radix-Strings (Hex/Binär numerisch gleich → kein Fehlalarm), e-Notation mit echter Differenz, der String `"Infinity"`, HTTP-Obergrenze 299/300/302, **Skalar-readback als verschachteltes Objekt** (`{value:140}`) und **heatingCircuits-readback als Objekt statt Array/null**, Heizkreis-Toleranz just-over-epsilon, Whitespace-Index, Heizlast knapp über Null (`Number.MIN_VALUE`), viele Räume, gepaddeter Kundenname, Newline-only-ID und leeres readback-Array. Eines dieser neu enumerierten Szenarien wurde beim ersten Lauf falsch beurteilt (newHoles=1), der entsprechende Pfad in der Normalisierung/Diff-Logik wurde nachgezogen, anschließend grün verifiziert. Datei der Fälle: `aufmass-watertight-t4-cases.r9.ts`.
  - **Transparenz:** Im Kern-Code (`autarc-diff.ts`/`autarc-verify-core.ts`) ist der R9-Fix nicht mit einem `R9`-Kommentar markiert (anders als die R2-Test-Pins). Die loopLog-Daten sind die autoritative Quelle für „R9 = 1 Loch". Wer den exakten Fix-Diff sehen will, vergleicht den Worktree-Stand gegen den R8-Stand der Diff-/Core-Dateien.
- **R7, R8, R10, R11 — 0 Löcher:** alle neu enumerierten gemeinen Fälle (neue HTTP-Codes, Locale-Zahlen, Whitespace/Encoding, Mehrfach-Abweichungen, Prioritätskette, 2xx-non-200, NaN am Skalarfeld, Heizlast-als-Array, rooms-mit-Nicht-Objekten, Baualtersklassen-Grenze u. v. m.) wurden beim ERSTEN Lauf korrekt beurteilt. Kein Gate-Bug, keine Test-Aufweichung.

**Frühere Löcher (R1/R2, zur Vollständigkeit):**

- **R1-1/2/3** `roomsWrongShape` / `customersWrongShape` / `listProjectsWrongShape`: 200 mit Nicht-Array still zu `[]` gecoerct → Panne als gutartiger Zustand verkleidet. Fix: `autarc-verify-core.ts` / `autarc-match.ts` werfen bei Nicht-Array → `fehler`.
- **R2-1** `fallbackProjectNoId`: Fallback wählte Projekt mit leerer id → `matched` mit falsy projectId. Fix: `autarc-match.ts` validiert/trimmt `picked.id`, leer → `kein_projekt`.
- **R2-2/3** `getProjectNoIdObject` / `patchWrongShape`: 200-Objekt OHNE id → empty-readback-Heuristik labelte `kein_projekt` statt `fehler`. Fix: `autarc-verify-core.ts getProject()` wirft, wenn Body kein projektförmiges Objekt mit id ist.
- **R2-Zusatz:** whitespace-only `savedProjectId` galt als gültige ID → getrimmt → Fallback.

---

## 4. Review-Befunde (Critical / High)

**Befunde dieses Build-Slices nach Konvergenz:**

- ~~HIGH — Loop nicht sauber konvergiert.~~ **ERLEDIGT.** R10+R11 beide dry → DoD „2 Runden dry in Folge" formal erfüllt (`converged=true`, `dryStreak=2`).
- **LOW — Fremddatei `__probe.test.ts`** liegt im Aufmaß-Ordner (Rauschen, keine Assertions). Vor Merge entfernen.
- **LOW — R9-Fix ohne In-Code-Marker.** Der eine in R9 gefundene Fix trägt keinen `R9`-Kommentar im Kern. Vor Merge optional einen kurzen Kommentar an der Diff-Normalisierungsstelle ergänzen, damit der Grund nachvollziehbar bleibt.

> Falls in einem separaten Review-Schritt weitere Critical/High-Befunde entstanden sind, hier ergänzen — dieser Report bildet ab, was im Build selbst sichtbar war.

---

## 5. OFFENE PUNKTE FÜR DEN NUTZER (wörtlich aus Spec §12)

1. **autarc-API-Key** setzen → `_scripts/autarc-api-test/test.ps1` messen (Compute-Timing) → Poll-Fenster final justieren.
2. **Migration anwenden** (via deine CLI), nicht automatisch. Datei: `supabase/migrations/20260621143500_t4_autarc_sync_status.sql`.
3. **KI-Assistenz** als eigene, reviewte Phase planen (nicht Teil dieses Slices).
4. **Review + Merge** des Worktree-Branches `feature/t4-autarc-gate-loop`.
5. **`heatedLivingAreaM2`-Quelle** bestätigen (Formularfeld vs. `auftrag.quadratmeter` — Doppelquelle vermeiden).

**Zusätzlich aus diesem Build:**
6. **`__probe.test.ts`** vor Merge entfernen.

> Der frühere Punkt „R7-Loop-Runde nachfahren" ist entfallen — die Konvergenz wurde mit R7–R11 sauber erreicht (R10+R11 dry).

---

## 6. Wie man es anschaut

- **Worktree:** `C:\Users\aberg\Downloads\dev\.worktrees\qmp-t4-autarc-gate`
- **Branch:** `feature/t4-autarc-gate-loop` (nichts committet/gepusht — alle T4-Dateien sind untracked/modified im Working Tree)
- **Tests laufen mit:**
  - Volle Regression: `cd .worktrees/qmp-t4-autarc-gate && npx vitest run src/features/aufmass/`
  - Nur T4-Harness: `npx vitest run src/features/aufmass/data/aufmass-watertight-t4.test.ts`
  - Nur autarc-Units: `npx vitest run src/features/aufmass/data/autarc-diff.test.ts src/features/aufmass/data/autarc-match.test.ts src/features/aufmass/data/autarc-gate.test.ts src/features/aufmass/data/autarc-verify-core.test.ts`
  - Typecheck: `npx tsc -p tsconfig.app.json --noEmit`

---

## 7. Leitplanken eingehalten

- Nur im Worktree geschrieben (einzige Ausnahme: diese HANDOFF-Kopie nach `_specs/`).
- Kein `git commit`, kein `git push`, kein Branch-Wechsel.
- Kein echter autarc-Call / kein Netzwerk an `api2.autarc.energy` — alles gegen gemocktes `fetch`.
- Migration nur als `.sql`-Datei, NICHT angewendet.
- Kein IAM/Auth, kein wp-flow-hub.
