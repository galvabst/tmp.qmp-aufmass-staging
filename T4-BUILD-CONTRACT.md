# T4 autarc-Gate + Wasserdicht-Loop — BUILD-CONTRACT

**Quelle der Wahrheit:** `_specs/2026-06-21-aufmass-t4-autarc-gate-loop-design.md`.
Bei Konflikt gewinnt die Spec. Dieser Contract ist die verbindliche Bauanweisung,
abgeleitet aus dem **echten** bestehenden Code (gelesen, nicht vermutet).

## 0. Bestandsaufnahme (echter Code — wird wiederverwendet, nichts erfinden)

| Datei | Was existiert wirklich (load-bearing) |
|-------|----------------------------------------|
| `src/features/aufmass/data/aufmass-to-autarc.ts` | `export function mapAufmassToAutarc(values: Partial<AufmassDraftData>): AutarcMappingResult`. Rückgabe: `{ fields, payload, filledCount, totalCount }`. **`payload: Record<string, unknown>`** = nur befüllte direct+derived. `heatingCircuits` wird als Array `[{ name, flowTemperature, returnTemperature, index }]` ins payload geschrieben (nur wenn vl & rl gesetzt). Felder mit `value == null` und `source==='missing'` sind NICHT im payload. **`technicalFeasibilityAssesment` wird vom Mapping gar nicht erzeugt** (gut — Spec §7 will es nie senden). Exporte außerdem: `AutarcFieldMapping`, `AutarcMappingResult`, `MappingSource`, `deriveBuildingAge`, `deriveHeatingConstructionYear`. |
| `src/features/aufmass/data/aufmass-watertight.ts` | `caughtBy(c)`, `findHoles(cases)`, `mergedFor(c)`, `VALID_BASELINE`, `PV_BASELINE`. Muster: `caughtBy` ist **synchron, rein**, gibt `boolean`. |
| `src/features/aufmass/data/aufmass-watertight-cases.ts` | `interface WatertightCase { id; page; domain:'wp'|'pv'; label; field; values; expect:'block'|'soft'; why; skip? }`. `export const WATERTIGHT_CASES`. |
| `src/features/aufmass/data/aufmass-watertight.test.ts` | Pattern: `describe → for-of über aktive Fälle → it(...) → expect(caughtBy(c), msg).toBe(true)`. Skips via `c.skip` gefiltert. |
| `src/features/aufmass/data/aufmass-schema.ts` | `AufmassDraftData`, `AufmassSubmitData`, `aufmassSubmitSchema`, `aufmassDraftSchema`. Enums: `GEBAEUDETYP_WERTE`, `ROHRSYSTEM_WERTE`, `VERGLASUNG_WERTE`. |
| `src/integrations/supabase/thermocheck-client.ts` | `supabaseTC` (Client mit `db.schema='thermocheck'`). Tabelle laut Spec §5: `thermocheck.thermocheck_vot_formulare`. |
| `supabase/functions/admin-impersonate/index.ts` | Edge-Function-Stil: `Deno.serve(async (req)=>{...})`, `corsHeaders`, OPTIONS-Handling, `Deno.env.get(...)`, lokale `json(payload,status)`-Helper, `import ... from 'https://esm.sh/...'`. **Diesem Stil exakt folgen.** |

**Echte autarc-API-Form** (aus `_scripts/autarc-api-test/test.ps1` + `_scripts/autarc-waechter-prototype/server.mjs`, beide außerhalb Worktree, nur gelesen):
- Base: `https://api2.autarc.energy/api/v1`. Auth-Header: `x-api-key: <AUTARC_API_KEY>`.
- `PATCH /projects/{id}` mit Teil-Payload → 200, gibt Projekt zurück.
- `GET /projects/{id}` → Projektobjekt mit **gesendeten** Feldern + **computed**: `buildingHeatLoadKw`, `consumptionBasedHeatload`, `avgHeatload`, `yearlyEnergyConsumption`, `heatPumpSizing`, `technicalFeasibilityAssesment` (Tippfehler von autarc, so übernehmen).
- `GET /projects/{id}/rooms` → Array `[{ id, name, floor, temperature, ... }]` (von der API read-only, kann leer sein).
- `GET /customers?search=<Name>` → Array von Kunden `[{ id, firstName, lastName, ... }]`.
- `GET /projects?customerId=<id>` → Array Projekte (für Fallback-Auflösung).
- `heatingCircuits`: Array `[{ name, flowTemperature, returnTemperature, index }]`.

