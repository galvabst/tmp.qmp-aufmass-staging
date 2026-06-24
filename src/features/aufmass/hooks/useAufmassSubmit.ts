// Submit-Orchestrierung der Aufmaß-Formularseite — herausgeschnitten aus
// AufmassFormPage (Verantwortung: Entwurf speichern, Auto-Save, Submit-Pipeline
// Validierung → Foto-Präsenz → Foto-Inhalt → U-Werte → Plausi → PV → autarc-Verify).
// Verhalten 1:1 wie zuvor inline; Render + Stepper bleiben in der Komponente.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AufmassDraftData, AufmassSubmitData, aufmassSubmitSchema } from '../data/aufmass-schema';
import type { PvAufmassDraftData } from '../data/pv-aufmass-schema';
import { computeStepValidation, FIELD_META } from '../data/aufmass-validation';
import { checkPlausibility } from '../data/aufmass-plausibility';
import { checkUWertePlausibilitaet, pruefeUWerteVollstaendigkeit } from '../data/u-werte-plausibility';
import { checkPvPlausibility } from '../data/aufmass-pv-plausibility';
import { runAiPlausibility } from '../data/ai-plausibility-client';
import { runAutarcVerify } from '../data/autarc-verify-client';
import type { GateResult } from '../data/autarc-gate';
import { showAutarcResult } from '../data/autarc-result-toast';
import { SoftFinding } from '../ui/PlausibilityConfirmDialog';
import { useUpsertVotFormular, PlausiBegruendung } from './useVotFormular';
import { useUpsertPvFormular } from './usePvFormular';
import type { VotBild } from './useVotBilder';
import { getFotoStatus } from '../state/foto-pruefung-store';
import { pruefeFotoPraesenz, type FotoPraesenzContext } from '../data/foto-praesenz';
import { stelleFotoInhaltSicher } from '../data/foto-inhalt-pruefung';
import { bewerteFotoInhalt } from '../data/foto-inhalt-gate';

interface UseAufmassSubmitArgs {
  auftragId: string | undefined;
  userId: string | undefined;
  form: UseFormReturn<AufmassDraftData>;
  pvForm: UseFormReturn<PvAufmassDraftData>;
  bilder: VotBild[];
  votFormularId?: string;
  leadName: string;
  isReadOnly: boolean;
  showPvSteps: boolean;
  steps: { title: string; icon: string }[];
  resolveStep: (baseStep: number) => number;
  setCurrentStep: (step: number) => void;
}

export interface UseAufmassSubmitResult {
  handleSaveDraft: (silent?: boolean) => Promise<void>;
  handleSubmit: () => Promise<void>;
  isSaving: boolean;
  submitting: boolean;
  softDialog: { findings: SoftFinding[]; aiHinweise: string[]; data: AufmassSubmitData } | null;
  begruendungen: Record<string, string>;
  setBegruendung: (ruleId: string, text: string) => void;
  aiLoading: boolean;
  autarcResult: GateResult | null;
  clearAutarcResult: () => void;
  handleKorrigieren: (field: string) => void;
  handleSoftConfirm: () => void;
  cancelSoftDialog: () => void;
}

