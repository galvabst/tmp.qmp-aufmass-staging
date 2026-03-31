import { Users, Briefcase, Calendar, MapPin, ClipboardCheck, GraduationCap, LayoutDashboard, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AdminTab = 'dashboard' | 'contractors' | 'pool' | 'bookings' | 'checkins' | 'quality-gate' | 'akademie' | 'onboarding-preview';

interface AdminBottomNavProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  badges?: Partial<Record<AdminTab, number>>;
}

const tabs: { id: AdminTab; label: string; icon: typeof Users }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'contractors', label: 'Techniker', icon: Users },
  { id: 'pool', label: 'Pool', icon: Briefcase },
  { id: 'bookings', label: 'Buchungen', icon: Calendar },
  { id: 'checkins', label: 'Check-in', icon: MapPin },
  { id: 'quality-gate', label: 'Abnahme', icon: ClipboardCheck },
  { id: 'akademie', label: 'Akademie', icon: GraduationCap },
];

export function AdminBottomNav({ activeTab, onTabChange, badges = {} }: AdminBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom z-50">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const badge = badges[tab.id];
          
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
                <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5px]')} />
                {badge && badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-accent text-accent-foreground text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px] mt-1 truncate max-w-full px-1', isActive && 'font-semibold')}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
