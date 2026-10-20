import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Building2, Phone, Mail, Clock, Euro, AlertCircle, Trash2 } from 'lucide-react';
import { Agency } from '../types';

interface AgencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agency: Agency) => void;
  onDelete?: (id: string) => void;
  initialAgency?: Agency | null;
}

export const AgencyModal: React.FC<AgencyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialAgency,
}) => {
  const [name, setName] = useState(initialAgency?.name || '');
  const [contactPerson, setContactPerson] = useState(initialAgency?.contactPerson || '');
  const [phone, setPhone] = useState(initialAgency?.phone || '');
  const [email, setEmail] = useState(initialAgency?.email || '');
  const [city, setCity] = useState(initialAgency?.city || '');
  const [paymentTerms, setPaymentTerms] = useState(initialAgency?.paymentTerms || '30 gg fine mese');
  const [defaultDailyRate, setDefaultDailyRate] = useState<string>(
    initialAgency?.defaultDailyRate !== undefined ? String(initialAgency.defaultDailyRate) : '90'
  );
  const [defaultHourlyRate, setDefaultHourlyRate] = useState<string>(
    initialAgency?.defaultHourlyRate !== undefined ? String(initialAgency.defaultHourlyRate) : '12'
  );
  const [defaultKmRate, setDefaultKmRate] = useState<string>(
    initialAgency?.defaultKmRate !== undefined ? String(initialAgency.defaultKmRate) : '0.30'
  );
  const [notes, setNotes] = useState(initialAgency?.notes || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Sync state if initialAgency changes
  useEffect(() => {
    setName(initialAgency?.name || '');
    setContactPerson(initialAgency?.contactPerson || '');
    setPhone(initialAgency?.phone || '');
    setEmail(initialAgency?.email || '');
    setCity(initialAgency?.city || '');
    setPaymentTerms(initialAgency?.paymentTerms || '30 gg fine mese');
    setDefaultDailyRate(
      initialAgency?.defaultDailyRate !== undefined ? String(initialAgency.defaultDailyRate) : '90'
    );
    setDefaultHourlyRate(
      initialAgency?.defaultHourlyRate !== undefined ? String(initialAgency.defaultHourlyRate) : '12'
    );
    setDefaultKmRate(
      initialAgency?.defaultKmRate !== undefined ? String(initialAgency.defaultKmRate) : '0.30'
    );
    setNotes(initialAgency?.notes || '');
    setErrorMessage(null);
  }, [initialAgency, isOpen]);

  if (!isOpen) return null;

  const executeSave = () => {
    // Read directly from DOM ref as fallback for Android keyboard IME composition
    const rawName = nameInputRef.current ? nameInputRef.current.value : name;
    const finalName = (rawName || name || '').trim();

    if (!finalName) {
      setErrorMessage("Inserisci il nome dell'agenzia per poterla salvare.");
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
      return;
    }

    setErrorMessage(null);

    const agency: Agency = {
      id: initialAgency?.id || 'ag-' + Date.now(),
      name: finalName,
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      city: city.trim() || 'Milano',
      paymentTerms: paymentTerms.trim() || '30 gg fine mese',
      defaultDailyRate: Number(defaultDailyRate) || 90,
      defaultHourlyRate: Number(defaultHourlyRate) || 12,
      defaultKmRate: Number(defaultKmRate) || 0.30,
      notes: notes.trim(),
      rating: initialAgency?.rating || 5
    };

    onSave(agency);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSave();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white w-full sm:max-w-md max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {initialAgency ? 'Modifica Agenzia' : 'Nuova Agenzia'}
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                Salva i contatti del tuo booker
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 active:scale-95 transition-all cursor-pointer"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form wrapping ALL inputs AND submit buttons (App Inventor and mobile standard) */}
        <form 
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          {/* Scrollable inputs body */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1 overscroll-contain">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Nome Agenzia */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Agenzia * <span className="text-[10px] text-slate-400 font-normal">(obbligatorio)</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Es. CPM Italy, Promomedia, Gruppo FMA..."
                className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-900"
              />
            </div>

            {/* Referente & Città */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Referente / Booker
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Es. Laura Booker Tech"
                  className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Città / Sede
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Es. Milano, Roma, Torino..."
                  className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>
            </div>

            {/* Telefono & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>Telefono / WhatsApp Booker</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Es. +39 349 1122334"
                  className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-500" />
                  <span>Email Ricevute / Booker</span>
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="report@agenzia.it"
                  className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>
            </div>

            {/* Tempi di pagamento */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>Tempi e Condizioni Pagamento</span>
              </label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Es. 30 gg fine mese con bonifico, entro 15 gg da ricevuta..."
                className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Tariffe concordate con questa agenzia */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide block">
                Tariffe Predefinite di Riferimento
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Giornata (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={defaultDailyRate}
                    onChange={(e) => setDefaultDailyRate(e.target.value)}
                    className="w-full min-h-[40px] px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg font-bold font-tabular text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Oraria (€/h)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={defaultHourlyRate}
                    onChange={(e) => setDefaultHourlyRate(e.target.value)}
                    className="w-full min-h-[40px] px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg font-bold font-tabular text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Km (€/km)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.05"
                    value={defaultKmRate}
                    onChange={(e) => setDefaultKmRate(e.target.value)}
                    className="w-full min-h-[40px] px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg font-bold font-tabular text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Note, Istruzioni Report o Codici Portale
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Orari invio foto store, credenziali app di timbratura, IBAN comunicato..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
              />
            </div>
          </div>

          {/* Form Action Buttons INSIDE form tag - 100% compatible with App Inventor WebViewer */}
          <div className="p-3 border-t border-slate-200 bg-white space-y-2 shrink-0">
            {showDeleteConfirm ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-2 animate-in fade-in">
                <p className="font-semibold text-rose-900">
                  Vuoi davvero eliminare quest'agenzia dall'elenco?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 min-h-[40px] bg-white border border-rose-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (initialAgency && onDelete) {
                        onDelete(initialAgency.id);
                      }
                    }}
                    className="flex-1 min-h-[40px] bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Elimina</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                {initialAgency && onDelete && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="min-h-[46px] min-w-[46px] px-3 rounded-xl border border-rose-200 text-rose-600 bg-rose-50/60 hover:bg-rose-100 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                    title="Elimina agenzia"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 min-h-[46px] rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[46px] rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salva Agenzia</span>
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
