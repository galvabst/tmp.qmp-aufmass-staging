export type OrderStatus = 'new' | 'accepted' | 'completed' | 'rejected';

export interface Order {
  id: string;
  customerName: string;
  address: string;
  city: string;
  postalCode: string;
  scheduledDate: string;
  scheduledTime: string;
  description: string;
  status: OrderStatus;
  createdAt: string;
  notes?: string;
  contactPhone?: string;
  projectType: string;
}