---

## 1. Exakte neue Dateien (mit Zweck)

### Kern-Module (reine TS, laufen in Vitest, KEIN Deno/Netz)
1. `src/features/aufmass/data/autarc-diff.ts`
   Normalisierung + Vergleich **gesendet ↔ zurückgelesen**. Float-Toleranz, Enum/Bool exakt, `heatingCircuits` strukturell pro Index, `"200"` vs `200` egalisiert, `technicalFeasibilityAssesment` ignoriert. Liefert Differenzliste.
2. `src/features/aufmass/data/autarc-match.ts`
   Projekt-Auflösung: primär gespeicherte ID, sonst Fallback `customers?search → projects?customerId`. **Rein**, mit **injizierbarer `fetch`**.
3. `src/features/aufmass/data/autarc-gate.ts`
   Status-Automat + „was fehlt"-Meldungen (DE). Reine Entscheidungslogik: nimmt Diff-Ergebnis + rooms-Count + Heizlast + Match-Resultat, liefert finalen Status + konkrete Meldung. **Keine I/O.**
4. `src/features/aufmass/data/autarc-verify-core.ts`
   Orchestriert `match → patch → readback → diff → completeness` mit **injizierter `fetch`**. Rein/testbar, gibt strukturiertes Ergebnis. Kein Deno, kein DB-Write (DB-Write macht der Edge-Wrapper).

### Edge Function (dünner Deno-Wrapper)
5. `supabase/functions/autarc-patch-verify/index.ts`
   `Deno.serve`-Wrapper um `autarc-verify-core`. autarc-Key serverseitig (`Deno.env.get('AUTARC_API_KEY')`), reicht echtes `fetch` rein, schreibt das Ergebnis in `thermocheck.thermocheck_vot_formulare` (via Service-Role-Client). Folgt `admin-impersonate`-Stil (CORS, OPTIONS, json-Helper).
   > Da Deno-Imports nicht 1:1 mit dem Vite-`@/`-Alias laufen, dupliziert der Wrapper KEINE Logik — er importiert die Kern-`.ts` per relativem Pfad bzw. enthält nur Glue (Key lesen, fetch-Wrapper bauen, Core aufrufen, DB-Write, Response). **Gesamte Entscheidungslogik bleibt in den Kern-Modulen.**

### Migration (nur Datei, NICHT anwenden)
6. `supabase/migrations/<timestamp>_t4_autarc_sync_status.sql`
   Additive Spalten lt. Spec §5 auf `thermocheck.thermocheck_vot_formulare`, alle `IF NOT EXISTS`, idempotent. Timestamp-Format wie bestehende Migrationen (`YYYYMMDDHHMMSS_...`). RLS bleibt wie thermocheck (keine neue Policy nötig — nur Spalten).

