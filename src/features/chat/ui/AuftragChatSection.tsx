import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuftragChat } from '@/features/chat/hooks/useAuftragChat';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

interface AuftragChatSectionProps {
  auftragId: string;
}

const MAX_LENGTH = 2000;

export function AuftragChatSection({ auftragId }: AuftragChatSectionProps) {
  const { nachrichten, isLoading, sendNachricht, isSending } = useAuftragChat(auftragId);
  const { user } = useSupabaseSession();
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [nachrichten.length]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_LENGTH) {
      toast.error(`Nachricht zu lang (max. ${MAX_LENGTH} Zeichen)`);
      return;
    }
    sendNachricht(trimmed, {
      onSuccess: () => setText(''),
      onError: (err: any) => {
        console.error('[AuftragChat] send error:', err);
        toast.error(err.message || 'Nachricht konnte nicht gesendet werden');
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <div className="p-2 bg-primary/10 rounded-lg">
          <MessageCircle className="w-5 h-5 text-primary" />
        </div>
        <p className="font-medium text-foreground">Nachrichten</p>
        {nachrichten.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
            {nachrichten.length}
          </span>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="max-h-80 overflow-y-auto p-4 space-y-3"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : nachrichten.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Noch keine Nachrichten. Schreiben Sie die erste Nachricht!
          </p>
        ) : (
          nachrichten.map((msg) => {
            const isOwn = msg.autor_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    isOwn
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}
                >
                  {!isOwn && (
                    <p className={`text-xs font-semibold mb-0.5 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {msg.autor_name}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.inhalt}</p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 px-1">
                  {format(parseISO(msg.erstellt_am), 'd. MMM, HH:mm', { locale: de })}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht schreiben..."
            maxLength={MAX_LENGTH}
            className="min-h-[44px] max-h-28 resize-none text-sm rounded-xl"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!text.trim() || isSending}
            className="shrink-0 rounded-xl h-11 w-11"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        {text.length > MAX_LENGTH * 0.9 && (
          <p className="text-[10px] text-muted-foreground mt-1 text-right">
            {text.length}/{MAX_LENGTH}
          </p>
        )}
      </div>
    </div>
  );
}
