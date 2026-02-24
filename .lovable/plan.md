

# Thermocheck Aufmass-Formular -- Implementierungsplan

## 1. Zusammenfassung

Aufbau eines mehrseitigen Thermocheck-Formulars, das vom Techniker (Contractor) vor Ort beim Kunden ausgefuellt wird. Es erfasst Kundenstammdaten (prefilled), technische Aufmass-Daten, konditionelle Felder und kategorisierte Foto-Uploads. Die Bilder werden im Storage-Bucket `galvanikbau` unter `operations/leads/{lead_name}_{lead_id}/thermocheck-auftrag_{auftrag_id}/` gespeichert. Ein externes Projekt kann spaeter ueber service_role auf die Daten zugreifen.

---

## 2. Ist-Zustand-Analyse

### Relevante bestehende Strukturen

| Element | Status |
|---|---|
| `thermocheck.thermocheck_auftraege` | Existiert, hat `lead_id` FK zu `public.leads` |
| `thermocheck.thermocheck_vot_formulare` | Existiert, aber NUR Metadaten (id, thermocheck_auftrag_id, eingereicht_am, eingereicht_von) -- keine Formularfelder |
| `thermocheck.v_thermocheck_auftraege` | View mit gejointer Kundendaten aus `leads` (kunde_vorname, kunde_nachname, kunde_strasse, etc.) |
| `public.leads` | Enthalt Kundenstammdaten (lead_name, kunde_vorname, kunde_nachname, kunde_email, etc.) |
| `useMyAssignedOrders` Hook | Laedt zugewiesene Auftraege ueber REST API mit `Accept-Profile: thermocheck` |
| Storage Bucket `galvanikbau` | Existiert NICHT -- muss erstellt werden |
| RLS Helper `is_admin()` | Existiert in `iam` und `public` Schema |

### Entscheidung: `thermocheck_vot_formulare` erweitern vs. neue Tabelle

Die bestehende Tabelle `thermocheck_vot_formulare` hat nur Metadaten-Spalten und ist offensichtlich als Container fuer VOT-Formular-Daten gedacht. **Wir erweitern diese Tabelle um die Formularfelder**, anstatt eine neue Tabelle zu erstellen. Das vermeidet unnoetige Redundanz und nutzt die bestehende 1:1-Beziehung zu `thermocheck_auftraege`.

Fuer Bilder erstellen wir eine separate Tabelle `thermocheck.thermocheck_vot_bilder`, da ein Formular viele Bilder in verschiedenen Kategorien hat (1:N Beziehung).

---

## 3. Formularfelder-Analyse (aus dem bereitgestellten Formular)

### Abschnitt 1: Daten Aufmasstechniker
| Feld | DB-Spalte | Typ | Pflicht | Hinweis |
|---|---|---|---|---|
| Name Aufmasstechniker | `techniker_name` | text | Ja | Prefilled aus Profil |
| Telefonnummer | `techniker_telefon` | text | Ja | Prefilled aus Profil |
| Foto Galvanek-Hausschuhe | Bild-Upload | - | Ja | Kategorie: `hausschuhe` |
| Datum ThermoCheck | `thermocheck_datum` | date | Ja | |

### Abschnitt 2: Kundendaten
| Feld | DB-Spalte | Typ | Pflicht | Hinweis |
|---|---|---|---|---|
| Inbetriebnahme Datum bestehende Heizung | `heizung_inbetriebnahme_datum` | date | Ja | |
| Name des Kunden | - | - | Ja | Prefilled aus Lead (read-only) |
| Ist die bestehende Heizung funktionstuechtig? | `heizung_funktionstuechtig` | boolean | Ja | Ja/Nein |
| Datum des Bauantrags | `bauantrag_datum` | date | Ja | |
| Fossile Brennstoffe nach Austausch? | `fossile_brennstoffe_nach_austausch` | boolean | Ja | Ja/Nein |