### Tests + Wasserdicht-Loop
7. `src/features/aufmass/data/autarc-diff.test.ts` — Unit-Tests für Diff/Normalisierung.
8. `src/features/aufmass/data/autarc-match.test.ts` — Unit-Tests Match/Fallback (mit Mock-fetch).
9. `src/features/aufmass/data/autarc-gate.test.ts` — Unit-Tests Status-Automat + Meldungen.
10. `src/features/aufmass/data/autarc-verify-core.test.ts` — Integrationstest des Kerns gegen Mock-fetch (Happy + Pannen).
11. `src/features/aufmass/data/aufmass-watertight-t4.ts` — T4-Harness (analog `aufmass-watertight.ts`): fährt T4-Fälle gegen den echten `autarcVerifyCore` mit dem Mock-fetch und urteilt.
12. `src/features/aufmass/data/aufmass-watertight-t4-cases.ts` — Fall-Katalog (`T4Case`-Interface + Seed-Fälle).
13. `src/features/aufmass/data/aufmass-watertight-t4.test.ts` — Regressionstest über alle T4-Fälle (analog `aufmass-watertight.test.ts`).

---

## 2. Exakte Funktions-Signaturen (TypeScript)

### `autarc-diff.ts`
```ts
/** Eine erkannte Abweichung zwischen gesendet und zurückgelesen. */
export interface AutarcDiffEntry {
  feld: string;
  gesendet: unknown;
  autarc: unknown;
  art: 'fehlt' | 'abweichung';
}

export interface AutarcDiffResult {
  ok: boolean;                 // true = keine Abweichung
  abweichungen: AutarcDiffEntry[];
}

/** autarc-Felder, die NIE verglichen werden (computed / wertlos als Signal). */
export const IGNORED_AUTARC_FIELDS: readonly string[]; // u.a. 'technicalFeasibilityAssesment', 'buildingHeatLoadKw', 'consumptionBasedHeatload', 'avgHeatload', 'yearlyEnergyConsumption', 'heatPumpSizing', 'id', 'humanId'

/** Default-Toleranz für Float-Vergleich. */
export const FLOAT_EPSILON: number; // z.B. 0.01

/** Vergleicht NUR die gesendeten Felder (payload) gegen das zurückgelesene Projekt. */
export function diffAutarcPayload(
  sent: Record<string, unknown>,
  readback: Record<string, unknown>,
  epsilon?: number,
): AutarcDiffResult;

/** Normalisiert einen Skalar für den Vergleich ("200"→200, " a "→"a", null/undefined→null). */
export function normalizeValue(v: unknown): unknown;

/** Strukturvergleich heatingCircuits pro index (flow/return), reihenfolge-unabhängig über index. */
export function diffHeatingCircuits(
  sent: unknown,
  readback: unknown,
  epsilon: number,
): AutarcDiffEntry[];
```

### `autarc-match.ts`
```ts
/** Minimal injizierbare fetch-Signatur (Browser/Deno-kompatibel). */
export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export interface AutarcMatchInput {
  /** Bereits gespeicherte autarc-Projekt-ID am Formular/Auftrag (primär). */
  savedProjectId?: string | null;
  /** Kundenname für Fallback-Suche. */
  customerName?: string | null;
  /** Optional: Adresse zur Disambiguierung mehrerer Treffer. */
  addressHint?: string | null;
}

export type AutarcMatchStatus = 'matched' | 'kein_projekt' | 'fehler';

export interface AutarcMatchResult {
  status: AutarcMatchStatus;
  projectId: string | null;
  /** 'saved' | 'fallback' | null — woher die ID kam. */
  source: 'saved' | 'fallback' | null;
  /** DE-Klartext bei kein_projekt/fehler. */
  meldung?: string;
}

export interface AutarcClientConfig {
  baseUrl: string;        // https://api2.autarc.energy/api/v1
  apiKey: string;         // x-api-key
  fetchImpl: FetchLike;   // injizierbar → im Test gemockt
}

export async function resolveAutarcProject(
  input: AutarcMatchInput,
  cfg: AutarcClientConfig,
): Promise<AutarcMatchResult>;
```

