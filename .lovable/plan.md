

# Plan: Bild-Upload reparieren — Auto-Erstellung des Formulars + Fehlerbehandlung

## Root-Cause-Analyse (verifiziert durch DB + Network Logs)

### Warum Upload nicht funktioniert

Die Upload-Buttons ("Datei" / "Kamera") sind **disabled**, weil `votFormularId` immer `undefined` ist.

Beweis-Kette:

```text
1. Seite laedt → useVotFormular query → kein Formular existiert → formular = null
2. votFormularId = (formular as any)?.id → undefined
3. PhotoUploadField erhaelt votFormularId={undefined}
4. Button: disabled={isUploading || !votFormularId} → disabled={true}
5. handleFileUpload: if (!files || !votFormularId) return; → Upload bricht sofort ab
```

Das Formular wird erst bei Klick auf "Speichern" erstellt. Aber der User klickt nie "Speichern" bevor er Fotos hochlaedt – er erwartet, dass die Buttons sofort funktionieren. Die Buttons sehen auch nicht disabled aus (kein visueller Hinweis).

### Zweites Problem: Auftrag-Query wirft 406

```text
GET v_thermocheck_auftraege?id=eq.a52364d9-... → 406
"The result contains 0 rows" / "Cannot coerce to single JSON object"
```

Die View benutzt `.single()` – wenn der Auftrag nicht existiert oder 0 Rows zurueckgibt, wirft PostgREST einen 406. Das sollte `.maybeSingle()` sein, damit die App nicht crasht.

### Drittes Problem: Dateinamen

Die Storage-Pfade sind korrekt (`kategorie_001.jpg`), aber der `dateiname`-Wert in der DB speichert den Originalnamen vom Geraet (z.B. `IMG_20240315.jpg`). Fuer spaetere Zuordnung sollte der `dateiname` den Kategorie-Namen enthalten.

---

## Loesung

### Fix 1: Auto-Erstellung des Formular-Records bei Seitenaufruf

In `AufmassFormPage.tsx`: Wenn die Seite laedt und kein Formular existiert, wird automatisch ein `entwurf`-Record in `thermocheck_vot_formulare` erstellt. Dadurch ist `votFormularId` sofort verfuegbar.

```typescript
// Neuer useEffect in AufmassFormPage.tsx:
useEffect(() => {
  if (formularLoading || formular || !auftragId || !userId || autoCreating) return;
  // Kein Formular vorhanden → auto-erstellen
  setAutoCreating(true);
  supabaseTC
    .from('thermocheck_vot_formulare')
    .insert({ thermocheck_auftrag_id: auftragId, eingereicht_von: userId, status: 'entwurf' })
    .select()
    .single()
    .then(({ data, error }) => {
      if (!error) queryClient.invalidateQueries({ queryKey: ['vot-formular', auftragId] });
      setAutoCreating(false);
    });
}, [formularLoading, formular, auftragId, userId]);
```

**Resultat**: Upload-Buttons sind sofort aktiv nach Seitenaufruf.

### Fix 2: `.single()` → `.maybeSingle()` fuer Auftrag-Query

In `AufmassFormPage.tsx` Zeile 43: `.single()` durch `.maybeSingle()` ersetzen. Verhindert den 406-Fehler bei nicht-existierenden Auftraegen.

### Fix 3: Dateinamen-Verbesserung

In `useVotBilder.ts` beim Insert: `dateiname` auf `${kategorie}_${paddedIndex}.${ext}` setzen statt den Original-Dateinamen zu speichern.

```typescript
// Vorher:
dateiname: file.name,  // z.B. "IMG_20240315.jpg"

// Nachher:
dateiname: `${kategorie}_${String(reihenfolge).padStart(3, '0')}.${ext}`,  // z.B. "hausschuhe_001.jpg"
```

---

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/features/aufmass/ui/AufmassFormPage.tsx` | Auto-Create Formular + `.maybeSingle()` |
| `src/features/aufmass/hooks/useVotBilder.ts` | Dateiname auf Kategorie-basiert aendern |

## Edge Cases

| Szenario | Handling |
|---|---|
| Auto-Create laeuft doppelt (StrictMode) | `autoCreating` State-Flag verhindert doppelten Insert. DB hat unique constraint auf `thermocheck_auftrag_id` falls vorhanden, sonst idempotent durch sofortiges Query-Invalidate |
| User navigiert weg bevor Auto-Create fertig | Kein Problem – der Record bleibt als `entwurf` bestehen |
| Auftrag existiert nicht | `.maybeSingle()` gibt null zurueck, UI zeigt Fallback |
| Concurrent Uploads (schnelle Klicks) | `upsert: true` im Storage verhindert Konflikte |
| Keine Foreign-Key auf thermocheck_auftrag_id | Verifiziert: kein FK constraint, Insert geht auch wenn Auftrag fehlt |

## RLS-Validierung

| Tabelle | Operation | Policy | Funktioniert? |
|---|---|---|---|
| thermocheck_vot_formulare | INSERT | `auth_insert_vot`: `WITH CHECK (true)` | Ja, jeder authentifizierte User |
| thermocheck_vot_formulare | SELECT | `auth_select_vot`: `USING (true)` | Ja |
| thermocheck_vot_bilder | INSERT | `auth_insert_vot_bilder`: `WITH CHECK (auth.uid() IS NOT NULL)` | Ja |
| storage.objects (galvanek_bau) | INSERT | `galvanek_bau_insert`: `WITH CHECK (bucket_id = 'galvanek_bau' AND auth.uid() IS NOT NULL)` | Ja |

Alle Policies sind korrekt. Kein RLS-Blocker.

## Keine Migration noetig

Reine Code-Aenderungen. Alle DB-Strukturen und Policies sind korrekt.

