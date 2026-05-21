CREATE OR REPLACE FUNCTION thermocheck.admin_set_onboarding_step(p_profile_id uuid, p_target_step text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'thermocheck', 'public'
AS $function$
DECLARE
  v_all_steps TEXT[] := ARRAY['profil','dokumente','bestellungen','equipment','akademie','coaching','nachweise'];
  v_completed TEXT[];
  v_idx INT;
BEGIN
  IF NOT thermocheck.is_innendienst() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unzureichende Berechtigung');
  END IF;

  IF p_profile_id IS NULL OR p_target_step IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'profile_id und target_step sind Pflicht');
  END IF;

  IF p_target_step <> 'einsatzbereit' AND NOT (p_target_step = ANY(v_all_steps)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ungültiger Step: ' || p_target_step);
  END IF;

  IF p_target_step = 'einsatzbereit' THEN
    v_completed := v_all_steps;
    UPDATE thermocheck.contractor_onboarding
    SET current_step = 'nachweise',
        completed_steps = v_completed,
        onboarding_status = 'ready',
        aktualisiert_am = now()
    WHERE profile_id = p_profile_id;
  ELSE
    v_idx := array_position(v_all_steps, p_target_step);
    IF v_idx IS NULL OR v_idx = 1 THEN
      v_completed := ARRAY[]::TEXT[];
    ELSE
      v_completed := v_all_steps[1:v_idx-1];
    END IF;

    UPDATE thermocheck.contractor_onboarding
    SET current_step = p_target_step,
        completed_steps = v_completed,
        onboarding_status = CASE
          WHEN onboarding_status = 'ready' THEN 'in_progress'::thermocheck.contractor_onboarding_status_enum
          ELSE onboarding_status
        END,
        aktualisiert_am = now()
    WHERE profile_id = p_profile_id;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Onboarding nicht gefunden');
  END IF;

  RETURN jsonb_build_object('success', true, 'current_step', p_target_step, 'completed_steps', to_jsonb(v_completed));
END;
$function$;