import { supabaseTC } from '@/integrations/supabase/thermocheck-client';

export interface PlzCoordinate {
  plz: string;
  lat: number;
  lng: number;
  city: string;
}

const CACHE_PREFIX = "plz-geo-";

/** Pad PLZ to 5 digits with leading zeros (e.g. "7549" → "07549") */
export function normalizePlz(plz: string): string {
  const trimmed = plz.trim();
  if (trimmed.length >= 5) return trimmed;
  return trimmed.padStart(5, "0");
}

/** Validate coordinates are within plausible Germany bounds */
function isValidDeCoord(lat: number, lng: number): boolean {
  return lat >= 47 && lat <= 55.1 && lng >= 5 && lng <= 16;
}

function getCached(plz: string): PlzCoordinate | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + plz);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlzCoordinate;
    if (!isValidDeCoord(parsed.lat, parsed.lng)) {
      localStorage.removeItem(CACHE_PREFIX + plz);
      return null;
    }
    if (!parsed.lat || !parsed.lng) {
      localStorage.removeItem(CACHE_PREFIX + plz);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function setCache(plz: string, coord: PlzCoordinate): void {
  try {
    localStorage.setItem(CACHE_PREFIX + plz, JSON.stringify(coord));
  } catch {
    // localStorage full – silently ignore
  }
}

/** Throttle helper – wait ms milliseconds */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeCity(city?: string): string {
  return (city ?? "").replace(/\s+/g, " ").trim();
}

// ─── L2 Cache: Supabase DB ───

async function fetchDbCache(plzList: string[]): Promise<Map<string, PlzCoordinate>> {
  const result = new Map<string, PlzCoordinate>();
  if (plzList.length === 0) return result;

  try {
    const { data } = await (supabaseTC
      .from('plz_geocode_cache' as any)
      .select('plz, lat, lng, city')
      .in('plz', plzList) as any);

    (data ?? []).forEach((row: any) => {
      if (row.lat && row.lng && isValidDeCoord(row.lat, row.lng)) {
        const coord: PlzCoordinate = {
          plz: row.plz,
          lat: row.lat,
          lng: row.lng,
          city: row.city || '',
        };
        result.set(row.plz, coord);
        // Also populate L1 localStorage cache
        setCache(row.plz, coord);
      }
    });
  } catch (err) {
    console.warn('[plz-geocoder] DB cache fetch failed:', err);
  }

  return result;
}

async function writeDbCache(entries: PlzCoordinate[]): Promise<void> {
  if (entries.length === 0) return;
  try {
    await (supabaseTC
      .from('plz_geocode_cache' as any)
      .upsert(
        entries.map(e => ({ plz: e.plz, lat: e.lat, lng: e.lng, city: e.city })),
        { onConflict: 'plz' }
      ) as any);
  } catch (err) {
    console.warn('[plz-geocoder] DB cache write failed:', err);
  }
}

// ─── Nominatim ───

async function fetchFromNominatimRequest(params: URLSearchParams): Promise<PlzCoordinate | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "de" },
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.length === 0) return null;

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);

    if (!isValidDeCoord(lat, lng)) {
      console.warn(`[plz-geocoder] Nominatim returned out-of-range coords: ${lat}, ${lng}`);
      return null;
    }

    const address = data[0].address ?? {};

    return {
      plz: address.postcode || "",
      lat,
      lng,
      city:
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        data[0].display_name?.split(",")[0]?.trim() ||
        "",
    };
  } catch {
    return null;
  }
}

async function fetchFromNominatim(plz: string): Promise<PlzCoordinate | null> {
  const params = new URLSearchParams({
    postalcode: plz,
    countrycodes: 'de',
    format: 'jsonv2',
    addressdetails: '1',
    limit: '1',
  });

  const result = await fetchFromNominatimRequest(params);
  return result ? { ...result, plz: result.plz || plz } : null;
}

async function fetchFromNominatimQuery(query: string, fallbackPlz: string): Promise<PlzCoordinate | null> {
  const params = new URLSearchParams({
    q: query,
    countrycodes: 'de',
    format: 'jsonv2',
    addressdetails: '1',
    limit: '1',
  });

  const result = await fetchFromNominatimRequest(params);
  return result ? { ...result, plz: result.plz || fallbackPlz } : null;
}

/**
 * Geocode a single PLZ. Checks cache, then Nominatim.
 */
export async function geocodePlz(plz: string, _city?: string): Promise<PlzCoordinate | null> {
  if (!plz || plz.trim().length < 4) return null;

  const normalized = normalizePlz(plz);
  const city = normalizeCity(_city);

  const cached = getCached(normalized);
  if (cached) return cached;

  const result =
    (await fetchFromNominatim(normalized)) ||
    (city ? await fetchFromNominatimQuery(`${normalized} ${city}, Deutschland`, normalized) : null) ||
    (city ? await fetchFromNominatimQuery(`${city}, Deutschland`, normalized) : null);

  if (result) {
    const entry = { ...result, plz: normalized, city: result.city || city };
    setCache(normalized, entry);
    return entry;
  }

  console.warn(`[plz-geocoder] No result for PLZ ${normalized}${city ? ` (${city})` : ''}`);
  return null;
}

/**
 * Batch-geocode a list of PLZ strings – with L1 (localStorage) + L2 (Supabase DB) cache.
 */
export async function geocodePlzBatch(
  plzList: string[],
  cityMap?: Map<string, string>
): Promise<Map<string, PlzCoordinate>> {
  const unique = [...new Set(plzList.filter((p) => p && p.trim().length >= 4))];
  const result = new Map<string, PlzCoordinate>();

  // L1: localStorage cache
  const uncachedL1: string[] = [];
  for (const plz of unique) {
    const normalized = normalizePlz(plz);
    const cached = getCached(normalized);
    if (cached) {
      result.set(plz, cached);
      if (plz !== normalized) result.set(normalized, cached);
    } else {
      uncachedL1.push(normalized);
    }
  }

  // L2: DB cache for remaining PLZs
  if (uncachedL1.length > 0) {
    const dbHits = await fetchDbCache(uncachedL1);
    const uncachedL2: string[] = [];

    for (const plz of uncachedL1) {
      const hit = dbHits.get(plz);
      if (hit) {
        result.set(plz, hit);
      } else {
        uncachedL2.push(plz);
      }
    }

    // L3: Nominatim for remaining PLZs
    const newEntries: PlzCoordinate[] = [];
    const CHUNK_SIZE = 5;
    for (let i = 0; i < uncachedL2.length; i += CHUNK_SIZE) {
      const chunk = uncachedL2.slice(i, i + CHUNK_SIZE);
      const promises = chunk.map(async (plz) => {
        const originalPlz = unique.find(p => normalizePlz(p) === plz) || plz;
        const city = cityMap?.get(originalPlz) || cityMap?.get(plz);
        const coord = await geocodePlz(plz, city);
        if (coord) {
          result.set(plz, coord);
          result.set(originalPlz, coord);
          newEntries.push(coord);
        }
      });
      await Promise.all(promises);
      if (i + CHUNK_SIZE < uncachedL2.length) {
        await delay(300);
      }
    }

    // Write new entries to DB cache (fire-and-forget)
    if (newEntries.length > 0) {
      writeDbCache(newEntries);
    }
  }

  // Map original PLZ strings to results
  for (const plz of unique) {
    const normalized = normalizePlz(plz);
    if (!result.has(plz) && result.has(normalized)) {
      result.set(plz, result.get(normalized)!);
    }
  }

  return result;
}
