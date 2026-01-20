export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      "2fa_sms": {
        Row: {
          account: string | null
          created_at_UTC: string
          id: string
          message_body: string | null
          recipient_number: string | null
          sent_number: string | null
          service_provider: string | null
          time_sent: string | null
          verification_code: string | null
        }
        Insert: {
          account?: string | null
          created_at_UTC?: string
          id?: string
          message_body?: string | null
          recipient_number?: string | null
          sent_number?: string | null
          service_provider?: string | null
          time_sent?: string | null
          verification_code?: string | null
        }
        Update: {
          account?: string | null
          created_at_UTC?: string
          id?: string
          message_body?: string | null
          recipient_number?: string | null
          sent_number?: string | null
          service_provider?: string | null
          time_sent?: string | null
          verification_code?: string | null
        }
        Relationships: []
      }
      ai_bot_configurations: {
        Row: {
          bot_color: string | null
          bot_emoji: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          ist_aktiv: boolean
          n8n_webhook_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          bot_color?: string | null
          bot_emoji?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          ist_aktiv?: boolean
          n8n_webhook_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          bot_color?: string | null
          bot_emoji?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          ist_aktiv?: boolean
          n8n_webhook_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      angebote: {
        Row: {
          angebots_datum: string | null
          angebots_nummer: string
          ausgewaehlte_konfiguration_id: string | null
          brutto_summe: number | null
          created_at: string | null
          empfaenger_typ: string | null
          erstellt_von: string | null
          gueltig_bis: string | null
          id: string
          kunde_id: string | null
          lead_id: string | null
          lieferadresse_hausnummer: string | null
          lieferadresse_name: string | null
          lieferadresse_ort: string | null
          lieferadresse_plz: string | null
          lieferadresse_strasse: string | null
          mwst_betrag: number | null
          mwst_prozent: number | null
          netto_summe: number | null
          rechnungsadresse_hausnummer: string | null
          rechnungsadresse_name: string | null
          rechnungsadresse_ort: string | null
          rechnungsadresse_plz: string | null
          rechnungsadresse_strasse: string | null
          status: string | null
          titel: string
          updated_at: string | null
        }
        Insert: {
          angebots_datum?: string | null
          angebots_nummer: string
          ausgewaehlte_konfiguration_id?: string | null
          brutto_summe?: number | null
          created_at?: string | null
          empfaenger_typ?: string | null
          erstellt_von?: string | null
          gueltig_bis?: string | null
          id?: string
          kunde_id?: string | null
          lead_id?: string | null
          lieferadresse_hausnummer?: string | null
          lieferadresse_name?: string | null
          lieferadresse_ort?: string | null
          lieferadresse_plz?: string | null
          lieferadresse_strasse?: string | null
          mwst_betrag?: number | null
          mwst_prozent?: number | null
          netto_summe?: number | null
          rechnungsadresse_hausnummer?: string | null
          rechnungsadresse_name?: string | null
          rechnungsadresse_ort?: string | null
          rechnungsadresse_plz?: string | null
          rechnungsadresse_strasse?: string | null
          status?: string | null
          titel: string
          updated_at?: string | null
        }
        Update: {
          angebots_datum?: string | null
          angebots_nummer?: string
          ausgewaehlte_konfiguration_id?: string | null
          brutto_summe?: number | null
          created_at?: string | null
          empfaenger_typ?: string | null
          erstellt_von?: string | null
          gueltig_bis?: string | null
          id?: string
          kunde_id?: string | null
          lead_id?: string | null
          lieferadresse_hausnummer?: string | null
          lieferadresse_name?: string | null
          lieferadresse_ort?: string | null
          lieferadresse_plz?: string | null
          lieferadresse_strasse?: string | null
          mwst_betrag?: number | null
          mwst_prozent?: number | null
          netto_summe?: number | null
          rechnungsadresse_hausnummer?: string | null
          rechnungsadresse_name?: string | null
          rechnungsadresse_ort?: string | null
          rechnungsadresse_plz?: string | null
          rechnungsadresse_strasse?: string | null
          status?: string | null
          titel?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "angebote_ausgewaehlte_konfiguration_id_fkey"
            columns: ["ausgewaehlte_konfiguration_id"]
            isOneToOne: false
            referencedRelation: "angebots_rechtstext_konfigurationen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "angebote_erstellt_von_fkey"
            columns: ["erstellt_von"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "angebote_kunde_id_fkey"
            columns: ["kunde_id"]
            isOneToOne: false
            referencedRelation: "kunden"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "angebote_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "angebote_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      angebots_positionen: {
        Row: {
          angebot_id: string
          beschreibung: string
          created_at: string | null
          einheit: string | null
          einzelpreis: number
          gesamt_preis: number
          id: string
          ist_optional: boolean | null
          leistungsverzeichnis_position_id: string | null
          menge: number
          position_nr: number
          produkt_id: string | null
          rabatt_prozent: number | null
        }
        Insert: {
          angebot_id: string
          beschreibung: string
          created_at?: string | null
          einheit?: string | null
          einzelpreis: number
          gesamt_preis: number
          id?: string
          ist_optional?: boolean | null
          leistungsverzeichnis_position_id?: string | null
          menge?: number
          position_nr: number
          produkt_id?: string | null
          rabatt_prozent?: number | null
        }
        Update: {
          angebot_id?: string
          beschreibung?: string
          created_at?: string | null
          einheit?: string | null
          einzelpreis?: number
          gesamt_preis?: number
          id?: string
          ist_optional?: boolean | null
          leistungsverzeichnis_position_id?: string | null
          menge?: number
          position_nr?: number
          produkt_id?: string | null
          rabatt_prozent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "angebots_positionen_angebot_id_fkey"
            columns: ["angebot_id"]
            isOneToOne: false
            referencedRelation: "angebote"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "angebots_positionen_leistungsverzeichnis_position_id_fkey"
            columns: ["leistungsverzeichnis_position_id"]
            isOneToOne: false
            referencedRelation: "leistungsverzeichnis_positionen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "angebots_positionen_produkt_id_fkey"
            columns: ["produkt_id"]
            isOneToOne: false
            referencedRelation: "produkte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "angebots_positionen_produkt_id_fkey"
            columns: ["produkt_id"]
            isOneToOne: false
            referencedRelation: "produkte_katalog_view"
            referencedColumns: ["id"]
          },
        ]
      }
      angebots_rechtstext_konfigurationen: {
        Row: {
          beschreibung: string | null
          created_at: string
          folgeblaetter_pdf_url: string | null
          id: string
          ist_aktiv: boolean
          ist_standard: boolean
          name: string
          sortierung: number
          titelblatt_pdf_url: string | null
          updated_at: string
        }
        Insert: {
          beschreibung?: string | null
          created_at?: string
          folgeblaetter_pdf_url?: string | null
          id?: string
          ist_aktiv?: boolean
          ist_standard?: boolean
          name: string
          sortierung?: number
          titelblatt_pdf_url?: string | null
          updated_at?: string
        }
        Update: {
          beschreibung?: string | null
          created_at?: string
          folgeblaetter_pdf_url?: string | null
          id?: string
          ist_aktiv?: boolean
          ist_standard?: boolean
          name?: string
          sortierung?: number
          titelblatt_pdf_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      angebots_vorlagen: {
        Row: {
          beschreibung: string | null
          created_at: string | null
          einleitung: string | null
          id: string
          ist_standard: boolean | null
          lieferbedingungen: string | null
          name: string
          schlussbemerkung: string | null
          updated_at: string | null
          zahlungsbedingungen: string | null
        }
        Insert: {
          beschreibung?: string | null
          created_at?: string | null
          einleitung?: string | null
          id?: string
          ist_standard?: boolean | null
          lieferbedingungen?: string | null
          name: string
          schlussbemerkung?: string | null
          updated_at?: string | null
          zahlungsbedingungen?: string | null
        }
        Update: {
          beschreibung?: string | null
          created_at?: string | null
          einleitung?: string | null
          id?: string
          ist_standard?: boolean | null
          lieferbedingungen?: string | null
          name?: string
          schlussbemerkung?: string | null
          updated_at?: string | null
          zahlungsbedingungen?: string | null
        }
        Relationships: []
      }
      arbeitspaket_fortschritt: {
        Row: {
          abgeschlossen: boolean
          abgeschlossen_am: string | null
          abgeschlossen_von: string | null
          auftrag_arbeitspaket_id: string
          created_at: string
          datei_url: string | null
          dateien_urls: Json | null
          id: string
          schritt_id: string
          updated_at: string
          wert: string | null
        }
        Insert: {
          abgeschlossen?: boolean
          abgeschlossen_am?: string | null
          abgeschlossen_von?: string | null
          auftrag_arbeitspaket_id: string
          created_at?: string
          datei_url?: string | null
          dateien_urls?: Json | null
          id?: string
          schritt_id: string
          updated_at?: string
          wert?: string | null
        }
        Update: {
          abgeschlossen?: boolean
          abgeschlossen_am?: string | null
          abgeschlossen_von?: string | null
          auftrag_arbeitspaket_id?: string
          created_at?: string
          datei_url?: string | null
          dateien_urls?: Json | null
          id?: string
          schritt_id?: string
          updated_at?: string
          wert?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arbeitspaket_fortschritt_abgeschlossen_von_fkey"
            columns: ["abgeschlossen_von"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arbeitspaket_fortschritt_auftrag_arbeitspaket_id_fkey"
            columns: ["auftrag_arbeitspaket_id"]
            isOneToOne: false
            referencedRelation: "auftrag_arbeitspakete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arbeitspaket_fortschritt_schritt_id_fkey"
            columns: ["schritt_id"]
            isOneToOne: false
            referencedRelation: "arbeitspaket_schritte"
            referencedColumns: ["id"]
          },
        ]
      }
      arbeitspaket_schritte: {
        Row: {
          arbeitspaket_id: string
          beschreibung: string | null
          code: string
          created_at: string
          db_feld_mapping: string | null
          id: string
          label: string
          optionen: Json | null
          pflichtfeld: boolean
          reihenfolge: number
          schritt_typ: Database["public"]["Enums"]["schritt_typ"]
          validierung: Json | null
        }
        Insert: {
          arbeitspaket_id: string
          beschreibung?: string | null
          code: string
          created_at?: string
          db_feld_mapping?: string | null
          id?: string
          label: string
          optionen?: Json | null
          pflichtfeld?: boolean
          reihenfolge?: number
          schritt_typ?: Database["public"]["Enums"]["schritt_typ"]
          validierung?: Json | null
        }
        Update: {
          arbeitspaket_id?: string
          beschreibung?: string | null
          code?: string
          created_at?: string
          db_feld_mapping?: string | null
          id?: string
          label?: string
          optionen?: Json | null
          pflichtfeld?: boolean
          reihenfolge?: number
          schritt_typ?: Database["public"]["Enums"]["schritt_typ"]
          validierung?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "arbeitspaket_schritte_arbeitspaket_id_fkey"
            columns: ["arbeitspaket_id"]
            isOneToOne: false
            referencedRelation: "arbeitspakete_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      arbeitspakete_templates: {
        Row: {
          anruf_typ: string | null
          beschreibung: string | null
          code: string
          created_at: string
          definition_of_done: Json | null
          emoji: string | null
          geschaetzte_dauer_minuten: number | null
          id: string
          ist_aktiv: boolean
          name: string
          reihenfolge: number
          tage_bis_faellig: number | null
          trigger_substatus: Database["public"]["Enums"]["baustellenstatus_substatus_enum"]
          updated_at: string
          verantwortlichkeit_id: string | null
          video_url: string | null
          wiedervorlage_tage: number | null
          zeige_baukalender: boolean | null
          ziel_substatus:
            | Database["public"]["Enums"]["baustellenstatus_substatus_enum"]
            | null
        }
        Insert: {
          anruf_typ?: string | null
          beschreibung?: string | null
          code: string
          created_at?: string
          definition_of_done?: Json | null
          emoji?: string | null
          geschaetzte_dauer_minuten?: number | null
          id?: string
          ist_aktiv?: boolean
          name: string
          reihenfolge?: number
          tage_bis_faellig?: number | null
          trigger_substatus: Database["public"]["Enums"]["baustellenstatus_substatus_enum"]
          updated_at?: string
          verantwortlichkeit_id?: string | null
          video_url?: string | null
          wiedervorlage_tage?: number | null
          zeige_baukalender?: boolean | null
          ziel_substatus?:
            | Database["public"]["Enums"]["baustellenstatus_substatus_enum"]
            | null
        }
        Update: {
          anruf_typ?: string | null
          beschreibung?: string | null
          code?: string
          created_at?: string
          definition_of_done?: Json | null
          emoji?: string | null
          geschaetzte_dauer_minuten?: number | null
          id?: string
          ist_aktiv?: boolean
          name?: string
          reihenfolge?: number
          tage_bis_faellig?: number | null
          trigger_substatus?: Database["public"]["Enums"]["baustellenstatus_substatus_enum"]
          updated_at?: string
          verantwortlichkeit_id?: string | null
          video_url?: string | null
          wiedervorlage_tage?: number | null
          zeige_baukalender?: boolean | null
          ziel_substatus?:
            | Database["public"]["Enums"]["baustellenstatus_substatus_enum"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "arbeitspakete_templates_verantwortlichkeit_id_fkey"
            columns: ["verantwortlichkeit_id"]
            isOneToOne: false
            referencedRelation: "verantwortlichkeiten"
            referencedColumns: ["id"]
          },
        ]
      }
      auftraege: {
        Row: {
          abrechnung_datum: string | null
          abrechnungsmonat: string | null
          anzahlung_eingang_datum: string | null
          auftragsbestaetigung_netto_summe: number
          auszahlung_blockiert_grund: string[] | null
          auszahlungsmonat: string | null
          bankgebuehren_prozent: number | null
          bauende_datum: string | null
          baustart_datum: string | null
          baustellenstatus:
            | Database["public"]["Enums"]["baustellenstatus"]
            | null
          baustellenstatus_substatus:
            | Database["public"]["Enums"]["baustellenstatus_substatus_enum"]
            | null
          created_at: string
          eingefrorener_provisionssatz: number | null
          final_signing_date: string | null
          foerderung_beantragt_datum: string | null
          gesamtverantwortlicher_id: string | null
          gewaehrter_rabatt_prozent: number | null
          id: string
          im_bau_notizen: string | null
          ist_kombipaket: boolean
          ist_rabattkeule: boolean
          klaerung_ursprung_phase:
            | Database["public"]["Enums"]["baustellenstatus"]
            | null
          kombiauftrag_partner_id: string | null
          kunde_id: string | null
          lead_id: string | null
          marge_prozent: number | null
          mitarbeiter_id: string
          projektart: Database["public"]["Enums"]["projektart_enum"] | null
          provisions_status:
            | Database["public"]["Enums"]["provision_status_enum"]
            | null
          rabatt_betrag_netto: number | null
          reklamation_vorhanden: boolean | null
          retention_letzter_kontakt: string | null
          retention_status:
            | Database["public"]["Enums"]["retention_status_enum"]
            | null
          retention_substatus:
            | Database["public"]["Enums"]["retention_substatus_enum"]
            | null
          retention_wiedervorlage: string | null
          status: Database["public"]["Enums"]["auftrag_status"]
          storno_datum: string | null
          subunternehmer_id: string | null
          updated_at: string
          verkaufsmonat: string | null
          wichtige_baustelleninfos: string | null
          widerruf_bis_datum: string | null
          widerruf_status:
            | Database["public"]["Enums"]["widerruf_status_enum"]
            | null
          zahlungsart: Database["public"]["Enums"]["zahlungsart"] | null
          zusatzkosten: number | null
        }
        Insert: {
          abrechnung_datum?: string | null
          abrechnungsmonat?: string | null
          anzahlung_eingang_datum?: string | null
          auftragsbestaetigung_netto_summe: number
          auszahlung_blockiert_grund?: string[] | null
          auszahlungsmonat?: string | null
          bankgebuehren_prozent?: number | null
          bauende_datum?: string | null
          baustart_datum?: string | null
          baustellenstatus?:
            | Database["public"]["Enums"]["baustellenstatus"]
            | null
          baustellenstatus_substatus?:
            | Database["public"]["Enums"]["baustellenstatus_substatus_enum"]
            | null
          created_at?: string
          eingefrorener_provisionssatz?: number | null
          final_signing_date?: string | null
          foerderung_beantragt_datum?: string | null
          gesamtverantwortlicher_id?: string | null
          gewaehrter_rabatt_prozent?: number | null
          id?: string
          im_bau_notizen?: string | null
          ist_kombipaket?: boolean
          ist_rabattkeule?: boolean
          klaerung_ursprung_phase?:
            | Database["public"]["Enums"]["baustellenstatus"]
            | null
          kombiauftrag_partner_id?: string | null
          kunde_id?: string | null
          lead_id?: string | null
          marge_prozent?: number | null
          mitarbeiter_id: string
          projektart?: Database["public"]["Enums"]["projektart_enum"] | null
          provisions_status?:
            | Database["public"]["Enums"]["provision_status_enum"]
            | null
          rabatt_betrag_netto?: number | null
          reklamation_vorhanden?: boolean | null
          retention_letzter_kontakt?: string | null
          retention_status?:
            | Database["public"]["Enums"]["retention_status_enum"]
            | null
          retention_substatus?:
            | Database["public"]["Enums"]["retention_substatus_enum"]
            | null
          retention_wiedervorlage?: string | null
          status?: Database["public"]["Enums"]["auftrag_status"]
          storno_datum?: string | null
          subunternehmer_id?: string | null
          updated_at?: string
          verkaufsmonat?: string | null
          wichtige_baustelleninfos?: string | null
          widerruf_bis_datum?: string | null
          widerruf_status?:
            | Database["public"]["Enums"]["widerruf_status_enum"]
            | null
          zahlungsart?: Database["public"]["Enums"]["zahlungsart"] | null
          zusatzkosten?: number | null
        }
        Update: {
          abrechnung_datum?: string | null
          abrechnungsmonat?: string | null
          anzahlung_eingang_datum?: string | null
          auftragsbestaetigung_netto_summe?: number
          auszahlung_blockiert_grund?: string[] | null
          auszahlungsmonat?: string | null
          bankgebuehren_prozent?: number | null
          bauende_datum?: string | null
          baustart_datum?: string | null
          baustellenstatus?:
            | Database["public"]["Enums"]["baustellenstatus"]
            | null
          baustellenstatus_substatus?:
            | Database["public"]["Enums"]["baustellenstatus_substatus_enum"]
            | null
          created_at?: string
          eingefrorener_provisionssatz?: number | null
          final_signing_date?: string | null
          foerderung_beantragt_datum?: string | null
          gesamtverantwortlicher_id?: string | null
          gewaehrter_rabatt_prozent?: number | null
          id?: string
          im_bau_notizen?: string | null
          ist_kombipaket?: boolean
          ist_rabattkeule?: boolean
          klaerung_ursprung_phase?:
            | Database["public"]["Enums"]["baustellenstatus"]
            | null
          kombiauftrag_partner_id?: string | null
          kunde_id?: string | null
          lead_id?: string | null
          marge_prozent?: number | null
          mitarbeiter_id?: string
          projektart?: Database["public"]["Enums"]["projektart_enum"] | null
          provisions_status?:
            | Database["public"]["Enums"]["provision_status_enum"]
            | null
          rabatt_betrag_netto?: number | null
          reklamation_vorhanden?: boolean | null
          retention_letzter_kontakt?: string | null
          retention_status?:
            | Database["public"]["Enums"]["retention_status_enum"]
            | null
          retention_substatus?:
            | Database["public"]["Enums"]["retention_substatus_enum"]
            | null
          retention_wiedervorlage?: string | null
          status?: Database["public"]["Enums"]["auftrag_status"]
          storno_datum?: string | null
          subunternehmer_id?: string | null
          updated_at?: string
          verkaufsmonat?: string | null
          wichtige_baustelleninfos?: string | null
          widerruf_bis_datum?: string | null
          widerruf_status?:
            | Database["public"]["Enums"]["widerruf_status_enum"]
            | null
          zahlungsart?: Database["public"]["Enums"]["zahlungsart"] | null
          zusatzkosten?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "auftraege_gesamtverantwortlicher_id_fkey"
            columns: ["gesamtverantwortlicher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auftraege_kombiauftrag_partner_id_fkey"
            columns: ["kombiauftrag_partner_id"]
            isOneToOne: false
            referencedRelation: "auftraege"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auftraege_kunde_id_fkey"
            columns: ["kunde_id"]
            isOneToOne: false
            referencedRelation: "kunden"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auftraege_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auftraege_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auftraege_mitarbeiter_id_fkey"
            columns: ["mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auftraege_subunternehmer_id_fkey"
            columns: ["subunternehmer_id"]
            isOneToOne: false
            referencedRelation: "subunternehmer"
            referencedColumns: ["id"]
          },
        ]
      }
      auftraege_substatus_backup: {
        Row: {
          auftrag_id: string
          gesichert_am: string | null
          id: string
          old_substatus: string | null
        }
        Insert: {
          auftrag_id: string
          gesichert_am?: string | null
          id?: string
          old_substatus?: string | null
        }
        Update: {
          auftrag_id?: string
          gesichert_am?: string | null
          id?: string
          old_substatus?: string | null
        }
        Relationships: []
      }
      auftrag_arbeitspakete: {
        Row: {
          abgeschlossen_am: string | null
          anrufversuche: number | null
          arbeitspaket_id: string
          auftrag_id: string
          created_at: string
          faellig_am: string | null
          gestartet_am: string | null
          id: string
          notizen: string | null
          status: Database["public"]["Enums"]["arbeitspaket_status"]
          updated_at: string
          verantwortlichkeit_id: string | null
          zugewiesen_an: string | null
        }
        Insert: {
          abgeschlossen_am?: string | null
          anrufversuche?: number | null
          arbeitspaket_id: string
          auftrag_id: string
          created_at?: string
          faellig_am?: string | null
          gestartet_am?: string | null
          id?: string
          notizen?: string | null
          status?: Database["public"]["Enums"]["arbeitspaket_status"]
          updated_at?: string
          verantwortlichkeit_id?: string | null
          zugewiesen_an?: string | null
        }
        Update: {
          abgeschlossen_am?: string | null
          anrufversuche?: number | null
          arbeitspaket_id?: string
          auftrag_id?: string
          created_at?: string
          faellig_am?: string | null
          gestartet_am?: string | null
          id?: string
          notizen?: string | null
          status?: Database["public"]["Enums"]["arbeitspaket_status"]
          updated_at?: string
          verantwortlichkeit_id?: string | null
          zugewiesen_an?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auftrag_arbeitspakete_arbeitspaket_id_fkey"
            columns: ["arbeitspaket_id"]
            isOneToOne: false
            referencedRelation: "arbeitspakete_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auftrag_arbeitspakete_auftrag_id_fkey"
            columns: ["auftrag_id"]
            isOneToOne: false
            referencedRelation: "auftraege"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auftrag_arbeitspakete_verantwortlichkeit_id_fkey"
            columns: ["verantwortlichkeit_id"]
            isOneToOne: false
            referencedRelation: "verantwortlichkeiten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auftrag_arbeitspakete_zugewiesen_an_fkey"
            columns: ["zugewiesen_an"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auftrag_bestellungen: {
        Row: {
          artikelbezeichnung: string
          auftrag_id: string
          bestelldatum: string | null
          einheit: string
          ek_preis: number | null
          erstellt_am: string | null
          erstellt_von: string | null
          geaendert_am: string | null
          geaendert_von: string | null
          id: string
          kategorie: string
          lieferant: string | null
          liefertermin_geplant: string | null
          liefertermin_tatsaechlich: string | null
          menge: number
          notizen: string | null
          sort_order: number | null
          status: string
          vk_preis: number | null
        }
        Insert: {
          artikelbezeichnung: string
          auftrag_id: string
          bestelldatum?: string | null
          einheit?: string
          ek_preis?: number | null
          erstellt_am?: string | null
          erstellt_von?: string | null
          geaendert_am?: string | null
          geaendert_von?: string | null
          id?: string
          kategorie?: string
          lieferant?: string | null
          liefertermin_geplant?: string | null
          liefertermin_tatsaechlich?: string | null
          menge?: number
          notizen?: string | null
          sort_order?: number | null
          status?: string
          vk_preis?: number | null
        }
        Update: {
          artikelbezeichnung?: string
          auftrag_id?: string
          bestelldatum?: string | null
          einheit?: string
          ek_preis?: number | null
          erstellt_am?: string | null
          erstellt_von?: string | null
          geaendert_am?: string | null
          geaendert_von?: string | null
          id?: string
          kategorie?: string
          lieferant?: string | null
          liefertermin_geplant?: string | null
          liefertermin_tatsaechlich?: string | null
          menge?: number
          notizen?: string | null
          sort_order?: number | null
          status?: string
          vk_preis?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "auftrag_bestellungen_auftrag_id_fkey"
            columns: ["auftrag_id"]
            isOneToOne: false
            referencedRelation: "auftraege"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auftrag_bestellungen_erstellt_von_fkey"
            columns: ["erstellt_von"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auftrag_bestellungen_geaendert_von_fkey"
            columns: ["geaendert_von"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auftrag_wiedervorlagen: {
        Row: {
          arbeitspaket_template_id: string
          auftrag_id: string
          beschreibung: string | null
          created_at: string
          erledigt_am: string | null
          erledigt_durch_arbeitspaket_id: string | null
          erstellt_am: string
          faellig_am: string
          id: string
          updated_at: string
          zugewiesen_an: string | null
        }
        Insert: {
          arbeitspaket_template_id: string
          auftrag_id: string
          beschreibung?: string | null
          created_at?: string
          erledigt_am?: string | null
          erledigt_durch_arbeitspaket_id?: string | null
          erstellt_am?: string
          faellig_am: string
          id?: string
          updated_at?: string
          zugewiesen_an?: string | null
        }
        Update: {
          arbeitspaket_template_id?: string
          auftrag_id?: string
          beschreibung?: string | null
          created_at?: string
          erledigt_am?: string | null
          erledigt_durch_arbeitspaket_id?: string | null
          erstellt_am?: string
          faellig_am?: string
          id?: string
          updated_at?: string
          zugewiesen_an?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auftrag_wiedervorlagen_arbeitspaket_template_id_fkey"
            columns: ["arbeitspaket_template_id"]
            isOneToOne: false
            referencedRelation: "arbeitspakete_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auftrag_wiedervorlagen_auftrag_id_fkey"
            columns: ["auftrag_id"]
            isOneToOne: false
            referencedRelation: "auftraege"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auftrag_wiedervorlagen_erledigt_durch_arbeitspaket_id_fkey"
            columns: ["erledigt_durch_arbeitspaket_id"]
            isOneToOne: false
            referencedRelation: "arbeitspakete_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      b2c_autargy_kunden: {
        Row: {
          aftersales_status: string | null
          aftersales_substatus: string | null
          anrede: string | null
          created_at: string
          email: string | null
          hausnummer: string | null
          id: string
          imported_at: string | null
          kunde_festnetz: string | null
          kunde_mobil: string | null
          kundenname: string
          leadquelle: string | null
          letzter_kontakt: string | null
          linked_galvanek_kunde_id: string | null
          nachname: string | null
          naechste_wiedervorlage: string | null
          original_planphase: string | null
          ort: string | null
          planphase_2_0: string | null
          plz: string | null
          potenzial_euro: number | null
          projektart: string | null
          sentiment: number | null
          sonderbemerkungen: string | null
          strasse: string | null
          updated_at: string
          vorname: string | null
          widerruf_bestaetigt: boolean | null
          widerruf_wunsch: boolean | null
          zoho_record_id: string | null
        }
        Insert: {
          aftersales_status?: string | null
          aftersales_substatus?: string | null
          anrede?: string | null
          created_at?: string
          email?: string | null
          hausnummer?: string | null
          id?: string
          imported_at?: string | null
          kunde_festnetz?: string | null
          kunde_mobil?: string | null
          kundenname: string
          leadquelle?: string | null
          letzter_kontakt?: string | null
          linked_galvanek_kunde_id?: string | null
          nachname?: string | null
          naechste_wiedervorlage?: string | null
          original_planphase?: string | null
          ort?: string | null
          planphase_2_0?: string | null
          plz?: string | null
          potenzial_euro?: number | null
          projektart?: string | null
          sentiment?: number | null
          sonderbemerkungen?: string | null
          strasse?: string | null
          updated_at?: string
          vorname?: string | null
          widerruf_bestaetigt?: boolean | null
          widerruf_wunsch?: boolean | null
          zoho_record_id?: string | null
        }
        Update: {
          aftersales_status?: string | null
          aftersales_substatus?: string | null
          anrede?: string | null
          created_at?: string
          email?: string | null
          hausnummer?: string | null
          id?: string
          imported_at?: string | null
          kunde_festnetz?: string | null
          kunde_mobil?: string | null
          kundenname?: string
          leadquelle?: string | null
          letzter_kontakt?: string | null
          linked_galvanek_kunde_id?: string | null
          nachname?: string | null
          naechste_wiedervorlage?: string | null
          original_planphase?: string | null
          ort?: string | null
          planphase_2_0?: string | null
          plz?: string | null
          potenzial_euro?: number | null
          projektart?: string | null
          sentiment?: number | null
          sonderbemerkungen?: string | null
          strasse?: string | null
          updated_at?: string
          vorname?: string | null
          widerruf_bestaetigt?: boolean | null
          widerruf_wunsch?: boolean | null
          zoho_record_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "b2c_autargy_kunden_linked_galvanek_kunde_id_fkey"
            columns: ["linked_galvanek_kunde_id"]
            isOneToOne: false
            referencedRelation: "kunden"
            referencedColumns: ["id"]
          },
        ]
      }
      b2c_autargy_kunden_nachverkauf_potenziale: {
        Row: {
          autargy_kunde_id: string
          bearbeitet_von: string | null
          created_at: string
          id: string
          laufzeit_jahre: number | null
          letzter_kontakt: string | null
          notizen: string | null
          potenzial_key: string
          source_provider: string | null
          status: Database["public"]["Enums"]["nachverkauf_potenzial_status_enum"]
          updated_at: string
          vertrag_datei_url: string | null
        }
        Insert: {
          autargy_kunde_id: string
          bearbeitet_von?: string | null
          created_at?: string
          id?: string
          laufzeit_jahre?: number | null
          letzter_kontakt?: string | null
          notizen?: string | null
          potenzial_key: string
          source_provider?: string | null
          status?: Database["public"]["Enums"]["nachverkauf_potenzial_status_enum"]
          updated_at?: string
          vertrag_datei_url?: string | null
        }
        Update: {
          autargy_kunde_id?: string
          bearbeitet_von?: string | null
          created_at?: string
          id?: string
          laufzeit_jahre?: number | null
          letzter_kontakt?: string | null
          notizen?: string | null
          potenzial_key?: string
          source_provider?: string | null
          status?: Database["public"]["Enums"]["nachverkauf_potenzial_status_enum"]
          updated_at?: string
          vertrag_datei_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "b2c_autargy_kunden_nachverkauf_potenziale_autargy_kunde_id_fkey"
            columns: ["autargy_kunde_id"]
            isOneToOne: false
            referencedRelation: "b2c_autargy_kunden"
            referencedColumns: ["id"]
          },
        ]
      }
      b2c_kunden_nachverkauf_potenziale: {
        Row: {
          bearbeitet_von: string | null
          created_at: string
          id: string
          kunde_id: string
          laufzeit_jahre: number | null
          letzter_kontakt: string | null
          notizen: string | null
          potenzial_key: string
          source_provider: string | null
          status: Database["public"]["Enums"]["nachverkauf_potenzial_status_enum"]
          updated_at: string
          vertrag_datei_url: string | null
        }
        Insert: {
          bearbeitet_von?: string | null
          created_at?: string
          id?: string
          kunde_id: string
          laufzeit_jahre?: number | null
          letzter_kontakt?: string | null
          notizen?: string | null
          potenzial_key: string
          source_provider?: string | null
          status?: Database["public"]["Enums"]["nachverkauf_potenzial_status_enum"]
          updated_at?: string
          vertrag_datei_url?: string | null
        }
        Update: {
          bearbeitet_von?: string | null
          created_at?: string
          id?: string
          kunde_id?: string
          laufzeit_jahre?: number | null
          letzter_kontakt?: string | null
          notizen?: string | null
          potenzial_key?: string
          source_provider?: string | null
          status?: Database["public"]["Enums"]["nachverkauf_potenzial_status_enum"]
          updated_at?: string
          vertrag_datei_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "b2c_kunden_nachverkauf_potenziale_bearbeitet_von_fkey"
            columns: ["bearbeitet_von"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2c_kunden_nachverkauf_potenziale_kunde_id_fkey"
            columns: ["kunde_id"]
            isOneToOne: false
            referencedRelation: "kunden"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_selling_aktivitaeten: {
        Row: {
          aktivitaet_typ: string
          auftrag_id: string | null
          autargy_kunde_id: string | null
          created_at: string
          id: string
          kommentar: string | null
          kunde_id: string | null
          pipeline_type: string
          user_id: string
          user_name: string | null
          von_status: string | null
          von_substatus: string | null
          wiedervorlage_datum: string | null
          zu_status: string | null
          zu_substatus: string | null
        }
        Insert: {
          aktivitaet_typ: string
          auftrag_id?: string | null
          autargy_kunde_id?: string | null
          created_at?: string
          id?: string
          kommentar?: string | null
          kunde_id?: string | null
          pipeline_type: string
          user_id: string
          user_name?: string | null
          von_status?: string | null
          von_substatus?: string | null
          wiedervorlage_datum?: string | null
          zu_status?: string | null
          zu_substatus?: string | null
        }
        Update: {
          aktivitaet_typ?: string
          auftrag_id?: string | null
          autargy_kunde_id?: string | null
          created_at?: string
          id?: string
          kommentar?: string | null
          kunde_id?: string | null
          pipeline_type?: string
          user_id?: string
          user_name?: string | null
          von_status?: string | null
          von_substatus?: string | null
          wiedervorlage_datum?: string | null
          zu_status?: string | null
          zu_substatus?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cross_selling_aktivitaeten_auftrag_id_fkey"
            columns: ["auftrag_id"]
            isOneToOne: false
            referencedRelation: "auftraege"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_selling_aktivitaeten_autargy_kunde_id_fkey"
            columns: ["autargy_kunde_id"]
            isOneToOne: false
            referencedRelation: "b2c_autargy_kunden"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_selling_aktivitaeten_kunde_id_fkey"
            columns: ["kunde_id"]
            isOneToOne: false
            referencedRelation: "kunden"
            referencedColumns: ["id"]
          },
        ]
      }
      d2d_verkaeufer: {
        Row: {
          created_at: string
          email: string | null
          firma: string | null
          id: string
          name: string
          notizen: string | null
          status: string
          telefon: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          firma?: string | null
          id?: string
          name: string
          notizen?: string | null
          status?: string
          telefon?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          firma?: string | null
          id?: string
          name?: string
          notizen?: string | null
          status?: string
          telefon?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dev_todos: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      einheiten: {
        Row: {
          beschreibung: string | null
          created_at: string
          id: string
          ist_aktiv: boolean
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          beschreibung?: string | null
          created_at?: string
          id?: string
          ist_aktiv?: boolean
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          beschreibung?: string | null
          created_at?: string
          id?: string
          ist_aktiv?: boolean
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      email_confirmations: {
        Row: {
          confirmed_at: string | null
          created_at: string
          expires_at: string
          id: string
          token: string
          user_id: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          token: string
          user_id: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      entity_activity_log: {
        Row: {
          action_category: string | null
          action_type: string
          created_at: string | null
          description: string | null
          entity_id: string
          entity_type: string
          field_name: string | null
          id: string
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action_category?: string | null
          action_type: string
          created_at?: string | null
          description?: string | null
          entity_id: string
          entity_type: string
          field_name?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action_category?: string | null
          action_type?: string
          created_at?: string | null
          description?: string | null
          entity_id?: string
          entity_type?: string
          field_name?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          created_at: string
          description: string
          error_data: Json | null
          id: string
          name: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          error_data?: Json | null
          id?: string
          name: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          error_data?: Json | null
          id?: string
          name?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      fehlzeiten: {
        Row: {
          created_at: string
          end_datum: string
          id: string
          mitarbeiter_id: string
          start_datum: string
          typ: Database["public"]["Enums"]["fehlzeiten_typ"]
        }
        Insert: {
          created_at?: string
          end_datum: string
          id?: string
          mitarbeiter_id: string
          start_datum: string
          typ: Database["public"]["Enums"]["fehlzeiten_typ"]
        }
        Update: {
          created_at?: string
          end_datum?: string
          id?: string
          mitarbeiter_id?: string
          start_datum?: string
          typ?: Database["public"]["Enums"]["fehlzeiten_typ"]
        }
        Relationships: [
          {
            foreignKeyName: "fehlzeiten_mitarbeiter_id_fkey"
            columns: ["mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
        ]
      }
      finanzierungspartner: {
        Row: {
          aktiv: boolean
          bearbeitungszeit: string | null
          benefits: string[] | null
          beschreibung: string | null
          created_at: string
          created_by: string | null
          id: string
          logo_url: string | null
          max_finanzierung: number | null
          min_rate: number | null
          name: string
          ranking: number | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          aktiv?: boolean
          bearbeitungszeit?: string | null
          benefits?: string[] | null
          beschreibung?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          max_finanzierung?: number | null
          min_rate?: number | null
          name: string
          ranking?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          aktiv?: boolean
          bearbeitungszeit?: string | null
          benefits?: string[] | null
          beschreibung?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          max_finanzierung?: number | null
          min_rate?: number | null
          name?: string
          ranking?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      form_fields: {
        Row: {
          conditional_logic: Json | null
          created_at: string
          default_value: string | null
          field_label: string
          field_name: string
          field_order: number
          field_type: string
          form_id: string
          help_text: string | null
          id: string
          is_hidden: boolean | null
          is_required: boolean | null
          knockout_criteria: Json | null
          lead_field_mapping: string | null
          options: Json | null
          placeholder: string | null
          validation_rules: Json | null
        }
        Insert: {
          conditional_logic?: Json | null
          created_at?: string
          default_value?: string | null
          field_label: string
          field_name: string
          field_order: number
          field_type: string
          form_id: string
          help_text?: string | null
          id?: string
          is_hidden?: boolean | null
          is_required?: boolean | null
          knockout_criteria?: Json | null
          lead_field_mapping?: string | null
          options?: Json | null
          placeholder?: string | null
          validation_rules?: Json | null
        }
        Update: {
          conditional_logic?: Json | null
          created_at?: string
          default_value?: string | null
          field_label?: string
          field_name?: string
          field_order?: number
          field_type?: string
          form_id?: string
          help_text?: string | null
          id?: string
          is_hidden?: boolean | null
          is_required?: boolean | null
          knockout_criteria?: Json | null
          lead_field_mapping?: string | null
          options?: Json | null
          placeholder?: string | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "form_fields_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          converted_to_lead_at: string | null
          created_at: string
          form_id: string
          id: string
          ip_address: string | null
          lead_id: string | null
          processing_notes: string | null
          status: string
          submission_data: Json
          submitted_at: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          converted_to_lead_at?: string | null
          created_at?: string
          form_id: string
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          processing_notes?: string | null
          status?: string
          submission_data?: Json
          submitted_at?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          converted_to_lead_at?: string | null
          created_at?: string
          form_id?: string
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          processing_notes?: string | null
          status?: string
          submission_data?: Json
          submitted_at?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          allow_multiple_submissions: boolean | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          redirect_url: string | null
          submit_button_text: string | null
          success_message: string | null
          theme_settings: Json | null
          updated_at: string
        }
        Insert: {
          allow_multiple_submissions?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          redirect_url?: string | null
          submit_button_text?: string | null
          success_message?: string | null
          theme_settings?: Json | null
          updated_at?: string
        }
        Update: {
          allow_multiple_submissions?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          redirect_url?: string | null
          submit_button_text?: string | null
          success_message?: string | null
          theme_settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      gewerke: {
        Row: {
          beschreibung: string | null
          created_at: string | null
          farbe: string | null
          icon_name: string | null
          id: string
          ist_aktiv: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          beschreibung?: string | null
          created_at?: string | null
          farbe?: string | null
          icon_name?: string | null
          id?: string
          ist_aktiv?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          beschreibung?: string | null
          created_at?: string | null
          farbe?: string | null
          icon_name?: string | null
          id?: string
          ist_aktiv?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      here_route_cache: {
        Row: {
          calculated_at: string
          created_at: string
          destination_hash: string
          distance_km: number
          duration_minutes: number
          id: string
          origin_hash: string
          updated_at: string
        }
        Insert: {
          calculated_at?: string
          created_at?: string
          destination_hash: string
          distance_km: number
          duration_minutes: number
          id?: string
          origin_hash: string
          updated_at?: string
        }
        Update: {
          calculated_at?: string
          created_at?: string
          destination_hash?: string
          distance_km?: number
          duration_minutes?: number
          id?: string
          origin_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      hersteller: {
        Row: {
          beschreibung: string | null
          created_at: string | null
          id: string
          ist_aktiv: boolean | null
          logo_url: string | null
          name: string
          sort_order: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          beschreibung?: string | null
          created_at?: string | null
          id?: string
          ist_aktiv?: boolean | null
          logo_url?: string | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          beschreibung?: string | null
          created_at?: string | null
          id?: string
          ist_aktiv?: boolean | null
          logo_url?: string | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      hv_verfuegbarkeiten: {
        Row: {
          created_at: string | null
          end_zeit: string
          google_calendar_id: string | null
          gueltig_bis: string | null
          gueltig_von: string | null
          id: string
          ist_aktiv: boolean | null
          max_teilnehmer: number | null
          mitarbeiter_id: string
          produkt_id: string
          start_zeit: string
          termin_dauer_minuten: number | null
          updated_at: string | null
          wochentag: number
        }
        Insert: {
          created_at?: string | null
          end_zeit: string
          google_calendar_id?: string | null
          gueltig_bis?: string | null
          gueltig_von?: string | null
          id?: string
          ist_aktiv?: boolean | null
          max_teilnehmer?: number | null
          mitarbeiter_id: string
          produkt_id: string
          start_zeit: string
          termin_dauer_minuten?: number | null
          updated_at?: string | null
          wochentag: number
        }
        Update: {
          created_at?: string | null
          end_zeit?: string
          google_calendar_id?: string | null
          gueltig_bis?: string | null
          gueltig_von?: string | null
          id?: string
          ist_aktiv?: boolean | null
          max_teilnehmer?: number | null
          mitarbeiter_id?: string
          produkt_id?: string
          start_zeit?: string
          termin_dauer_minuten?: number | null
          updated_at?: string | null
          wochentag?: number
        }
        Relationships: [
          {
            foreignKeyName: "hv_verfuegbarkeiten_mitarbeiter_id_fkey"
            columns: ["mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hv_verfuegbarkeiten_produkt_id_fkey"
            columns: ["produkt_id"]
            isOneToOne: false
            referencedRelation: "shop_produkte"
            referencedColumns: ["id"]
          },
        ]
      }
      immobilien_exposes: {
        Row: {
          adresse_hausnummer: string | null
          adresse_ort: string
          adresse_plz: string
          adresse_strasse: string
          akquise_datum: string
          baujahr: number | null
          beschreibung: string | null
          besichtigung_datum: string | null
          created_at: string
          eigentuemer_email: string | null
          eigentuemer_name: string | null
          eigentuemer_telefon: string | null
          grundstueck_qm: number | null
          id: string
          lead_id: string | null
          mitarbeiter_id: string | null
          notizen: string | null
          objekttyp: string
          provision_prozent: number | null
          status: Database["public"]["Enums"]["immobilien_status_enum"] | null
          titel: string
          updated_at: string
          verkauf_datum: string | null
          verkaufspreis: number | null
          wohnflaeche_qm: number | null
          zimmer_anzahl: number | null
        }
        Insert: {
          adresse_hausnummer?: string | null
          adresse_ort: string
          adresse_plz: string
          adresse_strasse: string
          akquise_datum?: string
          baujahr?: number | null
          beschreibung?: string | null
          besichtigung_datum?: string | null
          created_at?: string
          eigentuemer_email?: string | null
          eigentuemer_name?: string | null
          eigentuemer_telefon?: string | null
          grundstueck_qm?: number | null
          id?: string
          lead_id?: string | null
          mitarbeiter_id?: string | null
          notizen?: string | null
          objekttyp?: string
          provision_prozent?: number | null
          status?: Database["public"]["Enums"]["immobilien_status_enum"] | null
          titel: string
          updated_at?: string
          verkauf_datum?: string | null
          verkaufspreis?: number | null
          wohnflaeche_qm?: number | null
          zimmer_anzahl?: number | null
        }
        Update: {
          adresse_hausnummer?: string | null
          adresse_ort?: string
          adresse_plz?: string
          adresse_strasse?: string
          akquise_datum?: string
          baujahr?: number | null
          beschreibung?: string | null
          besichtigung_datum?: string | null
          created_at?: string
          eigentuemer_email?: string | null
          eigentuemer_name?: string | null
          eigentuemer_telefon?: string | null
          grundstueck_qm?: number | null
          id?: string
          lead_id?: string | null
          mitarbeiter_id?: string | null
          notizen?: string | null
          objekttyp?: string
          provision_prozent?: number | null
          status?: Database["public"]["Enums"]["immobilien_status_enum"] | null
          titel?: string
          updated_at?: string
          verkauf_datum?: string | null
          verkaufspreis?: number | null
          wohnflaeche_qm?: number | null
          zimmer_anzahl?: number | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          used_at?: string | null
        }
        Relationships: []
      }
      kombi_artikel_bestandteile: {
        Row: {
          bestandteil_id: string
          created_at: string
          id: string
          kombi_artikel_id: string
          menge: number
        }
        Insert: {
          bestandteil_id: string
          created_at?: string
          id?: string
          kombi_artikel_id: string
          menge?: number
        }
        Update: {
          bestandteil_id?: string
          created_at?: string
          id?: string
          kombi_artikel_id?: string
          menge?: number
        }
        Relationships: [
          {
            foreignKeyName: "kombi_artikel_bestandteile_bestandteil_id_fkey"
            columns: ["bestandteil_id"]
            isOneToOne: false
            referencedRelation: "produkte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kombi_artikel_bestandteile_bestandteil_id_fkey"
            columns: ["bestandteil_id"]
            isOneToOne: false
            referencedRelation: "produkte_katalog_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kombi_artikel_bestandteile_kombi_artikel_id_fkey"
            columns: ["kombi_artikel_id"]
            isOneToOne: false
            referencedRelation: "produkte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kombi_artikel_bestandteile_kombi_artikel_id_fkey"
            columns: ["kombi_artikel_id"]
            isOneToOne: false
            referencedRelation: "produkte_katalog_view"
            referencedColumns: ["id"]
          },
        ]
      }
      kombiprojekt_tracking: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kombiprojekt_lead_id: string
          original_lead_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kombiprojekt_lead_id: string
          original_lead_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kombiprojekt_lead_id?: string
          original_lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kombiprojekt_tracking_kombiprojekt_lead_id_fkey"
            columns: ["kombiprojekt_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kombiprojekt_tracking_kombiprojekt_lead_id_fkey"
            columns: ["kombiprojekt_lead_id"]
            isOneToOne: false
            referencedRelation: "leads_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kombiprojekt_tracking_original_lead_id_fkey"
            columns: ["original_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kombiprojekt_tracking_original_lead_id_fkey"
            columns: ["original_lead_id"]
            isOneToOne: false
            referencedRelation: "leads_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      kunden: {
        Row: {
          aftersales_letzter_kontakt: string | null
          aftersales_naechste_wiedervorlage: string | null
          aftersales_potenzial_euro: number | null
          aftersales_status:
            | Database["public"]["Enums"]["aftersales_status_enum"]
            | null
          aftersales_substatus:
            | Database["public"]["Enums"]["aftersales_substatus_enum"]
            | null
          ansprechpartner: string
          created_at: string
          email: string | null
          firmenname: string | null
          id: string
          lieferadresse_geocoded_at: string | null
          lieferadresse_hash: string | null
          lieferadresse_hausnummer: string | null
          lieferadresse_lat: number | null
          lieferadresse_lng: number | null
          lieferadresse_ort: string | null
          lieferadresse_plz: string | null
          lieferadresse_strasse: string | null
          linked_autargy_kunde_id: string | null
          mitarbeiter_id: string | null
          notizen: string | null
          rechnungsadresse_geocoded_at: string | null
          rechnungsadresse_hash: string | null
          rechnungsadresse_hausnummer: string
          rechnungsadresse_lat: number | null
          rechnungsadresse_lng: number | null
          rechnungsadresse_ort: string
          rechnungsadresse_plz: string
          rechnungsadresse_strasse: string
          sentiment: number | null
          telefon: string | null
          updated_at: string
          upsales_letzter_kontakt: string | null
          upsales_naechste_wiedervorlage: string | null
          upsales_potenzial_euro: number | null
          upsales_status:
            | Database["public"]["Enums"]["upsales_status_enum"]
            | null
          upsales_substatus:
            | Database["public"]["Enums"]["upsales_substatus_enum"]
            | null
        }
        Insert: {
          aftersales_letzter_kontakt?: string | null
          aftersales_naechste_wiedervorlage?: string | null
          aftersales_potenzial_euro?: number | null
          aftersales_status?:
            | Database["public"]["Enums"]["aftersales_status_enum"]
            | null
          aftersales_substatus?:
            | Database["public"]["Enums"]["aftersales_substatus_enum"]
            | null
          ansprechpartner: string
          created_at?: string
          email?: string | null
          firmenname?: string | null
          id?: string
          lieferadresse_geocoded_at?: string | null
          lieferadresse_hash?: string | null
          lieferadresse_hausnummer?: string | null
          lieferadresse_lat?: number | null
          lieferadresse_lng?: number | null
          lieferadresse_ort?: string | null
          lieferadresse_plz?: string | null
          lieferadresse_strasse?: string | null
          linked_autargy_kunde_id?: string | null
          mitarbeiter_id?: string | null
          notizen?: string | null
          rechnungsadresse_geocoded_at?: string | null
          rechnungsadresse_hash?: string | null
          rechnungsadresse_hausnummer: string
          rechnungsadresse_lat?: number | null
          rechnungsadresse_lng?: number | null
          rechnungsadresse_ort: string
          rechnungsadresse_plz: string
          rechnungsadresse_strasse: string
          sentiment?: number | null
          telefon?: string | null
          updated_at?: string
          upsales_letzter_kontakt?: string | null
          upsales_naechste_wiedervorlage?: string | null
          upsales_potenzial_euro?: number | null
          upsales_status?:
            | Database["public"]["Enums"]["upsales_status_enum"]
            | null
          upsales_substatus?:
            | Database["public"]["Enums"]["upsales_substatus_enum"]
            | null
        }
        Update: {
          aftersales_letzter_kontakt?: string | null
          aftersales_naechste_wiedervorlage?: string | null
          aftersales_potenzial_euro?: number | null
          aftersales_status?:
            | Database["public"]["Enums"]["aftersales_status_enum"]
            | null
          aftersales_substatus?:
            | Database["public"]["Enums"]["aftersales_substatus_enum"]
            | null
          ansprechpartner?: string
          created_at?: string
          email?: string | null
          firmenname?: string | null
          id?: string
          lieferadresse_geocoded_at?: string | null
          lieferadresse_hash?: string | null
          lieferadresse_hausnummer?: string | null
          lieferadresse_lat?: number | null
          lieferadresse_lng?: number | null
          lieferadresse_ort?: string | null
          lieferadresse_plz?: string | null
          lieferadresse_strasse?: string | null
          linked_autargy_kunde_id?: string | null
          mitarbeiter_id?: string | null
          notizen?: string | null
          rechnungsadresse_geocoded_at?: string | null
          rechnungsadresse_hash?: string | null
          rechnungsadresse_hausnummer?: string
          rechnungsadresse_lat?: number | null
          rechnungsadresse_lng?: number | null
          rechnungsadresse_ort?: string
          rechnungsadresse_plz?: string
          rechnungsadresse_strasse?: string
          sentiment?: number | null
          telefon?: string | null
          updated_at?: string
          upsales_letzter_kontakt?: string | null
          upsales_naechste_wiedervorlage?: string | null
          upsales_potenzial_euro?: number | null
          upsales_status?:
            | Database["public"]["Enums"]["upsales_status_enum"]
            | null
          upsales_substatus?:
            | Database["public"]["Enums"]["upsales_substatus_enum"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "kunden_linked_autargy_kunde_id_fkey"
            columns: ["linked_autargy_kunde_id"]
            isOneToOne: false
            referencedRelation: "b2c_autargy_kunden"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kunden_mitarbeiter_id_fkey"
            columns: ["mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
        ]
      }
      lagerbestaende: {
        Row: {
          created_at: string | null
          id: string
          lagerort_id: string
          letzte_inventur: string | null
          menge: number | null
          produkt_id: string
          reserviert: number | null
          updated_at: string | null
          verfuegbar: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lagerort_id: string
          letzte_inventur?: string | null
          menge?: number | null
          produkt_id: string
          reserviert?: number | null
          updated_at?: string | null
          verfuegbar?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lagerort_id?: string
          letzte_inventur?: string | null
          menge?: number | null
          produkt_id?: string
          reserviert?: number | null
          updated_at?: string | null
          verfuegbar?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lagerbestaende_lagerort_id_fkey"
            columns: ["lagerort_id"]
            isOneToOne: false
            referencedRelation: "lagerorte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lagerbestaende_produkt_id_fkey"
            columns: ["produkt_id"]
            isOneToOne: false
            referencedRelation: "produkte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lagerbestaende_produkt_id_fkey"
            columns: ["produkt_id"]
            isOneToOne: false
            referencedRelation: "produkte_katalog_view"
            referencedColumns: ["id"]
          },
        ]
      }
      lagerbewegungen: {
        Row: {
          bestand_nachher: number | null
          bestand_vorher: number | null
          bewegungstyp: string
          created_at: string | null
          durchgefuehrt_am: string | null
          durchgefuehrt_von: string | null
          grund: string | null
          id: string
          lagerort_id: string
          menge: number
          produkt_id: string
          referenz_id: string | null
          referenz_typ: string | null
        }
        Insert: {
          bestand_nachher?: number | null
          bestand_vorher?: number | null
          bewegungstyp: string
          created_at?: string | null
          durchgefuehrt_am?: string | null
          durchgefuehrt_von?: string | null
          grund?: string | null
          id?: string
          lagerort_id: string
          menge: number
          produkt_id: string
          referenz_id?: string | null
          referenz_typ?: string | null
        }
        Update: {
          bestand_nachher?: number | null
          bestand_vorher?: number | null
          bewegungstyp?: string
          created_at?: string | null
          durchgefuehrt_am?: string | null
          durchgefuehrt_von?: string | null
          grund?: string | null
          id?: string
          lagerort_id?: string
          menge?: number
          produkt_id?: string
          referenz_id?: string | null
          referenz_typ?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lagerbewegungen_lagerort_id_fkey"
            columns: ["lagerort_id"]
            isOneToOne: false
            referencedRelation: "lagerorte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lagerbewegungen_produkt_id_fkey"
            columns: ["produkt_id"]
            isOneToOne: false
            referencedRelation: "produkte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lagerbewegungen_produkt_id_fkey"
            columns: ["produkt_id"]
            isOneToOne: false
            referencedRelation: "produkte_katalog_view"
            referencedColumns: ["id"]
          },
        ]
      }
      lagerorte: {
        Row: {
          adresse: string | null
          beschreibung: string | null
          created_at: string | null
          id: string
          ist_aktiv: boolean | null
          ist_hauptlager: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          adresse?: string | null
          beschreibung?: string | null
          created_at?: string | null
          id?: string
          ist_aktiv?: boolean | null
          ist_hauptlager?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          adresse?: string | null
          beschreibung?: string | null
          created_at?: string | null
          id?: string
          ist_aktiv?: boolean | null
          ist_hauptlager?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lead_arten: {
        Row: {
          aktiv: boolean
          beschreibung: string | null
          created_at: string
          id: string
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          aktiv?: boolean
          beschreibung?: string | null
          created_at?: string
          id?: string
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          aktiv?: boolean
          beschreibung?: string | null
          created_at?: string
          id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      lead_assignment_log: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          assignment_type: string
          bestellung_id: string
          id: string
          lead_id: string
          notes: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_type?: string
          bestellung_id: string
          id?: string
          lead_id: string
          notes?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_type?: string
          bestellung_id?: string
          id?: string
          lead_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignment_log_bestellung_id_fkey"
            columns: ["bestellung_id"]
            isOneToOne: false
            referencedRelation: "lead_bestellungen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignment_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignment_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_bestellungen: {
        Row: {
          bestellnummer: string
          bestellungs_name: string | null
          created_at: string | null
          created_by: string | null
          end_datum: string | null
          form_id: string | null
          gebiet_config: Json | null
          gebiet_typ: string
          gesamt_betrag: number
          id: string
          is_d2d_campaign: boolean
          is_d2d_pool: boolean
          kontingent_gesamt: number
          kontingent_typ: string
          laufzeit_anzahl: number | null
          laufzeit_einheit: string | null
          lead_art_id: string | null
          leadquelle_id: string
          leads_geliefert: number | null
          notizen: string | null
          start_datum: string
          status: string
          updated_at: string | null
          vereinbarter_preis_pro_lead: number
        }
        Insert: {
          bestellnummer: string
          bestellungs_name?: string | null
          created_at?: string | null
          created_by?: string | null
          end_datum?: string | null
          form_id?: string | null
          gebiet_config?: Json | null
          gebiet_typ?: string
          gesamt_betrag: number
          id?: string
          is_d2d_campaign?: boolean
          is_d2d_pool?: boolean
          kontingent_gesamt: number
          kontingent_typ: string
          laufzeit_anzahl?: number | null
          laufzeit_einheit?: string | null
          lead_art_id?: string | null
          leadquelle_id: string
          leads_geliefert?: number | null
          notizen?: string | null
          start_datum: string
          status?: string
          updated_at?: string | null
          vereinbarter_preis_pro_lead: number
        }
        Update: {
          bestellnummer?: string
          bestellungs_name?: string | null
          created_at?: string | null
          created_by?: string | null
          end_datum?: string | null
          form_id?: string | null
          gebiet_config?: Json | null
          gebiet_typ?: string
          gesamt_betrag?: number
          id?: string
          is_d2d_campaign?: boolean
          is_d2d_pool?: boolean
          kontingent_gesamt?: number
          kontingent_typ?: string
          laufzeit_anzahl?: number | null
          laufzeit_einheit?: string | null
          lead_art_id?: string | null
          leadquelle_id?: string
          leads_geliefert?: number | null
          notizen?: string | null
          start_datum?: string
          status?: string
          updated_at?: string | null
          vereinbarter_preis_pro_lead?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_bestellungen_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_bestellungen_lead_art_id_fkey"
            columns: ["lead_art_id"]
            isOneToOne: false
            referencedRelation: "lead_arten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_bestellungen_leadquelle_id_fkey"
            columns: ["leadquelle_id"]
            isOneToOne: false
            referencedRelation: "leadquellen"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_broker_rechnungen: {
        Row: {
          abweichung_betrag: number | null
          abweichung_prozent: number | null
          analysiert_am: string | null
          analysiert_daten: Json | null
          bestellung_id: string | null
          created_at: string
          created_by: string | null
          datei_url: string | null
          faelligkeitsdatum: string | null
          id: string
          lead_anzahl_kalkulation: number | null
          lead_anzahl_rechnung: number | null
          leadquelle_id: string
          monat: string
          mwst_prozent: number | null
          rechnungsbetrag_brutto: number | null
          rechnungsbetrag_netto: number | null
          rechnungsdatum: string | null
          rechnungsnummer: string | null
          status: string
          updated_at: string
        }
        Insert: {
          abweichung_betrag?: number | null
          abweichung_prozent?: number | null
          analysiert_am?: string | null
          analysiert_daten?: Json | null
          bestellung_id?: string | null
          created_at?: string
          created_by?: string | null
          datei_url?: string | null
          faelligkeitsdatum?: string | null
          id?: string
          lead_anzahl_kalkulation?: number | null
          lead_anzahl_rechnung?: number | null
          leadquelle_id: string
          monat: string
          mwst_prozent?: number | null
          rechnungsbetrag_brutto?: number | null
          rechnungsbetrag_netto?: number | null
          rechnungsdatum?: string | null
          rechnungsnummer?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          abweichung_betrag?: number | null
          abweichung_prozent?: number | null
          analysiert_am?: string | null
          analysiert_daten?: Json | null
          bestellung_id?: string | null
          created_at?: string
          created_by?: string | null
          datei_url?: string | null
          faelligkeitsdatum?: string | null
          id?: string
          lead_anzahl_kalkulation?: number | null
          lead_anzahl_rechnung?: number | null
          leadquelle_id?: string
          monat?: string
          mwst_prozent?: number | null
          rechnungsbetrag_brutto?: number | null
          rechnungsbetrag_netto?: number | null
          rechnungsdatum?: string | null
          rechnungsnummer?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_broker_rechnungen_bestellung_id_fkey"
            columns: ["bestellung_id"]
            isOneToOne: false
            referencedRelation: "lead_bestellungen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_broker_rechnungen_leadquelle_id_fkey"
            columns: ["leadquelle_id"]
            isOneToOne: false
            referencedRelation: "leadquellen"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_deal_calculations: {
        Row: {
          auftrag_id: string
          calculated_deal_price: number
          created_at: string
          deal_percentage: number
          id: string
          is_active: boolean
          lead_id: string
          netto_auftragssumme: number
          original_leadpreis: number | null
          triggered_at: string
          triggered_by_status: string
          updated_at: string
        }
        Insert: {
          auftrag_id: string
          calculated_deal_price: number
          created_at?: string
          deal_percentage: number
          id?: string
          is_active?: boolean
          lead_id: string
          netto_auftragssumme: number
          original_leadpreis?: number | null
          triggered_at?: string
          triggered_by_status: string
          updated_at?: string
        }
        Update: {
          auftrag_id?: string
          calculated_deal_price?: number
          created_at?: string
          deal_percentage?: number
          id?: string
          is_active?: boolean
          lead_id?: string
          netto_auftragssumme?: number
          original_leadpreis?: number | null
          triggered_at?: string
          triggered_by_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_deal_calculations_auftrag_id_fkey"
            columns: ["auftrag_id"]
            isOneToOne: false
            referencedRelation: "auftraege"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_deal_calculations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_deal_calculations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_interactions: {
        Row: {
          content: string | null
          created_at: string
          id: string
          interaction_type:
            | Database["public"]["Enums"]["interaction_type_enum"]
            | null
          lead_id: string | null
          mitarbeiter_id: string | null
          referenz_nummer: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          interaction_type?:
            | Database["public"]["Enums"]["interaction_type_enum"]
            | null
          lead_id?: string | null
          mitarbeiter_id?: string | null
          referenz_nummer?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          interaction_type?:
            | Database["public"]["Enums"]["interaction_type_enum"]
            | null
          lead_id?: string | null
          mitarbeiter_id?: string | null
          referenz_nummer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_interactions_mitarbeiter_id_fkey"
            columns: ["mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_interactions_referenz_nummer_fkey"
            columns: ["referenz_nummer"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["referenz_nummer"]
          },
          {
            foreignKeyName: "lead_interactions_referenz_nummer_fkey"
            columns: ["referenz_nummer"]
            isOneToOne: false
            referencedRelation: "leads_with_details"
            referencedColumns: ["referenz_nummer"]
          },
        ]
      }
      lead_price_fix_backup: {
        Row: {
          auftrag_id: string | null
          auftrag_status: Database["public"]["Enums"]["auftrag_status"] | null
          backup_created_at: string | null
          lead_id: string | null
          leadquelle_id: string | null
          leadquelle_name: string | null
          original_leadpreis: number | null
          preis_eingabe_modus: string | null
        }
        Insert: {
          auftrag_id?: string | null
          auftrag_status?: Database["public"]["Enums"]["auftrag_status"] | null
          backup_created_at?: string | null
          lead_id?: string | null
          leadquelle_id?: string | null
          leadquelle_name?: string | null
          original_leadpreis?: number | null
          preis_eingabe_modus?: string | null
        }
        Update: {
          auftrag_id?: string | null
          auftrag_status?: Database["public"]["Enums"]["auftrag_status"] | null
          backup_created_at?: string | null
          lead_id?: string | null
          leadquelle_id?: string | null
          leadquelle_name?: string | null
          original_leadpreis?: number | null
          preis_eingabe_modus?: string | null
        }
        Relationships: []
      }
      lead_reklamationen: {
        Row: {
          bestellung_id: string
          created_at: string
          erstattung_ausgezahlt_am: string | null
          erstattung_methode:
            | Database["public"]["Enums"]["erstattung_methode_enum"]
            | null
          erstattungsbetrag: number | null
          id: string
          interne_notizen: string | null
          lead_id: string
          loesung_status: Database["public"]["Enums"]["loesung_status_enum"]
          loesung_typ: Database["public"]["Enums"]["reklamations_loesung_enum"]
          nachlieferung_erfolgt_am: string | null
          nachlieferung_lead_ids: string[] | null
          reklamations_datum: string
          reklamations_grund: string | null
          storno_beantragt_am: string | null
          storno_beantragt_von: string | null
          storno_bearbeitet_am: string | null
          storno_bearbeitet_von: string | null
          storno_status: Database["public"]["Enums"]["storno_status_enum"]
          updated_at: string
        }
        Insert: {
          bestellung_id: string
          created_at?: string
          erstattung_ausgezahlt_am?: string | null
          erstattung_methode?:
            | Database["public"]["Enums"]["erstattung_methode_enum"]
            | null
          erstattungsbetrag?: number | null
          id?: string
          interne_notizen?: string | null
          lead_id: string
          loesung_status?: Database["public"]["Enums"]["loesung_status_enum"]
          loesung_typ?: Database["public"]["Enums"]["reklamations_loesung_enum"]
          nachlieferung_erfolgt_am?: string | null
          nachlieferung_lead_ids?: string[] | null
          reklamations_datum?: string
          reklamations_grund?: string | null
          storno_beantragt_am?: string | null
          storno_beantragt_von?: string | null
          storno_bearbeitet_am?: string | null
          storno_bearbeitet_von?: string | null
          storno_status?: Database["public"]["Enums"]["storno_status_enum"]
          updated_at?: string
        }
        Update: {
          bestellung_id?: string
          created_at?: string
          erstattung_ausgezahlt_am?: string | null
          erstattung_methode?:
            | Database["public"]["Enums"]["erstattung_methode_enum"]
            | null
          erstattungsbetrag?: number | null
          id?: string
          interne_notizen?: string | null
          lead_id?: string
          loesung_status?: Database["public"]["Enums"]["loesung_status_enum"]
          loesung_typ?: Database["public"]["Enums"]["reklamations_loesung_enum"]
          nachlieferung_erfolgt_am?: string | null
          nachlieferung_lead_ids?: string[] | null
          reklamations_datum?: string
          reklamations_grund?: string | null
          storno_beantragt_am?: string | null
          storno_beantragt_von?: string | null
          storno_bearbeitet_am?: string | null
          storno_bearbeitet_von?: string | null
          storno_status?: Database["public"]["Enums"]["storno_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_reklamationen_bestellung_id_fkey"
            columns: ["bestellung_id"]
            isOneToOne: false
            referencedRelation: "lead_bestellungen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_reklamationen_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_reklamationen_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_reklamationen_storno_beantragt_von_fkey"
            columns: ["storno_beantragt_von"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_reklamationen_storno_bearbeitet_von_fkey"
            columns: ["storno_bearbeitet_von"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_status_history: {
        Row: {
          assigned_mitarbeiter_id: string | null
          assigned_mitarbeiter_id_new: string | null
          assigned_mitarbeiter_id_old: string | null
          assigned_mitarbeiter_name: string | null
          assigned_mitarbeiter_name_new: string | null
          assigned_mitarbeiter_name_old: string | null
          change_trigger: string | null
          changed_at: string
          changed_by: string | null
          changed_by_name: string | null
          changed_by_source: string | null
          created_at: string
          id: string
          lead_id: string
          new_status: Database["public"]["Enums"]["lead_status_enum"]
          new_thc_status: Database["public"]["Enums"]["thc_status_enum"] | null
          old_status: Database["public"]["Enums"]["lead_status_enum"] | null
          old_thc_status: Database["public"]["Enums"]["thc_status_enum"] | null
        }
        Insert: {
          assigned_mitarbeiter_id?: string | null
          assigned_mitarbeiter_id_new?: string | null
          assigned_mitarbeiter_id_old?: string | null
          assigned_mitarbeiter_name?: string | null
          assigned_mitarbeiter_name_new?: string | null
          assigned_mitarbeiter_name_old?: string | null
          change_trigger?: string | null
          changed_at?: string
          changed_by?: string | null
          changed_by_name?: string | null
          changed_by_source?: string | null
          created_at?: string
          id?: string
          lead_id: string
          new_status: Database["public"]["Enums"]["lead_status_enum"]
          new_thc_status?: Database["public"]["Enums"]["thc_status_enum"] | null
          old_status?: Database["public"]["Enums"]["lead_status_enum"] | null
          old_thc_status?: Database["public"]["Enums"]["thc_status_enum"] | null
        }
        Update: {
          assigned_mitarbeiter_id?: string | null
          assigned_mitarbeiter_id_new?: string | null
          assigned_mitarbeiter_id_old?: string | null
          assigned_mitarbeiter_name?: string | null
          assigned_mitarbeiter_name_new?: string | null
          assigned_mitarbeiter_name_old?: string | null
          change_trigger?: string | null
          changed_at?: string
          changed_by?: string | null
          changed_by_name?: string | null
          changed_by_source?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          new_status?: Database["public"]["Enums"]["lead_status_enum"]
          new_thc_status?: Database["public"]["Enums"]["thc_status_enum"] | null
          old_status?: Database["public"]["Enums"]["lead_status_enum"] | null
          old_thc_status?: Database["public"]["Enums"]["thc_status_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_status_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_status_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_status_history_backup: {
        Row: {
          assigned_mitarbeiter_id_new: string | null
          assigned_mitarbeiter_id_old: string | null
          assigned_mitarbeiter_name_new: string | null
          assigned_mitarbeiter_name_old: string | null
          backup_created_at: string | null
          backup_reason: string | null
          change_trigger: string | null
          changed_at: string | null
          changed_by: string | null
          changed_by_name: string | null
          changed_by_source: string | null
          id: string
          lead_id: string | null
          new_status: Database["public"]["Enums"]["lead_status_enum"] | null
          new_thc_status: Database["public"]["Enums"]["thc_status_enum"] | null
          old_status: Database["public"]["Enums"]["lead_status_enum"] | null
          old_thc_status: Database["public"]["Enums"]["thc_status_enum"] | null
        }
        Insert: {
          assigned_mitarbeiter_id_new?: string | null
          assigned_mitarbeiter_id_old?: string | null
          assigned_mitarbeiter_name_new?: string | null
          assigned_mitarbeiter_name_old?: string | null
          backup_created_at?: string | null
          backup_reason?: string | null
          change_trigger?: string | null
          changed_at?: string | null
          changed_by?: string | null
          changed_by_name?: string | null
          changed_by_source?: string | null
          id?: string
          lead_id?: string | null
          new_status?: Database["public"]["Enums"]["lead_status_enum"] | null
          new_thc_status?: Database["public"]["Enums"]["thc_status_enum"] | null
          old_status?: Database["public"]["Enums"]["lead_status_enum"] | null
          old_thc_status?: Database["public"]["Enums"]["thc_status_enum"] | null
        }
        Update: {
          assigned_mitarbeiter_id_new?: string | null
          assigned_mitarbeiter_id_old?: string | null
          assigned_mitarbeiter_name_new?: string | null
          assigned_mitarbeiter_name_old?: string | null
          backup_created_at?: string | null
          backup_reason?: string | null
          change_trigger?: string | null
          changed_at?: string | null
          changed_by?: string | null
          changed_by_name?: string | null
          changed_by_source?: string | null
          id?: string
          lead_id?: string | null
          new_status?: Database["public"]["Enums"]["lead_status_enum"] | null
          new_thc_status?: Database["public"]["Enums"]["thc_status_enum"] | null
          old_status?: Database["public"]["Enums"]["lead_status_enum"] | null
          old_thc_status?: Database["public"]["Enums"]["thc_status_enum"] | null
        }
        Relationships: []
      }
      lead_status_history_backup_migration: {
        Row: {
          assigned_mitarbeiter_id_new: string | null
          assigned_mitarbeiter_id_old: string | null
          assigned_mitarbeiter_name_new: string | null
          assigned_mitarbeiter_name_old: string | null
          backup_created_at: string | null
          backup_reason: string | null
          change_trigger: string | null
          changed_at: string | null
          changed_by: string | null
          changed_by_name: string | null
          changed_by_source: string | null
          id: string | null
          lead_id: string | null
          new_thc_status: Database["public"]["Enums"]["thc_status_enum"] | null
          old_thc_status: Database["public"]["Enums"]["thc_status_enum"] | null
        }
        Insert: {
          assigned_mitarbeiter_id_new?: string | null
          assigned_mitarbeiter_id_old?: string | null
          assigned_mitarbeiter_name_new?: string | null
          assigned_mitarbeiter_name_old?: string | null
          backup_created_at?: string | null
          backup_reason?: string | null
          change_trigger?: string | null
          changed_at?: string | null
          changed_by?: string | null
          changed_by_name?: string | null
          changed_by_source?: string | null
          id?: string | null
          lead_id?: string | null
          new_thc_status?: Database["public"]["Enums"]["thc_status_enum"] | null
          old_thc_status?: Database["public"]["Enums"]["thc_status_enum"] | null
        }
        Update: {
          assigned_mitarbeiter_id_new?: string | null
          assigned_mitarbeiter_id_old?: string | null
          assigned_mitarbeiter_name_new?: string | null
          assigned_mitarbeiter_name_old?: string | null
          backup_created_at?: string | null
          backup_reason?: string | null
          change_trigger?: string | null
          changed_at?: string | null
          changed_by?: string | null
          changed_by_name?: string | null
          changed_by_source?: string | null
          id?: string | null
          lead_id?: string | null
          new_thc_status?: Database["public"]["Enums"]["thc_status_enum"] | null
          old_thc_status?: Database["public"]["Enums"]["thc_status_enum"] | null
        }
        Relationships: []
      }
      lead_verluste: {
        Row: {
          abzug_betrag: number
          created_at: string
          id: string
          mitarbeiter_id: string
          typ: Database["public"]["Enums"]["lead_verlust_typ"]
          verfalls_datum: string | null
          verlust_datum: string
        }
        Insert: {
          abzug_betrag: number
          created_at?: string
          id?: string
          mitarbeiter_id: string
          typ: Database["public"]["Enums"]["lead_verlust_typ"]
          verfalls_datum?: string | null
          verlust_datum: string
        }
        Update: {
          abzug_betrag?: number
          created_at?: string
          id?: string
          mitarbeiter_id?: string
          typ?: Database["public"]["Enums"]["lead_verlust_typ"]
          verfalls_datum?: string | null
          verlust_datum?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_verluste_mitarbeiter_id_fkey"
            columns: ["mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
        ]
      }
      leadquellen: {
        Row: {
          adresse: string | null
          aktiv: boolean
          ansprechpartner: string | null
          beschreibung: string | null
          created_at: string
          email: string | null
          id: string
          is_d2d_broker: boolean | null
          kontaktperson: string | null
          name: string
          notizen: string | null
          parent_leadquelle_id: string | null
          preis_eingabe_modus: string
          telefon: string | null
          updated_at: string
          website: string | null
          zoho_crm_id: string | null
        }
        Insert: {
          adresse?: string | null
          aktiv?: boolean
          ansprechpartner?: string | null
          beschreibung?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_d2d_broker?: boolean | null
          kontaktperson?: string | null
          name: string
          notizen?: string | null
          parent_leadquelle_id?: string | null
          preis_eingabe_modus?: string
          telefon?: string | null
          updated_at?: string
          website?: string | null
          zoho_crm_id?: string | null
        }
        Update: {
          adresse?: string | null
          aktiv?: boolean
          ansprechpartner?: string | null
          beschreibung?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_d2d_broker?: boolean | null
          kontaktperson?: string | null
          name?: string
          notizen?: string | null
          parent_leadquelle_id?: string | null
          preis_eingabe_modus?: string
          telefon?: string | null
          updated_at?: string
          website?: string | null
          zoho_crm_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leadquellen_parent_leadquelle_id_fkey"
            columns: ["parent_leadquelle_id"]
            isOneToOne: false
            referencedRelation: "leadquellen"
            referencedColumns: ["id"]
          },
        ]
      }
      leadquellen_preisliste: {
        Row: {
          aktiv: boolean
          auftrag_basiert: boolean | null
          beschreibung: string | null
          created_at: string
          deal_percentage: number | null
          gueltig_bis: string | null
          gueltig_von: string
          id: string
          is_deal_pricing: boolean | null
          lead_art_id: string | null
          leadquelle_id: string
          mitarbeiter_typ_filter: Database["public"]["Enums"]["mitarbeiter_typ_filter"]
          preis_pro_lead: number
          projektarten_filter:
            | Database["public"]["Enums"]["projektart_enum"][]
            | null
          trigger_pipeline: string | null
          trigger_status: string[] | null
          updated_at: string
        }
        Insert: {
          aktiv?: boolean
          auftrag_basiert?: boolean | null
          beschreibung?: string | null
          created_at?: string
          deal_percentage?: number | null
          gueltig_bis?: string | null
          gueltig_von?: string
          id?: string
          is_deal_pricing?: boolean | null
          lead_art_id?: string | null
          leadquelle_id: string
          mitarbeiter_typ_filter?: Database["public"]["Enums"]["mitarbeiter_typ_filter"]
          preis_pro_lead?: number
          projektarten_filter?:
            | Database["public"]["Enums"]["projektart_enum"][]
            | null
          trigger_pipeline?: string | null
          trigger_status?: string[] | null
          updated_at?: string
        }
        Update: {
          aktiv?: boolean
          auftrag_basiert?: boolean | null
          beschreibung?: string | null
          created_at?: string
          deal_percentage?: number | null
          gueltig_bis?: string | null
          gueltig_von?: string
          id?: string
          is_deal_pricing?: boolean | null
          lead_art_id?: string | null
          leadquelle_id?: string
          mitarbeiter_typ_filter?: Database["public"]["Enums"]["mitarbeiter_typ_filter"]
          preis_pro_lead?: number
          projektarten_filter?:
            | Database["public"]["Enums"]["projektart_enum"][]
            | null
          trigger_pipeline?: string | null
          trigger_status?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leadquellen_preisliste_lead_art_id_fkey"
            columns: ["lead_art_id"]
            isOneToOne: false
            referencedRelation: "lead_arten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadquellen_preisliste_leadquelle_id_fkey"
            columns: ["leadquelle_id"]
            isOneToOne: false
            referencedRelation: "leadquellen"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          abschluss_datum: string | null
          abschluss_wahrscheinlichkeit: number | null
          address_hash: string | null
          automatisch_kunde_erstellt: boolean | null
          bestellung_id: string | null
          campaign_id: string | null
          created_at: string
          erstelldatum_crm: string
          feinaufmass_status:
            | Database["public"]["Enums"]["feinaufmass_status_enum"]
            | null
          form_data: Json | null
          form_id: string | null
          geocoded_at: string | null
          geschaetzter_wert: number | null
          id: string
          ist_firmenkunde: boolean | null
          kontakt_datum: string | null
          kunde_anrede: string | null
          kunde_email: string | null
          kunde_firmenname: string | null
          kunde_hausnummer: string | null
          kunde_id: string | null
          kunde_lat: number | null
          kunde_lng: number | null
          kunde_nachname: string | null
          kunde_ort: string | null
          kunde_plz: string | null
          kunde_strasse: string | null
          kunde_telefon: string | null
          kunde_titel: string | null
          kunde_vorname: string | null
          last_appointment_date: string | null
          lead_art_id: string | null
          lead_art_ids: string[] | null
          lead_datum: string
          lead_name: string
          lead_quelle: string | null
          leadpreis: number | null
          leadquelle_id: string | null
          lieferadresse_hausnummer: string | null
          lieferadresse_lat: number | null
          lieferadresse_lng: number | null
          lieferadresse_ort: string | null
          lieferadresse_plz: string | null
          lieferadresse_strasse: string | null
          location_geo: unknown
          mitarbeiter_id: string
          nettoangebotssumme: number | null
          next_suggested_appointment_date: string | null
          notizen: string | null
          projektart: Database["public"]["Enums"]["projektart_enum"] | null
          referenz_nummer: string | null
          signier_datum_final: string | null
          signier_datum_thc: string | null
          status: Database["public"]["Enums"]["lead_status_enum"] | null
          tatsaechlicher_wert: number | null
          thc_status: Database["public"]["Enums"]["thc_status_enum"] | null
          updated_at: string
        }
        Insert: {
          abschluss_datum?: string | null
          abschluss_wahrscheinlichkeit?: number | null
          address_hash?: string | null
          automatisch_kunde_erstellt?: boolean | null
          bestellung_id?: string | null
          campaign_id?: string | null
          created_at?: string
          erstelldatum_crm?: string
          feinaufmass_status?:
            | Database["public"]["Enums"]["feinaufmass_status_enum"]
            | null
          form_data?: Json | null
          form_id?: string | null
          geocoded_at?: string | null
          geschaetzter_wert?: number | null
          id?: string
          ist_firmenkunde?: boolean | null
          kontakt_datum?: string | null
          kunde_anrede?: string | null
          kunde_email?: string | null
          kunde_firmenname?: string | null
          kunde_hausnummer?: string | null
          kunde_id?: string | null
          kunde_lat?: number | null
          kunde_lng?: number | null
          kunde_nachname?: string | null
          kunde_ort?: string | null
          kunde_plz?: string | null
          kunde_strasse?: string | null
          kunde_telefon?: string | null
          kunde_titel?: string | null
          kunde_vorname?: string | null
          last_appointment_date?: string | null
          lead_art_id?: string | null
          lead_art_ids?: string[] | null
          lead_datum?: string
          lead_name?: string
          lead_quelle?: string | null
          leadpreis?: number | null
          leadquelle_id?: string | null
          lieferadresse_hausnummer?: string | null
          lieferadresse_lat?: number | null
          lieferadresse_lng?: number | null
          lieferadresse_ort?: string | null
          lieferadresse_plz?: string | null
          lieferadresse_strasse?: string | null
          location_geo?: unknown
          mitarbeiter_id: string
          nettoangebotssumme?: number | null
          next_suggested_appointment_date?: string | null
          notizen?: string | null
          projektart?: Database["public"]["Enums"]["projektart_enum"] | null
          referenz_nummer?: string | null
          signier_datum_final?: string | null
          signier_datum_thc?: string | null
          status?: Database["public"]["Enums"]["lead_status_enum"] | null
          tatsaechlicher_wert?: number | null
          thc_status?: Database["public"]["Enums"]["thc_status_enum"] | null
          updated_at?: string
        }
        Update: {
          abschluss_datum?: string | null
          abschluss_wahrscheinlichkeit?: number | null
          address_hash?: string | null
          automatisch_kunde_erstellt?: boolean | null
          bestellung_id?: string | null
          campaign_id?: string | null
          created_at?: string
          erstelldatum_crm?: string
          feinaufmass_status?:
            | Database["public"]["Enums"]["feinaufmass_status_enum"]
            | null
          form_data?: Json | null
          form_id?: string | null
          geocoded_at?: string | null
          geschaetzter_wert?: number | null
          id?: string
          ist_firmenkunde?: boolean | null
          kontakt_datum?: string | null
          kunde_anrede?: string | null
          kunde_email?: string | null
          kunde_firmenname?: string | null
          kunde_hausnummer?: string | null
          kunde_id?: string | null
          kunde_lat?: number | null
          kunde_lng?: number | null
          kunde_nachname?: string | null
          kunde_ort?: string | null
          kunde_plz?: string | null
          kunde_strasse?: string | null
          kunde_telefon?: string | null
          kunde_titel?: string | null
          kunde_vorname?: string | null
          last_appointment_date?: string | null
          lead_art_id?: string | null
          lead_art_ids?: string[] | null
          lead_datum?: string
          lead_name?: string
          lead_quelle?: string | null
          leadpreis?: number | null
          leadquelle_id?: string | null
          lieferadresse_hausnummer?: string | null
          lieferadresse_lat?: number | null
          lieferadresse_lng?: number | null
          lieferadresse_ort?: string | null
          lieferadresse_plz?: string | null
          lieferadresse_strasse?: string | null
          location_geo?: unknown
          mitarbeiter_id?: string
          nettoangebotssumme?: number | null
          next_suggested_appointment_date?: string | null
          notizen?: string | null
          projektart?: Database["public"]["Enums"]["projektart_enum"] | null
          referenz_nummer?: string | null
          signier_datum_final?: string | null
          signier_datum_thc?: string | null
          status?: Database["public"]["Enums"]["lead_status_enum"] | null
          tatsaechlicher_wert?: number | null
          thc_status?: Database["public"]["Enums"]["thc_status_enum"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_bestellung_id_fkey"
            columns: ["bestellung_id"]
            isOneToOne: false
            referencedRelation: "lead_bestellungen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_kunde_id_fkey"
            columns: ["kunde_id"]
            isOneToOne: false
            referencedRelation: "kunden"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_lead_art_id_fkey"
            columns: ["lead_art_id"]
            isOneToOne: false
            referencedRelation: "lead_arten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_leadquelle_id_fkey"
            columns: ["leadquelle_id"]
            isOneToOne: false
            referencedRelation: "leadquellen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_mitarbeiter_id_fkey"
            columns: ["mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
        ]
      }
      leistungen: {
        Row: {
          basispreis: number
          bedingungen: Json | null
          beschreibung: string | null
          created_at: string
          einheit: string
          id: string
          ist_aktiv: boolean
          kategorie: string
          name: string
          notizen: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          basispreis?: number
          bedingungen?: Json | null
          beschreibung?: string | null
          created_at?: string
          einheit?: string
          id?: string
          ist_aktiv?: boolean
          kategorie?: string
          name: string
          notizen?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          basispreis?: number
          bedingungen?: Json | null
          beschreibung?: string | null
          created_at?: string
          einheit?: string
          id?: string
          ist_aktiv?: boolean
          kategorie?: string
          name?: string
          notizen?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      leistungsverzeichnis_positionen: {
        Row: {
          bedingung_beschreibung: string | null
          bedingung_einheit: string | null
          bedingung_operator: string | null
          bedingung_wert_bis: number | null
          bedingung_wert_von: number | null
          bedingungstyp: string | null
          created_at: string
          gewerk_id: string | null
          id: string
          ist_pflicht: boolean
          kategorie: string
          leistungsverzeichnis_id: string
          menge_default: number | null
          notizen: string | null
          position_nr: number | null
          preis_kunde: number | null
          preis_subunternehmer: number | null
          preis_template_basis: number | null
          produkt_id: string
          sort_order: number
          template_position_id: string | null
          updated_at: string
        }
        Insert: {
          bedingung_beschreibung?: string | null
          bedingung_einheit?: string | null
          bedingung_operator?: string | null
          bedingung_wert_bis?: number | null
          bedingung_wert_von?: number | null
          bedingungstyp?: string | null
          created_at?: string
          gewerk_id?: string | null
          id?: string
          ist_pflicht?: boolean
          kategorie?: string
          leistungsverzeichnis_id: string
          menge_default?: number | null
          notizen?: string | null
          position_nr?: number | null
          preis_kunde?: number | null
          preis_subunternehmer?: number | null
          preis_template_basis?: number | null
          produkt_id: string
          sort_order?: number
          template_position_id?: string | null
          updated_at?: string
        }
        Update: {
          bedingung_beschreibung?: string | null
          bedingung_einheit?: string | null
          bedingung_operator?: string | null
          bedingung_wert_bis?: number | null
          bedingung_wert_von?: number | null
          bedingungstyp?: string | null
          created_at?: string
          gewerk_id?: string | null
          id?: string
          ist_pflicht?: boolean
          kategorie?: string
          leistungsverzeichnis_id?: string
          menge_default?: number | null
          notizen?: string | null
          position_nr?: number | null
          preis_kunde?: number | null
          preis_subunternehmer?: number | null
          preis_template_basis?: number | null
          produkt_id?: string
          sort_order?: number
          template_position_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leistungsverzeichnis_positionen_gewerk_id_fkey"
            columns: ["gewerk_id"]
            isOneToOne: false
            referencedRelation: "gewerke"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leistungsverzeichnis_positionen_leistungsverzeichnis_id_fkey"
            columns: ["leistungsverzeichnis_id"]
            isOneToOne: false
            referencedRelation: "leistungsverzeichnisse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leistungsverzeichnis_positionen_produkt_id_fkey"
            columns: ["produkt_id"]
            isOneToOne: false
            referencedRelation: "produkte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leistungsverzeichnis_positionen_produkt_id_fkey"
            columns: ["produkt_id"]
            isOneToOne: false
            referencedRelation: "produkte_katalog_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leistungsverzeichnis_positionen_template_position_id_fkey"
            columns: ["template_position_id"]
            isOneToOne: false
            referencedRelation: "leistungsverzeichnis_positionen"
            referencedColumns: ["id"]
          },
        ]
      }
      leistungsverzeichnisse: {
        Row: {
          beschreibung: string | null
          created_at: string
          created_by: string | null
          gueltig_ab: string | null
          gueltig_bis: string | null
          id: string
          ist_aktiv: boolean
          ist_template: boolean
          max_abweichung_prozent: number | null
          subunternehmer_id: string | null
          template_lv_id: string | null
          titel: string
          updated_at: string
          version: string | null
        }
        Insert: {
          beschreibung?: string | null
          created_at?: string
          created_by?: string | null
          gueltig_ab?: string | null
          gueltig_bis?: string | null
          id?: string
          ist_aktiv?: boolean
          ist_template?: boolean
          max_abweichung_prozent?: number | null
          subunternehmer_id?: string | null
          template_lv_id?: string | null
          titel: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          beschreibung?: string | null
          created_at?: string
          created_by?: string | null
          gueltig_ab?: string | null
          gueltig_bis?: string | null
          id?: string
          ist_aktiv?: boolean
          ist_template?: boolean
          max_abweichung_prozent?: number | null
          subunternehmer_id?: string | null
          template_lv_id?: string | null
          titel?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leistungsverzeichnisse_subunternehmer_id_fkey"
            columns: ["subunternehmer_id"]
            isOneToOne: false
            referencedRelation: "subunternehmer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leistungsverzeichnisse_template_lv_id_fkey"
            columns: ["template_lv_id"]
            isOneToOne: false
            referencedRelation: "leistungsverzeichnisse"
            referencedColumns: ["id"]
          },
        ]
      }
      lieferanten: {
        Row: {
          adresse: string | null
          bewertung: number | null
          created_at: string
          email: string | null
          id: string
          ist_aktiv: boolean
          kontaktperson: string | null
          lieferzeit_tage: number | null
          name: string
          notizen: string | null
          telefon: string | null
          updated_at: string
          website: string | null
          zahlungsbedingungen: string | null
        }
        Insert: {
          adresse?: string | null
          bewertung?: number | null
          created_at?: string
          email?: string | null
          id?: string
          ist_aktiv?: boolean
          kontaktperson?: string | null
          lieferzeit_tage?: number | null
          name: string
          notizen?: string | null
          telefon?: string | null
          updated_at?: string
          website?: string | null
          zahlungsbedingungen?: string | null
        }
        Update: {
          adresse?: string | null
          bewertung?: number | null
          created_at?: string
          email?: string | null
          id?: string
          ist_aktiv?: boolean
          kontaktperson?: string | null
          lieferzeit_tage?: number | null
          name?: string
          notizen?: string | null
          telefon?: string | null
          updated_at?: string
          website?: string | null
          zahlungsbedingungen?: string | null
        }
        Relationships: []
      }
      mitarbeiter: {
        Row: {
          adresse: string | null
          arbeitslosenversicherung_prozent: number | null
          austrittsdatum: string | null
          berufsgenossenschaft_betrag: number | null
          booster_dauer_monate: number | null
          booster_ende: string | null
          booster_faktor: number | null
          created_at: string
          created_by_source:
            | Database["public"]["Enums"]["mitarbeiter_source"]
            | null
          crm_vertriebspartner_record_id: string
          einarbeitung_dauer_monate: number | null
          einarbeitung_ende: string | null
          eintrittsdatum: string
          email: string | null
          email_status: Database["public"]["Enums"]["email_status_enum"] | null
          exclude_from_stats: boolean
          fixgehalt: number
          gsuite_email: string | null
          hauptstandort_lat: number | null
          hauptstandort_lng: number | null
          id: string
          instantly_campaign_id: string | null
          instantly_email: string | null
          instantlyCID_Unterlagen: string | null
          ist_handelsvertreter: boolean
          jahresbonus_betrag: number | null
          jahresbonus_relevante_tage: number | null
          jahresbonus_ziel: number | null
          justcall_campaign_id: number | null
          kann_auf_rechnung_kaufen: boolean | null
          krankenversicherung_prozent: number | null
          name: string
          ort: string | null
          pflegeversicherung_prozent: number | null
          plz_hauptstandort: string | null
          probezeit_monate: number
          profile_id: string | null
          provisionsmodell_id: string | null
          rentenversicherung_prozent: number | null
          sonstige_kosten_monatlich: number | null
          status: Database["public"]["Enums"]["mitarbeiter_status"]
          taetigkeit:
            | Database["public"]["Enums"]["verkaeufer_taetigkeit_enum"]
            | null
          telefon: string | null
          telegram_handle: string | null
          telegram_id: number | null
          umlage_u1_prozent: number | null
          umlage_u2_prozent: number | null
          updated_at: string
          wissensbereiche:
            | Database["public"]["Enums"]["verkaeufer_wissensbereich_enum"][]
            | null
        }
        Insert: {
          adresse?: string | null
          arbeitslosenversicherung_prozent?: number | null
          austrittsdatum?: string | null
          berufsgenossenschaft_betrag?: number | null
          booster_dauer_monate?: number | null
          booster_ende?: string | null
          booster_faktor?: number | null
          created_at?: string
          created_by_source?:
            | Database["public"]["Enums"]["mitarbeiter_source"]
            | null
          crm_vertriebspartner_record_id: string
          einarbeitung_dauer_monate?: number | null
          einarbeitung_ende?: string | null
          eintrittsdatum: string
          email?: string | null
          email_status?: Database["public"]["Enums"]["email_status_enum"] | null
          exclude_from_stats?: boolean
          fixgehalt: number
          gsuite_email?: string | null
          hauptstandort_lat?: number | null
          hauptstandort_lng?: number | null
          id?: string
          instantly_campaign_id?: string | null
          instantly_email?: string | null
          instantlyCID_Unterlagen?: string | null
          ist_handelsvertreter?: boolean
          jahresbonus_betrag?: number | null
          jahresbonus_relevante_tage?: number | null
          jahresbonus_ziel?: number | null
          justcall_campaign_id?: number | null
          kann_auf_rechnung_kaufen?: boolean | null
          krankenversicherung_prozent?: number | null
          name: string
          ort?: string | null
          pflegeversicherung_prozent?: number | null
          plz_hauptstandort?: string | null
          probezeit_monate?: number
          profile_id?: string | null
          provisionsmodell_id?: string | null
          rentenversicherung_prozent?: number | null
          sonstige_kosten_monatlich?: number | null
          status?: Database["public"]["Enums"]["mitarbeiter_status"]
          taetigkeit?:
            | Database["public"]["Enums"]["verkaeufer_taetigkeit_enum"]
            | null
          telefon?: string | null
          telegram_handle?: string | null
          telegram_id?: number | null
          umlage_u1_prozent?: number | null
          umlage_u2_prozent?: number | null
          updated_at?: string
          wissensbereiche?:
            | Database["public"]["Enums"]["verkaeufer_wissensbereich_enum"][]
            | null
        }
        Update: {
          adresse?: string | null
          arbeitslosenversicherung_prozent?: number | null
          austrittsdatum?: string | null
          berufsgenossenschaft_betrag?: number | null
          booster_dauer_monate?: number | null
          booster_ende?: string | null
          booster_faktor?: number | null
          created_at?: string
          created_by_source?:
            | Database["public"]["Enums"]["mitarbeiter_source"]
            | null
          crm_vertriebspartner_record_id?: string
          einarbeitung_dauer_monate?: number | null
          einarbeitung_ende?: string | null
          eintrittsdatum?: string
          email?: string | null
          email_status?: Database["public"]["Enums"]["email_status_enum"] | null
          exclude_from_stats?: boolean
          fixgehalt?: number
          gsuite_email?: string | null
          hauptstandort_lat?: number | null
          hauptstandort_lng?: number | null
          id?: string
          instantly_campaign_id?: string | null
          instantly_email?: string | null
          instantlyCID_Unterlagen?: string | null
          ist_handelsvertreter?: boolean
          jahresbonus_betrag?: number | null
          jahresbonus_relevante_tage?: number | null
          jahresbonus_ziel?: number | null
          justcall_campaign_id?: number | null
          kann_auf_rechnung_kaufen?: boolean | null
          krankenversicherung_prozent?: number | null
          name?: string
          ort?: string | null
          pflegeversicherung_prozent?: number | null
          plz_hauptstandort?: string | null
          probezeit_monate?: number
          profile_id?: string | null
          provisionsmodell_id?: string | null
          rentenversicherung_prozent?: number | null
          sonstige_kosten_monatlich?: number | null
          status?: Database["public"]["Enums"]["mitarbeiter_status"]
          taetigkeit?:
            | Database["public"]["Enums"]["verkaeufer_taetigkeit_enum"]
            | null
          telefon?: string | null
          telegram_handle?: string | null
          telegram_id?: number | null
          umlage_u1_prozent?: number | null
          umlage_u2_prozent?: number | null
          updated_at?: string
          wissensbereiche?:
            | Database["public"]["Enums"]["verkaeufer_wissensbereich_enum"][]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "mitarbeiter_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mitarbeiter_provisionsmodell_id_fkey"
            columns: ["provisionsmodell_id"]
            isOneToOne: false
            referencedRelation: "provisionsmodelle"
            referencedColumns: ["id"]
          },
        ]
      }
      mitarbeiter_jahresbonus_konfiguration: {
        Row: {
          created_at: string
          id: string
          jahr: number
          jahresbonus_betrag: number | null
          jahresbonus_ziel: number | null
          mitarbeiter_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          jahr: number
          jahresbonus_betrag?: number | null
          jahresbonus_ziel?: number | null
          mitarbeiter_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          jahr?: number
          jahresbonus_betrag?: number | null
          jahresbonus_ziel?: number | null
          mitarbeiter_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mitarbeiter_jahresbonus_konfiguration_mitarbeiter_id_fkey"
            columns: ["mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
        ]
      }
      mitarbeiter_kosten: {
        Row: {
          beschreibung: string | null
          created_at: string
          gueltig_ab: string
          gueltig_bis: string | null
          id: string
          ist_fix: boolean
          jaehrlicher_betrag: number
          kostenkategorie:
            | Database["public"]["Enums"]["kostenkategorie_enum"]
            | null
          mitarbeiter_id: string
          monatlicher_betrag: number
          updated_at: string
        }
        Insert: {
          beschreibung?: string | null
          created_at?: string
          gueltig_ab?: string
          gueltig_bis?: string | null
          id?: string
          ist_fix?: boolean
          jaehrlicher_betrag?: number
          kostenkategorie?:
            | Database["public"]["Enums"]["kostenkategorie_enum"]
            | null
          mitarbeiter_id: string
          monatlicher_betrag?: number
          updated_at?: string
        }
        Update: {
          beschreibung?: string | null
          created_at?: string
          gueltig_ab?: string
          gueltig_bis?: string | null
          id?: string
          ist_fix?: boolean
          jaehrlicher_betrag?: number
          kostenkategorie?:
            | Database["public"]["Enums"]["kostenkategorie_enum"]
            | null
          mitarbeiter_id?: string
          monatlicher_betrag?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mitarbeiter_kosten_mitarbeiter_id_fkey"
            columns: ["mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
        ]
      }
      mitarbeiter_strafabzuege: {
        Row: {
          abzug_betrag: number
          created_at: string
          datum: string
          grund: string | null
          gueltig_bis: string
          id: string
          mitarbeiter_id: string
          typ: Database["public"]["Enums"]["strafabzug_typ"]
          updated_at: string
        }
        Insert: {
          abzug_betrag?: number
          created_at?: string
          datum?: string
          grund?: string | null
          gueltig_bis?: string
          id?: string
          mitarbeiter_id: string
          typ: Database["public"]["Enums"]["strafabzug_typ"]
          updated_at?: string
        }
        Update: {
          abzug_betrag?: number
          created_at?: string
          datum?: string
          grund?: string | null
          gueltig_bis?: string
          id?: string
          mitarbeiter_id?: string
          typ?: Database["public"]["Enums"]["strafabzug_typ"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mitarbeiter_strafabzuege_mitarbeiter_id_fkey"
            columns: ["mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
        ]
      }
      mitarbeiter_token_guthaben: {
        Row: {
          auto_renew: boolean | null
          created_at: string | null
          expires_at: string | null
          gekaufte_tokens_gesamt: number | null
          id: string
          is_active: boolean | null
          last_consumed_at: string | null
          mitarbeiter_id: string
          produkt_id: string
          purchased_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          verbrauchte_tokens_gesamt: number | null
          verfügbare_tokens: number | null
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          gekaufte_tokens_gesamt?: number | null
          id?: string
          is_active?: boolean | null
          last_consumed_at?: string | null
          mitarbeiter_id: string
          produkt_id: string
          purchased_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          verbrauchte_tokens_gesamt?: number | null
          verfügbare_tokens?: number | null
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          gekaufte_tokens_gesamt?: number | null
          id?: string
          is_active?: boolean | null
          last_consumed_at?: string | null
          mitarbeiter_id?: string
          produkt_id?: string
          purchased_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          verbrauchte_tokens_gesamt?: number | null
          verfügbare_tokens?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mitarbeiter_token_guthaben_mitarbeiter_id_fkey"
            columns: ["mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mitarbeiter_token_guthaben_produkt_id_fkey"
            columns: ["produkt_id"]
            isOneToOne: false
            referencedRelation: "shop_produkte"
            referencedColumns: ["id"]
          },
        ]
      }
      mitarbeiter_werbung: {
        Row: {
          created_at: string
          geworbener_mitarbeiter_id: string
          id: string
          meilenstein1_bonus_betrag: number | null
          meilenstein1_erreicht_datum: string | null
          meilenstein1_status: string | null
          meilenstein2_bonus_betrag: number | null
          meilenstein2_erreicht_datum: string | null
          meilenstein2_status: string | null
          meilenstein3_bonus_betrag_berechnet: number | null
          meilenstein3_erreicht_datum: string | null
          meilenstein3_status: string | null
          updated_at: string
          werbender_mitarbeiter_id: string
        }
        Insert: {
          created_at?: string
          geworbener_mitarbeiter_id: string
          id?: string
          meilenstein1_bonus_betrag?: number | null
          meilenstein1_erreicht_datum?: string | null
          meilenstein1_status?: string | null
          meilenstein2_bonus_betrag?: number | null
          meilenstein2_erreicht_datum?: string | null
          meilenstein2_status?: string | null
          meilenstein3_bonus_betrag_berechnet?: number | null
          meilenstein3_erreicht_datum?: string | null
          meilenstein3_status?: string | null
          updated_at?: string
          werbender_mitarbeiter_id: string
        }
        Update: {
          created_at?: string
          geworbener_mitarbeiter_id?: string
          id?: string
          meilenstein1_bonus_betrag?: number | null
          meilenstein1_erreicht_datum?: string | null
          meilenstein1_status?: string | null
          meilenstein2_bonus_betrag?: number | null
          meilenstein2_erreicht_datum?: string | null
          meilenstein2_status?: string | null
          meilenstein3_bonus_betrag_berechnet?: number | null
          meilenstein3_erreicht_datum?: string | null
          meilenstein3_status?: string | null
          updated_at?: string
          werbender_mitarbeiter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mitarbeiter_werbung_geworbener_mitarbeiter_id_fkey"
            columns: ["geworbener_mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mitarbeiter_werbung_werbender_mitarbeiter_id_fkey"
            columns: ["werbender_mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
        ]
      }
      mitarbeiter_werbung_backup: {
        Row: {
          created_at: string | null
          geworbener_mitarbeiter_id: string | null
          id: string | null
          status: Database["public"]["Enums"]["werbung_status"] | null
          updated_at: string | null
          werbender_mitarbeiter_id: string | null
        }
        Insert: {
          created_at?: string | null
          geworbener_mitarbeiter_id?: string | null
          id?: string | null
          status?: Database["public"]["Enums"]["werbung_status"] | null
          updated_at?: string | null
          werbender_mitarbeiter_id?: string | null
        }
        Update: {
          created_at?: string | null
          geworbener_mitarbeiter_id?: string | null
          id?: string | null
          status?: Database["public"]["Enums"]["werbung_status"] | null
          updated_at?: string | null
          werbender_mitarbeiter_id?: string | null
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      n8n_transcript_chats: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      notiz_mentions: {
        Row: {
          created_at: string | null
          erledigt_am: string | null
          gelesen_am: string | null
          id: string
          notiz_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          erledigt_am?: string | null
          gelesen_am?: string | null
          id?: string
          notiz_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          erledigt_am?: string | null
          gelesen_am?: string | null
          id?: string
          notiz_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notiz_mentions_notiz_id_fkey"
            columns: ["notiz_id"]
            isOneToOne: false
            referencedRelation: "notizen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notiz_mentions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notizen: {
        Row: {
          aktualisiert_am: string
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["notiz_entity_type"]
          erinnerung_datum: string | null
          ersteller_id: string
          ersteller_typ: Database["public"]["Enums"]["ersteller_typ_enum"]
          erstellt_am: string
          farbe: string | null
          id: string
          inhalt: string
          ist_gepinnt: boolean | null
          ist_privat: boolean | null
          kategorie: string | null
          lead_id: string | null
          notiz_typ: string | null
          parent_notiz_id: string | null
          phase: string | null
          prioritaet: number | null
          substatus: string | null
          tags: string[] | null
          titel: string | null
        }
        Insert: {
          aktualisiert_am?: string
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["notiz_entity_type"]
          erinnerung_datum?: string | null
          ersteller_id: string
          ersteller_typ?: Database["public"]["Enums"]["ersteller_typ_enum"]
          erstellt_am?: string
          farbe?: string | null
          id?: string
          inhalt: string
          ist_gepinnt?: boolean | null
          ist_privat?: boolean | null
          kategorie?: string | null
          lead_id?: string | null
          notiz_typ?: string | null
          parent_notiz_id?: string | null
          phase?: string | null
          prioritaet?: number | null
          substatus?: string | null
          tags?: string[] | null
          titel?: string | null
        }
        Update: {
          aktualisiert_am?: string
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["notiz_entity_type"]
          erinnerung_datum?: string | null
          ersteller_id?: string
          ersteller_typ?: Database["public"]["Enums"]["ersteller_typ_enum"]
          erstellt_am?: string
          farbe?: string | null
          id?: string
          inhalt?: string
          ist_gepinnt?: boolean | null
          ist_privat?: boolean | null
          kategorie?: string | null
          lead_id?: string | null
          notiz_typ?: string | null
          parent_notiz_id?: string | null
          phase?: string | null
          prioritaet?: number | null
          substatus?: string | null
          tags?: string[] | null
          titel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notizen_parent_notiz_id_fkey"
            columns: ["parent_notiz_id"]
            isOneToOne: false
            referencedRelation: "notizen"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_dokumente: {
        Row: {
          bereich: Database["public"]["Enums"]["pdf_bereich_enum"]
          beschreibung: string | null
          created_at: string | null
          datei_name: string
          datei_pfad: string
          id: string
          ist_aktiv: boolean | null
          kategorie: string
          titel: string
          updated_at: string | null
          uploaded_by: string | null
          version: number | null
          vorgaenger_id: string | null
        }
        Insert: {
          bereich: Database["public"]["Enums"]["pdf_bereich_enum"]
          beschreibung?: string | null
          created_at?: string | null
          datei_name: string
          datei_pfad: string
          id?: string
          ist_aktiv?: boolean | null
          kategorie: string
          titel: string
          updated_at?: string | null
          uploaded_by?: string | null
          version?: number | null
          vorgaenger_id?: string | null
        }
        Update: {
          bereich?: Database["public"]["Enums"]["pdf_bereich_enum"]
          beschreibung?: string | null
          created_at?: string | null
          datei_name?: string
          datei_pfad?: string
          id?: string
          ist_aktiv?: boolean | null
          kategorie?: string
          titel?: string
          updated_at?: string | null
          uploaded_by?: string | null
          version?: number | null
          vorgaenger_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdf_dokumente_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_dokumente_vorgaenger_id_fkey"
            columns: ["vorgaenger_id"]
            isOneToOne: false
            referencedRelation: "pdf_dokumente"
            referencedColumns: ["id"]
          },
        ]
      }
      produkt_bedingungen: {
        Row: {
          bedingungstyp: string
          beschreibung: string
          created_at: string | null
          einheit: string | null
          id: string
          ist_aktiv: boolean | null
          kinderartikel_id: string
          operator: string
          updated_at: string | null
          wert_bis: number | null
          wert_von: number | null
        }
        Insert: {
          bedingungstyp: string
          beschreibung: string
          created_at?: string | null
          einheit?: string | null
          id?: string
          ist_aktiv?: boolean | null
          kinderartikel_id: string
          operator: string
          updated_at?: string | null
          wert_bis?: number | null
          wert_von?: number | null
        }
        Update: {
          bedingungstyp?: string
          beschreibung?: string
          created_at?: string | null
          einheit?: string | null
          id?: string
          ist_aktiv?: boolean | null
          kinderartikel_id?: string
          operator?: string
          updated_at?: string | null
          wert_bis?: number | null
          wert_von?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "produkt_bedingungen_kinderartikel_id_fkey"
            columns: ["kinderartikel_id"]
            isOneToOne: false
            referencedRelation: "produkte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produkt_bedingungen_kinderartikel_id_fkey"
            columns: ["kinderartikel_id"]
            isOneToOne: false
            referencedRelation: "produkte_katalog_view"
            referencedColumns: ["id"]
          },
        ]
      }
      produkt_dokumente: {
        Row: {
          beschreibung: string | null
          created_at: string | null
          dateigroesse: number | null
          dateiname: string
          dateityp: string | null
          hochgeladen_am: string | null
          hochgeladen_von: string | null
          id: string
          produkt_id: string
          storage_path: string
        }
        Insert: {
          beschreibung?: string | null
          created_at?: string | null
          dateigroesse?: number | null
          dateiname: string
          dateityp?: string | null
          hochgeladen_am?: string | null
          hochgeladen_von?: string | null
          id?: string
          produkt_id: string
          storage_path: string
        }
        Update: {
          beschreibung?: string | null
          created_at?: string | null
          dateigroesse?: number | null
          dateiname?: string
          dateityp?: string | null
          hochgeladen_am?: string | null
          hochgeladen_von?: string | null
          id?: string
          produkt_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "produkt_dokumente_produkt_id_fkey"
            columns: ["produkt_id"]
            isOneToOne: false
            referencedRelation: "produkte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produkt_dokumente_produkt_id_fkey"
            columns: ["produkt_id"]
            isOneToOne: false
            referencedRelation: "produkte_katalog_view"
            referencedColumns: ["id"]
          },
        ]
      }
      produkt_lieferanten_preise: {
        Row: {
          created_at: string
          created_by: string | null
          durchschnittliche_lieferzeit_tage: number | null
          gueltig_ab: string
          gueltig_bis: string | null
          id: string
          ist_aktuell: boolean
          letzte_lieferung: string | null
          lieferant_id: string
          lieferanten_artikelnummer: string | null
          lieferanten_bezeichnung: string | null
          lieferzeit_tage: number | null
          mindestbestellmenge: number | null
          mindestmenge: number | null
          preis: number
          produkt_id: string
          verpackungseinheit: number | null
          waehrung: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          durchschnittliche_lieferzeit_tage?: number | null
          gueltig_ab?: string
          gueltig_bis?: string | null
          id?: string
          ist_aktuell?: boolean
          letzte_lieferung?: string | null
          lieferant_id: string
          lieferanten_artikelnummer?: string | null
          lieferanten_bezeichnung?: string | null
          lieferzeit_tage?: number | null
          mindestbestellmenge?: number | null
          mindestmenge?: number | null
          preis: number
          produkt_id: string
          verpackungseinheit?: number | null
          waehrung?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          durchschnittliche_lieferzeit_tage?: number | null
          gueltig_ab?: string
          gueltig_bis?: string | null
          id?: string
          ist_aktuell?: boolean
          letzte_lieferung?: string | null
          lieferant_id?: string
          lieferanten_artikelnummer?: string | null
          lieferanten_bezeichnung?: string | null
          lieferzeit_tage?: number | null
          mindestbestellmenge?: number | null
          mindestmenge?: number | null
          preis?: number
          produkt_id?: string
          verpackungseinheit?: number | null
          waehrung?: string
        }
        Relationships: [
          {
            foreignKeyName: "produkt_lieferanten_preise_lieferant_id_fkey"
            columns: ["lieferant_id"]
            isOneToOne: false
            referencedRelation: "lieferanten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produkt_lieferanten_preise_produkt_id_fkey"
            columns: ["produkt_id"]
            isOneToOne: false
            referencedRelation: "produkte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produkt_lieferanten_preise_produkt_id_fkey"
            columns: ["produkt_id"]
            isOneToOne: false
            referencedRelation: "produkte_katalog_view"
            referencedColumns: ["id"]
          },
        ]
      }
      produkt_preishistorie: {
        Row: {
          aenderungsdatum: string
          aenderungsgrund: string | null
          alter_preis: number
          geaendert_von: string | null
          id: string
          lieferant_id: string | null
          neuer_preis: number
          preis_typ: string
          produkt_id: string
          waehrung: string
        }
        Insert: {
          aenderungsdatum?: string
          aenderungsgrund?: string | null
          alter_preis: number
          geaendert_von?: string | null
          id?: string
          lieferant_id?: string | null
          neuer_preis: number
          preis_typ: string
          produkt_id: string
          waehrung?: string
        }
        Update: {
          aenderungsdatum?: string
          aenderungsgrund?: string | null
          alter_preis?: number
          geaendert_von?: string | null
          id?: string
          lieferant_id?: string | null
          neuer_preis?: number
          preis_typ?: string
          produkt_id?: string
          waehrung?: string
        }
        Relationships: []
      }
      produkt_preiskonfiguration: {
        Row: {
          automatische_preisanpassung: boolean | null
          created_at: string
          id: string
          letzte_preispruefung: string | null
          mindestmarge_prozent: number | null
          preistyp: string
          produkt_id: string
          standardmarge_prozent: number | null
          updated_at: string
        }
        Insert: {
          automatische_preisanpassung?: boolean | null
          created_at?: string
          id?: string
          letzte_preispruefung?: string | null
          mindestmarge_prozent?: number | null
          preistyp?: string
          produkt_id: string
          standardmarge_prozent?: number | null
          updated_at?: string
        }
        Update: {
          automatische_preisanpassung?: boolean | null
          created_at?: string
          id?: string
          letzte_preispruefung?: string | null
          mindestmarge_prozent?: number | null
          preistyp?: string
          produkt_id?: string
          standardmarge_prozent?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      produkt_verkaufspreise: {
        Row: {
          created_at: string
          created_by: string | null
          gueltig_ab: string
          gueltig_bis: string | null
          id: string
          ist_aktuell: boolean
          mindestmenge: number | null
          notizen: string | null
          preis: number
          produkt_id: string
          waehrung: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          gueltig_ab?: string
          gueltig_bis?: string | null
          id?: string
          ist_aktuell?: boolean
          mindestmenge?: number | null
          notizen?: string | null
          preis: number
          produkt_id: string
          waehrung?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          gueltig_ab?: string
          gueltig_bis?: string | null
          id?: string
          ist_aktuell?: boolean
          mindestmenge?: number | null
          notizen?: string | null
          preis?: number
          produkt_id?: string
          waehrung?: string
        }
        Relationships: []
      }
      produkte: {
        Row: {
          artikelnummer: string | null
          artikelnummer_hersteller: string | null
          beschreibung: string | null
          chargen_pflicht: boolean | null
          created_at: string
          ean_code: string | null
          einheit: string | null
          gewerk_id: string | null
          gewicht_kg: number | null
          hersteller: string | null
          hersteller_id: string | null
          id: string
          ist_aktiv: boolean
          ist_dienstleistung: boolean | null
          ist_mischposition: boolean | null
          ist_optional: boolean | null
          kalkulationsart:
            | Database["public"]["Enums"]["kalkulationsart_enum"]
            | null
          katalog_sichtbar: boolean | null
          lagerplatz: string | null
          leistungseinheit:
            | Database["public"]["Enums"]["leistungseinheit_enum"]
            | null
          mindestbestand: number | null
          mindestverkaufspreis: number | null
          name: string
          notizen_intern: string | null
          parent_produkt_id: string | null
          produkttyp: Database["public"]["Enums"]["produkttyp"]
          seriennummer_pflicht: boolean | null
          tags: string[] | null
          updated_at: string
          verkaufspreis_empfohlen: number | null
          volumen_m3: number | null
          warengruppe_id: string | null
          zuletzt_verwendet_am: string | null
        }
        Insert: {
          artikelnummer?: string | null
          artikelnummer_hersteller?: string | null
          beschreibung?: string | null
          chargen_pflicht?: boolean | null
          created_at?: string
          ean_code?: string | null
          einheit?: string | null
          gewerk_id?: string | null
          gewicht_kg?: number | null
          hersteller?: string | null
          hersteller_id?: string | null
          id?: string
          ist_aktiv?: boolean
          ist_dienstleistung?: boolean | null
          ist_mischposition?: boolean | null
          ist_optional?: boolean | null
          kalkulationsart?:
            | Database["public"]["Enums"]["kalkulationsart_enum"]
            | null
          katalog_sichtbar?: boolean | null
          lagerplatz?: string | null
          leistungseinheit?:
            | Database["public"]["Enums"]["leistungseinheit_enum"]
            | null
          mindestbestand?: number | null
          mindestverkaufspreis?: number | null
          name: string
          notizen_intern?: string | null
          parent_produkt_id?: string | null
          produkttyp?: Database["public"]["Enums"]["produkttyp"]
          seriennummer_pflicht?: boolean | null
          tags?: string[] | null
          updated_at?: string
          verkaufspreis_empfohlen?: number | null
          volumen_m3?: number | null
          warengruppe_id?: string | null
          zuletzt_verwendet_am?: string | null
        }
        Update: {
          artikelnummer?: string | null
          artikelnummer_hersteller?: string | null
          beschreibung?: string | null
          chargen_pflicht?: boolean | null
          created_at?: string
          ean_code?: string | null
          einheit?: string | null
          gewerk_id?: string | null
          gewicht_kg?: number | null
          hersteller?: string | null
          hersteller_id?: string | null
          id?: string
          ist_aktiv?: boolean
          ist_dienstleistung?: boolean | null
          ist_mischposition?: boolean | null
          ist_optional?: boolean | null
          kalkulationsart?:
            | Database["public"]["Enums"]["kalkulationsart_enum"]
            | null
          katalog_sichtbar?: boolean | null
          lagerplatz?: string | null
          leistungseinheit?:
            | Database["public"]["Enums"]["leistungseinheit_enum"]
            | null
          mindestbestand?: number | null
          mindestverkaufspreis?: number | null
          name?: string
          notizen_intern?: string | null
          parent_produkt_id?: string | null
          produkttyp?: Database["public"]["Enums"]["produkttyp"]
          seriennummer_pflicht?: boolean | null
          tags?: string[] | null
          updated_at?: string
          verkaufspreis_empfohlen?: number | null
          volumen_m3?: number | null
          warengruppe_id?: string | null
          zuletzt_verwendet_am?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produkte_gewerk_id_fkey"
            columns: ["gewerk_id"]
            isOneToOne: false
            referencedRelation: "gewerke"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produkte_hersteller_id_fkey"
            columns: ["hersteller_id"]
            isOneToOne: false
            referencedRelation: "hersteller"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produkte_parent_produkt_id_fkey"
            columns: ["parent_produkt_id"]
            isOneToOne: false
            referencedRelation: "produkte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produkte_parent_produkt_id_fkey"
            columns: ["parent_produkt_id"]
            isOneToOne: false
            referencedRelation: "produkte_katalog_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produkte_warengruppe_id_fkey"
            columns: ["warengruppe_id"]
            isOneToOne: false
            referencedRelation: "warengruppen"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          is_deactivated: boolean | null
          mitarbeiter_id: string | null
          nachname: string | null
          name: string | null
          password_set_by_user: boolean | null
          requires_password_setup: boolean
          sales_academy_intro_watched: boolean
          sales_academy_intro_watched_at: string | null
          telefon: string | null
          updated_at: string
          vorname: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          is_deactivated?: boolean | null
          mitarbeiter_id?: string | null
          nachname?: string | null
          name?: string | null
          password_set_by_user?: boolean | null
          requires_password_setup?: boolean
          sales_academy_intro_watched?: boolean
          sales_academy_intro_watched_at?: string | null
          telefon?: string | null
          updated_at?: string
          vorname?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          is_deactivated?: boolean | null
          mitarbeiter_id?: string | null
          nachname?: string | null
          name?: string | null
          password_set_by_user?: boolean | null
          requires_password_setup?: boolean
          sales_academy_intro_watched?: boolean
          sales_academy_intro_watched_at?: string | null
          telefon?: string | null
          updated_at?: string
          vorname?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_mitarbeiter_id_fkey"
            columns: ["mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
        ]
      }
      provision_month_locks: {
        Row: {
          created_at: string
          id: string
          locked_at: string
          locked_by: string | null
          month: number
          pdfs_generated: boolean | null
          pdfs_generated_at: string | null
          status: string
          unlock_reason: string | null
          unlocked_at: string | null
          unlocked_by: string | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          locked_at?: string
          locked_by?: string | null
          month: number
          pdfs_generated?: boolean | null
          pdfs_generated_at?: string | null
          status?: string
          unlock_reason?: string | null
          unlocked_at?: string | null
          unlocked_by?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          locked_at?: string
          locked_by?: string | null
          month?: number
          pdfs_generated?: boolean | null
          pdfs_generated_at?: string | null
          status?: string
          unlock_reason?: string | null
          unlocked_at?: string | null
          unlocked_by?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      provision_pdfs: {
        Row: {
          created_at: string
          document_type: string | null
          file_path: string
          file_size: number | null
          generated_at: string
          generated_by: string | null
          html_content: string | null
          id: string
          is_month_locked: boolean | null
          kalkulation_id: string | null
          mitarbeiter_id: string
          month_lock_id: string
          version: number
          version_number: number | null
        }
        Insert: {
          created_at?: string
          document_type?: string | null
          file_path: string
          file_size?: number | null
          generated_at?: string
          generated_by?: string | null
          html_content?: string | null
          id?: string
          is_month_locked?: boolean | null
          kalkulation_id?: string | null
          mitarbeiter_id: string
          month_lock_id: string
          version?: number
          version_number?: number | null
        }
        Update: {
          created_at?: string
          document_type?: string | null
          file_path?: string
          file_size?: number | null
          generated_at?: string
          generated_by?: string | null
          html_content?: string | null
          id?: string
          is_month_locked?: boolean | null
          kalkulation_id?: string | null
          mitarbeiter_id?: string
          month_lock_id?: string
          version?: number
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "provision_pdfs_kalkulation_id_fkey"
            columns: ["kalkulation_id"]
            isOneToOne: false
            referencedRelation: "provisionskalkulation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provision_pdfs_mitarbeiter_id_fkey"
            columns: ["mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provision_pdfs_month_lock_id_fkey"
            columns: ["month_lock_id"]
            isOneToOne: false
            referencedRelation: "provision_month_locks"
            referencedColumns: ["id"]
          },
        ]
      }
      provision_pdfs_backup: {
        Row: {
          backup_created_at: string | null
          backup_reason: string | null
          document_type: string
          file_path: string
          generated_at: string
          id: string
          kalkulation_id: string | null
          mitarbeiter_id: string
          month_lock_id: string
          original_pdf_id: string
          version_number: number
        }
        Insert: {
          backup_created_at?: string | null
          backup_reason?: string | null
          document_type: string
          file_path: string
          generated_at: string
          id?: string
          kalkulation_id?: string | null
          mitarbeiter_id: string
          month_lock_id: string
          original_pdf_id: string
          version_number: number
        }
        Update: {
          backup_created_at?: string | null
          backup_reason?: string | null
          document_type?: string
          file_path?: string
          generated_at?: string
          id?: string
          kalkulation_id?: string | null
          mitarbeiter_id?: string
          month_lock_id?: string
          original_pdf_id?: string
          version_number?: number
        }
        Relationships: []
      }
      provisions_auftraege: {
        Row: {
          auftrag_id: string
          auftrag_provision_gesamt: number
          auszahlbar: boolean
          berechnet_am: string
          blockiert_grund: string[] | null
          booster_aktiv: boolean
          booster_faktor: number
          grundprovision: number
          id: string
          ist_kombipaket: boolean
          kalkulation_id: string
          kombipaket_bonus: number
          netto_summe: number
          provisions_basis: number
          provisions_prozent: number
          rabatt_prozent: number
        }
        Insert: {
          auftrag_id: string
          auftrag_provision_gesamt: number
          auszahlbar?: boolean
          berechnet_am?: string
          blockiert_grund?: string[] | null
          booster_aktiv?: boolean
          booster_faktor?: number
          grundprovision: number
          id?: string
          ist_kombipaket?: boolean
          kalkulation_id: string
          kombipaket_bonus?: number
          netto_summe: number
          provisions_basis: number
          provisions_prozent: number
          rabatt_prozent?: number
        }
        Update: {
          auftrag_id?: string
          auftrag_provision_gesamt?: number
          auszahlbar?: boolean
          berechnet_am?: string
          blockiert_grund?: string[] | null
          booster_aktiv?: boolean
          booster_faktor?: number
          grundprovision?: number
          id?: string
          ist_kombipaket?: boolean
          kalkulation_id?: string
          kombipaket_bonus?: number
          netto_summe?: number
          provisions_basis?: number
          provisions_prozent?: number
          rabatt_prozent?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_provisions_auftraege_auftrag"
            columns: ["auftrag_id"]
            isOneToOne: false
            referencedRelation: "auftraege"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_provisions_auftraege_kalkulation"
            columns: ["kalkulation_id"]
            isOneToOne: false
            referencedRelation: "provisionskalkulation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisions_auftraege_kalkulation_id_fkey"
            columns: ["kalkulation_id"]
            isOneToOne: false
            referencedRelation: "provisionskalkulation"
            referencedColumns: ["id"]
          },
        ]
      }
      provisions_auszahlungen: {
        Row: {
          arbeitslosenversicherung: number
          auszahlung_datum: string
          betrag_brutto: number
          betrag_netto: number
          created_at: string
          id: string
          kalkulation_id: string
          kirchensteuer: number
          krankenversicherung: number
          lohnsteuer: number
          pflegeversicherung: number
          rentenversicherung: number
          solidaritaetszuschlag: number
          status: string
          ueberwiesen_am: string | null
        }
        Insert: {
          arbeitslosenversicherung?: number
          auszahlung_datum: string
          betrag_brutto: number
          betrag_netto: number
          created_at?: string
          id?: string
          kalkulation_id: string
          kirchensteuer?: number
          krankenversicherung?: number
          lohnsteuer?: number
          pflegeversicherung?: number
          rentenversicherung?: number
          solidaritaetszuschlag?: number
          status?: string
          ueberwiesen_am?: string | null
        }
        Update: {
          arbeitslosenversicherung?: number
          auszahlung_datum?: string
          betrag_brutto?: number
          betrag_netto?: number
          created_at?: string
          id?: string
          kalkulation_id?: string
          kirchensteuer?: number
          krankenversicherung?: number
          lohnsteuer?: number
          pflegeversicherung?: number
          rentenversicherung?: number
          solidaritaetszuschlag?: number
          status?: string
          ueberwiesen_am?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_provisions_auszahlungen_kalkulation"
            columns: ["kalkulation_id"]
            isOneToOne: false
            referencedRelation: "provisionskalkulation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisions_auszahlungen_kalkulation_id_fkey"
            columns: ["kalkulation_id"]
            isOneToOne: false
            referencedRelation: "provisionskalkulation"
            referencedColumns: ["id"]
          },
        ]
      }
      provisionskalkulation: {
        Row: {
          auszahlung_datum: string | null
          auszahlung_freigegeben: boolean
          berechnungsmonat: string
          booster_faktor: number
          created_at: string
          fehlzeiten_abzug: number
          gesamt_provision_brutto: number
          gesamt_provision_netto: number
          id: string
          kombipaket_bonus: number
          mitarbeiter_id: string
          monat_auftraege_anzahl: number
          monat_grundprovision: number
          monat_umsatz: number
          provisions_multiplikator: number
          status: string
          strafabzug: number
          umsatzbonus: number
          updated_at: string
          ytd_auftraege_anzahl: number
          ytd_umsatz: number
        }
        Insert: {
          auszahlung_datum?: string | null
          auszahlung_freigegeben?: boolean
          berechnungsmonat: string
          booster_faktor?: number
          created_at?: string
          fehlzeiten_abzug?: number
          gesamt_provision_brutto?: number
          gesamt_provision_netto?: number
          id?: string
          kombipaket_bonus?: number
          mitarbeiter_id: string
          monat_auftraege_anzahl?: number
          monat_grundprovision?: number
          monat_umsatz?: number
          provisions_multiplikator?: number
          status?: string
          strafabzug?: number
          umsatzbonus?: number
          updated_at?: string
          ytd_auftraege_anzahl?: number
          ytd_umsatz?: number
        }
        Update: {
          auszahlung_datum?: string | null
          auszahlung_freigegeben?: boolean
          berechnungsmonat?: string
          booster_faktor?: number
          created_at?: string
          fehlzeiten_abzug?: number
          gesamt_provision_brutto?: number
          gesamt_provision_netto?: number
          id?: string
          kombipaket_bonus?: number
          mitarbeiter_id?: string
          monat_auftraege_anzahl?: number
          monat_grundprovision?: number
          monat_umsatz?: number
          provisions_multiplikator?: number
          status?: string
          strafabzug?: number
          umsatzbonus?: number
          updated_at?: string
          ytd_auftraege_anzahl?: number
          ytd_umsatz?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_provisionskalkulation_mitarbeiter"
            columns: ["mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
        ]
      }
      provisionsmodelle: {
        Row: {
          bonustabelle: Json
          created_at: string
          id: string
          kombipaket_bonus: number
          modell_name: string
          umsatzschwelle: number
          updated_at: string
        }
        Insert: {
          bonustabelle: Json
          created_at?: string
          id?: string
          kombipaket_bonus?: number
          modell_name: string
          umsatzschwelle: number
          updated_at?: string
        }
        Update: {
          bonustabelle?: Json
          created_at?: string
          id?: string
          kombipaket_bonus?: number
          modell_name?: string
          umsatzschwelle?: number
          updated_at?: string
        }
        Relationships: []
      }
      record_manager_vdb: {
        Row: {
          created_at: string
          file_id: string | null
          file_name: string | null
          id: string
          vector_db: string | null
        }
        Insert: {
          created_at?: string
          file_id?: string | null
          file_name?: string | null
          id?: string
          vector_db?: string | null
        }
        Update: {
          created_at?: string
          file_id?: string | null
          file_name?: string | null
          id?: string
          vector_db?: string | null
        }
        Relationships: []
      }
      shop_produkte: {
        Row: {
          abo_intervall: string | null
          beschreibung: string | null
          bild_url: string | null
          created_at: string | null
          ekp: number
          erfordert_produkt_id: string | null
          id: string
          ist_abo_produkt: boolean | null
          ist_aktiv: boolean | null
          kategorie: string | null
          name: string
          stripe_price_id: string | null
          stripe_product_id: string | null
          stripe_test_price_id: string | null
          token_pro_einheit: number | null
          token_typ: string | null
          updated_at: string | null
          vkp: number
        }
        Insert: {
          abo_intervall?: string | null
          beschreibung?: string | null
          bild_url?: string | null
          created_at?: string | null
          ekp: number
          erfordert_produkt_id?: string | null
          id?: string
          ist_abo_produkt?: boolean | null
          ist_aktiv?: boolean | null
          kategorie?: string | null
          name: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_test_price_id?: string | null
          token_pro_einheit?: number | null
          token_typ?: string | null
          updated_at?: string | null
          vkp: number
        }
        Update: {
          abo_intervall?: string | null
          beschreibung?: string | null
          bild_url?: string | null
          created_at?: string | null
          ekp?: number
          erfordert_produkt_id?: string | null
          id?: string
          ist_abo_produkt?: boolean | null
          ist_aktiv?: boolean | null
          kategorie?: string | null
          name?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_test_price_id?: string | null
          token_pro_einheit?: number | null
          token_typ?: string | null
          updated_at?: string | null
          vkp?: number
        }
        Relationships: [
          {
            foreignKeyName: "shop_produkte_erfordert_produkt_id_fkey"
            columns: ["erfordert_produkt_id"]
            isOneToOne: false
            referencedRelation: "shop_produkte"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      staffelpreise: {
        Row: {
          ab_menge: number
          created_at: string | null
          gueltig_bis: string | null
          gueltig_von: string | null
          id: string
          ist_aktiv: boolean | null
          lieferant_id: string | null
          preis: number
          preis_typ: string
          produkt_id: string
          updated_at: string | null
          waehrung: string | null
        }
        Insert: {
          ab_menge: number
          created_at?: string | null
          gueltig_bis?: string | null
          gueltig_von?: string | null
          id?: string
          ist_aktiv?: boolean | null
          lieferant_id?: string | null
          preis: number
          preis_typ: string
          produkt_id: string
          updated_at?: string | null
          waehrung?: string | null
        }
        Update: {
          ab_menge?: number
          created_at?: string | null
          gueltig_bis?: string | null
          gueltig_von?: string | null
          id?: string
          ist_aktiv?: boolean | null
          lieferant_id?: string | null
          preis?: number
          preis_typ?: string
          produkt_id?: string
          updated_at?: string | null
          waehrung?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staffelpreise_lieferant_id_fkey"
            columns: ["lieferant_id"]
            isOneToOne: false
            referencedRelation: "lieferanten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staffelpreise_produkt_id_fkey"
            columns: ["produkt_id"]
            isOneToOne: false
            referencedRelation: "produkte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staffelpreise_produkt_id_fkey"
            columns: ["produkt_id"]
            isOneToOne: false
            referencedRelation: "produkte_katalog_view"
            referencedColumns: ["id"]
          },
        ]
      }
      subunternehmer: {
        Row: {
          adresse: string | null
          created_at: string
          email: string | null
          firma: string | null
          id: string
          ist_aktiv: boolean
          max_auftraege_pro_woche: number | null
          name: string
          notizen: string | null
          spezialgebiete: string[] | null
          telefon: string | null
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          firma?: string | null
          id?: string
          ist_aktiv?: boolean
          max_auftraege_pro_woche?: number | null
          name: string
          notizen?: string | null
          spezialgebiete?: string[] | null
          telefon?: string | null
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          firma?: string | null
          id?: string
          ist_aktiv?: boolean
          max_auftraege_pro_woche?: number | null
          name?: string
          notizen?: string | null
          spezialgebiete?: string[] | null
          telefon?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subunternehmer_leistungen: {
        Row: {
          created_at: string
          id: string
          ist_bevorzugt: boolean | null
          leistung_id: string
          lieferzeit_tage: number | null
          notizen: string | null
          preis: number
          subunternehmer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ist_bevorzugt?: boolean | null
          leistung_id: string
          lieferzeit_tage?: number | null
          notizen?: string | null
          preis: number
          subunternehmer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ist_bevorzugt?: boolean | null
          leistung_id?: string
          lieferzeit_tage?: number | null
          notizen?: string | null
          preis?: number
          subunternehmer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subunternehmer_leistungen_leistung_id_fkey"
            columns: ["leistung_id"]
            isOneToOne: false
            referencedRelation: "leistungen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subunternehmer_leistungen_subunternehmer_id_fkey"
            columns: ["subunternehmer_id"]
            isOneToOne: false
            referencedRelation: "subunternehmer"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          created_at: string | null
          id: string
          log_type: string
          message: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          log_type: string
          message: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          log_type?: string
          message?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      team_verfuegbarkeit: {
        Row: {
          auftrag_id: string | null
          created_at: string
          created_by: string | null
          datum: string
          id: string
          notizen: string | null
          status: string
          subunternehmer_id: string
          updated_at: string
        }
        Insert: {
          auftrag_id?: string | null
          created_at?: string
          created_by?: string | null
          datum: string
          id?: string
          notizen?: string | null
          status?: string
          subunternehmer_id: string
          updated_at?: string
        }
        Update: {
          auftrag_id?: string | null
          created_at?: string
          created_by?: string | null
          datum?: string
          id?: string
          notizen?: string | null
          status?: string
          subunternehmer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_verfuegbarkeit_auftrag_id_fkey"
            columns: ["auftrag_id"]
            isOneToOne: false
            referencedRelation: "auftraege"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_verfuegbarkeit_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_verfuegbarkeit_subunternehmer_id_fkey"
            columns: ["subunternehmer_id"]
            isOneToOne: false
            referencedRelation: "subunternehmer"
            referencedColumns: ["id"]
          },
        ]
      }
      termine: {
        Row: {
          analyzed_at: string | null
          appointment_type:
            | Database["public"]["Enums"]["appointment_type_enum"]
            | null
          attendees: Json | null
          calendar_source: string
          created_at: string
          description: string | null
          destination_location: string | null
          end_datetime: string
          geocoded_at: string | null
          google_event_id: string | null
          historic_assigned_mitarbeiter_id: string | null
          historic_assigned_mitarbeiter_name: string | null
          historic_lead_id: string | null
          historic_thc_status:
            | Database["public"]["Enums"]["thc_status_enum"]
            | null
          hunter_task_status:
            | Database["public"]["Enums"]["hunter_tasks_status"]
            | null
          id: string
          inferred_location: string | null
          is_all_day: boolean
          is_customer_meeting: boolean | null
          last_synced_at: string | null
          lead_id: string | null
          location: string | null
          manual_override: boolean | null
          manual_override_timestamp: string | null
          meeting_location:
            | Database["public"]["Enums"]["meeting_location_enum"]
            | null
          mitarbeiter_id: string
          optimization_timestamp: string | null
          origin_location: string | null
          requires_return_home: boolean | null
          route_distance_km: number | null
          route_duration_calculated: number | null
          route_optimized: boolean | null
          start_datetime: string
          status: string
          status_captured_at: string | null
          sync_status: string
          task_log: string | null
          termin_status: Database["public"]["Enums"]["termin_status_enum"]
          title: string
          travel_time_minutes: number | null
          updated_at: string
        }
        Insert: {
          analyzed_at?: string | null
          appointment_type?:
            | Database["public"]["Enums"]["appointment_type_enum"]
            | null
          attendees?: Json | null
          calendar_source?: string
          created_at?: string
          description?: string | null
          destination_location?: string | null
          end_datetime: string
          geocoded_at?: string | null
          google_event_id?: string | null
          historic_assigned_mitarbeiter_id?: string | null
          historic_assigned_mitarbeiter_name?: string | null
          historic_lead_id?: string | null
          historic_thc_status?:
            | Database["public"]["Enums"]["thc_status_enum"]
            | null
          hunter_task_status?:
            | Database["public"]["Enums"]["hunter_tasks_status"]
            | null
          id?: string
          inferred_location?: string | null
          is_all_day?: boolean
          is_customer_meeting?: boolean | null
          last_synced_at?: string | null
          lead_id?: string | null
          location?: string | null
          manual_override?: boolean | null
          manual_override_timestamp?: string | null
          meeting_location?:
            | Database["public"]["Enums"]["meeting_location_enum"]
            | null
          mitarbeiter_id: string
          optimization_timestamp?: string | null
          origin_location?: string | null
          requires_return_home?: boolean | null
          route_distance_km?: number | null
          route_duration_calculated?: number | null
          route_optimized?: boolean | null
          start_datetime: string
          status?: string
          status_captured_at?: string | null
          sync_status?: string
          task_log?: string | null
          termin_status?: Database["public"]["Enums"]["termin_status_enum"]
          title: string
          travel_time_minutes?: number | null
          updated_at?: string
        }
        Update: {
          analyzed_at?: string | null
          appointment_type?:
            | Database["public"]["Enums"]["appointment_type_enum"]
            | null
          attendees?: Json | null
          calendar_source?: string
          created_at?: string
          description?: string | null
          destination_location?: string | null
          end_datetime?: string
          geocoded_at?: string | null
          google_event_id?: string | null
          historic_assigned_mitarbeiter_id?: string | null
          historic_assigned_mitarbeiter_name?: string | null
          historic_lead_id?: string | null
          historic_thc_status?:
            | Database["public"]["Enums"]["thc_status_enum"]
            | null
          hunter_task_status?:
            | Database["public"]["Enums"]["hunter_tasks_status"]
            | null
          id?: string
          inferred_location?: string | null
          is_all_day?: boolean
          is_customer_meeting?: boolean | null
          last_synced_at?: string | null
          lead_id?: string | null
          location?: string | null
          manual_override?: boolean | null
          manual_override_timestamp?: string | null
          meeting_location?:
            | Database["public"]["Enums"]["meeting_location_enum"]
            | null
          mitarbeiter_id?: string
          optimization_timestamp?: string | null
          origin_location?: string | null
          requires_return_home?: boolean | null
          route_distance_km?: number | null
          route_duration_calculated?: number | null
          route_optimized?: boolean | null
          start_datetime?: string
          status?: string
          status_captured_at?: string | null
          sync_status?: string
          task_log?: string | null
          termin_status?: Database["public"]["Enums"]["termin_status_enum"]
          title?: string
          travel_time_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "termine_historic_lead_id_fkey"
            columns: ["historic_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termine_historic_lead_id_fkey"
            columns: ["historic_lead_id"]
            isOneToOne: false
            referencedRelation: "leads_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termine_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termine_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      token_consumption_log: {
        Row: {
          consumed_at: string | null
          consumption_action: string
          context_data: Json | null
          error_message: string | null
          guthaben_id: string
          id: string
          mitarbeiter_id: string
          produkt_id: string
          refund_of_id: string | null
          status: string | null
          tokens_consumed: number | null
          webhook_response: Json | null
        }
        Insert: {
          consumed_at?: string | null
          consumption_action: string
          context_data?: Json | null
          error_message?: string | null
          guthaben_id: string
          id?: string
          mitarbeiter_id: string
          produkt_id: string
          refund_of_id?: string | null
          status?: string | null
          tokens_consumed?: number | null
          webhook_response?: Json | null
        }
        Update: {
          consumed_at?: string | null
          consumption_action?: string
          context_data?: Json | null
          error_message?: string | null
          guthaben_id?: string
          id?: string
          mitarbeiter_id?: string
          produkt_id?: string
          refund_of_id?: string | null
          status?: string | null
          tokens_consumed?: number | null
          webhook_response?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "token_consumption_log_guthaben_id_fkey"
            columns: ["guthaben_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter_token_guthaben"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_consumption_log_mitarbeiter_id_fkey"
            columns: ["mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_consumption_log_produkt_id_fkey"
            columns: ["produkt_id"]
            isOneToOne: false
            referencedRelation: "shop_produkte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_consumption_log_refund_of_id_fkey"
            columns: ["refund_of_id"]
            isOneToOne: false
            referencedRelation: "token_consumption_log"
            referencedColumns: ["id"]
          },
        ]
      }
      token_produkt_konfiguration: {
        Row: {
          consumption_action_type: string
          created_at: string | null
          expiry_days: number | null
          has_expiry: boolean | null
          id: string
          produkt_id: string
          requires_availability: boolean | null
          round_robin_scope: string | null
          updated_at: string | null
          uses_round_robin: boolean | null
          webhook_url: string | null
        }
        Insert: {
          consumption_action_type: string
          created_at?: string | null
          expiry_days?: number | null
          has_expiry?: boolean | null
          id?: string
          produkt_id: string
          requires_availability?: boolean | null
          round_robin_scope?: string | null
          updated_at?: string | null
          uses_round_robin?: boolean | null
          webhook_url?: string | null
        }
        Update: {
          consumption_action_type?: string
          created_at?: string | null
          expiry_days?: number | null
          has_expiry?: boolean | null
          id?: string
          produkt_id?: string
          requires_availability?: boolean | null
          round_robin_scope?: string | null
          updated_at?: string | null
          uses_round_robin?: boolean | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_produkt_konfiguration_produkt_id_fkey"
            columns: ["produkt_id"]
            isOneToOne: true
            referencedRelation: "shop_produkte"
            referencedColumns: ["id"]
          },
        ]
      }
      token_rechnungen: {
        Row: {
          anzahl_tokens: number
          bezahlt_am: string | null
          created_at: string
          einzelpreis: number
          faelligkeitsdatum: string
          gesamtpreis: number
          id: string
          mitarbeiter_id: string
          notizen: string | null
          produkt_id: string
          rechnungsdatum: string
          rechnungsnummer: string
          updated_at: string
          zahlungsstatus: string
        }
        Insert: {
          anzahl_tokens: number
          bezahlt_am?: string | null
          created_at?: string
          einzelpreis: number
          faelligkeitsdatum: string
          gesamtpreis: number
          id?: string
          mitarbeiter_id: string
          notizen?: string | null
          produkt_id: string
          rechnungsdatum?: string
          rechnungsnummer: string
          updated_at?: string
          zahlungsstatus?: string
        }
        Update: {
          anzahl_tokens?: number
          bezahlt_am?: string | null
          created_at?: string
          einzelpreis?: number
          faelligkeitsdatum?: string
          gesamtpreis?: number
          id?: string
          mitarbeiter_id?: string
          notizen?: string | null
          produkt_id?: string
          rechnungsdatum?: string
          rechnungsnummer?: string
          updated_at?: string
          zahlungsstatus?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_rechnungen_mitarbeiter_id_fkey"
            columns: ["mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_rechnungen_produkt_id_fkey"
            columns: ["produkt_id"]
            isOneToOne: false
            referencedRelation: "shop_produkte"
            referencedColumns: ["id"]
          },
        ]
      }
      token_transaktionen: {
        Row: {
          anzahl: number
          beschreibung: string | null
          created_at: string | null
          gesamtpreis: number | null
          id: string
          mitarbeiter_id: string
          preis_pro_token: number | null
          produkt_id: string
          typ: string
        }
        Insert: {
          anzahl: number
          beschreibung?: string | null
          created_at?: string | null
          gesamtpreis?: number | null
          id?: string
          mitarbeiter_id: string
          preis_pro_token?: number | null
          produkt_id: string
          typ: string
        }
        Update: {
          anzahl?: number
          beschreibung?: string | null
          created_at?: string | null
          gesamtpreis?: number | null
          id?: string
          mitarbeiter_id?: string
          preis_pro_token?: number | null
          produkt_id?: string
          typ?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_transaktionen_mitarbeiter_id_fkey"
            columns: ["mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_transaktionen_produkt_id_fkey"
            columns: ["produkt_id"]
            isOneToOne: false
            referencedRelation: "shop_produkte"
            referencedColumns: ["id"]
          },
        ]
      }
      transcripts: {
        Row: {
          audio_file_path: string | null
          audio_format: string | null
          average_confidence: number | null
          chunk_overlap_ms: number | null
          chunk_size_ms: number | null
          chunks_processed: number | null
          confidence_score: number | null
          consent_confirmed: boolean
          consent_device_info: Json | null
          consent_ip_address: string | null
          consent_location_lat: number | null
          consent_location_lng: number | null
          consent_method: string | null
          consent_signature: string | null
          consent_timestamp: string | null
          consent_user_agent: string | null
          created_at: string
          data_retention_until: string | null
          deletion_requested_at: string | null
          duration_seconds: number | null
          ended_at: string | null
          file_size_bytes: number | null
          id: string
          is_anonymized: boolean | null
          language: string | null
          last_chunk_processed_at: string | null
          lead_id: string
          mitarbeiter_id: string
          openai_model: string | null
          openai_request_id: string | null
          processing_chunks: Json | null
          processing_error: string | null
          processing_strategy: string | null
          recording_quality: string | null
          started_at: string
          status: string
          termin_id: string | null
          total_audio_duration_ms: number | null
          total_chunks: number | null
          transcript_text: string | null
          updated_at: string
        }
        Insert: {
          audio_file_path?: string | null
          audio_format?: string | null
          average_confidence?: number | null
          chunk_overlap_ms?: number | null
          chunk_size_ms?: number | null
          chunks_processed?: number | null
          confidence_score?: number | null
          consent_confirmed?: boolean
          consent_device_info?: Json | null
          consent_ip_address?: string | null
          consent_location_lat?: number | null
          consent_location_lng?: number | null
          consent_method?: string | null
          consent_signature?: string | null
          consent_timestamp?: string | null
          consent_user_agent?: string | null
          created_at?: string
          data_retention_until?: string | null
          deletion_requested_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          file_size_bytes?: number | null
          id?: string
          is_anonymized?: boolean | null
          language?: string | null
          last_chunk_processed_at?: string | null
          lead_id: string
          mitarbeiter_id: string
          openai_model?: string | null
          openai_request_id?: string | null
          processing_chunks?: Json | null
          processing_error?: string | null
          processing_strategy?: string | null
          recording_quality?: string | null
          started_at: string
          status?: string
          termin_id?: string | null
          total_audio_duration_ms?: number | null
          total_chunks?: number | null
          transcript_text?: string | null
          updated_at?: string
        }
        Update: {
          audio_file_path?: string | null
          audio_format?: string | null
          average_confidence?: number | null
          chunk_overlap_ms?: number | null
          chunk_size_ms?: number | null
          chunks_processed?: number | null
          confidence_score?: number | null
          consent_confirmed?: boolean
          consent_device_info?: Json | null
          consent_ip_address?: string | null
          consent_location_lat?: number | null
          consent_location_lng?: number | null
          consent_method?: string | null
          consent_signature?: string | null
          consent_timestamp?: string | null
          consent_user_agent?: string | null
          created_at?: string
          data_retention_until?: string | null
          deletion_requested_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          file_size_bytes?: number | null
          id?: string
          is_anonymized?: boolean | null
          language?: string | null
          last_chunk_processed_at?: string | null
          lead_id?: string
          mitarbeiter_id?: string
          openai_model?: string | null
          openai_request_id?: string | null
          processing_chunks?: Json | null
          processing_error?: string | null
          processing_strategy?: string | null
          recording_quality?: string | null
          started_at?: string
          status?: string
          termin_id?: string | null
          total_audio_duration_ms?: number | null
          total_chunks?: number | null
          transcript_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcripts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcripts_mitarbeiter_id_fkey"
            columns: ["mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcripts_termin_id_fkey"
            columns: ["termin_id"]
            isOneToOne: false
            referencedRelation: "termine"
            referencedColumns: ["id"]
          },
        ]
      }
      user_verantwortlichkeiten: {
        Row: {
          created_at: string | null
          id: string
          ist_standard: boolean | null
          user_id: string
          verantwortlichkeit_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ist_standard?: boolean | null
          user_id: string
          verantwortlichkeit_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ist_standard?: boolean | null
          user_id?: string
          verantwortlichkeit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "innendienst_verantwortlichkeiten_verantwortlichkeit_id_fkey"
            columns: ["verantwortlichkeit_id"]
            isOneToOne: false
            referencedRelation: "verantwortlichkeiten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_verantwortlichkeiten_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vdb_internal_meetings: {
        Row: {
          content: string | null
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vdb_lead_interactions: {
        Row: {
          content: string | null
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vdb_sales_strategy: {
        Row: {
          content: string | null
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      verantwortlichkeiten: {
        Row: {
          bereich:
            | Database["public"]["Enums"]["verantwortlichkeit_bereich_enum"]
            | null
          beschreibung: string | null
          code: string
          created_at: string
          id: string
          ist_aktiv: boolean
          manager_user_id: string | null
          name: string
          owner_user_id: string | null
          standard_user_id: string | null
          updated_at: string
        }
        Insert: {
          bereich?:
            | Database["public"]["Enums"]["verantwortlichkeit_bereich_enum"]
            | null
          beschreibung?: string | null
          code: string
          created_at?: string
          id?: string
          ist_aktiv?: boolean
          manager_user_id?: string | null
          name: string
          owner_user_id?: string | null
          standard_user_id?: string | null
          updated_at?: string
        }
        Update: {
          bereich?:
            | Database["public"]["Enums"]["verantwortlichkeit_bereich_enum"]
            | null
          beschreibung?: string | null
          code?: string
          created_at?: string
          id?: string
          ist_aktiv?: boolean
          manager_user_id?: string | null
          name?: string
          owner_user_id?: string | null
          standard_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verantwortlichkeiten_manager_user_id_fkey"
            columns: ["manager_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verantwortlichkeiten_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verantwortlichkeiten_standard_user_id_fkey"
            columns: ["standard_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verkaeufer_abwesenheiten: {
        Row: {
          created_at: string | null
          end_datum: string
          end_zeit: string | null
          id: string
          ist_ganztaegig: boolean
          mitarbeiter_id: string
          notiz: string | null
          start_datum: string
          start_zeit: string | null
          typ: Database["public"]["Enums"]["verkaeufer_abwesenheit_typ_enum"]
        }
        Insert: {
          created_at?: string | null
          end_datum: string
          end_zeit?: string | null
          id?: string
          ist_ganztaegig?: boolean
          mitarbeiter_id: string
          notiz?: string | null
          start_datum: string
          start_zeit?: string | null
          typ: Database["public"]["Enums"]["verkaeufer_abwesenheit_typ_enum"]
        }
        Update: {
          created_at?: string | null
          end_datum?: string
          end_zeit?: string | null
          id?: string
          ist_ganztaegig?: boolean
          mitarbeiter_id?: string
          notiz?: string | null
          start_datum?: string
          start_zeit?: string | null
          typ?: Database["public"]["Enums"]["verkaeufer_abwesenheit_typ_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "verkaeufer_abwesenheiten_mitarbeiter_id_fkey"
            columns: ["mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
        ]
      }
      verkaeufer_arbeitszeiten: {
        Row: {
          created_at: string | null
          erster_termin_start: string
          id: string
          ist_arbeitstag: boolean
          letzter_termin_start: string
          mitarbeiter_id: string
          updated_at: string | null
          wochentag: number
        }
        Insert: {
          created_at?: string | null
          erster_termin_start?: string
          id?: string
          ist_arbeitstag?: boolean
          letzter_termin_start?: string
          mitarbeiter_id: string
          updated_at?: string | null
          wochentag: number
        }
        Update: {
          created_at?: string | null
          erster_termin_start?: string
          id?: string
          ist_arbeitstag?: boolean
          letzter_termin_start?: string
          mitarbeiter_id?: string
          updated_at?: string | null
          wochentag?: number
        }
        Relationships: [
          {
            foreignKeyName: "verkaeufer_arbeitszeiten_mitarbeiter_id_fkey"
            columns: ["mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
        ]
      }
      verkaeufer_standort_ausnahmen: {
        Row: {
          created_at: string | null
          custom_adresse: string | null
          custom_lat: number | null
          custom_lng: number | null
          custom_ort: string | null
          custom_plz: string | null
          datum: string
          id: string
          mitarbeiter_id: string
          notiz: string | null
          standort_typ: string
        }
        Insert: {
          created_at?: string | null
          custom_adresse?: string | null
          custom_lat?: number | null
          custom_lng?: number | null
          custom_ort?: string | null
          custom_plz?: string | null
          datum: string
          id?: string
          mitarbeiter_id: string
          notiz?: string | null
          standort_typ: string
        }
        Update: {
          created_at?: string | null
          custom_adresse?: string | null
          custom_lat?: number | null
          custom_lng?: number | null
          custom_ort?: string | null
          custom_plz?: string | null
          datum?: string
          id?: string
          mitarbeiter_id?: string
          notiz?: string | null
          standort_typ?: string
        }
        Relationships: [
          {
            foreignKeyName: "verkaeufer_standort_ausnahmen_mitarbeiter_id_fkey"
            columns: ["mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
        ]
      }
      warengruppen: {
        Row: {
          beschreibung: string | null
          created_at: string | null
          farbe: string | null
          icon_name: string | null
          id: string
          ist_aktiv: boolean | null
          katalog_beschreibung: string | null
          name: string
          parent_id: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          beschreibung?: string | null
          created_at?: string | null
          farbe?: string | null
          icon_name?: string | null
          id?: string
          ist_aktiv?: boolean | null
          katalog_beschreibung?: string | null
          name: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          beschreibung?: string | null
          created_at?: string | null
          farbe?: string | null
          icon_name?: string | null
          id?: string
          ist_aktiv?: boolean | null
          katalog_beschreibung?: string | null
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warengruppen_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "warengruppen"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          auth_header: string | null
          beschreibung: string | null
          created_at: string
          created_by: string | null
          id: string
          last_error_message: string | null
          last_status_code: number | null
          last_triggered_at: string | null
          methode: string
          name: string
          notizen: string | null
          request_body_beispiel: Json | null
          response_beispiel: Json | null
          status: Database["public"]["Enums"]["webhook_status"]
          tags: string[] | null
          typ: Database["public"]["Enums"]["webhook_typ"]
          updated_at: string
          url: string
          webhook_secret: string | null
        }
        Insert: {
          auth_header?: string | null
          beschreibung?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_error_message?: string | null
          last_status_code?: number | null
          last_triggered_at?: string | null
          methode?: string
          name: string
          notizen?: string | null
          request_body_beispiel?: Json | null
          response_beispiel?: Json | null
          status?: Database["public"]["Enums"]["webhook_status"]
          tags?: string[] | null
          typ?: Database["public"]["Enums"]["webhook_typ"]
          updated_at?: string
          url: string
          webhook_secret?: string | null
        }
        Update: {
          auth_header?: string | null
          beschreibung?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_error_message?: string | null
          last_status_code?: number | null
          last_triggered_at?: string | null
          methode?: string
          name?: string
          notizen?: string | null
          request_body_beispiel?: Json | null
          response_beispiel?: Json | null
          status?: Database["public"]["Enums"]["webhook_status"]
          tags?: string[] | null
          typ?: Database["public"]["Enums"]["webhook_typ"]
          updated_at?: string
          url?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      "zoho-credentials": {
        Row: {
          access_token: string | null
          created_at: string
          expires_at: string | null
          id: number
          refresh_lock_deadline: string | null
          refresh_started_at: string | null
          refresh_token: string | null
          refreshing: boolean | null
          scope: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: number
          refresh_lock_deadline?: string | null
          refresh_started_at?: string | null
          refresh_token?: string | null
          refreshing?: boolean | null
          scope?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: number
          refresh_lock_deadline?: string | null
          refresh_started_at?: string | null
          refresh_token?: string | null
          refreshing?: boolean | null
          scope?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      city_day_clusters: {
        Row: {
          avg_probability: number | null
          centroid: unknown
          city_name: string | null
          city_plz: string | null
          lead_count: number | null
          mitarbeiter_id: string | null
          total_value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_mitarbeiter_id_fkey"
            columns: ["mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
        ]
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      leads_with_details: {
        Row: {
          abschluss_datum: string | null
          abschluss_wahrscheinlichkeit: number | null
          address_hash: string | null
          automatisch_kunde_erstellt: boolean | null
          created_at: string | null
          erstelldatum_crm: string | null
          geocoded_at: string | null
          geschaetzter_wert: number | null
          id: string | null
          ist_firmenkunde: boolean | null
          kontakt_datum: string | null
          kunde_anrede: string | null
          kunde_email: string | null
          kunde_firmenname: string | null
          kunde_hausnummer: string | null
          kunde_id: string | null
          kunde_lat: number | null
          kunde_lng: number | null
          kunde_nachname: string | null
          kunde_name: string | null
          kunde_ort: string | null
          kunde_plz: string | null
          kunde_strasse: string | null
          kunde_telefon: string | null
          kunde_titel: string | null
          kunde_vorname: string | null
          last_appointment_date: string | null
          lead_art_id: string | null
          lead_art_ids: string[] | null
          lead_arten_names: string | null
          lead_datum: string | null
          lead_name: string | null
          lead_quelle: string | null
          leadpreis: number | null
          leadquelle_id: string | null
          leadquelle_name: string | null
          lieferadresse_hausnummer: string | null
          lieferadresse_lat: number | null
          lieferadresse_lng: number | null
          lieferadresse_ort: string | null
          lieferadresse_plz: string | null
          lieferadresse_strasse: string | null
          mitarbeiter_id: string | null
          mitarbeiter_name: string | null
          nettoangebotssumme: number | null
          next_suggested_appointment_date: string | null
          notizen: string | null
          projektart: Database["public"]["Enums"]["projektart_enum"] | null
          referenz_nummer: string | null
          signier_datum_final: string | null
          signier_datum_thc: string | null
          status: Database["public"]["Enums"]["lead_status_enum"] | null
          tatsaechlicher_wert: number | null
          thc_status: Database["public"]["Enums"]["thc_status_enum"] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_kunde_id_fkey"
            columns: ["kunde_id"]
            isOneToOne: false
            referencedRelation: "kunden"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_lead_art_id_fkey"
            columns: ["lead_art_id"]
            isOneToOne: false
            referencedRelation: "lead_arten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_leadquelle_id_fkey"
            columns: ["leadquelle_id"]
            isOneToOne: false
            referencedRelation: "leadquellen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_mitarbeiter_id_fkey"
            columns: ["mitarbeiter_id"]
            isOneToOne: false
            referencedRelation: "mitarbeiter"
            referencedColumns: ["id"]
          },
        ]
      }
      produkte_katalog_view: {
        Row: {
          anzahl_varianten: number | null
          artikelnummer: string | null
          beschreibung: string | null
          created_at: string | null
          einheit: string | null
          hersteller_id: string | null
          hersteller_logo: string | null
          hersteller_name: string | null
          id: string | null
          ist_aktiv: boolean | null
          katalog_sichtbar: boolean | null
          max_preis: number | null
          min_preis: number | null
          name: string | null
          parent_produkt_id: string | null
          produkttyp: Database["public"]["Enums"]["produkttyp"] | null
          tags: string[] | null
          warengruppe_farbe: string | null
          warengruppe_icon: string | null
          warengruppe_id: string | null
          warengruppe_name: string | null
          warengruppe_parent_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produkte_hersteller_id_fkey"
            columns: ["hersteller_id"]
            isOneToOne: false
            referencedRelation: "hersteller"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produkte_parent_produkt_id_fkey"
            columns: ["parent_produkt_id"]
            isOneToOne: false
            referencedRelation: "produkte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produkte_parent_produkt_id_fkey"
            columns: ["parent_produkt_id"]
            isOneToOne: false
            referencedRelation: "produkte_katalog_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produkte_warengruppe_id_fkey"
            columns: ["warengruppe_id"]
            isOneToOne: false
            referencedRelation: "warengruppen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warengruppen_parent_id_fkey"
            columns: ["warengruppe_parent_id"]
            isOneToOne: false
            referencedRelation: "warengruppen"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      admin_add_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: undefined
      }
      admin_check_user_dependencies: {
        Args: { _target_user_id: string }
        Returns: Json
      }
      admin_create_access_group:
        | {
            Args: {
              _app_code: string
              _default_app_role_id?: string
              _description?: string
              _is_default?: boolean
              _name: string
              _system_role?: string
            }
            Returns: string
          }
        | {
            Args: {
              _application_id?: string
              _default_app_role_id?: string
              _description?: string
              _name: string
              _system_role?: string
            }
            Returns: Json
          }
      admin_deactivate_user: {
        Args: { _deactivate?: boolean; _target_user_id: string }
        Returns: Json
      }
      admin_deactivate_user_with_mitarbeiter: {
        Args: {
          _austrittsdatum?: string
          _deactivate: boolean
          _target_user_id: string
        }
        Returns: Json
      }
      admin_delete_access_group: {
        Args: { _group_id: string }
        Returns: undefined
      }
      admin_delete_group_app_role: {
        Args: { _app_id: string; _group_id: string }
        Returns: undefined
      }
      admin_delete_mitarbeiter_safely:
        | { Args: { _mitarbeiter_id: string }; Returns: Json }
        | {
            Args: { _force_delete?: boolean; _mitarbeiter_id: string }
            Returns: Json
          }
      admin_delete_user: { Args: { _target_user_id: string }; Returns: Json }
      admin_get_all_app_modules_with_user_status: {
        Args: { _app_id: string; _target_user_id: string }
        Returns: Json
      }
      admin_get_app_modules: {
        Args: { _app_id: string }
        Returns: {
          depth: number
          icon_name: string
          module_code: string
          module_id: string
          module_name: string
          parent_module_id: string
          route: string
          sort_order: number
        }[]
      }
      admin_get_application_details: {
        Args: { _app_id: string }
        Returns: Json
      }
      admin_get_group_details: { Args: { _group_id: string }; Returns: Json }
      admin_get_group_permissions: {
        Args: { p_group_id: string }
        Returns: Json
      }
      admin_get_user_direct_modules: {
        Args: { _target_user_id: string }
        Returns: {
          app_id: string
          app_name: string
          can_delete: boolean
          can_write: boolean
          module_code: string
          module_id: string
          module_name: string
        }[]
      }
      admin_get_user_effective_permissions: {
        Args: { _target_user_id: string }
        Returns: Json
      }
      admin_list_access_groups: { Args: { _app_code?: string }; Returns: Json }
      admin_list_all_modules: {
        Args: { _app_code: string }
        Returns: {
          code: string
          description: string
          icon_name: string
          is_active: boolean
          module_id: string
          name: string
          sort_order: number
        }[]
      }
      admin_list_applications: { Args: never; Returns: Json }
      admin_list_directory_users: {
        Args: { _app_code: string }
        Returns: {
          access_groups: Json
          avatar_url: string
          email: string
          is_active: boolean
          is_deactivated: boolean
          nachname: string
          name: string
          status_label: string
          system_roles: string[]
          telefon: string
          user_id: string
          vorname: string
        }[]
      }
      admin_list_directory_users_extended: {
        Args: { _app_code?: string }
        Returns: {
          auth_created_at: string
          avatar_url: string
          effective_system_role: string
          email: string
          email_confirmed_at: string
          groups: Json
          id: string
          is_admin: boolean
          is_deactivated: boolean
          last_sign_in_at: string
          mitarbeiter_id: string
          nachname: string
          name: string
          role_inherited_from_group: string
          role_is_inherited: boolean
          status_label: string
          system_roles: string[]
          telefon: string
          vorname: string
        }[]
      }
      admin_list_group_app_roles: { Args: { _group_id: string }; Returns: Json }
      admin_list_users_not_in_group: {
        Args: { _group_id: string }
        Returns: {
          avatar_url: string
          email: string
          id: string
          nachname: string
          name: string
          vorname: string
        }[]
      }
      admin_remove_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: undefined
      }
      admin_set_group_app_role: {
        Args: {
          _app_id: string
          _app_role_id?: string
          _group_id: string
          _inherit_system_role?: boolean
        }
        Returns: undefined
      }
      admin_set_group_modules: {
        Args: { _group_id: string; _modules: Json }
        Returns: undefined
      }
      admin_set_user_access_groups: {
        Args: { _access_group_ids: string[]; _target_user_id: string }
        Returns: undefined
      }
      admin_set_user_direct_access: {
        Args: { _access: Json; _target_user_id: string }
        Returns: Json
      }
      admin_set_user_direct_apps: {
        Args: { _apps: Json; _target_user_id: string }
        Returns: Json
      }
      admin_set_user_direct_modules: {
        Args: { _modules?: Json; _target_user_id: string }
        Returns: Json
      }
      admin_set_user_system_role: {
        Args: { _role: string; _target_user_id: string }
        Returns: undefined
      }
      admin_update_access_group:
        | {
            Args: {
              _application_id?: string
              _clear_app_role?: boolean
              _default_app_role_id?: string
              _description?: string
              _group_id: string
              _name?: string
              _system_role?: string
            }
            Returns: Json
          }
        | {
            Args: {
              _app_code?: string
              _clear_app_role?: boolean
              _default_app_role_id?: string
              _description?: string
              _group_id: string
              _is_default?: boolean
              _name?: string
              _system_role?: string
            }
            Returns: Json
          }
        | {
            Args: {
              _description?: string
              _group_id: string
              _name: string
              _system_role?: string
            }
            Returns: Json
          }
      assign_lead_to_bestellung: {
        Args: { p_lead_id: string }
        Returns: string
      }
      assign_leads_to_bestellung: {
        Args: { p_bestellung_id: string }
        Returns: {
          assigned_count: number
          details: Json
        }[]
      }
      auto_complete_bestellungen: { Args: never; Returns: number }
      auto_mark_tasks_overdue: { Args: never; Returns: undefined }
      auto_trigger_geocoding: { Args: never; Returns: undefined }
      backfill_lead_data_from_kunden: {
        Args: { p_limit?: number }
        Returns: Json
      }
      bulk_assign_leads: {
        Args: { p_limit?: number }
        Returns: {
          execution_time_ms: number
          total_matched: number
          total_processed: number
          total_unmatched: number
        }[]
      }
      calculate_address_hash: {
        Args: { hausnummer: string; ort: string; plz: string; strasse: string }
        Returns: string
      }
      calculate_auszahlungsmonat: {
        Args: {
          anzahlung_datum: string
          bauende_datum: string
          zahlungsart: string
        }
        Returns: string
      }
      calculate_auszahlungsmonat_for_all_orders: {
        Args: never
        Returns: number
      }
      calculate_city_day_score_v2: {
        Args: {
          p_is_onsite?: boolean
          p_lead_id: string
          p_mitarbeiter_id: string
          p_target_date: string
        }
        Returns: Json
      }
      calculate_end_datum: {
        Args: {
          p_laufzeit_anzahl: number
          p_laufzeit_einheit: string
          p_start_datum: string
        }
        Returns: string
      }
      calculate_lead_costs_for_month: {
        Args: { p_leadquelle_id: string; p_monat: string }
        Returns: {
          avg_cost_per_lead: number
          lead_count: number
          total_cost: number
        }[]
      }
      calculate_verkaufsmonat: {
        Args: { final_signing_date: string }
        Returns: string
      }
      can_access_audio_object: {
        Args: { object_name: string }
        Returns: boolean
      }
      can_upload_transcript_audio: {
        Args: { object_name: string }
        Returns: boolean
      }
      check_auszahlung_status: {
        Args: { auftrag_id: string }
        Returns: {
          gruende: string[]
          naechste_pruefung: string
          status: string
        }[]
      }
      check_is_admin: { Args: { _user_id: string }; Returns: boolean }
      check_kpi_content_fingerprint_duplicate: {
        Args: {
          p_exclude_nachweis_id: string
          p_fingerprint: string
          p_user_id: string
        }
        Returns: {
          created_at: string
          fingerprint: string
          id: string
          lead_name: string
        }[]
      }
      check_kpi_nachweis_duplicate: {
        Args: { p_exclude_nachweis_id: string; p_image_hash: string }
        Returns: {
          created_at: string
          id: string
          user_id: string
        }[]
      }
      check_kpi_nachweis_perceptual_duplicate: {
        Args: {
          p_exclude_nachweis_id: string
          p_perceptual_hash: string
          p_user_id: string
        }
        Returns: {
          created_at: string
          id: string
          lead_name: string
        }[]
      }
      check_lead_status_logging_quality: {
        Args: never
        Returns: {
          count: number
          metric: string
          percentage: number
        }[]
      }
      check_module_access: {
        Args: { _app_code: string; _module_code: string; _user_id: string }
        Returns: boolean
      }
      check_user_is_superadmin: { Args: { _user_id: string }; Returns: boolean }
      cleanup_old_audio_files: { Args: never; Returns: undefined }
      cleanup_orphan_transcripts: { Args: never; Returns: number }
      complete_arbeitspaket_and_advance:
        | { Args: { p_auftrag_arbeitspaket_id: string }; Returns: Json }
        | {
            Args: {
              p_auftrag_arbeitspaket_id: string
              p_ziel_substatus_override?: string
            }
            Returns: Json
          }
      compute_display_name: {
        Args: {
          p_fallback_email?: string
          p_fallback_name?: string
          p_nachname: string
          p_vorname: string
        }
        Returns: string
      }
      consume_token: {
        Args: {
          p_consumption_action: string
          p_context_data?: Json
          p_mitarbeiter_id: string
          p_produkt_id: string
        }
        Returns: string
      }
      count_superadmins: { Args: never; Returns: number }
      create_produkt_recht_dokument: {
        Args: {
          p_beschreibung?: string
          p_gueltig_ab?: string
          p_gueltig_bis?: string
          p_inhalt_html?: string
          p_ist_aktiv?: boolean
          p_lieferant_id?: string
          p_pdf_url?: string
          p_slug: string
          p_titel: string
        }
        Returns: string
      }
      create_provision_pdf_version:
        | {
            Args: {
              p_document_type: string
              p_file_path: string
              p_is_month_locked: boolean
              p_kalkulation_id: string
              p_mitarbeiter_id: string
              p_month_lock_id: string
            }
            Returns: {
              record_id: string
              version_number: number
            }[]
          }
        | {
            Args: {
              p_document_type: string
              p_file_path: string
              p_file_size?: number
              p_html_content?: string
              p_is_month_locked: boolean
              p_kalkulation_id: string
              p_mitarbeiter_id: string
              p_month_lock_id: string
            }
            Returns: {
              record_id: string
              version_number: number
            }[]
          }
      create_thermocheck_idee: {
        Args: {
          p_beschreibung?: string
          p_created_by?: string
          p_kategorie?: string
          p_prioritaet?: string
          p_titel: string
        }
        Returns: string
      }
      delete_produkt_recht_dokument: { Args: { p_id: string }; Returns: string }
      delete_thermocheck_idee: { Args: { p_id: string }; Returns: undefined }
      delete_user_app_role: {
        Args: { _app_id: string; _user_id: string }
        Returns: boolean
      }
      detect_preisliste_conflicts: {
        Args: never
        Returns: {
          conflict_count: number
          date_ranges: string
          lead_art_name: string
          leadquelle_name: string
        }[]
      }
      disablelongtransactions: { Args: never; Returns: string }
      disconnect_kombipaket_partners: {
        Args: { p_auftrag_id: string }
        Returns: Json
      }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      emergency_delete_pdf: {
        Args: { p_admin_reason: string; p_pdf_id: string }
        Returns: boolean
      }
      enablelongtransactions: { Args: never; Returns: string }
      ensure_arbeitspaket_exists: {
        Args: { p_auftrag_id: string; p_substatus: string }
        Returns: string
      }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      find_matching_bestellung: { Args: { p_lead_id: string }; Returns: string }
      find_potential_duplicates: {
        Args: {
          p_email?: string
          p_exclude_lead_id?: string
          p_firmenname?: string
          p_nachname?: string
          p_ort?: string
          p_plz?: string
          p_strasse?: string
          p_telefon?: string
          p_vorname?: string
        }
        Returns: {
          details: string
          id: string
          match_score: number
          name: string
          type: string
        }[]
      }
      generate_bestellnummer: {
        Args: {
          p_gebiet_config: Json
          p_gebiet_typ: string
          p_leadquelle_id: string
        }
        Returns: string
      }
      generate_rechnungsnummer: { Args: never; Returns: string }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_active_bestellungen: {
        Args: never
        Returns: {
          bestellnummer: string
          bestellungs_name: string
          created_at: string
          end_datum: string
          gebiet_config: Json
          gebiet_typ: string
          gesamt_betrag: number
          id: string
          is_d2d_campaign: boolean
          kontingent_gesamt: number
          kontingent_typ: string
          laufzeit_anzahl: number
          laufzeit_einheit: string
          lead_art_id: string
          lead_art_name: string
          leadquelle_id: string
          leadquelle_name: string
          leads_geliefert: number
          leads_verbleibend: number
          notizen: string
          progress_percent: number
          start_datum: string
          status: string
          vereinbarter_preis_pro_lead: number
        }[]
      }
      get_admins_with_app_access: {
        Args: { _app_code: string }
        Returns: {
          email: string
          name: string
          user_id: string
          vorname: string
        }[]
      }
      get_app_roles: { Args: { _app_id: string }; Returns: Json }
      get_assignable_reviewers_sales_training: {
        Args: never
        Returns: {
          avatar_url: string
          display_name: string
          role_type: string
          user_id: string
        }[]
      }
      get_available_token_holders: {
        Args: { p_min_tokens?: number; p_produkt_id: string }
        Returns: {
          last_consumed_at: string
          mitarbeiter_email: string
          mitarbeiter_id: string
          mitarbeiter_name: string
          verfügbare_tokens: number
        }[]
      }
      get_baustellenstatus_values: {
        Args: never
        Returns: {
          label: string
          ord: number
        }[]
      }
      get_enum_values: { Args: { enum_name: string }; Returns: string[] }
      get_group_permissions: { Args: { _group_id: string }; Returns: Json }
      get_kpi_metrik_typen: {
        Args: { p_domain?: string }
        Returns: {
          beschreibung: string
          code: string
          domain: string
          farbe: string
          icon_name: string
          id: string
          ist_aktiv: boolean
          name: string
          sort_order: number
          ziel_einheit: string
        }[]
      }
      get_kpi_nachweis_by_id: {
        Args: { p_nachweis_id: string }
        Returns: {
          ai_validation_result: Json
          ai_validiert_am: string
          created_at: string
          eintrag_datum: string
          eintrag_jahr: number
          eintrag_woche: number
          id: string
          kunde_id: string
          lead_id: string
          metrik_code: string
          metrik_name: string
          metrik_typ_id: string
          nachweis_notizen: string
          screenshot_url: string
          termin_datum: string
          transkript_text: string
          transkript_url: string
          user_id: string
          validierung_status: string
        }[]
      }
      get_kpi_nachweis_version_history: {
        Args: { p_nachweis_id: string }
        Returns: {
          created_at: string
          id: string
          is_current: boolean
          reason: string
          validierung_status: string
          version_nr: number
        }[]
      }
      get_kpi_nachweise: {
        Args: {
          p_domain: string
          p_jahr: number
          p_user_id?: string
          p_woche: number
        }
        Returns: {
          ai_validation_result: Json
          ai_validiert_am: string
          created_at: string
          eintrag_datum: string
          eintrag_jahr: number
          eintrag_woche: number
          id: string
          kunde_id: string
          lead_id: string
          metrik_code: string
          metrik_name: string
          metrik_typ_id: string
          nachweis_notizen: string
          screenshot_url: string
          termin_datum: string
          transkript_url: string
          user_id: string
          validierung_status: string
        }[]
      }
      get_kpi_weekly_history_last_weeks: {
        Args: { p_domain: string; p_user_id?: string; p_weeks_back?: number }
        Returns: {
          anzahl: number
          jahr: number
          woche: number
        }[]
      }
      get_kpi_weekly_history_year: {
        Args: { p_domain: string; p_jahr: number; p_user_id?: string }
        Returns: {
          anzahl: number
          woche: number
        }[]
      }
      get_kpi_wochenfortschritt: {
        Args: {
          p_domain: string
          p_jahr: number
          p_user_id?: string
          p_woche: number
        }
        Returns: {
          anzahl_eintraege: number
          farbe: string
          icon_name: string
          metrik_code: string
          metrik_name: string
        }[]
      }
      get_lead_costs_for_months: {
        Args: { p_mitarbeiter_id: string; p_month: string }
        Returns: {
          current_count: number
          current_sum: number
          prev_count: number
          prev_sum: number
        }[]
      }
      get_lead_metrics_for_month: {
        Args: { p_leadquelle_id: string; p_monat: string }
        Returns: {
          auftrag_count: number
          lead_anzahl_ist: number
          lead_anzahl_rechnung: number
          leadquelle_id: string
          leadquelle_name: string
          monat: string
          rechnungsbetrag_netto: number
          revenue: number
          thc_count: number
        }[]
      }
      get_mitarbeiter_id_for_user: {
        Args: { p_user_id?: string }
        Returns: string
      }
      get_module_hierarchy: {
        Args: { _app_code: string }
        Returns: {
          code: string
          depth: number
          has_children: boolean
          icon_name: string
          module_id: string
          name: string
          parent_code: string
          parent_module_id: string
          route: string
          sort_order: number
        }[]
      }
      get_monthly_lead_costs_overview: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          abweichung_prozent: number
          kosten_soll: number
          last_updated: string
          lead_anzahl_soll: number
          leadquelle_id: string
          leadquelle_name: string
          monat: string
          rechnung_betrag: number
          rechnung_id: string
          rechnung_status: string
        }[]
      }
      get_next_action: { Args: { p_substatus: string }; Returns: string }
      get_next_version_number: {
        Args: {
          p_document_type: string
          p_mitarbeiter_id: string
          p_month_lock_id: string
        }
        Returns: number
      }
      get_produkt_recht_dokument_by_slug: {
        Args: { p_slug: string }
        Returns: {
          beschreibung: string
          gueltig_ab: string
          gueltig_bis: string
          id: string
          inhalt_html: string
          lieferant_name: string
          pdf_url: string
          slug: string
          titel: string
        }[]
      }
      get_produkt_recht_dokumente: {
        Args: never
        Returns: {
          beschreibung: string
          created_at: string
          created_by: string
          gueltig_ab: string
          gueltig_bis: string
          id: string
          inhalt_html: string
          ist_aktiv: boolean
          lieferant_id: string
          lieferant_name: string
          pdf_url: string
          slug: string
          titel: string
          updated_at: string
        }[]
      }
      get_produkt_recht_versionen: {
        Args: { p_dokument_id: string }
        Returns: {
          aenderungsgrund: string
          dokument_id: string
          erstellt_am: string
          erstellt_von: string
          id: string
          inhalt_html: string
          pdf_url: string
          version: number
        }[]
      }
      get_profile_mitarbeiter_id: {
        Args: { user_id?: string }
        Returns: string
      }
      get_termine_for_lead: {
        Args: { p_lead_id: string }
        Returns: {
          appointment_type: Database["public"]["Enums"]["appointment_type_enum"]
          description: string
          end_datetime: string
          id: string
          lead_id: string
          location: string
          start_datetime: string
          title: string
        }[]
      }
      get_thermocheck_ideen: {
        Args: never
        Returns: {
          beschreibung: string
          created_at: string
          created_by: string
          creator_name: string
          id: string
          kategorie: string
          prioritaet: string
          status: string
          titel: string
          updated_at: string
        }[]
      }
      get_user_accessible_apps: {
        Args: { _user_id?: string }
        Returns: {
          app_code: string
          app_description: string
          app_name: string
          base_url: string
        }[]
      }
      get_user_app_role: { Args: { _app_code: string }; Returns: string }
      get_user_app_role_details: {
        Args: { _app_id: string; _user_id: string }
        Returns: Json
      }
      get_user_iam_modules: {
        Args: { _app_code: string; _user_id: string }
        Returns: {
          can_delete: boolean
          can_write: boolean
          depth: number
          icon_name: string
          module_code: string
          module_name: string
          parent_module_id: string
          route: string
          sort_order: number
        }[]
      }
      get_user_iam_roles:
        | { Args: never; Returns: string[] }
        | { Args: { _user_id: string }; Returns: string[] }
      get_user_id_for_mitarbeiter: {
        Args: { _mitarbeiter_id: string }
        Returns: string
      }
      get_user_role: { Args: never; Returns: string }
      get_users_with_module_access: {
        Args: { _module_code: string }
        Returns: {
          email: string
          id: string
          is_mitarbeiter: boolean
          name: string
        }[]
      }
      get_verkaeufer_effective_homebase: {
        Args: { p_datum: string; p_mitarbeiter_id: string }
        Returns: {
          adresse: string
          lat: number
          lng: number
          ort: string
          plz: string
          quelle: string
        }[]
      }
      get_won_leads_public: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_status?: string
        }
        Returns: {
          id: string
          kunde_email: string
          kunde_hausnummer: string
          kunde_nachname: string
          kunde_ort: string
          kunde_plz: string
          kunde_strasse: string
          kunde_telefon: string
          kunde_vorname: string
          lead_datum: string
          lead_name: string
          projektart: string
          status: string
          thc_status: string
          total_count: number
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      has_role: {
        Args: {
          required_role: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Returns: boolean
      }
      hat_verantwortlichkeit: {
        Args: { p_verantwortlichkeit_id: string }
        Returns: boolean
      }
      insert_kpi_nachweis: {
        Args: {
          p_kunde_id?: string
          p_lead_id?: string
          p_metrik_typ_id: string
          p_nachweis_notizen?: string
          p_screenshot_url?: string
          p_termin_datum?: string
          p_transkript_text?: string
          p_transkript_url?: string
        }
        Returns: string
      }
      is_admin: { Args: { user_id?: string }; Returns: boolean }
      is_month_locked: {
        Args: { p_month: number; p_year: number }
        Returns: boolean
      }
      is_sales_training_admin: { Args: never; Returns: boolean }
      is_verkaeufer_available: {
        Args: { p_datum: string; p_mitarbeiter_id: string; p_zeit?: string }
        Returns: boolean
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      manually_assign_leads_batch:
        | {
            Args: { p_bestellung_id: string; p_lead_ids: string[] }
            Returns: Json
          }
        | {
            Args: {
              p_bestellung_id: string
              p_force?: boolean
              p_lead_ids: string[]
            }
            Returns: Json
          }
      match_customer_interactions: {
        Args: {
          filter?: Json
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      match_documents: {
        Args: {
          filter?: Json
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_internal_documents: {
        Args: {
          filter?: Json
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_internal_meetings: {
        Args: {
          filter?: Json
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      match_lead_interactions: {
        Args: {
          filter?: Json
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      match_sales_strategy: {
        Args: {
          filter?: Json
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      merge_duplicate_lead_status_entries: { Args: never; Returns: Json }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      refresh_city_clusters: { Args: never; Returns: undefined }
      refund_token: {
        Args: { p_log_id: string; p_reason: string }
        Returns: boolean
      }
      register_anrufversuch: {
        Args: { p_arbeitspaket_id: string }
        Returns: Json
      }
      resubmit_kpi_nachweis: {
        Args: {
          p_lead_id: string
          p_nachweis_notizen?: string
          p_original_nachweis_id: string
          p_screenshot_url?: string
          p_termin_datum?: string
          p_transkript_text?: string
          p_transkript_url?: string
        }
        Returns: string
      }
      save_dev_todo: {
        Args: { p_content: string; p_todo_id?: string; p_user_id: string }
        Returns: string
      }
      service_role_add_user_to_group: {
        Args: {
          _access_group_id: string
          _granted_by?: string
          _target_user_id: string
        }
        Returns: undefined
      }
      service_role_set_user_access_groups:
        | {
            Args: {
              _access_group_ids: string[]
              _granted_by?: string
              _target_user_id: string
            }
            Returns: Json
          }
        | {
            Args: { _group_ids: string[]; _target_user_id: string }
            Returns: Json
          }
      service_role_set_user_app_role: {
        Args: {
          _app_role_id?: string
          _application_id: string
          _granted_by?: string
          _inherit_system_role?: boolean
          _target_user_id: string
        }
        Returns: Json
      }
      service_role_set_user_app_roles: {
        Args: {
          _app_roles: Json
          _granted_by?: string
          _target_user_id: string
        }
        Returns: Json
      }
      service_role_set_user_module_access: {
        Args: {
          _can_delete?: boolean
          _can_write?: boolean
          _module_id: string
          _target_user_id: string
        }
        Returns: undefined
      }
      service_role_set_user_system_role: {
        Args: { _role: string; _target_user_id: string }
        Returns: undefined
      }
      set_kpi_nachweis_content_fingerprint: {
        Args: { p_fingerprint: string; p_nachweis_id: string }
        Returns: undefined
      }
      set_kpi_nachweis_image_hash: {
        Args: { p_image_hash: string; p_nachweis_id: string }
        Returns: undefined
      }
      set_kpi_nachweis_perceptual_hash: {
        Args: { p_nachweis_id: string; p_perceptual_hash: string }
        Returns: undefined
      }
      set_kunde_coordinates: {
        Args: {
          p_address_type: string
          p_kunde_id: string
          p_lat: number
          p_lng: number
        }
        Returns: undefined
      }
      set_lead_coordinates: {
        Args: { p_lat: number; p_lead_id: string; p_lng: number }
        Returns: undefined
      }
      set_user_app_role: {
        Args: {
          _app_id: string
          _app_role_id?: string
          _inherit_system_role?: boolean
          _user_id: string
        }
        Returns: string
      }
      simple_invite_user: {
        Args: { user_email: string; user_name: string }
        Returns: Json
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      suggest_appointment_slots_v2: {
        Args: {
          p_days_ahead?: number
          p_is_onsite?: boolean
          p_lead_id: string
          p_mitarbeiter_id: string
        }
        Returns: {
          available_slots: Json
          day_info: Json
          reasoning: Json
          recommendation_type: string
          score: number
          target_date: string
        }[]
      }
      sync_mitarbeiter_termination_to_user: {
        Args: { _austrittsdatum: string; _mitarbeiter_id: string }
        Returns: Json
      }
      thermocheck_create_techniker_onboarding: {
        Args: {
          p_email?: string
          p_nachname: string
          p_onboarding_phase?: string
          p_onboarding_substatus?: string
          p_telefon?: string
          p_vertrag_dokument_url?: string
          p_vorname: string
        }
        Returns: unknown
        SetofOptions: {
          from: "*"
          to: "techniker_onboarding"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      thermocheck_delete_techniker_onboarding: {
        Args: { p_id: string }
        Returns: boolean
      }
      thermocheck_get_techniker_onboarding: {
        Args: never
        Returns: unknown[]
        SetofOptions: {
          from: "*"
          to: "techniker_onboarding"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      thermocheck_update_techniker_onboarding:
        | {
            Args: {
              p_email?: string
              p_id: string
              p_nachname?: string
              p_notizen?: string
              p_onboarding_phase?: string
              p_onboarding_substatus?: string
              p_region?: string
              p_schulung_picea_datum?: string
              p_schulung_sma_datum?: string
              p_startdatum?: string
              p_telefon?: string
              p_vertrag_dokument_url?: string
              p_vorname?: string
              p_zertifizierung_picea?: boolean
              p_zertifizierung_sma?: boolean
            }
            Returns: unknown
            SetofOptions: {
              from: "*"
              to: "techniker_onboarding"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_email?: string
              p_id: string
              p_nachname?: string
              p_notizen?: string
              p_onboarding_phase?: string
              p_onboarding_substatus?: string
              p_telefon?: string
              p_vertrag_dokument_url?: string
              p_vorname?: string
            }
            Returns: unknown
            SetofOptions: {
              from: "*"
              to: "techniker_onboarding"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      toggle_produkt_recht_dokument_status: {
        Args: { p_id: string; p_ist_aktiv: boolean }
        Returns: boolean
      }
      unlockrows: { Args: { "": string }; Returns: number }
      update_kpi_nachweis_validation: {
        Args: { p_ai_result: Json; p_nachweis_id: string; p_status: string }
        Returns: undefined
      }
      update_produkt_recht_dokument: {
        Args: {
          p_aenderungsgrund?: string
          p_beschreibung?: string
          p_gueltig_ab?: string
          p_gueltig_bis?: string
          p_id: string
          p_inhalt_html?: string
          p_ist_aktiv?: boolean
          p_lieferant_id?: string
          p_pdf_url?: string
          p_slug?: string
          p_titel?: string
        }
        Returns: boolean
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      user_can_access_entity: {
        Args: {
          p_entity_id: string
          p_entity_type: Database["public"]["Enums"]["notiz_entity_type"]
          p_user_id?: string
        }
        Returns: boolean
      }
      user_is_notiz_ersteller: {
        Args: {
          p_ersteller_id: string
          p_ersteller_typ: Database["public"]["Enums"]["ersteller_typ_enum"]
          p_user_id?: string
        }
        Returns: boolean
      }
      validate_conditional_logic: { Args: { logic: Json }; Returns: boolean }
      webhook_assign_academy_access: {
        Args: { _module_id: string; _user_id: string }
        Returns: undefined
      }
      webhook_revoke_user_iam_access: {
        Args: { _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      aftersales_status_enum:
        | "Neu"
        | "Kontaktaufnahme"
        | "After-Sales Call"
        | "Gewonnen"
        | "Pausiert"
        | "Verloren"
      aftersales_substatus_enum:
        | "Nicht erreicht"
        | "Später anrufen"
        | "Verzögerung"
        | "ASC1"
        | "ASC2"
        | "ASC3"
        | "Kein Interesse"
        | "Sonstiges"
        | "Vertrag-Storno"
        | "Kühlfach"
        | "Aktuell kein Interesse"
        | "Später kontaktieren"
      app_role:
        | "superadmin"
        | "admin"
        | "user"
        | "verkäufer"
        | "manager"
        | "innendienst"
      appointment_type_enum:
        | "CUSTOMER_VISIT"
        | "PHONE_CALL"
        | "REGIONAL_BLOCKER"
        | "WORK_TIME_BLOCKER"
        | "TRAVEL_TIME"
        | "TASK"
        | "UNKNOWN"
        | "ONLINE_MEETING"
      arbeitspaket_status:
        | "offen"
        | "in_bearbeitung"
        | "abgeschlossen"
        | "uebersprungen"
      auftrag_status: "Aktiv" | "Storniert"
      baustellenstatus:
        | "Nicht gesetzt"
        | "Neu"
        | "Förderung beantragt"
        | "Baustart"
        | "Im Bau"
        | "Bauende"
        | "Abgeschlossen"
        | "Abgerechnet"
        | "Baustartvorbereitung"
        | "Anzahlungsrechnung"
        | "Klärung Kunde"
        | "Klärung Technik"
        | "Klärung Netz"
        | "Klärung Material"
      baustellenstatus_substatus_enum:
        | "WC2 durchführen"
        | "WC2 durchgeführt"
        | "BzA beantragt"
        | "BzA an Kunden gesendet"
        | "KfW Zusageschreiben erhalten"
        | "Baustart einplanen"
        | "Termin mit Kunde vereinbart"
        | "Termin per Mail bestätigt"
        | "Anzahlungsrechnung versendet"
        | "Anzahlungsrechnung bezahlt"
        | "Material bestellt"
        | "Material geliefert"
        | "Material vollständig kontrolliert"
        | "Montage Start"
        | "Montage planmäßig"
        | "Montage in Verzögerung"
        | "Montage beendet"
        | "Anlage vollständig geprüft"
        | "Dokumentation vollständig hochgeladen"
        | "Abnahmeprotokoll unterzeichnet"
        | "Einweisung terminieren"
        | "Einweisung terminiert"
        | "Abnahme erfolgt"
        | "Nicht erreicht"
        | "Subsuche"
        | "Vorbereiten der Baustelle"
        | "Schlussrechnung gestellt"
        | "Schlussrechnung bezahlt"
        | "BnD-ID beantragt"
        | "BnD-ID an Kunden gesendet"
        | "Nacharbeiten erforderlich"
        | "Kundenvorbereitung fehlt"
        | "Kundenentscheidung offen"
        | "Zugänge fehlen"
        | "Klärung Kunde abgeschlossen"
        | "Auslegung unsicher"
        | "Aufstellort ungeeignet"
        | "Sonderlösung nötig"
        | "Klärung Technik abgeschlossen"
        | "Netzanschluss offen"
        | "Messkonzept ungeklärt"
        | "EVU-Rückmeldung fehlt"
        | "Klärung Netz abgeschlossen"
        | "Lieferfähigkeit unklar"
        | "Sonderkomponenten"
        | "Hersteller-Abhängigkeit"
        | "Klärung Material abgeschlossen"
      email_status_enum:
        | "Keine Einladung"
        | "Einladung versendet"
        | "Beigetreten"
        | "Abgelehnt"
      erstattung_methode_enum: "Cashback" | "Gutschrift" | "Banküberweisung"
      ersteller_typ_enum: "mitarbeiter" | "profile" | "ai"
      fehlzeiten_typ: "Urlaub" | "Krank"
      feinaufmass_status_enum:
        | "WelcomeCall-1 durchführen"
        | "VOT-Termin abwarten"
        | "VOT-Formular abfragen"
        | "Angebot erstellen"
        | "Angebotstermin abwarten"
        | "Ergebnis abwarten"
        | "Gewonnen"
        | "VOT-Rechnung erstellen"
        | "Zahlung erhalten"
      hunter_tasks_status: "offen" | "erledigt"
      immobilien_status_enum:
        | "Akquise"
        | "Besichtigung vereinbart"
        | "Besichtigt"
        | "Vermarktung"
        | "Reserviert"
        | "Verkauft"
        | "Zurückgezogen"
      interaction_type_enum: "justcall" | "sales_meeting" | "email" | "note"
      justcall_kampagnen_enum:
        | "Setting WP"
        | "PV Upsell"
        | "Setting finales Angebot WP"
      kalkulationsart_enum: "Stückpreis" | "Pauschalpreis" | "Zeitbasiert"
      kostenkategorie_enum:
        | "Fahrzeug & Transport"
        | "Büroausstattung"
        | "Marketing & Werbung"
        | "Schulungen & Weiterbildung"
        | "Telekommunikation"
        | "Reisekosten"
        | "Arbeitskleidung"
        | "Versicherungen"
        | "Software & Tools"
        | "Sonstiges"
        | "Firmenwagen"
        | "Spritkosten"
      lead_status_enum:
        | "Neuer Lead"
        | "Nicht erreicht"
        | "Erreicht/später anrufen"
        | "Verzögerung"
        | "Konzeptanalyse"
        | "No-Show"
        | "Abschlusstermin"
        | "Letzte Chance"
        | "Gewonnen Photovoltaik"
        | "Gewonnen THC"
        | "Verloren"
      lead_verlust_typ: "Danger Loss" | "Follow-Up Loss"
      leistungseinheit_enum:
        | "pro Stück"
        | "pro Meter"
        | "pro Quadratmeter"
        | "pro Kubikmeter"
        | "pro Laufmeter"
        | "pro Stunde"
        | "pro Tag"
        | "pauschal"
      loesung_status_enum:
        | "Offen"
        | "Beantragt"
        | "In Bearbeitung"
        | "Erledigt"
        | "Abgelehnt"
      meeting_location_enum: "onsite" | "online" | "phone"
      meeting_type_enum: "weekly" | "one_on_one"
      mitarbeiter_source: "lovable" | "API" | "manual"
      mitarbeiter_status: "Aktiv" | "Gekündigt" | "Probezeit" | "Admin"
      mitarbeiter_typ_filter: "alle" | "handelsvertreter" | "festangestellte"
      nachverkauf_potenzial_status_enum:
        | "offen"
        | "interesse"
        | "kein_interesse_spaeter"
        | "nie_interesse"
        | "verkauft"
        | "im_erstauftrag_enthalten"
        | "bereits_vorhanden"
      notiz_entity_type:
        | "lead"
        | "auftrag"
        | "termin"
        | "kunde"
        | "immobilie"
        | "mitarbeiter"
        | "autargy_kunde"
      pdf_bereich_enum:
        | "markenbotschafter"
        | "marketing"
        | "vertraege"
        | "schulungen"
        | "intern"
      produkttyp: "Mutterartikel" | "Kinderartikel" | "Einzelartikel"
      projektart_enum:
        | "PV + Batterie"
        | "Wärmepumpe"
        | "PV ohne Batterie"
        | "Batterie einzeln"
      provision_status_enum:
        | "Offen"
        | "Berechnet"
        | "Ausgezahlt"
        | "Blockiert"
        | "Storniert"
      reklamations_loesung_enum: "Offen" | "Nachlieferung" | "Erstattung"
      retention_status_enum:
        | "Neu"
        | "Kontaktaufnahme"
        | "Retention Call"
        | "Wiederhergestellt"
        | "Endgültig Verloren"
      retention_substatus_enum:
        | "Nicht erreicht"
        | "Später anrufen"
        | "Verzögerung"
        | "RTC1"
        | "RTC2"
        | "RTC3"
      schritt_typ:
        | "checkbox"
        | "input"
        | "textarea"
        | "date"
        | "select"
        | "file"
        | "info"
        | "email_template"
        | "bauzeitraum"
        | "team_booking"
        | "sub_contact"
        | "sub_assign"
        | "date_range"
        | "month"
        | "calculated"
      storno_status_enum:
        | "Zu Stornieren"
        | "Stornierung beantragt"
        | "Storno genehmigt"
        | "Storno abgelehnt"
      strafabzug_typ: "Danger Loss" | "Follow-Up-Verlust"
      strategy_source_enum: "sales_academy" | "internal_meeting"
      task_status_enum: "Ausstehend" | "Erledigt" | "Überfällig"
      termin_status_enum: "Ausstehend" | "Stattgefunden" | "No Show"
      thc_status_enum:
        | "Neuer Thermo-Check"
        | "Nicht erreicht Thermo-Check"
        | "Erreicht später anrufen Thermo-Check"
        | "SA1"
        | "SA2"
        | "SA3"
        | "Verloren Thermo-Check"
        | "Gewonnen Final"
        | "Nicht relevant"
      upsales_status_enum:
        | "Neu"
        | "Kontaktaufnahme"
        | "Up-Sale Call"
        | "Gewonnen"
        | "Pausiert"
        | "Verloren"
      upsales_substatus_enum:
        | "Nicht erreicht"
        | "Später anrufen"
        | "Verzögerung"
        | "USC1"
        | "USC2"
        | "USC3"
        | "Zeit abgelaufen"
        | "Kein Interesse"
        | "Vertrag-Storno"
        | "Kühlfach"
        | "Aktuell kein Interesse"
        | "Später kontaktieren"
      verantwortlichkeit_bereich_enum:
        | "baucontrolling"
        | "buchhaltung"
        | "qualitaet"
        | "klaerung"
      verantwortlichkeit_level_enum: "bearbeiter" | "manager" | "owner"
      verkaeufer_abwesenheit_typ_enum:
        | "Urlaub"
        | "Krank"
        | "Schulung"
        | "Feiertag"
        | "Sonstiges"
      verkaeufer_taetigkeit_enum:
        | "field_sales"
        | "after_sales"
        | "telesales"
        | "setter"
      verkaeufer_wissensbereich_enum: "waermepumpe_b2c" | "photovoltaik_b2c"
      webhook_status: "active" | "inactive" | "error"
      webhook_typ:
        | "token_consumption"
        | "lead_update"
        | "auftrag_update"
        | "custom"
        | "user_management"
      werbung_status: "Eingestellt" | "ErsterVerkauf" | "ProbezeitBestanden"
      widerruf_status_enum: "Laufend" | "Abgelaufen" | "Widerrufen"
      zahlungsart:
        | "Bees and Bears"
        | "Fremdfinanzierung"
        | "Barzahlung"
        | "Zentren"
        | "Wartezone"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      aftersales_status_enum: [
        "Neu",
        "Kontaktaufnahme",
        "After-Sales Call",
        "Gewonnen",
        "Pausiert",
        "Verloren",
      ],
      aftersales_substatus_enum: [
        "Nicht erreicht",
        "Später anrufen",
        "Verzögerung",
        "ASC1",
        "ASC2",
        "ASC3",
        "Kein Interesse",
        "Sonstiges",
        "Vertrag-Storno",
        "Kühlfach",
        "Aktuell kein Interesse",
        "Später kontaktieren",
      ],
      app_role: [
        "superadmin",
        "admin",
        "user",
        "verkäufer",
        "manager",
        "innendienst",
      ],
      appointment_type_enum: [
        "CUSTOMER_VISIT",
        "PHONE_CALL",
        "REGIONAL_BLOCKER",
        "WORK_TIME_BLOCKER",
        "TRAVEL_TIME",
        "TASK",
        "UNKNOWN",
        "ONLINE_MEETING",
      ],
      arbeitspaket_status: [
        "offen",
        "in_bearbeitung",
        "abgeschlossen",
        "uebersprungen",
      ],
      auftrag_status: ["Aktiv", "Storniert"],
      baustellenstatus: [
        "Nicht gesetzt",
        "Neu",
        "Förderung beantragt",
        "Baustart",
        "Im Bau",
        "Bauende",
        "Abgeschlossen",
        "Abgerechnet",
        "Baustartvorbereitung",
        "Anzahlungsrechnung",
        "Klärung Kunde",
        "Klärung Technik",
        "Klärung Netz",
        "Klärung Material",
      ],
      baustellenstatus_substatus_enum: [
        "WC2 durchführen",
        "WC2 durchgeführt",
        "BzA beantragt",
        "BzA an Kunden gesendet",
        "KfW Zusageschreiben erhalten",
        "Baustart einplanen",
        "Termin mit Kunde vereinbart",
        "Termin per Mail bestätigt",
        "Anzahlungsrechnung versendet",
        "Anzahlungsrechnung bezahlt",
        "Material bestellt",
        "Material geliefert",
        "Material vollständig kontrolliert",
        "Montage Start",
        "Montage planmäßig",
        "Montage in Verzögerung",
        "Montage beendet",
        "Anlage vollständig geprüft",
        "Dokumentation vollständig hochgeladen",
        "Abnahmeprotokoll unterzeichnet",
        "Einweisung terminieren",
        "Einweisung terminiert",
        "Abnahme erfolgt",
        "Nicht erreicht",
        "Subsuche",
        "Vorbereiten der Baustelle",
        "Schlussrechnung gestellt",
        "Schlussrechnung bezahlt",
        "BnD-ID beantragt",
        "BnD-ID an Kunden gesendet",
        "Nacharbeiten erforderlich",
        "Kundenvorbereitung fehlt",
        "Kundenentscheidung offen",
        "Zugänge fehlen",
        "Klärung Kunde abgeschlossen",
        "Auslegung unsicher",
        "Aufstellort ungeeignet",
        "Sonderlösung nötig",
        "Klärung Technik abgeschlossen",
        "Netzanschluss offen",
        "Messkonzept ungeklärt",
        "EVU-Rückmeldung fehlt",
        "Klärung Netz abgeschlossen",
        "Lieferfähigkeit unklar",
        "Sonderkomponenten",
        "Hersteller-Abhängigkeit",
        "Klärung Material abgeschlossen",
      ],
      email_status_enum: [
        "Keine Einladung",
        "Einladung versendet",
        "Beigetreten",
        "Abgelehnt",
      ],
      erstattung_methode_enum: ["Cashback", "Gutschrift", "Banküberweisung"],
      ersteller_typ_enum: ["mitarbeiter", "profile", "ai"],
      fehlzeiten_typ: ["Urlaub", "Krank"],
      feinaufmass_status_enum: [
        "WelcomeCall-1 durchführen",
        "VOT-Termin abwarten",
        "VOT-Formular abfragen",
        "Angebot erstellen",
        "Angebotstermin abwarten",
        "Ergebnis abwarten",
        "Gewonnen",
        "VOT-Rechnung erstellen",
        "Zahlung erhalten",
      ],
      hunter_tasks_status: ["offen", "erledigt"],
      immobilien_status_enum: [
        "Akquise",
        "Besichtigung vereinbart",
        "Besichtigt",
        "Vermarktung",
        "Reserviert",
        "Verkauft",
        "Zurückgezogen",
      ],
      interaction_type_enum: ["justcall", "sales_meeting", "email", "note"],
      justcall_kampagnen_enum: [
        "Setting WP",
        "PV Upsell",
        "Setting finales Angebot WP",
      ],
      kalkulationsart_enum: ["Stückpreis", "Pauschalpreis", "Zeitbasiert"],
      kostenkategorie_enum: [
        "Fahrzeug & Transport",
        "Büroausstattung",
        "Marketing & Werbung",
        "Schulungen & Weiterbildung",
        "Telekommunikation",
        "Reisekosten",
        "Arbeitskleidung",
        "Versicherungen",
        "Software & Tools",
        "Sonstiges",
        "Firmenwagen",
        "Spritkosten",
      ],
      lead_status_enum: [
        "Neuer Lead",
        "Nicht erreicht",
        "Erreicht/später anrufen",
        "Verzögerung",
        "Konzeptanalyse",
        "No-Show",
        "Abschlusstermin",
        "Letzte Chance",
        "Gewonnen Photovoltaik",
        "Gewonnen THC",
        "Verloren",
      ],
      lead_verlust_typ: ["Danger Loss", "Follow-Up Loss"],
      leistungseinheit_enum: [
        "pro Stück",
        "pro Meter",
        "pro Quadratmeter",
        "pro Kubikmeter",
        "pro Laufmeter",
        "pro Stunde",
        "pro Tag",
        "pauschal",
      ],
      loesung_status_enum: [
        "Offen",
        "Beantragt",
        "In Bearbeitung",
        "Erledigt",
        "Abgelehnt",
      ],
      meeting_location_enum: ["onsite", "online", "phone"],
      meeting_type_enum: ["weekly", "one_on_one"],
      mitarbeiter_source: ["lovable", "API", "manual"],
      mitarbeiter_status: ["Aktiv", "Gekündigt", "Probezeit", "Admin"],
      mitarbeiter_typ_filter: ["alle", "handelsvertreter", "festangestellte"],
      nachverkauf_potenzial_status_enum: [
        "offen",
        "interesse",
        "kein_interesse_spaeter",
        "nie_interesse",
        "verkauft",
        "im_erstauftrag_enthalten",
        "bereits_vorhanden",
      ],
      notiz_entity_type: [
        "lead",
        "auftrag",
        "termin",
        "kunde",
        "immobilie",
        "mitarbeiter",
        "autargy_kunde",
      ],
      pdf_bereich_enum: [
        "markenbotschafter",
        "marketing",
        "vertraege",
        "schulungen",
        "intern",
      ],
      produkttyp: ["Mutterartikel", "Kinderartikel", "Einzelartikel"],
      projektart_enum: [
        "PV + Batterie",
        "Wärmepumpe",
        "PV ohne Batterie",
        "Batterie einzeln",
      ],
      provision_status_enum: [
        "Offen",
        "Berechnet",
        "Ausgezahlt",
        "Blockiert",
        "Storniert",
      ],
      reklamations_loesung_enum: ["Offen", "Nachlieferung", "Erstattung"],
      retention_status_enum: [
        "Neu",
        "Kontaktaufnahme",
        "Retention Call",
        "Wiederhergestellt",
        "Endgültig Verloren",
      ],
      retention_substatus_enum: [
        "Nicht erreicht",
        "Später anrufen",
        "Verzögerung",
        "RTC1",
        "RTC2",
        "RTC3",
      ],
      schritt_typ: [
        "checkbox",
        "input",
        "textarea",
        "date",
        "select",
        "file",
        "info",
        "email_template",
        "bauzeitraum",
        "team_booking",
        "sub_contact",
        "sub_assign",
        "date_range",
        "month",
        "calculated",
      ],
      storno_status_enum: [
        "Zu Stornieren",
        "Stornierung beantragt",
        "Storno genehmigt",
        "Storno abgelehnt",
      ],
      strafabzug_typ: ["Danger Loss", "Follow-Up-Verlust"],
      strategy_source_enum: ["sales_academy", "internal_meeting"],
      task_status_enum: ["Ausstehend", "Erledigt", "Überfällig"],
      termin_status_enum: ["Ausstehend", "Stattgefunden", "No Show"],
      thc_status_enum: [
        "Neuer Thermo-Check",
        "Nicht erreicht Thermo-Check",
        "Erreicht später anrufen Thermo-Check",
        "SA1",
        "SA2",
        "SA3",
        "Verloren Thermo-Check",
        "Gewonnen Final",
        "Nicht relevant",
      ],
      upsales_status_enum: [
        "Neu",
        "Kontaktaufnahme",
        "Up-Sale Call",
        "Gewonnen",
        "Pausiert",
        "Verloren",
      ],
      upsales_substatus_enum: [
        "Nicht erreicht",
        "Später anrufen",
        "Verzögerung",
        "USC1",
        "USC2",
        "USC3",
        "Zeit abgelaufen",
        "Kein Interesse",
        "Vertrag-Storno",
        "Kühlfach",
        "Aktuell kein Interesse",
        "Später kontaktieren",
      ],
      verantwortlichkeit_bereich_enum: [
        "baucontrolling",
        "buchhaltung",
        "qualitaet",
        "klaerung",
      ],
      verantwortlichkeit_level_enum: ["bearbeiter", "manager", "owner"],
      verkaeufer_abwesenheit_typ_enum: [
        "Urlaub",
        "Krank",
        "Schulung",
        "Feiertag",
        "Sonstiges",
      ],
      verkaeufer_taetigkeit_enum: [
        "field_sales",
        "after_sales",
        "telesales",
        "setter",
      ],
      verkaeufer_wissensbereich_enum: ["waermepumpe_b2c", "photovoltaik_b2c"],
      webhook_status: ["active", "inactive", "error"],
      webhook_typ: [
        "token_consumption",
        "lead_update",
        "auftrag_update",
        "custom",
        "user_management",
      ],
      werbung_status: ["Eingestellt", "ErsterVerkauf", "ProbezeitBestanden"],
      widerruf_status_enum: ["Laufend", "Abgelaufen", "Widerrufen"],
      zahlungsart: [
        "Bees and Bears",
        "Fremdfinanzierung",
        "Barzahlung",
        "Zentren",
        "Wartezone",
      ],
    },
  },
} as const