### Abschnitt 3: Treppenabgang
| Feld | DB-Spalte | Typ | Pflicht | Hinweis |
|---|---|---|---|---|
| Bilder vom Treppenabgang | Bild-Upload | - | Ja | Kategorie: `treppenabgang`, min. 4 Fotos |

### Abschnitt 4: Eingang Heizungsraum
| Feld | DB-Spalte | Typ | Pflicht | Hinweis |
|---|---|---|---|---|
| Bilder Tuer Heizungsraum | Bild-Upload | - | Ja | Kategorie: `eingang_heizungsraum`, min. 3 Fotos |

### Abschnitt 5: Heizungsraum
| Feld | DB-Spalte | Typ | Pflicht | Hinweis |
|---|---|---|---|---|
| Bilder Heizungsraum | Bild-Upload | - | Ja | Kategorie: `heizungsraum` |
| Mehr Bilder? | `mehr_bilder_heizungsraum` | boolean | Ja | Ja/Nein -- zeigt Extra-Upload |
| Extra Bilder Heizungsraum | Bild-Upload | - | Konditional | Kategorie: `heizungsraum_extra` |

### Abschnitt 6: Heizungsart (konditional)
| Feld | DB-Spalte | Typ | Pflicht | Hinweis |
|---|---|---|---|---|
| Art der alten Heizung | `heizungsart` | ENUM | Ja | gas, oel, sonstige |
| Sonstige Heizungsart (Freitext) | `heizungsart_sonstige` | text | Konditional | Nur wenn `sonstige` |
| Liter alle Oeltanks zusammen | `oeltank_liter_gesamt` | integer | Konditional | Nur bei Oel |
| Anzahl Oeltanks | `oeltank_anzahl` | integer | Konditional | Nur bei Oel |
| Liter Oel aktuell in Tanks | `oeltank_liter_aktuell` | integer | Konditional | Nur bei Oel |
| Tank-Transport Beschreibung | `oeltank_transport_beschreibung` | text | Konditional | Nur bei Oel |
| Bilder Heizanlage | Bild-Upload | - | Ja | Kategorie: `heizanlage` |
| Bilder Oeltank | Bild-Upload | - | Konditional | Kategorie: `oeltank`, nur bei Oel |

### Abschnitt 7: Heizungsanlage
| Feld | DB-Spalte | Typ | Pflicht | Hinweis |
|---|---|---|---|---|
| Bilder Heizungsanlage | Bild-Upload | - | Ja | Kategorie: `heizungsanlage` |

### Abschnitt 8: Heizkoerper
| Feld | DB-Spalte | Typ | Pflicht | Hinweis |
|---|---|---|---|---|
| Heizkoerper-Typ | `heizkoerper_typ` | ENUM | Ja | heizkoerper, fussbodenheizung, beides |
| Bilder Heizkreisverteiler | Bild-Upload | - | Konditional | Kategorie: `heizkreisverteiler` (bei FBH/beides) |
| Bilder alle Heizkoerper (5 Upload-Felder) | Bild-Upload | - | Ja | Kategorie: `heizkoerper` |

### Abschnitt 9: Zaehler & Elektrik
| Feld | DB-Spalte | Typ | Pflicht | Hinweis |
|---|---|---|---|---|
| Bilder Zaehlerschrank | Bild-Upload | - | Ja | Kategorie: `zaehlerschrank` |
| Bilder Sicherungen | Bild-Upload | - | Ja | Kategorie: `sicherungen` |
| Bilder Zaehler | Bild-Upload | - | Ja | Kategorie: `zaehler` |
| Hat Erdung? | `hat_erdung` | boolean | Ja | |
| Bilder Erdung | Bild-Upload | - | Konditional | Kategorie: `erdung`, nur wenn ja |
| Bilder HAK | Bild-Upload | - | Ja | Kategorie: `hausanschlusskasten` |

