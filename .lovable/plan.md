

## Wie Boni aktuell im "In Prüfung"-Tab angezeigt werden

### Wo
Im Tab **"In Prüfung"** (`ReviewView.tsx`) gibt es oben die dritte Summary-Card **"Boni"** (Geschenk-Icon). Klick darauf klappt eine **monatlich gruppierte Liste** auf (`BoniDetailSection`) mit:
- Lead-Name + Bonus-Typ ("Lead-Conversion", "Google-Bewertung", "Trustpilot-Bewertung")
- Betrag in € pro Bonus
- Status pro Zeile: **„Offen"** (grau) oder **„Abgerechnet"** (grün, sobald `abgerechnet_am` gesetzt ist)
- Pro Monatsblock: Summe + „offen"-Badge wenn noch nicht ausgezahlt

Datenquelle: RPC `get_my_contractor_boni` → Tabelle `thermocheck.contractor_boni`. Aggregat in `useBoniSummary` (ausstehend / freigegeben / ausgezahlt).

### Wann ein Bonus erscheint

| Bonus-Typ | Auslöser | Sichtbarkeit |
|---|---|---|
| **Lead-Conversion (50 €)** | DB-Trigger `trg_lead_conversion_bonus` auf `public.auftraege` — sobald der Lead in einen Auftrag konvertiert wird | **Automatisch** — erscheint sofort mit Status `ausstehend`, dann `freigegeben` → `ausgezahlt` |
| **Google-Bewertung (10 €)** | RPC `erstelle_bewertungs_bonus` (Techniker reicht Screenshot ein) | **Nur wenn der Techniker manuell beantragt** |
| **Trustpilot-Bewertung (10 €)** | dito | **Nur wenn der Techniker manuell beantragt** |
| **Beide Bewertungen kombiniert (25 €)** | Backend rechnet Bonus auf 25 € hoch, sobald beide vorhanden | automatisch nach zweitem Antrag |

### Das Problem

Der **Bewertungs-Bonus-Antrag hat KEINE UI**. Der Hook `useErstelleBewertungsBonus` existiert in `useContractorBoni.ts`, wird aber **nirgends im Code aufgerufen**. Heißt: Techniker können in der App aktuell nur Lead-Conversion-Boni sehen (weil die per Trigger automatisch entstehen), aber **keinen Bewertungs-Bonus selbst beantragen**.

Außerdem fehlt im UI komplett:
- Hinweis **wann** ein Bewertungs-Bonus überhaupt möglich ist (typischerweise nach `approved`-Status eines Auftrags)
- Upload-UI für den Screenshot-Nachweis
- Info, dass aus 2× 10 € automatisch 25 € werden

### Vorschlag zur Behebung

1. **Pro abgenommenem Auftrag** in `ReviewView` (Sektion „Abgenommen") eine Aktion **„Bewertungs-Bonus beantragen"** anbieten — sichtbar nur wenn `status === 'approved'` UND noch kein Bewertungsbonus für diesen Auftrag existiert.

2. **Modal mit zwei Karten** (Google / Trustpilot):
   - Screenshot-Upload (`PhotoUploadField`-Pattern, JPEG/PNG/WebP)
   - Hochladen in Bucket `contractor-bonus-nachweise` (Pfad `bonus/{auftragId}/{typ}-{timestamp}.jpg`)
   - Aufruf `useErstelleBewertungsBonus({ auftragId, bonusTyp, nachweisPath })`
   - Hinweisbox: „Beide Plattformen = 25 € statt 10 €"

3. **Boni-Section erweitern** — pro Bonus zusätzlich anzeigen:
   - Status-Badge differenziert: `ausstehend` (gelb „in Prüfung"), `freigegeben` (blau „freigegeben für nächste Auszahlung"), `ausgezahlt` (grün), `abgelehnt` (rot)
   - Auszahlungsmonat-Vorschau („Auszahlung mit Mai-Abrechnung")
   - Bei `ausstehend` einen kleinen Tooltip „Wird vom Innendienst geprüft (Screenshot)"

4. **Empty-State** der Boni-Card aufwerten:
   - „Noch keine Boni" → Liste der **möglichen** Boni mit Beträgen + 1-Satz-Erklärung wann sie entstehen, damit der Techniker das System versteht.

### Technisch betroffen

- `src/components/ReviewView.tsx` — Bewertungs-Beantragen-Button in Approved-Liste, Status-Differenzierung in `BoniDetailSection`
- **Neu**: `src/components/BewertungsBonusModal.tsx` — Upload + Submit
- `src/hooks/useContractorBoni.ts` — keine Änderung nötig
- Storage-Bucket `contractor-bonus-nachweise` muss existieren (prüfen, ggf. Migration mit RLS: Techniker darf nur in eigenen Pfad uploaden)

