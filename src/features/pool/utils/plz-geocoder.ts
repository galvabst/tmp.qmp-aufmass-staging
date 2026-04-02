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
    // Reject old cached entries with invalid coordinates
    if (!isValidDeCoord(parsed.lat, parsed.lng)) {
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

/**
 * Primary: Nominatim (OpenStreetMap) – reliable for German PLZs
 */
async function fetchFromNominatim(plz: string): Promise<PlzCoordinate | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(plz)}&country=de&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "GalvanekTechApp/1.0" },
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.length === 0) return null;

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);

    if (!isValidDeCoord(lat, lng)) {
      console.warn(`[plz-geocoder] Nominatim returned out-of-range coords for PLZ ${plz}: ${lat}, ${lng}`);
      return null;
    }

    return {
      plz,
      lat,
      lng,
      city: data[0].display_name?.split(",")[0]?.trim() || "",
    };
  } catch {
    return null;
  }
}

/**
 * Geocode a single PLZ. Checks cache, then Nominatim.
 */
export async function geocodePlz(plz: string, _city?: string): Promise<PlzCoordinate | null> {
  if (!plz || plz.trim().length < 4) return null;

  const normalized = normalizePlz(plz);

  const cached = getCached(normalized);
  if (cached) return cached;

  const result = await fetchFromNominatim(normalized);

  if (result) {
    // Store with normalized PLZ
    const entry = { ...result, plz: normalized };
    setCache(normalized, entry);
    return entry;
  }

  console.warn(`[plz-geocoder] No result for PLZ ${normalized}`);
  return null;
}

/**
 * Batch-geocode a list of PLZ strings – parallel in chunks for speed.
 */
export async function geocodePlzBatch(
  plzList: string[],
  cityMap?: Map<string, string>
): Promise<Map<string, PlzCoordinate>> {
  const unique = [...new Set(plzList.filter((p) => p && p.trim().length >= 4))];
  const result = new Map<string, PlzCoordinate>();

  // Separate cached vs uncached
  const uncached: string[] = [];
  for (const plz of unique) {
    const normalized = normalizePlz(plz);
    const cached = getCached(normalized);
    if (cached) {
      result.set(plz, cached);
      if (plz !== normalized) result.set(normalized, cached);
    } else {
      uncached.push(plz);
    }
  }

  // Parallel fetch in chunks of 5 with 300ms between chunks
  const CHUNK_SIZE = 5;
  for (let i = 0; i < uncached.length; i += CHUNK_SIZE) {
    const chunk = uncached.slice(i, i + CHUNK_SIZE);
    const promises = chunk.map(async (plz) => {
      const city = cityMap?.get(plz);
      const coord = await geocodePlz(plz, city);
      if (coord) {
        result.set(plz, coord);
        const normalized = normalizePlz(plz);
        if (plz !== normalized) result.set(normalized, coord);
      }
    });
    await Promise.all(promises);
    if (i + CHUNK_SIZE < uncached.length) {
      await delay(300);
    }
  }

  return result;
}
