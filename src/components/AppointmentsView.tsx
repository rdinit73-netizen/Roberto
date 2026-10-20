import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  Clock, 
  MapPin, 
  Euro, 
  Plus, 
  Building2, 
  MessageSquare, 
  CheckCircle2,
  List
} from 'lucide-react';
import { Agency, Appointment } from '../types';
import { appInventorBridge } from '../services/appInventorBridge';
import { CalendarView } from './CalendarView';

interface AppointmentsViewProps {
  appointments: Appointment[];
  agencies: Agency[];
  onSelectAppointment: (appointment: Appointment) => void;
  onNewAppointment: (prefilledDate?: string) => void;
  onQuickPay: (appointmentId: string) => void;
  onOpenDataManagement?: () => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  appointments,
  agencies,
  onSelectAppointment,
  onNewAppointment,
  onQuickPay,
  onOpenDataManagement,
}) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agencyFilter, setAgencyFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('asc');

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((app) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          app.title.toLowerCase().includes(searchLower) ||
          app.clientBrand.toLowerCase().includes(searchLower) ||
          app.agencyName.toLowerCase().includes(searchLower) ||
          app.locationName.toLowerCase().includes(searchLower) ||
          app.city.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;

        // Status filter
        if (statusFilter === 'unpaid') {
          if (app.paymentStatus === 'paid' || app.status === 'cancelled') return false;
        } else if (statusFilter === 'completed') {
          if (app.status !== 'completed') return false;
        } else if (statusFilter === 'scheduled') {
          if (app.status !== 'scheduled' && app.status !== 'confirmed') return false;
        } else if (statusFilter === 'in_progress') {
          if (app.status !== 'in_progress') return false;
        }

        // Agency filter
        if (agencyFilter !== 'all' && app.agencyId !== agencyFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.startTime || '00:00'}`).getTime();
        const timeB = new Date(`${b.date}T${b.startTime || '00:00'}`).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      });
  }, [appointments, searchTerm, statusFilter, agencyFilter, sortOrder]);

  const handleWhatsApp = (e: React.MouseEvent, app: Appointment) => {
    e.stopPropagation();
    const agency = agencies.find(a => a.id === app.agencyId);
    const msg = `Ciao ${agency?.contactPerson || app.agencyName}, ti aggiorno sul turno ${app.clientBrand} del ${app.date} (${app.startTime} - ${app.endTime}) presso ${app.locationName}, ${app.city}.`;
    appInventorBridge.send('OPEN_WHATSAPP', {
      agencyName: app.agencyName,
      message: msg,
      appointmentId: app.id
    });
    window.location.href = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

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
    <div className="space-y-4 pb-20">
      {/* Header and Add Action */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">I Miei Turni & Appuntamenti</h2>
          <p className="text-xs text-slate-500">
            {appointments.length} turni registrati nel diario
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNewAppointment()}
          className="min-h-[44px] px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuovo Turno</span>
        </button>
      </div>

      {/* View Switcher: Calendario vs Elenco */}
      <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => setViewMode('calendar')}
          className={`flex-1 min-h-[40px] px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            viewMode === 'calendar'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span>Vista Calendario Mensile</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('list')}
          className={`flex-1 min-h-[40px] px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            viewMode === 'list'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <List className="w-4 h-4" />
          <span>Elenco Turni ({appointments.length})</span>
        </button>
      </div>

      {viewMode === 'calendar' ? (
        <CalendarView
          appointments={appointments}
          agencies={agencies}
          onSelectAppointment={onSelectAppointment}
          onNewAppointmentWithDate={(date) => onNewAppointment(date)}
          onQuickPay={onQuickPay}
        />
      ) : (
        <>
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca brand, agenzia di incarico, store o città..."
              className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
            />
          </div>

          {/* Filter Tabs & Agency Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {/* Segmented Filter Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`min-h-[36px] px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tutti
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('scheduled')}
            className={`min-h-[36px] px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'scheduled' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            In Programma
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`min-h-[36px] px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'completed' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Svolti
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('unpaid')}
            className={`min-h-[36px] px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'unpaid' ? 'bg-white text-amber-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Da Incassare
          </button>
        </div>

        {/* Agency Filter Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={agencyFilter}
            onChange={(e) => setAgencyFilter(e.target.value)}
            className="min-h-[36px] px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            <option value="all">Tutte le Agenzie</option>
            {agencies.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="min-h-[36px] px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            Data: {sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
          </button>
        </div>
      </div>

      {/* Appointment Cards List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {appointments.length === 0 ? 'Archivio Turni Vuoto' : 'Nessun turno corrisponde ai filtri selezionati'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {appointments.length === 0 
                ? 'Non ci sono ancora giornate o turni salvati. Clicca su "+ Nuovo Turno" per aggiungere la tua prima promozione.' 
                : 'Prova a modificare i filtri o la ricerca.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onNewAppointment()}
              className="min-h-[40px] px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Turno</span>
            </button>
            {appointments.length === 0 && onOpenDataManagement && (
              <button
                type="button"
                onClick={onOpenDataManagement}
                className="min-h-[40px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors"
              >
                Gestione Archivi / Dati Demo
              </button>
            )}
            {appointments.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setAgencyFilter('all');
                }}
                className="text-xs text-indigo-600 hover:underline font-semibold"
              >
                Azzera tutti i filtri
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((app) => (
            <div
              key={app.id}
              onClick={() => onSelectAppointment(app)}
              className="bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3"
            >
              {/* Row 1: Brand & Status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold text-indigo-600 tracking-wide uppercase">
                    {app.clientBrand}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {app.title}
                  </h3>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block ${
                      app.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : app.status === 'in_progress'
                        ? 'bg-blue-50 text-blue-700'
                        : app.status === 'cancelled'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {app.status === 'completed'
                      ? 'Svolto'
                      : app.status === 'in_progress'
                      ? 'In corso'
                      : app.status === 'cancelled'
                      ? 'Annullato'
                      : 'In programma'}
                  </span>
                </div>
              </div>

              {/* Row 2: Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800">{app.date}</span>
                  <span className="text-slate-400">·</span>
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{app.startTime} - {app.endTime}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{app.locationName} ({app.city})</span>
                </div>
              </div>

              {/* Row 3: Agency & Financial status */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 block leading-none">Agenzia di incarico</span>
                    <span className="font-semibold text-slate-900 truncate block mt-0.5">{app.agencyName}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block">Tuo Guadagno Netto</span>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="font-bold text-slate-900 font-tabular text-sm">
                      € {app.totalCompensationNet.toFixed(2)}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                        app.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.paymentStatus === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {app.paymentStatus === 'paid'
                        ? 'Incassato'
                        : app.paymentStatus === 'pending'
                        ? 'In arrivo'
                        : 'Da incassare'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 4: Action buttons */}
              <div className="pt-2 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={(e) => handleWhatsApp(e, app)}
                  className="min-h-[38px] px-3 flex items-center gap-1 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Agenzia</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleMap(e, app)}
                  className="min-h-[38px] px-3 flex items-center gap-1 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Mappa</span>
                </button>
                {app.paymentStatus !== 'paid' && (
                  <button
                    type="button"
                    onClick={() => onQuickPay(app.id)}
                    className="min-h-[38px] px-3 flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Euro className="w-3.5 h-3.5" />
                    <span>Incassa</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </>
    )}
  </div>
);
};