### Abschnitt 10: Aufstellort Ausseneinheit
| Feld | DB-Spalte | Typ | Pflicht | Hinweis |
|---|---|---|---|---|
| Bilder 1. Option (min. 3) | Bild-Upload | - | Ja | Kategorie: `aufstellort_option_1` |
| Bilder Umgebung 1. Option (min. 3) | Bild-Upload | - | Ja | Kategorie: `aufstellort_umgebung_1` |
| 1. Alternative vorhanden? | `alternative_1_vorhanden` | boolean | Ja | |
| Bilder 1. Alternative | Bild-Upload | - | Konditional | Kategorie: `aufstellort_alt_1` |
| Bilder Umgebung 1. Alt. | Bild-Upload | - | Konditional | Kategorie: `aufstellort_umgebung_alt_1` |
| 2. Alternative vorhanden? | `alternative_2_vorhanden` | boolean | Konditional | Nur wenn 1. Alt. vorhanden |
| Bilder 2. Alternative | Bild-Upload | - | Konditional | Kategorie: `aufstellort_alt_2` |
| Bilder Umgebung 2. Alt. | Bild-Upload | - | Konditional | Kategorie: `aufstellort_umgebung_alt_2` |
| Kunde bestaetigt Aufstellort (Checkbox) | `kunde_aufstellort_bestaetigt` | boolean | Ja | Rechtlich relevant |
| Kundenname Bestaetigung (Vor+Nach) | `kunde_bestaetigung_vorname` / `kunde_bestaetigung_nachname` | text | Ja | |
| Unterschrift Kunde (Aufstellort) | Bild-Upload | - | Ja | Kategorie: `unterschrift_aufstellort` |

### Abschnitt 11: Sanitaerausstattung
| Feld | DB-Spalte | Typ | Pflicht | Hinweis |
|---|---|---|---|---|
| Anzahl Duschen | `anzahl_duschen` | integer | Ja | |
| Regendusche vorhanden? | `hat_regendusche` | boolean | Ja | |
| Anzahl Badewannen | `anzahl_badewannen` | integer | Ja | |

### Abschnitt 12: Checkliste & Abnahme
| Feld | DB-Spalte | Typ | Pflicht | Hinweis |
|---|---|---|---|---|
| Alle Raeume richtig gescannt? | `check_raeume_gescannt` | boolean | Ja | |
| Anzahl Raeume stimmt? | `check_anzahl_raeume` | boolean | Ja | |
| Aussenaufstellort besprochen? | `check_aufstellort_besprochen` | boolean | Ja | |
| Forms-Formular alle Bilder? | `check_alle_bilder` | boolean | Ja | |
| Alle Heizkoerper aufgenommen? | `check_heizkoerper_aufgenommen` | boolean | Ja | |
| Bemerkungen / Infos | `bemerkungen` | text | Nein | |
| Unterschrift Thermocheckler | Bild-Upload | - | Ja | Kategorie: `unterschrift_techniker` |

### Abschnitt 13: Unbegehbare Raeume (konditional)
| Feld | DB-Spalte | Typ | Pflicht | Hinweis |
|---|---|---|---|---|
| Wie viele Raeume nicht gescannt? | `anzahl_unbegehbare_raeume` | integer (0-5) | Ja | ENUM: 0,1,2,3,4,5 |

Fuer unbegehbare Raeume wird eine separate Tabelle `thermocheck.thermocheck_vot_unbegehbare_raeume` erstellt (1:N):

| Feld | DB-Spalte | Typ | Pflicht |
|---|---|---|---|
| Formular-ID (FK) | `vot_formular_id` | uuid | Ja |
| Raum-Nummer | `raum_nummer` | integer | Ja |
| Raumname | `raum_name` | text | Ja |
| Quadratmeter | `quadratmeter` | numeric | Ja |
| Fotos | Bild-Upload | - | Ja | Kategorie: `unbegehbarer_raum_{nr}` |

