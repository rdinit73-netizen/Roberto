import React, { useState, useMemo } from 'react';
import { 
  Euro, 
  Download, 
  CheckCircle, 
  Clock, 
  Building2, 
  Share2, 
  Receipt,
  FileSpreadsheet,
  AlertCircle,
  Database,
  Trash2
} from 'lucide-react';
import { Agency, Appointment, FinancialStats } from '../types';
import { StorageService } from '../services/storage';
import { appInventorBridge } from '../services/appInventorBridge';

interface FinanceViewProps {
  appointments: Appointment[];
  agencies: Agency[];
  stats: FinancialStats;
  onSelectAppointment: (appointment: Appointment) => void;
  onQuickPay: (appointmentId: string) => void;
  onSettleAgency: (agencyId: string) => void;
  onOpenReceiptForAgency: (agency: Agency, agencyAppointments: Appointment[]) => void;
  onOpenDataManagement?: () => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  appointments,
  agencies,
  stats,
  onSelectAppointment,
  onQuickPay,
  onSettleAgency,
  onOpenReceiptForAgency,
  onOpenDataManagement,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'unpaid' | 'paid'>('unpaid');
  const [selectedAgencyFilter, setSelectedAgencyFilter] = useState<string>('all');

  // Group financial figures per agency
  const agencyFinancials = useMemo(() => {
    return agencies.map(agency => {
      const aApps = appointments.filter(a => a.agencyId === agency.id && a.status !== 'cancelled');
      const totalEarnedNet = aApps.reduce((acc, a) => acc + (a.totalCompensationNet || 0), 0);
      const totalPaid = aApps.filter(a => a.paymentStatus === 'paid').reduce((acc, a) => acc + (a.totalCompensationNet || 0), 0);
      const totalUnpaid = aApps.filter(a => a.paymentStatus !== 'paid').reduce((acc, a) => acc + (a.totalCompensationNet || 0), 0);
      const totalKm = aApps.reduce((acc, a) => acc + (a.kmDriven || 0), 0);
      const totalKmReimb = aApps.reduce((acc, a) => acc + (a.kmReimbursement || 0), 0);
      const totalExpenses = aApps.reduce((acc, a) => acc + (a.expensesReceipts || 0), 0);

      return {
        agency,
        appointments: aApps,
        daysCount: aApps.length,
        totalEarnedNet,
        totalPaid,
        totalUnpaid,
        totalKm,
        totalKmReimb,
        totalExpenses
      };
    });
  }, [agencies, appointments]);

  // Filtered appointments list
  const displayedAppointments = useMemo(() => {
    return appointments.filter(a => {
      if (a.status === 'cancelled') return false;
      if (filterMode === 'unpaid' && a.paymentStatus === 'paid') return false;
      if (filterMode === 'paid' && a.paymentStatus !== 'paid') return false;
      if (selectedAgencyFilter !== 'all' && a.agencyId !== selectedAgencyFilter) return false;
      return true;
    });
  }, [appointments, filterMode, selectedAgencyFilter]);

