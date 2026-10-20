export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid';
export type RateType = 'daily' | 'hourly' | 'fixed';
export type PaymentMethod = 'bank_transfer' | 'paypal' | 'cash' | 'other';

export interface Agency {
  id: string;
  name: string;             // Nome Agenzia di lavoro/promozione es. "CPM Italy", "Gruppo FMA"
  contactPerson: string;     // Booker / Referente es. "Laura - Booker Eventi"
  phone: string;            // Telefono referente
  email: string;            // Email invio report / fatture
  city: string;             // Sede o filiale
  paymentTerms: string;     // Termini pagamento es. "30 gg fine mese", "15 gg da ricevuta"
  defaultDailyRate?: number; // Tariffa giornaliera media con questa agenzia
  defaultHourlyRate?: number;// Tariffa oraria media
  defaultKmRate?: number;    // Rimborso km concordato
  notes?: string;           // Note contrattuali, istruzioni invio ricevute, IBAN comunicato
  rating?: number;          // 1 - 5 stelle puntualità pagamenti
}

export interface Appointment {
  id: string;
  title: string;            // Nome evento / campagna es. "Lancio Caffè Vertuo"
  clientBrand: string;      // Brand o committente finale es. "Nespresso"
  agencyId: string;         // Agenzia che ha affidato l'incarico alla promoter
  agencyName: string;
  agencyContactPerson?: string;
  agencyPhone?: string;

  date: string;             // YYYY-MM-DD
  startTime: string;        // HH:mm es. "09:00"
  endTime: string;          // HH:mm es. "18:00"
  breakMinutes: number;     // Minuti pausa
  locationName: string;     // Store es. "MediaWorld Certosa"
  address: string;          // Indirizzo store
  city: string;             // Città
  status: AppointmentStatus;
  taskDescription?: string; // Briefing, abbigliamento divisa, materiale ritirato

  // Dati economici / Guadagno della promoter
  rateType: RateType;
  baseCompensation: number;       // Compenso pattuito con l'agenzia
  kmDriven: number;               // Km percorsi con la propria auto
  kmReimbursement: number;        // Rimborso km calcolato
  expensesReceipts: number;       // Spese anticipate dalla promoter (parcheggi, pedaggi, pasti)
  salesBonus: number;             // Bonus o incentivo extra pattuito
  applyWithholdingTax: boolean;   // Se la promoter applica ritenuta d'acconto 20%
  totalCompensationGross: number; // Totale lordo (base + km + spese + bonus)
  withholdingTaxAmount: number;   // 20% calcolato sul compenso imponibile
  totalCompensationNet: number;   // Netto reale che la promoter deve incassare

  // Risultati sul campo
  salesCount: number;             // Pezzi venduti / contratti
  cashCollected: number;          // Cassa gestita (se prevista)
  samplesDistributed: number;     // Campioni omaggio distribuiti

  // Stato incasso del compenso dall'agenzia
  paymentStatus: PaymentStatus;   // 'unpaid' = da incassare, 'pending' = bonifico in arrivo, 'paid' = incassato
  paymentDate?: string;           // Data accredito bonifico
  paymentMethod?: PaymentMethod;  // Bonifico bancario, PayPal, contanti
  paymentNote?: string;           // Riferimento bonifico o CRO

  createdAt: string;
  updatedAt: string;
}

export interface FinancialStats {
  totalAppointments: number;
  totalCompensationGross: number;
  totalCompensationNet: number;
  totalPaid: number;              // Totale già incassato dalla promoter
  totalUnpaid: number;            // Totale crediti ancora da incassare dalle agenzie
  totalKmReimbursements: number;
  totalExpenses: number;
  totalCashCollected: number;
  totalSalesCount: number;
}

export interface AppInventorBridgeLog {
  id: string;
  timestamp: string;
  direction: 'sent' | 'received';
  payload: string;
  action: string;
}