export function useAufmassSubmit({
  auftragId, userId, form, pvForm, bilder, votFormularId, leadName,
  isReadOnly, showPvSteps, steps, resolveStep, setCurrentStep,
}: UseAufmassSubmitArgs): UseAufmassSubmitResult {
  const navigate = useNavigate();
  const upsertMutation = useUpsertVotFormular();
  const pvUpsertMutation = useUpsertPvFormular();

  const [softDialog, setSoftDialog] = useState<{ findings: SoftFinding[]; aiHinweise: string[]; data: AufmassSubmitData } | null>(null);
  const [begruendungen, setBegruendungen] = useState<Record<string, string>>({});
  const [autarcResult, setAutarcResult] = useState<GateResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Ref (immer aktuell) → verhindert Doppel-Submit auch zwischen Renders.
  const submittingRef = useRef(false);
  // Ref: läuft die (asynchrone) KI-Foto-Inhaltsprüfung am Submit → keine
  // erneute handleSubmit-Auslösung (Doppelklick würde sonst doppelt prüfen).
  const fotoPruefRef = useRef(false);
  // Ref (immer aktuell): pausiert Autosave, solange der Soft-Dialog offen ist.
  const softDialogOpenRef = useRef(false);
  useEffect(() => { softDialogOpenRef.current = !!softDialog; }, [softDialog]);

  const handleSaveDraft = useCallback(async (silent = false) => {
    if (!auftragId || !userId) return;
    const values = form.getValues();
    await upsertMutation.mutateAsync({ thermocheckAuftragId: auftragId, formData: values, userId, silent });
    if (showPvSteps && votFormularId) {
      const pvValues = pvForm.getValues();
      await pvUpsertMutation.mutateAsync({ votFormularId, formData: pvValues, userId, silent });
    }
  }, [auftragId, userId, form, upsertMutation, showPvSteps, votFormularId, pvForm, pvUpsertMutation]);

  // Auto-save every 2 minutes
  useEffect(() => {
    if (isReadOnly || !auftragId || !userId) return;
    const interval = setInterval(() => {
      if (upsertMutation.isPending || pvUpsertMutation.isPending || submittingRef.current || softDialogOpenRef.current) return;
      handleSaveDraft(true);
    }, 120_000);
    return () => clearInterval(interval);
  }, [isReadOnly, auftragId, userId, upsertMutation, pvUpsertMutation, handleSaveDraft]);

  const doSubmit = useCallback(async (validData: AufmassSubmitData, plausiBegruendungen: PlausiBegruendung[]) => {
    if (!auftragId || !userId || submittingRef.current || upsertMutation.isPending || pvUpsertMutation.isPending) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      // Submit PV first if active. An den tatsächlich abgesendeten Wert koppeln.
      if (validData.hat_pv_anlage === false && votFormularId) {
        const pvValues = pvForm.getValues();
        await pvUpsertMutation.mutateAsync({ votFormularId, formData: pvValues, userId, isSubmit: true });
      }
      const row = await upsertMutation.mutateAsync({ thermocheckAuftragId: auftragId, formData: validData as unknown as AufmassDraftData, userId, isSubmit: true, plausiBegruendungen });
      setSoftDialog(null);

      // T4 autarc-Gate: Gebäudedaten an autarc übergeben + verifizieren. Offline-sicher.
      // SSoT = DB-Spalte autarc_sync_status, NICHT dieser Toast. runAutarcVerify wirft nie.
      const formularId = (row as { id?: string } | null)?.id ?? votFormularId ?? undefined;
      let verify: GateResult | null = null;
      if (formularId) {
        verify = await runAutarcVerify({
          votFormularId: formularId,
          values: validData as unknown as Partial<AufmassDraftData>,
          customerName: leadName ?? null,
        });
        showAutarcResult(verify);
        setAutarcResult(verify);
      }

      // Bei autarc-Abweichung NICHT sofort wegnavigieren: Techniker soll den Diff sehen.
      if (verify?.status !== 'abweichung') navigate(-1);
      return verify;
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [auftragId, userId, upsertMutation, pvUpsertMutation, votFormularId, pvForm, leadName, navigate]);

  const handleKorrigieren = useCallback((field: string) => {
    setSoftDialog(null);
    setCurrentStep(resolveStep(FIELD_META[field]?.step ?? 0));
  }, [setCurrentStep, resolveStep]);

  const handleSoftConfirm = useCallback(() => {
    if (!softDialog) return;
    const now = new Date().toISOString();
    const arr: PlausiBegruendung[] = softDialog.findings.map((f) => ({
      field: f.field, message: f.message, begruendung: (begruendungen[f.ruleId] ?? '').trim(), erfasst_am: now,
    }));
    doSubmit(softDialog.data, arr).catch(() => {});
  }, [softDialog, begruendungen, doSubmit]);

  const handleSubmit = useCallback(async () => {
    if (!auftragId || !userId || submittingRef.current || fotoPruefRef.current) return;
    const values = form.getValues();

    // Full zod validation against submit schema → actionable feedback
    const result = aufmassSubmitSchema.safeParse(values);
    if (!result.success) {
      const v = computeStepValidation(values, steps.length, resolveStep);
      handleSaveDraft(true).catch(() => {});
      const allLabels = [...v.missingByStep.values()].flat().map(f => f.label);
      const shown = allLabels.slice(0, 5).join(', ');
      const rest = allLabels.length > 5 ? ` … +${allLabels.length - 5} weitere` : '';
      toast.error(`Es fehlen noch ${v.totalMissing} Pflichtfeld${v.totalMissing === 1 ? '' : 'er'}`, {
        description: shown ? `${shown}${rest}` : undefined,
        duration: 10000,
        action: v.firstErrorStep != null
          ? { label: `Zu Schritt ${v.firstErrorStep + 1}`, onClick: () => setCurrentStep(v.firstErrorStep!) }
          : undefined,
      });
      if (v.firstErrorStep != null) setCurrentStep(v.firstErrorStep);
      return;
    }

    const pvSubmitValues = pvForm.getValues();
    const fotoCtx: FotoPraesenzContext = {
      istPvAufmass: showPvSteps,
      istOel: values.heizungsart === 'oel',
      mehrBilderHeizungsraum: values.mehr_bilder_heizungsraum === true,
      hatErdung: values.hat_erdung === true,
      alternative1Vorhanden: values.alternative_1_vorhanden === true,
      alternative2Vorhanden: values.alternative_2_vorhanden === true,
      hatUnbegehbareRaeume: (values.anzahl_unbegehbare_raeume ?? 0) > 0,
      hatPvAnlage: values.hat_pv_anlage === true,
      pvHindernisseVorhanden: pvSubmitValues.hindernisse_vorhanden === true,
      pvOeffentlicheFlaeche: pvSubmitValues.oeffentliche_flaeche === true,
      pvBlitzschutzVorhanden: pvSubmitValues.blitzschutz_vorhanden === true,
      fensterGetauscht: values.u_werte?.fenster?.getauscht === true,
    };

    // Foto-Präsenz: jede Pflicht-Kategorie braucht ihre Mindestanzahl an Fotos.
    const fehlendeFotos = pruefeFotoPraesenz(bilder, fotoCtx);
    if (fehlendeFotos.length > 0) {
      handleSaveDraft(true).catch(() => {});
      const labels = fehlendeFotos.map((f) => `${f.label} (${f.vorhanden}/${f.minAnzahl})`);
      const shown = labels.slice(0, 5).join(', ');
      const rest = labels.length > 5 ? ` … +${labels.length - 5} weitere` : '';
      const firstStep = resolveStep(fehlendeFotos[0].step);
      toast.error(`Es fehlen Pflichtfotos (${fehlendeFotos.length} Kategorie${fehlendeFotos.length === 1 ? '' : 'n'})`, {
        description: `Bitte direkt vor Ort aufnehmen: ${shown}${rest}.`,
        duration: 12000,
        action: { label: `Zu Schritt ${firstStep + 1}`, onClick: () => setCurrentStep(firstStep) },
      });
      setCurrentStep(firstStep);
      return;
    }

    // KI-Foto-INHALT (fail-closed): jedes sichtbare Pflichtfoto muss positiv bestätigt sein.
    const pruefToast = toast.loading('Fotos werden geprüft …');
    fotoPruefRef.current = true;
    try {
      await stelleFotoInhaltSicher(bilder, fotoCtx);
    } catch (e: unknown) {
      // Fail-closed: lässt sich die Prüfung nicht durchführen, wird NICHT eingereicht.
      if (import.meta.env.DEV) {
        const grund = e instanceof Error ? e.message : 'Unbekannter Fehler';
        console.error('Foto-Inhaltsprüfung fehlgeschlagen:', grund);
      }
      toast.error('Fotoprüfung fehlgeschlagen', { description: 'Bitte erneut absenden.', duration: 8000 });
      return;
    } finally {
      fotoPruefRef.current = false;
      toast.dismiss(pruefToast);
    }
    const inhalt = bewerteFotoInhalt(bilder, fotoCtx, (id) => getFotoStatus(id)?.status);
    if (inhalt.falsch.length > 0) {
      const versteckteKats = [...new Set(inhalt.falsch.filter((f) => f.versteckt).map((f) => f.label))];
      const firstStep = resolveStep(inhalt.falsch[0].step);
      const gruende = [...new Set(inhalt.falsch.map((f) => {
        const grund = getFotoStatus(f.bildId)?.begruendung;
        return grund ? `${f.label}: ${grund}` : f.label;
      }))];
      const verstecktHinweis =
        versteckteKats.length > 0
          ? ` Foto „${versteckteKats.join('", „')}" gehört zu einem ausgeblendeten Schritt: ` +
            'zugehörige Option wieder aktivieren ODER das Foto dort löschen.'
          : '';
      toast.error('Foto wird nicht akzeptiert', {
        description:
          `${gruende.slice(0, 3).join(' · ')}${gruende.length > 3 ? ` … +${gruende.length - 3} weitere` : ''}. ` +
          'Bitte das/die Foto(s) löschen und korrekt neu aufnehmen.' +
          verstecktHinweis,
        duration: 14000,
        action: { label: `Zu Schritt ${firstStep + 1}`, onClick: () => setCurrentStep(firstStep) },
      });
      setCurrentStep(firstStep);
      return;
    }
    if (inhalt.ungeprueft.length > 0) {
      const labels = [...new Set(inhalt.ungeprueft.map((f) => f.label))];
      const firstStep = resolveStep(inhalt.ungeprueft[0].step);
      toast.error('Fotos konnten nicht geprüft werden', {
        description: `Die KI-Prüfung ist nicht erreichbar. Bitte erneut absenden oder den Innendienst kontaktieren: ${labels.join(', ')}.`,
        duration: 12000,
        action: { label: `Zu Schritt ${firstStep + 1}`, onClick: () => setCurrentStep(firstStep) },
      });
      setCurrentStep(firstStep);
      return;
    }

    // U-Werte-Gate: Kern der Gebäudehülle vollständig + Haftung bestätigt.
    const uFehlend = pruefeUWerteVollstaendigkeit(result.data);
    if (uFehlend.length > 0) {
      const firstStep = resolveStep(FIELD_META[uFehlend[0].feld]?.step ?? 2);
      const labels = uFehlend.map((f) => f.label);
      toast.error(`U-Werte unvollständig (${uFehlend.length})`, {
        description: `Bitte ergänzen: ${labels.slice(0, 5).join(', ')}${labels.length > 5 ? ` … +${labels.length - 5} weitere` : ''}.`,
        duration: 12000,
        action: { label: `Zu Schritt ${firstStep + 1}`, onClick: () => setCurrentStep(firstStep) },
      });
      setCurrentStep(firstStep);
      return;
    }
    // U-Werte-BLOCK VOR der Haftungs-Bestätigung.
    const uBlocks = checkUWertePlausibilitaet(result.data).filter((i) => i.severity === 'block');
    if (uBlocks.length > 0) {
      const first = uBlocks[0];
      const firstStep = resolveStep(FIELD_META[first.field]?.step ?? 2);
      toast.error('U-Werte: Angabe nicht möglich', { description: uBlocks.map((b) => b.message).join(' '), duration: 10000 });
      setCurrentStep(firstStep);
      return;
    }

    if (result.data.u_werte_haftung_bestaetigt !== true) {
      const firstStep = resolveStep(2);
      toast.error('Bestätigung der Hülle-Angaben fehlt', {
        description: 'Bitte die Richtigkeit der Gebäudehülle-Angaben (Material/Dämmung/Jahr) bestätigen.',
        duration: 10000,
        action: { label: `Zu Schritt ${firstStep + 1}`, onClick: () => setCurrentStep(firstStep) },
      });
      setCurrentStep(firstStep);
      return;
    }

    // Plausibilität (deterministisch, offline) — Hard-Blocks sperren wie ein Pflichtfeld.
    const plausi = [...checkPlausibility(result.data), ...checkUWertePlausibilitaet(result.data)];
    const blocks = plausi.filter((i) => i.severity === 'block');
    if (blocks.length > 0) {
      const first = blocks[0];
      toast.error('Angabe nicht möglich', { description: blocks.map((b) => b.message).join(' '), duration: 10000 });
      setCurrentStep(resolveStep(FIELD_META[first.field]?.step ?? 0));
      return;
    }

    // PV-Aufmaß-Gate (nur wenn aktiv).
    if (values.hat_pv_anlage === false) {
      const pvVals = pvForm.getValues();
      const pvBlocks = checkPvPlausibility(pvVals).filter((i) => i.severity === 'block');
      if (pvBlocks.length > 0) {
        toast.error('PV-Angabe nicht möglich', { description: pvBlocks.map((b) => b.message).join(' '), duration: 10000 });
        setCurrentStep(resolveStep(15));
        return;
      }
      // Wort-Grenze \bflachdach\b; dachneigung===0 = verlässliches Flachdach-Signal.
      const istFlachdach = (typeof pvVals.dachform === 'string' && /\bflachdach\b/i.test(pvVals.dachform)) || pvVals.dachneigung === 0;
      const dachausrichtungFehlt = !pvVals.dachausrichtung && !istFlachdach;
      const pvFehlend: string[] = [];
      if (!pvVals.dachform) pvFehlend.push('Dachform');
      if (pvVals.dachneigung == null) pvFehlend.push('Dachneigung');
      if (dachausrichtungFehlt) pvFehlend.push('Dachausrichtung');
      if (pvVals.pv_bestaetigung !== true) pvFehlend.push('PV-Bestätigung');
      if (!pvVals.pv_unterschrift || !String(pvVals.pv_unterschrift).trim()) pvFehlend.push('PV-Unterschrift');
      if (pvFehlend.length > 0) {
        const dachFehlt = !pvVals.dachform || pvVals.dachneigung == null || dachausrichtungFehlt;
        toast.error('PV-Aufmaß unvollständig', { description: `Es fehlt: ${pvFehlend.join(', ')}.`, duration: 10000 });
        setCurrentStep(resolveStep(dachFehlt ? 15 : 21));
        return;
      }
    }

    // Soft-Befunde → Pflicht-Begründung im Dialog. Ohne Soft → direkt einreichen.
    const softs: SoftFinding[] = plausi
      .filter((i) => i.severity === 'soft')
      .map((i) => ({ ruleId: i.ruleId, field: i.field, message: i.message }));
    if (softs.length === 0) {
      doSubmit(result.data, []).catch(() => {});
      return;
    }

    // KI-Gesamtcheck rein beratend (blockt NICHT, keine Begründungspflicht).
    setBegruendungen({});
    setSoftDialog({ findings: softs, aiHinweise: [], data: result.data });
    setAiLoading(true);
    runAiPlausibility(values)
      .then((aiWarns) => setSoftDialog((prev) => (prev ? { ...prev, aiHinweise: aiWarns.map((w) => w.message) } : prev)))
      .finally(() => setAiLoading(false));
  }, [auftragId, userId, form, pvForm, bilder, steps.length, resolveStep, setCurrentStep, showPvSteps, handleSaveDraft, doSubmit]);

  const isSaving = upsertMutation.isPending || pvUpsertMutation.isPending;
  const setBegruendung = useCallback((ruleId: string, text: string) => {
    setBegruendungen((p) => ({ ...p, [ruleId]: text }));
  }, []);
  const clearAutarcResult = useCallback(() => { setAutarcResult(null); navigate(-1); }, [navigate]);
  const cancelSoftDialog = useCallback(() => setSoftDialog(null), []);

  return {
    handleSaveDraft, handleSubmit, isSaving, submitting,
    softDialog, begruendungen, setBegruendung, aiLoading,
    autarcResult, clearAutarcResult,
    handleKorrigieren, handleSoftConfirm, cancelSoftDialog,
  };
}
