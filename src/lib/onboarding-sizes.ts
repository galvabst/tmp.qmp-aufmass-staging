// Größen-Optionen für Onboarding-Bestellungen

export const KLEIDUNGSGROESSEN = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] as const;
export type Kleidungsgroesse = typeof KLEIDUNGSGROESSEN[number];

export const SCHUHGROESSEN = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47'] as const;
export type Schuhgroesse = typeof SCHUHGROESSEN[number];

// Produkt-IDs die Größenauswahl benötigen
export const PRODUKTE_MIT_KLEIDUNGSGROESSE = ['tshirt', 'poloshirt', 'pullover'] as const;
export const PRODUKTE_MIT_SCHUHGROESSE = ['schlappen'] as const;

// Mapping von Produkt-ID zu Größen-Spalte in contractor_onboarding
export const GROESSEN_SPALTEN_MAP: Record<string, string> = {
  tshirt: 'tshirt_groesse',
  poloshirt: 'poloshirt_groesse',
  pullover: 'pullover_groesse',
  schlappen: 'schuh_groesse',
};

// Helper: Braucht dieses Produkt eine Größenauswahl?
export function brauchtGroessenauswahl(produktId: string): 'kleidung' | 'schuhe' | null {
  if (PRODUKTE_MIT_KLEIDUNGSGROESSE.includes(produktId as typeof PRODUKTE_MIT_KLEIDUNGSGROESSE[number])) {
    return 'kleidung';
  }
  if (PRODUKTE_MIT_SCHUHGROESSE.includes(produktId as typeof PRODUKTE_MIT_SCHUHGROESSE[number])) {
    return 'schuhe';
  }
  return null;
}
