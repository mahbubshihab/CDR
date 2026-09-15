import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Download, Copy, Check, X, Phone, 
  MessageSquare, FileSpreadsheet, ArrowUpDown, ChevronRight,
  ExternalLink, Layers, Clock
} from 'lucide-react';
import { type Case, type CDRFile, type CDRRecord } from '../../../../utils/db';
import { useCaseData } from '../../hooks/useCaseData';

interface CommonBPartyAnalysisProps {
  activeCase: Case;
  onOpenUpload?: () => void;
}

// Decode ASCII text from Hexadecimal string (common for SMS sender headers)
export function decodeHexIfPrintable(str: string): string | null {
  if (!str || str.length < 4 || str.length % 2 !== 0) return null;
  if (!/^[0-9A-Fa-f]+$/.test(str)) return null;
  try {
    let text = '';
    for (let i = 0; i < str.length; i += 2) {
      const code = parseInt(str.substring(i, i + 2), 16);
      if (code < 32 || code > 126) return null; // non-printable ASCII
      text += String.fromCharCode(code);
    }
    if (text.trim().length >= 2 && /[A-Za-z]/.test(text)) {
      return text.trim();
    }
  } catch {
    return null;
  }
  return null;
}

// Normalize phone number to standard format
export function normalizePhone(raw?: string): string {
  if (!raw) return '';
  let clean = raw.trim().replace(/[\s\-\(\)\.]/g, '');
  if (clean.startsWith('+880')) {
    clean = clean.substring(4);
    if (!clean.startsWith('0')) clean = '0' + clean;
  } else if (clean.startsWith('880') && clean.length >= 13) {
    clean = clean.substring(3);
    if (!clean.startsWith('0')) clean = '0' + clean;
  } else if (clean.length === 10 && clean.startsWith('1')) {
    clean = '0' + clean;
  }
  return clean;
}

// Minimal carrier tag
export function detectCarrier(phone: string): string {
  const norm = normalizePhone(phone);
  if (norm.startsWith('017') || norm.startsWith('013')) return 'GP';
  if (norm.startsWith('018')) return 'Robi';
  if (norm.startsWith('019') || norm.startsWith('014')) return 'BL';
  if (norm.startsWith('015')) return 'Teletalk';
  if (norm.startsWith('016')) return 'Airtel';
  return '';
}

// Duration formatter
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

interface TargetBreakdown {
  fileId: number;
  targetPhone: string;
  targetCategory: string;
  callCount: number;
  smsCount: number;
  totalDuration: number;
  firstTime: number;
  lastTime: number;
  locations: Set<string>;
  records: CDRRecord[];
}

interface CommonBPartyGroup {
  bParty: string;
  decodedName: string | null;
  carrier: string;
  targetFileIds: Set<number>;
  targetsCount: number;
  targetBreakdowns: TargetBreakdown[];
  totalInteractions: number;
  totalCalls: number;
  totalSms: number;
  totalDuration: number;
  firstTimestamp: number;
  lastTimestamp: number;
  allRecords: CDRRecord[];
}

