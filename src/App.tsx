import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav, NavTab } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { AppointmentsView } from './components/AppointmentsView';
import { FinanceView } from './components/FinanceView';
import { AgenciesView } from './components/AgenciesView';
import { AppointmentModal } from './components/AppointmentModal';
import { AppointmentDetailModal } from './components/AppointmentDetailModal';
import { AgencyModal } from './components/AgencyModal';
import { ReceiptModal } from './components/ReceiptModal';
import { DataManagementModal } from './components/DataManagementModal';
import { Agency, Appointment, AppointmentStatus, PaymentMethod } from './types';
import { StorageService } from './services/storage';
import { appInventorBridge } from './services/appInventorBridge';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Modals state
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptAgency, setReceiptAgency] = useState<Agency | null>(null);
  const [receiptAppointments, setReceiptAppointments] = useState<Appointment[]>([]);

  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  // Load initial data
  const loadData = useCallback(() => {
    const loadedAgencies = StorageService.getAgencies();
    const loadedAppointments = StorageService.getAppointments();
    setAgencies(loadedAgencies);
    setAppointments(loadedAppointments);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Financial statistics calculation
  const financialStats = useMemo(() => {
    return StorageService.calculateFinancialStats();
  }, [appointments]);

  // Unpaid count for bottom tab badge
  const unpaidCount = useMemo(() => {
    return appointments.filter(a => a.paymentStatus === 'unpaid' && a.status !== 'cancelled').length;
  }, [appointments]);

  // App Inventor Command Dispatcher (Background listener for MIT App Inventor WebViewer)
  useEffect(() => {
    const unsubscribe = appInventorBridge.onCommand((action, data) => {
      switch (action) {
        case 'GET_STATS':
          appInventorBridge.send('STATS_RESPONSE', StorageService.calculateFinancialStats());
          break;
        case 'FILTER_TODAY':
        case 'GOTO_TODAY':
          setActiveTab('dashboard');
          break;
        case 'GOTO_APPOINTMENTS':
          setActiveTab('appointments');
          break;
        case 'GOTO_FINANCE':
          setActiveTab('finance');
          break;
        case 'GOTO_AGENCIES':
          setActiveTab('agencies');
          break;
        case 'MARK_ALL_PAID':
          appointments.forEach(a => {
            if (a.paymentStatus !== 'paid') {
              StorageService.markAsPaid(a.id, 'bank_transfer', 'Saldato da App Inventor');
            }
          });
          loadData();
          break;
        case 'EXPORT_BACKUP':
          appInventorBridge.send('BACKUP_DATA', StorageService.exportAllDataJSON());
          break;
        case 'RESET_ALL':
        case 'CLEAR_ALL':
          StorageService.clearAllData();
          loadData();
          break;
        case 'RESTORE_DEMO':
          StorageService.restoreDemoData();
          loadData();
          break;
        default:
          break;
      }
    });

    return unsubscribe;
  }, [appointments, loadData]);

  // Handler: Save Appointment
  const handleSaveAppointment = (appointment: Appointment) => {
    StorageService.saveAppointment(appointment);
    loadData();
    setIsAppointmentModalOpen(false);
    setEditingAppointment(null);
    if (selectedAppointment && selectedAppointment.id === appointment.id) {
      setSelectedAppointment(appointment);
    }
  };

  // Handler: Delete Appointment
  const handleDeleteAppointment = (appointmentId: string) => {
    StorageService.deleteAppointment(appointmentId);
    loadData();
    setSelectedAppointment(null);
  };

  // Handler: Change Status
  const handleQuickStatusChange = (appointmentId: string, status: AppointmentStatus) => {
    const app = appointments.find(a => a.id === appointmentId);
    if (app) {
      const updated = { ...app, status };
      StorageService.saveAppointment(updated);
      loadData();
      if (selectedAppointment && selectedAppointment.id === appointmentId) {
        setSelectedAppointment(updated);
      }
    }
  };

  // Handler: Settle single appointment
  const handleQuickPay = (appointmentId: string, method: PaymentMethod = 'bank_transfer') => {
    StorageService.markAsPaid(appointmentId, method);
    loadData();
    if (selectedAppointment && selectedAppointment.id === appointmentId) {
      const updated = appointments.find(a => a.id === appointmentId);
      if (updated) setSelectedAppointment({ ...updated, paymentStatus: 'paid' });
    }
  };

  // Handler: Settle all credits from agency
  const handleSettleAgency = (agencyId: string) => {
    const count = StorageService.markAgencyAppointmentsAsPaid(agencyId);
    loadData();
    const ag = agencies.find(a => a.id === agencyId);
    alert(`Registrati come incassati ${count} turni dall'agenzia ${ag?.name || ''}.`);
  };

  // Handler: Save Agency
  const handleSaveAgency = (agency: Agency) => {
    try {
      const saved = StorageService.saveAgency(agency);
      setAgencies(prev => {
        const index = prev.findIndex(a => a.id === saved.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = saved;
          return updated;
        }
        return [saved, ...prev];
      });
      loadData();
    } catch (err) {
      console.error('Error saving agency in App.tsx:', err);
    } finally {
      setIsAgencyModalOpen(false);
      setEditingAgency(null);
    }
  };

  // Handler: Delete Agency
  const handleDeleteAgency = (agencyId: string) => {
    StorageService.deleteAgency(agencyId);
    setAgencies(prev => prev.filter(a => a.id !== agencyId));
    loadData();
  };

  // Open Receipt for single appointment
  const handleOpenReceiptForAppointment = (app: Appointment) => {
    const ag = agencies.find(a => a.id === app.agencyId) || {
      id: app.agencyId,
      name: app.agencyName,
      contactPerson: app.agencyContactPerson || '',
      phone: app.agencyPhone || '',
      email: '',
      city: app.city,
      paymentTerms: '30 gg fine mese'
    };
    setReceiptAgency(ag);
    setReceiptAppointments([app]);
    setIsReceiptModalOpen(true);
  };

  // Open Receipt for multiple appointments with an agency
  const handleOpenReceiptForAgency = (agency: Agency, agAppointments: Appointment[]) => {
    setReceiptAgency(agency);
    setReceiptAppointments(agAppointments);
    setIsReceiptModalOpen(true);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Caricamento Promo Manager...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Mobile App Bar */}
      <Navbar
        onNewAppointment={() => {
          setEditingAppointment(null);
          setIsAppointmentModalOpen(true);
        }}
        onOpenDataManagement={() => setIsDataModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            appointments={appointments}
            agencies={agencies}
            stats={financialStats}
            onSelectAppointment={(app) => setSelectedAppointment(app)}
            onNewAppointment={() => {
              setEditingAppointment(null);
              setIsAppointmentModalOpen(true);
            }}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onQuickStatusChange={handleQuickStatusChange}
            onQuickPay={handleQuickPay}
            onOpenDataManagement={() => setIsDataModalOpen(true)}
          />
        )}

        {activeTab === 'appointments' && (
          <AppointmentsView
            appointments={appointments}
            agencies={agencies}
            onSelectAppointment={(app) => setSelectedAppointment(app)}
            onNewAppointment={(prefilledDate) => {
              setEditingAppointment(prefilledDate ? ({ date: prefilledDate } as any) : null);
              setIsAppointmentModalOpen(true);
            }}
            onQuickPay={handleQuickPay}
            onOpenDataManagement={() => setIsDataModalOpen(true)}
          />
        )}

        {activeTab === 'finance' && (
          <FinanceView
            appointments={appointments}
            agencies={agencies}
            stats={financialStats}
            onSelectAppointment={(app) => setSelectedAppointment(app)}
            onQuickPay={handleQuickPay}
            onSettleAgency={handleSettleAgency}
            onOpenReceiptForAgency={handleOpenReceiptForAgency}
            onOpenDataManagement={() => setIsDataModalOpen(true)}
          />
        )}

        {activeTab === 'agencies' && (
          <AgenciesView
            agencies={agencies}
            appointments={appointments}
            onAddAgency={() => {
              setEditingAgency(null);
              setIsAgencyModalOpen(true);
            }}
            onEditAgency={(agency) => {
              setEditingAgency(agency);
              setIsAgencyModalOpen(true);
            }}
            onDeleteAgency={handleDeleteAgency}
            onOpenReceiptForAgency={handleOpenReceiptForAgency}
            onOpenDataManagement={() => setIsDataModalOpen(true)}
          />
        )}
      </main>

      {/* Touch-Friendly Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        unpaidCount={unpaidCount}
      />

      {/* Modals */}
      {/* 1. Create / Edit Appointment Modal */}
      {isAppointmentModalOpen && (
        <AppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={() => {
            setIsAppointmentModalOpen(false);
            setEditingAppointment(null);
          }}
          onSave={handleSaveAppointment}
          initialAppointment={editingAppointment}
          agencies={agencies}
        />
      )}

      {/* 2. Detail Appointment Modal */}
      {selectedAppointment && (
        <AppointmentDetailModal
          isOpen={Boolean(selectedAppointment)}
          appointment={selectedAppointment}
          agency={agencies.find(a => a.id === selectedAppointment?.agencyId)}
          onClose={() => setSelectedAppointment(null)}
          onEdit={(app) => {
            setSelectedAppointment(null);
            setEditingAppointment(app);
            setIsAppointmentModalOpen(true);
          }}
          onDelete={(id) => handleDeleteAppointment(id)}
          onStatusChange={handleQuickStatusChange}
          onMarkPaid={handleQuickPay}
          onOpenReceipt={handleOpenReceiptForAppointment}
        />
      )}

      {/* 3. Create / Edit Agency Modal */}
      {isAgencyModalOpen && (
        <AgencyModal
          key={editingAgency?.id || 'new-agency'}
          isOpen={isAgencyModalOpen}
          onClose={() => {
            setIsAgencyModalOpen(false);
            setEditingAgency(null);
          }}
          onSave={handleSaveAgency}
          onDelete={(id) => {
            handleDeleteAgency(id);
            setIsAgencyModalOpen(false);
            setEditingAgency(null);
          }}
          initialAgency={editingAgency}
        />
      )}

      {/* 4. Receipt / Invoice Note Modal */}
      {isReceiptModalOpen && receiptAgency && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setReceiptAgency(null);
            setReceiptAppointments([]);
          }}
          agency={receiptAgency}
          appointments={receiptAppointments}
        />
      )}



      {/* 6. Data Management & Reset Archives Modal */}
      {isDataModalOpen && (
        <DataManagementModal
          isOpen={isDataModalOpen}
          onClose={() => setIsDataModalOpen(false)}
          appointments={appointments}
          agencies={agencies}
          stats={financialStats}
          onDataChanged={loadData}
        />
      )}
    </div>
  );
}
