# Aufmaß Submit-Integrität — Fix- & Audit-Report

App: `quick-measure-pro` · Feature: `src/features/aufmass` · Worktree: `.worktrees/qmp-t4-autarc-gate`
Stand: 2026-06-21 · Kontext: T4 autarc-Gate + Härtung des Absende-Pfads

---

## 1) TL;DR — ist die Submit-Integrität jetzt dicht?

**Ja, der Kern ist dicht — mit einer bewussten, dokumentierten Ausnahme (KI-Foto-INHALTSprüfung, fail-open).**

Die zentrale Lücke aus dem Audit — *„ein Aufmaß ließ sich mit 0 Fotos einreichen"* — ist geschlossen. Die Foto-**Präsenz** (genug Fotos je Pflicht-Kategorie) wird beim Absenden jetzt **deterministisch und KI-unabhängig** hart erzwungen. Damit hängt der Foto-Schutz nicht mehr daran, ob die KI gerade läuft.

**Finale Verifikation (selbst ausgeführt, echte Zahlen):**

| Gate | Befehl | Ergebnis |
|---|---|---|
| Feature-Tests | `npx vitest run src/features/aufmass/` | **846 passed, 2 skipped** (13 Dateien passed, 1 skipped) — grün |
| Typecheck | `npx tsc -p tsconfig.app.json --noEmit` | **TSC=0** — grün |
| Neue Tests (Block-Verhalten) | foto-praesenz 11 · foto-pruefung-store 11 · autarc-verify-client 9 · geo 12 | **43 passed** |

Beide Pflicht-Gates aus dem Auftrag sind grün. Die fail-open-Stelle (KI-Inhaltscheck bei Gemini/Netz-Ausfall) ist eine **Produktentscheidung**, keine Lücke im Sinne eines Bugs — siehe Abschnitt 3.

---

## 2) Gefixte Bugs

### Bug 1 — Pflicht-Foto-Präsenz wurde beim Absenden NICHT erzwungen (high)

- **Datei:** `src/features/aufmass/ui/AufmassFormPage.tsx` (`handleSubmit`) + neu `src/features/aufmass/data/foto-praesenz.ts`
- **Was vorher durchrutschte:** `handleSubmit` hatte nur drei harte Tore — (1) zod gegen `aufmassSubmitSchema`, (2) KI-„passt-nicht"-Verdicts, (3) deterministische Plausibilität (`block`). **Keines** prüfte, ob in den Foto-Pflicht-Schritten überhaupt Fotos existieren. `minAnzahl` war ausschließlich ein Anzeige-Hinweis in `PhotoUploadField.tsx` (`Min. N Fotos`). Folge: ein Aufmaß ließ sich mit **0 Fotos** oder mit zu wenigen Fotos vollständig einreichen — der Kernzweck des Formulars (Vor-Ort-Foto-Pflicht) war faktisch unverbindlich.
- **Jetziges Verhalten:** Neuer reiner Helper `pruefeFotoPraesenz(bilder, ctx)` iteriert eine **kuratierte** Liste von Pflicht-Kategorien (nicht blind alle `minAnzahl>0`), zählt je Kategorie via `filterBilderByKategorie` und liefert `{kategorie, label, vorhanden, minAnzahl, step}` für jede unterbesetzte, sichtbare Kategorie. Bedingte Sichtbarkeit wird gespiegelt, damit keine Fehlalarme für ausgeblendete Schritte entstehen: PV nur bei `istPvAufmass`, Öltank nur bei `heizungsart==='oel'`, Erdung nur bei `hatErdung`, Extra-Heizungsraum nur bei `mehr_bilder_heizungsraum`, Aufstellort-Alt-1/2 hinter den `alternative_*_vorhanden`-Flags. Optionale Kategorien (`minAnzahl===0`) zählen nie. In `handleSubmit` greift ein **hartes Tor NACH der zod-Prüfung und VOR dem KI-Foto-Block**: bei Fehlmenge `toast.error` mit Liste `Label (vorhanden/min)` + Sprung-Action zum ersten betroffenen Schritt, `setCurrentStep(firstStep)`, `return`. Die `bilder` kommen aus `useVotBilder` — keine neue Datenquelle.
- **Test:** `src/features/aufmass/data/foto-praesenz.test.ts` (11) — 0/zu wenige Fotos blocken, Grenzfall „min genau erfüllt" lässt durch, jede bedingte Sichtbarkeit (kein Fehlalarm für ausgeblendete Schritte), optionale Kategorie zählt nicht.

