import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Loader2, Map as MapIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAdminHiringMap, SalesRepMapEntry, ContractorMapEntry, ThcOrderMapEntry } from '../hooks/useAdminHiringMap';
import { Button } from '@/components/ui/button';

/** Haversine distance in km */
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Offset overlapping markers at the same lat/lng so they're all visible */
function applySpiderOffset(items: { lat: number; lng: number }[]): { lat: number; lng: number }[] {
  const groups = new Map<string, number[]>();
  items.forEach((item, i) => {
    const key = `${item.lat.toFixed(4)}_${item.lng.toFixed(4)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(i);
  });

  const result = items.map(item => ({ lat: item.lat, lng: item.lng }));

  groups.forEach(indices => {
    if (indices.length < 2) return;
    const radius = 0.008; // ~800m offset for visibility
    indices.forEach((idx, i) => {
      const angle = (2 * Math.PI * i) / indices.length;
      result[idx].lat += radius * Math.cos(angle);
      result[idx].lng += radius * Math.sin(angle);
    });
  });

  return result;
}

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

function createAvatarIcon(avatarUrl: string, borderColor: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 3px solid ${borderColor};
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      overflow: hidden;
      background: #e5e7eb;
    "><img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='👤'" /></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -22],
  });
}

export function AdminHiringMap() {
  const { salesReps, contractors, thcOrders, isLoading, isGeocoding } = useAdminHiringMap();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    salesGroup: L.LayerGroup;
    contractorGroup: L.LayerGroup;
    thcGroup: L.LayerGroup;
  } | null>(null);
  
  const [isOpen, setIsOpen] = useState(true);
  const [showSales, setShowSales] = useState(true);
  const [showContractors, setShowContractors] = useState(true);
  const [showThcOrders, setShowThcOrders] = useState(true);

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
    const thcGroup = L.layerGroup().addTo(map);

    layersRef.current = { salesGroup, contractorGroup, thcGroup };
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

    // Apply spider offset to prevent overlapping markers
    const offsets = applySpiderOffset(contractors.map(c => ({ lat: c.lat, lng: c.lng })));

    contractors.forEach((c, idx) => {
      const isActive = c.status === 'active';
      const color = isActive ? 'hsl(142, 71%, 45%)' : 'hsl(25, 95%, 53%)';
      const pos = offsets[idx];

      // Wunschradius circle (use original position for accurate radius)
      L.circle([c.lat, c.lng], {
        radius: c.wunschRadiusKm * 1000,
        color,
        fillColor: color,
        fillOpacity: 0.06,
        weight: 1.5,
      }).addTo(group);

      // Marker – use avatar if available
      const icon = c.avatarUrl
        ? createAvatarIcon(c.avatarUrl, color)
        : createMarkerIcon(color, isActive ? '✓' : '⏳');

      const marker = L.marker([pos.lat, pos.lng], { icon });
      // THC count will be added when thcOrders are available via a separate binding
      marker.bindPopup(() => {
        // Dynamically calculate THC count at popup open time
        let thcCount = 0;
        thcOrders.forEach(o => {
          const d = getDistanceKm(c.lat, c.lng, o.lat, o.lng);
          if (d <= c.wunschRadiusKm) thcCount += o.count;
        });
        return `
          <div style="font-family:ui-sans-serif,system-ui,sans-serif;min-width:140px;">
            <div style="font-weight:700;font-size:14px;color:#111;">${c.name}</div>
            <div style="font-size:12px;color:#666;margin-top:2px;">📍 ${c.plz} ${c.ort}</div>
            <div style="font-size:12px;color:${color};font-weight:600;margin-top:2px;">
              ${isActive ? '✅ Aktiv' : '🔶 Onboarding'} · ${c.wunschRadiusKm} km
            </div>
            <div style="font-size:12px;color:hsl(280,70%,50%);font-weight:600;margin-top:4px;">
              🔥 ${thcCount} THC${thcCount !== 1 ? 's' : ''} im Umkreis
            </div>
          </div>
        `;
      });
      marker.addTo(group);
    });
  }, [contractors, showContractors]);

  // Place THC order markers
  useEffect(() => {
    const group = layersRef.current?.thcGroup;
    if (!group) return;
    group.clearLayers();
    if (!showThcOrders) return;

    thcOrders.forEach(order => {
      const size = Math.min(Math.max(order.count * 3, 10), 40);
      const opacity = Math.min(0.3 + order.count * 0.07, 0.85);

      L.circleMarker([order.lat, order.lng], {
        radius: size / 2,
        color: 'hsl(280, 70%, 50%)',
        fillColor: 'hsl(280, 70%, 50%)',
        fillOpacity: opacity,
        weight: 1,
      })
        .bindPopup(`
          <div style="font-family:ui-sans-serif,system-ui,sans-serif;min-width:120px;">
            <div style="font-weight:700;font-size:14px;color:#111;">📍 ${order.plz} ${order.ort}</div>
            <div style="font-size:13px;color:hsl(280,70%,50%);font-weight:600;margin-top:4px;">
              ${order.count} Thermocheck${order.count > 1 ? 's' : ''}
            </div>
          </div>
        `)
        .addTo(group);
    });
  }, [thcOrders, showThcOrders]);

  // Count THCs in radius for each contractor
  const getThcCountInRadius = (lat: number, lng: number, radiusKm: number) => {
    let count = 0;
    thcOrders.forEach(o => {
      const d = getDistanceKm(lat, lng, o.lat, o.lng);
      if (d <= radiusKm) count += o.count;
    });
    return count;
  };

  const activeCount = contractors.filter(c => c.status === 'active').length;
  const onboardingCount = contractors.filter(c => c.status === 'onboarding').length;
  const totalThc = thcOrders.reduce((s, o) => s + o.count, 0);

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
                  {salesReps.length} Vertriebler · {activeCount} Aktive · {onboardingCount} Onboarding · {totalThc} THCs
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
              <Button
                variant={showThcOrders ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => setShowThcOrders(!showThcOrders)}
              >
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: 'hsl(280, 70%, 50%)' }} />
                Thermochecks ({totalThc})
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
