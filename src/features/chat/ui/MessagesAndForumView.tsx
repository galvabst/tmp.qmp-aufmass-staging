import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ForumView } from '@/features/forum/ui/ForumView';
import { NachrichtenInboxView } from './NachrichtenInboxView';
import { NachrichtenDetail } from './NachrichtenDetail';
import { GalvanekLogo } from '@/components/GalvanekLogo';

type SubTab = 'nachrichten' | 'forum';

interface MessagesAndForumViewProps {
  auftragIds: string[];
  unreadCounts: Map<string, number>;
  unreadTotal: number;
}

export function MessagesAndForumView({ auftragIds, unreadCounts, unreadTotal }: MessagesAndForumViewProps) {
  const [subTab, setSubTab] = useState<SubTab>('nachrichten');
  const [openChat, setOpenChat] = useState<{ auftragId: string; kundenName: string } | null>(null);

  // Fullscreen chat detail
  if (openChat) {
    return (
      <NachrichtenDetail
        auftragId={openChat.auftragId}
        kundenName={openChat.kundenName}
        onBack={() => setOpenChat(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary to-primary/85 text-primary-foreground safe-area-top sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Nachrichten</h1>
              <p className="text-primary-foreground/70 text-sm">
                {unreadTotal > 0 ? `${unreadTotal} ungelesen` : 'Alle gelesen'}
              </p>
            </div>
            <GalvanekLogo size="sm" variant="white" className="opacity-95" />
          </div>
        </div>
      </header>

      {/* Sub-tab bar */}
      <div className="bg-background border-b border-border">
        <div className="flex">
          <button
            onClick={() => setSubTab('nachrichten')}
            className={cn(
              'flex-1 py-3 text-sm font-medium text-center relative transition-colors',
              subTab === 'nachrichten'
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            <span className="relative">
              Nachrichten
              {unreadTotal > 0 && (
                <span className="absolute -top-1.5 -right-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-1">
                  {unreadTotal}
                </span>
              )}
            </span>
            {subTab === 'nachrichten' && (
              <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
            )}
          </button>
          <button
            onClick={() => setSubTab('forum')}
            className={cn(
              'flex-1 py-3 text-sm font-medium text-center relative transition-colors',
              subTab === 'forum'
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            Forum
            {subTab === 'forum' && (
              <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {subTab === 'nachrichten' ? (
        <NachrichtenInboxView
          auftragIds={auftragIds}
          unreadCounts={unreadCounts}
          onOpenChat={(auftragId, kundenName) => setOpenChat({ auftragId, kundenName })}
        />
      ) : (
        <ForumView />
      )}
    </div>
  );
}
