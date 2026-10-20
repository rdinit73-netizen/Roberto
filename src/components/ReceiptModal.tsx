import React, { useState } from 'react';
import { X, Printer, Share2, Copy, Check, Receipt, Building2 } from 'lucide-react';
import { Agency, Appointment } from '../types';
import { appInventorBridge } from '../services/appInventorBridge';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  agency: Agency | null;
  appointments: Appointment[];
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  agency,
  appointments,
}) => {
  const [copied, setCopied] = useState(false);

  const today = new Date().toLocaleDateString('it-IT');

  const totalBase = appointments.reduce((acc, a) => acc + (a.baseCompensation || 0), 0);
  const totalKm = appointments.reduce((acc, a) => acc + (a.kmDriven || 0), 0);
  const totalKmReimb = appointments.reduce((acc, a) => acc + (a.kmReimbursement || 0), 0);
  const totalExpenses = appointments.reduce((acc, a) => acc + (a.expensesReceipts || 0), 0);
  const totalBonus = appointments.reduce((acc, a) => acc + (a.salesBonus || 0), 0);
  const totalGross = appointments.reduce((acc, a) => acc + (a.totalCompensationGross || 0), 0);
  const totalTax = appointments.reduce((acc, a) => acc + (a.withholdingTaxAmount || 0), 0);
  const totalNet = appointments.reduce((acc, a) => acc + (a.totalCompensationNet || 0), 0);

  const summaryText = `NOTA COMPENSI & RIMBORSI PROMOTER
Destinatario: Spett.le ${agency?.name || 'Agenzia'}
C.A.: ${agency?.contactPerson || 'Ufficio Contabilità'}
Data Richiesta: ${today}
----------------------------------------
Turni e Incarichi Svolti (${appointments.length}):
${appointments.map(a => `• ${a.date} | ${a.clientBrand} (${a.locationName}, ${a.city}) - Netto: €${a.totalCompensationNet.toFixed(2)} [${a.paymentStatus === 'paid' ? 'Incassato' : 'Da liquidare'}]`).join('\n')}
----------------------------------------
Compenso Base: €${totalBase.toFixed(2)}
Rimborsi Km Auto (${totalKm} km): €${totalKmReimb.toFixed(2)}
Spese Anticipate / Scontrini: €${totalExpenses.toFixed(2)}
${totalBonus > 0 ? `Bonus / Extra: €${totalBonus.toFixed(2)}\n` : ''}${totalTax > 0 ? `Ritenuta d'acconto 20%: -€${totalTax.toFixed(2)}\n` : ''}TOTALE NETTO DA LIQUIDARE: €${totalNet.toFixed(2)}
Condizioni pagamento pattuite: ${agency?.paymentTerms || 'Bonifico bancario'}`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    if (agency) {
      appInventorBridge.send('RECEIPT_COPIED', {
        agencyName: agency.name,
        totalNet,
        appointmentsCount: appointments.length,
        summaryText
      });
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !agency || appointments.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] animate-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Nota Compensi per l'Agenzia
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs font-sans text-slate-800" id="receipt-print-area">
          {/* Header doc */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-3">
            <div>
              <span className="text-base font-bold text-slate-900 block">PROSPETTO LIQUIDAZIONE COMPENSI</span>
              <span className="text-[11px] text-slate-500">Documento riassuntivo per agenzia di incarico</span>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              <span>Data: <strong>{today}</strong></span>
            </div>
          </div>

          {/* Dati Agenzia Destinataria */}
          <div className="bg-slate-50 p-3 rounded-xl space-y-1 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Spett.le Agenzia Destinataria</span>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900">{agency.name}</span>
              <span className="text-xs text-slate-600">{agency.city}</span>
            </div>
            {agency.contactPerson && (
              <p className="text-[11px] text-slate-600">C.A.: {agency.contactPerson}</p>
            )}
            {agency.paymentTerms && (
              <p className="text-[11px] text-slate-500">Termini pattuiti: {agency.paymentTerms}</p>
            )}
          </div>

          {/* Table of Appointments */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              Dettaglio Giornate Lavorate ({appointments.length})
            </span>
            <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-[10px] font-semibold text-slate-700">
                <tr>
                  <th className="p-2">Data</th>
                  <th className="p-2">Brand / Store</th>
                  <th className="p-2 text-right">Netto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td className="p-2 font-mono whitespace-nowrap">{a.date}</td>
                    <td className="p-2">
                      <strong className="text-slate-900">{a.clientBrand}</strong>
                      <span className="text-slate-400 block text-[10px]">{a.locationName} ({a.city})</span>
                    </td>
                    <td className="p-2 text-right font-bold font-tabular">
                      € {a.totalCompensationNet.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="bg-slate-900 text-white p-3.5 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Totale Compenso Base:</span>
              <span className="font-tabular text-slate-200">€ {totalBase.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Rimborsi Chilometrici Auto ({totalKm} km):</span>
              <span className="font-tabular text-slate-200">€ {totalKmReimb.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Spese Anticipate Documentate:</span>
              <span className="font-tabular text-slate-200">€ {totalExpenses.toFixed(2)}</span>
            </div>
            {totalBonus > 0 && (
              <div className="flex justify-between text-emerald-300">
                <span>Bonus & Extra Risultati:</span>
                <span className="font-tabular text-emerald-300">+ € {totalBonus.toFixed(2)}</span>
              </div>
            )}
            {totalTax > 0 && (
              <div className="flex justify-between text-amber-300">
                <span>Ritenuta d'acconto (20%):</span>
                <span className="font-tabular text-amber-300">- € {totalTax.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-sm font-bold">
              <span>TOTALE NETTO DA LIQUIDARE:</span>
              <span className="text-emerald-400 text-base font-tabular">€ {totalNet.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-200 flex flex-col sm:flex-row gap-2 bg-slate-50 print:hidden">
          <button
            type="button"
            onClick={handleCopyText}
            className="flex-1 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiato negli Appunti!' : 'Copia Testo per WhatsApp / Email'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="min-h-[44px] px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Stampa / PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
