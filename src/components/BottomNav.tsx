import { MapPin, ClipboardList, CheckCircle2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Tab = 'pool' | 'orders' | 'completed' | 'profile';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  poolCount?: number;
  ordersCount?: number;
}

export function BottomNav({ activeTab, onTabChange, poolCount = 0, ordersCount = 0 }: BottomNavProps) {
  const tabs = [
    { id: 'pool' as Tab, label: 'Pool', icon: MapPin, badge: poolCount },
    { id: 'orders' as Tab, label: 'Aufträge', icon: ClipboardList, badge: ordersCount },
    { id: 'completed' as Tab, label: 'Erledigt', icon: CheckCircle2 },
    { id: 'profile' as Tab, label: 'Profil', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom">
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
                <Icon className={cn('w-6 h-6', isActive && 'stroke-[2.5px]')} />
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={cn('text-xs mt-1', isActive && 'font-semibold')}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
