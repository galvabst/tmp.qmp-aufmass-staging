import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { bewerteGeo, type GeoStatus } from '../data/geo';

export type GeoPhase =
  | 'idle'         // noch nicht gestartet
  | 'locating'     // GPS wird geholt
  | 'checking'     // GPS da, Adresse wird abgeglichen
  | 'ok'           // im Radius → vor Ort bestätigt
  | 'abweichung'   // außerhalb → Abzug
  | 'kein_gps'     // GPS verweigert/nicht verfügbar
  | 'nicht_pruefbar'; // Geocoding fehlgeschlagen

export interface GeoStandort {
  phase: GeoPhase;
  distanzM: number | null;
  abzug: number;
}

interface AdresseInput {
  strasse?: string;
  plz?: string;
  ort?: string;
}

/**
 * Erfasst EINMAL beim Start das Geräte-GPS (Check-in), gleicht es gegen die
 * geocodierte Kundenadresse ab (Edge Function `aufmass-geo-check`) und schreibt
 * das Ergebnis resilient auf das Formular (funktioniert auch vor der Migration).
 */
export function useGeoStandort(
  votFormularId: string | undefined,
  adresse: AdresseInput,
  enabled: boolean,
): GeoStandort {
  const [state, setState] = useState<GeoStandort>({ phase: 'idle', distanzM: null, abzug: 0 });
  const startedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !votFormularId || startedRef.current) return;
    const { strasse, plz, ort } = adresse;
    if (!strasse && !plz && !ort) return; // ohne Adresse kein Abgleich
    startedRef.current = true;

    if (!('geolocation' in navigator)) {
      setState({ phase: 'kein_gps', distanzM: null, abzug: 0 });
      return;
    }

    setState({ phase: 'locating', distanzM: null, abzug: 0 });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setState({ phase: 'checking', distanzM: null, abzug: 0 });
        const { latitude, longitude, accuracy } = pos.coords;

        try {
          const { data, error } = await supabase.functions.invoke('aufmass-geo-check', {
            body: { strasse, plz, ort, lat: latitude, lng: longitude },
          });
          const r = data as { ok?: boolean; distanzM?: number; kundeLat?: number; kundeLng?: number } | null;
          if (error || !r?.ok || typeof r.distanzM !== 'number') {
            setState({ phase: 'nicht_pruefbar', distanzM: null, abzug: 0 });
            return;
          }

          const bew = bewerteGeo(r.distanzM);
          const phase: GeoStatus = bew.status;
          setState({ phase, distanzM: r.distanzM, abzug: bew.abzug });

          // Resilient persistieren (Spalten evtl. noch nicht migriert → ignorieren).
          const { error: upErr } = await (supabaseTC.from('thermocheck_vot_formulare' as any) as any)
            .update({
              gps_lat: latitude,
              gps_lng: longitude,
              gps_accuracy: accuracy ?? null,
              gps_erfasst_am: new Date().toISOString(),
              kunde_geo_lat: r.kundeLat ?? null,
              kunde_geo_lng: r.kundeLng ?? null,
              geo_distanz_m: r.distanzM,
              geo_abzug_betrag: bew.abzug,
            })
            .eq('id', votFormularId);
          if (upErr && !/column .* does not exist/i.test(upErr.message)) {
            console.warn('Geo-Persist fehlgeschlagen:', upErr.message);
          }
        } catch (e) {
          console.error('Geo-Abgleich-Fehler:', e);
          setState({ phase: 'nicht_pruefbar', distanzM: null, abzug: 0 });
        }
      },
      () => setState({ phase: 'kein_gps', distanzM: null, abzug: 0 }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, [enabled, votFormularId, adresse.strasse, adresse.plz, adresse.ort]);

  return state;
}