### Abschnitt 14: PV-Anlage
| Feld | DB-Spalte | Typ | Pflicht | Hinweis |
|---|---|---|---|---|
| Bereits PV-Anlage? | `hat_pv_anlage` | boolean | Ja | |
| Bild Solaranlage | Bild-Upload | - | Konditional | Kategorie: `pv_anlage`, nur wenn ja |

### Abschnitt 15: Abschluss
| Feld | DB-Spalte | Typ | Pflicht | Hinweis |
|---|---|---|---|---|
| AGB akzeptiert | `agb_akzeptiert` | boolean | Ja | |
| Unterschrift Kunde (final) | Bild-Upload | - | Ja | Kategorie: `unterschrift_kunde_final` |

---

## 4. Datenbank-Architektur

### 4.1 ENUMs (neu)

```text
thermocheck.heizungsart_enum: 'gas', 'oel', 'sonstige'
thermocheck.heizkoerper_typ_enum: 'heizkoerper', 'fussbodenheizung', 'beides'
thermocheck.vot_formular_status_enum: 'entwurf', 'abgeschlossen'
thermocheck.vot_bild_kategorie_enum: 'hausschuhe', 'treppenabgang', 'eingang_heizungsraum', 
  'heizungsraum', 'heizungsraum_extra', 'heizanlage', 'oeltank', 'heizungsanlage',
  'heizkreisverteiler', 'heizkoerper', 'zaehlerschrank', 'sicherungen', 'zaehler', 
  'erdung', 'hausanschlusskasten', 'aufstellort_option_1', 'aufstellort_umgebung_1',
  'aufstellort_alt_1', 'aufstellort_umgebung_alt_1', 'aufstellort_alt_2', 
  'aufstellort_umgebung_alt_2', 'unterschrift_aufstellort', 'unterschrift_techniker',
  'unterschrift_kunde_final', 'pv_anlage', 'unbegehbarer_raum'
```

### 4.2 Tabellen-Aenderungen

**ALTER `thermocheck.thermocheck_vot_formulare`** -- Felder hinzufuegen:

```text
status                          vot_formular_status_enum  DEFAULT 'entwurf'
techniker_name                  text
techniker_telefon               text
thermocheck_datum               date
heizung_inbetriebnahme_datum    date
heizung_funktionstuechtig       boolean
bauantrag_datum                 date
fossile_brennstoffe_nach_austausch  boolean
mehr_bilder_heizungsraum        boolean
heizungsart                     heizungsart_enum
heizungsart_sonstige            text
oeltank_liter_gesamt            integer
oeltank_anzahl                  integer
oeltank_liter_aktuell           integer
oeltank_transport_beschreibung  text
heizkoerper_typ                 heizkoerper_typ_enum
hat_erdung                      boolean
alternative_1_vorhanden         boolean
alternative_2_vorhanden         boolean
kunde_aufstellort_bestaetigt    boolean
kunde_bestaetigung_vorname      text
kunde_bestaetigung_nachname     text
anzahl_duschen                  integer
hat_regendusche                 boolean
anzahl_badewannen               integer
check_raeume_gescannt           boolean
check_anzahl_raeume             boolean
check_aufstellort_besprochen    boolean
check_alle_bilder               boolean
check_heizkoerper_aufgenommen   boolean
bemerkungen                     text
anzahl_unbegehbare_raeume       integer DEFAULT 0
hat_pv_anlage                   boolean
agb_akzeptiert                  boolean
```

**NEUE Tabelle `thermocheck.thermocheck_vot_bilder`:**

```text
id                  uuid PK DEFAULT gen_random_uuid()
vot_formular_id     uuid FK -> thermocheck_vot_formulare.id ON DELETE CASCADE
kategorie           vot_bild_kategorie_enum NOT NULL
storage_path        text NOT NULL
dateiname           text NOT NULL
beschreibung        text
reihenfolge         integer DEFAULT 0
created_at          timestamptz DEFAULT now()
```

