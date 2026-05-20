## Ziel

Innendienst soll Techniker sauber aus dem Onboarding/Aktiv-System entfernen können, ohne historische Daten zu verlieren. Drei klar getrennte Austrittsgründe, automatische Bereinigung offener Aufträge, und Ehemalige bleiben per Suche auffindbar.

## Drei Austrittsstufen

| Aktion | Status | Reversibel | Sichtbar in |
|---|---|---|---|
| **Pausieren** (bestehend) | `inaktiv` | ✅ Reaktivieren | Eigener "Inaktiv"-Tab |
| **Ausgestiegen** (neu) | `ausgestiegen` | nur manuell | Nur per Suche |
| **Gefeuert** (bestehend) | `gefeuert` | nur manuell | Nur per Suche |

`ausgestiegen` = freiwilliger Ausstieg (z.B. Jonas Magdeburg, Justin Balk, Olaf Markmann).
`gefeuert` = unfreiwillige Trennung (Performance, Fehlverhalten).

## Datenbank-Änderungen

1. **Enum erweitern**: `thermocheck.contractor_onboarding_status_enum` um Wert `ausgestiegen` ergänzen.
2. **Neue Spalten** auf `thermocheck.contractor_onboarding`:
   - `austritts_datum timestamptz` (automatisch via Trigger gesetzt)
   - `austritts_grund text` (optionale Notiz vom Innendienst)
3. **Trigger** `set_austritts_datum_trg`: setzt `austritts_datum=now()` automatisch sobald `onboarding_status` auf `inaktiv`/`ausgestiegen`/`gefeuert`/`deaktiviert` wechselt; setzt es zurück auf `NULL` bei Reaktivierung.
4. **SECURITY DEFINER RPC** `thermocheck.set_contractor_austritt(p_onboarding_id uuid, p_status text, p_grund text)`:
   - Prüft `is_innendienst()` (Standardpattern)
   - Validiert `p_status ∈ {inaktiv, ausgestiegen, gefeuert, in_progress}`
   - Update Status + Notiz
   - Bei `ausgestiegen`/`gefeuert`: setzt `zugewiesener_techniker_id = NULL` auf allen offenen Aufträgen dieses Technikers (Status ≠ abgeschlossen/storniert) → Aufträge fallen automatisch zurück in den Pool
   - Alles in einer DB-Transaktion (transaktionales Pattern, kein Teil-Fehlschlag)

## Frontend-Änderungen

### `useAdminContractorList`
- Default-Filter erweitern: `.not('onboarding_status', 'in', '("deaktiviert","gefeuert","ausgestiegen")')`
- **Ausnahme**: wenn Suchquery aktiv → zusätzliche Query, die auch ehemalige Techniker (deaktiviert/gefeuert/ausgestiegen) einschließt, damit Jonas/Justin/Olaf über Namenssuche gefunden werden.
- Neue Felder `austrittsDatum`, `austrittsGrund` mappen.

### `ContractorListView`
- Dropdown im Card-Menü → drei Optionen statt zwei:
  - "Pausieren" (Pause-Icon)
  - "Ausgestiegen" (LogOut-Icon, neutral)
  - "Endgültig deaktivieren" (Ban-Icon, destruktiv)
- Bestätigungsdialog erweitert: optionales `<Textarea>` für Grund/Notiz.
- Wenn aktuell ein Suchbegriff eingegeben ist: oberhalb der Trefferliste dezenter Hinweis "Suche zeigt auch ehemalige Techniker (X gefunden)".
- Ehemalige Cards: grau, durchgestrichen, Status-Badge in Sekundärfarbe + kleines Datum "Ausgestiegen 12.03.2025".

### `useAdminHiringMap`
- Filter erweitern um `ausgestiegen` → keine ehemaligen Techniker mehr auf der Karte.

## Technische Details

- TypeScript-Types werden nach Migration vom Lovable-Pipeline regeneriert (kein manuelles `types.ts`-Editing).
- Status-Konstanten in `useAdminContractorList.ts` (`ONBOARDING_STATUS_LABELS`, Icon/BG-Maps) um `ausgestiegen: 'Ausgestiegen'` ergänzen.
- Reaktivierung eines ausgestiegenen/gefeuerten Technikers bleibt manuell über das Detail-Dropdown möglich (setzt Status zurück auf `in_progress`, Trigger nullt das Austrittsdatum).
- Trainer-Flag bleibt unangetastet (auf Wunsch nicht gewählt).

## Out of Scope

- Login-Sperre (Auth-User deaktivieren) — nicht gewählt
- Trainer-Flag automatisch entfernen — nicht gewählt
- Eigener "Ehemalige"-Tab — nicht gewählt, nur Suche
