-- Phase 1: Storage Bucket bereinigen
DELETE FROM storage.objects WHERE bucket_id = 'akademie-videos';
DELETE FROM storage.buckets WHERE id = 'akademie-videos';

-- Phase 3: Legacy Datenbank-Tabellen löschen

-- 1. Legacy Akademie-Tabellen (public schema)
DROP TABLE IF EXISTS public.onboarding_akademie_unterpunkte CASCADE;
DROP TABLE IF EXISTS public.onboarding_akademie_hauptmodule CASCADE;

-- 2. Legacy Onboarding-Tabelle (thermocheck schema)
DROP TABLE IF EXISTS thermocheck.techniker_onboarding CASCADE;

-- 3. Bereits markierte Tabelle
DROP TABLE IF EXISTS thermocheck.ideen_to_be_deleted CASCADE;

-- 4. Leere/unbenutzte Tabellen aufräumen
DROP TABLE IF EXISTS thermocheck.academy_module CASCADE;
DROP TABLE IF EXISTS thermocheck.contractor_academy_progress CASCADE;
DROP TABLE IF EXISTS thermocheck.contractor_coaching CASCADE;
DROP TABLE IF EXISTS thermocheck.contractor_compliance CASCADE;

-- 5. Legacy RPC-Funktionen löschen (ohne Schema-Prefix für thermocheck)
DROP FUNCTION IF EXISTS public.thermocheck_create_techniker_onboarding;
DROP FUNCTION IF EXISTS public.thermocheck_get_techniker_onboarding;
DROP FUNCTION IF EXISTS public.thermocheck_update_techniker_onboarding;
DROP FUNCTION IF EXISTS public.thermocheck_delete_techniker_onboarding;