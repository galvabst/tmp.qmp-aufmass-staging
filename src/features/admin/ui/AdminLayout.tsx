import { ReactNode } from 'react';

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
            {actionButton && (
              <div className="flex-shrink-0">
                {actionButton}
              </div>
            )}
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
