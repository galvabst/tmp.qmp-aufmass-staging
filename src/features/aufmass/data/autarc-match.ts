/**
 * autarc-match — Projekt-Auflösung/Fallback (Spec §6).
 *
 * Reine, async Funktion mit INJIZIERBARER `fetch` — kein echter autarc-Call.
 *  - Primär: gespeicherte `savedProjectId` (kein Netz-Call).
 *  - Fallback: `GET /customers?search=<Name>` → `customerId`
 *              → `GET /projects?customerId=<id>` → jüngstes/erstes Projekt.
 *  - Kein Treffer: `kein_projekt` (sichtbarer DE-Hinweis, kein stiller Fehlschlag).
 *  - Netz-/HTTP-Panne: `fehler` (endet NIE als `matched`).
 */

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
  /** https://api2.autarc.energy/api/v1 */
  baseUrl: string;
  /** x-api-key */
  apiKey: string;
  /** injizierbar → im Test gemockt. */
  fetchImpl: FetchLike;
}

interface AutarcAddress {
  addressLine1?: string;
  postalCode?: string;
  city?: string;
}

interface AutarcCustomer {
  id: unknown;
  firstName?: string;
  lastName?: string;
  address?: AutarcAddress;
}

interface AutarcProjectStub {
  id: unknown;
  humanId?: string;
  address?: AutarcAddress;
}

/**
 * „Faktisch leere" ID? `String.trim()` entfernt NUR ASCII-/übliche Whitespace,
 * NICHT unsichtbare Unicode-Zeichen wie Zero-Width-Space (U+200B), BOM (U+FEFF)
 * oder Zero-Width-Joiner. Eine ID, die nach Entfernen aller Whitespace- UND
 * unsichtbaren Format-/Steuerzeichen nichts Druckbares übrig lässt, ist keine
 * gültige autarc-ID — sonst ginge ein PATCH an eine Geister-ID und ein falsch
 * verknüpfter Datensatz würde scheinbar „freigegeben".
 */
function cleanedId(raw: string | null | undefined): string {
  // Ränder von ASCII-Whitespace UND unsichtbaren Unicode-Zeichen befreien.
  // \s deckt sichtbaren/ASCII-Whitespace ab; \p{C} (Unicode-Kategorie „Other":
  // Control/Format/Surrogate/Private-Use/Unassigned) deckt die unsichtbaren Fälle
  // ab — u. a. Zero-Width-Space U+200B, ZWNJ/ZWJ U+200C/D, Word-Joiner U+2060,
  // BOM U+FEFF. So wird ' p-1 ' und '​p-1​' beides zu 'p-1', während
  // eine reine Whitespace-/Zero-Width-ID zu '' kollabiert (→ kein_projekt statt
  // PATCH an eine Geister-ID).
  return (raw ?? '').replace(/^[\s\p{C}]+|[\s\p{C}]+$/gu, '');
}

/** Standard-Header für jeden autarc-Call. */
function headers(cfg: AutarcClientConfig): HeadersInit {
  return { 'x-api-key': cfg.apiKey, 'Content-Type': 'application/json' };
}

