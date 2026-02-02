import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
}

export interface QuizErgebnis {
  id: string;
  contractor_id: string;
  modul_id: string;
  versuch: number;
  score: number;
  bestanden: boolean;
  antworten: Record<string, number>; // fragenId -> ausgewählte Antwort Index
  abgeschlossen_at: string;
}

/**
 * Hook to fetch quiz questions for a module
 * Note: Quiz data is stored in thermocheck schema which isn't exposed via REST API yet
 * Returns empty array until schema is exposed or RPC functions are created
 */
export function useModulQuiz(modulId: string | undefined) {
  return useQuery({
    queryKey: ['akademie-quiz', modulId],
    queryFn: async () => {
      if (!modulId) return [];

      // Quiz data is in thermocheck schema - not accessible via standard Supabase client
      // This will return empty until either:
      // 1. The thermocheck schema is exposed via API
      // 2. RPC functions are created to access the data
      // 3. The tables are moved to public schema
      
      console.log('[Quiz] Thermocheck schema quiz table not yet accessible via REST API');
      
      // Return empty array - the QuizModal will handle this gracefully
      // by allowing module completion without quiz
      return [] as QuizFrage[];
    },
    enabled: !!modulId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to check if a quiz has been passed
 */
export function useQuizErgebnis(modulId: string | undefined, contractorId: string | undefined) {
  return useQuery({
    queryKey: ['quiz-ergebnis', modulId, contractorId],
    queryFn: async () => {
      if (!modulId || !contractorId) return null;

      // Quiz results are in thermocheck schema - not accessible via standard Supabase client
      console.log('[Quiz] Thermocheck schema quiz_ergebnis table not yet accessible');
      
      return null as QuizErgebnis | null;
    },
    enabled: !!modulId && !!contractorId,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to submit quiz answers
 * Note: This won't work until thermocheck schema is exposed or RPC is created
 */
export function useSubmitQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractorId,
      modulId,
      fragen,
      antworten,
      bestehensSchwelle = 80,
    }: {
      contractorId: string;
      modulId: string;
      fragen: QuizFrage[];
      antworten: Record<string, number>;
      bestehensSchwelle?: number;
    }) => {
      // Calculate score locally
      let correct = 0;
      for (const frage of fragen) {
        const selectedIndex = antworten[frage.id];
        if (selectedIndex !== undefined && frage.antworten[selectedIndex]?.korrekt) {
          correct++;
        }
      }
      const total = fragen.length;
      const score = total > 0 ? Math.round((correct / total) * 100) : 100; // 100% if no questions
      const bestanden = score >= bestehensSchwelle;

      // Quiz submission to thermocheck schema is not available yet
      // Return local result for now
      console.log('[Quiz] Submit would write to thermocheck schema:', {
        contractorId,
        modulId,
        score,
        bestanden,
      });

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
      // Invalidate quiz results cache
      queryClient.invalidateQueries({ 
        queryKey: ['quiz-ergebnis', variables.modulId] 
      });
    },
  });
}

/**
 * Calculate quiz score from answers
 */
export function calculateQuizScore(
  fragen: QuizFrage[],
  antworten: Record<string, number>
): { score: number; correct: number; total: number } {
  let correct = 0;
  for (const frage of fragen) {
    const selectedIndex = antworten[frage.id];
    if (selectedIndex !== undefined && frage.antworten[selectedIndex]?.korrekt) {
      correct++;
    }
  }
  const score = fragen.length > 0 ? Math.round((correct / fragen.length) * 100) : 0;
  return { score, correct, total: fragen.length };
}
