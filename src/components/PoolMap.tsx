import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Order } from '@/types/order';

// Fix for default marker icons in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface PoolMapProps {
  orders: Order[];
  onOrderClick?: (orderId: string) => void;
}

const PROJECT_TYPE_COLORS: Record<string, string> = {
  'Küche': '#22c55e',
  'Schrank': '#3b82f6',
  'Bad': '#06b6d4',
  'Garderobe': '#a855f7',
  'Wohnzimmer': '#f59e0b',
};

function createColoredIcon(color: string) {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 3px 6px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

function buildPopupHtml(order: Order) {
  const typeColor = PROJECT_TYPE_COLORS[order.projectType] || '#6b7280';
  
  return `
    <div style="min-width: 200px; padding: 8px; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;">
      <div style="font-weight: 600; font-size: 15px; margin-bottom: 4px; color: #111;">
        ${order.customerName}
      </div>
      <div style="font-size: 13px; color: #666; margin-bottom: 8px;">
        ${order.address}<br/>
        ${order.postalCode} ${order.city}
      </div>

      <div style="display: inline-block; font-size: 12px; padding: 3px 8px; border-radius: 6px; background: ${typeColor}; color: white; font-weight: 500; margin-bottom: 8px;">
        ${order.projectType}
      </div>

      <div style="font-size: 13px; color: #444; border-top: 1px solid #eee; padding-top: 8px;">
        📅 ${new Date(order.scheduledDate).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })} um ${order.scheduledTime} Uhr
      </div>
      
      <div style="font-size: 12px; color: #3b82f6; margin-top: 8px; text-align: center;">
        Tippen für Details →
      </div>
    </div>
  `;
}

export function PoolMap({ orders, onOrderClick }: PoolMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    // Center on Bavaria/Munich area for demo
    const centerPoint: L.LatLngExpression = [48.3, 11.4];

    const map = L.map(containerRef.current, {
      center: centerPoint,
      zoom: 8,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
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

    const validOrders = orders.filter(o => o.lat && o.lng);

    validOrders.forEach((order) => {
      const color = PROJECT_TYPE_COLORS[order.projectType] || '#6b7280';
      const marker = L.marker([order.lat!, order.lng!], {
        icon: createColoredIcon(color),
      });

      marker.bindPopup(buildPopupHtml(order));

      if (onOrderClick) {
        marker.on('click', () => onOrderClick(order.id));
      }

      marker.addTo(markers);
    });

    // Fit bounds if we have orders
    if (validOrders.length > 0) {
      const bounds = L.latLngBounds(validOrders.map(o => [o.lat!, o.lng!]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [orders, onOrderClick]);

  return (
    <div ref={containerRef} className="h-full w-full rounded-lg border border-border" />
  );
}
