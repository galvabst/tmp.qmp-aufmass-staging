
-- RPC: admin_upsert_akademie_quiz
CREATE OR REPLACE FUNCTION public.admin_upsert_akademie_quiz(p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_is_update boolean;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nicht autorisiert');
  END IF;

  v_is_update := (p_data->>'id') IS NOT NULL;

  IF v_is_update THEN
    v_id := (p_data->>'id')::uuid;
    UPDATE thermocheck.contractor_akademie_quiz SET
      modul_id = COALESCE((p_data->>'modul_id')::uuid, modul_id),
      frage = COALESCE(p_data->>'frage', frage),
      antworten = CASE WHEN p_data ? 'antworten' THEN (p_data->'antworten') ELSE antworten END,
      reihenfolge = COALESCE((p_data->>'reihenfolge')::int, reihenfolge),
      ist_aktiv = COALESCE((p_data->>'ist_aktiv')::boolean, ist_aktiv),
      updated_at = now()
    WHERE id = v_id;
  ELSE
    INSERT INTO thermocheck.contractor_akademie_quiz (
      modul_id, frage, antworten, reihenfolge, ist_aktiv
    ) VALUES (
      (p_data->>'modul_id')::uuid,
      p_data->>'frage',
      (p_data->'antworten'),
      COALESCE((p_data->>'reihenfolge')::int, 0),
      COALESCE((p_data->>'ist_aktiv')::boolean, true)
    )
    RETURNING id INTO v_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;

-- RPC: admin_delete_akademie_quiz
CREATE OR REPLACE FUNCTION public.admin_delete_akademie_quiz(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nicht autorisiert');
  END IF;

  DELETE FROM thermocheck.contractor_akademie_quiz WHERE id = p_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
