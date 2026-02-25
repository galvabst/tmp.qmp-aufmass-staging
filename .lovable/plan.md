

# Plan: Aufmass-Seite reparieren — Kundenname + Bild-Upload

## Root-Cause-Analyse (verifiziert durch DB-Queries + Network Logs)

### Das eigentliche Problem: Falsche ID in der URL

Die `TechnicianOrderDetail` navigiert zur Aufmass-Seite mit:
```typescript
navigate(`/thermocheck/aufmass/${order.id}`)
```

`order.id` ist die **terminvorschlag_id** (`fc3ab3f5-...`), NICHT die auftrag_id (`58ee2606-...`).

Beweis aus der DB:
```
terminvorschlag fc3ab3f5... → thermocheck_auftrag_id = 58ee2606...
terminvorschlag a52364d9... → thermocheck_auftrag_id = bc486cb7...
```

Das hat 3 Folge-Fehler:

| Fehler | Ursache | Beweis |
|---|---|---|
| Kundenname = "Unbekannt" | `v_thermocheck_auftraege?id=eq.fc3ab3f5...` findet 0 Rows (ID existiert dort nicht) | Network: Response Body `[]` |
| Auto-Create 409 FK-Verletzung | INSERT mit `thermocheck_auftrag_id=fc3ab3f5...` — FK referenziert `thermocheck_auftraege(id)`, diese ID existiert dort nicht | Network: 409, "Key is not present in table thermocheck_auftraege" |
| Upload-Buttons disabled | Kein Formular erstellt → votFormularId = undefined → `disabled={!votFormularId}` = true | Screenshot: Buttons sichtbar aber ohne Funktion |

### Warum der Kundenname korrekt waere mit der richtigen ID

Auftrag `58ee2606...` hat:
- `kunde_vorname = "Adam"`
- `kunde_nachname = "Hauczinger"`
- `lead_name = "Adam Hauczinger"`
- `lead_id = "587a1a6d-516d-40b1-bf03-7970cb42562f"`

Mit der korrekten ID wuerde `kundenName = "Adam Hauczinger"` korrekt angezeigt.

---

## Loesung: 3 Aenderungen

### 1. TechnicianOrderDetail.tsx — Navigation mit auftragId statt terminId

Zeile 622 aendern:

```typescript
// VORHER (falsch):
onClick={() => navigate(`/thermocheck/aufmass/${order.id}`)}

// NACHHER (korrekt):
onClick={() => navigate(`/thermocheck/aufmass/${order.auftragId || order.id}`)}
```

`order.auftragId` ist bereits in `TechnicianOrder` definiert und wird von `useMyAssignedOrders` korrekt befuellt (Zeile 118: `auftragId: termin.thermocheck_auftrag_id`).

### 2. Dateinamenschema: Kunde + Kategorie + Nummer

In `useVotBilder.ts` Zeile 82:

```typescript
// VORHER:
dateiname: `${kategorie}_${String(reihenfolge).padStart(3, '0')}.${ext}`,

// NACHHER:
dateiname: `kunde_${sanitizeLeadName(leadName)}_${kategorie}_${String(reihenfolge).padStart(3, '0')}.${ext}`,
```

Dafuer `sanitizeLeadName` aus `storage-path.ts` importieren.

Beispiel-Ergebnis: `kunde_hauczinger_hausschuhe_001.jpg`

### 3. Auto-Create Fehlerbehandlung verbessern

In `AufmassFormPage.tsx`: Die auto-create Logik ist korrekt, WENN die richtige auftragId verwendet wird. Aber zur Robustheit: den 409-Fehler (FK violation) abfangen und dem User eine klare Meldung zeigen.

```typescript
// In der .then()-Callback:
if (error) {
  if (error.code === '23503') {
    console.error('Auftrag existiert nicht:', auftragId);
    // Kein Toast — die Seite zeigt bereits Fallback-Daten
  } else {
    console.warn('Auto-Create fehlgeschlagen:', error.message);
  }
}
```

---

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/components/TechnicianOrderDetail.tsx` Zeile 622 | `order.id` → `order.auftragId \|\| order.id` |
| `src/features/aufmass/hooks/useVotBilder.ts` Zeile 82 | Dateiname: `kunde_{name}_{kategorie}_{nr}.{ext}` |
| `src/features/aufmass/ui/AufmassFormPage.tsx` Zeile 64-69 | Robustere Fehlerbehandlung im Auto-Create |

---

## User-Flow nach Fix

```text
1. Techniker klickt "Aufmaß erfassen" auf Auftrag Hauczinger
2. Navigation: /thermocheck/aufmass/58ee2606-... (auftragId, NICHT terminId)
3. AufmassFormPage laedt:
   a) v_thermocheck_auftraege?id=eq.58ee2606... → 1 Row mit kunde_vorname="Adam", kunde_nachname="Hauczinger"
   b) useVotFormular → kein Formular → auto-create mit thermocheck_auftrag_id=58ee2606... → FK OK → formular erstellt
   c) votFormularId = UUID → Upload-Buttons aktiv
4. kundenName = "Adam Hauczinger" (nicht mehr "Unbekannt")
5. leadName = "Adam Hauczinger", leadId = "587a1a6d..."
6. Techniker klickt "Datei" oder "Kamera" → Upload funktioniert
7. Dateiname in DB: "kunde_adam_hauczinger_hausschuhe_001.jpg"
8. Storage-Pfad: "operations/leads/adam_hauczinger_587a1a6d.../thermocheck-auftrag_58ee2606.../hausschuhe_001.jpg"
```

---

## RLS-Validierung (aktuelle Rolle: user)

| Tabelle | Operation | Policy | Funktioniert? |
|---|---|---|---|
| v_thermocheck_auftraege | SELECT | `USING (true)` fuer authenticated | Ja |
| thermocheck_vot_formulare | INSERT | `WITH CHECK (true)` fuer authenticated | Ja |
| thermocheck_vot_formulare | SELECT | `USING (true)` fuer authenticated | Ja |
| thermocheck_vot_bilder | INSERT | `WITH CHECK (auth.uid() IS NOT NULL)` | Ja |
| thermocheck_vot_bilder | SELECT | `USING (auth.uid() IS NOT NULL)` | Ja |
| storage.objects (galvanek_bau) | INSERT | `bucket_id='galvanek_bau' AND auth.uid() IS NOT NULL` | Ja |
| storage.objects (galvanek_bau) | SELECT | `bucket_id='galvanek_bau' AND auth.uid() IS NOT NULL` | Ja |

---

## Edge Cases

| Szenario | Handling |
|---|---|
| Alter Link mit terminId | Auftrag-Query findet 0 Rows → auftrag=null → kundenName="Unbekannt". Auto-Create schlaegt fehl (FK) aber wird graceful abgefangen |
| order.auftragId fehlt (pool orders) | Fallback auf `order.id` (Pool-Orders haben kein auftragId Feld) |
| Concurrent auto-create (StrictMode) | `autoCreatingRef` Flag + UNIQUE constraint auf thermocheck_auftrag_id |
| Formular existiert bereits | `useVotFormular` laedt es, auto-create wird uebersprungen |
| Auftrag geloescht | `.maybeSingle()` gibt null, UI zeigt Fallback |

---

## Keine DB-Migration noetig

Reine Code-Aenderungen in 3 Dateien. Alle DB-Strukturen, FKs und RLS-Policies sind korrekt.