### Bug 2 — Stepper-Status log für reine Foto-Schritte fälschlich „done" (high)

- **Datei:** `src/features/aufmass/ui/AufmassFormStepper.tsx` + `AufmassFormPage.tsx`
- **Was vorher durchrutschte:** `stepHasError`/`computeStepValidation` deckten Foto-Schritte nicht ab (Fotos stehen nicht im Schema/`FIELD_META`). Die Phasen-Rail und der „Pflichtfelder offen"-Banner zeigten für reine Foto-Schritte (z. B. `treppenabgang`, `eingang_heizungsraum`) fälschlich „done"/grün, obwohl kein Foto vorlag — und „Weiter" ließ sie frei überspringen, ohne dass am Ende nachgeholt wurde.
- **Jetziges Verhalten:** `stepHasError` mergt jetzt die fehlenden Foto-Schritte ein und `openCount` zählt sie mit → die Phasen-Rail markiert reine Foto-Schritte korrekt als unvollständig statt fälschlich grün; die „Alle Pflichtfelder vollständig"-Leiste lügt nicht mehr. Die **Navigation bleibt bewusst frei** (UX: zurück/vor springen ist erlaubt) — der harte Riegel sitzt beim Submit (Bug 1). Genau die im Audit empfohlene Variante: kein hartes Sperren von „Weiter", dafür hartes Sperren beim Absenden.
- **Test:** über `foto-praesenz.test.ts` (Quelle der Schritt-Markierung) + die bestehenden Stepper-Tests grün im Feature-Lauf.

### Härtung (kein Bug, aber Teil des Submit-Pfads) — autarc-Gate fail-CLOSED

- **Datei:** `src/features/aufmass/data/autarc-verify-client.ts`
- **Verhalten:** `runAutarcVerify` wirft NIE und liefert bei jedem Störfall (Edge-Function-Fehler, `!data`, `{error}`-Antwort, fehlender/falsch typisierter `status`/`meldung`, Exception) das Urteil `ausstehend` mit `blockt: true` (`NICHT_ERREICHBAR`). „Kein Fehler je als Erfolg." Das Aufmaß ist zu dem Zeitpunkt bereits lokal gespeichert; das Gate meldet nur das Urteil und der Abgleich wird serverseitig nachgeholt.
- **Test:** `src/features/aufmass/data/autarc-verify-client.test.ts` (9) — `@/integrations/supabase/client` gemockt; alle Störpfade → `ausstehend`+blockt; valides Urteil wird durchgereicht.

### Geo-Policy (Submit-relevant, deterministisch)

- **Datei:** `src/features/aufmass/data/geo.ts`
- **Verhalten:** `bewerteGeo(distanzM)` → `<= GEO_OK_RADIUS_M (400 m)` = `ok`/0 €, sonst `abweichung`/`GEO_ABZUG_EUR (20 €)`. Abzug statt Block (Daten kommen trotzdem an). `geoCheckLaeuftNoch` blockt nur, solange der Check noch nicht abgeschlossen ist (`idle`/`locating`/`checking`); `nicht_pruefbar` (System-Ausfall) und `abweichung` blocken bewusst nicht.
- **Test:** `src/features/aufmass/data/geo.test.ts` (12) — Schwelle (genau 400 m = ok; oberhalb = abweichung+20 €), `formatDistanz`, `geoCheckLaeuftNoch`.

---

## 3) Design-Entscheidungen für den Nutzer (bitte lesen)

### Foto-INHALTScheck (Gemini) ist FAIL-OPEN — soll das so bleiben?

**Heutiger Stand:** Die KI-**Inhalts**prüfung (`pruefeFotoInhalt` → Edge Function `aufmass-foto-check` → Gemini) ist bewusst fail-open. Liefert sie kein Urteil (leeres base64, Function-Fehler/-leer, `geprueft!==true`, Exception), wird **kein** Verdict gesetzt → `getBlockierendeFotos()` liefert `[]` → das Submit-Tor blockt inhaltlich nichts. Eine KI-/Netz-Störung verhindert das Einreichen also nicht.

