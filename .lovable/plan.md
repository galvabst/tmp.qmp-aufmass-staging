## Befund aus den Daten

- **Torsten Lauschke**: Bestellung/Abrechnung ist bezahlt (`latest_invoice_status = paid`, Orders `paid`). Trotzdem steht die Subscription als `canceled`. Das Panel darf ihn nicht pauschal als „muss etwas tun" darstellen, sondern muss unterscheiden: **Abo laut Stripe gekündigt, aber letzte Abrechnung bezahlt**.
- **Vincent Heth**: In `contractor_onboarding` steht `onboarding_status = in_progress`, aber `is_trainer = true`. Die Contractor-Liste behandelt Trainer bereits als `ready`; die Subscription-Health-View aktuell nicht. Deshalb kam der falsche Badge „Onboarding".
- **Brian Maina**: Hat aktive Subscriptions (`google-workspace`, `scanner-lizenz`) mit `status = active`, `latest_invoice_status = paid`, `access_state = ok`. Er wird aktuell nicht angezeigt, weil er kein Health-Problem hat. Das ist fachlich korrekt — aber der Zustand sollte im Detail/Übersicht nachvollziehbar sein.
- **Event-Historie leer**: `contractor_subscription_events` hat für diese Subscriptions keine Events. Deshalb ist der Dialog aktuell nicht beweiskräftig. Wir brauchen die Bestellungen + Stripe-Tracker-Daten zusammen, nicht nur Event-Logs.

## Zielbild

Aus „Subscription-Health" wird eine klare **Abo- und Lizenzprüfung für Feinaufmaß-Techniker**:

- Oben eine **Techniker-zentrierte Liste**, nicht eine Zeile pro Subscription.
- Pro Techniker zwei Produktzustände:
  - Google Workspace
  - Scanner-Lizenz
- Jede Lizenz bekommt eine verständliche Bewertung:
  - **OK**: aktive Subscription oder paid + kein Risiko
  - **Hinweis**: gekündigt, aber letzte Rechnung bezahlt / läuft noch bis Datum
  - **Aktion nötig**: unpaid, past_due, incomplete_expired oder echte Zahlungsprobleme
- Keine irreführende Formulierung „läuft am …" als Hauptsignal. Stattdessen: **„Status laut Stripe"**, **„letzte Rechnung"**, **„letzte bezahlte Bestellung"**, **„Handlung"**.

## Umsetzung

### 1. Datenmodell für die Health-View reparieren

Neue/überarbeitete View `thermocheck.v_subscription_health`:

- Join auf `public.profiles` für korrekte Namen/E-Mail.
- Effektiver Onboarding-Status:
  - `is_trainer = true` wird als `ready` angezeigt, analog zur Contractor-Liste.
  - Sonst `contractor_onboarding.onboarding_status`.
- Subscriptions mit letztem Zahlungs-/Bestellkontext anreichern:
  - letzter paid Order-Zeitpunkt je `onboarding_id + produkt_key`
  - letzter Order-Status je Produkt
  - letzter Rechnungsstatus aus `contractor_subscriptions.latest_invoice_status`
- Risiko/Health-Einstufung in der View berechnen:
  - `ok`
  - `attention`
  - `action_required`
- Nur Techniker berücksichtigen, die im Feinaufmaß-Hub existieren und nicht `gefeuert`, `abgelehnt`, `ausgestiegen`, `deaktiviert`, `inaktiv` sind.

### 2. Hook sauber typisieren

`useAdminSubscriptionHealth` bekommt neue Felder:

- `effective_onboarding_status`
- `is_trainer`
- `latest_invoice_status`
- `last_paid_order_at`
- `last_order_status`
- `health_level`
- `health_reason`

Der Hook lädt nicht mehr einfach `access_state != ok`, sondern nur relevante Risiken:

- `health_level in ('attention', 'action_required')`

Damit erscheinen z. B. Brian nicht im Problem-Panel, weil er ok ist — aber Torsten kann als „Hinweis" statt als harter Fehler erscheinen.

### 3. UI von Subscription-Zeilen auf Techniker-Gruppen umbauen

`SubscriptionHealthPanel.tsx`:

- Gruppierung nach Techniker (`onboarding_id`).
- Eine Karte pro Techniker mit:
  - Name, E-Mail, effektiver Status (`Einsatzbereit`, `Onboarding`, `Trainer`)
  - Worst-Case-Badge: `Aktion nötig` oder `Hinweis`
  - kompakte Produktchips für Google Workspace und Scanner-Lizenz
- Dialog zeigt dann beide Lizenzen eines Technikers untereinander:
  - Produkt
  - Stripe-Status
  - Rechnungsstatus
  - letzte bezahlte Bestellung
  - Kündigungs-/Periodeninfo nur als Detail, nicht als Hauptaussage
  - Handlungstext, z. B. „Stripe prüfen: Subscription gekündigt, letzte Rechnung bezahlt" oder „Zahlung offen/fehlgeschlagen".

### 4. Navigation korrekt machen

Der aktuelle Link `/admin/contractors/:id` passt nicht zur App-Struktur. Stattdessen:

- `AdminDashboardView` bekommt `onSelectContractor` in das Subscription-Panel durchgereicht.
- Klick im Dialog/Button ruft `onSelectContractor(onboarding_id)` auf.
- Dadurch öffnet sich die bestehende Contractor-Detailansicht sauber über den vorhandenen Admin-State.

### 5. Validierung

Nach Umsetzung prüfe ich per DB-Read:

- Torsten erscheint nicht mehr als harter „Aktion nötig"-Fall, sondern höchstens als Hinweis mit „letzte Rechnung paid".
- Vincent wird als `Einsatzbereit/Trainer` angezeigt, nicht als Onboarding.
- Brian bleibt aus dem Problem-Panel raus, weil beide Abos `active/paid/ok` sind.
- Christian bleibt als echter Problemfall sichtbar.
