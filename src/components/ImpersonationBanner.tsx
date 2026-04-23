import { ShieldAlert, LogOut } from 'lucide-react';
import { useImpersonation, useImpersonationState } from '@/hooks/useImpersonation';
import { useState } from 'react';

export function ImpersonationBanner() {
  const flag = useImpersonationState();
  const { stopImpersonation } = useImpersonation();
  const [busy, setBusy] = useState(false);

  if (!flag) return null;

  const handleStop = async () => {
    setBusy(true);
    try {
      await stopImpersonation();
    } catch (e) {
      console.error(e);
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] bg-destructive text-destructive-foreground shadow-lg"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm">
        <ShieldAlert className="w-4 h-4 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-semibold">Impersonation aktiv</span>
          <span className="hidden sm:inline"> — eingeloggt als </span>
          <span className="sm:hidden"> · </span>
          <span className="font-medium truncate">{flag.target_email}</span>
          <span className="hidden md:inline opacity-80"> (Admin: {flag.admin_email})</span>
        </div>
        <button
          onClick={handleStop}
          disabled={busy}
          className="flex items-center gap-1 px-2 py-1 rounded bg-destructive-foreground/15 hover:bg-destructive-foreground/25 transition-colors font-medium disabled:opacity-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Zurück</span>
        </button>
      </div>
    </div>
  );
}
