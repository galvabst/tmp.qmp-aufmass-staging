import { useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { AdminLayout } from '../AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminAkademieModule, type AdminModul, type AdminLektion } from '../../hooks/useAdminAkademieModule';
import { useAdminMutateModul } from '../../hooks/useAdminMutateModul';
import { useAdminMutateLektion } from '../../hooks/useAdminMutateLektion';
import { ModulEditor } from './ModulEditor';
import { LektionEditor } from './LektionEditor';
import { LektionListItem } from './LektionListItem';

export function AkademieAdminView() {
  const { data: module, isLoading, error } = useAdminAkademieModule();
  const { upsertModul, isPending: modulPending } = useAdminMutateModul();
  const { upsertLektion, toggleLektionActive, isPending: lektionPending } = useAdminMutateLektion();

  // Modul editor state
  const [modulEditorOpen, setModulEditorOpen] = useState(false);
  const [editingModul, setEditingModul] = useState<AdminModul | null>(null);

  // Lektion editor state
  const [lektionEditorOpen, setLektionEditorOpen] = useState(false);
  const [editingLektion, setEditingLektion] = useState<AdminLektion | null>(null);
  const [lektionModulId, setLektionModulId] = useState('');

  const handleNewModul = () => {
    setEditingModul(null);
    setModulEditorOpen(true);
  };

  const handleEditModul = (modul: AdminModul) => {
    setEditingModul(modul);
    setModulEditorOpen(true);
  };

  const handleNewLektion = (modulId: string) => {
    setEditingLektion(null);
    setLektionModulId(modulId);
    setLektionEditorOpen(true);
  };

  const handleEditLektion = (lektion: AdminLektion) => {
    setEditingLektion(lektion);
    setLektionModulId(lektion.modul_id);
    setLektionEditorOpen(true);
  };

  const handleToggleLektionActive = async (lektion: AdminLektion) => {
    await toggleLektionActive({
      id: lektion.id,
      modul_id: lektion.modul_id,
      ist_aktiv: !lektion.ist_aktiv,
    });
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditModul(modul)}
                    >
                      Modul bearbeiten
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleNewLektion(modul.id)}
                    >
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
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

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
    </AdminLayout>
  );
}
