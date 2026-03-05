import { useState } from 'react';
import { Plus, BookOpen, HelpCircle, ClipboardCheck, FileVideo, Link2, ShieldCheck } from 'lucide-react';
import { AdminLayout } from '../AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminAkademieModule, type AdminModul, type AdminLektion, type AdminQuizFrage } from '../../hooks/useAdminAkademieModule';
import { useAdminMutateModul } from '../../hooks/useAdminMutateModul';
import { useAdminMutateLektion } from '../../hooks/useAdminMutateLektion';
import { useAdminMutateQuiz } from '../../hooks/useAdminMutateQuiz';
import { ModulEditor } from './ModulEditor';
import { LektionEditor } from './LektionEditor';
import { LektionListItem } from './LektionListItem';
import { QuizFrageEditor } from './QuizFrageEditor';
import { QuizFrageListItem } from './QuizFrageListItem';

export function AkademieAdminView() {
  const { data: module, isLoading, error } = useAdminAkademieModule();
  const { upsertModul, isPending: modulPending } = useAdminMutateModul();
  const { upsertLektion, toggleLektionActive, isPending: lektionPending } = useAdminMutateLektion();
  const { upsertQuiz, toggleQuizActive, isPending: quizPending } = useAdminMutateQuiz();

  // Modul editor state
  const [modulEditorOpen, setModulEditorOpen] = useState(false);
  const [editingModul, setEditingModul] = useState<AdminModul | null>(null);

  // Lektion editor state
  const [lektionEditorOpen, setLektionEditorOpen] = useState(false);
  const [editingLektion, setEditingLektion] = useState<AdminLektion | null>(null);
  const [lektionModulId, setLektionModulId] = useState('');

  // Quiz editor state
  const [quizEditorOpen, setQuizEditorOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<AdminQuizFrage | null>(null);
  const [quizModulId, setQuizModulId] = useState('');

  const handleNewModul = () => { setEditingModul(null); setModulEditorOpen(true); };
  const handleEditModul = (modul: AdminModul) => { setEditingModul(modul); setModulEditorOpen(true); };

  const handleNewLektion = (modulId: string) => { setEditingLektion(null); setLektionModulId(modulId); setLektionEditorOpen(true); };
  const handleEditLektion = (lektion: AdminLektion) => { setEditingLektion(lektion); setLektionModulId(lektion.modul_id); setLektionEditorOpen(true); };

  const handleToggleLektionActive = async (lektion: AdminLektion) => {
    await toggleLektionActive({ id: lektion.id, modul_id: lektion.modul_id, ist_aktiv: !lektion.ist_aktiv });
  };

  const handleNewQuiz = (modulId: string) => { setEditingQuiz(null); setQuizModulId(modulId); setQuizEditorOpen(true); };
  const handleEditQuiz = (frage: AdminQuizFrage) => { setEditingQuiz(frage); setQuizModulId(frage.modul_id); setQuizEditorOpen(true); };

  const handleToggleQuizActive = async (frage: AdminQuizFrage) => {
    await toggleQuizActive({ id: frage.id, modul_id: frage.modul_id, ist_aktiv: !frage.ist_aktiv });
  };

  if (error) {
    return (
      <AdminLayout title="Akademie-Inhalte">
        <div className="text-center text-destructive py-8">
          Fehler beim Laden: {(error as Error).message}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Akademie-Inhalte"
      subtitle="Module & Lektionen verwalten"
      count={module?.length}
      actionButton={
        <Button size="sm" onClick={handleNewModul}>
          <Plus className="w-4 h-4 mr-1" />
          Modul
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {module?.map((modul) => (
            <AccordionItem key={modul.id} value={modul.id} className="border rounded-lg px-1">
              <AccordionTrigger className="hover:no-underline py-3 px-2">
                <div className="flex items-center gap-3 text-left flex-1 min-w-0">
                  <BookOpen className="w-4 h-4 flex-shrink-0 text-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{modul.code}</span>
                      <span className="text-xs text-muted-foreground">#{modul.reihenfolge}</span>
                      {!modul.ist_aktiv && (
                        <Badge variant="secondary" className="text-[10px] h-4">Inaktiv</Badge>
                      )}
                    </div>
                    <p className="text-sm font-semibold truncate">{modul.titel}</p>
                  </div>
                  <Badge variant="outline" className="flex-shrink-0">
                    {modul.lektionen.length} Lektionen
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-3">
                <div className="space-y-2">
                  {/* Edit modul button */}
                  <div className="flex justify-between items-center mb-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditModul(modul)}>
                      Modul bearbeiten
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleNewLektion(modul.id)}>
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Lektion
                    </Button>
                  </div>

                  {/* Lektionen list */}
                  {modul.lektionen.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Keine Lektionen vorhanden
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {modul.lektionen.map((lektion) => (
                        <LektionListItem
                          key={lektion.id}
                          lektion={lektion}
                          onEdit={handleEditLektion}
                          onToggleActive={handleToggleLektionActive}
                        />
                      ))}
                    </div>
                  )}

                  {/* Quiz section */}
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">Quiz-Fragen</span>
                        <Badge variant="outline" className="text-xs">
                          {modul.quizFragen.length}
                        </Badge>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => handleNewQuiz(modul.id)}>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Frage
                      </Button>
                    </div>
                    {modul.quizFragen.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-3">
                        Keine Quiz-Fragen vorhanden
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {modul.quizFragen.map((frage) => (
                          <QuizFrageListItem
                            key={frage.id}
                            frage={frage}
                            onEdit={handleEditQuiz}
                            onToggleActive={handleToggleQuizActive}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Abschlusstest Fragenpool */}
      {!isLoading && module && (() => {
        const activeModulesWithQuiz = module
          .filter(m => m.ist_aktiv && m.quizFragen.some(q => q.ist_aktiv));
        const totalActive = activeModulesWithQuiz.reduce((sum, m) => sum + m.quizFragen.filter(q => q.ist_aktiv).length, 0);

        return (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-primary" />
                Abschlusstest — Fragenpool
                <Badge variant="outline">{totalActive} aktive Fragen</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeModulesWithQuiz.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Keine aktiven Quiz-Fragen vorhanden</p>
              ) : (
                activeModulesWithQuiz.map(modul => {
                  const activeFragen = modul.quizFragen.filter(q => q.ist_aktiv);
                  return (
                    <div key={modul.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-muted-foreground">{modul.code}</span>
                        <span className="text-sm font-semibold">{modul.titel}</span>
                        <Badge variant="secondary" className="text-xs">{activeFragen.length}</Badge>
                      </div>
                      <div className="space-y-1.5 pl-2">
                        {activeFragen.map(frage => (
                          <QuizFrageListItem
                            key={frage.id}
                            frage={frage}
                            onEdit={handleEditQuiz}
                            onToggleActive={handleToggleQuizActive}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Praxistest Info */}
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Praxistest — Anforderungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Nach bestandenem Abschlusstest müssen Contractors folgende Nachweise einreichen:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm">
              <Link2 className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
              <div>
                <span className="font-medium">3D-Scan / Autark-Projekt Link</span>
                <span className="text-muted-foreground"> — URL zum fertiggestellten Projekt</span>
              </div>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <FileVideo className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
              <div>
                <span className="font-medium">Drohnenflug-Video</span>
                <span className="text-muted-foreground"> — Dateiupload (Bucket: contractor-documents)</span>
              </div>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground mt-3 border-t pt-2">
            Freigabe erfolgt über <span className="font-medium">Quality Gate → Praxistests</span>
          </p>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ModulEditor
        open={modulEditorOpen}
        onOpenChange={setModulEditorOpen}
        modul={editingModul}
        onSave={upsertModul}
        isPending={modulPending}
      />
      <LektionEditor
        open={lektionEditorOpen}
        onOpenChange={setLektionEditorOpen}
        lektion={editingLektion}
        modulId={lektionModulId}
        onSave={upsertLektion}
        isPending={lektionPending}
      />
      <QuizFrageEditor
        open={quizEditorOpen}
        onOpenChange={setQuizEditorOpen}
        frage={editingQuiz}
        modulId={quizModulId}
        onSave={upsertQuiz}
        isPending={quizPending}
      />
    </AdminLayout>
  );
}
