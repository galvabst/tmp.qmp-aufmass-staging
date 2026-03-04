import { useQuery } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { supabase } from '@/integrations/supabase/client';

// ── Types ──

export type OnboardingStatusEnum = 'angelegt' | 'invited' | 'started' | 'in_progress' | 'blocked' | 'ready' | 'deaktiviert' | 'mitfahrt';

export const ONBOARDING_STATUS_LABELS: Record<OnboardingStatusEnum, string> = {
  angelegt: 'Angelegt',
  invited: 'Eingeladen',
  started: 'Gestartet',
  in_progress: 'In Bearbeitung',
  blocked: 'Blockiert',
  ready: 'Einsatzbereit',
  deaktiviert: 'Deaktiviert',
  mitfahrt: 'Mitfahrt',
};

export type OnboardingSubstatusEnum =
  | 'neu_angelegt' | 'vertrag_versendet' | 'vertrag_geprueft'
  | 'stammdaten_erfasst' | 'on_hold' | 'kleidung_bestellen'
  | 'lizenzen_bereitstellen' | 'akademie_gestartet' | 'deadline_ueberschritten'
  | 'akademie_abgeschlossen' | 'vertragsstrafe' | 'buchung_ausstehend'
  | 'mitfahrt_gebucht' | 'mitfahrt_in_rechnung' | 'mitfahrt_bezahlt';

export const ONBOARDING_SUBSTATUS_LABELS: Record<OnboardingSubstatusEnum, string> = {
  neu_angelegt: 'Neu angelegt',
  vertrag_versendet: 'Vertrag versendet',
  vertrag_geprueft: 'Vertrag geprüft',
  stammdaten_erfasst: 'Stammdaten erfasst',
  on_hold: 'On Hold',
  kleidung_bestellen: 'Kleidung bestellen',
  lizenzen_bereitstellen: 'Lizenzen bereitstellen',
  akademie_gestartet: 'Akademie gestartet',
  deadline_ueberschritten: 'Deadline überschritten',
  akademie_abgeschlossen: 'Akademie abgeschlossen',
  vertragsstrafe: 'Vertragsstrafe',
  buchung_ausstehend: 'Buchung ausstehend',
  mitfahrt_gebucht: 'Mitfahrt gebucht',
  mitfahrt_in_rechnung: 'Mitfahrt in Rechnung',
  mitfahrt_bezahlt: 'Mitfahrt bezahlt',
};

const ONBOARDING_STEPS = ['profil', 'dokumente', 'bestellungen', 'equipment', 'akademie', 'coaching', 'nachweise'] as const;

export const STEP_LABELS: Record<string, string> = {
  profil: 'Profil',
  dokumente: 'Dokumente',
  bestellungen: 'Bestellungen',
  equipment: 'Equipment',
  akademie: 'Akademie',
  coaching: 'Coaching',
  nachweise: 'Nachweise',
};

export interface AdminContractor {
  id: string;
  profileId: string | null;
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  avatarUrl: string | null;
  ort: string;
  // Onboarding
  onboardingStatus: OnboardingStatusEnum;
  onboardingSubstatus: OnboardingSubstatusEnum | null;
  currentStep: string | null;
  completedSteps: string[];
  isTrainer: boolean;
  erstelltAm: string;
  // Akademie
  lektionenCompleted: number;
  lektionenInProgress: number;
  lektionenTotal: number;
  akademieTestBestanden: boolean;
  quizVersuche: number;
  quizBestScore: number;
  quizBestanden: boolean;
  // Bestellungen
  bestellungenTotal: number;
  bestellungenBezahlt: number;
  // Equipment
  equipmentStatus: Record<string, { hatEigenes?: boolean; nachweisUrl?: string }>;
  // Coaching
  coachingBewertung: string;
  coachingTermin: string | null;
  coachName: string | null;
  // Intern
  vertragGeprueft: boolean;
  kleidungBestellt: boolean;
  lizenzenBereitgestellt: boolean;
  gewerbescheinUrl: string | null;
  gewerbescheinSpaeter: boolean;
  // Mitfahrt
  mitfahrtTermin: string | null;
  mitfahrtBezahltAm: string | null;
}

// ── Fetcher ──