**NEUE Tabelle `thermocheck.thermocheck_vot_unbegehbare_raeume`:**

```text
id                  uuid PK DEFAULT gen_random_uuid()
vot_formular_id     uuid FK -> thermocheck_vot_formulare.id ON DELETE CASCADE
raum_nummer         integer NOT NULL
raum_name           text NOT NULL
quadratmeter        numeric NOT NULL
created_at          timestamptz DEFAULT now()
UNIQUE(vot_formular_id, raum_nummer)
```

### 4.3 Storage

**Neuer Bucket `galvanikbau`** (private):

Ordnerstruktur:
```text
galvanikbau/
  operations/
    leads/
      {lead_name}_{lead_id}/
        thermocheck-auftrag_{auftrag_id}/
          hausschuhe_001.jpg
          treppenabgang_001.jpg
          ...
          unterschrift_kunde_final_001.png
```

Pfad-Sanitierung: `lead_name` wird auf `[a-z0-9_-]` reduziert (Kleinbuchstaben, Umlaute -> ae/oe/ue, Sonderzeichen entfernt).

### 4.4 RLS Policies

**thermocheck_vot_formulare (bestehende Policies reichen):**
- SELECT: `true` (alle authentifizierten User) -- bereits vorhanden
- INSERT: `true` (alle authentifizierten User) -- bereits vorhanden
- UPDATE: `true` (alle authentifizierten User) -- bereits vorhanden

Fuer die neuen Tabellen:

**thermocheck_vot_bilder:**
- SELECT: `auth.uid() IS NOT NULL` (alle eingeloggten)
- INSERT: `auth.uid() IS NOT NULL`
- UPDATE: `auth.uid() IS NOT NULL`
- DELETE: Nur eigene Bilder (eingereicht_von des zugehoerigen Formulars = auth.uid()) ODER Admin

**thermocheck_vot_unbegehbare_raeume:**
- SELECT: `auth.uid() IS NOT NULL`
- INSERT: `auth.uid() IS NOT NULL`
- UPDATE: `auth.uid() IS NOT NULL`
- DELETE: `auth.uid() IS NOT NULL`

**Storage Bucket `galvanikbau`:**
- Upload (INSERT): Authentifizierte User in ihren eigenen Pfaden
- SELECT: Authentifizierte User
- DELETE: Nur eigene Dateien oder Admin

---

## 5. Frontend-Architektur

### 5.1 Ordnerstruktur (Feature-based)

```text
src/features/aufmass/
  ui/
    AufmassFormPage.tsx           -- Seiten-Wrapper mit Auth + Daten-Loading
    AufmassFormStepper.tsx        -- Multi-Step-Navigation (Abschnitte)
    sections/
      TechnikerDatenSection.tsx   -- Abschnitt 1
      KundendatenSection.tsx      -- Abschnitt 2
      TreppenabgangSection.tsx    -- Abschnitt 3
      EingangHeizungsraumSection.tsx
      HeizungsraumSection.tsx
      HeizungsartSection.tsx      -- Konditionale Logik (Gas/Oel/Sonstige)
      HeizungsanlageSection.tsx
      HeizkoerperSection.tsx
      ElektrikSection.tsx         -- Zaehler, Sicherungen, Erdung, HAK
      AufstellortSection.tsx      -- Konditional mit Alternativen
      SanitaerSection.tsx
      ChecklisteSection.tsx
      UnbegehbareRaeumeSection.tsx -- Konditional (0-5 Raeume)
      PvAnlageSection.tsx
      AbschlussSection.tsx        -- AGB + Unterschrift
    components/
      PhotoUploadField.tsx        -- Wiederverwendbarer Foto-Upload
      SignatureField.tsx          -- Canvas-basierte Unterschrift
      ConditionalField.tsx        -- Wrapper fuer konditionale Felder
  hooks/
    useVotFormular.ts             -- CRUD fuer Formulardaten
    useVotBilder.ts               -- Upload + Liste fuer Bilder
    useVotFormularInit.ts         -- Initialisierung (Prefill, bestehender Entwurf)
  data/
    aufmass-schema.ts             -- Zod-Validierung
    bild-kategorien.ts            -- Kategorie-Labels
    storage-path.ts               -- Pfad-Generierung + Sanitierung
```

