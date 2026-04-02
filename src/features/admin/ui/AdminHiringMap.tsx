import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Loader2, Map as MapIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAdminHiringMap, SalesRepMapEntry, ContractorMapEntry } from '../hooks/useAdminHiringMap';
import { Button } from '@/components/ui/button';

function createMarkerIcon(color: string, label?: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 11px;
      font-family: ui-sans-serif, system-ui, sans-serif;
    ">${label || ''}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -18],
  });
}

export function AdminHiringMap() {
  const { salesReps, contractors, isLoading, isGeocoding } = useAdminHiringMap();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    salesGroup: L.LayerGroup;
    contractorGroup: L.LayerGroup;
  } | null>(null);
  
  const [isOpen, setIsOpen] = useState(true);
  const [showSales, setShowSales] = useState(true);
  const [showContractors, setShowContractors] = useState(true);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [51.2, 10.5],
      zoom: 6,
      zoomControl: true,
      attributionControl: false,
    });

    L.control.attribution({ prefix: false })
      .addAttribution('© <a href="https://openstreetmap.org" target="_blank" rel="noopener">OSM</a>')
      .addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const salesGroup = L.layerGroup().addTo(map);
    const contractorGroup = L.layerGroup().addTo(map);

    layersRef.current = { salesGroup, contractorGroup };
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = null;
    };
  }, []);

  // Invalidate on open
  useEffect(() => {
    if (isOpen && mapRef.current) {
      setTimeout(() => mapRef.current?.invalidateSize(), 100);
    }
  }, [isOpen]);

  // Place sales rep markers
  useEffect(() => {
    const group = layersRef.current?.salesGroup;
    if (!group) return;
    group.clearLayers();
    if (!showSales) return;

    salesReps.forEach(rep => {
      // Radius circle
      L.circle([rep.lat, rep.lng], {
        radius: rep.radiusKm * 1000,
        color: 'hsl(210, 80%, 50%)',
        fillColor: 'hsl(210, 80%, 50%)',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '4 4',
      }).addTo(group);

      // Marker
      const marker = L.marker([rep.lat, rep.lng], {
        icon: createMarkerIcon('hsl(210, 80%, 50%)', 'V'),
      });
      marker.bindPopup(`
        <div style="font-family:ui-sans-serif,system-ui,sans-serif;min-width:140px;">
          <div style="font-weight:700;font-size:14px;color:#111;">${rep.name}</div>
          <div style="font-size:12px;color:#666;margin-top:2px;">📍 PLZ ${rep.plz}</div>
          <div style="font-size:12px;color:hsl(210,80%,50%);font-weight:600;margin-top:2px;">60 km Umkreis</div>
        </div>
      `);
      marker.addTo(group);
    });
  }, [salesReps, showSales]);

  // Place contractor markers
  useEffect(() => {
    const group = layersRef.current?.contractorGroup;
    if (!group) return;
    group.clearLayers();
    if (!showContractors) return;

    contractors.forEach(c => {
      const isActive = c.status === 'active';
      const color = isActive ? 'hsl(142, 71%, 45%)' : 'hsl(25, 95%, 53%)';

      // Wunschradius circle
      L.circle([c.lat, c.lng], {
        radius: c.wunschRadiusKm * 1000,
        color,
        fillColor: color,
        fillOpacity: 0.06,
        weight: 1.5,
      }).addTo(group);

      // Marker
      const marker = L.marker([c.lat, c.lng], {
        icon: createMarkerIcon(color, isActive ? '✓' : '⏳'),
      });
      marker.bindPopup(`
        <div style="font-family:ui-sans-serif,system-ui,sans-serif;min-width:140px;">
          <div style="font-weight:700;font-size:14px;color:#111;">${c.name}</div>
          <div style="font-size:12px;color:#666;margin-top:2px;">📍 ${c.plz} ${c.ort}</div>
          <div style="font-size:12px;color:${color};font-weight:600;margin-top:2px;">
            ${isActive ? '✅ Aktiv' : '🔶 Onboarding'} · ${c.wunschRadiusKm} km
          </div>
        </div>
      `);
      marker.addTo(group);
    });
  }, [contractors, showContractors]);

  const activeCount = contractors.filter(c => c.status === 'active').length;
  const onboardingCount = contractors.filter(c => c.status === 'onboarding').length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="mb-6">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Hiring-Map</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {salesReps.length} Vertriebler · {activeCount} Aktive · {onboardingCount} Onboarding
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{isOpen ? '▼' : '▶'}</span>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Toggle buttons + Legend */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Button
                variant={showSales ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => setShowSales(!showSales)}
              >
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: 'hsl(210, 80%, 50%)' }} />
                Vertriebler
              </Button>
              <Button
                variant={showContractors ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => setShowContractors(!showContractors)}
              >
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: 'hsl(142, 71%, 45%)' }} />
                Aktive
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: 'hsl(25, 95%, 53%)' }} />
                Onboarding
              </Button>
            </div>

            {/* Map container */}
            <div className="relative rounded-lg overflow-hidden border border-border" style={{ height: 400 }}>
              {(isLoading || isGeocoding) && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-card/90 backdrop-blur-sm border border-border rounded-full px-4 py-2 flex items-center gap-2 shadow-md">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {isLoading ? 'Daten laden…' : 'Standorte geocoden…'}
                  </span>
                </div>
              )}
              <div ref={containerRef} className="h-full w-full" />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
