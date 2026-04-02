import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { geocodePlzBatch, PlzCoordinate } from '@/features/pool/utils/plz-geocoder';
import { useEffect, useState } from 'react';

export interface SalesRepMapEntry {
  id: string;
  name: string;
  plz: string;
  lat: number;
  lng: number;
  radiusKm: number;
}

export interface ContractorMapEntry {
  id: string;
  name: string;
  plz: string;
  ort: string;
  lat: number;
  lng: number;
  status: 'active' | 'onboarding';
  wunschRadiusKm: number;
  avatarUrl: string | null;
}

export function useAdminHiringMap() {
  const [salesReps, setSalesReps] = useState<SalesRepMapEntry[]>([]);
  const [contractors, setContractors] = useState<ContractorMapEntry[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Load Vertriebler (field_sales)
  const salesQuery = useQuery({
    queryKey: ['admin-hiring-map-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mitarbeiter')
        .select('id, name, plz_hauptstandort, hauptstandort_lat, hauptstandort_lng')
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
        .select('profile_id, anschrift_plz, anschrift_ort, onboarding_status, wunsch_radius_km')
        .not('onboarding_status', 'in', '("deaktiviert","invited")') as any);
      if (error) throw error;
      
      // Get profile names
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
          profileId: d.profile_id,
          plz: d.anschrift_plz || '',
          ort: d.anschrift_ort || '',
          name: profile ? `${profile.vorname || ''} ${profile.nachname || ''}`.trim() : 'Unbekannt',
          status: d.onboarding_status === 'ready' ? 'active' : 'onboarding',
          wunschRadiusKm: d.wunsch_radius_km ?? 60,
          avatarUrl: profile?.avatar_url || null,
        };
      });
    },
    staleTime: 1000 * 60 * 5,
  });

  // Geocode everything
  useEffect(() => {
    if (!salesQuery.data && !contractorQuery.data) return;

    const doGeocode = async () => {
      setIsGeocoding(true);

      // Collect all PLZs
      const plzList: string[] = [];
      const cityMap = new Map<string, string>();

      // Sales reps without lat/lng
      (salesQuery.data ?? []).forEach(s => {
        if (s.plz_hauptstandort && (!s.hauptstandort_lat || !s.hauptstandort_lng)) {
          plzList.push(s.plz_hauptstandort);
        }
      });

      // Contractors
      (contractorQuery.data ?? []).forEach((c: any) => {
        if (c.plz && c.plz.trim().length >= 4) {
          plzList.push(c.plz);
          if (c.ort) cityMap.set(c.plz, c.ort);
        }
      });

      const coords = await geocodePlzBatch(plzList, cityMap);

      // Build sales reps
      const reps: SalesRepMapEntry[] = [];
      (salesQuery.data ?? []).forEach(s => {
        let lat = s.hauptstandort_lat;
        let lng = s.hauptstandort_lng;
        if ((!lat || !lng) && s.plz_hauptstandort) {
          const c = coords.get(s.plz_hauptstandort);
          if (c) { lat = c.lat; lng = c.lng; }
        }
        if (lat && lng) {
          reps.push({
            id: s.id,
            name: s.name || 'Unbekannt',
            plz: s.plz_hauptstandort || '',
            lat,
            lng,
            radiusKm: 60,
          });
        }
      });
      setSalesReps(reps);

      // Build contractors
      const ctrs: ContractorMapEntry[] = [];
      (contractorQuery.data ?? []).forEach((c: any) => {
        if (!c.plz || c.plz.trim().length < 4) return;
        const coord = coords.get(c.plz);
        if (!coord) return;
        ctrs.push({
          id: c.profileId,
          name: c.name,
          plz: c.plz,
          ort: c.ort || coord.city || '',
          lat: coord.lat,
          lng: coord.lng,
          status: c.status,
          wunschRadiusKm: c.wunschRadiusKm,
          avatarUrl: c.avatarUrl,
        });
      });
      setContractors(ctrs);
      setIsGeocoding(false);
    };

    doGeocode();
  }, [salesQuery.data, contractorQuery.data]);

  return {
    salesReps,
    contractors,
    isLoading: salesQuery.isLoading || contractorQuery.isLoading,
    isGeocoding,
  };
}