### `autarc-gate.ts`
```ts
/** Endzustände lt. Spec §5/§8. */
export type AutarcSyncStatus =
  | 'ausstehend'
  | 'ok'           // Round-Trip grün, aber noch nicht final freigegeben
  | 'freigegeben'  // ok + rooms>0 + heizlast>0  (Spec: „final korrekt")
  | 'eingereicht'  // Round-Trip grün, autarc noch nicht vollständig/berechnet
  | 'abweichung'
  | 'unvollstaendig'
  | 'kein_projekt'
  | 'fehler';

export interface GateInput {
  match: AutarcMatchResult;
  diff?: AutarcDiffResult;          // nur wenn match=matched + readback erfolgte
  roomCount?: number;               // aus GET /rooms
  buildingHeatLoadKw?: number | null;
  /** Technischer Fehler (Netz/HTTP/JSON) — überschreibt alles → 'fehler'. */
  transportError?: string | null;
}

export interface GateResult {
  status: AutarcSyncStatus;
  /** true = blockt „freigegeben". */
  blockt: boolean;
  /** Konkrete, deutschsprachige Handlungsanweisung. NIE generisch. */
  meldung: string;
  /** Maschinenlesbare Differenzliste (für UI), falls vorhanden. */
  abweichungen?: AutarcDiffEntry[];
}

/** Reiner Status-Automat: leitet aus den Signalen den Endzustand + Meldung ab. */
export function evaluateGate(input: GateInput): GateResult;
```

### `autarc-verify-core.ts`
```ts
export interface VerifyInput {
  values: Partial<AufmassDraftData>;   // → mapAufmassToAutarc(values)
  match: AutarcMatchInput;
}

export interface VerifyConfig extends AutarcClientConfig {
  /** Poll-Fenster für Heizlast (Spec §9). 0 = kein Poll. */
  heatLoadPollMs?: number;
  heatLoadPollAttempts?: number;
}

export interface VerifyResult extends GateResult {
  projectId: string | null;
  /** Das tatsächlich gesendete PATCH-Payload (für Audit/DB). */
  sentPayload: Record<string, unknown>;
  syncedAt: string; // ISO
}

/**
 * Orchestriert match → PATCH → GET readback → diff → rooms → heizlast → evaluateGate.
 * Rein/testbar: jede autarc-Interaktion läuft über cfg.fetchImpl.
 * Fängt JEDEN throw/Non-2xx ab → transportError → Gate liefert 'fehler' (nie Erfolg).
 */
export async function autarcVerifyCore(
  input: VerifyInput,
  cfg: VerifyConfig,
): Promise<VerifyResult>;
```

### `aufmass-watertight-t4.ts`
```ts
import { T4Case } from './aufmass-watertight-t4-cases';

/** Baut aus dem Mock eines Falls ein FetchLike, das je URL die richtige Antwort liefert. */
export function mockFetchFor(c: T4Case): FetchLike;

/** Fährt einen Fall gegen den ECHTEN autarcVerifyCore mit dem Fall-Mock. */
export async function runT4Case(c: T4Case): Promise<VerifyResult>;

/** true = der Kern liefert für den Fall genau den erwarteten Status & Block-Verhalten. */
export async function judgedCorrectly(c: T4Case): Promise<boolean>;

/** Alle Fälle, deren Urteil NICHT der Erwartung entspricht = Löcher. */
export async function findT4Holes(cases: T4Case[]): Promise<T4Case[]>;
```

---

## 3. Genaue Form der gemockten autarc-Antworten

Ein einziges Mock-fetch pro Fall, das nach `method + URL-Pfad` verzweigt. Abgeleitet aus der echten API (test.ps1 / waechter). Typen:

