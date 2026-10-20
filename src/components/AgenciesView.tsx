import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Phone, 
  MessageSquare, 
  Mail, 
  MapPin, 
  Edit3, 
  Trash2, 
  Clock, 
  Search, 
  Receipt,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Agency, Appointment } from '../types';
import { appInventorBridge } from '../services/appInventorBridge';

interface AgenciesViewProps {
  agencies: Agency[];
  appointments: Appointment[];
  onAddAgency: () => void;
  onEditAgency: (agency: Agency) => void;
  onDeleteAgency: (id: string) => void;
  onOpenReceiptForAgency: (agency: Agency, agencyAppointments: Appointment[]) => void;
  onOpenDataManagement?: () => void;
}

export const AgenciesView: React.FC<AgenciesViewProps> = ({
  agencies,
  appointments,
  onAddAgency,
  onEditAgency,
  onDeleteAgency,
  onOpenReceiptForAgency,
  onOpenDataManagement,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [agencyToDelete, setAgencyToDelete] = useState<Agency | null>(null);

  const filteredAgencies = agencies.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.phone && a.phone.includes(searchTerm))
  );

  const handleWhatsApp = (e: React.MouseEvent, a: Agency) => {
    e.stopPropagation();
    const msg = `Ciao ${a.contactPerson || a.name}, ti contatto riguardo ai prossimi turni e alla liquidazione dei compensi promozionali.`;
    appInventorBridge.send('OPEN_WHATSAPP', {
      agencyName: a.name,
      contactPerson: a.contactPerson,
      phone: a.phone,
      message: msg
    });
    window.location.href = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  const handleCall = (e: React.MouseEvent, a: Agency) => {
    e.stopPropagation();
    appInventorBridge.send('DIAL_PHONE', {
      agencyName: a.name,
      contactPerson: a.contactPerson,
      phone: a.phone
    });
    window.location.href = `tel:${a.phone || '+393491122334'}`;
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Le Mie Agenzie di Incarico</h2>
          <p className="text-xs text-slate-500">
            {agencies.length} agenzie con cui collabori per le promozioni
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSearchTerm('');
            onAddAgency();
          }}
          className="min-h-[44px] px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuova Agenzia</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cerca agenzia, referente o città..."
          className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
        />
      </div>

      {/* Agencies Grid */}
      {filteredAgencies.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {agencies.length === 0 ? 'Nessuna Agenzia in Archivio' : 'Nessuna agenzia corrisponde alla ricerca'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {agencies.length === 0
                ? 'L\'elenco delle agenzie di incarico è vuoto. Aggiungi la tua prima agenzia oppure apri la Gestione Dati per caricare i dati demo.'
                : 'Prova a modificare i termini di ricerca o cancella il filtro.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={onAddAgency}
              className="min-h-[40px] px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Aggiungi Prima Agenzia</span>
            </button>
            {onOpenDataManagement && (
              <button
                type="button"
                onClick={onOpenDataManagement}
                className="min-h-[40px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors"
              >
                Gestione Dati & Demo
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredAgencies.map((agency) => {
          const agencyApps = appointments.filter(a => a.agencyId === agency.id && a.status !== 'cancelled');
          const totalEarned = agencyApps.reduce((acc, a) => acc + (a.totalCompensationNet || 0), 0);
          const totalUnpaid = agencyApps.filter(a => a.paymentStatus !== 'paid').reduce((acc, a) => acc + (a.totalCompensationNet || 0), 0);

          return (
            <div
              key={agency.id}
              className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 shadow-xs space-y-3 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {agency.name}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">
                      {agency.contactPerson || 'Referente non indicato'}
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{agency.city}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEditAgency(agency)}
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Modifica"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAgencyToDelete(agency);
                    }}
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 rounded-lg transition-all cursor-pointer"
                    title="Elimina agenzia"
                  >
                    <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-600" />
                  </button>
                </div>
              </div>

              {/* Payment Terms Pill */}
              <div className="p-2 bg-slate-50 rounded-xl text-xs flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-1.5 truncate">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">Pagamento: <strong>{agency.paymentTerms}</strong></span>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  €{agency.defaultDailyRate}/gg
                </span>
              </div>

              {/* Stats Strip */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50/70 p-2 rounded-xl text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Turni Fatti</span>
                  <span className="font-bold text-slate-800 font-tabular">{agencyApps.length}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Guadagnato</span>
                  <span className="font-bold text-slate-800 font-tabular">€ {totalEarned.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Ti Devono</span>
                  <span className={`font-bold font-tabular ${totalUnpaid > 0 ? 'text-amber-600 font-extrabold' : 'text-emerald-600'}`}>
                    € {totalUnpaid.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleCall(e, agency)}
                  className="flex-1 min-h-[38px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Chiama</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleWhatsApp(e, agency)}
                  className="flex-1 min-h-[38px] px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenReceiptForAgency(agency, agencyApps)}
                  className="min-h-[38px] px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors"
                  title="Genera Nota di Prestazione / Ricevuta per questa agenzia"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Nota Spese</span>
                </button>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* In-App Delete Agency Confirmation Modal (100% reliable on MIT App Inventor and all WebViews) */}
      {agencyToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setAgencyToDelete(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-5 space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Elimina Agenzia</h3>
                <p className="text-xs text-slate-500">Conferma rimozione dall'elenco</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Vuoi davvero eliminare <strong className="text-slate-900">{agencyToDelete.name}</strong>? I tuoi turni già svolti o registrati con questa agenzia non andranno persi.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAgencyToDelete(null)}
                className="flex-1 min-h-[44px] px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = agencyToDelete.id;
                  setAgencyToDelete(null);
                  onDeleteAgency(id);
                }}
                className="flex-1 min-h-[44px] px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Elimina</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
