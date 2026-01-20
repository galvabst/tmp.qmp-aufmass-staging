import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Euro, ExternalLink } from 'lucide-react';
import { OBJECT_ORDER_STATUS_CONFIG } from '@/lib/status-config';
import { OBJECT_ORDER_STATUS_LABELS, AUFTRAGSTYP_LABELS, ObjectOrderStatusEnum, AuftragstypEnum } from '@/lib/enums';

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
  draft: '#6b7280',        // gray
  published: '#3b82f6',    // blue (primary)
  booked: '#6366f1',       // indigo
  in_progress: '#f59e0b',  // amber
  submitted: '#a855f7',    // purple
  in_review: '#06b6d4',    // cyan
  rework_required: '#f97316', // orange
  approved: '#22c55e',     // green
  rejected_ko: '#ef4444',  // red
  cancelled: '#9ca3af',    // gray
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

export function OrderMap({ orders, onOrderClick, className }: OrderMapProps) {
  // Germany center coordinates
  const germanyCenter: [number, number] = [51.1657, 10.4515];
  const defaultZoom = 6;

  return (
    <div className={className}>
      <MapContainer
        center={germanyCenter}
        zoom={defaultZoom}
        className="h-full w-full rounded-lg"
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
              <div className="min-w-[200px] p-1">
                <div className="flex items-start gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{order.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.postalCode} {order.city}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <Badge 
                    variant={OBJECT_ORDER_STATUS_CONFIG[order.status]?.variant || 'secondary'}
                  >
                    {OBJECT_ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                  <Badge variant="outline">
                    {AUFTRAGSTYP_LABELS[order.type]}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <Euro className="w-3.5 h-3.5" />
                    {order.amount.toFixed(2)}
                  </div>
                  {onOrderClick && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-7 text-xs gap-1"
                      onClick={() => onOrderClick(order.id)}
                    >
                      Details
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