**Die Frage:** Soll ein **nicht prüfbares** Foto das Absenden blocken?

- **Streng (fail-closed):** Maximale Datenqualität, aber blockt ehrliche Techniker, sobald KI/Netz weg ist — gerade im Heizungskeller (schlechtes Netz) der Normalfall. Verschiebt zudem Auszahlungs-Anreize und bestraft System-Ausfälle, die der Techniker nicht zu verantworten hat.
- **Durchlassen (heute):** Eine KI-Störung verhindert keine ehrliche Abgabe — aber bei KI-Ausfall ist der **Inhalt** ungeprüft.

**Empfehlung: fail-open für den INHALT beibehalten — denn die eigentliche Gefahr ist bereits entschärft.** Solange auch die *Präsenz* fail-open gewesen wäre, hätte KI-Ausfall „kein Foto nötig UND Inhalt ungeprüft" bedeutet (gar nichts gesichert). Genau das ist mit Bug-1-Fix nicht mehr der Fall: die **Präsenz wird jetzt KI-unabhängig hart erzwungen**. Bei KI-Ausfall gilt also weiterhin „genug echte Fotos müssen vorliegen", nur ihr *Inhalt* ist temporär ungeprüft — ein vertretbarer Rest. Empfohlene Ergänzung (optional, nicht umgesetzt): bei `null`-Urteil im Store/Thumbnail einen sichtbaren **„ungeprüft"-Status** führen, damit der Innendienst erkennt, dass kein KI-Urteil vorliegt (statt stiller Stille). **Kein** Hard-Block bei KI-Ausfall.

### Weitere Trade-offs

- **Navigation frei, Submit hart:** „Weiter" ist an Foto-Pflicht-Schritten absichtlich nicht gesperrt (UX — man darf vor-/zurückspringen). Der einzige harte Riegel ist der Submit. Bewusst so gewählt, weil Stepper-Sperren mehr Frust als Schutz bringen, wenn der Submit ohnehin hart blockt.
- **autarc-Gate fail-CLOSED, Foto-Inhalt fail-OPEN:** unterschiedliche Richtung, mit Absicht. autarc läuft serverseitig nach dem Speichern und darf eine echte Abweichung als „ausstehend" markieren, ohne Datenverlust (Aufmaß ist schon gespeichert). Der Foto-Inhalt blockt den Techniker live vor Ort — dort wiegt „nicht aussperren bei Netzausfall" schwerer.
- **Geo: Abzug statt Block.** Eine Standort-Abweichung kostet 20 €, sperrt aber nicht — damit die Daten trotzdem ankommen und der Fall manuell prüfbar bleibt. Ob `kein_gps` (aktive Verweigerung) hart blocken soll, ist eine offene Policy-Entscheidung (heute: kein Hard-Block).
- **Kuratierte Pflicht-Foto-Liste statt „alle `minAnzahl>0`":** robuster gegen Fehlalarme bei bedingt sichtbaren Schritten, aber sie muss **mitgepflegt** werden, wenn neue Foto-Pflicht-Kategorien/Schritte hinzukommen (siehe Backlog).

---

## 4) Environmental / nur mit Deploy echt testbar

**Der Gemini-Foto-INHALTScheck läuft im lokalen Dev und in vitest NIE.**