### 5.2 Route

Neue Route in `App.tsx`:
```text
/thermocheck/aufmass/:auftragId
```

Zugang ueber `TechnicianOrderDetail` -- ein neuer Button "Aufmass erfassen" wird angezeigt, wenn:
- Auftrag-Status ist `booked` oder `in_progress`
- Auftrag ist dem Techniker zugewiesen
- Es existiert noch kein abgeschlossenes Formular fuer diesen Auftrag

### 5.3 User Flow

```text
TechnicianOrderDetail (gebuchter Auftrag)
  --> Klick "Aufmass erfassen"
  --> /thermocheck/aufmass/{auftragId}
  --> AufmassFormPage laedt:
      1. Auftragsdaten aus v_thermocheck_auftraege (Kundendaten prefilled)
      2. Bestehendes Formular (Entwurf) aus thermocheck_vot_formulare
      3. Bestehende Bilder aus thermocheck_vot_bilder
  --> Multi-Step-Formular mit 15 Abschnitten
  --> Jeder Abschnitt: Felder + Foto-Uploads
  --> "Zwischenspeichern" = status 'entwurf' (jederzeit)
  --> "Einreichen" = Validierung + status 'abgeschlossen' + eingereicht_am = now()
  --> Zurueck zur Auftragsdetail-Ansicht
```

### 5.4 Technische Details

**Foto-Upload (PhotoUploadField):**
- Kamera-Capture (mobile) + Datei-Upload
- Client-seitige Komprimierung (max 2MB pro Bild)
- Upload zu `galvanikbau/operations/leads/{lead_name}_{lead_id}/thermocheck-auftrag_{auftrag_id}/{kategorie}_{nr}.jpg`
- Metadaten in `thermocheck_vot_bilder`
- Vorschau-Thumbnails mit Loeschen-Option

**Unterschrift (SignatureField):**
- HTML5 Canvas mit Touch-Support
- Export als PNG
- Upload wie normales Bild mit Kategorie `unterschrift_*`

**Konditionale Felder:**
- Heizungsart `oel` -> zeige Oeltank-Felder
- Heizkoerper-Typ `fussbodenheizung` oder `beides` -> zeige Heizkreisverteiler
- `hat_erdung = true` -> zeige Erdung-Bilder
- `alternative_1_vorhanden = true` -> zeige Alternative 1 Uploads
- `anzahl_unbegehbare_raeume > 0` -> zeige N Raum-Formulare
- `hat_pv_anlage = true` -> zeige PV-Bild-Upload

**Zwischenspeichern (Entwurf):**
- UPSERT auf `thermocheck_vot_formulare` mit status = 'entwurf'
- Bereits hochgeladene Bilder bleiben erhalten
- Techniker kann spaeter zurueckkehren und weiterarbeiten

---

## 6. Rollen-Matrix

| Rolle | Formular sehen | Formular erstellen | Formular bearbeiten | Bilder hochladen | Bilder loeschen |
|---|---|---|---|---|---|
| user (zugewiesener Techniker) | Eigene | Ja (zugewiesene Auftraege) | Ja (nur 'entwurf') | Ja | Eigene |
| admin/manager/superadmin | Alle | Nein | Nein | Nein | Nein |
| Externes Projekt (service_role) | Alle | - | - | - | - |

---

## 7. Edge Cases

