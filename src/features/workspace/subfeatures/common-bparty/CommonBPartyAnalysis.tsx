import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Download, Copy, Check, X, Phone, 
  MessageSquare, FileSpreadsheet, ArrowUpDown, ChevronRight,
  Layers, Clock, RotateCcw, PanelRightClose, PanelRightOpen,
  MapPin, Calendar, Activity, CheckCircle2, MinusCircle, Filter
} from 'lucide-react';
import { type Case, type CDRFile, type CDRRecord } from '../../../../utils/db';
import { useCaseData } from '../../hooks/useCaseData';

interface CommonBPartyAnalysisProps {
  activeCase: Case;
  onOpenUpload?: () => void;
}

// Decode ASCII text from Hexadecimal string (handles truncated & odd-length strings like GovtInfo)
export function decodeHexIfPrintable(rawStr: string): string | null {
  if (!rawStr) return null;
  const str = rawStr.trim();
  if (str.length < 4) return null;
  if (!/^[0-9A-Fa-f]+$/.test(str)) return null;

  // Truncate to even length if odd-length nibble occurs in CDR export
  const evenStr = str.length % 2 !== 0 ? str.slice(0, -1) : str;
  if (evenStr.length < 4) return null;

  try {
    let text = '';
    for (let i = 0; i < evenStr.length; i += 2) {
      const code = parseInt(evenStr.substring(i, i + 2), 16);
      if (code < 32 || code > 126) return null; // non-printable ASCII
      text += String.fromCharCode(code);
    }
    const cleanText = text.trim();
    if (cleanText.length >= 2 && /[A-Za-z]/.test(cleanText)) {
      if (str.length % 2 !== 0 && str.toLowerCase().endsWith('6') && cleanText.toLowerCase() === 'govtinf') {
        return 'GovtInfo';
      }
      return cleanText;
    }
  } catch {
    return null;
  }
  return null;
}

// Normalize phone number
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

// Classification & Network Badge
export interface ContactIdentity {
  displayName: string;
  rawParty: string;
  isMask: boolean;
  carrier: string;
  category: 'mobile' | 'mask' | 'service' | 'other';
}

export function classifyContact(raw: string): ContactIdentity {
  const decoded = decodeHexIfPrintable(raw);
  if (decoded) {
    return {
      displayName: decoded,
      rawParty: raw,
      isMask: true,
      carrier: 'Mask / Brand',
      category: 'mask'
    };
  }

  const norm = normalizePhone(raw);
  if (norm.startsWith('017') || norm.startsWith('013')) return { displayName: norm, rawParty: raw, isMask: false, carrier: 'GP', category: 'mobile' };
  if (norm.startsWith('018')) return { displayName: norm, rawParty: raw, isMask: false, carrier: 'Robi', category: 'mobile' };
  if (norm.startsWith('019') || norm.startsWith('014')) return { displayName: norm, rawParty: raw, isMask: false, carrier: 'BL', category: 'mobile' };
  if (norm.startsWith('016')) return { displayName: norm, rawParty: raw, isMask: false, carrier: 'Airtel', category: 'mobile' };
  if (norm.startsWith('015')) return { displayName: norm, rawParty: raw, isMask: false, carrier: 'Teletalk', category: 'mobile' };

  if (raw.startsWith('8804') || raw.length <= 7 || /^\d{4,6}$/.test(raw)) {
    return { displayName: raw, rawParty: raw, isMask: false, carrier: 'Service / VAS', category: 'service' };
  }

  return { displayName: raw, rawParty: raw, isMask: false, carrier: 'Other / Landline', category: 'other' };
}

