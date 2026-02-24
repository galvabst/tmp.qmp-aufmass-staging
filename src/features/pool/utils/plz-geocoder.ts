export interface PlzCoordinate {
  plz: string;
  lat: number;
  lng: number;
  city: string;
}

const CACHE_PREFIX = "plz-geo-";
const NOMINATIM_DELAY_MS = 1100; // >1s to respect rate limit

function getCached(plz: string): PlzCoordinate | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + plz);
    if (!raw) return null;
    return JSON.parse(raw) as PlzCoordinate;
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

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function geocodePlz(plz: string): Promise<PlzCoordinate | null> {
  if (!plz || plz.trim().length < 4) return null;

  const cached = getCached(plz);
  if (cached) return cached;

  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(plz)}&country=de&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "GalvanekTechApp/1.0" },
    });

    if (!res.ok) {
      console.warn(`[plz-geocoder] HTTP ${res.status} for PLZ ${plz}`);
      return null;
    }

    const data = await res.json();
    if (!data || data.length === 0) {
      console.warn(`[plz-geocoder] No result for PLZ ${plz}`);
      return null;
    }

    const result: PlzCoordinate = {
      plz,
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      city: data[0].display_name?.split(",")[0]?.trim() || "",
    };

    setCache(plz, result);
    return result;
  } catch (err) {
    console.warn(`[plz-geocoder] Error for PLZ ${plz}:`, err);
    return null;
  }
}

/**
 * Batch-geocode a list of PLZ strings.
 * Deduplicates, checks cache first, then sequentially queries uncached PLZ with rate-limiting.
 */
export async function geocodePlzBatch(
  plzList: string[]
): Promise<Map<string, PlzCoordinate>> {
  const unique = [...new Set(plzList.filter((p) => p && p.trim().length >= 4))];
  const result = new Map<string, PlzCoordinate>();

  // Separate cached vs uncached
  const uncached: string[] = [];
  for (const plz of unique) {
    const cached = getCached(plz);
    if (cached) {
      result.set(plz, cached);
    } else {
      uncached.push(plz);
    }
  }

  // Sequential fetch with rate limiting for uncached
  for (let i = 0; i < uncached.length; i++) {
    if (i > 0) await delay(NOMINATIM_DELAY_MS);
    const coord = await geocodePlz(uncached[i]);
    if (coord) result.set(uncached[i], coord);
  }

  return result;
}
