/**
 * Storage-Pfad-Generierung für Thermocheck VOT-Formular Bilder.
 * Bucket: galvanikbau (privat)
 * Struktur: operations/leads/{sanitized_lead_name}_{lead_id}/thermocheck-auftrag_{auftrag_id}/{kategorie}_{nr}.{ext}
 */

const UMLAUT_MAP: Record<string, string> = {
  ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss',
  Ä: 'ae', Ö: 'oe', Ü: 'ue',
};

/** Sanitize a lead name for use in storage paths: lowercase, umlauts replaced, only [a-z0-9_-] */
export function sanitizeLeadName(name: string): string {
  let result = name.toLowerCase();
  for (const [char, replacement] of Object.entries(UMLAUT_MAP)) {
    result = result.split(char).join(replacement);
  }
  // Replace spaces/dots with underscores, strip everything else
  result = result.replace(/[\s.]+/g, '_').replace(/[^a-z0-9_-]/g, '');
  // Collapse multiple underscores/hyphens
  result = result.replace(/[_-]{2,}/g, '_');
  // Trim leading/trailing underscores
  result = result.replace(/^[_-]+|[_-]+$/g, '');
  return result || 'unbekannt';
}

/** Build the base storage folder for a thermocheck auftrag */
export function buildAuftragStoragePath(
  leadName: string,
  leadId: string,
  auftragId: string,
): string {
  const safeName = sanitizeLeadName(leadName);
  return `operations/leads/${safeName}_${leadId}/thermocheck-auftrag_${auftragId}`;
}

/** Build the full storage path for a single image */
export function buildImageStoragePath(
  leadName: string,
  leadId: string,
  auftragId: string,
  kategorie: string,
  index: number,
  extension = 'jpg',
): string {
  const base = buildAuftragStoragePath(leadName, leadId, auftragId);
  const paddedIndex = String(index).padStart(3, '0');
  return `${base}/${kategorie}_${paddedIndex}.${extension}`;
}

export const STORAGE_BUCKET = 'galvanikbau';
