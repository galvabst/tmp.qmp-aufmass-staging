import { Component, ReactNode, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AufmassDraftData, aufmassSubmitSchema } from '../data/aufmass-schema';
import { computeStepValidation } from '../data/aufmass-validation';
import { checkPlausibility } from '../data/aufmass-plausibility';
import { PlausibilityConfirmDialog, SoftFinding } from './PlausibilityConfirmDialog';
import { AutarcMappingPanel } from './AutarcMappingPanel';
import { PvAufmassDraftData } from '../data/pv-aufmass-schema';
import { AufmassFormStepper, StepConfig } from './AufmassFormStepper';
import { TechnikerDatenSection } from './sections/TechnikerDatenSection';
import { KundendatenSection } from './sections/KundendatenSection';
import { GebaeudedatenSection } from './sections/GebaeudedatenSection';
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
import { toast } from 'sonner';

/**
 * NUR FÜR LOKALE ENTWICKLUNG — Vorschau des Aufmaß-Stepper ohne Login/DB.
 *
 * Rendert die echten Sektions-Komponenten mit Dummy-Daten (leere Bilderliste,
 * kein votFormularId). Es wird nichts gespeichert; Foto-Uploads laufen ins
 * Leere. Der "Einreichen"-Button demonstriert nur das Pflichtfeld-Gate
 * (zod-Validierung) per Toast — ohne DB.
 *
 * Route in App.tsx ist hinter `import.meta.env.DEV` gegated → im Production-
 * Build (Lovable) NICHT erreichbar. Spiegelt die Schrittfolge aus
 * AufmassFormPage.tsx; bei Änderungen dort hier mitziehen.
 */

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

