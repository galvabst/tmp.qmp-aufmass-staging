
-- 1. Neuer ENUM-Typ für Coaching-Bewertung
CREATE TYPE thermocheck.coaching_bewertung_enum AS ENUM (
  'ausstehend',
  'bestanden',
  'nicht_bestanden'
);

-- 2. Neue Spalten in contractor_onboarding
ALTER TABLE thermocheck.contractor_onboarding
  ADD COLUMN coaching_bewertung thermocheck.coaching_bewertung_enum NOT NULL DEFAULT 'ausstehend',
  ADD COLUMN coaching_bewertung_am timestamptz,
  ADD COLUMN gebuchter_coaching_termin date,
  ADD COLUMN gebuchter_coach_name text;
