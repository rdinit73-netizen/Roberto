import React from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  Euro, 
  Building2,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import { Agency, Appointment, FinancialStats } from '../types';
import { appInventorBridge } from '../services/appInventorBridge';

interface DashboardViewProps {
  appointments: Appointment[];
  agencies: Agency[];
  stats: FinancialStats;
  onSelectAppointment: (appointment: Appointment) => void;
  onNewAppointment: () => void;
  onNavigateTab: (tab: 'appointments' | 'finance' | 'agencies') => void;
  onQuickStatusChange: (appointmentId: string, newStatus: Appointment['status']) => void;
  onQuickPay: (appointmentId: string) => void;
  onOpenDataManagement?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  appointments,
  agencies,
  stats,
  onSelectAppointment,
  onNewAppointment,
  onNavigateTab,
  onQuickStatusChange,
  onQuickPay,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const todayAppointments = appointments.filter(a => a.date === todayStr);
  const tomorrowAppointments = appointments.filter(a => a.date === tomorrowStr);
  const pendingPayments = appointments.filter(a => a.paymentStatus === 'unpaid' && (a.status === 'completed' || a.date <= todayStr));

  // Quick Action: WhatsApp to Agency Booker
  const handleWhatsApp = (e: React.MouseEvent, app: Appointment) => {
    e.stopPropagation();
    const agency = agencies.find(a => a.id === app.agencyId);
    const msg = `Ciao ${agency?.contactPerson || app.agencyName}, ti confermo la mia presenza per il turno ${app.clientBrand} il ${app.date} dalle ${app.startTime} alle ${app.endTime} presso ${app.locationName} (${app.city}).`;
    
    appInventorBridge.send('OPEN_WHATSAPP', {
      agencyName: app.agencyName,
      message: msg,
      appointmentId: app.id
    });

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.location.href = url;
  };

