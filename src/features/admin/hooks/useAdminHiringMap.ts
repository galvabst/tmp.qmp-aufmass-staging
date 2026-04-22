import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { geocodePlzBatch, geocodeCity, PlzCoordinate } from '@/features/pool/utils/plz-geocoder';
import { useEffect, useState, useRef, useCallback } from 'react';

export type ContractorMapAction = 'pause' | 'fire' | 'reactivate';

export interface SalesRepMapEntry {
  id: string;
  name: string;
  plz: string;
  lat: number;
  lng: number;
  radiusKm: number;
}

export interface ContractorMapEntry {
  /** profile_id (used to navigate to contractor detail view) */
  id: string;
  /** contractor_onboarding row id (used for status mutations) */
  onboardingId: string;
  name: string;
  plz: string;
  ort: string;
  lat: number;
  lng: number;
  status: 'active' | 'onboarding' | 'inaktiv';
  wunschRadiusKm: number;
  avatarUrl: string | null;
}

export interface ThcOrderMapEntry {
  plz: string;
  ort: string;
  lat: number;
  lng: number;
  count: number;
}

/** selectedMonth === null means "Gesamt" (all time) */
export function useAdminHiringMap(selectedMonth: Date | null) {
  const [salesReps, setSalesReps] = useState<SalesRepMapEntry[]>([]);
  const [contractors, setContractors] = useState<ContractorMapEntry[]>([]);
  const [thcOrders, setThcOrders] = useState<ThcOrderMapEntry[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Load Vertriebler (field_sales)
  const salesQuery = useQuery({
    queryKey: ['admin-hiring-map-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mitarbeiter')
        .select('id, name, ort, plz_hauptstandort, hauptstandort_lat, hauptstandort_lng')
        .eq('status', 'Aktiv')
        .eq('taetigkeit', 'field_sales');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Load Contractors
  const contractorQuery = useQuery({
    queryKey: ['admin-hiring-map-contractors'],
    queryFn: async () => {
      const { data, error } = await (supabaseTC
        .from('contractor_onboarding' as any)
        .select('id, profile_id, anschrift_plz, anschrift_ort, onboarding_status, wunsch_radius_km')
        .not('onboarding_status', 'in', '("deaktiviert","invited","gefeuert")') as any);
      if (error) throw error;
      
      const profileIds = (data ?? []).map((d: any) => d.profile_id).filter(Boolean);
      if (profileIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, vorname, nachname, avatar_url')
        .in('id', profileIds);

      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

      return (data ?? []).map((d: any) => {
        const profile = profileMap.get(d.profile_id);
        return {
          onboardingId: d.id,
          profileId: d.profile_id,
          plz: d.anschrift_plz || '',
          ort: d.anschrift_ort || '',
          name: profile ? `${profile.vorname || ''} ${profile.nachname || ''}`.trim() : 'Unbekannt',
          status: d.onboarding_status === 'ready' ? 'active' : d.onboarding_status === 'inaktiv' ? 'inaktiv' : 'onboarding',
          wunschRadiusKm: d.wunsch_radius_km ?? 60,
          avatarUrl: profile?.avatar_url || null,
        };
      });
    },
    staleTime: 1000 * 60 * 5,
  });

  // Load THC orders grouped by PLZ
  const monthKey = selectedMonth
    ? `${selectedMonth.getFullYear()}-${selectedMonth.getMonth()}`
    : 'gesamt';

  const thcQuery = useQuery({
    queryKey: ['admin-hiring-map-thc', monthKey],
    queryFn: async () => {
      let query = (supabaseTC
        .from('v_thermocheck_auftraege' as any)
        .select('kunde_plz, kunde_ort, wc1_durchgefuehrt_am')
        .not('kunde_plz', 'is', null) as any);

      if (selectedMonth) {
        const monthStart = new Date(selectedMonth);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);

        query = query
          .gte('wc1_durchgefuehrt_am', monthStart.toISOString())
          .lt('wc1_durchgefuehrt_am', monthEnd.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const grouped = new Map<string, { plz: string; ort: string; count: number }>();
      (data ?? []).forEach((d: any) => {
        const plz = (d.kunde_plz || '').trim();
        if (plz.length < 4) return;
        const existing = grouped.get(plz);
        if (existing) {
          existing.count += 1;
        } else {
          grouped.set(plz, { plz, ort: (d.kunde_ort || '').trim(), count: 1 });
        }
      });

      return Array.from(grouped.values());
    },
    staleTime: 1000 * 60 * 5,
  });

  // Geocode everything — use ref to prevent stale closures on rapid month changes
  const geocodeAbortRef = useRef(0);

  useEffect(() => {
    if (!salesQuery.data && !contractorQuery.data && !thcQuery.data) return;

    const runId = ++geocodeAbortRef.current;

    const doGeocode = async () => {
      setIsGeocoding(true);

      const plzList: string[] = [];
      const cityMap = new Map<string, string>();

      (salesQuery.data ?? []).forEach(s => {
        const plz = (s.plz_hauptstandort || '').trim();
        if (plz.length >= 4 && (!s.hauptstandort_lat || !s.hauptstandort_lng)) {
          plzList.push(plz);
        }
      });

      (contractorQuery.data ?? []).forEach((c: any) => {
        if (c.plz && c.plz.trim().length >= 4) {
          plzList.push(c.plz);
          if (c.ort) cityMap.set(c.plz, c.ort);
        }
      });

      (thcQuery.data ?? []).forEach((t: any) => {
        plzList.push(t.plz);
        if (t.ort) cityMap.set(t.plz, t.ort);
      });

      const coords = await geocodePlzBatch(plzList, cityMap);

      // Fallback: Vertriebler ohne PLZ aber mit Ort → per Stadt-Geocoding nachladen
      const repsNeedingCityFallback = (salesQuery.data ?? []).filter(s => {
        const plz = (s.plz_hauptstandort || '').trim();
        const hasCoords = !!s.hauptstandort_lat && !!s.hauptstandort_lng;
        return !hasCoords && plz.length < 4 && (s.ort || '').trim().length > 0;
      });
      const cityCoords = new Map<string, PlzCoordinate>();
      for (const s of repsNeedingCityFallback) {
        const ort = (s.ort || '').trim();
        if (cityCoords.has(ort.toLowerCase())) continue;
        const c = await geocodeCity(ort);
        if (c) cityCoords.set(ort.toLowerCase(), c);
      }

      // Abort if a newer geocode run has started
      if (geocodeAbortRef.current !== runId) return;

      // Build sales reps
      const reps: SalesRepMapEntry[] = [];
      const skippedReps: string[] = [];
      (salesQuery.data ?? []).forEach(s => {
        let lat = s.hauptstandort_lat;
        let lng = s.hauptstandort_lng;
        const plz = (s.plz_hauptstandort || '').trim();
        const ort = (s.ort || '').trim();
        if ((!lat || !lng) && plz.length >= 4) {
          const c = coords.get(plz);
          if (c) { lat = c.lat; lng = c.lng; }
        }
        if ((!lat || !lng) && ort) {
          const c = cityCoords.get(ort.toLowerCase());
          if (c) { lat = c.lat; lng = c.lng; }
        }
        if (lat && lng) {
          reps.push({ id: s.id, name: s.name || 'Unbekannt', plz: plz || ort, lat, lng, radiusKm: 60 });
        } else {
          skippedReps.push(`${s.name || s.id} (PLZ: ${plz || '—'}, Ort: ${ort || '—'})`);
        }
      });
      if (skippedReps.length > 0) {
        console.warn('[HiringMap] Vertriebler ohne Koordinaten (nicht auf Map sichtbar):', skippedReps);
      }
      setSalesReps(reps);

      // Build contractors
      const ctrs: ContractorMapEntry[] = [];
      (contractorQuery.data ?? []).forEach((c: any) => {
        if (!c.plz || c.plz.trim().length < 4) return;
        const coord = coords.get(c.plz);
        if (!coord) return;
        ctrs.push({
          id: c.profileId, onboardingId: c.onboardingId, name: c.name, plz: c.plz, ort: c.ort || coord.city || '',
          lat: coord.lat, lng: coord.lng, status: c.status, wunschRadiusKm: c.wunschRadiusKm, avatarUrl: c.avatarUrl,
        });
      });
      setContractors(ctrs);

      // Build THC order points
      const orders: ThcOrderMapEntry[] = [];
      (thcQuery.data ?? []).forEach((t: any) => {
        const coord = coords.get(t.plz);
        if (!coord) return;
        orders.push({ plz: t.plz, ort: t.ort || coord.city || '', lat: coord.lat, lng: coord.lng, count: t.count });
      });
      setThcOrders(orders);

      setIsGeocoding(false);
    };

    doGeocode();
  }, [salesQuery.data, contractorQuery.data, thcQuery.data]);

  return {
    salesReps,
    contractors,
    thcOrders,
    isLoading: salesQuery.isLoading || contractorQuery.isLoading || thcQuery.isLoading,
    isGeocoding,
  };
}
