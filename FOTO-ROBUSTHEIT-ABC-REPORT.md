# Foto-Robustheit (A/B/C) — Report

> Worktree `qmp-t4-autarc-gate` (Branch `feature/t4-autarc-gate-loop`).
> Geschrieben am 2026-06-21. Kein commit/push/deploy/Migration/IAM ausgeführt.
> Die LIVE-Edge-Function `aufmass-foto-check` (v7, gemini-2.5-flash) wurde NICHT
> angefasst — nötige Änderungen stehen hier nur als fertiger Patch.

---

## 1) TL;DR + finale Testzahlen + grün-Status

Drei Foto-Robustheits-Bausteine, alle als **reine, isoliert getestete Logik** im
Worktree gebaut, ohne irgendetwas Live zu verändern:

| | Thema | Zustand |
|---|---|---|
| **C** | „ungeprüft"-Badge bei KI-Ausfall | **VOLL FERTIG & verdrahtet** (Component nutzt es bereits) |
| **A** | Massband-Wert-Quercheck | **Logik fertig + getestet**, aber **DORMANT** bis (a) Function liefert `messwert` und (b) Verdrahtung im Submit-Pfad — beides hier als Patch dokumentiert |
| **B** | phash-Fuzzy-Dedup | **Distanz-Baustein fertig + getestet** im Worktree; der eigentliche Match sitzt server-seitig (DB-RPC) → **Empfehlung + Migration-Patch** |

**Finale Verifikation (selbst ausgeführt, echte Zahlen):**

```
$ npx vitest run src/features/aufmass/
 Test Files  16 passed | 1 skipped (17)
      Tests  878 passed | 2 skipped (880)

$ npx tsc -p tsconfig.app.json --noEmit ; echo TSC=$?
TSC=0
```

- **878 passed, 2 skipped, 0 failed** — die 2 Skips sind vorbestehend (nicht von mir).
- **TSC=0** — keine Typfehler.
- Neue Tests dieser Arbeit: `foto-pruef-status.test.ts` (7), `foto-messwert-check.test.ts` (11), `phash-distanz.test.ts` (14) = **32 neue Tests**, alle grün.

---

## 2) (C) „ungeprüft"-Badge bei KI-Ausfall — VOLL FERTIG

### Problem
`pruefeFotoInhalt` liefert bei KI-Ausfall / nicht-deployter Function / Offline
bewusst `null` (fail-open — der Aufmaß-Flow soll nicht blockieren). Bisher wurde
dieses `null` im `PhotoUploadField` **still verschluckt**: kein Eintrag, kein Ring,
kein Badge → das Foto sah **exakt aus wie ein noch-nicht-geprüftes „ok"-Foto**.
Das verschleiert, dass die Prüfung gar nicht lief.

### Was gebaut wurde

**NEU `src/features/aufmass/data/foto-pruef-status.ts`** — reine, UI-/React-freie
Status-Ableitung:

- `type FotoPruefStatus = 'laeuft' | 'ungeprueft' | 'ok' | 'passt_nicht'`
- `leiteFotoStatus(laeuft, ergebnis)` → `laeuft` schlägt alles; `null`/`undefined`/
  `geprueft:false` ⇒ `'ungeprueft'` (kein Block); sonst `passt ? 'ok' : 'passt_nicht'`.
- `FOTO_UNGEPRUEFT` — Sentinel-`FotoCheckErgebnis` mit `geprueft:false`. Der
  Component legt dieses bei KI-Ausfall in `checks` ab, damit „KI-Ausfall (Eintrag
  da, lief nicht)" von „noch nie geprüft (kein Eintrag)" unterscheidbar wird.

**GEÄNDERT `src/features/aufmass/ui/components/PhotoUploadField.tsx`** (surgical):
- Import `leiteFotoStatus`, `FOTO_UNGEPRUEFT` (Z. 7).
- `.then`-Handler: neuer `else`-Zweig schreibt bei `null`/`!geprueft` den Sentinel
  in `checks` — **bewusst kein `setFotoVerdict`** ⇒ fail-open bleibt, Submit nicht
  blockiert (Z. 133–138).