```ts
/** Zurückgelesenes Projekt (GET /projects/{id}) — gesendete + computed Felder. */
export interface AutarcProjectMock {
  id: string;
  humanId?: string;
  // gesendete (Beispiel-Auszug, kommen aus payload):
  buildingType?: string;
  heatedLivingAreaM2?: number | string;     // "200" als String möglich → Diff muss egalisieren
  numberOfResidents?: number;
  numberOfFloors?: number;
  isMonumentProtected?: boolean;
  averageEnergyConsumptionLast3Years?: number;
  isFacadeInsulated?: boolean;
  isRoofInsulated?: boolean;
  pipeSystemType?: string;
  windowGlazingType?: string;
  hasFireplace?: boolean;
  hasSolarThermalSystem?: boolean;
  currentHeatingSystemType?: string;
  roomHeatingType?: string;
  buildingAge?: string;
  currentHeatingSystemConstructionYear?: string;
  drinkingWaterHeatingSystemType?: string;
  heatingCircuits?: Array<{ name?: string; flowTemperature: number; returnTemperature: number; index: number }>;
  // computed (NIE vergleichen):
  buildingHeatLoadKw?: number | null;
  technicalFeasibilityAssesment?: unknown;
  heatPumpSizing?: { heatPumpStandardOutputKw?: number; bivalencePoint?: number } | null;
  [k: string]: unknown;
}

export interface AutarcRoomMock { id: string; name: string; floor?: string; temperature?: number | null; }
export interface AutarcCustomerMock { id: string; firstName: string; lastName: string; }

/** Gemockte autarc-Welt für einen Fall + Pannen-Schalter. */
export interface AutarcMock {
  /** Antwort auf GET /customers?search= (Fallback-Auflösung). */
  customers?: AutarcCustomerMock[];
  /** Antwort auf GET /projects?customerId= (Fallback). */
  projectsByCustomer?: Array<{ id: string; humanId?: string }>;
  /** Das via PATCH/GET gehandhabte Projekt. readback nach PATCH. */
  project?: AutarcProjectMock;
  /** Antwort auf GET /projects/{id}/rooms. */
  rooms?: AutarcRoomMock[];
  /** PANNEN: erzwinge HTTP-Status pro Endpunkt (statt 200). */
  httpStatus?: Partial<Record<'patch' | 'getProject' | 'getRooms' | 'searchCustomers' | 'listProjects', number>>;
  /** PANNE: liefere kaputtes JSON bei genanntem Endpunkt. */
  brokenJson?: Array<'patch' | 'getProject' | 'getRooms' | 'searchCustomers' | 'listProjects'>;
  /** PANNE: simuliere Netzwerk-Abbruch (fetch wirft) bei genanntem Endpunkt. */
  networkError?: Array<'patch' | 'getProject' | 'getRooms' | 'searchCustomers' | 'listProjects'>;
  /** Verzögerte Heizlast: erste N readbacks 0, danach Wert (Poll-Test §9). */
  heatLoadAppearsAfterReads?: number;
}
```

**Konkretes Beispiel (Happy-Path-Projekt, freigegeben):**
```ts
const happyMock: AutarcMock = {
  project: {
    id: 'p-1', humanId: 'AT-1001',
    buildingType: 'singleOrDoubleFamilyHouse',
    heatedLivingAreaM2: 140, numberOfResidents: 3, numberOfFloors: 2,
    isMonumentProtected: false, averageEnergyConsumptionLast3Years: 18000,
    isFacadeInsulated: true, isRoofInsulated: true,
    pipeSystemType: 'twoPipeHeating', windowGlazingType: 'doubleWithThermalInsulation',
    hasFireplace: false, hasSolarThermalSystem: false,
    currentHeatingSystemType: 'gas', roomHeatingType: 'radiator',
    buildingAge: 'from1995To2001', currentHeatingSystemConstructionYear: 'after1995',
    drinkingWaterHeatingSystemType: 'withoutCirculation',
    heatingCircuits: [{ name: 'Heizkreis 1', flowTemperature: 55, returnTemperature: 45, index: 0 }],
    buildingHeatLoadKw: 8.4,                 // > 0 → freigabefähig
    technicalFeasibilityAssesment: 'whatever' // ignoriert
  },
  rooms: [{ id: 'r1', name: 'Wohnzimmer', floor: 'ground', temperature: 21 }],
};
```

