import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

// Thermocheck schema client (same pattern as useAkademieFortschritt)
const thermocheckClient = createClient(
  'https://keplsvhudmfaagixttql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY',
  { db: { schema: 'thermocheck' } }
);

// Types for Quiz
export interface QuizAntwort {
  text: string;
  korrekt: boolean;
}

export interface QuizFrage {
  id: string;
  frage: string;
  antworten: QuizAntwort[];
  reihenfolge: number;
  isMultipleChoice: boolean;
}

export interface QuizErgebnis {
  id: string;
  contractor_id: string;
  modul_id: string;
  versuch: number;
  score: number;
  bestanden: boolean;
  antworten: Record<string, number | number[]>;
  abgeschlossen_at: string;
}

/**
 * Determine if a question has multiple correct answers
 */
function detectMultipleChoice(antworten: QuizAntwort[]): boolean {
  return antworten.filter(a => a.korrekt).length > 1;
}

/**
 * Hook to fetch quiz questions for a module.
 * Pass modulId = undefined to load ALL active questions (for Abschlussprüfung).
 */
export function useModulQuiz(modulId: string | undefined) {
  return useQuery({
    queryKey: ['akademie-quiz', modulId],
    queryFn: async (): Promise<QuizFrage[]> => {
      let query = thermocheckClient
        .from('contractor_akademie_quiz')
        .select('id, frage, antworten, reihenfolge')
        .eq('ist_aktiv', true)
        .order('reihenfolge', { ascending: true });

      if (modulId) {
        query = query.eq('modul_id', modulId);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('[Quiz] Error fetching questions:', error);
        return [];
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        frage: row.frage,
        antworten: row.antworten as QuizAntwort[],
        reihenfolge: row.reihenfolge,
        isMultipleChoice: detectMultipleChoice(row.antworten as QuizAntwort[]),
      }));
    },
    enabled: modulId !== null, // enabled when modulId is undefined (all) or a string
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to check if a quiz has been passed
 */
export function useQuizErgebnis(modulId: string | undefined, contractorId: string | undefined) {
  return useQuery({
    queryKey: ['quiz-ergebnis', modulId, contractorId],
    queryFn: async (): Promise<QuizErgebnis | null> => {
      if (!modulId || !contractorId) return null;

      const { data, error } = await thermocheckClient
        .from('contractor_akademie_quiz_ergebnis')
        .select('*')
        .eq('contractor_id', contractorId)
        .eq('modul_id', modulId)
        .eq('bestanden', true)
        .order('abgeschlossen_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('[Quiz] Error fetching result:', error);
        return null;
      }

      return data as QuizErgebnis | null;
    },
    enabled: !!modulId && !!contractorId,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to submit quiz answers
 */
export function useSubmitQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractorId,
      modulId,
      fragen,
      antworten,
      bestehensSchwelle = 100,
    }: {
      contractorId: string;
      modulId: string;
      fragen: QuizFrage[];
      antworten: Record<string, number | number[]>;
      bestehensSchwelle?: number;
    }) => {
      // Calculate score
      let correct = 0;
      for (const frage of fragen) {
        const selected = antworten[frage.id];
        if (frage.isMultipleChoice) {
          // Multiple choice: all correct must be selected, no incorrect
          const selectedIndices = Array.isArray(selected) ? selected : [];
          const correctIndices = frage.antworten
            .map((a, i) => a.korrekt ? i : -1)
            .filter(i => i !== -1);
          const isCorrect =
            correctIndices.length === selectedIndices.length &&
            correctIndices.every(i => selectedIndices.includes(i));
          if (isCorrect) correct++;
        } else {
          // Single choice
          const selectedIndex = typeof selected === 'number' ? selected : -1;
          if (selectedIndex !== -1 && frage.antworten[selectedIndex]?.korrekt) {
            correct++;
          }
        }
      }
      const total = fragen.length;
      const score = total > 0 ? Math.round((correct / total) * 100) : 100;
      const bestanden = score >= bestehensSchwelle;

      // Try to save to DB
      try {
        await thermocheckClient
          .from('contractor_akademie_quiz_ergebnis')
          .insert({
            contractor_id: contractorId,
            modul_id: modulId,
            score,
            bestanden,
            antworten: antworten as any,
          });
      } catch (e) {
        console.warn('[Quiz] Could not save result to DB:', e);
      }

      return {
        ergebnis: {
          id: `local-${Date.now()}`,
          contractor_id: contractorId,
          modul_id: modulId,
          versuch: 1,
          score,
          bestanden,
          antworten,
          abgeschlossen_at: new Date().toISOString(),
        } as QuizErgebnis,
        score,
        bestanden,
        correct,
        total,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['quiz-ergebnis', variables.modulId],
      });
    },
  });
}

/**
 * Calculate quiz score from answers (supports both single and multiple choice)
 */
export function calculateQuizScore(
  fragen: QuizFrage[],
  antworten: Record<string, number | number[]>
): { score: number; correct: number; total: number } {
  let correct = 0;
  for (const frage of fragen) {
    const selected = antworten[frage.id];
    if (frage.isMultipleChoice) {
      const selectedIndices = Array.isArray(selected) ? selected : [];
      const correctIndices = frage.antworten
        .map((a, i) => a.korrekt ? i : -1)
        .filter(i => i !== -1);
      const isCorrect =
        correctIndices.length === selectedIndices.length &&
        correctIndices.every(i => selectedIndices.includes(i));
      if (isCorrect) correct++;
    } else {
      const selectedIndex = typeof selected === 'number' ? selected : -1;
      if (selectedIndex !== -1 && frage.antworten[selectedIndex]?.korrekt) {
        correct++;
      }
    }
  }
  const score = fragen.length > 0 ? Math.round((correct / fragen.length) * 100) : 0;
  return { score, correct, total: fragen.length };
}
