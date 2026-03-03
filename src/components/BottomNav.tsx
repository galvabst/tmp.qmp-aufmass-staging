import { MapPin, Calendar, Clock, CheckCircle2, User, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Tab = 'pool' | 'bookings' | 'active' | 'review' | 'forum' | 'profile';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  poolCount?: number;
  bookingsCount?: number;
  activeCount?: number;
  reviewCount?: number;
  unreadChatTotal?: number;
}

export function BottomNav({ 
  activeTab, 
  onTabChange, 
  poolCount = 0, 
  bookingsCount = 0,
  activeCount = 0,
  reviewCount = 0,
  unreadChatTotal = 0,
}: BottomNavProps) {
  const tabs = [
    { id: 'pool' as Tab, label: 'Pool', icon: MapPin, badge: poolCount },
    { id: 'bookings' as Tab, label: 'Buchungen', icon: Calendar, badge: bookingsCount },
    { id: 'active' as Tab, label: 'Aktiv', icon: Clock, badge: activeCount },
    { id: 'review' as Tab, label: 'Prüfung', icon: CheckCircle2, badge: reviewCount },
    { id: 'forum' as Tab, label: 'Nachrichten', icon: MessageCircle, chatDot: unreadChatTotal > 0 },
    { id: 'profile' as Tab, label: 'Profil', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom z-50">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full relative transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-[18px] h-[18px]', isActive && 'stroke-[2.5px]')} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-accent text-accent-foreground text-[10px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-1">
                    {tab.badge}
                  </span>
                )}
                {'chatDot' in tab && (tab as any).chatDot && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full animate-pulse ring-2 ring-card" />
                )}
              </div>
              <span className={cn('text-[10px] mt-0.5', isActive && 'font-semibold')}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
