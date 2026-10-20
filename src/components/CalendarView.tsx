import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Building2, 
  Euro, 
  Plus, 
  CheckCircle2, 
  AlertTriangle,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Appointment, Agency } from '../types';
import { appInventorBridge } from '../services/appInventorBridge';

interface CalendarViewProps {
  appointments: Appointment[];
  agencies: Agency[];
  onSelectAppointment: (appointment: Appointment) => void;
  onNewAppointmentWithDate?: (date: string) => void;
  onQuickPay: (appointmentId: string) => void;
}

const MONTH_NAMES_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const WEEKDAY_NAMES_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  appointments,
  agencies,
  onSelectAppointment,
  onNewAppointmentWithDate,
  onQuickPay,
}) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [agencyFilter, setAgencyFilter] = useState<string>('all');

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(todayStr);
  };

  // Filtered appointments by agency
  const filteredAppointments = useMemo(() => {
    if (agencyFilter === 'all') return appointments;
    return appointments.filter(a => a.agencyId === agencyFilter);
  }, [appointments, agencyFilter]);

  // Group appointments by date: { 'YYYY-MM-DD': Appointment[] }
  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    filteredAppointments.forEach(app => {
      if (!map[app.date]) {
        map[app.date] = [];
      }
      map[app.date].push(app);
    });
    return map;
  }, [filteredAppointments]);

  // Month calculations
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  // Day of week for 1st of month (0 = Sun, 1 = Mon ...). We want 0 = Mon, 6 = Sun.
  const startDayOfWeek = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Convert to Monday-start
  }, [currentYear, currentMonth]);

  // Monthly stats
  const monthStats = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const monthApps = filteredAppointments.filter(a => a.date.startsWith(monthPrefix) && a.status !== 'cancelled');
    const totalCount = monthApps.length;
    const totalNet = monthApps.reduce((acc, a) => acc + (a.totalCompensationNet || 0), 0);
    const unpaidCount = monthApps.filter(a => a.paymentStatus !== 'paid').length;
    const unpaidNet = monthApps.filter(a => a.paymentStatus !== 'paid').reduce((acc, a) => acc + (a.totalCompensationNet || 0), 0);

    return { totalCount, totalNet, unpaidCount, unpaidNet };
  }, [filteredAppointments, currentYear, currentMonth]);

  // Selected date appointments
  const selectedDayAppointments = useMemo(() => {
    return (appointmentsByDate[selectedDate] || []).sort((a, b) => 
      (a.startTime || '').localeCompare(b.startTime || '')
    );
  }, [appointmentsByDate, selectedDate]);

  // Format selected date nicely for Italian display
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const dayName = dayNames[dateObj.getDay()];
    const monthName = MONTH_NAMES_IT[m - 1];
    return `${dayName} ${d} ${monthName} ${y}`;
  }, [selectedDate]);

  const handleWhatsApp = (e: React.MouseEvent, app: Appointment) => {
    e.stopPropagation();
    const msg = `Ciao ${app.agencyName}, ti contatto riguardo al turno del ${app.date} (${app.startTime} - ${app.endTime}) per ${app.clientBrand} presso ${app.locationName}, ${app.city}.`;
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
    <div className="space-y-4">
      {/* Month Navigation & Stats Header */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        
        {/* Top Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white active:scale-95 transition-all cursor-pointer"
                title="Mese precedente"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white active:scale-95 transition-all cursor-pointer"
                title="Mese successivo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {MONTH_NAMES_IT[currentMonth]} {currentYear}
              </h3>
              <p className="text-[11px] text-slate-500">
                {monthStats.totalCount} {monthStats.totalCount === 1 ? 'turno' : 'turni'} in programma questo mese
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {agencies.length > 0 && (
              <select
                value={agencyFilter}
                onChange={(e) => setAgencyFilter(e.target.value)}
                className="min-h-[38px] px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">Tutte le agenzie</option>
                {agencies.map(ag => (
                  <option key={ag.id} value={ag.id}>{ag.name}</option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handleGoToday}
              className="min-h-[38px] px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:scale-95 rounded-xl transition-all cursor-pointer"
            >
              Oggi
            </button>
          </div>
        </div>

        {/* Month Financial Badge Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
          <div className="bg-slate-50 p-2.5 rounded-2xl text-center">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Turni Mese</span>
            <span className="text-sm sm:text-base font-bold text-slate-900 font-tabular">
              {monthStats.totalCount}
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-2xl text-center">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Guadagno Mese</span>
            <span className="text-sm sm:text-base font-bold text-emerald-600 font-tabular">
              € {monthStats.totalNet.toFixed(2)}
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-2xl text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Da Incassare Mese</span>
            <span className={`text-sm sm:text-base font-bold font-tabular ${monthStats.unpaidNet > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              € {monthStats.unpaidNet.toFixed(2)} ({monthStats.unpaidCount})
            </span>
          </div>
        </div>

        {/* CALENDAR GRID */}
        <div>
          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500 py-2 border-b border-slate-100">
            {WEEKDAY_NAMES_IT.map((d, idx) => (
              <span key={d} className={idx >= 5 ? 'text-rose-500' : ''}>
                {d}
              </span>
            ))}
          </div>

          {/* Days Cells */}
          <div className="grid grid-cols-7 gap-1 pt-2">
            {/* Empty slots for days before 1st of month */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[56px] sm:min-h-[68px] rounded-2xl p-1 bg-transparent" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayAppointments = appointmentsByDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const hasAppointments = dayAppointments.length > 0;

              // Check appointments statuses on this day
              const hasUnpaid = dayAppointments.some(a => a.paymentStatus !== 'paid' && a.status !== 'cancelled');
              const hasCompleted = dayAppointments.some(a => a.status === 'completed');
              const hasScheduled = dayAppointments.some(a => a.status === 'scheduled' || a.status === 'in_progress');

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[56px] sm:min-h-[68px] rounded-2xl p-1.5 flex flex-col justify-between items-center transition-all cursor-pointer relative text-left ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-600 ring-offset-2'
                      : hasAppointments
                      ? 'bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200/80 text-slate-900'
                      : isToday
                      ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 font-bold text-slate-900'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="w-full flex items-center justify-between">
                    <span className={`text-xs sm:text-sm font-bold font-tabular rounded-full w-6 h-6 flex items-center justify-center ${
                      isToday && !isSelected
                        ? 'bg-indigo-600 text-white'
                        : ''
                    }`}>
                      {dayNum}
                    </span>

                    {hasAppointments && (
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                        isSelected 
                          ? 'bg-white text-indigo-700' 
                          : 'bg-indigo-600 text-white'
                      }`}>
                        {dayAppointments.length}
                      </span>
                    )}
                  </div>

                  {/* Indicator Dots for Status */}
                  {hasAppointments ? (
                    <div className="w-full flex items-center justify-center gap-1 mt-1">
                      {hasScheduled && (
                        <div 
                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-sky-200' : 'bg-sky-500'}`}
                          title="In programma"
                        />
                      )}
                      {hasCompleted && (
                        <div 
                          className={`w-1.5 h-1.5 rounded-full ${
                            hasUnpaid 
                              ? isSelected ? 'bg-amber-300' : 'bg-amber-500' 
                              : isSelected ? 'bg-emerald-300' : 'bg-emerald-500'
                          }`}
                          title={hasUnpaid ? 'Svolto da Incassare' : 'Svolto e Saldato'}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="h-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
            <span>In programma</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Svolto & Saldato</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span>Da Incassare</span>
          </div>
        </div>
      </div>

      {/* SELECTED DATE DETAIL SECTION */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-indigo-600" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {formattedSelectedDate}
              </h4>
              <p className="text-xs text-slate-500">
                {selectedDayAppointments.length === 0
                  ? 'Nessun turno registrato in questa data'
                  : `${selectedDayAppointments.length} ${selectedDayAppointments.length === 1 ? 'turno registrato' : 'turni registrati'}`}
              </p>
            </div>
          </div>

          {onNewAppointmentWithDate && (
            <button
              type="button"
              onClick={() => onNewAppointmentWithDate(selectedDate)}
              className="min-h-[38px] px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aggiungi Turno</span>
            </button>
          )}
        </div>

        {/* Shifts List for Selected Day */}
        {selectedDayAppointments.length === 0 ? (
          <div className="text-center py-6 px-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <p className="text-xs text-slate-500">
              Nessun impegno promozionale in agenda per il {selectedDate}.
            </p>
            {onNewAppointmentWithDate && (
              <button
                type="button"
                onClick={() => onNewAppointmentWithDate(selectedDate)}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                + Registra un turno per questa giornata
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDayAppointments.map((app) => (
              <div
                key={app.id}
                onClick={() => onSelectAppointment(app)}
                className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                      {app.clientBrand}
                    </span>
                    <h5 className="text-sm font-bold text-slate-900 leading-snug">
                      {app.title}
                    </h5>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      app.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : app.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {app.status === 'completed' ? 'Svolto' : app.status === 'in_progress' ? 'In corso' : 'In programma'}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">Agenzia: <strong>{app.agencyName}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{app.startTime} - {app.endTime} ({app.breakMinutes}m pausa)</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{app.locationName} · {app.address}, {app.city}</span>
                  </div>
                </div>

                {/* Footer with Earnings & Actions */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Compenso Netto</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-extrabold text-slate-900 font-tabular">
                        € {app.totalCompensationNet.toFixed(2)}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                        app.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {app.paymentStatus === 'paid' ? 'Incassato' : 'Da Incassare'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => handleWhatsApp(e, app)}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl bg-white border border-slate-200 text-emerald-600 hover:bg-emerald-50 active:scale-95 transition-all"
                      title="Contatta Booker WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleMap(e, app)}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 active:scale-95 transition-all"
                      title="Apri Mappa"
                    >
                      <MapPin className="w-4 h-4" />
                    </button>
                    {app.status === 'completed' && app.paymentStatus !== 'paid' && (
                      <button
                        type="button"
                        onClick={() => onQuickPay(app.id)}
                        className="min-h-[36px] px-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs transition-all"
                      >
                        <Euro className="w-3.5 h-3.5" />
                        <span>Incassa</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
