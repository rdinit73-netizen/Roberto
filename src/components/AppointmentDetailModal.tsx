import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Euro, 
  MessageSquare, 
  Phone, 
  Navigation, 
  Share2, 
  Edit3, 
  Trash2, 
  Building2,
  Receipt
} from 'lucide-react';
import { Agency, Appointment, AppointmentStatus, PaymentMethod } from '../types';
import { appInventorBridge } from '../services/appInventorBridge';

interface AppointmentDetailModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  agency?: Agency;
  onClose: () => void;
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointmentId: string) => void;
  onStatusChange: (appointmentId: string, status: AppointmentStatus) => void;
  onMarkPaid: (appointmentId: string, method?: PaymentMethod) => void;
  onOpenReceipt: (appointment: Appointment) => void;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  isOpen,
  appointment,
  agency,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onMarkPaid,
  onOpenReceipt,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleWhatsApp = () => {
    if (!appointment) return;
    const msg = `Ciao ${agency?.contactPerson || appointment.agencyName}, ti aggiorno sul mio turno ${appointment.clientBrand}:
📅 Data: ${appointment.date}
⏰ Orario: ${appointment.startTime} - ${appointment.endTime}
📍 Store: ${appointment.locationName}, ${appointment.city}
💶 Compenso concordato: €${appointment.totalCompensationNet.toFixed(2)}`;

    appInventorBridge.send('OPEN_WHATSAPP', {
      agencyName: appointment.agencyName,
      message: msg,
      appointmentId: appointment.id
    });
    window.location.href = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  const handleCall = () => {
    if (!appointment) return;
    const phone = agency?.phone || appointment.agencyPhone || '+393491122334';
    appInventorBridge.send('DIAL_PHONE', {
      phone,
      agencyName: appointment.agencyName,
      appointmentId: appointment.id
    });
    window.location.href = `tel:${phone}`;
  };

  const handleMap = () => {
    if (!appointment) return;
    const loc = `${appointment.locationName}, ${appointment.address}, ${appointment.city}`;
    appInventorBridge.send('OPEN_MAP', {
      location: loc,
      appointmentId: appointment.id
    });
    window.location.href = `https://maps.google.com/?q=${encodeURIComponent(loc)}`;
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full sm:max-w-lg max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div>
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
              {appointment.clientBrand}
            </span>
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {appointment.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Status Bar & Quick Status Changer */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-100 rounded-2xl">
            <span className="text-xs text-slate-500 font-medium">Stato Turno:</span>
            <div className="flex items-center gap-1">
              {(['scheduled', 'in_progress', 'completed'] as AppointmentStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => onStatusChange(appointment.id, st)}
                  className={`min-h-[36px] px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                    appointment.status === st
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'scheduled' ? 'In Programma' : st === 'in_progress' ? 'In Corso' : 'Svolto'}
                </button>
              ))}
            </div>
          </div>

          {/* Agency & Booker Contact Box */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-indigo-700 font-bold uppercase block">Agenzia di Incarico</span>
                  <span className="text-sm font-bold text-indigo-950">{appointment.agencyName}</span>
                  {agency?.contactPerson && (
                    <span className="text-xs text-indigo-800/80 block">Referente: {agency.contactPerson}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-indigo-700 font-medium block">Tempi Pagamento</span>
                <span className="text-xs font-semibold text-indigo-900">{agency?.paymentTerms || '30 gg'}</span>
              </div>
            </div>

            {/* Quick Touch Communication with the Agency */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={handleCall}
                className="min-h-[42px] px-2 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-100 text-indigo-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-indigo-600" />
                <span>Chiama</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsApp}
                className="min-h-[42px] px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleMap}
                className="min-h-[42px] px-2 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-100 text-indigo-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                <span>Mappa</span>
              </button>
            </div>
          </div>

          {/* Time & Location details */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-bold text-slate-900">{appointment.date}</span>
              <span className="text-slate-400">·</span>
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{appointment.startTime} - {appointment.endTime} (Pausa: {appointment.breakMinutes} min)</span>
            </div>

            <div className="flex items-start gap-2 pt-1 border-t border-slate-200/60">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">{appointment.locationName}</p>
                <p className="text-slate-500 text-[11px]">{appointment.address}, {appointment.city}</p>
              </div>
            </div>

            {appointment.taskDescription && (
              <div className="pt-2 border-t border-slate-200/60 text-slate-600">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Briefing / Divisa Richiesta</span>
                <p className="mt-0.5 text-xs">{appointment.taskDescription}</p>
              </div>
            )}
          </div>

          {/* FINANCIAL ENGINE BREAKDOWN */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Euro className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dettaglio del Tuo Guadagno</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Tariffa: {appointment.rateType === 'daily' ? 'Giornaliera' : appointment.rateType === 'hourly' ? 'Oraria' : 'Fissa'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Compenso Base Pattuito:</span>
                <span className="font-tabular font-medium">€ {appointment.baseCompensation.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Rimborsi Chilometrici Auto ({appointment.kmDriven} km):</span>
                <span className="font-tabular font-medium">€ {appointment.kmReimbursement.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Spese Anticipate / Scontrini:</span>
                <span className="font-tabular font-medium">€ {appointment.expensesReceipts.toFixed(2)}</span>
              </div>
              {appointment.salesBonus > 0 && (
                <div className="flex justify-between text-emerald-300">
                  <span>Bonus Risultati / Incentivi:</span>
                  <span className="font-tabular font-medium">+ € {appointment.salesBonus.toFixed(2)}</span>
                </div>
              )}
              {appointment.applyWithholdingTax && (
                <div className="flex justify-between text-amber-300">
                  <span>Ritenuta d'acconto 20% detratta:</span>
                  <span className="font-tabular font-medium">- € {appointment.withholdingTaxAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-sm font-bold">
                <span>Netto da Incassare da {appointment.agencyName}:</span>
                <span className="text-emerald-400 text-lg font-tabular">
                  € {appointment.totalCompensationNet.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Status & Toggle */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Stato Incasso</span>
                <span
                  className={`text-xs font-bold ${
                    appointment.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {appointment.paymentStatus === 'paid'
                    ? `Incassato (${appointment.paymentDate || 'OK'})`
                    : 'Da Incassare (Credito aperto)'}
                </span>
              </div>

              {appointment.paymentStatus !== 'paid' ? (
                <button
                  type="button"
                  onClick={() => onMarkPaid(appointment.id, 'bank_transfer')}
                  className="min-h-[38px] px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95"
                >
                  Segna come Incassato
                </button>
              ) : (
                <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-1 rounded-md">
                  Accreditato via {appointment.paymentMethod || 'Bonifico'}
                </span>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onOpenReceipt(appointment)}
              className="w-full min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Receipt className="w-4 h-4 text-indigo-600" />
              <span>Genera Nota di Prestazione / Ricevuta per l'Agenzia</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(appointment)}
                className="flex-1 min-h-[42px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modifica Turno</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="min-h-[42px] min-w-[42px] flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                title="Elimina"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Confirm Delete Banner */}
          {showDeleteConfirm && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2">
              <p className="font-semibold text-rose-900">
                Vuoi eliminare definitivamente questo turno dal tuo diario?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 min-h-[36px] bg-white border border-rose-200 text-slate-700 rounded-lg text-xs font-medium"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(appointment.id)}
                  className="flex-1 min-h-[36px] bg-rose-600 text-white rounded-lg text-xs font-bold"
                >
                  Elimina Turno
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
