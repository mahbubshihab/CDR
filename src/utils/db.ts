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

export class CDRDatabase extends Dexie {
  cases!: Table<Case, number>;
  cdrFiles!: Table<CDRFile, number>;
  cdrRecords!: Table<CDRRecord, number>;

  constructor() {
    super('CDRDatabase');
    this.version(1).stores({
      cases: '++id, caseIdString, title, status, createdAt',
      cdrFiles: '++id, caseId, phoneNumber, operator, fileName, uploadDate',
      cdrRecords: '++id, caseId, fileId, timestamp, otherParty, imei, imsi'
    });
  }
}

export const db = new CDRDatabase();

