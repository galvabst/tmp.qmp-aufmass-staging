
-- 1. Add auch_fuer_trainer column
ALTER TABLE thermocheck.contractor_akademie_lektionen
ADD COLUMN IF NOT EXISTS auch_fuer_trainer BOOLEAN NOT NULL DEFAULT false;

-- 2. Update the admin_upsert_akademie_lektion RPC to handle the new field
CREATE OR REPLACE FUNCTION public.admin_upsert_akademie_lektion(p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_is_update boolean;
BEGIN
  -- Admin check
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nicht autorisiert');
  END IF;

  v_is_update := (p_data->>'id') IS NOT NULL;

  IF v_is_update THEN
    v_id := (p_data->>'id')::uuid;
    UPDATE thermocheck.contractor_akademie_lektionen SET
      code = COALESCE(p_data->>'code', code),
      titel = COALESCE(p_data->>'titel', titel),
      beschreibung = CASE WHEN p_data ? 'beschreibung' THEN p_data->>'beschreibung' ELSE beschreibung END,
      reihenfolge = COALESCE((p_data->>'reihenfolge')::int, reihenfolge),
      video_url = CASE WHEN p_data ? 'video_url' THEN p_data->>'video_url' ELSE video_url END,
      video_dauer_minuten = CASE WHEN p_data ? 'video_dauer_minuten' THEN (p_data->>'video_dauer_minuten')::int ELSE video_dauer_minuten END,
      text_inhalt = CASE WHEN p_data ? 'text_inhalt' THEN p_data->>'text_inhalt' ELSE text_inhalt END,
      text_zusammenfassung = CASE WHEN p_data ? 'text_zusammenfassung' THEN p_data->>'text_zusammenfassung' ELSE text_zusammenfassung END,
      ist_aktiv = COALESCE((p_data->>'ist_aktiv')::boolean, ist_aktiv),
      nur_fuer_neue = COALESCE((p_data->>'nur_fuer_neue')::boolean, nur_fuer_neue),
      auch_fuer_trainer = COALESCE((p_data->>'auch_fuer_trainer')::boolean, auch_fuer_trainer),
      content_version = content_version + 1,
      updated_at = now()
    WHERE id = v_id;
  ELSE
    INSERT INTO thermocheck.contractor_akademie_lektionen (
      modul_id, code, titel, beschreibung, reihenfolge,
      video_url, video_dauer_minuten, text_inhalt, text_zusammenfassung,
      ist_aktiv, nur_fuer_neue, auch_fuer_trainer
    ) VALUES (
      (p_data->>'modul_id')::uuid,
      p_data->>'code',
      p_data->>'titel',
      p_data->>'beschreibung',
      COALESCE((p_data->>'reihenfolge')::int, 0),
      p_data->>'video_url',
      (p_data->>'video_dauer_minuten')::int,
      p_data->>'text_inhalt',
      p_data->>'text_zusammenfassung',
      COALESCE((p_data->>'ist_aktiv')::boolean, true),
      COALESCE((p_data->>'nur_fuer_neue')::boolean, false),
      COALESCE((p_data->>'auch_fuer_trainer')::boolean, false)
    )
    RETURNING id INTO v_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;
