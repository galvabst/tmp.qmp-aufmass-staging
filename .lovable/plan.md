
## Bestehens-Schwelle auf 100% setzen

Aktuell gilt das Quiz ab 80% als bestanden. Die Aenderung setzt den Schwellenwert auf 100% -- alle 30 Fragen muessen korrekt beantwortet werden, um die Abschlusspruefung zu bestehen.

### Aenderungen

**1. `src/hooks/useModulQuiz.ts`**
- Default-Parameter `bestehensSchwelle = 80` aendern auf `bestehensSchwelle = 100`

**2. `src/components/akademie/QuizModal.tsx`**
- Default-Prop `bestehensSchwelle = 80` aendern auf `bestehensSchwelle = 100`

Das betrifft insgesamt nur 2 Zeilen. Die UI zeigt dann "Benoetigt: 100%" an und das Quiz gilt nur als bestanden, wenn der Score exakt 100 erreicht.
