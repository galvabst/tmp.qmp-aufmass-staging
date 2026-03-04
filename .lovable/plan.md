

# Plan: Bonus-System + Bewertungsnachweis im Thermocheck-Formular

## Zusammenfassung

Es gibt drei zusammenhängende Features:
1. **Bonus-Tabelle** für Lead-Conversion-Boni (€50 bei Anzahlung) und Bewertungsboni (€10/€50)
2. **Bewertungsnachweis-Upload** als optionales Feld im Thermocheck-Formular (mit Duplikatserkennung)
3. **Bonus-Übersicht** im "In Prüfung"-Tab mit Auszahlungsstatus

---

## Offene Fragen

Bevor ich implementiere, muss ich Folgendes klären:

### Kritische Architektur-Fragen

1. **Woher kommt der Trigger "Anzahlung eingegangen"?**
   - Auf der `leads`-Tabelle gibt es KEIN Feld `anzahlung_eingegangen` oder ähnliches.
   - Der Lead-Status `Gewonnen THC` / `Gewonnen Photovoltaik` existiert, aber das ist nicht gleichbedeutend mit Anzahlung.
   - **Optionen:**
     - A) Wir nehmen `status = 'Gewonnen THC'` als Trigger (vereinfacht, aber nicht 100% korrekt)
     - B) Wir fügen ein `anzahlung_eingegangen_am` Feld auf `leads` hinzu (sauberer, muss aber vom Vertrieb/Admin gepflegt werden)
     - C) Die Zuordnung passiert manuell durch einen Admin

2. **Google/Trustpilot-Bewertung: Wer validiert den Nachweis?**
   - Der Techniker lädt einen Screenshot hoch. Wer prüft, ob das echt ist?
   - A) Automatisch akzeptiert (mit Duplikatsprüfung als einzige Kontrolle)
   - B) Admin muss den Nachweis freigeben (wie QG-Abnahme)

3. **Duplikatserkennung: Was genau soll geprüft werden?**
   - A) Gleicher Techniker lädt gleiches Bild für verschiedene Aufträge hoch → Perceptual Hash (komplex, nicht in Lovable machbar ohne Backend-Service)
   - B) Einfacher: Pro Lead nur EIN Bewertungsnachweis erlaubt (DB-Constraint) + manueller Admin-Review
   - C) Datei-Hash (SHA-256) serverseitig prüfen → braucht Edge Function

4. **Auszahlung: Wie wird abgerechnet?**
   - "Einmal im Monat Rechnung stellen" — ist das ein manueller Export oder ein automatisiertes System?
   - Aktuell gibt es noch kein Abrechnungssystem. Soll ich nur die Datengrundlage schaffen (Tabelle mit Boni-Positionen, Status ausstehend/ausgezahlt)?

---

## Vorgeschlagene Architektur (nach Klärung)

### DB-Schema (thermocheck)

```text
thermocheck.contractor_boni
├── id uuid PK
├── contractor_onboarding_id uuid FK → contractor_onboarding
├── thermocheck_auftrag_id uuid FK → thermocheck_auftraege
├── lead_id uuid FK → public.leads
├── bonus_typ enum('lead_conversion', 'bewertung_google', 'bewertung_trustpilot')
├── betrag numeric NOT NULL
├── nachweis_storage_path text (für Bewertungs-Screenshots)
├── status enum('ausstehend', 'freigegeben', 'ausgezahlt', 'abgelehnt')
├── freigegeben_von uuid
├── freigegeben_am timestamptz
├── auszahlungsmonat date (erster des Monats, für Gruppierung)
├── created_at timestamptz
└── UNIQUE(thermocheck_auftrag_id, bonus_typ)  -- verhindert Doppel-Boni
```

### Bewertungsnachweis im Formular

- Neue `VotBildKategorie`: `bewertung_nachweis`
- Neue Kategorie im Enum + `BILD_KATEGORIEN` Config
- Neuer optionaler Step oder Abschnitt im Abschluss-Step
- `minAnzahl: 0` (optional)
- Hinweis: "Screenshot der Google- oder Trustpilot-Bewertung"

### Duplikatserkennung

- **Pragmatischer Ansatz**: `UNIQUE(thermocheck_auftrag_id, bonus_typ)` auf DB-Ebene
- Pro Auftrag maximal 1x Google + 1x Trustpilot
- Admin-Review im QG-Prozess (Bewertungsnachweis wird beim QG mit geprüft)

### Frontend

- **ReviewView**: Dritte Summary-Card "Boni" mit ausstehender Summe
- **Profil**: Bonus-Übersicht (gesamt verdient, ausstehend, ausgezahlt)
- **Aufmass-Formular**: Optionaler Abschnitt vor Abschluss

---

## Betroffene Dateien

- `supabase/migrations/` — Neue Tabelle, Enum, RLS
- `src/features/aufmass/data/bild-kategorien.ts` — Neue Kategorie
- `src/features/aufmass/ui/AufmassFormPage.tsx` — Neuer optionaler Step
- `src/components/ReviewView.tsx` — Bonus-Anzeige
- `src/components/ProfileView.tsx` — Bonus-Zusammenfassung
- Neuer Hook: `src/hooks/useContractorBoni.ts`

