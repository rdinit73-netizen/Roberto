import { Agency, Appointment, FinancialStats } from '../types';
import { appInventorBridge } from './appInventorBridge';

const AGENCIES_KEY = 'promomanager_agencies_v2';
const APPOINTMENTS_KEY = 'promomanager_my_appointments_v2';
const INITIALIZED_KEY = 'promomanager_initialized_v2';

function getDateString(offsetDays: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

const INITIAL_AGENCIES: Agency[] = [
  {
    id: 'ag-1',
    name: 'CPM Italy',
    contactPerson: 'Laura Brambilla (Booker Tech)',
    phone: '+39 349 1122334',
    email: 'laura.brambilla@cpmitaly.com',
    city: 'Milano',
    paymentTerms: '30 gg fine mese (puntuali)',
    defaultDailyRate: 90,
    defaultHourlyRate: 12,
    defaultKmRate: 0.35,
    rating: 5,
    notes: 'Inviare report fotografico entro le 20:00 e nota spese entro lunedì.'
  },
  {
    id: 'ag-2',
    name: 'Gruppo FMA',
    contactPerson: 'Marco Riva (Field Manager Food)',
    phone: '+39 335 8899001',
    email: 'm.riva@gruppofma.com',
    city: 'Milano / Roma',
    paymentTerms: '60 gg fine mese con bonifico',
    defaultDailyRate: 85,
    defaultHourlyRate: 11,
    defaultKmRate: 0.30,
    rating: 4.5,
    notes: 'Campagne food & beverage grande distribuzione.'
  },
  {
    id: 'ag-3',
    name: 'Slogan Promotion',
    contactPerson: 'Serena De Luca (Account Luxury)',
    phone: '+39 340 5566778',
    email: 'serena.deluca@sloganpromo.it',
    city: 'Roma',
    paymentTerms: 'Bonifico veloce entro 15 gg',
    defaultDailyRate: 95,
    defaultHourlyRate: 13,
    defaultKmRate: 0.32,
    rating: 5,
    notes: 'Settore profumeria e cosmetica prestige. Richiesta divisa total black.'
  },
  {
    id: 'ag-4',
    name: 'Promomedia Agency',
    contactPerson: 'Andrea Galli (Coordinatore GDO)',
    phone: '+39 328 4433221',
    email: 'andrea.galli@promomedia.it',
    city: 'Bologna',
    paymentTerms: 'Fine mese successivo alla promo',
    defaultDailyRate: 80,
    defaultHourlyRate: 10,
    defaultKmRate: 0.28,
    rating: 4.2,
    notes: 'Promozioni centri commerciali Emilia-Romagna.'
  }
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'app-1',
    title: 'Lancio Nuova Macchina Caffè Vertuo',
    clientBrand: 'Nespresso',
    agencyId: 'ag-1',
    agencyName: 'CPM Italy',
    agencyContactPerson: 'Laura Brambilla',
    agencyPhone: '+39 349 1122334',
    date: getDateString(0), // Oggi
    startTime: '10:00',
    endTime: '19:00',
    breakMinutes: 60,
    locationName: 'MediaWorld Certosa',
    address: 'Viale Certosa 29',
    city: 'Milano',
    status: 'in_progress',
    taskDescription: 'Degustazione caffè, spiegazione tecnologia Vertuo, distribuzione coupon sconto 20€.',
    rateType: 'daily',
    baseCompensation: 90,
    kmDriven: 35,
    kmReimbursement: 12.25,
    expensesReceipts: 8.50, // Parcheggio
    salesBonus: 15.00,
    applyWithholdingTax: true,
    totalCompensationGross: 125.75,
    withholdingTaxAmount: 21.00, // 20% su (90+15)
    totalCompensationNet: 104.75,
    salesCount: 14,
    cashCollected: 1380,
    samplesDistributed: 85,
    paymentStatus: 'unpaid',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'app-2',
    title: 'Campagna Profumi Primavera',
    clientBrand: 'Dior Beauty',
    agencyId: 'ag-3',
    agencyName: 'Slogan Promotion',
    agencyContactPerson: 'Serena De Luca',
    agencyPhone: '+39 340 5566778',
    date: getDateString(1), // Domani
    startTime: '11:00',
    endTime: '19:30',
    breakMinutes: 45,
    locationName: 'Sephora Roma Termini',
    address: 'Via Giovanni Giolitti 40',
    city: 'Roma',
    status: 'confirmed',
    taskDescription: 'Presentazione nuova fragranza Miss Dior, campionatura su mouillette, invito iscrizione loyalty club.',
    rateType: 'daily',
    baseCompensation: 85,
    kmDriven: 20,
    kmReimbursement: 6.00,
    expensesReceipts: 5.00,
    salesBonus: 0,
    applyWithholdingTax: false,
    totalCompensationGross: 96.00,
    withholdingTaxAmount: 0,
    totalCompensationNet: 96.00,
    salesCount: 0,
    cashCollected: 0,
    samplesDistributed: 0,
    paymentStatus: 'unpaid',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'app-3',
    title: 'Degustazione Cioccolato Pregiato',
    clientBrand: 'Lindt & Sprüngli',
    agencyId: 'ag-2',
    agencyName: 'Gruppo FMA',
    agencyContactPerson: 'Marco Riva',
    agencyPhone: '+39 335 8899001',
    date: getDateString(3),
    startTime: '09:30',
    endTime: '18:30',
    breakMinutes: 60,
    locationName: 'Eataly Lingotto',
    address: 'Via Nizza 230/14',
    city: 'Torino',
    status: 'scheduled',
    taskDescription: 'Postazione corner gourmet, assaggi tavolette Excellence fondente, monitoraggio scorte.',
    rateType: 'hourly',
    baseCompensation: 104, // 8 ore lavorative x 13€
    kmDriven: 15,
    kmReimbursement: 4.80,
    expensesReceipts: 0,
    salesBonus: 10,
    applyWithholdingTax: true,
    totalCompensationGross: 118.80,
    withholdingTaxAmount: 22.80,
    totalCompensationNet: 96.00,
    salesCount: 0,
    cashCollected: 0,
    samplesDistributed: 0,
    paymentStatus: 'unpaid',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'app-4',
    title: 'Promo Smartphone 5G & Accessori',
    clientBrand: 'Samsung Electronics',
    agencyId: 'ag-1',
    agencyName: 'CPM Italy',
    agencyContactPerson: 'Laura Brambilla',
    agencyPhone: '+39 349 1122334',
    date: getDateString(-5), // 5 giorni fa (già pagato dall'agenzia)
    startTime: '10:00',
    endTime: '19:00',
    breakMinutes: 60,
    locationName: 'Unieuro Marghera',
    address: 'Via Marghera 28',
    city: 'Milano',
    status: 'completed',
    taskDescription: 'Dimostrazione Galaxy AI su smartphone serie S, omaggi cover brandizzate.',
    rateType: 'daily',
    baseCompensation: 90,
    kmDriven: 18,
    kmReimbursement: 6.30,
    expensesReceipts: 12.00,
    salesBonus: 30.00,
    applyWithholdingTax: true,
    totalCompensationGross: 138.30,
    withholdingTaxAmount: 24.00,
    totalCompensationNet: 114.30,
    salesCount: 9,
    cashCollected: 6490,
    samplesDistributed: 120,
    paymentStatus: 'paid',
    paymentDate: getDateString(-2),
    paymentMethod: 'bank_transfer',
    paymentNote: 'Bonifico istantaneo CRO 994821',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'app-5',
    title: 'Tour Degustazione Birre Artigianali',
    clientBrand: 'Birrificio Poretti',
    agencyId: 'ag-4',
    agencyName: 'Promomedia Agency',
    agencyContactPerson: 'Andrea Galli',
    agencyPhone: '+39 328 4433221',
    date: getDateString(-8), // Completato, in attesa di bonifico
    startTime: '16:00',
    endTime: '22:00',
    breakMinutes: 30,
    locationName: 'Ipercoop Centro Lame',
    address: 'Via Marco Polo 3',
    city: 'Bologna',
    status: 'completed',
    taskDescription: 'Assaggi guidati delle 7 Luppoli, spillatura al bicchiere e flyer promo.',
    rateType: 'fixed',
    baseCompensation: 75,
    kmDriven: 25,
    kmReimbursement: 7.00,
    expensesReceipts: 6.50,
    salesBonus: 12.00,
    applyWithholdingTax: false,
    totalCompensationGross: 100.50,
    withholdingTaxAmount: 0,
    totalCompensationNet: 100.50,
    salesCount: 38,
    cashCollected: 340,
    samplesDistributed: 150,
    paymentStatus: 'pending',
    paymentNote: 'Bonifico programmato fine mese da Promomedia',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export class StorageService {
  private static inMemoryAgencies: Agency[] | null = null;
  private static inMemoryAppointments: Appointment[] | null = null;

  // AGENCIES
  public static getAgencies(): Agency[] {
    try {
      const isInit = localStorage.getItem(INITIALIZED_KEY);
      const data = localStorage.getItem(AGENCIES_KEY);
      if (!isInit && data === null) {
        if (!this.inMemoryAgencies) {
          this.inMemoryAgencies = [...INITIAL_AGENCIES];
        }
        try {
          localStorage.setItem(INITIALIZED_KEY, 'true');
          localStorage.setItem(AGENCIES_KEY, JSON.stringify(INITIAL_AGENCIES));
        } catch {}
        return this.inMemoryAgencies;
      }
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.inMemoryAgencies = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Storage read failed, using memory cache:', e);
    }
    return this.inMemoryAgencies || [];
  }

  public static saveAgency(agency: Agency): Agency {
    const list = [...this.getAgencies()];
    const index = list.findIndex(a => a.id === agency.id);
    if (index >= 0) {
      list[index] = agency;
    } else {
      list.unshift(agency);
    }
    this.inMemoryAgencies = list;

    try {
      localStorage.setItem(INITIALIZED_KEY, 'true');
      localStorage.setItem(AGENCIES_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('LocalStorage save failed (WebView restricted), kept in memory:', e);
    }

    try {
      appInventorBridge.send('AGENCY_SAVED', agency);
    } catch {}

    return agency;
  }

  public static deleteAgency(id: string): void {
    const list = this.getAgencies().filter(a => a.id !== id);
    this.inMemoryAgencies = list;
    try {
      localStorage.setItem(INITIALIZED_KEY, 'true');
      localStorage.setItem(AGENCIES_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Storage error deleting agency:', e);
    }
    try {
      appInventorBridge.send('AGENCY_DELETED', { id });
    } catch {
      // Ignore bridge errors
    }
  }

  // APPOINTMENTS
  public static getAppointments(): Appointment[] {
    try {
      const isInit = localStorage.getItem(INITIALIZED_KEY);
      const data = localStorage.getItem(APPOINTMENTS_KEY);
      if (!isInit && data === null) {
        if (!this.inMemoryAppointments) {
          this.inMemoryAppointments = [...INITIAL_APPOINTMENTS];
        }
        try {
          localStorage.setItem(INITIALIZED_KEY, 'true');
          localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(INITIAL_APPOINTMENTS));
        } catch {}
        return this.inMemoryAppointments;
      }
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.inMemoryAppointments = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Storage read failed for appointments, using memory cache:', e);
    }
    return this.inMemoryAppointments || [];
  }

  public static saveAppointment(appointment: Appointment): Appointment {
    const list = [...this.getAppointments()];
    const now = new Date().toISOString();
    appointment.updatedAt = now;

    const index = list.findIndex(a => a.id === appointment.id);
    if (index >= 0) {
      list[index] = appointment;
    } else {
      if (!appointment.createdAt) appointment.createdAt = now;
      list.unshift(appointment);
    }
    this.inMemoryAppointments = list;

    try {
      localStorage.setItem(INITIALIZED_KEY, 'true');
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('LocalStorage save failed for appointment, kept in memory:', e);
    }

    try {
      appInventorBridge.send('APPOINTMENT_SAVED', appointment);
    } catch {}

    return appointment;
  }

  public static deleteAppointment(id: string): void {
    const list = this.getAppointments().filter(a => a.id !== id);
    this.inMemoryAppointments = list;
    try {
      localStorage.setItem(INITIALIZED_KEY, 'true');
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('LocalStorage delete failed for appointment, removed from memory:', e);
    }
    try {
      appInventorBridge.send('APPOINTMENT_DELETED', { id });
    } catch {}
  }

  public static markAsPaid(appointmentId: string, paymentMethod: any = 'bank_transfer', note: string = ''): Appointment | null {
    const list = [...this.getAppointments()];
    const app = list.find(a => a.id === appointmentId);
    if (!app) return null;

    app.paymentStatus = 'paid';
    app.paymentDate = new Date().toISOString().split('T')[0];
    app.paymentMethod = paymentMethod;
    if (note) app.paymentNote = note;
    app.updatedAt = new Date().toISOString();

    this.inMemoryAppointments = list;
    try {
      localStorage.setItem(INITIALIZED_KEY, 'true');
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('LocalStorage save failed for markAsPaid, kept in memory:', e);
    }

    try {
      appInventorBridge.send('PAYMENT_RECEIVED', {
        appointmentId,
        amount: app.totalCompensationNet,
        agencyName: app.agencyName,
        date: app.paymentDate
      });
    } catch {}

    return app;
  }

  public static markAgencyAppointmentsAsPaid(agencyId: string): number {
    const list = [...this.getAppointments()];
    let count = 0;
    const today = new Date().toISOString().split('T')[0];
    list.forEach(a => {
      if (a.agencyId === agencyId && a.paymentStatus !== 'paid') {
        a.paymentStatus = 'paid';
        a.paymentDate = today;
        a.paymentMethod = 'bank_transfer';
        a.updatedAt = new Date().toISOString();
        count++;
      }
    });

    this.inMemoryAppointments = list;
    try {
      localStorage.setItem(INITIALIZED_KEY, 'true');
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('LocalStorage save failed for markAgencyAppointmentsAsPaid, kept in memory:', e);
    }

    try {
      appInventorBridge.send('AGENCY_ALL_PAID', { agencyId, countSettled: count });
    } catch {}

    return count;
  }

  // FINANCIAL STATS
  public static calculateFinancialStats(): FinancialStats {
    const appointments = this.getAppointments();
    return appointments.reduce(
      (acc, app) => {
        if (app.status === 'cancelled') return acc;

        acc.totalAppointments += 1;
        acc.totalCompensationGross += Number(app.totalCompensationGross || 0);
        acc.totalCompensationNet += Number(app.totalCompensationNet || 0);
        acc.totalKmReimbursements += Number(app.kmReimbursement || 0);
        acc.totalExpenses += Number(app.expensesReceipts || 0);
        acc.totalCashCollected += Number(app.cashCollected || 0);
        acc.totalSalesCount += Number(app.salesCount || 0);

        if (app.paymentStatus === 'paid') {
          acc.totalPaid += Number(app.totalCompensationNet || 0);
        } else {
          acc.totalUnpaid += Number(app.totalCompensationNet || 0);
        }

        return acc;
      },
      {
        totalAppointments: 0,
        totalCompensationGross: 0,
        totalCompensationNet: 0,
        totalPaid: 0,
        totalUnpaid: 0,
        totalKmReimbursements: 0,
        totalExpenses: 0,
        totalCashCollected: 0,
        totalSalesCount: 0
      }
    );
  }

  // EXPORT TO CSV
  public static exportToCSV(): string {
    const appointments = this.getAppointments();
    const headers = [
      'ID',
      'Data',
      'Titolo Evento',
      'Brand Cliente',
      'Agenzia di Incarico',
      'Citta',
      'Luogo Store',
      'Stato Evento',
      'Tipo Compenso',
      'Compenso Base Euro',
      'Km Auto',
      'Rimborso Km Euro',
      'Spese Scontrini Euro',
      'Bonus Euro',
      'Ritenuta 20 Euro',
      'Netto Guadagnato Euro',
      'Stato Incasso',
      'Data Pagamento Ricevuto',
      'Pezzi Venduti',
      'Incasso Cassa Euro'
    ];

    const rows = appointments.map(a => [
      a.id,
      a.date,
      `"${(a.title || '').replace(/"/g, '""')}"`,
      `"${(a.clientBrand || '').replace(/"/g, '""')}"`,
      `"${(a.agencyName || '').replace(/"/g, '""')}"`,
      `"${(a.city || '').replace(/"/g, '""')}"`,
      `"${(a.locationName || '').replace(/"/g, '""')}"`,
      a.status,
      a.rateType,
      a.baseCompensation.toFixed(2),
      a.kmDriven,
      a.kmReimbursement.toFixed(2),
      a.expensesReceipts.toFixed(2),
      a.salesBonus.toFixed(2),
      a.withholdingTaxAmount.toFixed(2),
      a.totalCompensationNet.toFixed(2),
      a.paymentStatus,
      a.paymentDate || '',
      a.salesCount,
      a.cashCollected.toFixed(2)
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  public static exportAllDataJSON(): string {
    return JSON.stringify({
      version: '2.0',
      exportedAt: new Date().toISOString(),
      agencies: this.getAgencies(),
      appointments: this.getAppointments()
    }, null, 2);
  }

  public static importAllDataJSON(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.agencies) && Array.isArray(parsed.appointments)) {
        this.inMemoryAgencies = [...parsed.agencies];
        this.inMemoryAppointments = [...parsed.appointments];
        try {
          localStorage.setItem(INITIALIZED_KEY, 'true');
          localStorage.setItem(AGENCIES_KEY, JSON.stringify(parsed.agencies));
          localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(parsed.appointments));
        } catch (e) {
          console.warn('LocalStorage save failed during import:', e);
        }
        try {
          appInventorBridge.send('DATA_RESTORED', {
            agenciesCount: parsed.agencies.length,
            appointmentsCount: parsed.appointments.length
          });
        } catch {}
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // 1. Azzera completamente tutti gli archivi per iniziare l'app da zero (0 appuntamenti, 0 agenzie)
  public static clearAllData(): void {
    this.inMemoryAgencies = [];
    this.inMemoryAppointments = [];
    try {
      localStorage.setItem(INITIALIZED_KEY, 'true');
      localStorage.setItem(AGENCIES_KEY, JSON.stringify([]));
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify([]));
    } catch (e) {
      console.warn('LocalStorage clear failed:', e);
    }
    try {
      appInventorBridge.send('DATA_CLEARED_ALL', {
        timestamp: new Date().toISOString()
      });
    } catch {}
  }

  // 2. Azzera solo gli appuntamenti/turni (mantiene le agenzie registrate)
  public static clearAppointmentsOnly(): void {
    this.inMemoryAppointments = [];
    try {
      localStorage.setItem(INITIALIZED_KEY, 'true');
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify([]));
    } catch (e) {
      console.warn('LocalStorage clear appointments failed:', e);
    }
    try {
      appInventorBridge.send('APPOINTMENTS_CLEARED', {
        timestamp: new Date().toISOString()
      });
    } catch {}
  }

  // 3. Ripristina i dati demo di esempio (4 agenzie, 5 turni dimostrativi)
  public static restoreDemoData(): void {
    this.inMemoryAgencies = [...INITIAL_AGENCIES];
    this.inMemoryAppointments = [...INITIAL_APPOINTMENTS];
    try {
      localStorage.setItem(INITIALIZED_KEY, 'true');
      localStorage.setItem(AGENCIES_KEY, JSON.stringify(INITIAL_AGENCIES));
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(INITIAL_APPOINTMENTS));
    } catch (e) {
      console.warn('LocalStorage restore demo failed:', e);
    }
    try {
      appInventorBridge.send('DATA_RESET', {});
    } catch {}
  }

  public static resetToInitialData(): void {
    this.restoreDemoData();
  }
}