  // Quick Action: Map
  const handleMap = (e: React.MouseEvent, app: Appointment) => {
    e.stopPropagation();
    const query = encodeURIComponent(`${app.locationName}, ${app.address}, ${app.city}`);
    appInventorBridge.send('OPEN_MAP', {
      location: `${app.locationName}, ${app.address}, ${app.city}`,
      appointmentId: app.id
    });
    window.location.href = `https://maps.google.com/?q=${query}`;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Welcome & Personal Dashboard Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-indigo-300 font-medium">Diario Personale Promoter</span>
            <h2 className="text-xl font-bold mt-0.5">I Miei Appuntamenti & Guadagni</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-lg">
              Tieni traccia dei tuoi turni in store, delle agenzie di incarico, dei rimborsi chilometrici e dei pagamenti ricevuti.
            </p>
          </div>
          <button
            type="button"
            onClick={onNewAppointment}
            className="min-h-[44px] px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl shrink-0 active:scale-95 transition-all shadow-md"
          >
            + Nuovo Turno
          </button>
        </div>

        {/* Highlight Personal Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-indigo-900/60 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Ancora da Incassare</span>
            <span className="text-lg font-bold text-amber-400 font-tabular">
              € {stats.totalUnpaid.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Già Incassati</span>
            <span className="text-lg font-bold text-emerald-400 font-tabular">
              € {stats.totalPaid.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">I Miei Rimborsi Km & Spese</span>
            <span className="text-lg font-bold text-indigo-200 font-tabular">
              € {(stats.totalKmReimbursements + stats.totalExpenses).toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Turni Svolti / Registrati</span>
            <span className="text-lg font-bold text-white font-tabular">
              {stats.totalAppointments} turni
            </span>
          </div>
        </div>
      </div>





      {/* Financial Alert for Pending Collections */}
      {pendingPayments.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-900">
                Hai {pendingPayments.length} compenso/i da incassare dalle agenzie
              </p>
              <p className="text-[11px] text-amber-700">
                Totale crediti aperti: <strong className="font-tabular">€ {stats.totalUnpaid.toFixed(2)}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('finance')}
            className="min-h-[40px] px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg shrink-0 transition-colors"
          >
            Verifica Crediti
          </button>
        </div>
      )}

      {/* TODAY'S SCHEDULE */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              I Tuoi Turni di Oggi ({todayAppointments.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('appointments')}
            className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-0.5"
          >
            Vedi tutti <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-500">
            <p className="text-sm">Nessun turno promozionale in programma per oggi. Buona giornata di riposo!</p>
            <button
              type="button"
              onClick={onNewAppointment}
              className="mt-2 text-xs text-indigo-600 font-semibold hover:underline"
            >
              + Aggiungi un nuovo turno
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todayAppointments.map((app) => (
              <div
                key={app.id}
                onClick={() => onSelectAppointment(app)}
                className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-indigo-600 tracking-wide uppercase">
                      {app.clientBrand}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {app.title}
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      app.status === 'in_progress'
                        ? 'bg-blue-50 text-blue-700'
                        : app.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {app.status === 'in_progress' ? 'In corso' : app.status === 'completed' ? 'Svolto' : 'In programma'}
                  </span>
                </div>

                {/* Details */}
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="font-semibold text-slate-900">Agenzia: {app.agencyName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{app.startTime} - {app.endTime} ({app.breakMinutes} min pausa)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{app.locationName} · {app.city}</span>
                  </div>
                </div>

                {/* Financial bar inside card */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Tuo Guadagno Netto</span>
                    <span className="font-bold text-slate-900 font-tabular">
                      € {app.totalCompensationNet.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">
                      ({app.paymentStatus === 'paid' ? 'Incassato' : 'Da incassare'})
                    </span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => handleWhatsApp(e, app)}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      title="Avvisa Booker Agenzia su WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleMap(e, app)}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                      title="Apri Mappa Store"
                    >
                      <MapPin className="w-4 h-4" />
                    </button>
                    {app.status !== 'completed' ? (
                      <button
                        type="button"
                        onClick={() => onQuickStatusChange(app.id, 'completed')}
                        className="min-h-[36px] px-2.5 flex items-center gap-1 rounded-lg bg-slate-900 text-white text-[11px] font-medium hover:bg-slate-800 transition-colors"
                        title="Segna come svolto"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Fatto</span>
                      </button>
                    ) : app.paymentStatus !== 'paid' ? (
                      <button
                        type="button"
                        onClick={() => onQuickPay(app.id)}
                        className="min-h-[36px] px-2.5 flex items-center gap-1 rounded-lg bg-emerald-600 text-white text-[11px] font-medium hover:bg-emerald-700 transition-colors"
                        title="Segna come incassato dall'agenzia"
                      >
                        <Euro className="w-3.5 h-3.5" />
                        <span>Incassa</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* TOMORROW'S PREVIEW */}
      {tomorrowAppointments.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Domani ({tomorrowAppointments.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tomorrowAppointments.map((app) => (
              <div
                key={app.id}
                onClick={() => onSelectAppointment(app)}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">{app.clientBrand}</span>
                  <h4 className="text-sm font-bold text-slate-900 truncate">{app.title}</h4>
                  <p className="text-xs text-slate-500 truncate">Agenzia: {app.agencyName} · {app.locationName}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-900 font-tabular block">
                    € {app.totalCompensationNet.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500">{app.startTime}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* WORKFLOW NAVIGATION CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div
          onClick={() => onNavigateTab('appointments')}
          className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 cursor-pointer transition-all space-y-1 shadow-sm"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 pt-1">I Miei Turni</h4>
          <p className="text-[11px] text-slate-500">
            Visualizza tutti i tuoi appuntamenti filtrati per data, brand o agenzia.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('agencies')}
          className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 cursor-pointer transition-all space-y-1 shadow-sm"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Briefcase className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 pt-1">Le Mie Agenzie</h4>
          <p className="text-[11px] text-slate-500">
            Contatti booker, tempi di accredito e bilancio crediti per ciascuna agenzia.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('finance')}
          className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 cursor-pointer transition-all space-y-1 shadow-sm"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Euro className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 pt-1">I Miei Guadagni</h4>
          <p className="text-[11px] text-slate-500">
            Monitora i bonifici in arrivo, rimborsi chilometrici e note di prestazione.
          </p>
        </div>
      </section>
    </div>
  );
};
