
-- =============================================
-- Phase 1: Akademie Admin CRUD - RLS + RPCs
-- =============================================

-- 1. Admin SELECT policies (to see inactive items too)
CREATE POLICY "Admin can read all modules"
  ON thermocheck.contractor_akademie_module
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can read all lektionen"
  ON thermocheck.contractor_akademie_lektionen
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can read all quiz"
  ON thermocheck.contractor_akademie_quiz
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- 2. Admin INSERT policies
CREATE POLICY "Admin can insert modules"
  ON thermocheck.contractor_akademie_module
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can insert lektionen"
  ON thermocheck.contractor_akademie_lektionen
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can insert quiz"
  ON thermocheck.contractor_akademie_quiz
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- 3. Admin UPDATE policies
CREATE POLICY "Admin can update modules"
  ON thermocheck.contractor_akademie_module
  FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can update lektionen"
  ON thermocheck.contractor_akademie_lektionen
  FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can update quiz"
  ON thermocheck.contractor_akademie_quiz
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- 4. Admin DELETE policies (soft-delete preferred, but policy exists for safety)
CREATE POLICY "Admin can delete modules"
  ON thermocheck.contractor_akademie_module
  FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can delete lektionen"
  ON thermocheck.contractor_akademie_lektionen
  FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can delete quiz"
  ON thermocheck.contractor_akademie_quiz
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- =============================================
-- 5. RPCs in thermocheck schema
-- =============================================

-- 5a. Upsert Modul
CREATE OR REPLACE FUNCTION thermocheck.admin_upsert_akademie_modul(p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
DECLARE
  v_id uuid;
  v_existing boolean;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Keine Admin-Berechtigung');
  END IF;

  v_id := (p_data ->> 'id')::uuid;

  IF v_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM thermocheck.contractor_akademie_module WHERE id = v_id) INTO v_existing;
  ELSE
    v_existing := false;
    v_id := gen_random_uuid();
  END IF;

  IF v_existing THEN
    UPDATE thermocheck.contractor_akademie_module SET
      code = COALESCE(p_data ->> 'code', code),
      titel = COALESCE(p_data ->> 'titel', titel),
      beschreibung = p_data ->> 'beschreibung',
      reihenfolge = COALESCE((p_data ->> 'reihenfolge')::int, reihenfolge),
      ist_aktiv = COALESCE((p_data ->> 'ist_aktiv')::boolean, ist_aktiv),
      updated_at = now()
    WHERE id = v_id;
  ELSE
    INSERT INTO thermocheck.contractor_akademie_module (id, code, titel, beschreibung, reihenfolge, ist_aktiv)
    VALUES (
      v_id,
      p_data ->> 'code',
      p_data ->> 'titel',
      p_data ->> 'beschreibung',
      COALESCE((p_data ->> 'reihenfolge')::int, 0),
      COALESCE((p_data ->> 'ist_aktiv')::boolean, true)
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;

-- 5b. Upsert Lektion
CREATE OR REPLACE FUNCTION thermocheck.admin_upsert_akademie_lektion(p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
DECLARE
  v_id uuid;
  v_existing boolean;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Keine Admin-Berechtigung');
  END IF;

  v_id := (p_data ->> 'id')::uuid;

  IF v_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM thermocheck.contractor_akademie_lektionen WHERE id = v_id) INTO v_existing;
  ELSE
    v_existing := false;
    v_id := gen_random_uuid();
  END IF;

  IF v_existing THEN
    UPDATE thermocheck.contractor_akademie_lektionen SET
      modul_id = COALESCE((p_data ->> 'modul_id')::uuid, modul_id),
      code = COALESCE(p_data ->> 'code', code),
      titel = COALESCE(p_data ->> 'titel', titel),
      beschreibung = p_data ->> 'beschreibung',
      reihenfolge = COALESCE((p_data ->> 'reihenfolge')::int, reihenfolge),
      video_url = p_data ->> 'video_url',
      video_dauer_minuten = (p_data ->> 'video_dauer_minuten')::int,
      text_inhalt = p_data ->> 'text_inhalt',
      text_zusammenfassung = p_data ->> 'text_zusammenfassung',
      ist_aktiv = COALESCE((p_data ->> 'ist_aktiv')::boolean, ist_aktiv),
      content_version = content_version + 1,
      updated_at = now()
    WHERE id = v_id;
  ELSE
    INSERT INTO thermocheck.contractor_akademie_lektionen (id, modul_id, code, titel, beschreibung, reihenfolge, video_url, video_dauer_minuten, text_inhalt, text_zusammenfassung, ist_aktiv)
    VALUES (
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
      COALESCE((p_data ->> 'ist_aktiv')::boolean, true)
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;

-- 5c. Reorder Lektionen
CREATE OR REPLACE FUNCTION thermocheck.admin_reorder_akademie_lektionen(p_modul_id uuid, p_order jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
DECLARE
  v_item jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Keine Admin-Berechtigung');
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_order)
  LOOP
    UPDATE thermocheck.contractor_akademie_lektionen
    SET reihenfolge = (v_item ->> 'reihenfolge')::int, updated_at = now()
    WHERE id = (v_item ->> 'id')::uuid AND modul_id = p_modul_id;
  END LOOP;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- =============================================
-- 6. Public wrappers (SECURITY DEFINER)
-- =============================================

CREATE OR REPLACE FUNCTION public.admin_upsert_akademie_modul(p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN thermocheck.admin_upsert_akademie_modul(p_data);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_akademie_lektion(p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN thermocheck.admin_upsert_akademie_lektion(p_data);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reorder_akademie_lektionen(p_modul_id uuid, p_order jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN thermocheck.admin_reorder_akademie_lektionen(p_modul_id, p_order);
END;
$$;
