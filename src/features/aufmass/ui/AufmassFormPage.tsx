import { useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
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
      const { data, error } = await supabase
        .from('v_thermocheck_auftraege' as any)
        .select('*')
        .eq('id', auftragId!)
        .single()
        .setHeader('Accept-Profile', 'thermocheck');
      if (error) throw error;
      return data as Record<string, any>;
    },
  });

  // Load existing formular
  const { data: formular, isLoading: formularLoading } = useVotFormular(auftragId);
  const votFormularId = (formular as any)?.id as string | undefined;

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
    const fields = Object.keys(form.getValues()) as (keyof AufmassDraftData)[];
    // Load all existing values
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
    if (!form.getValues('techniker_name') && meta?.full_name) {
      form.setValue('techniker_name', meta.full_name);
    }
    if (!form.getValues('techniker_telefon') && meta?.phone) {
      form.setValue('techniker_telefon', meta.phone);
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
    // Basic validation
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
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const sharedProps = { bilder, votFormularId, leadName, leadId, auftragId: auftragId!, disabled: isReadOnly };

  return (
    <div>
      {/* Back button overlay */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 z-20 p-2 bg-primary-foreground/20 rounded-full"
      >
        <ArrowLeft className="w-5 h-5 text-primary-foreground" />
      </button>

      <AufmassFormStepper
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        isSaving={upsertMutation.isPending}
        isSubmitting={upsertMutation.isPending}
        isReadOnly={isReadOnly}
      >
        {/* 1 */ }
        <TechnikerDatenSection form={form} {...sharedProps} />
        {/* 2 */}
        <KundendatenSection form={form} kundenName={kundenName} disabled={isReadOnly} />
        {/* 3 */}
        <PhotoOnlySection kategorie="treppenabgang" {...sharedProps} />
        {/* 4 */}
        <PhotoOnlySection kategorie="eingang_heizungsraum" {...sharedProps} />
        {/* 5 */}
        <HeizungsraumSection form={form} {...sharedProps} />
        {/* 6 */}
        <HeizungsartSection form={form} {...sharedProps} />
        {/* 7 */}
        <PhotoOnlySection kategorie="heizungsanlage" {...sharedProps} />
        {/* 8 */}
        <HeizkoerperSection form={form} {...sharedProps} />
        {/* 9 */}
        <ElektrikSection form={form} {...sharedProps} />
        {/* 10 */}
        <AufstellortSection form={form} {...sharedProps} />
        {/* 11 */}
        <SanitaerSection form={form} disabled={isReadOnly} />
        {/* 12 */}
        <ChecklisteSection form={form} {...sharedProps} />
        {/* 13 */}
        <UnbegehbareRaeumeSection form={form} {...sharedProps} />
        {/* 14 */}
        <PvAnlageSection form={form} {...sharedProps} />
        {/* 15 */}
        <AbschlussSection form={form} {...sharedProps} />
      </AufmassFormStepper>
    </div>
  );
}