/** GET + JSON; wirft bei Non-2xx oder kaputtem JSON (→ Aufrufer mappt auf fehler). */
async function getJson(cfg: AutarcClientConfig, url: string): Promise<unknown> {
  const res = await cfg.fetchImpl(url, { method: 'GET', headers: headers(cfg) });
  if (!res.ok) {
    throw new Error(`autarc GET ${url} → HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * autarc-Listen-Endpoints liefern INKONSISTENTE Envelopes (real verifiziert
 * 2026-06-21): `/customers?search=` gibt ein BARE ARRAY zurück, `/projects?
 * customerId=` dagegen ein `{ items: [...], metadata: {} }`-Objekt. Diese Funktion
 * akzeptiert BEIDE Formen und liefert das Array. Alles andere — null, Zahl, ein
 * Fehler-Objekt `{ message, error, statusCode }`, ein Objekt ohne items-Array —
 * ist eine technische Panne und wird geworfen (→ `fehler`, NIE fälschlich als
 * „kein Treffer" gewertet). Ohne diese Toleranz endete der gesamte Namens-Fallback
 * gegen die echte API immer in `fehler` (der {items}-Envelope ist kein Array).
 */
function asList(raw: unknown, quelle: string): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw != null && typeof raw === 'object') {
    const items = (raw as Record<string, unknown>).items;
    if (Array.isArray(items)) return items;
  }
  throw new Error(`${quelle} → unerwartete Antwortform (weder Array noch {items:[…]})`);
}

/**
 * Eine brauchbare autarc-ID ist ein nicht-leerer String (UUID). Eine Zahl wird als
 * String akzeptiert; Objekte/Arrays/null werden VERWORFEN — sonst würde z. B. ein
 * versehentliches Objekt via `String(obj)` → `"[object Object]"` als gültige ID
 * durchgehen und ein PATCH an eine Phantom-ID liefe scheinbar als „freigegeben".
 * cleanedId entfernt auch unsichtbare Unicode-Zeichen an den Rändern.
 */
function usableId(raw: unknown): string {
  if (typeof raw === 'string') return cleanedId(raw);
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
  return '';
}

/** Wie viele Adressteile (Straße/PLZ/Ort) eines Kandidaten tauchen im addressHint auf? */
function addrScore(hint: string, addr?: AutarcAddress): number {
  if (!addr) return 0;
  const h = hint.toLowerCase();
  let s = 0;
  for (const teil of [addr.addressLine1, addr.postalCode, addr.city]) {
    const t = typeof teil === 'string' ? teil.toLowerCase().trim() : '';
    if (t && h.includes(t)) s += 1;
  }
  return s;
}

/**
 * Wählt aus mehreren Kandidaten den per addressHint EINDEUTIG besten. Gibt null
 * zurück, wenn kein Hinweis vorliegt, keiner passt oder zwei gleich gut passen
 * (Gleichstand). In diesen Fällen ist eine sichere Zuordnung NICHT möglich — der
 * Aufrufer meldet dann `kein_projekt`, statt blind den ersten zu nehmen (sonst
 * Gefahr: falscher Kunde/Projekt → falsche „Freigabe").
 */
function pickUniqueByAddress<T extends { address?: AutarcAddress }>(
  cands: T[],
  hint: string | null | undefined,
): T | null {
  if (!hint || !hint.trim()) return null;
  const scored = cands
    .map((c) => ({ c, s: addrScore(hint, c.address) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  if (scored.length === 0) return null;
  if (scored.length === 1) return scored[0].c;
  return scored[0].s > scored[1].s ? scored[0].c : null;
}

export async function resolveAutarcProject(
  input: AutarcMatchInput,
  cfg: AutarcClientConfig,
): Promise<AutarcMatchResult> {
  // 1. Primär: gespeicherte ID (kein Netz-Call). Bereinigt — eine leere /
  // whitespace-only / nur-unsichtbare ID ist KEINE gültige autarc-ID und darf
  // nicht blind als matched gelten (sonst ginge ein PATCH an `/projects/%20%20`
  // bzw. an eine Zero-Width-Geister-ID). cleanedId verwirft auch unsichtbare
  // Unicode-Zeichen (U+200B u. a.), gibt aber die getrimmte Original-ID zurück.
  const saved = cleanedId(input.savedProjectId);
  if (saved) {
    return { status: 'matched', projectId: saved, source: 'saved' };
  }

  const name = (input.customerName ?? '').trim();
  if (!name) {
    return {
      status: 'kein_projekt',
      projectId: null,
      source: null,
      meldung:
        'Kein autarc-Projekt verknüpft und kein Kundenname zur Suche vorhanden. ' +
        'Bitte das Projekt in autarc manuell mit diesem Auftrag verknüpfen.',
    };
  }

  // 2. Fallback: Kunde suchen → Projekte des Kunden.
  try {
    const customersRaw = await getJson(
      cfg,
      `${cfg.baseUrl}/customers?search=${encodeURIComponent(name)}`,
    );
    // Eine 200-Antwort, die weder Array noch {items:[]} ist (z. B. ein Fehler-
    // Objekt), ist eine technische Panne — NICHT „kein Kunde gefunden". Werfen →
    // wird unten zu `fehler`, sonst würde eine kaputte API-Antwort fälschlich als
    // sauberes kein_projekt gemeldet. (Heute bare Array; {items} toleriert für den
    // Fall, dass autarc den Envelope angleicht.)
    const customers = asList(customersRaw, 'GET /customers') as AutarcCustomer[];
    if (customers.length === 0) {
      return {
        status: 'kein_projekt',
        projectId: null,
        source: null,
        meldung: `Kein autarc-Kunde zu „${name}" gefunden. Bitte das Projekt manuell verknüpfen.`,
      };
    }

    // Mehrere gleichnamige Kunden → NICHT blind den ersten nehmen (Gefahr: falscher
    // Kunde → falsches Projekt → falsche „Freigabe"). Per addressHint eindeutig
    // auflösen; sonst ehrlich kein_projekt melden.
    let customer: AutarcCustomer;
    if (customers.length === 1) {
      customer = customers[0];
    } else {
      const eindeutig = pickUniqueByAddress(customers, input.addressHint);
      if (!eindeutig) {
        return {
          status: 'kein_projekt',
          projectId: null,
          source: null,
          meldung: `Mehrere autarc-Kunden zu „${name}" gefunden – eine eindeutige Zuordnung ${input.addressHint ? 'per Adresse ' : ''}war nicht möglich. Bitte das Projekt in autarc manuell verknüpfen.`,
        };
      }
      customer = eindeutig;
    }
    const customerId = usableId(customer.id);
    if (!customerId) {
      return {
        status: 'kein_projekt',
        projectId: null,
        source: null,
        meldung: `Der autarc-Kunde zu „${name}" wurde ohne gültige ID geliefert. Bitte das Projekt in autarc manuell verknüpfen.`,
      };
    }
    const projectsRaw = await getJson(
      cfg,
      `${cfg.baseUrl}/projects?customerId=${encodeURIComponent(customerId)}`,
    );
    // Wie oben: falsch geformte 200-Antwort ist eine Panne, NICHT „kein Projekt".
    // Die echte API liefert hier `{ items: [...] }` (kein bare Array) → asList
    // packt es aus; ein Fehler-Objekt ohne items-Array wirft weiter → fehler.
    const projects = asList(projectsRaw, 'GET /projects?customerId') as AutarcProjectStub[];
    if (projects.length === 0) {
      return {
        status: 'kein_projekt',
        projectId: null,
        source: null,
        meldung: `Kunde „${name}" hat kein autarc-Projekt. Bitte das Projekt manuell anlegen/verknüpfen.`,
      };
    }

    // Mehrere Projekte des Kunden → ebenfalls nicht blind picken: per addressHint
    // eindeutig auflösen, sonst kein_projekt (lieber manuell verknüpfen als das
    // falsche Projekt „freigeben"). autarc liefert pro Projekt eine Adresse.
    let picked: AutarcProjectStub;
    if (projects.length === 1) {
      picked = projects[0];
    } else {
      const eindeutig = pickUniqueByAddress(projects, input.addressHint);
      if (!eindeutig) {
        return {
          status: 'kein_projekt',
          projectId: null,
          source: null,
          meldung: `Kunde „${name}" hat mehrere autarc-Projekte – eine eindeutige Zuordnung ${input.addressHint ? 'per Adresse ' : ''}war nicht möglich. Bitte das passende Projekt in autarc manuell verknüpfen.`,
        };
      }
      picked = eindeutig;
    }
    // ID typsicher prüfen: ein Eintrag mit fehlender/objekt-/null-ID ist NICHT
    // verknüpfbar (sonst ginge `[object Object]` als „matched" durch → Phantom-PATCH).
    const pickedId = usableId(picked.id);
    if (!pickedId) {
      return {
        status: 'kein_projekt',
        projectId: null,
        source: null,
        meldung: `Für Kunde „${name}" wurde ein Projekt-Eintrag ohne gültige ID geliefert. Bitte das Projekt in autarc manuell verknüpfen.`,
      };
    }
    return { status: 'matched', projectId: pickedId, source: 'fallback' };
  } catch (e) {
    return {
      status: 'fehler',
      projectId: null,
      source: null,
      meldung: `autarc-Suche fehlgeschlagen: ${(e as Error).message}. Bitte erneut versuchen.`,
    };
  }
}
