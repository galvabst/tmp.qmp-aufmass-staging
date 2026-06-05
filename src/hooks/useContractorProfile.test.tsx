import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useContractorProfile } from './useContractorProfile';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    from: vi.fn(),
    storage: { from: vi.fn() },
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useContractorProfile — Persistenz darf Fehler nicht verschlucken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saveProgress wirft, wenn der RPC einen Fehler zurückgibt (kein stiller Datenverlust)', async () => {
    (supabase.rpc as unknown as Mock).mockResolvedValue({ error: new Error('RLS denied') });

    const { result } = renderHook(() => useContractorProfile(null), { wrapper });

    await expect(
      result.current.saveProgress({ currentStep: 'profil', completedSteps: [] }),
    ).rejects.toThrow('RLS denied');
  });

  it('saveProgress resolved, wenn der RPC erfolgreich ist', async () => {
    (supabase.rpc as unknown as Mock).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useContractorProfile(null), { wrapper });

    await expect(
      result.current.saveProgress({ currentStep: 'profil', completedSteps: [] }),
    ).resolves.toBeUndefined();
  });

  it('saveEquipmentStatus wirft bei RPC-Fehler', async () => {
    (supabase.rpc as unknown as Mock).mockResolvedValue({ error: new Error('boom') });

    const { result } = renderHook(() => useContractorProfile(null), { wrapper });

    await expect(result.current.saveEquipmentStatus({})).rejects.toThrow('boom');
  });
});
