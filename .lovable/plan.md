

# Quiz-Verwaltung im Admin-Panel

## Problem
Quiz-Fragen (`contractor_akademie_quiz`) können aktuell nicht über die Admin-Oberfläche bearbeitet werden. Die Fragen existieren in der DB, aber es fehlt ein Editor.

## Lösung
Ein Quiz-Editor-Dialog und eine Quiz-Anzeige pro Modul im Admin-Panel hinzufügen.

## Änderungen

### 1. DB: Neuer RPC `admin_upsert_akademie_quiz`
- Nimmt `p_data jsonb` entgegen (id?, modul_id, frage, antworten, reihenfolge, ist_aktiv)
- Bei vorhandener `id`: UPDATE, sonst INSERT
- `is_admin()`-Check wie bei den anderen RPCs

### 2. DB: Neuer RPC `admin_delete_akademie_quiz`
- Löscht eine Quiz-Frage per ID
- `is_admin()`-Check

### 3. Hook: `useAdminMutateQuiz.ts`
- `upsertQuiz` und `deleteQuiz` Mutations analog zu `useAdminMutateLektion`
- Invalidiert `['admin', 'akademie-module']`

### 4. Hook: `useAdminAkademieModule.ts` erweitern
- Quiz-Fragen pro Modul mitladen (`contractor_akademie_quiz`)
- Neuer Typ `AdminQuizFrage` mit allen Feldern
- `AdminModul` bekommt Feld `quizFragen: AdminQuizFrage[]`

### 5. Neue Komponente: `QuizFrageEditor.tsx`
- Dialog zum Erstellen/Bearbeiten einer Quiz-Frage
- Felder: Frage-Text, Reihenfolge, Aktiv-Toggle
- Dynamische Antworten-Liste: Text + Korrekt-Checkbox, Antworten hinzufügen/entfernen (min. 2, max. 6)
- Validierung: mindestens eine korrekte Antwort

### 6. Neue Komponente: `QuizFrageListItem.tsx`
- Kompakte Darstellung einer Quiz-Frage in der Modulliste
- Zeigt Frage-Text (gekürzt), Anzahl Antworten, Aktiv-Status
- Edit- und Toggle-Buttons

### 7. `AkademieAdminView.tsx` erweitern
- Pro Modul unterhalb der Lektionen: Quiz-Bereich mit Überschrift "Quiz-Fragen"
- Button "+ Frage" zum Hinzufügen
- Liste der Quiz-Fragen mit `QuizFrageListItem`

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| Migration SQL | 2 neue RPCs (upsert + delete) |
| `useAdminAkademieModule.ts` | Quiz-Fragen mitladen, neuer Typ |
| `useAdminMutateQuiz.ts` | Neuer Hook (upsert + delete) |
| `QuizFrageEditor.tsx` | Neuer Dialog |
| `QuizFrageListItem.tsx` | Neue Listenkomponente |
| `AkademieAdminView.tsx` | Quiz-Bereich pro Modul |