`pruefeFotoInhalt` (`src/features/aufmass/data/ki-foto-check-client.ts`) ruft die Supabase **Edge Function `aufmass-foto-check`** auf. Diese Function wird lokal nicht serviert und Gemini ist nicht erreichbar → die Funktion liefert lokal **immer `null`**. Damit ist die Inhalts-Sperre (KI „passt nicht" → Block) **ohne Deploy nicht beobachtbar**.

So kann der Nutzer es echt testen:
- **Nach Deploy** der Function `aufmass-foto-check` (mit gesetztem Gemini-Key), oder
- lokal via **`supabase functions serve aufmass-foto-check`** mit echtem Gemini-Key in der lokalen Env.

**Ehrlich — was dieses Audit lokal NICHT verifizieren konnte:**
- Ob Gemini bei einem manipulierten/falschen Foto tatsächlich `passt:false` zurückgibt (echte Modell-Antwort).
- Den End-to-End-Pfad Foto-Upload → Function → Verdict → `setFotoVerdict` → Submit-Block unter echten Bedingungen (lokal endet der Pfad bei `null`, der Block greift dann nicht).
- Das echte autarc-Verhalten (`autarc-patch-verify`): lokal ist nur das **fail-closed-Fallback** geprüft (gemockter Client), nicht ein echter Abgleich gegen die autarc-API.
- Geocoding/GPS-Genauigkeit der Geo-Edge-Function in der Praxis (nur die reine Bewertungslogik `bewerteGeo` ist lokal getestet, nicht die Distanzermittlung selbst).

Lokal **verifiziert** ist hingegen alles Deterministische: Präsenz-Tor, Stepper-Markierung, Store-Block-Logik (fail-open ohne Verdict, `passt:false` blockt, Reset), autarc-Client-Fallback, Geo-Bewertung — plus der grüne Gesamtlauf (846/2) und TSC=0.

---

## 5) Restbefunde (Backlog, medium/low)

| # | Befund | Sev | Datei | Empfehlung |
|---|---|---|---|---|
| R1 | **„Foto ersetzen" lässt altes Verdict zurück.** Der Upload-Pfad ist additiv (neues Bild = neue `bildId`); ein altes Foto mit „passt-nicht"-Verdict wird nur über `handleDelete` aus dem Store entfernt (`setFotoVerdict(bild.id, null)`, PhotoUploadField:146). Wer ein schlechtes Foto durch ein neues *ergänzt* statt es zu *löschen*, lässt den alten Blocker stehen — bzw. umgekehrt bleibt nach Löschen+Neuanlage potenziell ein veraltetes Verdict, wenn nicht sauber gelöscht wurde. | medium | `src/features/aufmass/ui/components/PhotoUploadField.tsx` | Beim erfolgreichen Neu-Upload je Kategorie verwaiste Verdicts der Kategorie aufräumen ODER „Ersetzen" als explizite Aktion (delete+upload atomar) führen. Mit Test im `foto-pruefung-store`. |
| R2 | **`__probe.test.ts` ist Audit-Debris.** `src/features/aufmass/data/__probe.test.ts` enthält 11 explorative `it()` ohne Assertions (nur `console.log`) — kann nie fehlschlagen, trägt keinen Schutz, verrauscht aber den Testlauf und die Konsole. | low | `src/features/aufmass/data/__probe.test.ts` | Löschen oder in echte Assertions überführen, falls die geprobten Randfälle (numerischer String als Heizlast, `savedProjectId="null"`, rooms=`[1,2,3]`) abgesichert werden sollen. |
| R3 | **KI-„null"-Urteil ist still.** Liefert `pruefeFotoInhalt` `null`, gibt es keinerlei Marker — weder UI noch Store wissen „ungeprüft". | low | `ki-foto-check-client.ts` / `foto-pruefung-store.ts` | Optionalen `ungeprueft`-Status im Store/Thumbnail führen (siehe Abschnitt 3), damit der Innendienst KI-Ausfälle erkennt. Kein Block. |
| R4 | **Pflicht-Foto-Liste muss mitwachsen.** `PFLICHT_FOTOS` in `foto-praesenz.ts` ist hartkodiert mit BASE_STEPS-Indizes (3–9, PV 15–16). Werden Foto-Schritte umsortiert oder neue Pflicht-Kategorien ergänzt, kann die Liste still veralten (fehlende Erzwingung statt Crash). | low | `src/features/aufmass/data/foto-praesenz.ts` | Schritt-Indizes/Sichtbarkeit aus einer gemeinsamen Schritt-Definition ableiten statt doppelt pflegen, oder Konsistenz-Test gegen `BASE_STEPS` ergänzen. |

---

### Anhang — Verifikationsbefehle (zum Nachstellen)

```bash
cd /c/Users/aberg/Downloads/dev/.worktrees/qmp-t4-autarc-gate
npx vitest run src/features/aufmass/        # 846 passed, 2 skipped
npx tsc -p tsconfig.app.json --noEmit ; echo TSC=$?   # TSC=0
```
