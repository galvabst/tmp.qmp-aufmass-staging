

# Plan: PV-Aufmass-Formular als bedingtes Zusatzmodul

## Phase 1: DB + Schema + Kategorien ✅ DONE

- [x] DB-Migration: `thermocheck.thermocheck_pv_formulare` mit ~30 Feldern
- [x] 4 ENUMs: `pv_denkmalschutz_enum`, `pv_ziegel_lose_enum`, `pv_ziegel_neigung_enum`, `pv_hauszufuehrung_enum`
- [x] Trigger-Funktion `thermocheck.update_updated_at_column()`
- [x] RLS Policies (SELECT/INSERT/UPDATE für authenticated)
- [x] 7 neue Bild-Kategorien in `bild-kategorien.ts`
- [x] Zod-Schema `pv-aufmass-schema.ts`
- [x] CRUD-Hook `usePvFormular.ts`

## Phase 2: UI Sections + Stepper-Integration (NÄCHSTER SCHRITT)

- [ ] 8 neue Section-Komponenten unter `src/features/aufmass/ui/sections/pv/`
  - PvAllgemeinSection (Solarthermie, Denkmalschutz, Lager)
  - PvDachSection (Form, Neigung, Ausrichtung, Sparren, Trapez, Attika, Dämmung)
  - PvDachziegelSection (Ziegel, Eindeckung, Neigung)
  - PvGeruestSection (Hindernisse, Fassade, öffentl. Fläche)
  - PvDcKabelSection (Fassade, Dachhaut, >10m, Gebäude-Entfernung)
  - PvUnterkonstruktionSection (Verschattung, Belüftung)
  - PvBlitzschutzSection (vorhanden, geprüft, abbaubar, Hauszuführung)
  - PvAbschlussSection (Kommentar, Bestätigung, Unterschrift)
- [ ] Dynamischer Stepper: 15 → 23 Steps wenn `hat_pv_anlage === false`
- [ ] PV-Formular auto-create wenn User "Nein" wählt bei PV-Frage

## Phase 3: Validierung + Edge Cases

- [ ] End-to-End Test aller PV-Steps
- [ ] Validierung bei Submit (Pflichtfelder)
- [ ] Edge Case: User wechselt von Nein zu Ja → PV-Steps verschwinden
