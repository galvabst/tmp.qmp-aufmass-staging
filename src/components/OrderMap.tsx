import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { ObjectOrderStatusEnum, AuftragstypEnum, OBJECT_ORDER_STATUS_LABELS, AUFTRAGSTYP_LABELS } from '@/lib/enums';

// Fix for default marker icons in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
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

// Status to marker color mapping
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
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
}

// Simple popup content component to avoid React context issues
function OrderPopupContent({ order, onOrderClick }: { order: OrderMapItem; onOrderClick?: (id: string) => void }) {
  return (
    <div style={{ minWidth: '180px', padding: '4px' }}>
      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{order.address}</div>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
        {order.postalCode} {order.city}
      </div>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
        <span style={{ 
          fontSize: '11px', 
          padding: '2px 6px', 
          borderRadius: '4px', 
          backgroundColor: statusColors[order.status] || '#6b7280',
          color: 'white'
        }}>
          {OBJECT_ORDER_STATUS_LABELS[order.status]}
        </span>
        <span style={{ 
          fontSize: '11px', 
          padding: '2px 6px', 
          borderRadius: '4px', 
          border: '1px solid #ddd',
          backgroundColor: 'white'
        }}>
          {AUFTRAGSTYP_LABELS[order.type]}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '8px' }}>
        <span style={{ fontWeight: 500 }}>€{order.amount.toFixed(2)}</span>
        {onOrderClick && (
          <button 
            onClick={() => onOrderClick(order.id)}
            style={{ 
              fontSize: '12px', 
              color: '#3b82f6', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Details →
          </button>
        )}
      </div>
    </div>
  );
}

export function OrderMap({ orders, onOrderClick, className }: OrderMapProps) {
  // Germany center coordinates
  const germanyCenter: [number, number] = [51.1657, 10.4515];
  const defaultZoom = 6;

  if (orders.length === 0) {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
        <p style={{ color: '#666' }}>Keine Aufträge auf der Karte</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <MapContainer
        center={germanyCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {orders.map((order) => (
          <Marker
            key={order.id}
            position={[order.lat, order.lng]}
            icon={createColoredIcon(statusColors[order.status] || '#6b7280')}
          >
            <Popup>
              <OrderPopupContent order={order} onOrderClick={onOrderClick} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
