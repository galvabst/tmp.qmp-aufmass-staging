/**
 * autarc-verify-core — Orchestrierung des T4-Gates (Contract §2, Spec §4).
 *
 * Orchestriert: match → PATCH → GET readback → diff → GET rooms → Heizlast(+Poll)
 * → evaluateGate. Rein/testbar: JEDE autarc-Interaktion läuft über `cfg.fetchImpl`,
 * KEIN echter Call, KEIN Deno, KEIN DB-Write (das macht der Edge-Wrapper).
 *
 * Invariante „kein Fehler je als Erfolg": jeder throw / Non-2xx / kaputtes JSON /
 * Timeout / networkError wird zu `transportError` → Gate liefert `fehler` (blockt).
 */

import type { AufmassDraftData } from './aufmass-schema';
import { mapAufmassToAutarc } from './aufmass-to-autarc';
import {
  resolveAutarcProject,
  type AutarcClientConfig,
  type AutarcMatchInput,
  type AutarcMatchResult,
} from './autarc-match';
import { diffAutarcPayload, FLOAT_EPSILON, type AutarcDiffResult } from './autarc-diff';
import { evaluateGate, type GateInput, type GateResult } from './autarc-gate';

export interface VerifyInput {
  /** → mapAufmassToAutarc(values). */
  values: Partial<AufmassDraftData>;
  match: AutarcMatchInput;
}

export interface VerifyConfig extends AutarcClientConfig {
  /** Poll-Pause zwischen Heizlast-Versuchen (Spec §9). 0 = kein Poll. */
  heatLoadPollMs?: number;
  heatLoadPollAttempts?: number;
}

export interface VerifyResult extends GateResult {
  projectId: string | null;
  /** Das tatsächlich gesendete PATCH-Payload (für Audit/DB). */
  sentPayload: Record<string, unknown>;
  /** ISO-Zeitstempel des Verify-Laufs. */
  syncedAt: string;
}

interface AutarcProject {
  id: string;
  buildingHeatLoadKw?: number | null;
  [k: string]: unknown;
}

function headers(cfg: VerifyConfig): HeadersInit {
  return { 'x-api-key': cfg.apiKey, 'Content-Type': 'application/json' };
}

/**
 * true = das zurückgelesene Projekt enthält KEINES der gesendeten Felder. Das ist
 * kein Daten-Diff, sondern ein faktisch nicht existierendes/falsch verknüpftes
 * Projekt → muss als `kein_projekt` behandelt werden (nicht als `abweichung`).
 * Hat das payload nichts Vergleichbares (alles ignoriert), gilt es nicht als leer.
 */
function isEmptyReadback(
  sentPayload: Record<string, unknown>,
  readback: Record<string, unknown>,
): boolean {
  const vergleichbar = Object.keys(sentPayload).filter((k) => sentPayload[k] != null);
  if (vergleichbar.length === 0) return false;
  // „Nicht angekommen" = null/undefined ODER ein leeres Array (z. B. heatingCircuits: [])
  // — ein leeres Array ist nicht null, repräsentiert aber denselben „kein Wert da"-Zustand.
  const istLeer = (x: unknown): boolean => x == null || (Array.isArray(x) && x.length === 0);
  return vergleichbar.every((k) => istLeer(readback[k]));
}

