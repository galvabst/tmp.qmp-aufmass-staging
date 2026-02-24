
-- ============================================================
-- Thermocheck VOT-Formular: ENUMs, Spalten, Tabellen, Storage, RLS
-- ============================================================

-- 1. ENUMs erstellen
CREATE TYPE thermocheck.heizungsart_enum AS ENUM ('gas', 'oel', 'sonstige');
CREATE TYPE thermocheck.heizkoerper_typ_enum AS ENUM ('heizkoerper', 'fussbodenheizung', 'beides');
CREATE TYPE thermocheck.vot_formular_status_enum AS ENUM ('entwurf', 'abgeschlossen');
CREATE TYPE thermocheck.vot_bild_kategorie_enum AS ENUM (
  'hausschuhe', 'treppenabgang', 'eingang_heizungsraum',
  'heizungsraum', 'heizungsraum_extra', 'heizanlage', 'oeltank', 'heizungsanlage',
  'heizkreisverteiler', 'heizkoerper', 'zaehlerschrank', 'sicherungen', 'zaehler',
  'erdung', 'hausanschlusskasten', 'aufstellort_option_1', 'aufstellort_umgebung_1',
  'aufstellort_alt_1', 'aufstellort_umgebung_alt_1', 'aufstellort_alt_2',
  'aufstellort_umgebung_alt_2', 'unterschrift_aufstellort', 'unterschrift_techniker',
  'unterschrift_kunde_final', 'pv_anlage', 'unbegehbarer_raum'
);

-- 2. ALTER thermocheck_vot_formulare: Formularfelder hinzufuegen
ALTER TABLE thermocheck.thermocheck_vot_formulare
  ADD COLUMN status thermocheck.vot_formular_status_enum NOT NULL DEFAULT 'entwurf',
  ADD COLUMN techniker_name text,
  ADD COLUMN techniker_telefon text,
  ADD COLUMN thermocheck_datum date,
  ADD COLUMN heizung_inbetriebnahme_datum date,
  ADD COLUMN heizung_funktionstuechtig boolean,
  ADD COLUMN bauantrag_datum date,
  ADD COLUMN fossile_brennstoffe_nach_austausch boolean,
  ADD COLUMN mehr_bilder_heizungsraum boolean,
  ADD COLUMN heizungsart thermocheck.heizungsart_enum,
  ADD COLUMN heizungsart_sonstige text,
  ADD COLUMN oeltank_liter_gesamt integer,
  ADD COLUMN oeltank_anzahl integer,
  ADD COLUMN oeltank_liter_aktuell integer,
  ADD COLUMN oeltank_transport_beschreibung text,
  ADD COLUMN heizkoerper_typ thermocheck.heizkoerper_typ_enum,
  ADD COLUMN hat_erdung boolean,
  ADD COLUMN alternative_1_vorhanden boolean,
  ADD COLUMN alternative_2_vorhanden boolean,
  ADD COLUMN kunde_aufstellort_bestaetigt boolean,
  ADD COLUMN kunde_bestaetigung_vorname text,
  ADD COLUMN kunde_bestaetigung_nachname text,
  ADD COLUMN anzahl_duschen integer,
  ADD COLUMN hat_regendusche boolean,
  ADD COLUMN anzahl_badewannen integer,
  ADD COLUMN check_raeume_gescannt boolean,
  ADD COLUMN check_anzahl_raeume boolean,
  ADD COLUMN check_aufstellort_besprochen boolean,
  ADD COLUMN check_alle_bilder boolean,
  ADD COLUMN check_heizkoerper_aufgenommen boolean,
  ADD COLUMN bemerkungen text,
  ADD COLUMN anzahl_unbegehbare_raeume integer NOT NULL DEFAULT 0,
  ADD COLUMN hat_pv_anlage boolean,
  ADD COLUMN agb_akzeptiert boolean;

-- 3. Neue Tabelle: thermocheck_vot_bilder
CREATE TABLE thermocheck.thermocheck_vot_bilder (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vot_formular_id uuid NOT NULL REFERENCES thermocheck.thermocheck_vot_formulare(id) ON DELETE CASCADE,
  kategorie thermocheck.vot_bild_kategorie_enum NOT NULL,
  storage_path text NOT NULL,
  dateiname text NOT NULL,
  beschreibung text,
  reihenfolge integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE thermocheck.thermocheck_vot_bilder ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_vot_bilder" ON thermocheck.thermocheck_vot_bilder
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_insert_vot_bilder" ON thermocheck.thermocheck_vot_bilder
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth_update_vot_bilder" ON thermocheck.thermocheck_vot_bilder
  FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth_delete_vot_bilder" ON thermocheck.thermocheck_vot_bilder
  FOR DELETE USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM thermocheck.thermocheck_vot_formulare f
      WHERE f.id = vot_formular_id AND f.eingereicht_von = auth.uid()
    )
  );

-- Index fuer schnelles Laden aller Bilder eines Formulars
CREATE INDEX idx_vot_bilder_formular ON thermocheck.thermocheck_vot_bilder(vot_formular_id);

-- 4. Neue Tabelle: thermocheck_vot_unbegehbare_raeume
CREATE TABLE thermocheck.thermocheck_vot_unbegehbare_raeume (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vot_formular_id uuid NOT NULL REFERENCES thermocheck.thermocheck_vot_formulare(id) ON DELETE CASCADE,
  raum_nummer integer NOT NULL,
  raum_name text NOT NULL,
  quadratmeter numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(vot_formular_id, raum_nummer)
);

ALTER TABLE thermocheck.thermocheck_vot_unbegehbare_raeume ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_vot_raeume" ON thermocheck.thermocheck_vot_unbegehbare_raeume
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_insert_vot_raeume" ON thermocheck.thermocheck_vot_unbegehbare_raeume
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth_update_vot_raeume" ON thermocheck.thermocheck_vot_unbegehbare_raeume
  FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth_delete_vot_raeume" ON thermocheck.thermocheck_vot_unbegehbare_raeume
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Index
CREATE INDEX idx_vot_raeume_formular ON thermocheck.thermocheck_vot_unbegehbare_raeume(vot_formular_id);

-- 5. Storage Bucket: galvanikbau (privat)
INSERT INTO storage.buckets (id, name, public)
VALUES ('galvanikbau', 'galvanikbau', false);

-- Storage RLS: Authentifizierte User koennen lesen
CREATE POLICY "galvanikbau_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'galvanikbau' AND auth.uid() IS NOT NULL);

-- Storage RLS: Authentifizierte User koennen hochladen
CREATE POLICY "galvanikbau_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'galvanikbau' AND auth.uid() IS NOT NULL);

-- Storage RLS: Authentifizierte User koennen eigene Dateien aktualisieren
CREATE POLICY "galvanikbau_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'galvanikbau' AND auth.uid() IS NOT NULL)
  WITH CHECK (bucket_id = 'galvanikbau' AND auth.uid() IS NOT NULL);

-- Storage RLS: Eigene Dateien oder Admin loeschen
CREATE POLICY "galvanikbau_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'galvanikbau' AND (public.is_admin() OR auth.uid() = owner));
