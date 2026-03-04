-- Fix: thermocheck.is_admin() → public.is_admin()
CREATE OR REPLACE FUNCTION thermocheck.admin_upsert_akademie_lektion(p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck
AS $$
DECLARE
  v_id uuid;
  v_is_update boolean := false;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Keine Admin-Berechtigung');
  END IF;

  v_id := (p_data ->> 'id')::uuid;

  IF v_id IS NOT NULL AND EXISTS (SELECT 1 FROM thermocheck.contractor_akademie_lektionen WHERE id = v_id) THEN
    v_is_update := true;
    UPDATE thermocheck.contractor_akademie_lektionen SET
      code              = COALESCE(p_data ->> 'code', code),
      titel             = COALESCE(p_data ->> 'titel', titel),
      beschreibung      = COALESCE(p_data ->> 'beschreibung', beschreibung),
      reihenfolge       = COALESCE((p_data ->> 'reihenfolge')::int, reihenfolge),
      video_url         = COALESCE(p_data ->> 'video_url', video_url),
      video_dauer_minuten = COALESCE((p_data ->> 'video_dauer_minuten')::int, video_dauer_minuten),
      text_inhalt       = COALESCE(p_data ->> 'text_inhalt', text_inhalt),
      text_zusammenfassung = COALESCE(p_data ->> 'text_zusammenfassung', text_zusammenfassung),
      ist_aktiv         = COALESCE((p_data ->> 'ist_aktiv')::boolean, ist_aktiv),
      nur_fuer_neue     = COALESCE((p_data ->> 'nur_fuer_neue')::boolean, nur_fuer_neue),
      content_version   = content_version + 1,
      updated_at        = now()
    WHERE id = v_id;
  ELSE
    v_id := COALESCE(v_id, gen_random_uuid());
    INSERT INTO thermocheck.contractor_akademie_lektionen (
      id, modul_id, code, titel, beschreibung, reihenfolge,
      video_url, video_dauer_minuten, text_inhalt, text_zusammenfassung,
      ist_aktiv, nur_fuer_neue
    ) VALUES (
      v_id,
      (p_data ->> 'modul_id')::uuid,
      p_data ->> 'code',
      p_data ->> 'titel',
      p_data ->> 'beschreibung',
      COALESCE((p_data ->> 'reihenfolge')::int, 0),
      p_data ->> 'video_url',
      (p_data ->> 'video_dauer_minuten')::int,
      p_data ->> 'text_inhalt',
      p_data ->> 'text_zusammenfassung',
      COALESCE((p_data ->> 'ist_aktiv')::boolean, true),
      COALESCE((p_data ->> 'nur_fuer_neue')::boolean, false)
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;