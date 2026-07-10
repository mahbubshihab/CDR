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

// Seed mock data if database is empty
export async function seedMockDataIfEmpty() {
  const caseCount = await db.cases.count();
  if (caseCount > 0) return; // Already seeded or user created data

  console.log('Seeding initial mock data into database...');

  // 1. Add Cases
  const case1Id = await db.cases.add({
    caseIdString: 'CASE-2026-001',
    title: 'Murder of Bilal Khan',
    caseType: 'Murder',
    policeStation: 'KhanPur',
    investigatorName: 'Sajawal Khan',
    description: 'Investigation regarding the targeted assassination of local businessman Bilal Khan near GT Road.',
    status: 'Completed',
    createdAt: Date.now() - 10 * 24 * 3600 * 1000 // 10 days ago
  });

  const case2Id = await db.cases.add({
    caseIdString: 'CASE-2026-002',
    title: 'Damo Khan Theft Case',
    caseType: 'Theft',
    policeStation: 'Peshawar Central',
    investigatorName: 'Sajawal Khan',
    description: 'Theft of goods worth 2.5 Million from a electronics warehouse. Suspect sighted on CCTV.',
    status: 'Active',
    createdAt: Date.now() - 3 * 24 * 3600 * 1000 // 3 days ago
  });

  const case3Id = await db.cases.add({
    caseIdString: 'CASE-2026-003',
    title: 'GT Road Extortion Investigation',
    caseType: 'Fraud',
    policeStation: 'Rawalpindi',
    investigatorName: 'Amjad Shah',
    description: 'Threats and extortion calls reported by local shopkeepers from unregistered numbers.',
    status: 'Pending',
    createdAt: Date.now() - 1 * 24 * 3600 * 1000 // 1 day ago
  });

  // 2. Add CDRFiles
  const file1Id = await db.cdrFiles.add({
    caseId: case1Id,
    phoneNumber: '01716857863',
    operator: 'Grameenphone',
    fileName: '01716857863_20260320_CDR_GP.xlsx',
    uploadDate: Date.now() - 5 * 24 * 3600 * 1000,
    status: 'Partial',
    category: 'Suspect',
    ownerName: 'Bilal Suspect A',
    description: 'Target suspect primary dial history file.',
    notes: 'Located frequently near crime scene.',
    recordsCount: 450
  });

  const file2Id = await db.cdrFiles.add({
    caseId: case1Id,
    phoneNumber: '01822334455',
    operator: 'Robi',
    fileName: '01822334455_20260320_CDR_Robi.csv',
    uploadDate: Date.now() - 4 * 24 * 3600 * 1000,
    status: 'Partial',
    category: 'Suspect',
    ownerName: 'damo',
    description: 'Co-conspirator connection log.',
    notes: 'Swapped handsets twice.',
    recordsCount: 380
  });

  const file3Id = await db.cdrFiles.add({
    caseId: case2Id,
    phoneNumber: '01933445566',
    operator: 'Banglalink',
    fileName: '01933445566_20260320_CDR_BL.xlsx',
    uploadDate: Date.now() - 2 * 24 * 3600 * 1000,
    status: 'Partial',
    category: 'Victim',
    ownerName: 'Yasir',
    description: 'Victim call duration report.',
    notes: 'Received pre-extortion calls.',
    recordsCount: 220
  });

  // 3. Add CDRRecords
  const operators = ['Grameenphone', 'Robi', 'Banglalink', 'Teletalk', 'Airtel'];
  const locations = [
    'GT Road Plaza, Peshawar',
    'Main Bazaar, KhanPur',
    'Sector F-10, Islamabad',
    'Sadar Market, Rawalpindi',
    'University Road, Peshawar',
    'Hayatabad Phase 3, Peshawar',
    'Airport Road, Lahore',
    'Cantt Station, Rawalpindi'
  ];

  const usageTypes = ['MOC', 'MTC', 'SMS_MOC', 'SMS_MTC'];

  const seedRecords: CDRRecord[] = [];

  // Generate mock CDR records for Bilal Suspect A
  for (let i = 0; i < 450; i++) {
    const timestamp = Date.now() - Math.floor(Math.random() * 8 * 24 * 3600 * 1000);
    const targetNo = `0300${Math.floor(1000000 + Math.random() * 9000000)}`;
    seedRecords.push({
      caseId: case1Id,
      fileId: file1Id,
      timestamp,
      otherParty: targetNo,
      duration: Math.floor(Math.random() * 500),
      usageType: usageTypes[Math.floor(Math.random() * usageTypes.length)],
      imei: `8612345678${Math.floor(10000 + Math.random() * 90000)}`,
      imsi: `4100123456${Math.floor(10000 + Math.random() * 90000)}`,
      address: locations[Math.floor(Math.random() * locations.length)],
      provider: 'Grameenphone',
      lac: Math.floor(10000 + Math.random() * 50000),
      cellId: Math.floor(1000 + Math.random() * 20000)
    });
  }

  // Generate mock CDR records for Damo
  for (let i = 0; i < 380; i++) {
    const timestamp = Date.now() - Math.floor(Math.random() * 8 * 24 * 3600 * 1000);
    // Let's create some overlaps (common numbers!)
    const targetNo = i % 5 === 0 
      ? seedRecords[Math.floor(Math.random() * 50)].otherParty // common overlap
      : `0333${Math.floor(1000000 + Math.random() * 9000000)}`;
    seedRecords.push({
      caseId: case1Id,
      fileId: file2Id,
      timestamp,
      otherParty: targetNo,
      duration: Math.floor(Math.random() * 300),
      usageType: usageTypes[Math.floor(Math.random() * usageTypes.length)],
      imei: `8612345678${Math.floor(10000 + Math.random() * 90000)}`,
      imsi: `4100123456${Math.floor(10000 + Math.random() * 90000)}`,
      address: locations[Math.floor(Math.random() * locations.length)],
      provider: 'Robi',
      lac: Math.floor(10000 + Math.random() * 50000),
      cellId: Math.floor(1000 + Math.random() * 20000)
    });
  }

  // Generate mock CDR records for Yasir
  for (let i = 0; i < 220; i++) {
    const timestamp = Date.now() - Math.floor(Math.random() * 3 * 24 * 3600 * 1000);
    const targetNo = i % 8 === 0 
      ? seedRecords[Math.floor(Math.random() * 50)].otherParty // common overlap
      : `0345${Math.floor(1000000 + Math.random() * 9000000)}`;
    seedRecords.push({
      caseId: case2Id,
      fileId: file3Id,
      timestamp,
      otherParty: targetNo,
      duration: Math.floor(Math.random() * 600),
      usageType: usageTypes[Math.floor(Math.random() * usageTypes.length)],
      imei: `3512345678${Math.floor(10000 + Math.random() * 90000)}`,
      imsi: `4100323456${Math.floor(10000 + Math.random() * 90000)}`,
      address: locations[Math.floor(Math.random() * locations.length)],
      provider: 'Banglalink',
      lac: Math.floor(10000 + Math.random() * 50000),
      cellId: Math.floor(1000 + Math.random() * 20000)
    });
  }

  // Chunk insert records
  const chunkSize = 200;
  for (let i = 0; i < seedRecords.length; i += chunkSize) {
    await db.cdrRecords.bulkAdd(seedRecords.slice(i, i + chunkSize));
  }

  console.log('Seeding mock data successfully completed!');
}
