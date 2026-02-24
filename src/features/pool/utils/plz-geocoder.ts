export interface PlzCoordinate {
  plz: string;
  lat: number;
  lng: number;
  city: string;
}

const CACHE_PREFIX = "plz-geo-";

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

/**
 * Primary: zippopotam.us (no rate limit, CORS-enabled)
 */
async function fetchFromZippopotam(plz: string): Promise<PlzCoordinate | null> {
  try {
    const res = await fetch(`https://api.zippopotam.us/de/${encodeURIComponent(plz)}`);
    if (!res.ok) return null;

    const data = await res.json();
    const place = data?.places?.[0];
    if (!place) return null;

    return {
      plz,
      lat: parseFloat(place.latitude),
      lng: parseFloat(place.longitude),
      city: place["place name"] || "",
    };
  } catch {
    return null;
  }
}

/**
 * Fallback: Nominatim search by city name (single call, only used for failed PLZs)
 */
async function fetchFromNominatimByCity(plz: string, city: string): Promise<PlzCoordinate | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&country=de&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "GalvanekTechApp/1.0" },
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.length === 0) return null;

    return {
      plz,
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      city: data[0].display_name?.split(",")[0]?.trim() || city,
    };
  } catch {
    return null;
  }
}

/**
 * Geocode a single PLZ. Checks cache, then zippopotam, then optional city fallback.
 */
export async function geocodePlz(plz: string, city?: string): Promise<PlzCoordinate | null> {
  if (!plz || plz.trim().length < 4) return null;

  const cached = getCached(plz);
  if (cached) return cached;

  // Primary: zippopotam.us
  let result = await fetchFromZippopotam(plz);

  // Fallback: Nominatim by city name
  if (!result && city && city.trim().length > 0) {
    console.info(`[plz-geocoder] PLZ ${plz} not found, trying city fallback: "${city}"`);
    result = await fetchFromNominatimByCity(plz, city);
  }

  if (result) {
    setCache(plz, result);
    return result;
  }

  console.warn(`[plz-geocoder] No result for PLZ ${plz}${city ? ` (city: ${city})` : ""}`);
  return null;
}

/**
 * Batch-geocode a list of PLZ strings – parallel, with optional city fallback map.
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
    const cached = getCached(plz);
    if (cached) {
      result.set(plz, cached);
    } else {
      uncached.push(plz);
    }
  }

  // Parallel fetch for all uncached PLZs
  if (uncached.length > 0) {
    const promises = uncached.map((plz) => {
      const city = cityMap?.get(plz);
      return geocodePlz(plz, city).then((coord) => ({ plz, coord }));
    });

    const settled = await Promise.allSettled(promises);
    for (const entry of settled) {
      if (entry.status === "fulfilled" && entry.value.coord) {
        result.set(entry.value.plz, entry.value.coord);
      }
    }
  }

  return result;
}