  const handleExportCSV = () => {
    const csvData = StorageService.exportToCSV();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `i_miei_guadagni_promoter_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    appInventorBridge.send('CSV_EXPORTED', {
      timestamp: new Date().toISOString(),
      rowsCount: appointments.length
    });
  };

  const handleBackupJSON = () => {
    const data = StorageService.exportAllDataJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `promo_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">I Miei Guadagni & Crediti Agenzie</h2>
          <p className="text-xs text-slate-500">
            Controllo compensi maturati, bonifici in arrivo e rimborsi chilometrici
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenDataManagement && (
            <button
              type="button"
              onClick={onOpenDataManagement}
              className="min-h-[40px] px-3 py-1.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
              title="Azzera archivi per iniziare da zero o ripristina backup"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Azzera / Gestione Dati</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="min-h-[40px] px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Esporta CSV</span>
          </button>

          <button
            type="button"
            onClick={handleBackupJSON}
            className="min-h-[40px] px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup Dati</span>
          </button>
        </div>
      </div>

      {/* Financial Master KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-700 block uppercase tracking-wide">
            Ancora da Incassare
          </span>
          <span className="text-2xl font-bold text-amber-600 font-tabular block mt-1">
            € {stats.totalUnpaid.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Crediti aperti verso le agenzie
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 block uppercase tracking-wide">
            Già Incassato
          </span>
          <span className="text-2xl font-bold text-emerald-600 font-tabular block mt-1">
            € {stats.totalPaid.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Bonifici già accreditati su conto
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-700 block uppercase tracking-wide">
            Rimborsi Km Auto & Spese
          </span>
          <span className="text-2xl font-bold text-slate-900 font-tabular block mt-1">
            € {(stats.totalKmReimbursements + stats.totalExpenses).toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Km: €{stats.totalKmReimbursements.toFixed(2)} · Spese: €{stats.totalExpenses.toFixed(2)}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-indigo-700 block uppercase tracking-wide">
            Turni Lavorati Totali
          </span>
          <span className="text-2xl font-bold text-indigo-900 font-tabular block mt-1">
            {stats.totalAppointments}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Lordo totale: €{stats.totalCompensationGross.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Riconciliazione Crediti per Singola Agenzia */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Cosa Ti Devono le Tue Agenzie
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {agencyFinancials.length} agenzie registrate
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {agencyFinancials.map(({ agency, daysCount, totalEarnedNet, totalPaid, totalUnpaid, appointments }) => (
            <div
              key={agency.id}
              className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 shadow-xs space-y-3 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{agency.name}</h4>
                  <p className="text-xs text-slate-500">
                    {agency.contactPerson ? `${agency.contactPerson} · ` : ''}Tempi: <strong>{agency.paymentTerms}</strong>
                  </p>
                </div>
                <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md">
                  {daysCount} {daysCount === 1 ? 'turno' : 'turni'}
                </span>
              </div>

              {/* Economic stats strip */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Totale Maturato</span>
                  <span className="font-bold text-slate-800 font-tabular">€ {totalEarnedNet.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Già Incassato</span>
                  <span className="font-bold text-emerald-600 font-tabular">€ {totalPaid.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Ti Devono</span>
                  <span className={`font-bold font-tabular ${totalUnpaid > 0 ? 'text-amber-600 font-extrabold' : 'text-emerald-600'}`}>
                    € {totalUnpaid.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Actions for agency */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onOpenReceiptForAgency(agency, appointments)}
                  className="min-h-[38px] px-2.5 py-1 text-xs text-indigo-700 hover:bg-indigo-50 rounded-lg font-medium flex items-center gap-1 transition-colors"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Nota di Prestazione</span>
                </button>

                {totalUnpaid > 0 ? (
                  <button
                    type="button"
                    onClick={() => onSettleAgency(agency.id)}
                    className="min-h-[38px] px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
                  >
                    Incassa Tutto (€{totalUnpaid.toFixed(2)})
                  </button>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Tutto Saldato</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lista Turni con Spunta Rapida Incasso */}
      <section className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Elenco Compensi Turno per Turno
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-0.5 bg-slate-200/80 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setFilterMode('unpaid')}
                className={`min-h-[32px] px-2.5 rounded-md transition-colors ${
                  filterMode === 'unpaid' ? 'bg-white text-amber-900 font-bold shadow-xs' : 'text-slate-600'
                }`}
              >
                Da Incassare
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('paid')}
                className={`min-h-[32px] px-2.5 rounded-md transition-colors ${
                  filterMode === 'paid' ? 'bg-white text-emerald-900 font-bold shadow-xs' : 'text-slate-600'
                }`}
              >
                Incassati
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`min-h-[32px] px-2.5 rounded-md transition-colors ${
                  filterMode === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'
                }`}
              >
                Tutti
              </button>
            </div>

            <select
              value={selectedAgencyFilter}
              onChange={(e) => setSelectedAgencyFilter(e.target.value)}
              className="min-h-[32px] px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg"
            >
              <option value="all">Tutte le Agenzie</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        {displayedAppointments.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-xs">
            Nessun compenso trovato per i filtri selezionati.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100">
            {displayedAppointments.map((app) => (
              <div
                key={app.id}
                onClick={() => onSelectAppointment(app)}
                className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase">
                      {app.clientBrand}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500">{app.date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 truncate">{app.title}</h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    Agenzia: <strong className="text-slate-700">{app.agencyName}</strong> ({app.locationName}, {app.city})
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 font-tabular block">
                      € {app.totalCompensationNet.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Base €{app.baseCompensation.toFixed(0)} + Rimb. €{(app.kmReimbursement + app.expensesReceipts).toFixed(0)}
                    </span>
                  </div>

                  {app.paymentStatus !== 'paid' ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickPay(app.id);
                      }}
                      className="min-h-[38px] px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all"
                    >
                      Incassa
                    </button>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                      Incassato {app.paymentDate ? `il ${app.paymentDate}` : ''}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
