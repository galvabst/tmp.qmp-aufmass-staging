import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AufmassDraftData } from '../data/aufmass-schema';
import { computeStepValidation } from '../data/aufmass-validation';
import { checkPlausibility } from '../data/aufmass-plausibility';
import { AutarcAbweichungenBanner } from './components/AutarcAbweichungenBanner';
import { PlausibilityConfirmDialog } from './PlausibilityConfirmDialog';
import { PvAufmassDraftData } from '../data/pv-aufmass-schema';
import { useGeoStandort } from '../hooks/useGeoStandort';
import { useAufmassFormData } from '../hooks/useAufmassFormData';
import { useAufmassSubmit } from '../hooks/useAufmassSubmit';
import { getFotoStatus, resetFotoPruefung, subscribeFotoPruefung, getFotoPruefVersion } from '../state/foto-pruefung-store';
import { pruefeFotoPraesenz, type FotoPraesenzContext } from '../data/foto-praesenz';
import { bewerteFotoInhalt } from '../data/foto-inhalt-gate';
import { AufmassFormStepper, StepConfig } from './AufmassFormStepper';
import { GeoStatusCard } from './components/GeoStatusCard';
import { TechnikerDatenSection } from './sections/TechnikerDatenSection';
import { KundendatenSection } from './sections/KundendatenSection';
import { GebaeudedatenSection } from './sections/GebaeudedatenSection';
import { UWerteSection } from './sections/UWerteSection';
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
import { Skeleton } from '@/components/ui/skeleton';