/** Wartet ms; 0/negativ = sofort weiter (kein echtes Blockieren im Test mit ms=0). */
function delay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Sendet das PATCH; wirft bei Non-2xx (→ transportError). Body wird ignoriert. */
async function patchProject(
  cfg: VerifyConfig,
  projectId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const res = await cfg.fetchImpl(`${cfg.baseUrl}/projects/${projectId}`, {
    method: 'PATCH',
    headers: headers(cfg),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`PATCH /projects/${projectId} → HTTP ${res.status}`);
  // readback erfolgt separat via GET; PATCH-Body wird nicht ausgewertet.
}

/**
 * Liest das Projekt zurück; wirft bei Non-2xx, kaputtem JSON ODER falscher Form.
 * Eine 200-Antwort, die KEIN projekt-förmiges Objekt ist (null, Array, oder ein
 * Objekt ohne `id`), ist eine technische Panne — sie darf NICHT als „leeres /
 * falsch verknüpftes Projekt" (kein_projekt) fehlinterpretiert werden, sonst
 * würde eine kaputte autarc-Antwort als sauberes Sachurteil getarnt. → werfen,
 * damit der Core in `fehler` endet (kein Fehler je als Erfolg).
 */
async function getProject(cfg: VerifyConfig, projectId: string): Promise<AutarcProject> {
  const res = await cfg.fetchImpl(`${cfg.baseUrl}/projects/${projectId}`, {
    method: 'GET',
    headers: headers(cfg),
  });
  if (!res.ok) throw new Error(`GET /projects/${projectId} → HTTP ${res.status}`);
  const body = await res.json();
  if (
    body == null ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    (body as Record<string, unknown>).id == null
  ) {
    throw new Error(`GET /projects/${projectId} → unerwartete Antwortform (kein Projekt-Objekt mit id)`);
  }
  return body as AutarcProject;
}

/**
 * Holt die Räume; wirft bei Non-2xx, kaputtem JSON ODER falscher Form.
 * Eine 200-Antwort, die KEIN Array ist (z. B. ein Fehler-Objekt), ist eine Panne —
 * sie darf NICHT als „0 Räume / unvollständig" fehlinterpretiert werden, sonst
 * würde der Techniker zum Räume-Scannen geschickt, obwohl autarc technisch kaputt
 * geantwortet hat. → werfen, damit der Core in `fehler` endet.
 */
async function getRooms(cfg: VerifyConfig, projectId: string): Promise<number> {
  const res = await cfg.fetchImpl(`${cfg.baseUrl}/projects/${projectId}/rooms`, {
    method: 'GET',
    headers: headers(cfg),
  });
  if (!res.ok) throw new Error(`GET /projects/${projectId}/rooms → HTTP ${res.status}`);
  const rooms = await res.json();
  if (!Array.isArray(rooms)) {
    throw new Error(`GET /projects/${projectId}/rooms → unerwartete Antwortform (kein Array)`);
  }
  return rooms.length;
}

/** Liest die Heizlast; bei 0/fehlend wird kurz gepollt (Spec §9). */
async function readHeatLoad(
  cfg: VerifyConfig,
  projectId: string,
  firstRead: AutarcProject,
): Promise<number | null> {
  let project = firstRead;
  const attempts = Math.max(0, cfg.heatLoadPollAttempts ?? 0);
  const pollMs = Math.max(0, cfg.heatLoadPollMs ?? 0);

  let kw = Number.isFinite(project.buildingHeatLoadKw) ? (project.buildingHeatLoadKw as number) : null;
  let tries = 0;
  while ((kw == null || kw <= 0) && tries < attempts) {
    await delay(pollMs);
    project = await getProject(cfg, projectId);
    kw = Number.isFinite(project.buildingHeatLoadKw) ? (project.buildingHeatLoadKw as number) : null;
    tries += 1;
  }
  return kw;
}

export async function autarcVerifyCore(
  input: VerifyInput,
  cfg: VerifyConfig,
): Promise<VerifyResult> {
  const syncedAt = new Date().toISOString();
  const sentPayload = mapAufmassToAutarc(input.values).payload;

  // 1. Projekt auflösen. Bei kein_projekt/fehler ohne PATCH ins Gate.
  let match: AutarcMatchResult;
  try {
    match = await resolveAutarcProject(input.match, cfg);
  } catch (e) {
    const gate = evaluateGate({
      match: { status: 'fehler', projectId: null, source: null },
      transportError: (e as Error).message,
    });
    return { ...gate, projectId: null, sentPayload, syncedAt };
  }

  if (match.status !== 'matched' || !match.projectId) {
    const gate = evaluateGate({ match });
    return { ...gate, projectId: match.projectId, sentPayload, syncedAt };
  }

  const projectId = match.projectId;

  // 2.–6. PATCH → readback → diff → rooms → heizlast. Jeder Fehler → transportError.
  try {
    await patchProject(cfg, projectId, sentPayload);
    const readback = await getProject(cfg, projectId);

    // Leeres readback (keines der gesendeten Felder ist angekommen) bedeutet:
    // das Projekt existiert in autarc faktisch nicht / ist nicht das richtige.
    // Das ist KEINE einzelne Abweichung, sondern „kein Projekt" — sonst würde ein
    // falsch verknüpftes/leeres Projekt fälschlich als Daten-Abweichung gemeldet.
    if (isEmptyReadback(sentPayload, readback as Record<string, unknown>)) {
      const gate = evaluateGate({
        match: { status: 'kein_projekt', projectId: null, source: null },
      });
      return { ...gate, projectId: null, sentPayload, syncedAt };
    }

    const diff: AutarcDiffResult = diffAutarcPayload(
      sentPayload,
      readback as Record<string, unknown>,
      FLOAT_EPSILON,
    );
    const roomCount = await getRooms(cfg, projectId);
    const buildingHeatLoadKw = await readHeatLoad(cfg, projectId, readback);

    const gateInput: GateInput = { match, diff, roomCount, buildingHeatLoadKw };
    const gate = evaluateGate(gateInput);
    return { ...gate, projectId, sentPayload, syncedAt };
  } catch (e) {
    const gate = evaluateGate({ match, transportError: (e as Error).message });
    return { ...gate, projectId, sentPayload, syncedAt };
  }
}
