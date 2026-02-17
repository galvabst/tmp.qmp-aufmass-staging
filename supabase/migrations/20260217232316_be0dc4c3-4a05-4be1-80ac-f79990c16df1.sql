CREATE OR REPLACE FUNCTION public.book_coaching_ride(p_auftrag_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN thermocheck.book_coaching_ride(p_auftrag_id);
END;
$$;