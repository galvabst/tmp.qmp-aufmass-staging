import { useState } from 'react';
import { AdminBottomNav, AdminTab } from '@/features/admin/ui/AdminBottomNav';
import { ContractorListView } from '@/features/contractors/ui/ContractorListView';
import { ObjectOrderListView } from '@/features/object-orders/ui/ObjectOrderListView';
import { BookingListView } from '@/features/bookings/ui/BookingListView';
import { CheckinListView } from '@/features/checkins/ui/CheckinListView';
import { QGQueueView } from '@/features/quality-gate/ui/QGQueueView';
import { AkademieAdminView } from '@/features/admin/ui/akademie/AkademieAdminView';
import { AdminDashboardView } from '@/features/admin/ui/AdminDashboardView';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  return (
    <div className="min-h-screen bg-background">
      {activeTab === 'dashboard' && <AdminDashboardView />}
      {activeTab === 'contractors' && <ContractorListView />}
      {activeTab === 'pool' && <ObjectOrderListView />}
      {activeTab === 'bookings' && <BookingListView />}
      {activeTab === 'checkins' && <CheckinListView />}
      {activeTab === 'quality-gate' && <QGQueueView />}
      {activeTab === 'akademie' && <AkademieAdminView />}

      <AdminBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