- Ring-/Badge-Logik nutzt `leiteFotoStatus(...)`: `ungeprueft && chk` ⇒ grauer Ring
  (`border-muted-foreground`) + graues Warn-Dreieck-Badge mit Titel „KI-Prüfung
  nicht verfügbar"; `ungeprueft && !chk` ⇒ neutraler Rand (wirklich noch nie
  geprüft) (Z. 191–239).

### Tests
**`foto-pruef-status.test.ts` — 7 Tests, grün**: laeuft schlägt alles; null/undefined/
`geprueft:false` ⇒ ungeprueft; ok; passt_nicht; Sentinel-Regression (`FOTO_UNGEPRUEFT`
darf NIE als „ok" durchgehen).

### Verhalten / ist das VOLL FERTIG?
**Ja, voll fertig und verdrahtet.** Im Gegensatz zu A/B ist hier nichts dormant:
der Component setzt den Sentinel und rendert den grauen „ungeprüft"-Zustand schon
heute. Wenn die Live-Function antwortet, greifen weiterhin die ok/passt_nicht-Pfade
unverändert. Das einzige sichtbare Verhalten, das ich lokal NICHT klicken konnte,
ist das Rendering im echten Browser (siehe §6) — die Logik dahinter ist aber per
Unit-Test abgesichert.

---

## 3) (A) Massband-Wert-Quercheck — Logik fertig, Ablesen dormant bis Deploy

### Idee
Ein Mess-Foto (Maßband/Zollstock am Dachziegel/Dach) zeigt einen Zahlenwert. Die
KI liest ihn ab und liefert ihn als `messwert`. Eine reine Funktion vergleicht ihn
mit dem im Formular **getippten** Soll-Wert und meldet bei Abweichung über Toleranz
einen **Soft-Befund** (severity `'soft'`) — landet wie jeder Soft-Befund im
`PlausibilityConfirmDialog`: korrigieren ODER Pflicht-Begründung. Nie ein Hard-Block
(ein KI-abgelesener Wert ist eine Schätzung).

### Was gebaut + getestet wurde (Logik)

**NEU `src/features/aufmass/data/foto-messwert-check.ts`** — reine Funktion
`pruefeMesswertQuercheck(kategorie, { ergebnis, sollWert })` → `PlausibilityIssue | null`:
- `MESSWERT_FELD_MAP`: nur Kategorien mit ECHTEM numerischem Soll-Feld:
  `pv_dach → dachneigung (°)`, `pv_dachziegel → ziegel_neigung_grad (°)`.
  Türbreite / Heizungsraum-Meterstab / `pv_sparrenabstand` (Freitext-String)
  bewusst NICHT enthalten — kein vergleichbarer getippter Zahlenwert.
- `MESSWERT_TOLERANZ = { relativ: 0.25, absolutFloor: 5 }` (±25 %, mit absolutem
  Floor gegen Fehlalarm bei kleinen Soll-Werten).
- `severity` immer `'soft'`. `PlausibilityIssue`-Shape verifiziert identisch zu
  `aufmass-plausibility.ts` (`ruleId/field/severity/message`).
- **Fehlalarm-frei / forward-kompatibel**: ohne `messwert` (heutiger Live-Zustand),
  ohne geprüftes Foto oder ohne getippten Soll-Wert ⇒ `null`, löst nichts aus.

**GEÄNDERT `src/features/aufmass/data/ki-foto-check-client.ts`** (surgical):
`FotoCheckErgebnis` um optionale `messwert?: number | null` + `messwertEinheit?: string`
erweitert; `pruefeFotoInhalt` normalisiert sie forward-kompatibel (Function liefert
sie heute nicht ⇒ bleiben `null`/`''`, kein Verhalten ändert sich; 864→jetzt-grün).

### Tests
**`foto-messwert-check.test.ts` — 11 Tests, grün**: Wert passt; innerhalb relativer
Toleranz; klare Abweichung ⇒ Soft auf richtigem Feld; **forward-kompatibel (kein
`messwert` ⇒ kein Fehlalarm)**; kein Foto/nicht geprüft; kein Soll-Wert; Kategorie
ohne Soll-Feld; Toleranzgrenze exakt vs. knapp drüber; absoluter Floor; zweite
gemappte Kategorie; Konstanten-Plausibilität.

### Was DORMANT ist bis Deploy (EHRLICH)
Das **echte Ablesen ist erst nach Deploy von `aufmass-foto-check` beobachtbar.**
Zwei Lücken, beide bewusst nicht verdrahtet:

1. **Function v7 liefert KEIN `messwert`** (live verifiziert: Prompt fragt nur
   `passt/confidence/erkannt/begruendung`). Patch unten.
2. **Submit-Pfad sieht den `messwert` nicht.** `AufmassFormPage.handleSubmit` liest
   KI-Foto-Ergebnisse nur über `state/foto-pruefung-store.ts` — `FotoVerdict` trägt
   nur `passt`/`kategorieLabel`/`abzugEuro`, **nicht** `messwert`. Die vollständigen
   `FotoCheckErgebnis` liegen in lokalem `PhotoUploadField`-State (`checks`) und
   erreichen den Submit-Pfad nicht.

Solange (1) nicht deployt ist, gibt `pruefeMesswertQuercheck` immer `null` zurück —
das Andocken könnte man sogar jetzt schon verdrahten, ohne Fehlalarm-Risiko. Ich
habe es bewusst NICHT verdrahtet (surgical: ohne Daten an der Schnittstelle wäre es
toter Code), und dokumentiere stattdessen den vollständigen Weg.

### Der fertige Function-/Prompt-Patch (wörtlich, NICHT eingespielt)

> Einzuspielen in `supabase/functions/aufmass-foto-check/index.ts` der **Live-Quelle**
> (`feature/onboarding-rework`, NICHT die Worktree-Kopie — die existiert hier nicht).
> Danach `supabase functions deploy aufmass-foto-check`.

**1. `CheckResult`-Interface erweitern:**
```ts
interface CheckResult {
  geprueft: boolean;
  passt: boolean;
  confidence: number;
  erkannt: string;
  begruendung: string;
  messwert?: number | null;      // NEU
  messwertEinheit?: string;      // NEU
}
```

**2. `skip()` ergänzen** (damit der Typ konsistent bleibt; Werte optional):
```ts
const skip = () => send({ geprueft: false, passt: true, confidence: 0, erkannt: '', begruendung: '', messwert: null, messwertEinheit: '' });
```

**3. Prompt erweitern** (zusätzliche JSON-Felder, nur wenn ein Messwerkzeug sichtbar ist):
```ts
const prompt = `Auf diesem Foto soll Folgendes zu sehen sein: "${erwartet}".
Prüfe ausschließlich, ob das Bild INHALTLICH tatsächlich dies zeigt. Sei tolerant bei Perspektive, Licht und Bildqualität, aber streng bei komplett falschem Motiv (z. B. Screenshot, Dashboard, Person, anderes Objekt, leeres/schwarzes Bild).
Falls auf dem Foto ein Messwerkzeug (Maßband, Zollstock, Meterstab, Winkelmesser) mit ablesbarem Wert zu sehen ist, lies den Zahlenwert und seine Einheit ab; sonst messwert=null.
Antworte NUR als JSON:
{"passt": boolean, "confidence": number (0-1), "erkannt": "kurz, was tatsächlich zu sehen ist", "begruendung": "kurze deutsche Begründung", "messwert": number|null, "messwertEinheit": "z. B. cm oder °, sonst leer"}`;
```

**4. Antwort durchreichen** (im erfolgreichen `send(...)`):
```ts
return send({
  geprueft: true,
  passt: p.passt !== false,
  confidence: typeof p.confidence === 'number' ? p.confidence : 0,
  erkannt: String(p.erkannt ?? ''),
  begruendung: String(p.begruendung ?? ''),
  messwert: typeof p.messwert === 'number' && !Number.isNaN(p.messwert) ? p.messwert : null,   // NEU
  messwertEinheit: typeof p.messwertEinheit === 'string' ? p.messwertEinheit : '',             // NEU
});
```

> Der Client (`ki-foto-check-client.ts`) ist bereits forward-kompatibel: er nimmt
> `messwert`/`messwertEinheit` auf, sobald die Function sie schickt — **kein Client-
> Deploy nötig, sobald dieser Worktree gemergt ist.**

**5. (Optional, fürs scharf-Schalten) Verdrahtung im Submit-Pfad.** Damit der
Quercheck wirkt, muss `messwert` den Submit erreichen. Sauberster Weg: bei
`setFotoVerdict` zusätzlich Kategorie+Messwert ablegen und in `handleSubmit` analog
zu den bestehenden Soft-Befunden durch `pruefeMesswertQuercheck` schicken. Das ist
ein eigener, kleiner Folge-Schritt (außerhalb dieses read-only Loops) und sollte
auf `feature/onboarding-rework` passieren, wo der Submit-/Store-Code lebt.

---

## 4) (B) phash-Fuzzy-Dedup — Baustein implementiert + Empfehlung

### Wo der Dedup HEUTE matcht (exakt/fuzzy)
Der eigentliche Match sitzt **server-seitig** in der DB-RPC
`thermocheck.check_foto_duplikat` (live verifiziert via Supabase, read-only). Kern:

```sql
where (b.sha256 = p_sha256 or b.phash = p_phash)
```

Das ist **doppelt exakt**: `sha256 =` (kippt bei jeder Re-Kompression) UND `phash =`
(exakte Gleichheit des dHash). Ein **leicht verändertes** Bild (Crop, Helligkeit,
Sticker) kippt einzelne dHash-Bits → `phash =` findet es NICHT. Genau diese Lücke
schließt die Hamming-Distanz.

Im Worktree existiert **keine** Dedup-/Hash-Migration und `check_foto_duplikat`
kommt nur im Client (`useVotBilder.ts`, RPC-Aufruf mit `p_sha256/p_phash`) vor —
den `=`-Vergleich darf/kann ich hier also nicht ändern (Migration-/Deploy-pflichtig)
→ **nur Empfehlung + Patch**.

### Was implementiert wurde (im Worktree, kein Deploy)
Die **Distanz-Logik** ist reine Funktion (16-Hex → 64 Bit → XOR → Bits zählen),
kein Netz/DB, vitest-testbar — der wiederverwendbare Baustein, der die serverseitige
Umstellung trägt.

**NEU `src/features/aufmass/data/phash-distanz.ts`:**
- `PHASH_BITS = 64`, `PHASH_HAMMING_SCHWELLE = 10`.
- `hammingHex(a, b): number | null` — Hamming-Distanz zweier dHash-Hex; fail-closed
  auf ungleicher/ungültiger Länge oder ungültigem Hex ⇒ `null`.
- `istAehnlichesBild(a, b, schwelle?)` — `true` nur wenn vergleichbar UND ≤ Schwelle.
- dHash-Format identisch zu `foto-verarbeitung.ts` (9×8 Graustufen, links<rechts,
  64 Bit → 16 Hex), verifiziert.

**NEU `phash-distanz.test.ts` — 14 Tests, grün**: exakt gleich; **leicht verändert
mit echter dHash-Erzeugung aus der Produktionslogik** (wenige Pixel verschoben) ⇒
≤ Schwelle ⇒ ähnlich; klar anderes Bild ⇒ > Schwelle ⇒ nicht ähnlich; Distanz genau
auf Schwelle (inklusiv); knapp drüber (nicht ähnlich); ungleiche Länge/leer/ungültiges
Hex ⇒ `null`/`false`; überschreibbare Schwelle.

### Schwellen-Vorschlag (Kalibrierung)
- ≤5 = quasi identisch → zu streng, verfehlt Crop.
- **10 = konservativer Mittelweg** → toleriert Crop / Helligkeit / leichte Bearbeitung.
- \>12 = driftet in Fehlalarme (verschiedene Innenraum-Fotos liegen oft schon bei
  ~14–22 Bit auseinander).

### Der konkrete Migration-Patch (NICHT angewandt — Empfehlung)
Hamming-Distanz im Postgres ohne Extension: `length(replace(... )) ` ist unschön;
sauber ist ein kleiner SQL-Helper über bit-XOR der Hex-Strings. Vorschlag — neue
idempotente Migration (auf `feature/onboarding-rework`/Live abstimmen, **nicht** hier
anwenden):

```sql
-- 1) Hamming-Distanz zweier gleich langer Hex-Strings (dHash, 16 Hex = 64 Bit).
create or replace function thermocheck.phash_hamming(a text, b text)
returns int language sql immutable as $$
  select case
    when a is null or b is null or length(a) <> length(b) or length(a) = 0 then null
    -- XOR der beiden als bit(64), dann gesetzte Bits zählen:
    else length(replace((('x' || a)::bit(64) # ('x' || b)::bit(64))::text, '0', ''))
  end;
$$;

-- 2) Dedup-RPC: exaktes phash-= durch Fuzzy-Schwelle (≤10) ersetzen.
create or replace function thermocheck.check_foto_duplikat(
  p_sha256 text, p_phash text, p_aktuelles_formular uuid
) returns table(original_kategorie text, original_kunde text, original_datum timestamptz)
language sql security definer set search_path to 'thermocheck','public' as $$
  select b.kategorie::text,
    coalesce(nullif(trim(a.lead_name), ''), a.kunde_nachname, 'unbekannt'),
    b.created_at
  from thermocheck.thermocheck_vot_bilder b
  join thermocheck.thermocheck_vot_formulare f on f.id = b.vot_formular_id
  left join thermocheck.v_thermocheck_auftraege a on a.id = f.thermocheck_auftrag_id
  where (
      b.sha256 = p_sha256
      or (b.phash is not null and p_phash is not null
          and thermocheck.phash_hamming(b.phash, p_phash) <= 10)   -- statt b.phash = p_phash
    )
    and (b.sha256 is not null or b.phash is not null)
    and b.vot_formular_id is distinct from p_aktuelles_formular
  order by b.created_at asc limit 1;
$$;
```

> Hinweis Performance: `phash_hamming` ist ein Sequential-Scan-Prädikat (kein Index
> auf dem `=` mehr). Bei aktueller Tabellengröße unkritisch; falls die Bilder-Tabelle
> stark wächst, vorab per sha256/Kategorie filtern oder eine BK-Tree/`bit`-Spalte
> erwägen. Vor Anwendung den `bit(64)`-Cast gegen echte dHash-Werte testen (führende
> Nullen im Hex müssen erhalten bleiben — der Client paddet bereits auf 16 Zeichen).

---

## 5) KOORDINATION (WICHTIG)

- Diese Änderungen liegen im Worktree **`qmp-t4-autarc-gate` / `feature/t4-autarc-gate-loop`**.
- **`aufmass-foto-check` + die restliche Foto-Arbeit laufen LIVE auf
  `feature/onboarding-rework`** (Parallel-Session). Die Function ist dort v7 deployt.
- Beim Mergen/Deploy abstimmen: **Function NICHT doppelt deployen.** Der Function-/
  Prompt-Patch (§3) gehört in die Live-Quelle auf `feature/onboarding-rework`, nicht
  hierher (Worktree hat keine Function-Kopie).
- Der **Client** (`ki-foto-check-client.ts`) ist hier forward-kompatibel gemacht —
  beim Merge dieses Worktrees keine Konflikte erwartet, aber gegen die Live-Variante
  derselben Datei prüfen (Parallel-Session könnte sie ebenfalls angefasst haben).
- Die **Migration** (§4) auf das geteilte Supabase-Projekt `keplsvhudmfaagixttql` /
  Schema `thermocheck` abstimmen (mehrere Apps hängen dran).

---

## 6) Was lokal NICHT verifizierbar war

- **Echtes Gemini-Ablesen (A):** Ob die KI Maßband-/Winkelwerte zuverlässig abliest,
  ist erst nach Deploy des §3-Patches beobachtbar. Lokal nur die Vergleichslogik
  (`pruefeMesswertQuercheck`) und die Forward-Kompatibilität getestet — kein echter
  Vision-Call.
- **Echte Dedup-DB (B):** `phash_hamming`/`bit(64)`-Cast und das Verhalten gegen
  reale dHash-Werte in `thermocheck_vot_bilder` wurden NICHT in der DB ausgeführt
  (read-only, keine Migration). Die Distanzlogik selbst ist per Unit-Test gegen aus
  der Produktionslogik erzeugte Hashes abgesichert.
- **Browser-Rendering (C):** Das tatsächliche graue „ungeprüft"-Badge im echten
  PWA-Flow wurde nicht im Browser geklickt — nur die Status-Ableitung per Unit-Test.
- **Submit-Verdrahtung (A, Schritt 5):** bewusst nicht gebaut (Submit-/Store-Code
  lebt auf `feature/onboarding-rework`); hier nur als Folge-Schritt beschrieben.
