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
  const [selectedContractorId, setSelectedContractorId] = useState<string | null>(null);

  const handleSelectContractor = (contractorId: string) => {
    setSelectedContractorId(contractorId);
    setActiveTab('contractors');
  };

  const handleTabChange = (tab: AdminTab) => {
    // Clear contractor selection when manually switching tabs
    if (tab !== 'contractors') {
      setSelectedContractorId(null);
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-background">
      {activeTab === 'dashboard' && <AdminDashboardView onSelectContractor={handleSelectContractor} />}
      {activeTab === 'contractors' && (
        <ContractorListView
          initialSelectedId={selectedContractorId}
          onClearSelection={() => setSelectedContractorId(null)}
        />
      )}
      {activeTab === 'pool' && <ObjectOrderListView />}
      {activeTab === 'bookings' && <BookingListView />}
      {activeTab === 'checkins' && <CheckinListView />}
      {activeTab === 'quality-gate' && <QGQueueView />}
      {activeTab === 'akademie' && <AkademieAdminView />}

      <AdminBottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
}
