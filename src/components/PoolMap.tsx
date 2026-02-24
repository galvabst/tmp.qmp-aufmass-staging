import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { TechnicianOrder } from '@/types/technician';
import { geocodePlzBatch, PlzCoordinate } from '@/features/pool/utils/plz-geocoder';
import { Loader2 } from 'lucide-react';

interface PoolMapProps {
  orders: TechnicianOrder[];
  onOrderClick?: (auftragId: string) => void;
  isVisible?: boolean;
}

interface PlzCluster {
  plz: string;
  city: string;
  orders: TechnicianOrder[];
}

/** Deduplicate orders by auftragId, keep first entry per auftrag */
function deduplicateByAuftrag(orders: TechnicianOrder[]): TechnicianOrder[] {
  const seen = new Map<string, TechnicianOrder>();
  for (const o of orders) {
    const key = o.auftragId || o.id;
    if (!seen.has(key)) seen.set(key, o);
  }
  return Array.from(seen.values());
}

/** Group deduplicated orders by postalCode, also build a cityMap for fallback geocoding */
function groupByPlz(orders: TechnicianOrder[]): { clusters: Map<string, PlzCluster>; cityMap: Map<string, string> } {
  const clusters = new Map<string, PlzCluster>();
  const cityMap = new Map<string, string>();
  for (const o of orders) {
    if (!o.postalCode || o.postalCode.trim().length < 4) continue;
    const plz = o.postalCode.trim();
    const existing = clusters.get(plz);
    if (existing) {
      existing.orders.push(o);
    } else {
      clusters.set(plz, { plz, city: o.city || '', orders: [o] });
    }
    // Store city for fallback geocoding
    if (o.city && o.city.trim().length > 0 && !cityMap.has(plz)) {
      cityMap.set(plz, o.city.trim());
    }
  }
  return { clusters, cityMap };
}

function createClusterIcon(count: number) {
  const size = count >= 5 ? 48 : count >= 3 ? 40 : 32;
  const fontSize = count >= 5 ? 16 : count >= 3 ? 14 : 13;
  return L.divIcon({
    className: '',
    html: `<div style="
      background: #f97316;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 3px 8px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: ${fontSize}px;
      font-family: ui-sans-serif, system-ui, sans-serif;
    ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

function buildClusterPopup(cluster: PlzCluster): string {
  const header = `${cluster.plz} ${cluster.city}`;
  const countLabel = cluster.orders.length === 1 ? '1 Auftrag' : `${cluster.orders.length} Aufträge`;

  const items = cluster.orders
    .map((o) => {
      const auftragId = o.auftragId || o.id;
      const date = new Date(o.scheduledDate).toLocaleDateString('de-DE', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      return `<div class="pool-popup-item" data-auftrag-id="${auftragId}" style="padding:6px 0;border-bottom:1px solid #f0f0f0;cursor:pointer;">
        <div style="font-weight:600;font-size:14px;color:#111;">${o.customerName}</div>
        <div style="font-size:12px;color:#666;">📅 ${date} · ${o.scheduledTime}</div>
      </div>`;
    })
    .join('');

  return `<div style="min-width:200px;max-width:280px;font-family:ui-sans-serif,system-ui,sans-serif;padding:4px;">
    <div style="font-weight:700;font-size:15px;color:#111;margin-bottom:2px;">${header}</div>
    <div style="font-size:12px;color:#f97316;font-weight:600;margin-bottom:8px;">${countLabel}</div>
    <div>${items}</div>
  </div>`;
}

export function PoolMap({ orders, onOrderClick, isVisible = true }: PoolMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [coords, setCoords] = useState<Map<string, PlzCoordinate>>(new Map());

  // Deduplicate & cluster, extract cityMap for fallback
  const { clusters, cityMap } = useMemo(() => {
    const deduped = deduplicateByAuftrag(orders);
    return groupByPlz(deduped);
  }, [orders]);

  // Geocode unique PLZs (parallel, with city fallback)
  useEffect(() => {
    const plzList = Array.from(clusters.keys());
    if (plzList.length === 0) {
      setCoords(new Map());
      return;
    }

    let cancelled = false;
    setIsGeocoding(true);

    geocodePlzBatch(plzList, cityMap).then((result) => {
      if (!cancelled) {
        setCoords(result);
        setIsGeocoding(false);
      }
    });

    return () => { cancelled = true; };
  }, [clusters, cityMap]);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [51.2, 10.5],
      zoom: 6,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  // invalidateSize when becoming visible
  useEffect(() => {
    if (isVisible && mapRef.current) {
      // Small delay to let CSS transition complete
      setTimeout(() => mapRef.current?.invalidateSize(), 50);
    }
  }, [isVisible]);

  // Place markers
  useEffect(() => {
    const map = mapRef.current;
    const markerGroup = markersRef.current;
    if (!map || !markerGroup) return;

    markerGroup.clearLayers();

    const bounds: L.LatLngExpression[] = [];

    clusters.forEach((cluster, plz) => {
      const coord = coords.get(plz);
      if (!coord) return;

      const marker = L.marker([coord.lat, coord.lng], {
        icon: createClusterIcon(cluster.orders.length),
      });

      const popup = L.popup({ maxWidth: 300 }).setContent(
        buildClusterPopup(cluster)
      );
      marker.bindPopup(popup);

      marker.on('popupopen', () => {
        const popupEl = marker.getPopup()?.getElement();
        if (!popupEl) return;
        const items = popupEl.querySelectorAll('.pool-popup-item');
        items.forEach((item) => {
          item.addEventListener('click', () => {
            const auftragId = item.getAttribute('data-auftrag-id');
            if (auftragId && onOrderClick) onOrderClick(auftragId);
          });
        });
      });

      marker.addTo(markerGroup);
      bounds.push([coord.lat, coord.lng]);
    });

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 10 });
    }
  }, [clusters, coords, onOrderClick]);

  return (
    <div className="relative h-full w-full">
      {isGeocoding && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-card/90 backdrop-blur-sm border border-border rounded-full px-4 py-2 flex items-center gap-2 shadow-md">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Standorte laden…</span>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full rounded-lg border border-border" />
    </div>
  );
}