| Szenario | Verhalten |
|---|---|
| Techniker oeffnet Formular, Auftrag nicht zugewiesen | Button nicht sichtbar (UI-Guard) |
| Doppeltes Formular fuer gleichen Auftrag | UNIQUE Constraint auf thermocheck_auftrag_id |
| Formular abgeschlossen, nochmal oeffnen | Nur Lese-Ansicht, keine Bearbeitung |
| Upload fehlschlaegt | Toast-Fehlermeldung, Retry-Button |
| Bild zu gross | Client-seitige Komprimierung vor Upload |
| Kundenname mit Sonderzeichen im Storage-Pfad | Sanitize-Funktion |
| Offline waehrend Bearbeitung | Zwischenspeichern schlaegt fehl, Toast-Warnung |
| Techniker wechselt Tab/App mitten im Formular | Entwurf muss manuell gespeichert werden |
| Pflichtbilder fehlen bei Einreichung | Zod-Validierung blockiert Einreichung |
| 0 unbegehbare Raeume | Kein Raum-Subformular angezeigt |
| Heizungsart 'gas' gewaehlt | Oeltank-Felder nicht sichtbar, nicht validiert |

---

## 8. Implementierungsschritte (Reihenfolge)

| Schritt | Was | Dateien |
|---|---|---|
| 1 | **DB-Migration**: ENUMs + ALTER thermocheck_vot_formulare + neue Tabellen + Storage-Bucket + RLS | SQL-Migration |
| 2 | **Storage-Path-Utility**: Pfad-Generierung + Sanitierung | `src/features/aufmass/data/storage-path.ts` |
| 3 | **Zod-Schema**: Validierung aller Felder inkl. konditionaler Logik | `src/features/aufmass/data/aufmass-schema.ts` |
| 4 | **Hooks**: useVotFormular (CRUD), useVotBilder (Upload/Liste) | `src/features/aufmass/hooks/` |
| 5 | **PhotoUploadField + SignatureField**: Wiederverwendbare Komponenten | `src/features/aufmass/ui/components/` |
| 6 | **Formular-Sections**: 15 Abschnitte als eigene Komponenten | `src/features/aufmass/ui/sections/` |
| 7 | **AufmassFormStepper**: Multi-Step-Navigation | `src/features/aufmass/ui/AufmassFormStepper.tsx` |
| 8 | **AufmassFormPage**: Seiten-Wrapper mit Auth-Guard | `src/features/aufmass/ui/AufmassFormPage.tsx` |
| 9 | **Route + Integration**: App.tsx Route + Button in TechnicianOrderDetail | `src/App.tsx`, `src/components/TechnicianOrderDetail.tsx` |
| 10 | **Validation-Doc**: .lovable/validation-vot-formular.md | Dokumentation |

Aufgrund der Groesse (ca. 25-30 Dateien) wird die Implementierung modular in mehreren Schritten erfolgen. Jeder Schritt baut auf dem vorherigen auf.

---

## 9. Selbst-Validierung

**Wuerde ein Profi das so bauen?**
- Ja: Bestehende Tabelle erweitern statt neue redundante Tabelle
- Ja: Separate Bilder-Tabelle (1:N, mit Kategorien)
- Ja: ENUMs fuer Dropdowns (Regel 4 LOVABLE_BEHAVIOUR.txt)
- Ja: Feature-based Ordnerstruktur (Regel 5)
- Ja: Multi-Step-Formular fuer 15+ Abschnitte (nicht alles auf eine Seite)
- Ja: Zwischenspeicher-Funktion (Entwurf)
- Ja: Pfad-Sanitierung fuer Storage
- Ja: Konditionale Validierung (Oel-Felder nur bei Oel, etc.)

**Risiken:**
- Storage 200MB Limit -- bei vielen hochaufloesenden Fotos relevant. Loesung: Client-seitige Komprimierung
- Formular-Groesse -- 15 Abschnitte koennen auf Mobile lang sein. Loesung: Multi-Step mit Fortschrittsanzeige
- Offline-Faehigkeit -- nicht implementiert in V1, aber Entwurf-Speicherung als Workaround

