import Dexie, { type Table } from 'dexie';

export interface Case {
  id?: number;
  caseIdString: string;
  title: string;
  caseType: string;
  policeStation: string;
  investigatorName: string;
  description: string;
  status: 'Pending' | 'Active' | 'Completed';
  createdAt: number;
}

export interface CDRFile {
  id?: number;
  caseId: number;
  phoneNumber: string;
  operator: string;
  fileName: string;
  uploadDate: number;
  status: string; // e.g. "Partial", "Completed"
  category: string; // e.g. "Suspect", "Victim", "Witness", "-"
  ownerName: string;
  description: string;
  notes: string;
  recordsCount: number;
}

export interface CDRRecord {
  id?: number;
  caseId: number;
  fileId: number;
  timestamp: number; // UTC Epoch
  otherParty: string;
  duration: number; // in seconds
  usageType: 'MOC' | 'MTC' | 'SMS_MOC' | 'SMS_MTC' | string;
  imei?: string;
  imsi?: string;
  address?: string;
  provider?: string; // Grameenphone, Robi, Banglalink, Teletalk, Airtel
  lac?: number;
  cellId?: number;
  networkType?: string;
  mcc?: number;
  mnc?: number;
  aparty?: string;
  uePort?: string;
  ueLocalIp?: string;
  ueLocalPort?: string;
  countryCode?: string;
}

export interface WatchlistItem {
  id?: number;
  type: 'Number' | 'IMEI' | 'IMSI';
  value: string;
  notes: string;
  createdAt: number;
}

export interface IntelligenceItem {
  id?: number;
  type: 'Number' | 'IMEI' | 'IMSI';
  value: string;
  name: string;
  tag: string;
  notes: string;
  createdAt: number;
}export class CDRDatabase extends Dexie {
  cases!: Table<Case, number>;
  cdrFiles!: Table<CDRFile, number>;
  cdrRecords!: Table<CDRRecord, number>;
  watchlist!: Table<WatchlistItem, number>;
  intelligence!: Table<IntelligenceItem, number>;

  constructor(dbName: string) {
    super(dbName);
    this.version(2).stores({
      cases: '++id, caseIdString, title, status, createdAt',
      cdrFiles: '++id, caseId, phoneNumber, operator, fileName, uploadDate',
      cdrRecords: '++id, caseId, fileId, timestamp, otherParty, imei, imsi',
      watchlist: '++id, type, value, notes, createdAt',
      intelligence: '++id, type, value, name, tag, notes, createdAt'
    });
  }
}

// Default instance
let activeDb = new CDRDatabase('CDRDatabase_default');

// Expose a helper to switch the active database for a specific user ID
export const setDatabaseUser = (uid: string) => {
  if (!uid) {
    // If not logged in, fallback to a shared default database
    if (activeDb.name !== 'CDRDatabase_default') {
      activeDb.close();
      activeDb = new CDRDatabase('CDRDatabase_default');
    }
  } else {
    // Isolate database per user UID
    const targetName = `CDRDatabase_${uid}`;
    if (activeDb.name !== targetName) {
      activeDb.close();
      activeDb = new CDRDatabase(targetName);
    }
  }
};

// Use Proxy to dynamically forward properties to the active database instance
export const db = new Proxy({}, {
  get(target, prop) {
    const value = (activeDb as any)[prop];
    if (typeof value === 'function') {
      return value.bind(activeDb);
    }
    return value;
  }
}) as unknown as CDRDatabase;