const BASE_STEPS: StepConfig[] = [
  { title: 'Techniker-Daten', icon: '👤' },
  { title: 'Kundendaten', icon: '🏠' },
  { title: 'Gebäudedaten', icon: '🏘️' },
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

  // KI-Foto-Verdicts beim Formularwechsel leeren (kein Übertrag zwischen Aufträgen).
  useEffect(() => {
    resetFotoPruefung();
    return () => resetFotoPruefung();
  }, [auftragId]);

  // Re-render, sobald ein KI-Foto-Verdict eintrifft (passt_nicht/ungeprueft/ok).
  // Ohne diese Subscription bliebe der Stepper-Status (stepHasError) und der
  // „X Pflichtfelder offen"-Zähler nach einem KI-Verdict stehen.
  useSyncExternalStore(subscribeFotoPruefung, getFotoPruefVersion);

  // Forms
  const form = useForm<AufmassDraftData>({ defaultValues: {} });
  const pvForm = useForm<PvAufmassDraftData>({ defaultValues: {} });

  // Daten laden + Prefill (eigener Hook)
  const data = useAufmassFormData(auftragId, userId, session, form, pvForm);
  const { bilder, votFormularId, isReadOnly, leadName, leadId, kundenName } = data;

  // Geo-Check-in: einmal beim Start Geräte-GPS holen + gegen Kundenadresse abgleichen.
  const geo = useGeoStandort(
    votFormularId,
    { strasse: data.auftrag?.kunde_strasse ?? undefined, plz: data.auftrag?.kunde_plz ?? undefined, ort: data.auftrag?.kunde_ort ?? undefined },
    !isReadOnly,
  );

  // Watch hat_pv_anlage for dynamic steps.
  // ACHTUNG — bewusste Inversion: hat_pv_anlage === false heißt KEINE bestehende
  // PV-Anlage → PV-NEUINSTALLATIONS-Aufmaß (PV-Schritte einblenden). === true → keine.
  const hatPv = form.watch('hat_pv_anlage');
  const showPvSteps = hatPv === false;
  const steps = useMemo(() => {
    return showPvSteps
      ? [...BASE_STEPS, ...PV_STEPS, ABSCHLUSS_STEP]
      : [...BASE_STEPS, ABSCHLUSS_STEP];
  }, [showPvSteps]);

  // Controlled stepper state — needed so handleSubmit can jump to missing fields
  const [currentStep, setCurrentStep] = useState(0);
  const resolveStep = (baseStep: number) => (baseStep === -1 ? steps.length - 1 : baseStep);

  // Submit-Orchestrierung (eigener Hook)
  const submit = useAufmassSubmit({
    auftragId, userId, form, pvForm, bilder, votFormularId, leadName,
    isReadOnly, showPvSteps, steps, resolveStep, setCurrentStep,
  });

  // Live-Validierung → Schritt-Status + "X Pflichtfelder offen"-Leiste.
  const liveValues = form.watch();
  const liveValidation = computeStepValidation(liveValues, steps.length, resolveStep);
  // Live-Plausibilität (deterministisch, gratis) → KI-Assistent „Prüfung". Beratend.
  const livePlausi = checkPlausibility(liveValues);

  // watch() (nicht getValues()) → PV-bedingte Foto-Pflichten aktualisieren den
  // Live-Stepper-Status sofort statt erst beim nächsten Render.
  const pvLiveValues = pvForm.watch();
  const fotoCtxLive: FotoPraesenzContext = {
    istPvAufmass: showPvSteps,
    istOel: liveValues.heizungsart === 'oel',
    mehrBilderHeizungsraum: liveValues.mehr_bilder_heizungsraum === true,
    hatErdung: liveValues.hat_erdung === true,
    alternative1Vorhanden: liveValues.alternative_1_vorhanden === true,
    alternative2Vorhanden: liveValues.alternative_2_vorhanden === true,
    hatUnbegehbareRaeume: (liveValues.anzahl_unbegehbare_raeume ?? 0) > 0,
    hatPvAnlage: liveValues.hat_pv_anlage === true,
    pvHindernisseVorhanden: pvLiveValues.hindernisse_vorhanden === true,
    pvOeffentlicheFlaeche: pvLiveValues.oeffentliche_flaeche === true,
    pvBlitzschutzVorhanden: pvLiveValues.blitzschutz_vorhanden === true,
    fensterGetauscht: liveValues.u_werte?.fenster?.getauscht === true,
  };
  const fehlendeFotosLive = pruefeFotoPraesenz(bilder, fotoCtxLive);
  // KI-Inhalts-Status live: jedes sichtbare Pflichtfoto, das NICHT positiv „ok" ist
  // (passt_nicht / ungeprueft), ist ein offener Blocker — exakt das fail-closed
  // Submit-Gate (bewerteFotoInhalt), nur ohne neue KI-Calls (liest nur den Store).
  const fotoInhaltLive = bewerteFotoInhalt(bilder, fotoCtxLive, (id) => getFotoStatus(id)?.status);
  const fotoInhaltOffen = fotoInhaltLive.falsch.length + fotoInhaltLive.ungeprueft.length;
  // Haftungs-Checkbox bewusst NICHT im zod-Schema als Pflicht → hier additiv in den
  // Live-Status einspeisen, damit die Bottom-Bar nicht fälschlich „vollständig" zeigt.
  const haftungFehltLive = liveValues.u_werte_haftung_bestaetigt !== true;
  const stepHasError = useMemo(() => {
    const merged = [...liveValidation.stepHasError];
    const markStep = (baseStep: number) => {
      const step = resolveStep(baseStep);
      if (step >= 0 && step < merged.length) merged[step] = true;
    };
    for (const f of fehlendeFotosLive) markStep(f.step);
    for (const f of fotoInhaltLive.falsch) markStep(f.step);
    for (const f of fotoInhaltLive.ungeprueft) markStep(f.step);
    if (haftungFehltLive) markStep(2);
    return merged;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveValidation.stepHasError, fehlendeFotosLive, fotoInhaltLive, haftungFehltLive, steps.length]);

  if (data.isLoading) {
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
      case 2: return (
        <div className="space-y-6">
          {/* Sprung-Anker: U-Werte/Gebäudehülle stehen weit unten in diesem Schritt;
              auf Mobil sonst nur per langem Scrollen erreichbar (Critic-Finding). */}
          <a
            href="#u-werte-gebaeudehuelle"
            className="block rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
          >
            ↓ Direkt zur Gebäudehüllen-Erfassung (U-Werte)
          </a>
          <GebaeudedatenSection form={form} disabled={isReadOnly} />
          <div id="u-werte-gebaeudehuelle" className="scroll-mt-20">
            <UWerteSection form={form} {...sharedProps} />
          </div>
        </div>
      );
      case 3: return <PhotoOnlySection kategorie="treppenabgang" {...sharedProps} />;
      case 4: return <PhotoOnlySection kategorie="eingang_heizungsraum" {...sharedProps} />;
      case 5: return <HeizungsraumSection form={form} {...sharedProps} />;
      case 6: return <HeizungsartSection form={form} {...sharedProps} />;
      case 7: return <HeizkoerperSection form={form} {...sharedProps} />;
      case 8: return <ElektrikSection form={form} {...sharedProps} />;
      case 9: return <AufstellortSection form={form} {...sharedProps} />;
      case 10: return <SanitaerSection form={form} disabled={isReadOnly} />;
      case 11: return <ChecklisteSection form={form} {...sharedProps} />;
      case 12: return <UnbegehbareRaeumeSection form={form} {...sharedProps} />;
      case 13: return <PvAnlageSection form={form} {...sharedProps} />;
      default: break;
    }

    // If PV steps are active (indices 14-21, Abschluss at 22)
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

  const handleBack = () => {
    const historyIndex = (window.history.state as { idx?: number } | null)?.idx ?? 0;
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
    <>
      <AufmassFormStepper
        steps={steps}
        renderStep={renderStep}
        onBack={handleBack}
        onSaveDraft={submit.handleSaveDraft}
        onSubmit={submit.handleSubmit}
        isSaving={submit.isSaving}
        isSubmitting={submit.isSaving || submit.submitting}
        isReadOnly={isReadOnly}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        stepHasError={stepHasError}
        openCount={
          liveValidation.totalMissing +
          // Tatsächlich fehlende EINZEL-Fotos, nicht nur Kategorien.
          fehlendeFotosLive.reduce((n, f) => n + (f.minAnzahl - f.vorhanden), 0) +
          // KI-abgelehnte/ungeprüfte Pflichtfotos als offene Pflichten mitzählen.
          fotoInhaltOffen +
          // Fehlende Hülle-Bestätigung als eine offene Pflicht mitzählen.
          (haftungFehltLive ? 1 : 0)
        }
        onJumpToFirstError={() => {
          const fotoStep = fehlendeFotosLive.length ? resolveStep(fehlendeFotosLive[0].step) : null;
          // KI-abgelehnte/ungeprüfte Pflichtfotos als Sprungziel (nach Präsenz, vor Haftung).
          const fotoInhaltStep =
            fotoInhaltLive.falsch.length ? resolveStep(fotoInhaltLive.falsch[0].step)
            : fotoInhaltLive.ungeprueft.length ? resolveStep(fotoInhaltLive.ungeprueft[0].step)
            : null;
          // Ist die Hülle-Bestätigung der EINZIGE offene Blocker → gezielt auf Schritt 2.
          const haftungStep =
            haftungFehltLive && liveValidation.firstErrorStep == null && fotoStep == null && fotoInhaltStep == null
              ? resolveStep(2)
              : null;
          const target = liveValidation.firstErrorStep ?? fotoStep ?? fotoInhaltStep ?? haftungStep;
          if (target != null) {
            setCurrentStep(target);
            if (haftungStep != null) {
              // Anker steht weit unten im Gebäudedaten-Schritt → nach dem Render dorthin scrollen.
              requestAnimationFrame(() => document.getElementById('u-werte-gebaeudehuelle')?.scrollIntoView({ behavior: 'smooth' }));
            }
          }
        }}
        liveWarnings={livePlausi}
        topBanner={
          <>
            <GeoStatusCard geo={geo} />
            <AutarcAbweichungenBanner
              result={submit.autarcResult}
              onClose={submit.clearAutarcResult}
            />
          </>
        }
      >
        {[]}
      </AufmassFormStepper>
      {submit.softDialog && (
        <PlausibilityConfirmDialog
          findings={submit.softDialog.findings}
          aiHinweise={submit.softDialog.aiHinweise}
          aiLoading={submit.aiLoading}
          begruendungen={submit.begruendungen}
          onChange={submit.setBegruendung}
          onKorrigieren={submit.handleKorrigieren}
          onSubmit={submit.handleSoftConfirm}
          onCancel={submit.cancelSoftDialog}
          isSubmitting={submit.submitting || submit.isSaving}
        />
      )}
    </>
  );
}
