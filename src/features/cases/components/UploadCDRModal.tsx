import React, { useState, useRef } from 'react';
import { X, Upload, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { db, type CDRFile } from '../../../utils/db';
import * as XLSX from 'xlsx';

interface UploadCDRModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: number;
  onUploadSuccess: () => void;
}

export const UploadCDRModal: React.FC<UploadCDRModalProps> = ({ 
  isOpen, onClose, caseId, onUploadSuccess 
}) => {
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
      }

      // Read file to parse rows count
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const workbook = XLSX.read(bstr, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const data = XLSX.utils.sheet_to_json(worksheet);
          setRowCount(data.length);
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

    setLoading(true);
    try {
      // 1. Insert CDRFile entry
      const fileId = await db.cdrFiles.add({
        caseId,
        phoneNumber: phoneNumber || 'Auto-detected from CDR',
        operator,
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
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const workbook = XLSX.read(bstr, { type: 'binary', cellDates: true });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const rawRows = XLSX.utils.sheet_to_json<any>(worksheet);

          const recordsToInsert = rawRows.map((row: any) => {
            // Find columns dynamically
            const otherParty = row.BPARTY || row['Other Party'] || row.other_party || 'Unknown';
            const duration = Number(row.CALL_DURATION || row.duration || 0);
            const usageType = row.USAGE_TYPE || row['Call Type'] || row.type || 'MOC';
            const imei = row.IMEI || row.imei || '';
            const imsi = row.IMSI || row.imsi || '';
            const address = row.ADDRESS || row.address || row.Location || '';
            const rawTime = row.START_DTTIME || row.time || row.Timestamp || Date.now();

            let timestamp = Date.now();
            if (rawTime) {
              const timeStr = String(rawTime).trim();
              if (/^\d{14}$/.test(timeStr)) {
                // Parse custom YYYYMMDDHHMMSS format
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
              provider: operator
            };
          });

          // Bulk insert in chunks to keep Dexie fast
          await db.cdrRecords.bulkAdd(recordsToInsert);

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
            <h3 className="text-sm font-bold text-gray-200">Upload CDR</h3>
            <p className="text-sm text-gray-500 mt-0.5">Add call detail records without leaving the workspace</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-400 font-bold uppercase tracking-wider block">
                Phone number / SIM
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="Auto-detected from CDR"
                className="w-full bg-[#070a1c] border border-[#2e2e2e] rounded-lg px-3 py-2 text-gray-250 placeholder-gray-650 focus:outline-none focus:border-[#3ecf8e]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-gray-400 font-bold uppercase tracking-wider block">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Short description or reference"
                className="w-full bg-[#070a1c] border border-[#2e2e2e] rounded-lg px-3 py-2 text-gray-250 placeholder-gray-650 focus:outline-none focus:border-[#3ecf8e]"
              />
            </div>
          </div>

          {/* Drag & Drop File area */}
          <div 
            onClick={handleDropAreaClick}
            className="border-2 border-dashed border-[#2e2e2e] hover:border-brand-blue bg-[#070a1c]/60 hover:bg-[#070a1c] rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all text-center relative overflow-hidden"
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.xlsx,.xls"
              className="hidden" 
            />
            <div className="h-10 w-10 bg-[#3ecf8e] text-gray-950 font-semibold/15 border border-brand-blue/20 rounded-xl flex items-center justify-center">
              <Upload className="h-5 w-5 text-[#3ecf8e]" />
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <span className="font-mono text-[#3ecf8e] font-bold block">{selectedFile.name}</span>
                <span className="text-sm text-gray-500 block">
                  File successfully loaded ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            ) : (
              <div>
                <span className="text-sm font-bold text-gray-300 block">
                  Upload CDR file(s) — CSV, Excel, TXT
                </span>
                <span className="text-sm text-gray-500 block mt-1 font-mono">
                  Jazz, Zong, Ufone, Telenor, SCOM auto-detected
                </span>
              </div>
            )}
          </div>

          {/* Notes textarea */}
          <div className="space-y-1">
            <label className="text-sm text-gray-400 font-bold uppercase tracking-wider block">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Case-linked notes, tags..."
              rows={2}
              className="w-full bg-[#070a1c] border border-[#2e2e2e] rounded-lg px-3 py-2 text-gray-250 placeholder-gray-650 focus:outline-none focus:border-[#3ecf8e] resize-none"
            />
          </div>

          {/* Expandable Additional Metadata chevron */}
          <div className="border border-[#1e1e1e] rounded-xl overflow-hidden bg-[#121212]/10">
            <button
              type="button"
              onClick={() => setIsMetadataExpanded(!isMetadataExpanded)}
              className="w-full flex items-center justify-between p-3 text-gray-350 hover:text-gray-200 transition-colors"
            >
              <span className="font-bold flex items-center gap-1.5">
                {isMetadataExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Additional metadata
              </span>
            </button>

            {isMetadataExpanded && (
              <div className="p-4 border-t border-[#1e1e1e] bg-[#05070e]/40 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-gray-400 font-bold uppercase tracking-wider block">
                    CDR reference number
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={e => setReferenceNumber(e.target.value)}
                    placeholder="Reference code"
                    className="w-full bg-[#070a1c] border border-[#2e2e2e] rounded-lg px-3 py-2 text-gray-250 placeholder-gray-650 focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-gray-400 font-bold uppercase tracking-wider block">
                    Network operator
                  </label>
                  <select
                    value={operator}
                    onChange={e => setOperator(e.target.value)}
                    className="w-full bg-[#070a1c] border border-[#2e2e2e] rounded-lg px-3 py-2 text-gray-250 focus:outline-none focus:border-[#3ecf8e]"
                  >
                    {['Grameenphone', 'Robi', 'Banglalink', 'Teletalk', 'Airtel'].map(op => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-gray-400 font-bold uppercase tracking-wider block">
                    Category (case link)
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-[#070a1c] border border-[#2e2e2e] rounded-lg px-3 py-2 text-gray-250 focus:outline-none focus:border-[#3ecf8e]"
                  >
                    {['Suspect', 'Victim', 'Witness', '-'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-gray-400 font-bold uppercase tracking-wider block">
                    SIM owner name
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    placeholder="Owner reference name"
                    className="w-full bg-[#070a1c] border border-[#2e2e2e] rounded-lg px-3 py-2 text-gray-250 placeholder-gray-650 focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Auto/Manual mapping section */}
          {selectedFile && rowCount !== null && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#0a0e24]/40 border border-[#2e2e2e] rounded-xl font-mono">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMappingMode('auto')}
                  className={`px-3 py-1 rounded-md text-sm font-bold border transition-colors ${
                    mappingMode === 'auto'
                      ? 'bg-[#3ecf8e] text-gray-950 font-semibold/15 border-brand-blue/40 text-[#3ecf8e]'
                      : 'bg-transparent border-[#2e2e2e] text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Auto mapping
                </button>
                <button
                  type="button"
                  onClick={() => setMappingMode('manual')}
                  className={`px-3 py-1 rounded-md text-sm font-bold border transition-colors ${
                    mappingMode === 'manual'
                      ? 'bg-[#3ecf8e] text-gray-950 font-semibold/15 border-brand-blue/40 text-[#3ecf8e]'
                      : 'bg-transparent border-[#2e2e2e] text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Manual mapping
                </button>
              </div>

              <div className="text-right">
                <span className="text-sm text-gray-450 block font-bold">
                  {rowCount.toLocaleString()} rows · {operator.toLowerCase()}
                </span>
                <span className="text-sm text-brand-emerald font-bold flex items-center justify-end gap-1 mt-0.5">
                  <Check className="h-3 w-3" />
                  Operator detected — ready to import
                </span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-red-400 font-mono text-sm">
              {errorMsg}
            </div>
          )}

          {/* Upload triggers */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#2e2e2e]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-transparent border border-[#2e2e2e] rounded-lg text-gray-400 font-bold hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedFile || rowCount === null}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#046a38] text-white font-medium border border-[#3ecf8e] hover:bg-[#00522c] disabled:opacity-40 disabled:hover:bg-[#046a38] rounded-lg shadow-md transition-all cursor-pointer"
            >
              Upload CDR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
