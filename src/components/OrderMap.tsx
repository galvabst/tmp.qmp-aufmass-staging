import { useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  AUFTRAGSTYP_LABELS,
  OBJECT_ORDER_STATUS_LABELS,
  ObjectOrderStatusEnum,
  AuftragstypEnum,
} from '@/lib/enums';

// Fix for default marker icons in Leaflet with bundlers
// (needs to run once at module load)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface OrderMapItem {
  id: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  postalCode: string;
  status: ObjectOrderStatusEnum;
  type: AuftragstypEnum;
  amount: number;
}

interface OrderMapProps {
  orders: OrderMapItem[];
  onOrderClick?: (orderId: string) => void;
  className?: string;
}

const statusColors: Record<ObjectOrderStatusEnum, string> = {
  draft: '#6b7280',
  published: '#3b82f6',
  booked: '#6366f1',
  in_progress: '#f59e0b',
  submitted: '#a855f7',
  in_review: '#06b6d4',
  rework_required: '#f97316',
  approved: '#22c55e',
  rejected_ko: '#ef4444',
  cancelled: '#9ca3af',
};

function createColoredIcon(color: string) {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
}

function buildPopupHtml(order: OrderMapItem) {
  const statusColor = statusColors[order.status] || '#6b7280';

  return `
    <div style="min-width: 180px; padding: 4px; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;">
      <div style="font-weight: 600; margin-bottom: 4px; color: #111;">${order.address}</div>
      <div style="font-size: 12px; color: #666; margin-bottom: 8px;">${order.postalCode} ${order.city}</div>

      <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px;">
        <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: ${statusColor}; color: white;">
          ${OBJECT_ORDER_STATUS_LABELS[order.status]}
        </span>
        <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; border: 1px solid #ddd; background: white; color: #111;">
          ${AUFTRAGSTYP_LABELS[order.type]}
        </span>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 8px;">
        <span style="font-weight: 600; color: #111;">€${order.amount.toFixed(2)}</span>
        <span style="font-size: 12px; color: #3b82f6; text-decoration: underline;">Marker klicken → Details</span>
      </div>
    </div>
  `;
}

export function OrderMap({ orders, onOrderClick, className }: OrderMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return; // React StrictMode guard

    const germanyCenter: L.LatLngExpression = [51.1657, 10.4515];

    const map = L.map(containerRef.current, {
      center: germanyCenter,
      zoom: 6,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const markers = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersRef.current = markers;

    return () => {
      markers.clearLayers();
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  // Update markers when orders change
  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!map || !markers) return;

    markers.clearLayers();

    orders.forEach((order) => {
      const marker = L.marker([order.lat, order.lng], {
        icon: createColoredIcon(statusColors[order.status] || '#6b7280'),
      });

      marker.bindPopup(buildPopupHtml(order));

      if (onOrderClick) {
        marker.on('click', () => onOrderClick(order.id));
      }

      marker.addTo(markers);
    });
  }, [orders, onOrderClick]);

  return (
    <div className={className}>
      <div ref={containerRef} className="h-full w-full rounded-lg" />
    </div>
  );
}

