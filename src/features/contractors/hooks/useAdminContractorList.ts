import { useQuery } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { supabase } from '@/integrations/supabase/client';

// ── Types ──

export type OnboardingStatusEnum = 'angelegt' | 'invited' | 'started' | 'in_progress' | 'blocked' | 'ready' | 'deaktiviert' | 'mitfahrt' | 'inaktiv' | 'ausgestiegen' | 'gefeuert' | 'onboarding_abgebrochen';

export const ONBOARDING_STATUS_LABELS: Record<OnboardingStatusEnum, string> = {
  angelegt: 'Angelegt',
  invited: 'Eingeladen',
  started: 'Gestartet',
  in_progress: 'In Bearbeitung',
  blocked: 'Blockiert',
  ready: 'Einsatzbereit',
  deaktiviert: 'Deaktiviert',
  mitfahrt: 'Mitfahrt',
  inaktiv: 'Pausiert',
  ausgestiegen: 'Ausgestiegen',
  gefeuert: 'Gefeuert',
  onboarding_abgebrochen: 'Onboarding abgebrochen',
};

/** Status-Werte, die nicht mehr "aktiv im Onboarding" sind (Ex-Techniker). */
export const EHEMALIGE_STATUSES: OnboardingStatusEnum[] = ['ausgestiegen', 'gefeuert', 'deaktiviert', 'onboarding_abgebrochen'];


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

export interface BestellungDetail {
  produktKey: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  groesse: string | null;
}

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
  bezahlteProdukte: string[];
  bestellungen: BestellungDetail[];
  // Pflichtprodukte
  pflichtProdukteTotal: number;
  pflichtProdukteBezahlt: number;
  // Equipment
  equipmentStatus: Record<string, { hatEigenes?: boolean; nachweisUrl?: string }>;
  // Coaching
  coachingBewertung: string;
  coachingTermin: string | null;
  coachName: string | null;
  // Praxistest
  praxistestEingereicht: boolean;
  praxistestFreigabe: boolean;
  scanFreigegeben: boolean;
  videoFreigegeben: boolean;
  // Intern
  vertragGeprueft: boolean;
  kleidungBestellt: boolean;
  lizenzenBereitgestellt: boolean;
  gewerbescheinUrl: string | null;
  gewerbescheinSpaeter: boolean;
  // Mitfahrt
  mitfahrtTermin: string | null;
  mitfahrtBezahltAm: string | null;
  // Freigaben
  einweisungFreigabe: boolean;
  // Austritt (für ehemalige Techniker)
  austrittsDatum: string | null;
  austrittsGrund: string | null;
}

