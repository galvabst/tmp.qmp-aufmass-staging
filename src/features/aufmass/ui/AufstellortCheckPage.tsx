/**
 * Standalone Aufstellort-Check
 * ---------------------------------------------------------------
 * Lightweight on-site entry point — lets the technician run the
 * AI-Außenaufstellort-Prüfung BEFORE opening / completing the full
 * VOT form. The form itself is often completed at home; this view
 * makes sure the placement check happens on-site.
 *
 * Route: /thermocheck/aufstellort-check/:auftragId
 *
 * Notes:
 * - Pure read of `v_thermocheck_auftraege` to resolve lead_id.
 * - All persistence lives in the shared `sales_zaehlerschrank_pruefungen`
 *   table (variant: 'haupt' | 'alt_1' | 'alt_2') — same source of truth
 *   as the AI panel inside the VOT form, so results auto-merge.
 * - No form-state coupling here: snapshot to the form happens only
 *   when the technician opens AufstellortSection inside AufmassFormPage.
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ClipboardList, MapPin, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import type { AuftragViewData } from '../data/auftrag-view';
import { AufstellortAIPanel } from './sections/AufstellortAIPanel';

export default function AufstellortCheckPage() {
  const { auftragId } = useParams<{ auftragId: string }>();
  const navigate = useNavigate();
  const [showAlt1, setShowAlt1] = useState(false);
  const [showAlt2, setShowAlt2] = useState(false);

  const { data: auftrag, isLoading } = useQuery<AuftragViewData | null>({
    queryKey: ['thermocheck-auftrag-detail', auftragId],
    enabled: !!auftragId,
    queryFn: async () => {
      const { data, error } = await supabaseTC
        .from('v_thermocheck_auftraege' as never)
        .select('*')
        .eq('id', auftragId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as AuftragViewData | null;
    },
  });

  const leadId = auftrag?.lead_id || null;
  const kundenName =
    `${auftrag?.kunde_vorname || ''} ${auftrag?.kunde_nachname || ''}`.trim() ||
    auftrag?.lead_name ||
    'Unbekannt';

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!leadId) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" />Zurück
        </Button>
        <p className="text-sm text-muted-foreground">
          Für diesen Auftrag ist kein Lead verknüpft — AI-Check nicht verfügbar.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold flex items-center gap-2 truncate">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              Aufstellort-Check
            </h1>
            <p className="text-xs text-muted-foreground truncate">{kundenName}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-5">
        {/* Kontext-Hinweis */}
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-[11px] text-muted-foreground leading-snug">
            ℹ️ AI-Prüfung des <strong>Außenaufstellorts</strong> der Wärmepumpe
            (Vitocal R290 Monoblock — TA-Lärm, R290-Schutzbereich, Abstände, Untergrund).
            Direkt vor Ort durchführen — das VOT-Formular kann später zu Hause vervollständigt werden.
            Ergebnisse werden automatisch in das Formular übernommen.
          </p>
        </div>

        {/* Haupt-Aufstellort */}
        <section className="rounded-2xl border border-primary/20 bg-primary/[0.02] p-4 space-y-3">
          <h2 className="text-sm font-semibold">Haupt-Aufstellort</h2>
          <AufstellortAIPanel leadId={leadId} variant="haupt" />
        </section>

        {/* Alternative 1 */}
        {!showAlt1 ? (
          <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowAlt1(true)}>
            <Plus className="w-4 h-4 mr-2" />1. Alternative prüfen
          </Button>
        ) : (
          <section className="rounded-2xl border border-primary/20 bg-primary/[0.02] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Alternative 1</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => { setShowAlt1(false); setShowAlt2(false); }}
              >
                <Minus className="w-4 h-4 mr-1" />Entfernen
              </Button>
            </div>
            <AufstellortAIPanel leadId={leadId} variant="alt_1" />
          </section>
        )}

        {/* Alternative 2 — nur sichtbar wenn Alt 1 vorhanden */}
        {showAlt1 && (
          !showAlt2 ? (
            <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowAlt2(true)}>
              <Plus className="w-4 h-4 mr-2" />2. Alternative prüfen
            </Button>
          ) : (
            <section className="rounded-2xl border border-primary/20 bg-primary/[0.02] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Alternative 2</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setShowAlt2(false)}
                >
                  <Minus className="w-4 h-4 mr-1" />Entfernen
                </Button>
              </div>
              <AufstellortAIPanel leadId={leadId} variant="alt_2" />
            </section>
          )
        )}

        {/* Weiter zum Formular */}
        <Button
          size="lg"
          className="w-full rounded-2xl h-12 mt-4"
          onClick={() => navigate(`/thermocheck/aufmass/${auftragId}`)}
        >
          <ClipboardList className="w-5 h-5 mr-2" />Weiter zum VOT-Formular
        </Button>
      </div>
    </div>
  );
}
