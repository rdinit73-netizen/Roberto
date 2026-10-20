import React, { useState, useEffect, useMemo } from 'react';
import { X, Calculator, Check, Building2, AlertCircle } from 'lucide-react';
import { Agency, Appointment, AppointmentStatus, PaymentMethod, PaymentStatus, RateType } from '../types';
import { StorageService } from '../services/storage';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Appointment) => void;
  initialAppointment?: Appointment | Partial<Appointment> | null;
  agencies: Agency[];
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAppointment,
  agencies,
}) => {
  const defaultDate = new Date().toISOString().split('T')[0];
  const firstAgency = agencies[0];

  const [formError, setFormError] = useState<string | null>(null);
  const [title, setTitle] = useState(initialAppointment?.title || '');
  const [clientBrand, setClientBrand] = useState(initialAppointment?.clientBrand || '');
  const [agencyId, setAgencyId] = useState(initialAppointment?.agencyId || firstAgency?.id || '');
  const [manualAgencyName, setManualAgencyName] = useState('');
  const [isAddingNewAgency, setIsAddingNewAgency] = useState(agencies.length === 0);
  const [date, setDate] = useState(initialAppointment?.date || defaultDate);
  const [startTime, setStartTime] = useState(initialAppointment?.startTime || '09:00');
  const [endTime, setEndTime] = useState(initialAppointment?.endTime || '18:00');
  const [breakMinutes, setBreakMinutes] = useState(initialAppointment?.breakMinutes ?? 60);
  const [locationName, setLocationName] = useState(initialAppointment?.locationName || '');
  const [address, setAddress] = useState(initialAppointment?.address || '');
  const [city, setCity] = useState(initialAppointment?.city || '');
  const [status, setStatus] = useState<AppointmentStatus>(initialAppointment?.status || 'scheduled');
  const [taskDescription, setTaskDescription] = useState(initialAppointment?.taskDescription || '');

  // Financial fields
  const [rateType, setRateType] = useState<RateType>(initialAppointment?.rateType || 'daily');
  const [baseCompensation, setBaseCompensation] = useState<number>(initialAppointment?.baseCompensation ?? 85);
  const [kmDriven, setKmDriven] = useState<number>(initialAppointment?.kmDriven ?? 0);
  const [kmRate, setKmRate] = useState<number>(0.30);
  const [expensesReceipts, setExpensesReceipts] = useState<number>(initialAppointment?.expensesReceipts ?? 0);
  const [salesBonus, setSalesBonus] = useState<number>(initialAppointment?.salesBonus ?? 0);
  const [applyWithholdingTax, setApplyWithholdingTax] = useState<boolean>(initialAppointment?.applyWithholdingTax ?? true);

  // Field sales
  const [salesCount, setSalesCount] = useState<number>(initialAppointment?.salesCount ?? 0);
  const [cashCollected, setCashCollected] = useState<number>(initialAppointment?.cashCollected ?? 0);
  const [samplesDistributed, setSamplesDistributed] = useState<number>(initialAppointment?.samplesDistributed ?? 0);

  // Payment
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(initialAppointment?.paymentStatus || 'unpaid');
  const [paymentDate, setPaymentDate] = useState<string>(initialAppointment?.paymentDate || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialAppointment?.paymentMethod || 'bank_transfer');
  const [paymentNote, setPaymentNote] = useState<string>(initialAppointment?.paymentNote || '');

  // Selected agency info
  const selectedAgency = useMemo(() => {
    return agencies.find(a => a.id === agencyId) || firstAgency;
  }, [agencyId, agencies, firstAgency]);

  // Recalculate defaults when agency changes and not editing
  useEffect(() => {
    if (!initialAppointment && selectedAgency) {
      if (selectedAgency.defaultKmRate) setKmRate(selectedAgency.defaultKmRate);
      if (rateType === 'daily' && selectedAgency.defaultDailyRate) {
        setBaseCompensation(selectedAgency.defaultDailyRate);
      }
    }
  }, [selectedAgency, initialAppointment]);

  const recalculateHourly = (start: string, end: string, pauseMin: number, hourlyPrice: number) => {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    const minutes = (h2 * 60 + m2) - (h1 * 60 + m1) - pauseMin;
    const hours = Math.max(0, minutes / 60);
    const calculated = Math.round(hours * hourlyPrice * 100) / 100;
    setBaseCompensation(calculated);
  };

  const handleRateTypeChange = (newType: RateType) => {
    setRateType(newType);
    if (newType === 'daily') {
      setBaseCompensation(selectedAgency?.defaultDailyRate || 85);
    } else if (newType === 'hourly') {
      recalculateHourly(startTime, endTime, breakMinutes, selectedAgency?.defaultHourlyRate || 12);
    }
  };

  const calculatedKmReimbursement = useMemo(() => {
    return Math.round(kmDriven * kmRate * 100) / 100;
  }, [kmDriven, kmRate]);

  const { grossTotal, withholdingTax, netTotal } = useMemo(() => {
    const base = Number(baseCompensation) || 0;
    const km = Number(calculatedKmReimbursement) || 0;
    const exp = Number(expensesReceipts) || 0;
    const bonus = Number(salesBonus) || 0;

    const gross = base + km + exp + bonus;
    const tax = applyWithholdingTax ? Math.round((base + bonus) * 0.20 * 100) / 100 : 0;
    const net = Math.round((gross - tax) * 100) / 100;

    return {
      grossTotal: gross,
      withholdingTax: tax,
      netTotal: net
    };
  }, [baseCompensation, calculatedKmReimbursement, expensesReceipts, salesBonus, applyWithholdingTax]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientBrand.trim()) {
      setFormError('Inserisci il Brand o Marchio Cliente (es. Samsung, Nespresso, Lavazza...)');
      return;
    }
    if (!title.trim()) {
      setFormError('Inserisci il Titolo del Turno (es. Promoter Degustazione, Hostess Stand...)');
      return;
    }
    setFormError(null);

    let finalAgencyId = selectedAgency?.id || '';
    let finalAgencyName = selectedAgency?.name || '';
    let finalAgencyContact = selectedAgency?.contactPerson;
    let finalAgencyPhone = selectedAgency?.phone;

    if ((isAddingNewAgency || !finalAgencyId) && manualAgencyName.trim()) {
      const createdAgency: Agency = {
        id: 'ag-' + Date.now(),
        name: manualAgencyName.trim(),
        contactPerson: '',
        phone: '',
        email: '',
        city: city.trim() || 'Italia',
        paymentTerms: '30 gg fine mese',
        defaultDailyRate: Number(baseCompensation) || 85,
        defaultHourlyRate: 12,
        defaultKmRate: kmRate || 0.30,
        rating: 5,
        notes: 'Creata contestualmente alla registrazione del turno'
      };
      StorageService.saveAgency(createdAgency);
      finalAgencyId = createdAgency.id;
      finalAgencyName = createdAgency.name;
    }

    const appointmentToSave: Appointment = {
      id: initialAppointment?.id || 'app-' + Date.now(),
      title: title.trim(),
      clientBrand: clientBrand.trim(),
      agencyId: finalAgencyId || 'ag-generica',
      agencyName: finalAgencyName || 'Mia Agenzia',
      agencyContactPerson: finalAgencyContact,
      agencyPhone: finalAgencyPhone,
      date,
      startTime,
      endTime,
      breakMinutes: Number(breakMinutes) || 0,
      locationName: locationName.trim() || 'Punto Vendita',
      address: address.trim(),
      city: city.trim(),
      status,
      taskDescription: taskDescription.trim(),

      rateType,
      baseCompensation: Number(baseCompensation) || 0,
      kmDriven: Number(kmDriven) || 0,
      kmReimbursement: calculatedKmReimbursement,
      expensesReceipts: Number(expensesReceipts) || 0,
      salesBonus: Number(salesBonus) || 0,
      applyWithholdingTax,
      totalCompensationGross: grossTotal,
      withholdingTaxAmount: withholdingTax,
      totalCompensationNet: netTotal,

      salesCount: Number(salesCount) || 0,
      cashCollected: Number(cashCollected) || 0,
      samplesDistributed: Number(samplesDistributed) || 0,

      paymentStatus,
      paymentDate: paymentStatus === 'paid' ? (paymentDate || defaultDate) : undefined,
      paymentMethod: paymentStatus === 'paid' ? paymentMethod : undefined,
      paymentNote: paymentNote.trim(),

      createdAt: initialAppointment?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(appointmentToSave);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full sm:max-w-xl max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {initialAppointment ? 'Modifica Turno / Appuntamento' : 'Registra Nuovo Turno Promo'}
            </h3>
            <p className="text-xs text-slate-500">
              Associa l'agenzia di incarico e calcola il tuo compenso
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-5 overflow-y-auto flex-1">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* SECTION 1: BRAND & AGENZIA DI INCARICO */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Brand & Agenzia di Incarico
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand / Prodotto Promosso *
                </label>
                <input
                  type="text"
                  required
                  value={clientBrand}
                  onChange={(e) => setClientBrand(e.target.value)}
                  placeholder="Es. Nespresso, Dior, Samsung, Lavazza..."
                  className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Titolo Campagna / Evento *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Es. Lancio Profumo Primavera"
                  className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Agenzia che ti ha affidato l'incarico *</span>
                </label>
                {agencies.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewAgency(!isAddingNewAgency);
                      if (!isAddingNewAgency) {
                        setManualAgencyName('');
                      }
                    }}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    {isAddingNewAgency ? '← Scegli da elenco' : '+ Nuova Agenzia'}
                  </button>
                )}
              </div>

              {isAddingNewAgency || agencies.length === 0 ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    required
                    value={manualAgencyName}
                    onChange={(e) => setManualAgencyName(e.target.value)}
                    placeholder="Digita il nome dell'agenzia (es. CPM Italy, Promomedia, Gruppo FMA...)"
                    className="w-full min-h-[44px] px-3 py-2 text-xs bg-amber-50/60 border border-amber-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-900"
                  />
                  <p className="text-[11px] text-amber-700">
                    Questa nuova agenzia verrà registrata automaticamente anche nella tua rubrica per i prossimi turni.
                  </p>
                </div>
              ) : (
                <select
                  value={agencyId}
                  onChange={(e) => setAgencyId(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-900"
                >
                  {agencies.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.contactPerson ? `${a.contactPerson} · ` : ''}{a.paymentTerms})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* SECTION 2: DATE & LOCATION */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Data, Orari & Location
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Data</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full min-h-[44px] px-2 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Inizio</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    if (rateType === 'hourly') {
                      recalculateHourly(e.target.value, endTime, breakMinutes, selectedAgency?.defaultHourlyRate || 12);
                    }
                  }}
                  className="w-full min-h-[44px] px-2 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Fine</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    if (rateType === 'hourly') {
                      recalculateHourly(startTime, e.target.value, breakMinutes, selectedAgency?.defaultHourlyRate || 12);
                    }
                  }}
                  className="w-full min-h-[44px] px-2 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Pausa (min)</label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={breakMinutes}
                  onChange={(e) => {
                    setBreakMinutes(Number(e.target.value));
                    if (rateType === 'hourly') {
                      recalculateHourly(startTime, endTime, Number(e.target.value), selectedAgency?.defaultHourlyRate || 12);
                    }
                  }}
                  className="w-full min-h-[44px] px-2 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Punto Vendita / Store
                </label>
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Es. MediaWorld Rozzano, Sephora Corso Buenos Aires"
                  className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Città</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Es. Milano"
                  className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Indirizzo
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Es. Viale Certosa 29"
                className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          {/* SECTION 3: IL TUO COMPENSO & RIMBORSI AUTO */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-indigo-600" />
              <span>3. Il Tuo Compenso & Rimborsi Spese</span>
            </h4>

            {/* Rate Type Selector */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => handleRateTypeChange('daily')}
                className={`min-h-[38px] rounded-lg transition-colors ${
                  rateType === 'daily' ? 'bg-white text-indigo-600 font-bold shadow-sm' : 'text-slate-600'
                }`}
              >
                Giornaliero
              </button>
              <button
                type="button"
                onClick={() => handleRateTypeChange('hourly')}
                className={`min-h-[38px] rounded-lg transition-colors ${
                  rateType === 'hourly' ? 'bg-white text-indigo-600 font-bold shadow-sm' : 'text-slate-600'
                }`}
              >
                Orario
              </button>
              <button
                type="button"
                onClick={() => handleRateTypeChange('fixed')}
                className={`min-h-[38px] rounded-lg transition-colors ${
                  rateType === 'fixed' ? 'bg-white text-indigo-600 font-bold shadow-sm' : 'text-slate-600'
                }`}
              >
                Forfait Fisso
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Compenso Base (€)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={baseCompensation}
                  onChange={(e) => setBaseCompensation(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold font-tabular"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Km Auto Percorsi
                </label>
                <input
                  type="number"
                  min="0"
                  value={kmDriven}
                  onChange={(e) => setKmDriven(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-tabular"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Spese / Scontrini (€)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={expensesReceipts}
                  onChange={(e) => setExpensesReceipts(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-tabular"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Bonus / Extra (€)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={salesBonus}
                  onChange={(e) => setSalesBonus(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-tabular"
                />
              </div>
            </div>

            {/* Withholding tax toggle */}
            <div className="flex items-center justify-between p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
              <div>
                <span className="text-xs font-semibold text-indigo-950 block">
                  Ritenuta d'acconto 20% (Prestazione occasionale)
                </span>
                <span className="text-[11px] text-indigo-700 block">
                  Scorpora la ritenuta del 20% sul compenso base (€{withholdingTax.toFixed(2)})
                </span>
              </div>
              <input
                type="checkbox"
                checked={applyWithholdingTax}
                onChange={(e) => setApplyWithholdingTax(e.target.checked)}
                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 shrink-0"
              />
            </div>

            {/* Live Calculation Box */}
            <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Compenso Base + Bonus:</span>
                <span className="font-tabular text-slate-200">€ {(baseCompensation + salesBonus).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Rimborsi (Km {kmDriven} × €{kmRate.toFixed(2)} + Spese):</span>
                <span className="font-tabular text-slate-200">€ {(calculatedKmReimbursement + expensesReceipts).toFixed(2)}</span>
              </div>
              {applyWithholdingTax && (
                <div className="flex justify-between text-amber-300">
                  <span>- Ritenuta d'acconto (20%):</span>
                  <span className="font-tabular">- € {withholdingTax.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-sm font-bold">
                <span>Il Tuo Guadagno Netto da Incassare:</span>
                <span className="text-emerald-400 text-base font-tabular">€ {netTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* SECTION 4: STATO INCASSO DALL'AGENZIA */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              4. Stato Pagamento dall'Agenzia
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Stato Incasso
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                >
                  <option value="unpaid">Non Ancora Pagata</option>
                  <option value="pending">In Attesa di Bonifico</option>
                  <option value="paid">Pagata / Incassata</option>
                </select>
              </div>

              {paymentStatus === 'paid' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Metodo Ricevuto
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                    >
                      <option value="bank_transfer">Bonifico Bancario</option>
                      <option value="paypal">PayPal</option>
                      <option value="cash">Contanti</option>
                      <option value="other">Altro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Data Incasso
                    </label>
                    <input
                      type="date"
                      value={paymentDate || defaultDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Field results */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                  Pezzi Venduti
                </label>
                <input
                  type="number"
                  min="0"
                  value={salesCount}
                  onChange={(e) => setSalesCount(Number(e.target.value))}
                  className="w-full min-h-[44px] px-2 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-tabular"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                  Cassa Incassata (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={cashCollected}
                  onChange={(e) => setCashCollected(Number(e.target.value))}
                  className="w-full min-h-[44px] px-2 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-tabular"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                  Campioni Distribuiti
                </label>
                <input
                  type="number"
                  min="0"
                  value={samplesDistributed}
                  onChange={(e) => setSamplesDistributed(Number(e.target.value))}
                  className="w-full min-h-[44px] px-2 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-tabular"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Note, Briefing o Divisa Richiesta
              </label>
              <textarea
                rows={2}
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Brief agenzia, referente da cercare in store, divisa richiesta..."
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[46px] rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[46px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Salva Turno</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
