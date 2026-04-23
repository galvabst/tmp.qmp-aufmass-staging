

## Lead-Conversion-Bonus: Anzeige sofort, Freigabe erst mit Anzahlung

### Was du willst

Der Lead-Conversion-Bonus (50 €) soll dem Techniker **sofort sichtbar** sein, sobald sein Thermocheck-Auftrag zu einem echten Kundenauftrag konvertiert wird (Lead → Kunde). Die **Freigabe zur Auszahlung** erfolgt aber erst, **wenn die Kundenanzahlung eingegangen ist**.

Das bedeutet zwei Phasen, die im UI klar unterschieden werden müssen:

1. **„In Aussicht"** — Lead ist konvertiert, Auftrag passt zum THC-Gebäude → Bonus existiert mit Status `ausstehend`. Der Techniker sieht ihn („50 € sind dir versprochen"), kann ihn aber noch nicht abrechnen.
2. **„Freigegeben"** — Anzahlung des Kunden ist eingegangen → Bonus wechselt auf `freigegeben` und wandert in die nächste Auszahlung.

### Aktueller Stand (zur Erinnerung)

- DB-Trigger `trg_lead_conversion_bonus` auf `public.auftraege` legt den Bonus-Datensatz in `thermocheck.contractor_boni` mit Status `ausstehend` automatisch an, sobald ein Lead in einen Auftrag konvertiert wird.
- Der Status `freigegeben` existiert im Enum, wird aber heute nicht automatisch durch ein Anzahlungs-Event gesetzt.
- Im UI (`ReviewView` → Boni-Card) zeigt die Liste pro Bonus nur „Offen" (grau) oder „Abgerechnet" (grün). Die Trennung „in Aussicht" vs. „freigegeben" fehlt komplett.
- Die Summary-Card zeigt aktuell nur die **freigegebenen** Boni in € — der Techniker sieht also seine "in Aussicht"-Beträge gar nicht.

### Plan

**1. Bonus-Erstellungs-Logik schärfen (DB)**
- Trigger `trg_lead_conversion_bonus` so anpassen, dass er **nur feuert**, wenn der konvertierte Auftrag tatsächlich zum THC-Gebäude des Technikers passt (Match über `lead_id` ↔ `thermocheck_auftraege.lead_id`, aktuell schon vorausgesetzt — ich verifiziere und härte die WHERE-Bedingung).
- Status weiterhin `ausstehend` setzen.

**2. Anzahlungs-Event → automatische Freigabe (DB)**
- Neuer Trigger auf der Tabelle/Spalte, in der die Kundenanzahlung erfasst wird (typisch: `public.auftraege.anzahlung_eingegangen_am` oder ein dedizierter Status-Übergang). Sobald die Anzahlung eingegangen ist:
  - Setze für den passenden `contractor_boni`-Datensatz (`bonus_typ = 'lead_conversion'`, gleicher Auftrag) `status = 'freigegeben'` und `freigegeben_am = now()`.
- Ich prüfe vorher das genaue Anzahlungs-Feld/-Event in `public.auftraege` und passe den Trigger entsprechend an.

**3. UI-Differenzierung im „In Prüfung"-Tab (`ReviewView.tsx` + `BoniDetailSection`)**

Summary-Card „Boni" wird zweizeilig:
```
Boni
[freigegeben €]  · in Aussicht: [ausstehend €]
[count] Boni
```

In der aufgeklappten Liste pro Bonus:
- Status-Badge differenziert farbcodiert:
  - `ausstehend` (Lead-Conversion ohne Anzahlung) → gelber Badge **„In Aussicht – wartet auf Anzahlung"**
  - `ausstehend` (Bewertungs-Bonus) → gelber Badge **„In Prüfung"**
  - `freigegeben` → blauer Badge **„Freigegeben – nächste Auszahlung"**
  - `ausgezahlt` / `abgerechnet_am` gesetzt → grüner Badge **„Ausgezahlt"**
  - `abgelehnt` → roter Badge **„Abgelehnt"**
- Pro Lead-Conversion-Eintrag eine Mini-Erklärzeile:
  „50 € werden freigegeben sobald die Kundenanzahlung eingeht."

Empty-State der Boni-Card:
- Statt nur „Noch keine Boni" eine kurze Erklärbox mit den 3 Bonus-Quellen + jeweiligem Auslöser, damit Techniker das System verstehen.

**4. Hook-Aggregation erweitern (`useContractorBoni.ts`)**
- `useBoniSummary` zusätzlich aufschlüsseln in:
  - `inAussicht` (alle `lead_conversion` mit Status `ausstehend`)
  - `inPruefung` (alle Bewertungs-Boni mit Status `ausstehend`)
  - `freigegeben`
  - `ausgezahlt`
- Damit Summary-Card und ggf. spätere Stellen sauber unterscheiden können.

**5. Nicht im Scope dieses Tickets** (eigener Plan, falls gewünscht):
- Die fehlende UI zum **Beantragen** von Google-/Trustpilot-Bewertungs-Boni (Hook existiert, aber kein UI). Sag Bescheid wenn das mit rein soll.

### Technisch betroffen

- **DB-Migration**: Trigger-Anpassung `trg_lead_conversion_bonus` (Härtung), neuer Trigger/Funktion `freigabe_bonus_bei_anzahlung` auf `public.auftraege`.
- **Frontend**:
  - `src/hooks/useContractorBoni.ts` — `useBoniSummary` erweitern, Status-Helper für UI-Mapping
  - `src/components/ReviewView.tsx` — Summary-Card zweiwertig, `BoniDetailSection` mit differenzierten Status-Badges + Erklärzeile, neuer Empty-State

### Offene Annahme zur Klärung beim Implementieren

Ich muss in `public.auftraege` prüfen, **wie genau** die Anzahlung erfasst wird (Spaltenname, ob Boolean-Flag oder Datum oder Statusübergang). Davon hängt der Trigger-Code ab. Falls es noch kein eindeutiges Anzahlungs-Feld gibt, melde ich mich vor der Migration zurück mit einem konkreten Vorschlag, statt blind eine Spalte anzunehmen.

