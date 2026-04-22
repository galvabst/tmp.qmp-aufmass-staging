import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { Loader2, Map as MapIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAdminHiringMap, SalesRepMapEntry, ContractorMapEntry, ThcOrderMapEntry, ContractorMapAction } from '../hooks/useAdminHiringMap';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface AdminHiringMapProps {
  /** Optional callback to open the contractor detail view in a parent tab */
  onSelectContractor?: (profileId: string) => void;
}

interface PendingAction {
  contractorId: string;
  onboardingId: string;
  contractorName: string;
  action: ContractorMapAction;
}

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
    const radius = 0.008;
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

function generateMonthOptions(count: number): { date: Date | null; label: string }[] {
  const months: { date: Date | null; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
    months.push({ date: d, label });
  }
  months.reverse();
  // Add "Gesamt" at the end
  months.push({ date: null, label: 'Gesamt' });
  return months;
}

export function AdminHiringMap({ onSelectContractor }: AdminHiringMapProps = {}) {
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const { salesReps, contractors, thcOrders, isLoading, isGeocoding, setContractorOnboardingStatus } =
    useAdminHiringMap(selectedMonth);
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    salesGroup: L.LayerGroup;
    contractorGroup: L.LayerGroup;
    thcGroup: L.LayerGroup;
    heatLayer: L.Layer | null;
  } | null>(null);

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  // Use refs so popup event handlers always see latest props (popups outlive renders)
  const onSelectContractorRef = useRef(onSelectContractor);
  useEffect(() => { onSelectContractorRef.current = onSelectContractor; }, [onSelectContractor]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    salesGroup: L.LayerGroup;
    contractorGroup: L.LayerGroup;
    thcGroup: L.LayerGroup;
    heatLayer: L.Layer | null;
  } | null>(null);
  
  const [isOpen, setIsOpen] = useState(true);
  const [showSales, setShowSales] = useState(true);
  const [showActive, setShowActive] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showThcOrders, setShowThcOrders] = useState(false); // Default off — heatmap is primary
  const [showHeatmap, setShowHeatmap] = useState(true);

  const monthOptions = useMemo(() => generateMonthOptions(6), []);

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

    layersRef.current = { salesGroup, contractorGroup, thcGroup, heatLayer: null };
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
      L.circle([rep.lat, rep.lng], {
        radius: rep.radiusKm * 1000,
        color: 'hsl(210, 80%, 55%)',
        fillColor: 'hsl(210, 80%, 60%)',
        fillOpacity: 0.12,
        weight: 2.5,
      }).addTo(group);

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
    if (!showActive && !showOnboarding) return;

    const filteredContractors = contractors.filter(c => {
      if (c.status === 'active') return showActive;
      if (c.status === 'inaktiv') return showActive; // inaktive follow active toggle
      return showOnboarding; // onboarding
    });

    const offsets = applySpiderOffset(filteredContractors.map(c => ({ lat: c.lat, lng: c.lng })));

    filteredContractors.forEach((c, idx) => {
      const isActive = c.status === 'active';
      const isInaktiv = c.status === 'inaktiv';
      const color = isInaktiv ? 'hsl(0, 0%, 65%)' : isActive ? 'hsl(142, 71%, 45%)' : 'hsl(25, 95%, 53%)';
      const pos = offsets[idx];

      L.circle([c.lat, c.lng], {
        radius: c.wunschRadiusKm * 1000,
        color,
        fillColor: color,
        fillOpacity: isInaktiv ? 0.03 : 0.06,
        weight: 1.5,
        dashArray: isInaktiv ? '6 4' : undefined,
        opacity: isInaktiv ? 0.4 : 1,
      }).addTo(group);

      const icon = c.avatarUrl
        ? createAvatarIcon(c.avatarUrl, color)
        : createMarkerIcon(color, isActive ? '✓' : isInaktiv ? '⏸' : '⏳');

      const marker = L.marker([pos.lat, pos.lng], { icon });
      marker.bindPopup(() => {
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
              ${isInaktiv ? '⏸️ Inaktiv' : isActive ? '✅ Aktiv' : '🔶 Onboarding'} · ${c.wunschRadiusKm} km
            </div>
            <div style="font-size:12px;color:hsl(280,70%,50%);font-weight:600;margin-top:4px;">
              🔥 ${thcCount} THC${thcCount !== 1 ? 's' : ''} im Umkreis
            </div>
          </div>
        `;
      });
      marker.addTo(group);
    });
  }, [contractors, showActive, showOnboarding, thcOrders]);

  // Place THC order markers (detail dots) — off by default
  useEffect(() => {
    const group = layersRef.current?.thcGroup;
    if (!group) return;
    group.clearLayers();
    if (!showThcOrders) return;

    thcOrders.forEach(order => {
      const size = Math.min(Math.max(order.count * 2, 6), 15);
      const opacity = Math.min(0.2 + order.count * 0.05, 0.4);

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

  // Heatmap layer — visible at ALL zoom levels
  useEffect(() => {
    const map = mapRef.current;
    const layers = layersRef.current;
    if (!map || !layers) return;

    if (layers.heatLayer) {
      map.removeLayer(layers.heatLayer);
      layers.heatLayer = null;
    }

    if (!showHeatmap || thcOrders.length === 0) return;

    const maxCount = Math.max(...thcOrders.map(o => o.count), 1);
    const heatData: [number, number, number][] = thcOrders.map(o => [
      o.lat,
      o.lng,
      o.count / maxCount,
    ]);

    const heat = (L as any).heatLayer(heatData, {
      radius: 25,
      blur: 20,
      maxZoom: 18,
      max: 1,
      minOpacity: 0.3,
      gradient: {
        0.0: '#00ff00',
        0.3: '#adff2f',
        0.5: '#ffff00',
        0.7: '#ffa500',
        1.0: '#ff0000',
      },
    });

    heat.addTo(map);
    layers.heatLayer = heat;
  }, [thcOrders, showHeatmap]);

  const activeCount = contractors.filter(c => c.status === 'active').length;
  const onboardingCount = contractors.filter(c => c.status === 'onboarding').length;
  const totalThc = thcOrders.reduce((s, o) => s + o.count, 0);

  const selectedMonthLabel = selectedMonth
    ? selectedMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
    : 'Gesamt';

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
            {/* Toggle buttons */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
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
                variant={showActive ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => setShowActive(!showActive)}
              >
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: 'hsl(142, 71%, 45%)' }} />
                Aktive
              </Button>
              <Button
                variant={showOnboarding ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => setShowOnboarding(!showOnboarding)}
              >
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
                THC-Punkte
              </Button>
              <Button
                variant={showHeatmap ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => setShowHeatmap(!showHeatmap)}
              >
                🔥 Heatmap
              </Button>
              <span className="text-xs text-muted-foreground ml-1">
                {totalThc} THCs {selectedMonth ? `im ${selectedMonthLabel}` : '(Gesamt)'}
              </span>
            </div>

            {/* Month selector */}
            <div className="flex flex-wrap items-center gap-1 mb-3">
              {monthOptions.map(opt => {
                const isActive = selectedMonth === null
                  ? opt.date === null
                  : opt.date !== null &&
                    opt.date.getFullYear() === selectedMonth.getFullYear() &&
                    opt.date.getMonth() === selectedMonth.getMonth();
                return (
                  <button
                    key={opt.label}
                    onClick={() => setSelectedMonth(opt.date)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
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