/** Fängt Sektionen ab, die echte Auftrags-/Foto-Daten brauchen. */
class SectionBoundary extends Component<{ children: ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() {
    return { err: true };
  }
  render() {
    if (this.state.err) {
      return (
        <div className="text-sm text-muted-foreground p-4 text-center">
          Diese Sektion benötigt echte Auftrags-/Foto-Daten und wird in der
          Vorschau übersprungen. Die Felder selbst siehst du im echten Termin.
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AufmassPreviewPage() {
  const navigate = useNavigate();
  const form = useForm<AufmassDraftData>({ defaultValues: {} });
  const pvForm = useForm<PvAufmassDraftData>({ defaultValues: {} });

  const hatPv = form.watch('hat_pv_anlage');
  const showPvSteps = hatPv === false;
  const steps = useMemo(
    () => (showPvSteps ? [...BASE_STEPS, ...PV_STEPS, ABSCHLUSS_STEP] : [...BASE_STEPS, ABSCHLUSS_STEP]),
    [showPvSteps],
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [showMapping, setShowMapping] = useState(false);
  const [softFindings, setSoftFindings] = useState<SoftFinding[] | null>(null);
  const [begruendungen, setBegruendungen] = useState<Record<string, string>>({});

  // Live-Validierung → Schritt-Status + "X Pflichtfelder offen"
  const values = form.watch();
  const resolveStep = (baseStep: number) => (baseStep === -1 ? steps.length - 1 : baseStep);
  const validation = computeStepValidation(values, steps.length, resolveStep);
  const livePlausi = checkPlausibility(values);

  const sharedProps = {
    bilder: [] as never[],
    votFormularId: undefined,
    leadName: 'Mustermann (Vorschau)',
    leadId: 'preview',
    auftragId: 'preview',
    disabled: false,
  };
  const pvSharedProps = { pvForm, ...sharedProps };

  const renderStep = (index: number): ReactNode => {
    switch (index) {
      case 0: return <TechnikerDatenSection form={form} {...sharedProps} />;
      case 1: return <KundendatenSection form={form} kundenName="Max Mustermann" disabled={false} />;
      case 2: return <GebaeudedatenSection form={form} disabled={false} />;
      case 3: return <PhotoOnlySection kategorie="treppenabgang" {...sharedProps} />;
      case 4: return <PhotoOnlySection kategorie="eingang_heizungsraum" {...sharedProps} />;
      case 5: return <HeizungsraumSection form={form} {...sharedProps} />;
      case 6: return <HeizungsartSection form={form} {...sharedProps} />;
      case 7: return <HeizkoerperSection form={form} {...sharedProps} />;
      case 8: return <ElektrikSection form={form} {...sharedProps} />;
      case 9: return <AufstellortSection form={form} {...sharedProps} />;
      case 10: return <SanitaerSection form={form} disabled={false} />;
      case 11: return <ChecklisteSection form={form} {...sharedProps} />;
      case 12: return <UnbegehbareRaeumeSection form={form} {...sharedProps} />;
      case 13: return <PvAnlageSection form={form} {...sharedProps} />;
      default: break;
    }

    if (showPvSteps) {
      switch (index) {
        case 14: return <PvAllgemeinSection pvForm={pvForm} disabled={false} />;
        case 15: return <PvDachSection {...pvSharedProps} />;
        case 16: return <PvDachziegelSection {...pvSharedProps} />;
        case 17: return <PvGeruestSection {...pvSharedProps} />;
        case 18: return <PvDcKabelSection pvForm={pvForm} disabled={false} />;
        case 19: return <PvUnterkonstruktionSection pvForm={pvForm} disabled={false} />;
        case 20: return <PvBlitzschutzSection {...pvSharedProps} />;
        case 21: return <PvAbschlussSection {...pvSharedProps} />;
        case 22: return <AbschlussSection form={form} {...sharedProps} />;
        default: return null;
      }
    }

    if (index === 14) return <AbschlussSection form={form} {...sharedProps} />;
    return null;
  };

  // Demonstriert nur das Pflichtfeld-Gate — speichert nichts.
  const handlePreviewSubmit = () => {
    const vals = form.getValues();
    const result = aufmassSubmitSchema.safeParse(vals);
    if (!result.success) {
      const fields = new Set(result.error.issues.map(i => String(i.path[0] ?? '')));
      toast.error(`Gate: es fehlen noch ${fields.size} Pflichtfeld${fields.size === 1 ? '' : 'er'}`, {
        description: 'Im echten Termin springt das Formular zum ersten fehlenden Feld. (Vorschau — nichts gespeichert.)',
        duration: 8000,
      });
      return;
    }
    // Plausibilität (deterministisch). KI-Gesamtcheck läuft nur in der echten App.
    const plausi = checkPlausibility(vals);
    const blocks = plausi.filter(i => i.severity === 'block');
    if (blocks.length > 0) {
      toast.error('Angabe nicht möglich', { description: blocks.map(b => b.message).join(' '), duration: 8000 });
      return;
    }
    const softs: SoftFinding[] = plausi.filter(i => i.severity === 'soft').map(i => ({ ruleId: i.ruleId, field: i.field, message: i.message }));
    if (softs.length > 0) {
      setBegruendungen({});
      setSoftFindings(softs);
      return;
    }
    toast.success('Gate offen + plausibel. (Vorschau — nichts gespeichert.)');
  };

  return (
    <>
      <div className="bg-amber-500 text-black text-xs font-semibold py-1.5 px-3 flex items-center justify-between gap-2">
        <span className="truncate">DEV-VORSCHAU · nichts wird gespeichert · Fotos ohne Funktion</span>
        <button
          type="button"
          onClick={() => setShowMapping(true)}
          className="shrink-0 bg-black/15 hover:bg-black/25 active:bg-black/30 rounded px-2 py-0.5 transition-colors"
        >
          Nach autarc ↗
        </button>
      </div>
      <AufmassFormStepper
        steps={steps}
        renderStep={(i) => <SectionBoundary key={i}>{renderStep(i)}</SectionBoundary>}
        onBack={() => navigate('/')}
        onSaveDraft={() => toast('Vorschau: Speichern ist deaktiviert')}
        onSubmit={handlePreviewSubmit}
        isSaving={false}
        isSubmitting={false}
        isReadOnly={false}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        stepHasError={validation.stepHasError}
        openCount={validation.totalMissing}
        onJumpToFirstError={() => validation.firstErrorStep != null && setCurrentStep(validation.firstErrorStep)}
        liveWarnings={livePlausi}
      >
        {[]}
      </AufmassFormStepper>
      {showMapping && <AutarcMappingPanel values={values} onClose={() => setShowMapping(false)} />}
      {softFindings && (
        <PlausibilityConfirmDialog
          findings={softFindings}
          aiHinweise={[]}
          begruendungen={begruendungen}
          onChange={(ruleId, text) => setBegruendungen((p) => ({ ...p, [ruleId]: text }))}
          onKorrigieren={() => setSoftFindings(null)}
          onSubmit={() => { setSoftFindings(null); toast.success('Begründet & abgesendet. (Vorschau — nichts gespeichert.)'); }}
          onCancel={() => setSoftFindings(null)}
        />
      )}
    </>
  );
}
