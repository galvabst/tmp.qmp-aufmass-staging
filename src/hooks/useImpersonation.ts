import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const BACKUP_KEY = '__galvanek_admin_session_backup_v1';
const FLAG_KEY = '__galvanek_impersonation_active_v1';

interface AdminBackup {
  access_token: string;
  refresh_token: string;
  admin_email: string;
  admin_user_id: string;
}

interface ImpersonationFlag {
  target_email: string;
  target_user_id: string;
  admin_email: string;
  log_id: string | null;
  started_at: string;
}

export function useImpersonationState(): ImpersonationFlag | null {
  const [state, setState] = useState<ImpersonationFlag | null>(() => readFlag());

  useEffect(() => {
    const handler = () => setState(readFlag());
    window.addEventListener('storage', handler);
    window.addEventListener('galvanek:impersonation-changed', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('galvanek:impersonation-changed', handler);
    };
  }, []);

  return state;
}

function readFlag(): ImpersonationFlag | null {
  try {
    const raw = localStorage.getItem(FLAG_KEY);
    return raw ? (JSON.parse(raw) as ImpersonationFlag) : null;
  } catch {
    return null;
  }
}

function emitChange() {
  window.dispatchEvent(new Event('galvanek:impersonation-changed'));
}

export function useImpersonation() {
  const startImpersonation = useCallback(
    async (params: { targetUserId: string; targetLabel: string; reason?: string }) => {
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr || !sessionData.session) throw new Error('Keine aktive Session.');

      const adminSession = sessionData.session;
      const adminEmail = adminSession.user.email ?? 'admin';
      const adminUserId = adminSession.user.id;

      const { data, error } = await supabase.functions.invoke('admin-impersonate', {
        body: { targetUserId: params.targetUserId, reason: params.reason },
      });
      if (error) throw error;
      const payload = data as {
        access_token: string;
        refresh_token: string;
        target_email: string;
        log_id: string | null;
        error?: string;
      };
      if (payload.error) throw new Error(payload.error);

      // Aktuelle Admin-Session sichern
      const backup: AdminBackup = {
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
        admin_email: adminEmail,
        admin_user_id: adminUserId,
      };
      localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));

      // Flag setzen BEVOR wir die Session wechseln
      const flag: ImpersonationFlag = {
        target_email: payload.target_email,
        target_user_id: params.targetUserId,
        admin_email: adminEmail,
        log_id: payload.log_id,
        started_at: new Date().toISOString(),
      };
      localStorage.setItem(FLAG_KEY, JSON.stringify(flag));
      emitChange();

      // Neue Session aktivieren
      const { error: setErr } = await supabase.auth.setSession({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
      });
      if (setErr) {
        // Rollback
        localStorage.removeItem(FLAG_KEY);
        localStorage.removeItem(BACKUP_KEY);
        emitChange();
        throw setErr;
      }

      // Auf Techniker-Startseite
      window.location.href = '/';
    },
    [],
  );

  const stopImpersonation = useCallback(async () => {
    const raw = localStorage.getItem(BACKUP_KEY);

    // Flags IMMER zuerst löschen, damit der Banner verschwindet
    localStorage.removeItem(FLAG_KEY);
    localStorage.removeItem(BACKUP_KEY);
    emitChange();

    const forceLogout = async () => {
      try {
        await Promise.race([
          supabase.auth.signOut(),
          new Promise((resolve) => setTimeout(resolve, 2000)),
        ]);
      } catch (e) {
        console.error('signOut failed', e);
      }
      window.location.replace('/login');
    };

    if (!raw) {
      await forceLogout();
      return;
    }

    let backup: AdminBackup;
    try {
      backup = JSON.parse(raw) as AdminBackup;
    } catch {
      await forceLogout();
      return;
    }

    try {
      const result = await Promise.race([
        supabase.auth.setSession({
          access_token: backup.access_token,
          refresh_token: backup.refresh_token,
        }),
        new Promise<{ error: Error }>((resolve) =>
          setTimeout(() => resolve({ error: new Error('setSession timeout') }), 3000),
        ),
      ]);
      if ((result as any)?.error) {
        console.error('Restore admin session failed', (result as any).error);
        await forceLogout();
        return;
      }
      window.location.replace('/admin');
    } catch (e) {
      console.error('Restore admin session threw', e);
      await forceLogout();
    }
  }, []);

  return { startImpersonation, stopImpersonation };
}