async function fetchAdminContractors(): Promise<AdminContractor[]> {
  // 1. Fetch all onboarding records + potential technicians (Galvanek-Profile ohne Onboarding) in parallel
  const [onbRes, potentialRes] = await Promise.all([
    (supabaseTC.from('contractor_onboarding').select('*') as any),
    supabase.rpc('get_potential_technicians' as any),
  ]);
  const onboardings = onbRes.data as any[] | null;
  if (onbRes.error) throw onbRes.error;
  if (potentialRes.error) {
    console.warn('[useAdminContractorList] get_potential_technicians failed:', potentialRes.error);
  }
  const potentials = (potentialRes.data as any[] | null) ?? [];
  if (!onboardings?.length && !potentials.length) return [];

  if (onbErr) throw onbErr;
  if (!onboardings?.length) return [];

  // 2. Collect profile IDs and onboarding IDs
  const profileIds = onboardings.map(o => o.profile_id).filter(Boolean) as string[];
  const onboardingIds = onboardings.map(o => o.id);

  // 3. Parallel fetches
  const [profilesRes, lektionenRes, quizRes, bestellungenRes, lektionenCountRes, pflichtProdukteRes] = await Promise.all([
    // Profiles from public schema
    profileIds.length > 0
      ? supabase.from('profiles').select('id, vorname, nachname, email, telefon, avatar_url').in('id', profileIds)
      : Promise.resolve({ data: [] as any[], error: null }),
    // Lektionen fortschritt – aggregated per contractor
    supabaseTC.from('contractor_akademie_lektions_fortschritt').select('contractor_id, status'),
    // Quiz results
    supabaseTC.from('contractor_akademie_quiz_ergebnis').select('contractor_id, versuch, score, bestanden'),
    // Bestellungen
    supabaseTC.from('contractor_bestellungen').select('onboarding_id, stripe_payment_status, produkt_key, groesse'),
    // Aktive Lektionen zählen
    supabaseTC.from('contractor_akademie_lektionen').select('id', { count: 'exact', head: true }).eq('ist_aktiv', true),
    // Pflichtprodukte laden
    supabaseTC.from('contractor_produkte').select('produkt_key').eq('ist_aktiv', true).eq('ist_pflicht', true),
  ]);

  const activeLektionenCount = lektionenCountRes.count ?? 0;
  const pflichtProduktKeys = new Set((pflichtProdukteRes.data || []).map(p => p.produkt_key));

  // T-Shirt und Poloshirt gelten als EINE Pflicht-Gruppe (eins von beiden reicht)
  const OBERTEIL_KEYS = ['tshirt', 'poloshirt'];
  const hasOberteilGroup = OBERTEIL_KEYS.some(k => pflichtProduktKeys.has(k));
  // Effektive Pflicht-Anzahl: alle Keys minus die doppelten Oberteile + 1 Gruppe
  const pflichtProdukteEffektiv = hasOberteilGroup
    ? pflichtProduktKeys.size - OBERTEIL_KEYS.filter(k => pflichtProduktKeys.has(k)).length + 1
    : pflichtProduktKeys.size;

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

  // Bestellungen: aggregate per onboarding, deduplicate by produkt_key (keep best status)
  const STATUS_PRIORITY: Record<string, number> = { paid: 3, pending: 2, failed: 1, refunded: 0 };
  const bestellMap = new Map<string, { total: number; bezahlt: number; paidKeys: string[]; details: BestellungDetail[] }>();
  // First pass: collect all orders grouped by onboarding + produkt_key
  const rawByOnboarding = new Map<string, Map<string, { status: string; groesse: string | null }>>();
  (bestellungenRes.data || []).forEach(b => {
    const onbKey = b.onboarding_id;
    const prodKey = b.produkt_key ?? '?';
    if (!rawByOnboarding.has(onbKey)) rawByOnboarding.set(onbKey, new Map());
    const prodMap = rawByOnboarding.get(onbKey)!;
    const existing = prodMap.get(prodKey);
    const newStatus = b.stripe_payment_status ?? 'pending';
    // Keep the entry with the highest priority status
    if (!existing || (STATUS_PRIORITY[newStatus] ?? 0) > (STATUS_PRIORITY[existing.status] ?? 0)) {
      prodMap.set(prodKey, { status: newStatus, groesse: b.groesse ?? null });
    }
  });
  // Second pass: build deduplicated bestellMap
  rawByOnboarding.forEach((prodMap, onbKey) => {
    const entry = { total: prodMap.size, bezahlt: 0, paidKeys: [] as string[], details: [] as BestellungDetail[] };
    prodMap.forEach((val, prodKey) => {
      entry.details.push({ produktKey: prodKey, status: val.status as BestellungDetail['status'], groesse: val.groesse });
      if (val.status === 'paid') {
        entry.bezahlt++;
        entry.paidKeys.push(prodKey);
      }
    });
    bestellMap.set(onbKey, entry);
  });

  // 4. Build admin contractors
  return onboardings.map((o): AdminContractor => {
    const profile = o.profile_id ? profileMap.get(o.profile_id) : null;
    const lekt = lektionenMap.get(o.id) ?? null;
    const quiz = quizMap.get(o.id) ?? null;
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
      onboardingStatus: (() => {
        const raw = (o.onboarding_status ?? 'angelegt') as OnboardingStatusEnum;
        // Inaktiv/Ehemalig hat IMMER Vorrang vor is_trainer
        if (raw === 'inaktiv' || EHEMALIGE_STATUSES.includes(raw)) return raw;
        return (o.is_trainer ? 'ready' : raw) as OnboardingStatusEnum;
      })(),
      onboardingSubstatus: (o.onboarding_substatus ?? null) as OnboardingSubstatusEnum | null,
      currentStep: o.current_step ?? null,
      completedSteps: Array.isArray(o.completed_steps) ? o.completed_steps : [],
      isTrainer: o.is_trainer ?? false,
      erstelltAm: o.erstellt_am,
      lektionenCompleted: lekt?.completed ?? 0,
      lektionenInProgress: lekt?.inProgress ?? 0,
      lektionenTotal: activeLektionenCount,
      akademieTestBestanden: o.akademie_test_bestanden ?? false,
      quizVersuche: quiz?.versuche ?? 0,
      quizBestScore: quiz?.bestScore ?? 0,
      quizBestanden: quiz?.bestanden ?? (Array.isArray(o.completed_steps) && o.completed_steps.includes('akademie')),
      bestellungenTotal: best?.total ?? 0,
      bestellungenBezahlt: best?.bezahlt ?? 0,
      bezahlteProdukte: best?.paidKeys ?? [],
      bestellungen: best?.details ?? [],
      pflichtProdukteTotal: pflichtProdukteEffektiv,
      pflichtProdukteBezahlt: (() => {
        const paidKeys = best?.paidKeys ?? [];
        // Count each non-oberteil pflicht key individually
        let count = [...pflichtProduktKeys]
          .filter(pk => !OBERTEIL_KEYS.includes(pk) && paidKeys.includes(pk))
          .length;
        // Oberteil-Gruppe: gilt als bezahlt wenn mind. eins bezahlt
        if (hasOberteilGroup && OBERTEIL_KEYS.some(k => paidKeys.includes(k))) {
          count++;
        }
        return count;
      })(),
      equipmentStatus: equipment,
      coachingBewertung: o.coaching_bewertung ?? 'ausstehend',
      coachingTermin: o.gebuchter_coaching_termin ?? null,
      coachName: o.gebuchter_coach_name ?? null,
      vertragGeprueft: o.vertrag_geprueft_intern ?? false,
      kleidungBestellt: o.kleidung_bestellt_intern ?? false,
      lizenzenBereitgestellt: o.lizenzen_bereitgestellt_intern ?? false,
      gewerbescheinUrl: o.gewerbeschein_url ?? null,
      gewerbescheinSpaeter: o.gewerbeschein_spaeter ?? false,
      praxistestEingereicht: !!o.praxistest_eingereicht_am,
      praxistestFreigabe: o.praxistest_freigabe ?? false,
      scanFreigegeben: (o as any).praxistest_scan_freigegeben ?? false,
      videoFreigegeben: (o as any).praxistest_video_freigegeben ?? false,
      mitfahrtTermin: o.mitfahrt_termin ?? null,
      mitfahrtBezahltAm: o.mitfahrt_bezahlt_am ?? null,
      einweisungFreigabe: o.einweisung_freigabe ?? false,
      austrittsDatum: (o as any).austritts_datum ?? null,
      austrittsGrund: (o as any).austritts_grund ?? null,
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