**Mock-fetch-Verhalten (von `mockFetchFor` umgesetzt):**
- `PATCH /projects/{id}` → 200, body = aktualisiertes `project` (merge des Patch-Payloads ins Mock-project, damit readback den gesendeten Wert zurückgibt; ABER bei „abweichung"-Fällen liefert das Mock-project absichtlich einen anderen Wert).
- `GET /projects/{id}` → `project` (bzw. `buildingHeatLoadKw: 0` solange `heatLoadAppearsAfterReads` noch nicht erreicht).
- `GET /projects/{id}/rooms` → `rooms ?? []`.
- `GET /customers?search=` → `customers ?? []`.
- `GET /projects?customerId=` → `projectsByCustomer ?? []`.
- `httpStatus`/`brokenJson`/`networkError` überschreiben den jeweiligen Endpunkt → Core muss in `fehler` enden, **nie** Erfolg.

---

## 4. Fall-Format für den T4-Wasserdicht-Loop

```ts
export interface T4Case {
  /** Stabile ID, z.B. 't4.diff.areaMismatch'. */
  id: string;
  /** Angriffsfläche: 'mapping'|'diff'|'match'|'status'|'meldung'|'panne'. */
  flaeche: 'mapping' | 'diff' | 'match' | 'status' | 'meldung' | 'panne';
  label: string;
  /** Partielle Formularwerte (werden über VALID_BASELINE gemergt → mapAufmassToAutarc). */
  formValues: Partial<AufmassDraftData>;
  /** Match-Input (savedProjectId/customerName) für den Fall. */
  matchInput?: AutarcMatchInput;
  /** Gemockte autarc-Welt inkl. Pannen. */
  autarcMock: AutarcMock;
  /** Erwartetes Urteil. */
  expect: {
    status: AutarcSyncStatus;
    blockt: boolean;
    /** Substring, der in der DE-Meldung vorkommen MUSS (Konkretheits-Garantie). */
    meldungEnthaelt?: string;
  };
  why: string;
  /** Bewusst übersprungen (mit Begründung) — analog WatertightCase.skip. */
  skip?: string;
}
```

**Pflicht-Seed-Fälle (mind.):**
| id | flaeche | Mock-Panne | expect.status | blockt |
|----|---------|-----------|---------------|--------|
| `t4.happy.freigegeben` | status | – (rooms>0, heizlast>0, diff ok) | `freigegeben` | false |
| `t4.diff.areaMismatch` | diff | readback heatedLivingAreaM2 abweichend | `abweichung` | true |
| `t4.diff.stringNumberEqual` | diff | readback `"140"` vs gesendet `140` | `freigegeben` | false (kein Fehlalarm) |
| `t4.diff.circuitFlowMismatch` | diff | heatingCircuits flowTemperature abweichend | `abweichung` | true |
| `t4.complete.noRooms` | status | `rooms=[]` | `unvollstaendig` | true |
| `t4.complete.heatLoadZero` | status | `buildingHeatLoadKw=0` | `eingereicht` | true |
| `t4.complete.heatLoadDelayed` | status | `heatLoadAppearsAfterReads:1` | `freigegeben` | false |
| `t4.match.noId.noCustomer` | match | keine ID, `customers=[]` | `kein_projekt` | true |
| `t4.match.fallbackOk` | match | keine ID, customer+project gefunden | (weiter wie status) | – |
| `t4.panne.patch500` | panne | `httpStatus.patch=500` | `fehler` | true |
| `t4.panne.getProjectTimeout` | panne | `networkError:['getProject']` | `fehler` | true |
| `t4.panne.brokenJson` | panne | `brokenJson:['getProject']` | `fehler` | true |
| `t4.meldung.unvollstaendigKonkret` | meldung | `rooms=[]` | `unvollstaendig` + meldung enthält „Räume" | true |

---

## 5. Status-Automat (Zustände + erlaubte Übergänge + „kein Fehler je als Erfolg")

`evaluateGate(input)` entscheidet **deterministisch in dieser Reihenfolge** (erstes Match gewinnt):

```
1. transportError gesetzt?            → 'fehler'        (blockt)   [HÖCHSTE PRIORITÄT]
2. match.status === 'fehler'?         → 'fehler'        (blockt)
3. match.status === 'kein_projekt'?   → 'kein_projekt'  (blockt)
4. diff && !diff.ok?                  → 'abweichung'    (blockt)   + abweichungen-Liste
5. roomCount === 0 (oder undefined)?  → 'unvollstaendig'(blockt)
6. !(buildingHeatLoadKw > 0)?         → 'eingereicht'   (blockt)
7. sonst (diff ok & rooms>0 & heizlast>0) → 'freigegeben' (frei)
```

Erlaubter Übergangsgraph (vom Verlauf eines Abgebens):
```
            ┌─────────────► fehler          (Abbruch, blockt)
            ├─────────────► kein_projekt     (blockt, manuelle Verknüpfung)
ausstehend ─┼─► matched ──► abweichung        (blockt, Differenzliste)
            │             ├► unvollstaendig   (blockt, „Räume scannen")
            │             ├► eingereicht       (blockt, „Heizlast fehlt/öffnen")
            │             └► freigegeben       (FREI — einziger Erfolgszustand)
```

**Invariante „kein Fehler je als Erfolg" (im T4-Loop hart getestet):**
- Jeder `transportError` / Non-2xx / kaputtes JSON / Timeout / `networkError` ⇒ Status ∈ {`fehler`} und `blockt === true`. **Nie** `ok`/`freigegeben`.
- `freigegeben` ist der **einzige** Zustand mit `blockt === false`. Alle anderen blocken.
- Jeder Nicht-`freigegeben`-Zustand liefert eine nicht-leere, **feldkonkrete** DE-`meldung` (Regressionstest prüft `meldungEnthaelt`-Substring). Generische Meldungen wie „Fehler" ohne nächsten Schritt sind verboten.

---

## DoD-Bezug (Spec §13)
- Neue T4-Suite grün: `npx vitest run src/features/aufmass/data/autarc-*.test.ts src/features/aufmass/data/aufmass-watertight-t4.test.ts`.
- Regression grün: `npx vitest run src/features/aufmass/` (nur Aufmaß-Ordner, NICHT ganze App).
- Loop 2 Runden dry; nichts gepusht; Migration nur als Datei; kein echter autarc/Netz-Call.

---

## 5-Zeilen-Zusammenfassung
1. Wiederverwendet wird `mapAufmassToAutarc(values).payload` als gesendetes PATCH-Payload — `technicalFeasibilityAssesment` taucht dort nicht auf (Spec-konform), `heatingCircuits` ist ein Array.
2. Vier reine Kern-Module (diff/match/gate/verify-core) mit injizierbarem `fetch`; die Edge Function `autarc-patch-verify` ist nur Deno-Glue (Key + echtes fetch + DB-Write) im `admin-impersonate`-Stil.
3. Echte autarc-Form ist belegt (test.ps1/waechter): `x-api-key`, `PATCH/GET /projects/{id}`, `/projects/{id}/rooms`, `/customers?search`, `/projects?customerId`, computed `buildingHeatLoadKw` + `technicalFeasibilityAssesment`-Tippfehler.
4. Der T4-Loop erweitert das bestehende Harness mit `T4Case` (formValues + autarcMock-Pannen + erwartetem status/blockt/Meldungs-Substring) und einem URL-routenden Mock-fetch — gegen den echten `autarcVerifyCore`.
5. Status-Automat ist eine 7-stufige Prioritätskette mit `freigegeben` als einzigem nicht-blockenden Erfolg; jede Panne (HTTP/JSON/Timeout/Netz) endet hart in `fehler` (blockt) — „kein Fehler je als Erfolg" ist die im Loop getestete Invariante.
