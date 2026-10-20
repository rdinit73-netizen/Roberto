import React, { useState, useRef } from 'react';
import { 
  X, 
  Trash2, 
  RotateCcw, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  Wallet,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { Agency, Appointment, FinancialStats } from '../types';
import { StorageService } from '../services/storage';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  agencies: Agency[];
  stats: FinancialStats;
  onDataChanged: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  appointments,
  agencies,
  stats,
  onDataChanged
}) => {
  const [confirmStep, setConfirmStep] = useState<'none' | 'all' | 'appointments' | 'restore'>('none');
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);
  };

  const handleClearAll = () => {
    StorageService.clearAllData();
    onDataChanged();
    setConfirmStep('none');
    showFeedback('Archivi azzerati con successo! L\'app è ora vuota e pronta per i tuoi dati personali.');
  };

  const handleClearAppointmentsOnly = () => {
    StorageService.clearAppointmentsOnly();
    onDataChanged();
    setConfirmStep('none');
    showFeedback('Turni e guadagni azzerati! L\'elenco delle agenzie è stato conservato.');
  };

  const handleRestoreDemo = () => {
    StorageService.restoreDemoData();
    onDataChanged();
    setConfirmStep('none');
    showFeedback('Dati di esempio ripristinati (4 agenzie e 5 turni dimostrativi).');
  };

  const handleDownloadBackup = () => {
    const data = StorageService.exportAllDataJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `promomanager_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showFeedback('Backup scaricato correttamente.');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = StorageService.importAllDataJSON(content);
        if (success) {
          onDataChanged();
          showFeedback('Dati ripristinati con successo dal file di backup!');
        } else {
          showFeedback('File non valido. Assicurati che sia un backup JSON valido di Promo Manager.', 'error');
        }
      } catch {
        showFeedback('Errore durante la lettura del file.', 'error');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Gestione & Azzeramento Archivi
              </h3>
              <p className="text-xs text-slate-500">
                Inizia l'app da zero o gestisci i tuoi salvataggi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div className={`px-4 py-3 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
            feedbackMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' 
              : 'bg-red-50 text-red-800 border-b border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{feedbackMessage.text}</span>
            </div>
            {feedbackMessage.type === 'success' && (
              <button
                type="button"
                onClick={onClose}
                className="self-end sm:self-auto px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
              >
                Torna all'App
              </button>
            )}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-slate-800 text-xs">
          
          {/* Current Archives Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Stato Attuale Archivi in Memoria
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[10px] font-semibold text-slate-600">Turni</span>
                </div>
                <span className="text-base font-bold text-slate-900 font-tabular">
                  {appointments.length}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[10px] font-semibold text-slate-600">Agenzie</span>
                </div>
                <span className="text-base font-bold text-slate-900 font-tabular">
                  {agencies.length}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-semibold text-slate-600">Netto</span>
                </div>
                <span className="text-base font-bold text-slate-900 font-tabular">
                  € {stats.totalCompensationNet.toFixed(0)}
                </span>
              </div>
            </div>
          </div>

          {/* ACTION 1: WIPE EVERYTHING TO START FROM ZERO */}
          <div className="border border-red-200 rounded-2xl p-4 bg-red-50/40 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-red-950">
                  1. Azzera Tutto e Inizia da Zero
                </h4>
                <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                  Elimina contemporaneamente <strong>tutti i turni</strong> e <strong>tutte le agenzie</strong>. L'app tornerà completamente pulita e vuota, pronta per registrare le tue reali agenzie di incarico e i tuoi appuntamenti personali.
                </p>
              </div>
            </div>

            {confirmStep === 'all' ? (
              <div className="bg-white p-3.5 rounded-xl border border-red-300 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-red-700 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>Confermi di voler cancellare tutti i dati e iniziare da zero?</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Questa operazione è irreversibile a meno che tu non abbia salvato prima un file di backup.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="flex-1 min-h-[44px] px-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Sì, Cancella Tutto e Inizia da Zero
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmStep('none')}
                    className="min-h-[44px] px-4 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmStep('all')}
                className="w-full min-h-[44px] px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Azzera Tutti gli Archivi (Inizia da Zero)</span>
              </button>
            )}
          </div>

          {/* ACTION 2: WIPE ONLY APPOINTMENTS (KEEP AGENCIES) */}
          <div className="border border-amber-200 rounded-2xl p-4 bg-amber-50/40 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-950">
                  2. Azzera solo Turni e Guadagni
                </h4>
                <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                  Elimina tutti gli appuntamenti e azzera le statistiche finanziarie, ma <strong>conserva la rubrica delle tue agenzie</strong> (nomi, referenti, tariffe orarie e rimborsi km già configurati).
                </p>
              </div>
            </div>

            {confirmStep === 'appointments' ? (
              <div className="bg-white p-3.5 rounded-xl border border-amber-300 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Vuoi cancellare tutti i turni mantenendo le agenzie?</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleClearAppointmentsOnly}
                    className="flex-1 min-h-[40px] px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    Conferma Azzeramento Turni
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmStep('none')}
                    className="min-h-[40px] px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmStep('appointments')}
                className="w-full min-h-[42px] px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>Azzera Solo i Turni (Conserva le Agenzie)</span>
              </button>
            )}
          </div>

          {/* ACTION 3: RESTORE DEMO DATA */}
          <div className="border border-indigo-200 rounded-2xl p-4 bg-indigo-50/30 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-indigo-950">
                  3. Ripristina Dati Demo di Esempio
                </h4>
                <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                  Se desideri provare le funzionalità prima di inserire i tuoi dati, ricarica le 4 agenzie di prova (CPM Italy, Gruppo FMA, Slogan, Promomedia) e i 5 turni dimostrativi.
                </p>
              </div>
            </div>

            {confirmStep === 'restore' ? (
              <div className="bg-white p-3.5 rounded-xl border border-indigo-300 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                  <RotateCcw className="w-4 h-4 shrink-0 text-indigo-600" />
                  <span>Sostituire i dati attuali con gli esempi dimostrativi?</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRestoreDemo}
                    className="flex-1 min-h-[40px] px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    Ricarica Esempi Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmStep('none')}
                    className="min-h-[40px] px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmStep('restore')}
                className="w-full min-h-[42px] px-4 py-2 bg-white hover:bg-slate-50 border border-indigo-300 text-indigo-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ricarica Dati Demo di Esempio</span>
              </button>
            )}
          </div>

          {/* ACTION 4: BACKUP & RESTORE JSON */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Backup di Sicurezza & Trasferimento
                </h4>
                <p className="text-[11px] text-slate-500">
                  Esporta o importa il tuo archivio su un altro telefono o browser
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="min-h-[40px] px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Salva Backup JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[40px] px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>Ripristina Backup</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>
          </div>

          {/* Privacy & Storage Explanatory note */}
          <div className="p-3 bg-slate-100/70 rounded-xl text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              I dati sono conservati nella memoria interna del tuo dispositivo (LocalStorage/WebViewer). I tuoi appuntamenti, le tue agenzie e i tuoi compensi non vengono mai condivisi né inviati a terzi.
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
