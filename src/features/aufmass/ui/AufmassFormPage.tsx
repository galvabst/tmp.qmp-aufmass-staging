import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AufmassDraftData, aufmassSubmitSchema } from '../data/aufmass-schema';
import { PvAufmassDraftData } from '../data/pv-aufmass-schema';
import { useVotFormular, useUpsertVotFormular } from '../hooks/useVotFormular';
import { usePvFormular, useUpsertPvFormular } from '../hooks/usePvFormular';
import { useVotBilder } from '../hooks/useVotBilder';
import { AufmassFormStepper, StepConfig } from './AufmassFormStepper';
import { TechnikerDatenSection } from './sections/TechnikerDatenSection';
import { KundendatenSection } from './sections/KundendatenSection';
import { PhotoOnlySection } from './sections/PhotoOnlySection';
import { HeizungsraumSection } from './sections/HeizungsraumSection';
import { HeizungsartSection } from './sections/HeizungsartSection';
import { HeizkoerperSection } from './sections/HeizkoerperSection';
import { ElektrikSection } from './sections/ElektrikSection';
import { AufstellortSection } from './sections/AufstellortSection';
import { SanitaerSection } from './sections/SanitaerSection';
import { ChecklisteSection } from './sections/ChecklisteSection';
import { UnbegehbareRaeumeSection } from './sections/UnbegehbareRaeumeSection';
import { PvAnlageSection } from './sections/PvAnlageSection';
import { AbschlussSection } from './sections/AbschlussSection';
import { PvAllgemeinSection } from './sections/pv/PvAllgemeinSection';
import { PvDachSection } from './sections/pv/PvDachSection';
import { PvDachziegelSection } from './sections/pv/PvDachziegelSection';
import { PvGeruestSection } from './sections/pv/PvGeruestSection';
import { PvDcKabelSection } from './sections/pv/PvDcKabelSection';
import { PvUnterkonstruktionSection } from './sections/pv/PvUnterkonstruktionSection';
import { PvBlitzschutzSection } from './sections/pv/PvBlitzschutzSection';
import { PvAbschlussSection } from './sections/pv/PvAbschlussSection';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const BASE_STEPS: StepConfig[] = [
  { title: 'Techniker-Daten', icon: '👤' },
  { title: 'Kundendaten', icon: '🏠' },
  { title: 'Treppenabgang', icon: '🪜' },
  { title: 'Eingang Heizungsraum', icon: '🚪' },
  { title: 'Heizungsraum', icon: '🔥' },
  { title: 'Heizungsart & Heizanlage', icon: '⚡' },
  { title: 'Heizkörper', icon: '♨️' },
  { title: 'Elektrik & Zähler', icon: '⚡' },
  { title: 'Aufstellort', icon: '📍' },
  { title: 'Sanitär', icon: '🚿' },
  { title: 'Checkliste', icon: '✅' },
  { title: 'Unbegehbare Räume', icon: '🚫' },
  { title: 'PV-Anlage', icon: '☀️' },
];

const PV_STEPS: StepConfig[] = [
  { title: 'PV: Allgemein', icon: '☀️' },
  { title: 'PV: Dach', icon: '🏠' },
  { title: 'PV: Dachziegel', icon: '🧱' },
  { title: 'PV: Gerüst', icon: '🏗️' },
  { title: 'PV: DC-Kabelführung', icon: '🔌' },
  { title: 'PV: Unterkonstruktion', icon: '📐' },
  { title: 'PV: Blitzschutz', icon: '⚡' },
  { title: 'PV: Abschluss', icon: '✍️' },
];

const ABSCHLUSS_STEP: StepConfig = { title: 'Abschluss', icon: '✍️' };

