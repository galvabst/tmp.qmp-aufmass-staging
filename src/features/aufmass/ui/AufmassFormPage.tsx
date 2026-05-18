import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AufmassDraftData } from '../data/aufmass-schema';
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

  // Prefill THC form when data loads
  useEffect(() => {
    if (!formular) return;
    const f = formular as Record<string, any>;
    form.reset({ ...form.getValues(), ...f });
  }, [formular]);

  // Prefill PV form when data loads
  useEffect(() => {
    if (!pvFormular) return;
    const f = pvFormular as Record<string, any>;
    pvForm.reset({ ...pvForm.getValues(), ...f });
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
    if (!values.techniker_name || !values.thermocheck_datum || !values.agb_akzeptiert) {
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    // Submit PV first if active
    if (showPvSteps && votFormularId) {
      const pvValues = pvForm.getValues();
      await pvUpsertMutation.mutateAsync({ votFormularId, formData: pvValues, userId, isSubmit: true });
    }

    await upsertMutation.mutateAsync({ thermocheckAuftragId: auftragId, formData: values, userId, isSubmit: true });
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
    // Base THC steps (0-13)
    switch (index) {
      case 0: return <TechnikerDatenSection form={form} {...sharedProps} />;
      case 1: return <KundendatenSection form={form} kundenName={kundenName} disabled={isReadOnly} />;
      case 2: return <PhotoOnlySection kategorie="treppenabgang" {...sharedProps} />;
      case 3: return <PhotoOnlySection kategorie="eingang_heizungsraum" {...sharedProps} />;
      case 4: return <HeizungsraumSection form={form} {...sharedProps} />;
      case 5: return <HeizungsartSection form={form} {...sharedProps} />;
      case 6: return <PhotoOnlySection kategorie="heizungsanlage" {...sharedProps} />;
      case 7: return <HeizkoerperSection form={form} {...sharedProps} />;
      case 8: return <ElektrikSection form={form} {...sharedProps} />;
      case 9: return <AufstellortSection form={form} {...sharedProps} />;
      case 10: return <SanitaerSection form={form} disabled={isReadOnly} />;
      case 11: return <ChecklisteSection form={form} {...sharedProps} />;
      case 12: return <UnbegehbareRaeumeSection form={form} {...sharedProps} />;
      case 13: return <PvAnlageSection form={form} {...sharedProps} />;
      default: break;
    }

    // If PV steps are active (indices 14-21)
    if (showPvSteps) {
      switch (index) {
        case 14: return <PvAllgemeinSection pvForm={pvForm} disabled={isReadOnly} />;
        case 15: return <PvDachSection {...pvSharedProps} />;
        case 16: return <PvDachziegelSection {...pvSharedProps} />;
        case 17: return <PvGeruestSection {...pvSharedProps} />;
        case 18: return <PvDcKabelSection pvForm={pvForm} disabled={isReadOnly} />;
        case 19: return <PvUnterkonstruktionSection pvForm={pvForm} disabled={isReadOnly} />;
        case 20: return <PvBlitzschutzSection {...pvSharedProps} />;
        case 21: return <PvAbschlussSection {...pvSharedProps} />;
        case 22: return <AbschlussSection form={form} {...sharedProps} />;
        default: return null;
      }
    }

    // Without PV: index 14 = Abschluss
    if (index === 14) return <AbschlussSection form={form} {...sharedProps} />;
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
    >
      {[]}
    </AufmassFormStepper>
  );
}
