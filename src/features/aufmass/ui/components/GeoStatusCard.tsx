import { MapPin, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatDistanz } from '../../data/geo';
import type { GeoStandort } from '../../hooks/useGeoStandort';

interface GeoStatusCardProps {
  geo: GeoStandort;
}

/** Kompakte Standort-Status-Karte (Check-in beim Aufmaß-Start). */
export function GeoStatusCard({ geo }: GeoStatusCardProps) {
  if (geo.phase === 'idle') return null;

  if (geo.phase === 'locating' || geo.phase === 'checking') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        {geo.phase === 'locating' ? 'Standort wird erfasst …' : 'Standort wird mit der Kundenadresse abgeglichen …'}
      </div>
    );
  }

  if (geo.phase === 'ok') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>
          <span className="font-semibold">Vor Ort bestätigt.</span>{' '}
          {geo.distanzM != null && `Standort ${formatDistanz(geo.distanzM)} zur Kundenadresse.`}
        </span>
      </div>
    );
  }

  if (geo.phase === 'abweichung') {
    return (
      <div className="flex items-start gap-2 rounded-xl border-2 border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">
            −{geo.abzug} € Abzug: Standort weicht von der Kundenadresse ab.
          </p>
          <p className="font-normal text-destructive/90">
            {geo.distanzM != null && `Dein Standort liegt ${formatDistanz(geo.distanzM)} entfernt. `}
            Das Aufmaß muss vor Ort beim Kunden erfolgen – sonst werden {geo.abzug} € von der Rechnung abgezogen.
          </p>
        </div>
      </div>
    );
  }

  if (geo.phase === 'kein_gps') {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <span className="font-semibold">Standort nicht freigegeben.</span>{' '}
          Bitte GPS/Standort für die App erlauben, damit der Vor-Ort-Nachweis erfasst werden kann.
        </span>
      </div>
    );
  }

  // nicht_pruefbar
  return (
    <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-500">
      <MapPin className="h-4 w-4 shrink-0" />
      Standort aktuell nicht prüfbar.
    </div>
  );
}