export const CommonBPartyAnalysis: React.FC<CommonBPartyAnalysisProps> = ({ activeCase, onOpenUpload }) => {
  const { files, records, loading } = useCaseData(activeCase.id);

  const [searchTerm, setSearchTerm] = useState('');
  const [minTargets, setMinTargets] = useState<number>(2);
  const [commTypeFilter, setCommTypeFilter] = useState<'all' | 'calls' | 'sms'>('all');
  const [sortBy, setSortBy] = useState<'targets' | 'interactions' | 'duration' | 'recent'>('targets');
  const [selectedBParty, setSelectedBParty] = useState<CommonBPartyGroup | null>(null);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [copiedBatch, setCopiedBatch] = useState(false);

  // Fast file lookup map
  const fileMap = useMemo(() => {
    const map = new Map<number, CDRFile>();
    files.forEach(f => {
      if (f.id) map.set(f.id, f);
    });
    return map;
  }, [files]);

  // Aggregate B-Parties across all case files
  const commonBParties = useMemo(() => {
    if (files.length === 0 || records.length === 0) return [];

    const map = new Map<string, {
      bParty: string;
      decodedName: string | null;
      carrier: string;
      targetFileIds: Set<number>;
      targetBreakdownsMap: Map<number, TargetBreakdown>;
      totalCalls: number;
      totalSms: number;
      totalDuration: number;
      totalInteractions: number;
      firstTimestamp: number;
      lastTimestamp: number;
      allRecords: CDRRecord[];
    }>();

    for (const rec of records) {
      if (!rec.otherParty) continue;
      const cleanNumber = normalizePhone(rec.otherParty);
      if (!cleanNumber || cleanNumber.length < 3) continue;

      const file = fileMap.get(rec.fileId);
      const targetPhone = file?.phoneNumber || 'Target';
      const targetCategory = file?.category || 'Suspect';
      const isSms = rec.usageType?.toUpperCase().includes('SMS') || (rec.duration === 0 && rec.usageType?.toLowerCase().includes('sms'));
      const durationSec = typeof rec.duration === 'number' ? rec.duration : 0;

      if (!map.has(cleanNumber)) {
        map.set(cleanNumber, {
          bParty: cleanNumber,
          decodedName: decodeHexIfPrintable(cleanNumber),
          carrier: detectCarrier(cleanNumber),
          targetFileIds: new Set([rec.fileId]),
          targetBreakdownsMap: new Map(),
          totalCalls: isSms ? 0 : 1,
          totalSms: isSms ? 1 : 0,
          totalDuration: isSms ? 0 : durationSec,
          totalInteractions: 1,
          firstTimestamp: rec.timestamp,
          lastTimestamp: rec.timestamp,
          allRecords: [rec]
        });
      } else {
        const item = map.get(cleanNumber)!;
        item.targetFileIds.add(rec.fileId);
        if (isSms) item.totalSms++;
        else {
          item.totalCalls++;
          item.totalDuration += durationSec;
        }
        item.totalInteractions++;
        if (rec.timestamp < item.firstTimestamp) item.firstTimestamp = rec.timestamp;
        if (rec.timestamp > item.lastTimestamp) item.lastTimestamp = rec.timestamp;
        item.allRecords.push(rec);
      }

      const item = map.get(cleanNumber)!;
      if (!item.targetBreakdownsMap.has(rec.fileId)) {
        item.targetBreakdownsMap.set(rec.fileId, {
          fileId: rec.fileId,
          targetPhone,
          targetCategory,
          callCount: isSms ? 0 : 1,
          smsCount: isSms ? 1 : 0,
          totalDuration: isSms ? 0 : durationSec,
          firstTime: rec.timestamp,
          lastTime: rec.timestamp,
          locations: new Set(rec.address ? [rec.address] : []),
          records: [rec]
        });
      } else {
        const tb = item.targetBreakdownsMap.get(rec.fileId)!;
        if (isSms) tb.smsCount++;
        else {
          tb.callCount++;
          tb.totalDuration += durationSec;
        }
        if (rec.timestamp < tb.firstTime) tb.firstTime = rec.timestamp;
        if (rec.timestamp > tb.lastTime) tb.lastTime = rec.timestamp;
        if (rec.address) tb.locations.add(rec.address);
        tb.records.push(rec);
      }
    }

    const list: CommonBPartyGroup[] = [];
    map.forEach(val => {
      val.allRecords.sort((a, b) => a.timestamp - b.timestamp);
      list.push({
        bParty: val.bParty,
        decodedName: val.decodedName,
        carrier: val.carrier,
        targetFileIds: val.targetFileIds,
        targetsCount: val.targetFileIds.size,
        targetBreakdowns: Array.from(val.targetBreakdownsMap.values()),
        totalInteractions: val.totalInteractions,
        totalCalls: val.totalCalls,
        totalSms: val.totalSms,
        totalDuration: val.totalDuration,
        firstTimestamp: val.firstTimestamp,
        lastTimestamp: val.lastTimestamp,
        allRecords: val.allRecords
      });
    });

    return list;
  }, [records, files, fileMap]);

  // Filtered & Sorted
  const filteredBParties = useMemo(() => {
    let result = commonBParties.filter(item => item.targetsCount >= minTargets);

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(item => 
        item.bParty.toLowerCase().includes(q) ||
        (item.decodedName && item.decodedName.toLowerCase().includes(q)) ||
        item.carrier.toLowerCase().includes(q) ||
        item.targetBreakdowns.some(tb => tb.targetPhone.toLowerCase().includes(q))
      );
    }

    if (commTypeFilter === 'calls') result = result.filter(item => item.totalCalls > 0);
    else if (commTypeFilter === 'sms') result = result.filter(item => item.totalSms > 0);

    result.sort((a, b) => {
      if (sortBy === 'targets') {
        if (b.targetsCount !== a.targetsCount) return b.targetsCount - a.targetsCount;
        return b.totalInteractions - a.totalInteractions;
      }
      if (sortBy === 'interactions') return b.totalInteractions - a.totalInteractions;
      if (sortBy === 'duration') return b.totalDuration - a.totalDuration;
      if (sortBy === 'recent') return b.lastTimestamp - a.lastTimestamp;
      return 0;
    });

    return result;
  }, [commonBParties, minTargets, searchTerm, commTypeFilter, sortBy]);

  // Copy single number
  const handleCopy = (e: React.MouseEvent, num: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 1500);
  };

  // Copy all common numbers
  const handleCopyAll = () => {
    if (filteredBParties.length === 0) return;
    const text = filteredBParties.map(i => i.bParty).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedBatch(true);
    setTimeout(() => setCopiedBatch(false), 2000);
  };

  // Export Excel (.xlsx)
  const handleExportExcel = async () => {
    if (filteredBParties.length === 0) return;
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      const exportRows = filteredBParties.map((item, idx) => ({
        '#': idx + 1,
        'B-Party': item.decodedName ? `${item.decodedName} (${item.bParty})` : item.bParty,
        'Carrier': item.carrier || 'N/A',
        'Targets': `${item.targetsCount}/${files.length}`,
        'Shared Targets List': item.targetBreakdowns.map(tb => tb.targetPhone).join(', '),
        'Calls': item.totalCalls,
        'SMS': item.totalSms,
        'Total Events': item.totalInteractions,
        'Duration': formatDuration(item.totalDuration),
        'First Date': new Date(item.firstTimestamp).toLocaleString(),
        'Last Date': new Date(item.lastTimestamp).toLocaleString()
      }));

      const ws = XLSX.utils.json_to_sheet(exportRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Mutual_Contacts');
      XLSX.writeFile(wb, `Mutual_Contacts_Case_${activeCase.id || 'export'}.xlsx`);
    } catch (err) {
      console.error(err);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (filteredBParties.length === 0) return;
    const headers = ['B-Party', 'Name', 'Carrier', 'Targets', 'Shared List', 'Calls', 'SMS', 'Duration', 'Last Active'];
    const rows = filteredBParties.map(item => [
      `"${item.bParty}"`,
      `"${item.decodedName || ''}"`,
      `"${item.carrier || ''}"`,
      `"${item.targetsCount}/${files.length}"`,
      `"${item.targetBreakdowns.map(tb => tb.targetPhone).join(', ')}"`,
      item.totalCalls,
      item.totalSms,
      `"${formatDuration(item.totalDuration)}"`,
      `"${new Date(item.lastTimestamp).toLocaleString()}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Mutual_Contacts_Case_${activeCase.id || 'export'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#111113] text-gray-500 font-mono text-xs">
        Analyzing mutual contacts across {files.length} targets...
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden flex flex-col bg-[#111113] text-gray-300 text-left font-sans select-none">
      
      {/* Top Single-Line Header */}
      <div className="h-14 px-6 border-b border-[#232326] bg-[#141416] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 flex items-center justify-center">
            <Users className="h-4 w-4 text-[#3ecf8e]" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-gray-100 uppercase tracking-wider">
              Common B-Parties
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1e1e22] text-[#3ecf8e] border border-[#2b2b30]">
              {filteredBParties.length} mutual / {files.length} targets
            </span>
          </div>
        </div>

        {/* Minimal Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAll}
            disabled={filteredBParties.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1a1a1d] hover:bg-[#232327] border border-[#2b2b30] text-gray-300 hover:text-white rounded-lg text-xs font-mono transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Copy all numbers"
          >
            {copiedBatch ? <Check className="h-3 w-3 text-[#3ecf8e]" /> : <Copy className="h-3 w-3 text-gray-400" />}
            <span>{copiedBatch ? 'Copied' : `Copy (${filteredBParties.length})`}</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={filteredBParties.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1a1a1d] hover:bg-[#232327] border border-[#2b2b30] text-gray-300 hover:text-white rounded-lg text-xs font-mono transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Export CSV"
          >
            <Download className="h-3 w-3 text-gray-400" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={filteredBParties.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0e1c15] hover:bg-[#12261d] border border-emerald-900/40 text-[#3ecf8e] rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Export Excel"
          >
            <FileSpreadsheet className="h-3 w-3 text-[#3ecf8e]" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="h-12 px-6 border-b border-[#232326] bg-[#121214] flex items-center justify-between gap-4 shrink-0 text-xs">
        <div className="flex items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Filter number / carrier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-8 pr-6 py-1 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#3ecf8e]/50 font-mono"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Overlap Filter */}
          <div className="flex items-center bg-[#18181b] border border-[#27272a] rounded-lg p-0.5 font-mono text-[11px]">
            {[2, 3, files.length].filter((val, i, arr) => arr.indexOf(val) === i && val <= files.length).map(num => (
              <button
                key={num}
                onClick={() => setMinTargets(num)}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  minTargets === num
                    ? 'bg-[#27272a] text-[#3ecf8e] font-bold'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {num === files.length && files.length > 2 ? `All (${num})` : `≥ ${num}`}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex items-center bg-[#18181b] border border-[#27272a] rounded-lg p-0.5 font-mono text-[11px]">
            {(['all', 'calls', 'sms'] as const).map(t => (
              <button
                key={t}
                onClick={() => setCommTypeFilter(t)}
                className={`px-2 py-0.5 rounded uppercase cursor-pointer transition-colors ${
                  commTypeFilter === t
                    ? 'bg-[#27272a] text-white font-bold'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 font-mono text-gray-400 text-[11px]">
          <span className="text-gray-600">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#18181b] border border-[#27272a] rounded px-2 py-0.5 text-gray-300 focus:outline-none cursor-pointer"
          >
            <option value="targets">Overlap (High to Low)</option>
            <option value="interactions">Interactions</option>
            <option value="duration">Call Duration</option>
            <option value="recent">Recent Activity</option>
          </select>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        
        {files.length < 2 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500 font-mono text-xs">
            <p>At least 2 CDR targets required for mutual contact analysis.</p>
            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="mt-3 px-3 py-1.5 bg-[#3ecf8e] text-black font-sans font-bold rounded-lg cursor-pointer"
              >
                + Add CDR Spreadsheet
              </button>
            )}
          </div>
        ) : filteredBParties.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500 font-mono text-xs">
            <p>No mutual contacts found for current filter.</p>
          </div>
        ) : (
          /* High-Density Data Table */
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-[#161619] border-b border-[#232326] text-[10px] uppercase font-mono text-gray-500 tracking-wider z-10">
                  <tr>
                    <th className="py-2.5 px-6 font-semibold w-64">Contact / B-Party</th>
                    <th className="py-2.5 px-4 font-semibold w-24">Carrier</th>
                    <th className="py-2.5 px-4 font-semibold w-28 text-center">Overlap</th>
                    <th className="py-2.5 px-4 font-semibold">Targets Involved</th>
                    <th className="py-2.5 px-4 font-semibold w-28 text-right">Calls</th>
                    <th className="py-2.5 px-4 font-semibold w-24 text-right">SMS</th>
                    <th className="py-2.5 px-6 font-semibold w-32 text-right">Last Seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e21] font-mono text-xs">
                  {filteredBParties.map((item) => {
                    const isSelected = selectedBParty?.bParty === item.bParty;
                    const isAll = item.targetsCount === files.length;

                    return (
                      <tr
                        key={item.bParty}
                        onClick={() => setSelectedBParty(item)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#18231c] text-white'
                            : 'hover:bg-[#161619] text-gray-300'
                        }`}
                      >
                        {/* B-Party / Decoded identity */}
                        <td className="py-3 px-6 select-all font-medium">
                          <div className="flex items-center gap-2">
                            <div>
                              {item.decodedName ? (
                                <>
                                  <span className="font-bold text-gray-100 font-sans block leading-none">
                                    {item.decodedName}
                                  </span>
                                  <span className="text-[10px] text-gray-500 font-mono block mt-1">
                                    {item.bParty}
                                  </span>
                                </>
                              ) : (
                                <span className={`font-semibold ${isSelected ? 'text-[#3ecf8e]' : 'text-gray-200'}`}>
                                  {item.bParty}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => handleCopy(e, item.bParty)}
                              className="p-1 text-gray-600 hover:text-gray-300 rounded transition-colors"
                              title="Copy"
                            >
                              {copiedNumber === item.bParty ? (
                                <Check className="h-3 w-3 text-[#3ecf8e]" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Carrier */}
                        <td className="py-3 px-4">
                          {item.carrier ? (
                            <span className="px-1.5 py-0.5 rounded bg-[#1e1e22] border border-[#2b2b30] text-[10px] text-gray-400 font-mono">
                              {item.carrier}
                            </span>
                          ) : (
                            <span className="text-gray-600 text-[10px]">-</span>
                          )}
                        </td>

                        {/* Overlap Badge */}
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isAll
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : item.targetsCount >= 3
                                ? 'bg-[#3ecf8e]/15 text-[#3ecf8e] border border-[#3ecf8e]/30'
                                : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          }`}>
                            {item.targetsCount} / {files.length}
                          </span>
                        </td>

                        {/* Shared Targets */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {item.targetBreakdowns.map((tb) => (
                              <span
                                key={tb.fileId}
                                className="px-2 py-0.5 bg-[#1a1a1d] border border-[#27272a] rounded text-[11px] text-gray-300"
                                title={`Target ${tb.targetPhone}: ${tb.callCount} calls, ${tb.smsCount} SMS`}
                              >
                                {tb.targetPhone}
                                <span className="text-[10px] text-gray-500 ml-1">
                                  ({tb.callCount + tb.smsCount})
                                </span>
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Calls */}
                        <td className="py-3 px-4 text-right">
                          {item.totalCalls > 0 ? (
                            <span className="text-emerald-400 font-semibold">
                              {item.totalCalls}
                              {item.totalDuration > 0 && (
                                <span className="text-gray-500 font-normal ml-1 text-[10px]">
                                  ({formatDuration(item.totalDuration)})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-600">0</span>
                          )}
                        </td>

                        {/* SMS */}
                        <td className="py-3 px-4 text-right">
                          {item.totalSms > 0 ? (
                            <span className="text-sky-400 font-semibold">{item.totalSms}</span>
                          ) : (
                            <span className="text-gray-600">0</span>
                          )}
                        </td>

                        {/* Last Seen */}
                        <td className="py-3 px-6 text-right text-[11px] text-gray-500">
                          {new Date(item.lastTimestamp).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric'
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Right Drawer Inspector */}
            {selectedBParty && (
              <div className="w-[420px] border-l border-[#232326] bg-[#141416] flex flex-col h-full overflow-hidden shrink-0 animate-in slide-in-from-right-3 duration-150">
                {/* Drawer Top */}
                <div className="h-14 px-5 border-b border-[#232326] flex items-center justify-between shrink-0 bg-[#161619]">
                  <div className="flex items-center gap-2">
                    <div>
                      <span className="text-xs font-bold text-gray-100 font-mono">
                        {selectedBParty.decodedName || selectedBParty.bParty}
                      </span>
                      {selectedBParty.decodedName && (
                        <span className="text-[10px] font-mono text-gray-500 block leading-none mt-0.5">
                          {selectedBParty.bParty}
                        </span>
                      )}
                    </div>
                    {selectedBParty.carrier && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#1f1f23] rounded text-gray-400">
                        {selectedBParty.carrier}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedBParty(null)}
                    className="p-1 text-gray-500 hover:text-gray-300 rounded cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Drawer Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                  
                  {/* Targets Breakdown Table */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-mono font-bold text-gray-500 tracking-wider block">
                      Target Activity Breakdown
                    </span>
                    <div className="border border-[#232326] rounded-lg overflow-hidden bg-[#111113]">
                      <table className="w-full text-left font-mono text-xs">
                        <thead className="bg-[#18181b] border-b border-[#232326] text-[9px] uppercase text-gray-500">
                          <tr>
                            <th className="py-2 px-3">Target</th>
                            <th className="py-2 px-2 text-right">Calls</th>
                            <th className="py-2 px-2 text-right">SMS</th>
                            <th className="py-2 px-3 text-right">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1c1c1f]">
                          {selectedBParty.targetBreakdowns.map((tb) => (
                            <tr key={tb.fileId}>
                              <td className="py-2 px-3 text-gray-200 font-medium">
                                {tb.targetPhone}
                              </td>
                              <td className="py-2 px-2 text-right text-emerald-400">
                                {tb.callCount}
                              </td>
                              <td className="py-2 px-2 text-right text-sky-400">
                                {tb.smsCount}
                              </td>
                              <td className="py-2 px-3 text-right text-gray-400">
                                {formatDuration(tb.totalDuration)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Associated Tower Locations */}
                  {Array.from(new Set(selectedBParty.targetBreakdowns.flatMap(t => Array.from(t.locations)))).length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-mono font-bold text-gray-500 tracking-wider block">
                        Cell Locations Recorded
                      </span>
                      <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar">
                        {Array.from(new Set(selectedBParty.targetBreakdowns.flatMap(t => Array.from(t.locations)))).slice(0, 5).map((loc, i) => (
                          <p key={i} className="text-[11px] font-mono text-gray-400 bg-[#18181b] p-2 rounded border border-[#232326] truncate" title={loc}>
                            📍 {loc}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chronological Event Log */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-mono font-bold text-gray-500 tracking-wider block">
                      Activity Timeline ({selectedBParty.allRecords.length})
                    </span>
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {selectedBParty.allRecords.map((rec, i) => {
                        const file = fileMap.get(rec.fileId);
                        const isSms = rec.usageType?.toUpperCase().includes('SMS');
                        return (
                          <div
                            key={i}
                            className="p-2 bg-[#18181b] border border-[#232326] rounded flex items-center justify-between text-[11px] font-mono"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 font-bold">
                                {file?.phoneNumber ? file.phoneNumber.slice(-5) : 'Target'}
                              </span>
                              <span className={`text-[10px] font-bold ${isSms ? 'text-sky-400' : 'text-emerald-400'}`}>
                                {rec.usageType || 'CALL'}
                              </span>
                            </div>
                            <div className="text-right text-gray-500 text-[10px]">
                              <span>{formatDuration(rec.duration || 0)} · </span>
                              <span>
                                {new Date(rec.timestamp).toLocaleString(undefined, {
                                  month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
