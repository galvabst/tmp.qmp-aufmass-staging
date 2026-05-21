
ALTER TABLE thermocheck.thermocheck_vot_formulare
  ADD COLUMN IF NOT EXISTS aufstellort_ai_pruefung_id uuid REFERENCES public.sales_zaehlerschrank_pruefungen(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS aufstellort_ai_empfehlung text,
  ADD COLUMN IF NOT EXISTS aufstellort_ai_zusammenfassung text;