async function fetchAdminContractors(): Promise<AdminContractor[]> {
  // 1. Fetch all onboarding records
  const { data: onboardings, error: onbErr } = await supabaseTC
    .from('contractor_onboarding')
    .select('*');
  if (onbErr) throw onbErr;
  if (!onboardings?.length) return [];

  // 2. Collect profile IDs and onboarding IDs
  const profileIds = onboardings.map(o => o.profile_id).filter(Boolean) as string[];
  const onboardingIds = onboardings.map(o => o.id);

  // 3. Parallel fetches
  const [profilesRes, lektionenRes, quizRes, bestellungenRes] = await Promise.all([
    // Profiles from public schema
    profileIds.length > 0
      ? supabase.from('profiles').select('id, vorname, nachname, email, telefon, avatar_url').in('id', profileIds)
      : Promise.resolve({ data: [] as any[], error: null }),
    // Lektionen fortschritt – aggregated per contractor
    supabaseTC.from('contractor_akademie_lektions_fortschritt').select('contractor_id, status'),
    // Quiz results
    supabaseTC.from('contractor_akademie_quiz_ergebnis').select('contractor_id, versuch, score, bestanden'),
    // Bestellungen
    supabaseTC.from('contractor_bestellungen').select('onboarding_id, stripe_payment_status'),
  ]);

  // Build lookup maps
  const profileMap = new Map<string, any>();
  (profilesRes.data || []).forEach(p => profileMap.set(p.id, p));

  // Lektionen: count per contractor
  const lektionenMap = new Map<string, { completed: number; inProgress: number }>();
  (lektionenRes.data || []).forEach(l => {
    const key = l.contractor_id;
    if (!lektionenMap.has(key)) lektionenMap.set(key, { completed: 0, inProgress: 0 });
    const entry = lektionenMap.get(key)!;
    if (l.status === 'completed') entry.completed++;
    else if (l.status === 'in_progress') entry.inProgress++;
  });

  // Quiz: aggregate per contractor
  const quizMap = new Map<string, { versuche: number; bestScore: number; bestanden: boolean }>();
  (quizRes.data || []).forEach(q => {
    const key = q.contractor_id;
    if (!quizMap.has(key)) quizMap.set(key, { versuche: 0, bestScore: 0, bestanden: false });
    const entry = quizMap.get(key)!;
    entry.versuche++;
    if ((q.score ?? 0) > entry.bestScore) entry.bestScore = q.score ?? 0;
    if (q.bestanden) entry.bestanden = true;
  });

  // Bestellungen: aggregate per onboarding
  const bestellMap = new Map<string, { total: number; bezahlt: number }>();
  (bestellungenRes.data || []).forEach(b => {
    const key = b.onboarding_id;
    if (!bestellMap.has(key)) bestellMap.set(key, { total: 0, bezahlt: 0 });
    const entry = bestellMap.get(key)!;
    entry.total++;
    if (b.stripe_payment_status === 'paid') entry.bezahlt++;
  });

  // 4. Build admin contractors
  return onboardings.map((o): AdminContractor => {
    const profile = o.profile_id ? profileMap.get(o.profile_id) : null;
    const lekt = o.profile_id ? lektionenMap.get(o.profile_id) : null;
    const quiz = o.profile_id ? quizMap.get(o.profile_id) : null;
    const best = bestellMap.get(o.id);
    const equipment = typeof o.equipment_status === 'object' && o.equipment_status !== null
      ? (o.equipment_status as Record<string, any>) : {};

    return {
      id: o.id,
      profileId: o.profile_id ?? null,
      vorname: profile?.vorname ?? '',
      nachname: profile?.nachname ?? '',
      email: profile?.email ?? o.ag_domain_email ?? '',
      telefon: profile?.telefon ?? '',
      avatarUrl: profile?.avatar_url ?? null,
      ort: o.anschrift_ort ?? '',
      onboardingStatus: (o.onboarding_status ?? 'angelegt') as OnboardingStatusEnum,
      onboardingSubstatus: (o.onboarding_substatus ?? null) as OnboardingSubstatusEnum | null,
      currentStep: o.current_step ?? null,
      completedSteps: Array.isArray(o.completed_steps) ? o.completed_steps : [],
      isTrainer: o.is_trainer ?? false,
      erstelltAm: o.erstellt_am,
      lektionenCompleted: lekt?.completed ?? 0,
      lektionenInProgress: lekt?.inProgress ?? 0,
      lektionenTotal: 51,
      akademieTestBestanden: o.akademie_test_bestanden ?? false,
      quizVersuche: quiz?.versuche ?? 0,
      quizBestScore: quiz?.bestScore ?? 0,
      quizBestanden: quiz?.bestanden ?? false,
      bestellungenTotal: best?.total ?? 0,
      bestellungenBezahlt: best?.bezahlt ?? 0,
      equipmentStatus: equipment,
      coachingBewertung: o.coaching_bewertung ?? 'ausstehend',
      coachingTermin: o.gebuchter_coaching_termin ?? null,
      coachName: o.gebuchter_coach_name ?? null,
      vertragGeprueft: o.vertrag_geprueft_intern ?? false,
      kleidungBestellt: o.kleidung_bestellt_intern ?? false,
      lizenzenBereitgestellt: o.lizenzen_bereitgestellt_intern ?? false,
      gewerbescheinUrl: o.gewerbeschein_url ?? null,
      gewerbescheinSpaeter: o.gewerbeschein_spaeter ?? false,
      mitfahrtTermin: o.mitfahrt_termin ?? null,
      mitfahrtBezahltAm: o.mitfahrt_bezahlt_am ?? null,
    };
  });
}

// ── Hook ──

export function useAdminContractorList() {
  return useQuery({
    queryKey: ['admin-contractor-list'],
    queryFn: fetchAdminContractors,
    staleTime: 30_000,
  });
}
