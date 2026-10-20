import React from 'react';
import { Plus, Database } from 'lucide-react';

interface NavbarProps {
  onNewAppointment: () => void;
  onOpenDataManagement?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewAppointment,
  onOpenDataManagement,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
            PM
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-slate-900 leading-tight truncate">
              Promo Manager
            </h1>
            <p className="text-[11px] text-slate-500 leading-none truncate">
              Diario Turni & Guadagni Promoter
            </p>
          </div>
        </div>

        {/* Right Action Zone */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenDataManagement && (
            <button
              type="button"
              onClick={onOpenDataManagement}
              title="Gestione archivi, azzeramento dati per iniziare da zero e backup"
              className="min-h-[38px] px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-slate-600" />
              <span>Archivio Dati</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNewAppointment}
            className="min-h-[38px] px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Turno</span>
          </button>
        </div>
      </div>
    </header>
  );
};
