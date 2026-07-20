import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { db, type CDRFile } from '../../../utils/db';
import * as XLSX from 'xlsx';
import { useAuth } from '../../../contexts/AuthContext';
import { db as dbFirestore } from '../../../firebase';
import { doc, setDoc, increment } from 'firebase/firestore';
import { getBPartyOperator } from '../../../utils/operators';

interface UploadCDRModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: number;
  onUploadSuccess: () => void;
}

// Helper to retrieve value from case-insensitive, space-insensitive, and symbol-insensitive row keys
function getValue(row: any, ...possibleKeys: string[]): any {
  if (!row) return undefined;
  const rowKeys = Object.keys(row);
  const normalizedKeys = rowKeys.map(k => k.toLowerCase().replace(/[\s_\r\ufeff]/g, ''));
  
  for (const pk of possibleKeys) {
    const normalizedPk = pk.toLowerCase().replace(/[\s_\r\ufeff]/g, '');
    const index = normalizedKeys.indexOf(normalizedPk);
    if (index !== -1) {
      return row[rowKeys[index]];
    }
  }
  return undefined;
}

// Helper to normalize different operator usageType values to standardized values
function normalizeUsageType(rawType: string): string {
  const norm = String(rawType || '').toUpperCase().trim();
  
  const isSms = norm.includes('SMS');
  const isMo = norm.includes('MO') || norm.includes('MOC') || norm.includes('ORIGINATING');
  const isMt = norm.includes('MT') || norm.includes('MTC') || norm.includes('TERMINATING');

  if (isSms) {
    if (isMo) return 'SMS_MOC';
    if (isMt) return 'SMS_MTC';
    return 'SMS_MOC'; // fallback SMS
  }

  if (isMo) return 'MOC';
  if (isMt) return 'MTC';
  
  if (norm === 'CALL-MO' || norm === 'CALLMO' || norm === 'MOC') return 'MOC';
  if (norm === 'CALL-MT' || norm === 'CALLMT' || norm === 'MTC') return 'MTC';

  return 'MOC'; // default fallback
}

