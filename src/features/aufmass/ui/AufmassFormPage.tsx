import { useEffect, useCallback, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import { AufmassDraftData } from '../data/aufmass-schema';
import { useVotFormular, useUpsertVotFormular } from '../hooks/useVotFormular';
import { useVotBilder } from '../hooks/useVotBilder';
import { AufmassFormStepper } from './AufmassFormStepper';
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
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function AufmassFormPage() {
  const { auftragId } = useParams<{ auftragId: string }>();
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;

  // Load auftrag data (for lead info + prefill)
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

  // Auto-create formular record if none exists (so upload buttons work immediately)
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

  const upsertMutation = useUpsertVotFormular();

  const form = useForm<AufmassDraftData>({
    defaultValues: {},
  });

  // Prefill form when data loads
  useEffect(() => {
    if (!formular) return;
    const f = formular as Record<string, any>;
    const values: Partial<AufmassDraftData> = {};
    for (const key of Object.keys(f)) {
      if (key in form.getValues() || form.getValues()[key as keyof AufmassDraftData] !== undefined) {
        (values as any)[key] = f[key];
      }
    }
    form.reset({ ...form.getValues(), ...values });
  }, [formular]);

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

  const handleSaveDraft = async () => {
    if (!auftragId || !userId) return;
    const values = form.getValues();
    await upsertMutation.mutateAsync({ thermocheckAuftragId: auftragId, formData: values, userId });
  };

  const handleSubmit = async () => {
    if (!auftragId || !userId) return;
    const values = form.getValues();
    if (!values.techniker_name || !values.thermocheck_datum || !values.agb_akzeptiert) {
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
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

  // Render only the active step — avoids mounting all 15 sections at once
  const renderStep = (index: number) => {
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
      case 14: return <AbschlussSection form={form} {...sharedProps} />;
      default: return null;
    }
  };

  return (
    <div>
      {/* Back button overlay */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 z-20 p-2 bg-primary-foreground/20 backdrop-blur-sm rounded-full hover:bg-primary-foreground/30 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-primary-foreground" />
      </button>

      <AufmassFormStepper
        renderStep={renderStep}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        isSaving={upsertMutation.isPending}
        isSubmitting={upsertMutation.isPending}
        isReadOnly={isReadOnly}
      >
        {[]}
      </AufmassFormStepper>
    </div>
  );
}
