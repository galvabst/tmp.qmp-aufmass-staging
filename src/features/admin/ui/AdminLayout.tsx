import { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  count?: number;
  actionButton?: ReactNode;
}

export function AdminLayout({ 
  children, 
  title, 
  subtitle,
  count,
  actionButton,
}: AdminLayoutProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Abgemeldet');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border safe-area-top">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
              {(subtitle || count !== undefined) && (
                <p className="text-sm text-muted-foreground">
                  {subtitle}
                  {count !== undefined && (
                    <span className="ml-1 font-medium">({count})</span>
                  )}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {actionButton}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive"
                title="Abmelden"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="px-4 py-4">
        {children}
      </main>
    </div>
  );
}