export const UploadCDRModal: React.FC<UploadCDRModalProps> = ({ 
  isOpen, onClose, caseId, onUploadSuccess 
}) => {
  const { currentUser, role, maxFiles, uploadedFilesCount } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  
  // Expandable additional metadata
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [operator, setOperator] = useState('Grameenphone');
  const [category, setCategory] = useState('Suspect');
  const [ownerName, setOwnerName] = useState('');

  // Mapping state
  const [mappingMode, setMappingMode] = useState<'auto' | 'manual'>('auto');

  // File loading state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhoneNumberChange = (val: string) => {
    setPhoneNumber(val);
    const autoOp = getBPartyOperator(val);
    if (autoOp && autoOp !== 'Unknown') {
      setOperator(autoOp);
    }
  };

  // Reset form states to default
  const resetForm = () => {
    setPhoneNumber('');
    setDescription('');
    setNotes('');
    setIsMetadataExpanded(false);
    setReferenceNumber('');
    setOperator('Grameenphone');
    setCategory('Suspect');
    setOwnerName('');
    setMappingMode('auto');
    setSelectedFile(null);
    setRowCount(null);
    setErrorMsg('');
    setLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Automatically reset the form state whenever the modal visibility changes
  useEffect(() => {
    resetForm();
  }, [isOpen]);

  if (!isOpen) return null;

  // Trigger file selection
  const handleDropAreaClick = () => {
    fileInputRef.current?.click();
  };

  // Guess operator from file name
  const guessOperator = (fileName: string): string => {
    const fn = fileName.toLowerCase();
    if (fn.includes('gp') || fn.includes('grameen') || fn.includes('grameenphone')) return 'Grameenphone';
    if (fn.includes('robi')) return 'Robi';
    if (fn.includes('banglalink') || fn.includes('bl')) return 'Banglalink';
    if (fn.includes('teletalk') || fn.includes('tt')) return 'Teletalk';
    if (fn.includes('airtel')) return 'Airtel';
    return 'Grameenphone'; // default fallback
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setErrorMsg('');
    setLoading(true);

    try {
      const detectedOp = guessOperator(file.name);
      setOperator(detectedOp);

      // Guess phone number from file name if matches numbers
      const numMatch = file.name.match(/\d+/);
      if (numMatch) {
        let guessedNum = numMatch[0];
        if (guessedNum.length === 10 && guessedNum.startsWith('1')) {
          guessedNum = '0' + guessedNum;
        } else if (guessedNum.startsWith('880') && guessedNum.length === 13) {
          guessedNum = guessedNum.substring(2);
        }
        setPhoneNumber(guessedNum);

        // Guessed operator from phone number prefix takes priority
        const autoOp = getBPartyOperator(guessedNum);
        if (autoOp && autoOp !== 'Unknown') {
          setOperator(autoOp);
        }
      }

      // Read file to parse rows count
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const workbook = XLSX.read(bstr, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const data = XLSX.utils.sheet_to_json<any>(worksheet);
          setRowCount(data.length);

          if (data && data.length > 0) {
            const firstRow = data[0];

            // 1. Try to find the A-Party (phone number) from the first row of the sheet
            const rawAParty = getValue(firstRow, 'aparty', 'phone', 'number', 'msisdn');
            if (rawAParty) {
              let cleanNum = String(rawAParty).trim().replace(/\D/g, '');
              if (cleanNum.length === 10 && cleanNum.startsWith('1')) {
                cleanNum = '0' + cleanNum;
              } else if (cleanNum.startsWith('880') && cleanNum.length === 13) {
                cleanNum = cleanNum.substring(2);
              }
              if (cleanNum) {
                setPhoneNumber(cleanNum);

                // Guess operator from this detected phone number prefix
                const autoOp = getBPartyOperator(cleanNum);
                if (autoOp && autoOp !== 'Unknown') {
                  setOperator(autoOp);
                }
              }
            }

            // 2. Try to find the provider name (operator) from the first row of the sheet
            const rawProvider = getValue(firstRow, 'providername', 'provider name', 'provider', 'carrier', 'operator');
            if (rawProvider) {
              const nameLower = String(rawProvider).toLowerCase();
              if (nameLower.includes('gp') || nameLower.includes('grameen') || nameLower.includes('grameenphone')) {
                setOperator('Grameenphone');
              } else if (nameLower.includes('robi')) {
                setOperator('Robi');
              } else if (nameLower.includes('teletalk') || nameLower.includes('tele talk')) {
                setOperator('Teletalk');
              } else if (nameLower.includes('banglalink') || nameLower.includes('bl')) {
                setOperator('Banglalink');
              } else if (nameLower.includes('airtel')) {
                setOperator('Airtel');
              }
            }
          }
        } catch (err) {
          console.error(err);
          setErrorMsg('Error reading rows count from file.');
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        setErrorMsg('Failed to load file.');
        setLoading(false);
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process file.');
      setLoading(false);
    }
  };

  // Handle upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || rowCount === null) return;
    setErrorMsg('');

    // Validate connection and limits for non-owners
    if (role !== 'owner') {
      if (!navigator.onLine) {
        setErrorMsg("Internet connection is required to verify account limits. Please connect to the internet and try again.");
        return;
      }
      
      if (uploadedFilesCount >= maxFiles) {
        setErrorMsg(`File upload limit exceeded (${uploadedFilesCount}/${maxFiles} files uploaded). Please contact the system administrator to upgrade your limits.`);
        return;
      }
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const workbook = XLSX.read(bstr, { type: 'binary', cellDates: true });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const rawRows = XLSX.utils.sheet_to_json<any>(worksheet);

          // Auto-detect phone number and provider/operator from sheet if not entered/selected
          let detectedPhone = '';
          let detectedOperator = operator;

          if (rawRows.length > 0) {
            const firstRow = rawRows[0];
            detectedPhone = String(getValue(firstRow, 'aparty') || '');
            const providerName = getValue(firstRow, 'providername', 'provider name', 'provider') || '';
            if (providerName) {
              const nameLower = String(providerName).toLowerCase();
              if (nameLower.includes('gp') || nameLower.includes('grameen')) {
                detectedOperator = 'Grameenphone';
              } else if (nameLower.includes('robi')) {
                detectedOperator = 'Robi';
              } else if (nameLower.includes('teletalk')) {
                detectedOperator = 'Teletalk';
              } else if (nameLower.includes('banglalink')) {
                detectedOperator = 'Banglalink';
              } else {
                detectedOperator = String(providerName);
              }
            }
          }

          const finalPhoneNumber = phoneNumber.trim() || detectedPhone || 'Auto-detected';

          // 1. Insert CDRFile entry
          const fileId = await db.cdrFiles.add({
            caseId,
            phoneNumber: finalPhoneNumber,
            operator: detectedOperator,
            fileName: selectedFile.name,
            uploadDate: Date.now(),
            status: 'Partial',
            category,
            ownerName: ownerName || 'Unknown',
            description,
            notes,
            recordsCount: rowCount
          });

          // 2. Parse file and insert CDRRecords
          const recordsToInsert = rawRows.map((row: any) => {
            // Find columns dynamically using case-insensitive mapping
            const otherParty = getValue(row, 'bparty', 'otherparty', 'other party') || 'Unknown';
            const duration = Number(getValue(row, 'callduration', 'duration', 'call duration') || 0);
            const usageType = normalizeUsageType(getValue(row, 'usagetype', 'calltype', 'type', 'usage type') || 'MOC');
            const imei = getValue(row, 'imei') || '';
            const imsi = getValue(row, 'imsi', 'imsia') || '';
            const address = getValue(row, 'address', 'location') || '';
            const rawTime = getValue(row, 'startdttime', 'starttime', 'start', 'time', 'timestamp');

            let timestamp = Date.now();
            if (rawTime) {
              const timeStr = String(rawTime).trim();
              
              // Handle DD/MM/YYYY format first (e.g. Teletalk)
              const ddmmyyyyRegex = /^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})/;
              const match = timeStr.match(ddmmyyyyRegex);
              
              if (match) {
                const day = parseInt(match[1], 10);
                const month = parseInt(match[2], 10) - 1; // 0-indexed month
                const year = parseInt(match[3], 10);
                const hours = parseInt(match[4], 10);
                const minutes = parseInt(match[5], 10);
                const seconds = parseInt(match[6], 10);
                
                const d = new Date(year, month, day, hours, minutes, seconds);
                if (!isNaN(d.getTime())) {
                  timestamp = d.getTime();
                }
              } else if (/^\d{14}$/.test(timeStr)) {
                // Parse custom YYYYMMDDHHMMSS format (GP, Robi, Banglalink)
                const yr = parseInt(timeStr.substring(0, 4), 10);
                const mo = parseInt(timeStr.substring(4, 6), 10) - 1; // 0-indexed month
                const dy = parseInt(timeStr.substring(6, 8), 10);
                const hr = parseInt(timeStr.substring(8, 10), 10);
                const mi = parseInt(timeStr.substring(10, 12), 10);
                const sc = parseInt(timeStr.substring(12, 14), 10);
                
                const d = new Date(yr, mo, dy, hr, mi, sc);
                if (!isNaN(d.getTime())) {
                  timestamp = d.getTime();
                }
              } else if (rawTime instanceof Date) {
                timestamp = rawTime.getTime();
              } else if (typeof rawTime === 'number' && rawTime > 30000 && rawTime < 60000) {
                // Excel serial numbers
                const excelEpoch = new Date(Date.UTC(1899, 11, 30));
                const msInDay = 24 * 60 * 60 * 1000;
                timestamp = excelEpoch.getTime() + rawTime * msInDay;
              } else {
                const parsedDate = new Date(rawTime);
                if (!isNaN(parsedDate.getTime())) {
                  timestamp = parsedDate.getTime();
                }
              }
            }

            const lacVal = getValue(row, 'lacstarta', 'lac');
            const lac = lacVal ? Number(lacVal) : undefined;
            
            const cellIdVal = getValue(row, 'cistarta', 'cellid', 'cid', 'ci');
            const cellId = cellIdVal ? Number(cellIdVal) : undefined;
            
            const networkType = getValue(row, 'networktype', 'network type') || '';
            
            const mccVal = getValue(row, 'mccstarta', 'mcc');
            const mcc = mccVal ? Number(mccVal) : undefined;
            
            const mncVal = getValue(row, 'mncstarta', 'mnc');
            const mnc = mncVal ? Number(mncVal) : undefined;
            
            const aparty = getValue(row, 'aparty') || '';
            const uePort = getValue(row, 'ueport', 'ue port') || '';
            const ueLocalIp = getValue(row, 'uelocalip', 'ue local ip') || '';
            
            const providerName = getValue(row, 'providername', 'provider name', 'provider') || detectedOperator || 'Unknown';
            const ueLocalPort = getValue(row, 'uelocalport', 'ue local port') || '';
            const countryCode = getValue(row, 'countrycode', 'country code') || '';

            return {
              caseId,
              fileId,
              timestamp,
              otherParty: String(otherParty),
              duration,
              usageType: String(usageType),
              imei: String(imei),
              imsi: String(imsi),
              address: String(address),
              provider: String(providerName),
              lac,
              cellId,
              networkType: String(networkType),
              mcc,
              mnc,
              aparty: String(aparty),
              uePort: String(uePort),
              ueLocalIp: String(ueLocalIp),
              ueLocalPort: String(ueLocalPort),
              countryCode: String(countryCode)
            };
          });

          // Bulk insert in chunks to keep Dexie fast
          await db.cdrRecords.bulkAdd(recordsToInsert);

          // Increment uploadedFilesCount in Firestore
          if (currentUser && role !== 'owner') {
            const statsDocRef = doc(dbFirestore, 'userStats', currentUser.uid);
            await setDoc(statsDocRef, {
              uploadedFilesCount: increment(1)
            }, { merge: true });
          }

          onUploadSuccess();
          onClose();
        } catch (err) {
          console.error(err);
          setErrorMsg('Failed to parse records and save.');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsBinaryString(selectedFile);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to upload file.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-2xl bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-left text-sm animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2e2e2e]">
          <div>
            <h3 className="text-xs font-semibold text-gray-205">Upload CDR</h3>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Add call detail records without leaving the workspace</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                Phone number / SIM
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={e => handlePhoneNumberChange(e.target.value)}
                placeholder="Auto-detected from CDR"
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#3ecf8e]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                Network operator
              </label>
              <select
                value={operator}
                onChange={e => setOperator(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-[#3ecf8e]"
              >
                {['Grameenphone', 'Robi', 'Banglalink', 'Teletalk', 'Airtel'].map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                Category (case link)
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-[#3ecf8e]"
              >
                {['Suspect', 'Victim', 'Witness', '-'].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Short description or reference"
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#3ecf8e]"
              />
            </div>
          </div>

          {/* Drag & Drop File area */}
          <div 
            onClick={handleDropAreaClick}
            className="border-2 border-dashed border-[#2e2e2e] hover:border-[#3ecf8e]/35 bg-[#121212]/50 hover:bg-[#121212] rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all text-center relative overflow-hidden"
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.xlsx,.xls"
              className="hidden" 
            />
            <div className="h-10 w-10 bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 rounded-xl flex items-center justify-center">
              <Upload className="h-5 w-5 text-[#3ecf8e]" />
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <span className="font-mono text-[#3ecf8e] text-xs font-semibold block">{selectedFile.name}</span>
                <span className="text-[11px] text-gray-500 block">
                  File successfully loaded ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            ) : (
              <div>
                <span className="text-xs font-semibold text-gray-300 block">
                  Upload CDR file(s) — CSV, Excel, TXT
                </span>
                <span className="text-[10px] text-gray-500 block mt-1 font-mono">
                  GP, Robi, Banglalink, Teletalk, Airtel auto-detected
                </span>
              </div>
            )}
          </div>

          {/* Notes textarea */}
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Case-linked notes, tags..."
              rows={2}
              className="w-full bg-[#121212] border border-[#2e2e2e] rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#3ecf8e] resize-none"
            />
          </div>

          {/* Expandable Additional Metadata chevron */}
          <div className="border border-[#2e2e2e] rounded-xl overflow-hidden bg-[#171717]/40">
            <button
              type="button"
              onClick={() => setIsMetadataExpanded(!isMetadataExpanded)}
              className="w-full flex items-center justify-between p-3 text-xs text-gray-450 hover:text-gray-200 transition-colors"
            >
              <span className="font-semibold flex items-center gap-1.5">
                {isMetadataExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Additional metadata
              </span>
            </button>

            {isMetadataExpanded && (
              <div className="p-4 border-t border-[#2e2e2e] bg-[#121212]/30 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                    CDR reference number
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={e => setReferenceNumber(e.target.value)}
                    placeholder="Reference code"
                    className="w-full bg-[#121212] border border-[#2e2e2e] rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                    Subscriber owner name
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    placeholder="e.g. Mahbub Shihab"
                    className="w-full bg-[#121212] border border-[#2e2e2e] rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Auto/Manual mapping section */}
          {selectedFile && rowCount !== null && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#171717] border border-[#2e2e2e] rounded-xl font-mono text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMappingMode('auto')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                    mappingMode === 'auto'
                      ? 'bg-[#2e2e2e] text-white border-[#2e2e2e]'
                      : 'bg-transparent border-[#2e2e2e] text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Auto mapping
                </button>
                <button
                  type="button"
                  onClick={() => setMappingMode('manual')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                    mappingMode === 'manual'
                      ? 'bg-[#2e2e2e] text-white border-[#2e2e2e]'
                      : 'bg-transparent border-[#2e2e2e] text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Manual mapping
                </button>
              </div>

              <div className="text-right leading-tight">
                <span className="text-xs text-gray-400 block font-semibold">
                  {rowCount.toLocaleString()} rows · {operator}
                </span>
                <span className="text-xs text-[#3ecf8e] font-semibold flex items-center justify-end gap-1 mt-0.5">
                  <Check className="h-3.5 w-3.5" />
                  Operator detected — ready to import
                </span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-red-400 font-mono text-xs">
              {errorMsg}
            </div>
          )}

          {/* Upload triggers */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#2e2e2e]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-transparent border border-[#2e2e2e] rounded-lg text-xs text-gray-400 font-semibold hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedFile || rowCount === null}
              className="flex items-center gap-1.5 px-5 py-1.5 bg-[#046a38] text-white font-medium border border-[#3ecf8e] hover:bg-[#00522c] disabled:opacity-40 disabled:hover:bg-[#046a38] rounded-lg shadow-md transition-all cursor-pointer text-xs"
            >
              Upload CDR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
