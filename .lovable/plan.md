## Stripe-Webhook Secret aktualisieren

Du hast das Live-Signing-Secret für den Endpoint `…/functions/v1/stripe-webhook` (Ziel-ID `we_1SxaQXLnjPqrEfxxtC7BZrNX`) geteilt. Damit fixen wir die `Signature verification failed`-Fehler.

### Schritte

1. **Secret rotieren** — `STRIPE_WEBHOOK_SECRET` über das sichere Secret-Formular auf den neuen Wert setzen (nicht im Chat-Klartext speichern). Bitte rotiere den Wert anschließend auch im Stripe-Dashboard, da er hier sichtbar war.
2. **Edge Function neu starten** — passiert automatisch beim Secret-Update; `stripe-webhook` zieht den neuen Wert beim nächsten Request.
3. **Verifizieren** — in Stripe → Webhooks → Endpoint → „Send test webhook" einen `checkout.session.completed` Test schicken und Logs prüfen. Erwartung: kein `Signature verification failed` mehr, stattdessen `[stripe-webhook] vXXX | Event: …`.
4. **Letzte fehlgeschlagene Events nachreichen** — in Stripe alle „Failed" Events der letzten 24h erneut zustellen („Resend"). Damit werden alle pending-Bestellungen direkt vom Webhook auf `paid` gesetzt — der Reconciler dient nur noch als Backup.
5. **Sicherheitshinweis** — da das Secret im Chat stand, im Stripe-Dashboard das Signing-Secret „Roll" und danach den neuen Wert nochmal über das Formular eintragen.

### Technische Details

- Secret-Name: `STRIPE_WEBHOOK_SECRET`
- Verwendet in: `supabase/functions/stripe-webhook/index.ts` via `Deno.env.get("STRIPE_WEBHOOK_SECRET")` in `stripe.webhooks.constructEventAsync(...)`
- Keine Code-Änderungen nötig — nur Secret-Rotation.
