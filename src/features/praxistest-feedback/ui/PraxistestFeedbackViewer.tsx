import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertTriangle, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { KOMPONENTE_LABEL, type PraxistestFeedbackEntry } from '../types';

interface Props {
  feedback: PraxistestFeedbackEntry[];
}

/**
 * Read-only Feedback-Anzeige für den Techniker.
 * Gruppiert nach Komponente, mit klickbarer Bild-Lightbox.
 */
export function PraxistestFeedbackViewer({ feedback }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (feedback.length === 0) return null;

  return (
    <>
      <div className="bg-destructive/5 border border-destructive/30 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <p className="font-semibold text-destructive">Praxistest abgelehnt — bitte überarbeiten</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Dein Quiz-Status bleibt bestehen. Du musst nur die unten markierten Komponenten neu einreichen.
        </p>

        {feedback.map((fb) => (
          <div key={fb.id} className="bg-card rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-destructive" />
                <span className="text-sm font-semibold text-foreground">{KOMPONENTE_LABEL[fb.komponente]}</span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {fb.pruefer_rolle === 'trainer' ? 'Trainer' : 'Admin'} ·{' '}
                {format(parseISO(fb.erstelltAm), 'dd.MM.yyyy HH:mm', { locale: de })}
              </span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">{fb.kommentar}</p>
            {fb.bilder.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {fb.bilder.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => b.signedUrl && setLightbox(b.signedUrl)}
                    className="rounded-md overflow-hidden border border-border hover:ring-2 hover:ring-primary transition"
                  >
                    {b.signedUrl ? (
                      <img src={b.signedUrl} alt="Markierter Screenshot" className="w-full h-24 object-cover" />
                    ) : (
                      <div className="w-full h-24 bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                        Bild nicht verfügbar
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-4xl p-2">
          {lightbox && <img src={lightbox} alt="Vergrößerter Screenshot" className="w-full h-auto rounded-md" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
