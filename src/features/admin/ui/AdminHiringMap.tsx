import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { Loader2, Map as MapIcon, EyeOff, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAdminHiringMap, SalesRepMapEntry, ContractorMapEntry, ThcOrderMapEntry, ContractorMapAction } from '../hooks/useAdminHiringMap';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const HIDDEN_SALES_LS_KEY = 'admin-hiring-map:hidden-sales-rep-ids';

interface AdminHiringMapProps {
  /** Optional callback to open the contractor detail view in a parent tab */
  onSelectContractor?: (profileId: string) => void;
}

interface PendingAction {
  contractorId: string;
  onboardingId: string;
  contractorName: string;
  action: ContractorMapAction | 'promote-trainer' | 'demote-trainer';
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

function createAvatarIcon(avatarUrl: string, borderColor: string, isTrainer: boolean = false) {
  const trainerBadge = isTrainer
    ? `<div style="position:absolute;top:-4px;right:-4px;width:16px;height:16px;border-radius:50%;background:hsl(45,93%,55%);border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:9px;line-height:1;box-shadow:0 1px 3px rgba(0,0,0,0.4);">★</div>`
    : '';
  const ringStyle = isTrainer
    ? `border: 4px solid hsl(280,70%,55%); box-shadow: 0 0 0 2px white, 0 2px 8px rgba(0,0,0,0.4);`
    : `border: 3px solid ${borderColor}; box-shadow: 0 2px 8px rgba(0,0,0,0.35);`;
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:36px;height:36px;">
      <div style="
        width: 36px;
        height: 36px;
        border-radius: 50%;
        ${ringStyle}
        overflow: hidden;
        background: #e5e7eb;
      "><img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='👤'" /></div>
      ${trainerBadge}
    </div>`,
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

  const { salesReps, contractors, thcOrders, isLoading, isGeocoding, setContractorOnboardingStatus, setContractorTrainerStatus } =
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
  
  const [isOpen, setIsOpen] = useState(true);
  const [showSales, setShowSales] = useState(true);
  const [showActive, setShowActive] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showTrainers, setShowTrainers] = useState(true);
  const [showThcOrders, setShowThcOrders] = useState(false); // Default off — heatmap is primary
  const [showHeatmap, setShowHeatmap] = useState(true);

  // Per-Vertriebler ausblenden (persistiert in localStorage)
  const [hiddenSalesIds, setHiddenSalesIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = window.localStorage.getItem(HIDDEN_SALES_LS_KEY);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(HIDDEN_SALES_LS_KEY, JSON.stringify(Array.from(hiddenSalesIds)));
    } catch {
      /* ignore */
    }
  }, [hiddenSalesIds]);

  const toggleSalesRepHidden = (id: string) => {
    setHiddenSalesIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleSalesReps = useMemo(
    () => salesReps.filter(r => !hiddenSalesIds.has(r.id)),
    [salesReps, hiddenSalesIds]
  );

  const sortedSalesReps = useMemo(
    () => [...salesReps].sort((a, b) => a.name.localeCompare(b.name, 'de')),
    [salesReps]
  );

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

    visibleSalesReps.forEach(rep => {
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
  }, [visibleSalesReps, showSales]);

  // Place contractor markers
  useEffect(() => {
    const group = layersRef.current?.contractorGroup;
    if (!group) return;
    group.clearLayers();
    if (!showActive && !showOnboarding && !showTrainers) return;

    const filteredContractors = contractors.filter(c => {
      // Trainers always visible if showTrainers is on, regardless of status
      if (c.isTrainer && showTrainers) return true;
      if (c.status === 'active') return showActive;
      if (c.status === 'inaktiv') return showActive; // inaktive follow active toggle
      return showOnboarding; // onboarding
    });

    const offsets = applySpiderOffset(filteredContractors.map(c => ({ lat: c.lat, lng: c.lng })));

    filteredContractors.forEach((c, idx) => {
      const isActive = c.status === 'active';
      const isInaktiv = c.status === 'inaktiv';
      const baseColor = isInaktiv ? 'hsl(0, 0%, 65%)' : isActive ? 'hsl(142, 71%, 45%)' : 'hsl(25, 95%, 53%)';
      const color = c.isTrainer ? 'hsl(280, 70%, 55%)' : baseColor;
      const pos = offsets[idx];

      L.circle([c.lat, c.lng], {
        radius: c.wunschRadiusKm * 1000,
        color,
        fillColor: color,
        fillOpacity: isInaktiv ? 0.03 : c.isTrainer ? 0.08 : 0.06,
        weight: c.isTrainer ? 2 : 1.5,
        dashArray: isInaktiv ? '6 4' : undefined,
        opacity: isInaktiv ? 0.4 : 1,
      }).addTo(group);

      const icon = c.avatarUrl
        ? createAvatarIcon(c.avatarUrl, color, c.isTrainer)
        : createMarkerIcon(color, c.isTrainer ? '★' : isActive ? '✓' : isInaktiv ? '⏸' : '⏳');

      const marker = L.marker([pos.lat, pos.lng], { icon });
      marker.bindPopup(() => {
        let thcCount = 0;
        thcOrders.forEach(o => {
          const d = getDistanceKm(c.lat, c.lng, o.lat, o.lng);
          if (d <= c.wunschRadiusKm) thcCount += o.count;
        });
        const trainerToggleHtml = c.isTrainer
          ? `<button data-action="demote-trainer" style="flex:1;padding:6px 10px;font-size:12px;font-weight:600;border:1px solid hsl(280,70%,55%);background:white;color:hsl(280,70%,40%);border-radius:6px;cursor:pointer;">★ Trainer-Status entfernen</button>`
          : `<button data-action="promote-trainer" style="flex:1;padding:6px 10px;font-size:12px;font-weight:600;border:1px solid hsl(280,70%,55%);background:hsl(280,70%,55%);color:white;border-radius:6px;cursor:pointer;">★ Zum Trainer befördern</button>`;
        const actionsHtml = isInaktiv
          ? `<button data-action="reactivate" style="flex:1;padding:6px 10px;font-size:12px;font-weight:600;border:1px solid hsl(142,71%,45%);background:hsl(142,71%,45%);color:white;border-radius:6px;cursor:pointer;">▶ Reaktivieren</button>`
          : `<button data-action="pause" style="flex:1;padding:6px 10px;font-size:12px;font-weight:600;border:1px solid hsl(45,93%,47%);background:hsl(45,93%,47%);color:white;border-radius:6px;cursor:pointer;">⏸ Pausieren</button>
             <button data-action="fire" style="flex:1;padding:6px 10px;font-size:12px;font-weight:600;border:1px solid hsl(0,84%,55%);background:hsl(0,84%,55%);color:white;border-radius:6px;cursor:pointer;">🚫 Feuern</button>`;
        const trainerBadgeHtml = c.isTrainer
          ? `<div style="display:inline-block;margin-left:6px;padding:1px 6px;background:hsl(280,70%,55%);color:white;font-size:10px;font-weight:700;border-radius:8px;vertical-align:middle;">★ TRAINER</div>`
          : '';
        return `
          <div class="hiring-map-popup" data-onboarding-id="${c.onboardingId}" data-profile-id="${c.id}" data-contractor-name="${c.name.replace(/"/g, '&quot;')}" style="font-family:ui-sans-serif,system-ui,sans-serif;min-width:220px;">
            <div style="font-weight:700;font-size:14px;color:#111;">${c.name}${trainerBadgeHtml}</div>
            <div style="font-size:12px;color:#666;margin-top:2px;">📍 ${c.plz} ${c.ort}</div>
            <div style="font-size:12px;color:${color};font-weight:600;margin-top:2px;">
              ${isInaktiv ? '⏸️ Inaktiv' : isActive ? '✅ Aktiv' : '🔶 Onboarding'} · ${c.wunschRadiusKm} km
            </div>
            <div style="font-size:12px;color:hsl(280,70%,50%);font-weight:600;margin-top:4px;">
              🔥 ${thcCount} THC${thcCount !== 1 ? 's' : ''} im Umkreis
            </div>
            <div style="margin-top:10px;padding-top:8px;border-top:1px solid #e5e7eb;display:flex;flex-direction:column;gap:6px;">
              <button data-action="open-profile" style="padding:6px 10px;font-size:12px;font-weight:600;border:1px solid #d1d5db;background:white;color:#111;border-radius:6px;cursor:pointer;">👤 Profil öffnen</button>
              <div style="display:flex;gap:6px;">${trainerToggleHtml}</div>
              <div style="display:flex;gap:6px;">${actionsHtml}</div>
            </div>
          </div>
        `;
      });
      const handlePopupClick = (ev: Event) => {
        const target = ev.target as HTMLElement;
        const btn = target.closest('button[data-action]') as HTMLElement | null;
        if (!btn) return;
        ev.preventDefault();
        ev.stopPropagation();
        const action = btn.dataset.action;
        const popupEl = marker.getPopup()?.getElement();
        const root = popupEl?.querySelector('.hiring-map-popup') as HTMLElement | null;
        const onboardingId = root?.dataset.onboardingId || '';
        const profileId = root?.dataset.profileId || '';
        const contractorName = root?.dataset.contractorName || '';
        console.log('[HiringMap] Popup-Action:', action, { onboardingId, profileId, contractorName });
        if (action === 'open-profile') {
          marker.closePopup();
          onSelectContractorRef.current?.(profileId);
          return;
        }
        if (
          action === 'pause' ||
          action === 'fire' ||
          action === 'reactivate' ||
          action === 'promote-trainer' ||
          action === 'demote-trainer'
        ) {
          marker.closePopup();
          setPendingAction({
            contractorId: profileId,
            onboardingId,
            contractorName,
            action: action as ContractorMapAction | 'promote-trainer' | 'demote-trainer',
          });
        }
      };
      marker.on('popupopen', () => {
        const popupEl = marker.getPopup()?.getElement();
        if (!popupEl) return;
        // Disable Leaflet's click propagation interception for our buttons
        L.DomEvent.disableClickPropagation(popupEl);
        // Single delegated listener on popup container — survives DOM rebuilds
        popupEl.removeEventListener('click', handlePopupClick);
        popupEl.addEventListener('click', handlePopupClick);
      });
      marker.addTo(group);
    });
  }, [contractors, showActive, showOnboarding, showTrainers, thcOrders]);

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
  const trainerCount = contractors.filter(c => c.isTrainer).length;
  const totalThc = thcOrders.reduce((s, o) => s + o.count, 0);

  const selectedMonthLabel = selectedMonth
    ? selectedMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
    : 'Gesamt';

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    setIsMutating(true);
    try {
      if (pendingAction.action === 'promote-trainer' || pendingAction.action === 'demote-trainer') {
        const promote = pendingAction.action === 'promote-trainer';
        await setContractorTrainerStatus(pendingAction.onboardingId, promote);
        toast({
          title: promote ? 'Zum Trainer befördert' : 'Trainer-Status entfernt',
          description: `${pendingAction.contractorName} ${promote ? 'ist jetzt Trainer.' : 'ist kein Trainer mehr.'}`,
        });
      } else {
        await setContractorOnboardingStatus(pendingAction.onboardingId, pendingAction.action);
        const verbPast =
          pendingAction.action === 'pause' ? 'pausiert'
          : pendingAction.action === 'fire' ? 'endgültig deaktiviert'
          : 'reaktiviert';
        toast({
          title: `Techniker ${verbPast}`,
          description: `${pendingAction.contractorName} wurde erfolgreich ${verbPast}.`,
        });
      }
      setPendingAction(null);
    } catch (err: any) {
      toast({
        title: 'Aktion fehlgeschlagen',
        description: err?.message || 'Bitte erneut versuchen.',
        variant: 'destructive',
      });
    } finally {
      setIsMutating(false);
    }
  };

  const dialogConfig = pendingAction
    ? pendingAction.action === 'pause'
      ? {
          title: 'Techniker pausieren?',
          desc: `${pendingAction.contractorName} wird auf "Inaktiv" gesetzt und erhält keine neuen Aufträge mehr. Auf der Map bleibt er grau sichtbar. Du kannst ihn jederzeit wieder reaktivieren.`,
          confirmText: 'Pausieren',
          destructive: false,
        }
      : pendingAction.action === 'fire'
      ? {
          title: 'Techniker endgültig deaktivieren?',
          desc: `${pendingAction.contractorName} wird gefeuert und verschwindet komplett aus der Map sowie aus allen aktiven Listen. Diese Aktion kann nur durch einen Admin manuell rückgängig gemacht werden.`,
          confirmText: 'Endgültig deaktivieren',
          destructive: true,
        }
      : pendingAction.action === 'promote-trainer'
      ? {
          title: 'Zum Trainer befördern?',
          desc: `${pendingAction.contractorName} wird als Trainer markiert. Trainer können Coachings & Mitfahrten anbieten, sehen den Trainer-Bereich, überspringen die Akademie-Pflicht und sind im Forum als „Trainer" gekennzeichnet.`,
          confirmText: 'Befördern',
          destructive: false,
        }
      : pendingAction.action === 'demote-trainer'
      ? {
          title: 'Trainer-Status entfernen?',
          desc: `${pendingAction.contractorName} verliert den Trainer-Status. Bestehende Mitfahrten/Coaching-Slots bleiben erhalten, neue können nicht mehr angeboten werden.`,
          confirmText: 'Entfernen',
          destructive: false,
        }
      : {
          title: 'Techniker reaktivieren?',
          desc: `${pendingAction.contractorName} wird wieder auf "In Bearbeitung" gesetzt und kann den Onboarding-Prozess fortsetzen.`,
          confirmText: 'Reaktivieren',
          destructive: false,
        }
    : null;

  return (
    <>
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="mb-6">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Hiring-Map</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {visibleSalesReps.length}{hiddenSalesIds.size > 0 ? `/${salesReps.length}` : ''} Vertriebler · {activeCount} Aktive · {onboardingCount} Onboarding · {trainerCount} Trainer · {totalThc} THCs
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
              <div className="inline-flex items-center rounded-md overflow-hidden border border-input">
                <Button
                  variant={showSales ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs gap-1.5 rounded-none border-0"
                  onClick={() => setShowSales(!showSales)}
                >
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: 'hsl(210, 80%, 50%)' }} />
                  Vertriebler
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={showSales ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 px-1.5 rounded-none border-0 border-l border-l-background/30 relative"
                      title="Einzelne Vertriebler ausblenden"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                      {hiddenSalesIds.size > 0 && (
                        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] leading-none rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                          {hiddenSalesIds.size}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0" align="start">
                    <div className="p-3 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold">Vertriebler ausblenden</span>
                      </div>
                      {hiddenSalesIds.size > 0 && (
                        <button
                          onClick={() => setHiddenSalesIds(new Set())}
                          className="text-[11px] text-primary hover:underline"
                        >
                          Alle anzeigen
                        </button>
                      )}
                    </div>
                    <ScrollArea className="max-h-72">
                      <div className="p-1">
                        {sortedSalesReps.length === 0 && (
                          <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                            Keine Vertriebler geladen.
                          </div>
                        )}
                        {sortedSalesReps.map(rep => {
                          const hidden = hiddenSalesIds.has(rep.id);
                          return (
                            <label
                              key={rep.id}
                              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                            >
                              <Checkbox
                                checked={!hidden}
                                onCheckedChange={() => toggleSalesRepHidden(rep.id)}
                              />
                              <span className={`text-xs flex-1 truncate ${hidden ? 'text-muted-foreground line-through' : ''}`}>
                                {rep.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{rep.plz}</span>
                            </label>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>
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

    <AlertDialog open={!!pendingAction} onOpenChange={(open) => { if (!open && !isMutating) setPendingAction(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogConfig?.title}</AlertDialogTitle>
          <AlertDialogDescription>{dialogConfig?.desc}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isMutating}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); handleConfirmAction(); }}
            disabled={isMutating}
            className={dialogConfig?.destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {isMutating ? 'Bitte warten…' : dialogConfig?.confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
