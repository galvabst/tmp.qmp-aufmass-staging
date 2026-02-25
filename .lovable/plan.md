

# RescheduleModal: Nicht wegklickbar + PLZ/Ort + Ablehnungs-Warnung

## Aenderungen

### 1. Modal nicht wegklickbar machen
- `onOpenChange` entfernen bzw. ignorieren (kein Schliessen per X oder Overlay-Klick)
- `DialogContent` bekommt `onPointerDownOutside` und `onEscapeKeyDown` mit `preventDefault`
- Das X-Icon im DialogContent ausblenden (via `[&>button]:hidden` class)

### 2. PLZ und Ort im Modal anzeigen
Die View `v_thermocheck_auftraege` hat `kunde_plz` und `kunde_ort`. Diese Felder werden im Hook `useMyPendingProposals` mitgeladen und im Interface `PendingReschedule` ergaenzt. Im Modal erscheint dann z.B. "44894 Bochum" unter dem Kundennamen.

### 3. Warnhinweis vor dem Ablehnen-Button
Ein orangefarbener Hinweistext oberhalb des Ablehnen-Buttons:
> "⚠️ Das Ablehnen von Aufträgen wirkt sich negativ auf deine Bewertung aus."

## Technische Details

### `src/hooks/useMyPendingProposals.ts`
- Step 2 Query: `select=id,kunde_vorname,kunde_nachname,kunde_plz,kunde_ort` ergaenzen
- `PendingReschedule` Interface: `plz` und `ort` Felder hinzufuegen
- Beim Grouping die neuen Felder durchreichen

### `src/components/RescheduleModal.tsx`
- `Dialog onOpenChange` so aendern, dass Schliessen verhindert wird
- `DialogContent`: `onPointerDownOutside={e => e.preventDefault()}` und `onEscapeKeyDown={e => e.preventDefault()}` hinzufuegen, Close-Button via `[&>button]:hidden` ausblenden
- PLZ + Ort in der Beschreibung anzeigen: "Dein Termin bei **Thomas Wermke** in **44894 Bochum** wurde verschoben."
- Warntext als Alert/Hinweis vor dem Ablehnen-Button

### Dateien

| Datei | Aenderung |
|---|---|
| `src/hooks/useMyPendingProposals.ts` | `kunde_plz`, `kunde_ort` laden und im Interface exponieren |
| `src/components/RescheduleModal.tsx` | Nicht-schliessbar, PLZ/Ort anzeigen, Ablehnungs-Warnung |