export default function AufmassFormPage() {
  const { auftragId } = useParams<{ auftragId: string }>();
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;

  // Load auftrag data
  const { data: auftrag, isLoading: auftragLoading } = useQuery({
    queryKey: ['thermocheck-auftrag-detail', auftragId],
    enabled: !!auftragId,
    queryFn: async () => {
      const { data, error } = await supabaseTC
        .from('v_thermocheck_auftraege' as any)
        .select('*')
        .eq('id', auftragId!)
        .maybeSingle();
      if (error) throw error;
      return data as Record<string, any>;
    },
  });

  // Load existing formular
  const { data: formular, isLoading: formularLoading } = useVotFormular(auftragId);
  const votFormularId = (formular as any)?.id as string | undefined;

  // Auto-create formular record if none exists
  const queryClient = useQueryClient();
  const autoCreatingRef = useRef(false);
  useEffect(() => {
    if (formularLoading || formular || !auftragId || !userId || autoCreatingRef.current) return;
    autoCreatingRef.current = true;
    supabaseTC
      .from('thermocheck_vot_formulare' as any)
      .insert({ thermocheck_auftrag_id: auftragId, eingereicht_von: userId, status: 'entwurf' } as any)
      .select()
      .single()
      .then(({ error }) => {
        if (!error) {
          queryClient.invalidateQueries({ queryKey: ['vot-formular', auftragId] });
        } else if (error.code === '23503') {
          console.error('Auftrag existiert nicht (FK-Verletzung):', auftragId);
        } else {
          console.warn('Auto-Create Formular fehlgeschlagen:', error.message);
        }
        autoCreatingRef.current = false;
      });
  }, [formularLoading, formular, auftragId, userId, queryClient]);

  // Load bilder
  const { data: bilder = [] } = useVotBilder(votFormularId);

  // THC form
  const upsertMutation = useUpsertVotFormular();
  const form = useForm<AufmassDraftData>({ defaultValues: {} });

  // PV form
  const pvForm = useForm<PvAufmassDraftData>({ defaultValues: {} });
  const { data: pvFormular, isLoading: pvFormularLoading } = usePvFormular(votFormularId);
  const pvUpsertMutation = useUpsertPvFormular();

  // Watch hat_pv_anlage for dynamic steps
  const hatPv = form.watch('hat_pv_anlage');

  // Prefill THC form when data loads — keep user's in-progress edits (dirty values)
  // to prevent already-typed values (e.g. Inbetriebnahme-Datum) from being reset
  // when react-query refetches the formular after an autosave or window focus.
  useEffect(() => {
    if (!formular) return;
    const f = formular as Record<string, any>;
    form.reset({ ...form.getValues(), ...f }, { keepDirtyValues: true });
  }, [formular]);

  // Prefill PV form when data loads — same guarantee for PV form
  useEffect(() => {
    if (!pvFormular) return;
    const f = pvFormular as Record<string, any>;
    pvForm.reset({ ...pvForm.getValues(), ...f }, { keepDirtyValues: true });
  }, [pvFormular]);

  // Prefill techniker data from profile
  useEffect(() => {
    if (!session?.user) return;
    const meta = session.user.user_metadata;
    if (!form.getValues('techniker_name') && meta?.name) {
      form.setValue('techniker_name', meta.name);
    }
    if (!form.getValues('techniker_telefon') && meta?.telefon) {
      form.setValue('techniker_telefon', meta.telefon);
    }
    if (!form.getValues('thermocheck_datum')) {
      form.setValue('thermocheck_datum', new Date().toISOString().split('T')[0]);
    }
  }, [session]);

  const isReadOnly = (formular as any)?.status === 'abgeschlossen';
  const leadName = (auftrag as any)?.lead_name || (auftrag as any)?.kunde_nachname || 'unbekannt';
  const leadId = (auftrag as any)?.lead_id || '';
  const kundenName = `${(auftrag as any)?.kunde_vorname || ''} ${(auftrag as any)?.kunde_nachname || ''}`.trim() || 'Unbekannt';

  // Dynamic steps based on hat_pv_anlage
  const showPvSteps = hatPv === false;
  const steps = useMemo(() => {
    return showPvSteps
      ? [...BASE_STEPS, ...PV_STEPS, ABSCHLUSS_STEP]
      : [...BASE_STEPS, ABSCHLUSS_STEP];
  }, [showPvSteps]);

  // Controlled stepper state — needed so handleSubmit can jump to missing fields
  const [currentStep, setCurrentStep] = useState(0);

  /**
   * Field → (label, base step index) map.
   * Step indices reference BASE_STEPS positions. The Abschluss step uses -1 and is
   * resolved dynamically (showPvSteps ? 21 : 13) so the link stays correct in both
   * variants of the stepper.
   */
  const FIELD_META: Record<string, { label: string; step: number }> = useMemo(() => ({
    techniker_name: { label: 'Techniker-Name', step: 0 },
    techniker_telefon: { label: 'Telefonnummer', step: 0 },
    thermocheck_datum: { label: 'Datum Thermocheck', step: 0 },
    heizung_inbetriebnahme_datum: { label: 'Inbetriebnahme-Datum Heizung', step: 1 },
    heizung_funktionstuechtig: { label: 'Heizung funktionstüchtig?', step: 1 },
    bauantrag_datum: { label: 'Bauantrag-Datum', step: 1 },
    fossile_brennstoffe_nach_austausch: { label: 'Fossile Brennstoffe nach Austausch?', step: 1 },
    mehr_bilder_heizungsraum: { label: 'Mehr Bilder Heizungsraum?', step: 4 },
    heizungsraum_verlegen: { label: 'Heizungsraum verlegen?', step: 4 },
    anschluss_vorlauf_vorhanden: { label: 'Anschluss Vorlauf', step: 4 },
    anschluss_vorlauf_distanz: { label: 'Distanz Vorlauf', step: 4 },
    anschluss_ruecklauf_vorhanden: { label: 'Anschluss Rücklauf', step: 4 },
    anschluss_ruecklauf_distanz: { label: 'Distanz Rücklauf', step: 4 },
    anschluss_warmwasser_vorhanden: { label: 'Anschluss Warmwasser', step: 4 },
    anschluss_warmwasser_distanz: { label: 'Distanz Warmwasser', step: 4 },
    anschluss_kaltwasser_vorhanden: { label: 'Anschluss Kaltwasser', step: 4 },
    anschluss_kaltwasser_distanz: { label: 'Distanz Kaltwasser', step: 4 },
    anschluss_zirkulation_vorhanden: { label: 'Anschluss Zirkulation', step: 4 },
    anschluss_zirkulation_distanz: { label: 'Distanz Zirkulation', step: 4 },
    heizungsart: { label: 'Heizungsart', step: 5 },
    heizungsart_sonstige: { label: 'Heizungsart (sonstige)', step: 5 },
    oeltank_liter_gesamt: { label: 'Öltank Liter gesamt', step: 5 },
    oeltank_anzahl: { label: 'Anzahl Öltanks', step: 5 },
    oeltank_liter_aktuell: { label: 'Aktuelle Liter Öl', step: 5 },
    oeltank_transport_beschreibung: { label: 'Öltank-Transport beschreiben', step: 5 },
    heizkoerper_typ: { label: 'Heizkörper-Typ', step: 6 },
    hat_erdung: { label: 'Erdung vorhanden?', step: 7 },
    alternative_1_vorhanden: { label: '1. Alternative Aufstellort', step: 8 },
    alternative_2_vorhanden: { label: '2. Alternative Aufstellort', step: 8 },
    kunde_aufstellort_bestaetigt: { label: 'Kundenbestätigung Aufstellort', step: 8 },
    kunde_bestaetigung_vorname: { label: 'Vorname Kundenbestätigung', step: 8 },
    kunde_bestaetigung_nachname: { label: 'Nachname Kundenbestätigung', step: 8 },
    distanz_ausseneinheit_kernloch: { label: 'Distanz Außeneinheit → Kernloch', step: 8 },
    distanz_kernloch_innengeraet: { label: 'Distanz Kernloch → Innengerät', step: 8 },
    anzahl_durchbrueche_kernloch: { label: 'Anzahl Durchbrüche Kernloch', step: 8 },
    aufstellort_aenderung: { label: 'Aufstellort-Änderung?', step: 8 },
    distanz_alter_neuer_aufstellort: { label: 'Distanz alter ↔ neuer Aufstellort', step: 8 },
    anzahl_duschen: { label: 'Anzahl Duschen', step: 9 },
    hat_regendusche: { label: 'Regendusche?', step: 9 },
    anzahl_badewannen: { label: 'Anzahl Badewannen', step: 9 },
    check_raeume_gescannt: { label: 'Räume gescannt bestätigen', step: 10 },
    check_anzahl_raeume: { label: 'Anzahl Räume bestätigen', step: 10 },
    check_aufstellort_besprochen: { label: 'Aufstellort besprochen bestätigen', step: 10 },
    check_alle_bilder: { label: 'Alle Bilder bestätigen', step: 10 },
    check_heizkoerper_aufgenommen: { label: 'Heizkörper aufgenommen bestätigen', step: 10 },
    anzahl_unbegehbare_raeume: { label: 'Anzahl unbegehbare Räume', step: 11 },
    hat_pv_anlage: { label: 'PV-Anlage vorhanden?', step: 12 },
    agb_akzeptiert: { label: 'AGB akzeptieren', step: -1 },
  }), []);

  const resolveStep = (baseStep: number) =>
    baseStep === -1 ? steps.length - 1 : baseStep;

  const handleSaveDraft = async (silent = false) => {
    if (!auftragId || !userId) return;
    const values = form.getValues();
    await upsertMutation.mutateAsync({ thermocheckAuftragId: auftragId, formData: values, userId, silent });

    // Also save PV draft if active
    if (showPvSteps && votFormularId) {
      const pvValues = pvForm.getValues();
      await pvUpsertMutation.mutateAsync({ votFormularId, formData: pvValues, userId, silent });
    }
  };

  // Auto-save every 2 minutes
  useEffect(() => {
    if (isReadOnly || !auftragId || !userId) return;
    const interval = setInterval(() => {
      if (upsertMutation.isPending || pvUpsertMutation.isPending) return;
      handleSaveDraft(true);
    }, 120_000);
    return () => clearInterval(interval);
  }, [isReadOnly, auftragId, userId, showPvSteps, votFormularId]);

  const handleSubmit = async () => {
    if (!auftragId || !userId) return;
    const values = form.getValues();

    // Full zod validation against submit schema → actionable feedback
    const result = aufmassSubmitSchema.safeParse(values);
    if (!result.success) {
      // Group missing fields by step
      const missingByStep = new Map<number, { field: string; label: string }[]>();
      const unknownFields: string[] = [];

      for (const issue of result.error.issues) {
        const field = String(issue.path[0] ?? '');
        const meta = FIELD_META[field];
        if (!meta) {
          if (field) unknownFields.push(field);
          continue;
        }
        const step = resolveStep(meta.step);
        const list = missingByStep.get(step) ?? [];
        if (!list.find(e => e.field === field)) {
          list.push({ field, label: meta.label });
        }
        missingByStep.set(step, list);
      }

      // Save draft silently so progress isn't lost
      handleSaveDraft(true).catch(() => {});

      // Jump to first missing step
      const firstStep = [...missingByStep.keys()].sort((a, b) => a - b)[0];
      const totalMissing = [...missingByStep.values()].reduce((n, l) => n + l.length, 0) + unknownFields.length;

      // Build a compact summary (max 5 fields shown inline; rest condensed)
      const allLabels = [...missingByStep.values()].flat().map(f => f.label);
      const shown = allLabels.slice(0, 5).join(', ');
      const rest = allLabels.length > 5 ? ` … +${allLabels.length - 5} weitere` : '';

      toast.error(`Es fehlen noch ${totalMissing} Pflichtfeld${totalMissing === 1 ? '' : 'er'}`, {
        description: shown ? `${shown}${rest}` : undefined,
        duration: 10000,
        action: firstStep != null
          ? {
              label: `Zu Schritt ${firstStep + 1}`,
              onClick: () => setCurrentStep(firstStep),
            }
          : undefined,
      });

      // Auto-jump to first missing step for convenience
      if (firstStep != null) setCurrentStep(firstStep);
      return;
    }

    // Submit PV first if active
    if (showPvSteps && votFormularId) {
      const pvValues = pvForm.getValues();
      await pvUpsertMutation.mutateAsync({ votFormularId, formData: pvValues, userId, isSubmit: true });
    }

    await upsertMutation.mutateAsync({ thermocheckAuftragId: auftragId, formData: result.data as any, userId, isSubmit: true });
    navigate(-1);
  };

  if (auftragLoading || formularLoading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  const sharedProps = { bilder, votFormularId, leadName, leadId, auftragId: auftragId!, disabled: isReadOnly };
  const pvSharedProps = { pvForm, bilder, votFormularId, leadName, leadId, auftragId: auftragId!, disabled: isReadOnly };

  const renderStep = (index: number) => {
    // Base THC steps (0-12)
    switch (index) {
      case 0: return <TechnikerDatenSection form={form} {...sharedProps} />;
      case 1: return <KundendatenSection form={form} kundenName={kundenName} disabled={isReadOnly} />;
      case 2: return <PhotoOnlySection kategorie="treppenabgang" {...sharedProps} />;
      case 3: return <PhotoOnlySection kategorie="eingang_heizungsraum" {...sharedProps} />;
      case 4: return <HeizungsraumSection form={form} {...sharedProps} />;
      case 5: return <HeizungsartSection form={form} {...sharedProps} />;
      case 6: return <HeizkoerperSection form={form} {...sharedProps} />;
      case 7: return <ElektrikSection form={form} {...sharedProps} />;
      case 8: return <AufstellortSection form={form} {...sharedProps} />;
      case 9: return <SanitaerSection form={form} disabled={isReadOnly} />;
      case 10: return <ChecklisteSection form={form} {...sharedProps} />;
      case 11: return <UnbegehbareRaeumeSection form={form} {...sharedProps} />;
      case 12: return <PvAnlageSection form={form} {...sharedProps} />;
      default: break;
    }

    // If PV steps are active (indices 13-20, Abschluss at 21)
    if (showPvSteps) {
      switch (index) {
        case 13: return <PvAllgemeinSection pvForm={pvForm} disabled={isReadOnly} />;
        case 14: return <PvDachSection {...pvSharedProps} />;
        case 15: return <PvDachziegelSection {...pvSharedProps} />;
        case 16: return <PvGeruestSection {...pvSharedProps} />;
        case 17: return <PvDcKabelSection pvForm={pvForm} disabled={isReadOnly} />;
        case 18: return <PvUnterkonstruktionSection pvForm={pvForm} disabled={isReadOnly} />;
        case 19: return <PvBlitzschutzSection {...pvSharedProps} />;
        case 20: return <PvAbschlussSection {...pvSharedProps} />;
        case 21: return <AbschlussSection form={form} {...sharedProps} />;
        default: return null;
      }
    }

    // Without PV: index 13 = Abschluss
    if (index === 13) return <AbschlussSection form={form} {...sharedProps} />;
    return null;
  };

  const isSaving = upsertMutation.isPending || pvUpsertMutation.isPending;

  const handleBack = () => {
    const historyIndex = (window.history.state as any)?.idx ?? 0;
    if (historyIndex > 0) {
      navigate(-1);
      setTimeout(() => {
        if (window.location.pathname.startsWith('/thermocheck/aufmass/')) {
          navigate('/');
        }
      }, 250);
      return;
    }
    navigate('/');
  };

  return (
    <AufmassFormStepper
      steps={steps}
      renderStep={renderStep}
      onBack={handleBack}
      onSaveDraft={handleSaveDraft}
      onSubmit={handleSubmit}
      isSaving={isSaving}
      isSubmitting={isSaving}
      isReadOnly={isReadOnly}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
    >
      {[]}
    </AufmassFormStepper>
  );
}