// Duration Formatter
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
  identity: ContactIdentity;
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
  const [selectedPartyKey, setSelectedPartyKey] = useState<string | null>(null);
  const [showInspector, setShowInspector] = useState<boolean>(true);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [copiedBatch, setCopiedBatch] = useState(false);

  // File Lookup Map
  const fileMap = useMemo(() => {
    const map = new Map<number, CDRFile>();
    files.forEach(f => {
      if (f.id) map.set(f.id, f);
    });
    return map;
  }, [files]);

  // Aggregate All Common B-Parties across all files
  const commonBParties = useMemo(() => {
    if (files.length === 0 || records.length === 0) return [];

    const map = new Map<string, {
      bParty: string;
      identity: ContactIdentity;
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
          identity: classifyContact(cleanNumber),
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
      // Only keep contacts that appear in at least 2 targets for mutual contact analysis
      if (val.targetFileIds.size >= 2) {
        val.allRecords.sort((a, b) => a.timestamp - b.timestamp);
        list.push({
          bParty: val.bParty,
          identity: val.identity,
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
      }
    });

    return list;
  }, [records, files, fileMap]);

  // Max Overlap in dataset
  const maxOverlap = useMemo(() => {
    if (commonBParties.length === 0) return 0;
    return Math.max(...commonBParties.map(c => c.targetsCount));
  }, [commonBParties]);

  // Dynamic Overlap Filter Levels (e.g. 2, 3, 4, 5)
  const overlapLevels = useMemo(() => {
    if (files.length <= 2) return [2];
    const lvls: number[] = [2];
    if (files.length >= 3) lvls.push(3);
    if (files.length >= 4) lvls.push(4);
    if (files.length >= 5) lvls.push(files.length);
    return Array.from(new Set(lvls)).filter(l => l <= files.length);
  }, [files.length]);

  // Calculate live count for each Overlap option
  const getOverlapCount = (level: number) => {
    return commonBParties.filter(item => {
      if (item.targetsCount < level) return false;
      if (commTypeFilter === 'calls' && item.totalCalls === 0) return false;
      if (commTypeFilter === 'sms' && item.totalSms === 0) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matches = item.bParty.toLowerCase().includes(q) ||
          item.identity.displayName.toLowerCase().includes(q) ||
          item.identity.carrier.toLowerCase().includes(q) ||
          item.targetBreakdowns.some(tb => tb.targetPhone.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    }).length;
  };

  // Calculate live count for each Communication Type option
  const getCommTypeCount = (type: 'all' | 'calls' | 'sms') => {
    return commonBParties.filter(item => {
      if (item.targetsCount < minTargets) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matches = item.bParty.toLowerCase().includes(q) ||
          item.identity.displayName.toLowerCase().includes(q) ||
          item.identity.carrier.toLowerCase().includes(q) ||
          item.targetBreakdowns.some(tb => tb.targetPhone.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (type === 'calls') return item.totalCalls > 0;
      if (type === 'sms') return item.totalSms > 0;
      return true;
    }).length;
  };

  // Filtered & Sorted Records
  const filteredBParties = useMemo(() => {
    let result = commonBParties.filter(item => item.targetsCount >= minTargets);

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(item => 
        item.bParty.toLowerCase().includes(q) ||
        item.identity.displayName.toLowerCase().includes(q) ||
        item.identity.carrier.toLowerCase().includes(q) ||
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

  // Auto-Select First Contact so right panel is populated
  const activeSelectedParty = useMemo(() => {
    if (filteredBParties.length === 0) return null;
    if (selectedPartyKey) {
      const found = filteredBParties.find(p => p.bParty === selectedPartyKey);
      if (found) return found;
    }
    return filteredBParties[0];
  }, [filteredBParties, selectedPartyKey]);

  // Filter valid cell tower locations (removing dummy or dash values)
  const validLocations = useMemo(() => {
    if (!activeSelectedParty) return [];
    const locs = new Set<string>();
    activeSelectedParty.targetBreakdowns.forEach(tb => {
      tb.locations.forEach(l => {
        const trimmed = l?.trim();
        if (trimmed && trimmed !== '-' && trimmed !== 'null' && trimmed !== 'undefined' && trimmed.length > 2) {
          locs.add(trimmed);
        }
      });
    });
    return Array.from(locs);
  }, [activeSelectedParty]);

  // KPI Aggregates
  const totalMutualCalls = useMemo(() => commonBParties.reduce((sum, c) => sum + c.totalCalls, 0), [commonBParties]);
  const totalMutualSms = useMemo(() => commonBParties.reduce((sum, c) => sum + c.totalSms, 0), [commonBParties]);

  // Copy Single Number
  const handleCopy = (e: React.MouseEvent, num: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 1500);
  };

  // Copy All Filtered Numbers
  const handleCopyAll = () => {
    if (filteredBParties.length === 0) return;
    const text = filteredBParties.map(i => i.identity.displayName || i.bParty).join('\n');
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
        'B-Party': item.bParty,
        'Name / Mask': item.identity.isMask ? item.identity.displayName : 'N/A',
        'Type': item.identity.carrier,
        'Overlap Ratio': `${item.targetsCount} / ${files.length}`,
        'Shared Targets': item.targetBreakdowns.map(tb => tb.targetPhone).join(', '),
        'Calls Count': item.totalCalls,
        'SMS Count': item.totalSms,
        'Total Events': item.totalInteractions,
        'Total Duration': formatDuration(item.totalDuration),
        'First Active': new Date(item.firstTimestamp).toLocaleString(),
        'Last Active': new Date(item.lastTimestamp).toLocaleString()
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
    const headers = ['#', 'B-Party', 'Name/Mask', 'Type', 'Overlap', 'Shared Targets', 'Calls', 'SMS', 'Total Events', 'Duration', 'Last Seen'];
    const rows = filteredBParties.map((item, idx) => [
      idx + 1,
      `"${item.bParty}"`,
      `"${item.identity.isMask ? item.identity.displayName : ''}"`,
      `"${item.identity.carrier}"`,
      `"${item.targetsCount}/${files.length}"`,
      `"${item.targetBreakdowns.map(tb => tb.targetPhone).join(', ')}"`,
      item.totalCalls,
      item.totalSms,
      item.totalInteractions,
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

  // Reset Filters helper
  const handleResetFilters = () => {
    setMinTargets(2);
    setCommTypeFilter('all');
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0d0d10] text-gray-400 font-mono text-sm">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 animate-spin text-[#3ecf8e]" />
          <span>Analyzing mutual cross-target contacts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden flex flex-col bg-[#0d0d10] text-gray-200 text-left font-sans select-none">
      
      {/* Top Header */}
      <div className="h-16 px-6 border-b border-[#22222a] bg-[#131318] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="h-9 w-9 rounded-xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/30 flex items-center justify-center shadow-inner">
            <Users className="h-5 w-5 text-[#3ecf8e]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-sm font-bold text-gray-100 uppercase tracking-wider">
                Common B-Party Analysis
              </h1>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-[#1d1d24] text-[#3ecf8e] border border-[#2d2d38] font-semibold">
                {filteredBParties.length} Shown / {commonBParties.length} Total
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyAll}
            disabled={filteredBParties.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#18181f] hover:bg-[#22222c] border border-[#2b2b36] text-gray-200 hover:text-white rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Copy numbers list"
          >
            {copiedBatch ? <Check className="h-4 w-4 text-[#3ecf8e]" /> : <Copy className="h-4 w-4 text-gray-400" />}
            <span>{copiedBatch ? 'Copied' : `Copy (${filteredBParties.length})`}</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={filteredBParties.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#18181f] hover:bg-[#22222c] border border-[#2b2b36] text-gray-200 hover:text-white rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Export CSV"
          >
            <Download className="h-4 w-4 text-gray-400" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={filteredBParties.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#0e2017] hover:bg-[#132c1f] border border-emerald-700/40 text-[#3ecf8e] rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Export Excel"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#3ecf8e]" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => setShowInspector(!showInspector)}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              showInspector 
                ? 'bg-[#20202a] border-[#363644] text-[#3ecf8e]' 
                : 'bg-[#18181f] border-[#2b2b36] text-gray-400 hover:text-gray-200'
            }`}
            title={showInspector ? 'Hide Inspector Panel' : 'Show Inspector Panel'}
          >
            {showInspector ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="px-6 py-3 border-b border-[#22222a] bg-[#101015] grid grid-cols-4 gap-4 shrink-0">
        <div className="bg-[#15151b] border border-[#24242e] rounded-xl px-4 py-2.5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-mono uppercase text-gray-400 font-semibold block tracking-wider">Mutual Contacts</span>
            <span className="text-xl font-bold font-mono text-gray-100">{commonBParties.length}</span>
          </div>
          <span className="text-xs font-mono text-gray-400 bg-[#1c1c24] px-2 py-0.5 rounded border border-[#2a2a34]">≥ 2 targets</span>
        </div>

        <div className="bg-[#15151b] border border-[#24242e] rounded-xl px-4 py-2.5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-mono uppercase text-gray-400 font-semibold block tracking-wider">Max Overlap</span>
            <span className="text-xl font-bold font-mono text-[#3ecf8e]">{maxOverlap} / {files.length}</span>
          </div>
          <span className="text-xs font-mono text-gray-400 bg-[#1c1c24] px-2 py-0.5 rounded border border-[#2a2a34]">targets</span>
        </div>

        <div className="bg-[#15151b] border border-[#24242e] rounded-xl px-4 py-2.5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-mono uppercase text-gray-400 font-semibold block tracking-wider">Voice Calls</span>
            <span className={`text-xl font-bold font-mono ${totalMutualCalls > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
              {totalMutualCalls}
            </span>
          </div>
          <span className="text-xs font-mono text-gray-400 bg-[#1c1c24] px-2 py-0.5 rounded border border-[#2a2a34]">events</span>
        </div>

        <div className="bg-[#15151b] border border-[#24242e] rounded-xl px-4 py-2.5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-mono uppercase text-gray-400 font-semibold block tracking-wider">SMS Messages</span>
            <span className="text-xl font-bold font-mono text-sky-400">{totalMutualSms}</span>
          </div>
          <span className="text-xs font-mono text-gray-400 bg-[#1c1c24] px-2 py-0.5 rounded border border-[#2a2a34]">events</span>
        </div>
      </div>

      {/* Filter Control Bar with Live Counts */}
      <div className="h-14 px-6 border-b border-[#22222a] bg-[#121217] flex items-center justify-between gap-4 shrink-0 text-sm">
        <div className="flex items-center gap-4 flex-1 overflow-x-auto custom-scrollbar py-1">
          
          {/* Search Box */}
          <div className="relative w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search number, mask, carrier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#18181f] border border-[#2c2c36] rounded-lg pl-9 pr-8 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#3ecf8e] font-mono"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Overlap Filter Pills */}
          <div className="flex items-center gap-1.5 bg-[#18181f] border border-[#2c2c36] rounded-lg p-1 font-mono text-xs shrink-0">
            <span className="px-2 text-xs text-gray-400 font-bold uppercase tracking-wider">Overlap:</span>
            {overlapLevels.map((lvl) => {
              const count = getOverlapCount(lvl);
              const isActive = minTargets === lvl;
              const isZero = count === 0;

              return (
                <button
                  key={lvl}
                  onClick={() => setMinTargets(lvl)}
                  className={`px-2.5 py-1 rounded-md cursor-pointer transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#2b2b38] text-[#3ecf8e] font-bold shadow-sm'
                      : isZero
                        ? 'text-gray-500 hover:text-gray-400'
                        : 'text-gray-300 hover:text-white'
                  }`}
                  title={`${count} contacts shared by ≥ ${lvl} targets`}
                >
                  <span>{lvl === files.length && files.length > 2 ? `All ${lvl}` : `≥ ${lvl}`}</span>
                  <span className={`text-xs px-1.5 py-0.2 rounded ${
                    isActive 
                      ? 'bg-[#3ecf8e]/20 text-[#3ecf8e]' 
                      : isZero 
                        ? 'bg-[#22222c] text-gray-500' 
                        : 'bg-[#22222c] text-gray-300 font-semibold'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 bg-[#18181f] border border-[#2c2c36] rounded-lg p-1 font-mono text-xs shrink-0">
            <span className="px-2 text-xs text-gray-400 font-bold uppercase tracking-wider">Type:</span>
            {(['all', 'calls', 'sms'] as const).map((t) => {
              const count = getCommTypeCount(t);
              const isActive = commTypeFilter === t;
              const isZero = count === 0;

              return (
                <button
                  key={t}
                  onClick={() => setCommTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-md uppercase cursor-pointer transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#2b2b38] text-white font-bold shadow-sm'
                      : isZero
                        ? 'text-gray-500 hover:text-gray-400'
                        : 'text-gray-300 hover:text-white'
                  }`}
                  title={`${count} contacts with ${t} interactions`}
                >
                  <span>{t}</span>
                  <span className={`text-xs px-1.5 py-0.2 rounded ${
                    isActive 
                      ? 'bg-[#3ecf8e]/20 text-[#3ecf8e]' 
                      : isZero 
                        ? 'bg-[#22222c] text-gray-500' 
                        : 'bg-[#22222c] text-gray-300 font-semibold'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Reset Filters button */}
          {(minTargets !== 2 || commTypeFilter !== 'all' || searchTerm.trim() !== '') && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 text-xs font-mono text-gray-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-[#18181f] border border-[#2c2c36] cursor-pointer shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="h-3.5 w-3.5 text-gray-400" />
              <span>Reset</span>
            </button>
          )}

        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 font-mono text-gray-300 text-xs shrink-0">
          <span className="text-gray-400 font-semibold">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#18181f] border border-[#2c2c36] rounded-lg px-2.5 py-1.5 text-gray-200 focus:outline-none cursor-pointer text-xs"
          >
            <option value="targets">Overlap (High to Low)</option>
            <option value="interactions">Total Events</option>
            <option value="duration">Call Duration</option>
            <option value="recent">Recent Activity</option>
          </select>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {files.length < 2 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 font-mono text-sm">
            <Users className="h-10 w-10 text-gray-500 mb-3" />
            <p>At least 2 CDR target files required for cross-target mutual analysis.</p>
            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="mt-4 px-4 py-2 bg-[#3ecf8e] text-black font-sans font-bold rounded-lg cursor-pointer hover:bg-[#34b27b] transition-colors"
              >
                + Add CDR Spreadsheet
              </button>
            )}
          </div>
        ) : filteredBParties.length === 0 ? (
          /* Informative Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-300 font-mono text-sm">
            <Search className="h-10 w-10 text-gray-500 mb-3" />
            <p className="text-gray-100 font-semibold text-base mb-1.5">No mutual contacts found for current filter.</p>
            
            {/* Contextual diagnostics */}
            {commTypeFilter === 'calls' && totalMutualCalls === 0 ? (
              <p className="text-gray-400 text-xs max-w-md mb-4">
                All mutual interactions in this case are SMS messages (0 voice calls recorded).
              </p>
            ) : minTargets > maxOverlap ? (
              <p className="text-gray-400 text-xs max-w-md mb-4">
                Maximum overlap across targets in this case is {maxOverlap} (no contacts are shared by ≥ {minTargets} targets).
              </p>
            ) : searchTerm ? (
              <p className="text-gray-400 text-xs max-w-md mb-4">
                No contact matches search &ldquo;{searchTerm}&rdquo;.
              </p>
            ) : (
              <p className="text-gray-400 text-xs max-w-md mb-4">
                Try lowering the overlap threshold or resetting filters.
              </p>
            )}

            <div className="flex items-center gap-3">
              {commTypeFilter === 'calls' && totalMutualSms > 0 && (
                <button
                  onClick={() => setCommTypeFilter('sms')}
                  className="px-3.5 py-1.5 bg-[#1b2536] border border-sky-700/50 text-sky-300 rounded-lg cursor-pointer hover:bg-[#223046] transition-colors text-xs font-semibold"
                >
                  Switch to SMS ({totalMutualSms})
                </button>
              )}
              {minTargets > 2 && (
                <button
                  onClick={() => setMinTargets(2)}
                  className="px-3.5 py-1.5 bg-[#15271d] border border-emerald-700/50 text-[#3ecf8e] rounded-lg cursor-pointer hover:bg-[#1c3527] transition-colors text-xs font-semibold"
                >
                  Show Overlap ≥ 2 ({commonBParties.length})
                </button>
              )}
              <button
                onClick={handleResetFilters}
                className="px-3.5 py-1.5 bg-[#1e1e26] border border-[#2e2e3a] text-gray-200 rounded-lg cursor-pointer hover:bg-[#282834] transition-colors text-xs font-semibold"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          /* High-Density Data Table */
          <div className="flex-1 flex overflow-hidden">
            
            {/* Table Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="sticky top-0 bg-[#15151c] border-b border-[#24242e] text-xs uppercase font-mono text-gray-400 tracking-wider z-10">
                  <tr>
                    <th className="py-3 px-6 font-semibold min-w-[220px]">Contact / B-Party</th>
                    <th className="py-3 px-4 font-semibold min-w-[130px]">Type</th>
                    <th className="py-3 px-4 font-semibold w-28 text-center">Overlap</th>
                    <th className="py-3 px-4 font-semibold">Shared Targets</th>
                    <th className="py-3 px-4 font-semibold w-28 text-right">Calls</th>
                    <th className="py-3 px-4 font-semibold w-24 text-right">SMS</th>
                    <th className="py-3 px-6 font-semibold w-32 text-right">Last Seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c1c24] font-mono text-sm">
                  {filteredBParties.map((item) => {
                    const isSelected = activeSelectedParty?.bParty === item.bParty;
                    const isAll = item.targetsCount === files.length;

                    return (
                      <tr
                        key={item.bParty}
                        onClick={() => setSelectedPartyKey(item.bParty)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#16231c] text-white border-l-4 border-l-[#3ecf8e]'
                            : 'hover:bg-[#15151c] text-gray-200'
                        }`}
                      >
                        {/* Contact Name & Number */}
                        <td className="py-3 px-6 select-all font-medium">
                          <div className="flex items-center gap-2.5">
                            <div>
                              {item.identity.isMask ? (
                                <>
                                  <span className="font-bold text-gray-100 font-sans block text-sm leading-tight">
                                    {item.identity.displayName}
                                  </span>
                                  <span className="text-xs text-gray-400 font-mono block mt-0.5 truncate max-w-[190px]" title={item.bParty}>
                                    {item.bParty}
                                  </span>
                                </>
                              ) : (
                                <span className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-100'}`}>
                                  {item.bParty}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => handleCopy(e, item.bParty)}
                              className="p-1 text-gray-500 hover:text-gray-200 rounded transition-colors"
                              title="Copy number"
                            >
                              {copiedNumber === item.bParty ? (
                                <Check className="h-3.5 w-3.5 text-[#3ecf8e]" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Type / Carrier */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-mono font-medium border whitespace-nowrap ${
                            item.identity.category === 'mobile'
                              ? 'bg-[#1e1e28] border-[#2e2e3e] text-gray-200'
                              : item.identity.category === 'mask'
                                ? 'bg-amber-950/30 border-amber-800/40 text-amber-300'
                                : 'bg-[#192130] border-[#29364e] text-sky-300'
                          }`}>
                            {item.identity.carrier}
                          </span>
                        </td>

                        {/* Overlap Ratio Badge */}
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isAll
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/35'
                              : item.targetsCount >= 3
                                ? 'bg-[#3ecf8e]/20 text-[#3ecf8e] border border-[#3ecf8e]/35'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/35'
                          }`}>
                            {item.targetsCount} / {files.length}
                          </span>
                        </td>

                        {/* Shared Targets involved */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {item.targetBreakdowns.map((tb) => (
                              <span
                                key={tb.fileId}
                                className="px-2 py-0.5 bg-[#191921] border border-[#2b2b36] rounded text-xs text-gray-200 font-mono"
                                title={`Target ${tb.targetPhone}: ${tb.callCount} calls, ${tb.smsCount} SMS`}
                              >
                                {tb.targetPhone}
                                <span className="text-gray-400 ml-1 font-semibold">
                                  ({tb.callCount + tb.smsCount})
                                </span>
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Calls */}
                        <td className="py-3 px-4 text-right">
                          {item.totalCalls > 0 ? (
                            <span className="text-emerald-400 font-bold text-sm">
                              {item.totalCalls}
                              {item.totalDuration > 0 && (
                                <span className="text-gray-400 font-normal ml-1 text-xs">
                                  ({formatDuration(item.totalDuration)})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">0</span>
                          )}
                        </td>

                        {/* SMS */}
                        <td className="py-3 px-4 text-right">
                          {item.totalSms > 0 ? (
                            <span className="text-sky-400 font-bold text-sm">{item.totalSms}</span>
                          ) : (
                            <span className="text-gray-500 text-sm">0</span>
                          )}
                        </td>

                        {/* Last Seen */}
                        <td className="py-3 px-6 text-right text-xs text-gray-400">
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
            {showInspector && activeSelectedParty && (
              <div className="w-[460px] border-l border-[#22222a] bg-[#131318] flex flex-col h-full overflow-hidden shrink-0">
                
                {/* Inspector Header */}
                <div className="h-16 px-6 border-b border-[#22222a] flex items-center justify-between shrink-0 bg-[#16161d]">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-100 font-mono truncate">
                          {activeSelectedParty.identity.displayName}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#1e1e28] text-gray-300 border border-[#2e2e3e] shrink-0 whitespace-nowrap font-medium">
                          {activeSelectedParty.identity.carrier}
                        </span>
                      </div>
                      {activeSelectedParty.identity.isMask && (
                        <span className="text-xs font-mono text-gray-400 block leading-none mt-1 truncate">
                          Raw: {activeSelectedParty.bParty}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-[#3ecf8e]/15 text-[#3ecf8e] border border-[#3ecf8e]/25">
                      {activeSelectedParty.targetsCount} / {files.length} Targets
                    </span>
                    <button
                      onClick={() => setShowInspector(false)}
                      className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer hover:bg-[#20202a]"
                      title="Hide panel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Inspector Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                  
                  {/* Target Matrix (All files comparison) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-mono font-bold text-gray-400 tracking-wider block">
                        Target Comparison Matrix
                      </span>
                      <span className="text-xs font-mono text-gray-400 font-semibold">
                        {activeSelectedParty.targetBreakdowns.length} of {files.length} Active
                      </span>
                    </div>

                    <div className="border border-[#22222a] rounded-xl overflow-hidden bg-[#101015]">
                      <table className="w-full text-left font-mono text-xs">
                        <thead className="bg-[#181820] border-b border-[#22222a] text-xs uppercase text-gray-400 font-semibold">
                          <tr>
                            <th className="py-2.5 px-3.5">Target</th>
                            <th className="py-2.5 px-2 text-center">Status</th>
                            <th className="py-2.5 px-2 text-right">Calls</th>
                            <th className="py-2.5 px-2 text-right">SMS</th>
                            <th className="py-2.5 px-3 text-right">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a1a24]">
                          {files.map((file) => {
                            const tb = activeSelectedParty.targetBreakdowns.find(t => t.fileId === file.id);
                            const isConnected = !!tb;

                            return (
                              <tr key={file.id} className={isConnected ? 'bg-transparent' : 'opacity-35'}>
                                <td className="py-2.5 px-3.5 text-gray-100 font-medium">
                                  <span className="font-semibold">{file.phoneNumber || 'Target'}</span>
                                  {file.category && (
                                    <span className="text-xs text-gray-400 block leading-none mt-0.5">
                                      {file.category}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-2 text-center">
                                  {isConnected ? (
                                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 font-semibold">
                                      Connected
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-500 font-semibold">
                                      No Activity
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-2 text-right text-emerald-400 font-bold">
                                  {tb ? tb.callCount : 0}
                                </td>
                                <td className="py-2.5 px-2 text-right text-sky-400 font-bold">
                                  {tb ? tb.smsCount : 0}
                                </td>
                                <td className="py-2.5 px-3 text-right text-gray-300">
                                  {tb ? formatDuration(tb.totalDuration) : '0s'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Cell Locations Visited */}
                  {validLocations.length > 0 && (
                    <div className="space-y-2.5">
                      <span className="text-xs uppercase font-mono font-bold text-gray-400 tracking-wider block">
                        Cell Locations Recorded
                      </span>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                        {validLocations.slice(0, 6).map((loc, i) => (
                          <div key={i} className="text-xs font-mono text-gray-300 bg-[#171720] p-2.5 rounded-lg border border-[#242430] flex items-center gap-2.5 truncate" title={loc}>
                            <MapPin className="h-3.5 w-3.5 text-[#3ecf8e] shrink-0" />
                            <span className="truncate">{loc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activity Timeline Stream */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-mono font-bold text-gray-400 tracking-wider block">
                        Activity Timeline ({activeSelectedParty.allRecords.length})
                      </span>
                      <span className="text-xs font-mono text-gray-400 font-semibold">
                        Chronological
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[340px] overflow-y-auto custom-scrollbar">
                      {activeSelectedParty.allRecords.map((rec, i) => {
                        const file = fileMap.get(rec.fileId);
                        const isSms = rec.usageType?.toUpperCase().includes('SMS');
                        return (
                          <div
                            key={i}
                            className="p-2.5 bg-[#171720] border border-[#242430] rounded-lg flex items-center justify-between text-xs font-mono hover:border-[#2f2f3e] transition-colors shadow-sm"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-gray-100 font-semibold">
                                {file?.phoneNumber ? file.phoneNumber : 'Target'}
                              </span>
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                isSms 
                                  ? 'bg-sky-950/50 text-sky-400 border border-sky-800/40' 
                                  : 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40'
                              }`}>
                                {rec.usageType || 'CALL'}
                              </span>
                            </div>
                            <div className="text-right text-gray-400 text-xs">
                              {!isSms && (
                                <span className="text-gray-300 font-medium">{formatDuration(rec.duration || 0)} · </span>
                              )}
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
