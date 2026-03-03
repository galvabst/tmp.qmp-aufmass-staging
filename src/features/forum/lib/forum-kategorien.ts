export type ForumKategorie = 'Aufmaß' | 'Technik' | 'Montage' | 'App & Tools' | 'Sonstiges';

export const FORUM_KATEGORIEN: { label: ForumKategorie; emoji: string; color: string }[] = [
  { label: 'Aufmaß', emoji: '📐', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { label: 'Technik', emoji: '🔧', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { label: 'Montage', emoji: '🏗️', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { label: 'App & Tools', emoji: '📱', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  { label: 'Sonstiges', emoji: '💬', color: 'bg-gray-100 text-gray-600 border-gray-200' },
];

export function getKategorieConfig(kategorie?: string | null) {
  return FORUM_KATEGORIEN.find(k => k.label === kategorie) || FORUM_KATEGORIEN[4]; // fallback Sonstiges
}
