ALTER TABLE public.sales_zaehlerschrank_pruefungen
  ADD COLUMN IF NOT EXISTS variant text;

CREATE INDEX IF NOT EXISTS idx_sales_zs_pruef_lead_typ_variant
  ON public.sales_zaehlerschrank_pruefungen (lead_id, pruefung_typ, variant, created_at DESC);

COMMENT ON COLUMN public.sales_zaehlerschrank_pruefungen.variant IS
  'Optional sub-variant tag, e.g. for aufstellort: ''haupt'' | ''alt_1'' | ''alt_2''. NULL = legacy/single-variant.';