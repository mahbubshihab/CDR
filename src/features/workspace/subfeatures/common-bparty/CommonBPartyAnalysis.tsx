import React, { useState, useMemo } from 'react';
import { 
  Users, Phone, MessageSquare, Clock, Filter, ArrowUpDown, 
  Download, Search, Check, Copy, ExternalLink, Calendar, 
  Smartphone, Layers, ChevronRight, X, Radio, ArrowRight,
  ShieldAlert, AlertCircle, FileSpreadsheet, Share2
} from 'lucide-react';
import { type Case, type CDRFile, type CDRRecord } from '../../../../utils/db';
import { useCaseData } from '../../hooks/useCaseData';

interface CommonBPartyAnalysisProps {
  activeCase: Case;
  onOpenUpload?: () => void;
}

// Phone number normalization
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

// Carrier detection
export function detectCarrier(phone: string): { name: string; color: string; bg: string; border: string } {
  const norm = normalizePhone(phone);
  if (norm.startsWith('017') || norm.startsWith('013')) {
    return { name: 'Grameenphone', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/25' };
  }
  if (norm.startsWith('018')) {
    return { name: 'Robi', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/25' };
  }
  if (norm.startsWith('019') || norm.startsWith('014')) {
    return { name: 'Banglalink', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/25' };
  }
  if (norm.startsWith('015')) {
    return { name: 'Teletalk', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' };
  }
  if (norm.startsWith('016')) {
    return { name: 'Airtel', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/25' };
  }
  return { name: 'Unknown', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/25' };
}

// Duration formatter
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

// Target badge color palette
const TARGET_COLORS = [
  { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/30' },
  { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30' },
  { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30' },
  { bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/30' },
  { bg: 'bg-indigo-500/15', text: 'text-indigo-300', border: 'border-indigo-500/30' },
  { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/30' },
  { bg: 'bg-teal-500/15', text: 'text-teal-300', border: 'border-teal-500/30' },
];

interface TargetBreakdown {
  fileId: number;
  targetPhone: string;
  targetCategory: string;
  targetOwner: string;
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
  carrier: { name: string; color: string; bg: string; border: string };
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

  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [minTargets, setMinTargets] = useState<number>(2);
  const [selectedTargetFilter, setSelectedTargetFilter] = useState<string>('all');
  const [commTypeFilter, setCommTypeFilter] = useState<'all' | 'calls' | 'sms'>('all');
  const [sortBy, setSortBy] = useState<'targets' | 'interactions' | 'duration' | 'recent'>('targets');
  
  // Selected B-Party for inspection drawer
  const [selectedBParty, setSelectedBParty] = useState<CommonBPartyGroup | null>(null);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [copiedBatch, setCopiedBatch] = useState(false);

  // Map fileId to Target File
  const fileMap = useMemo(() => {
    const map = new Map<number, CDRFile>();
    files.forEach(f => {
      if (f.id) map.set(f.id, f);
    });
    return map;
  }, [files]);

  // Color mapping per target
  const targetColorMap = useMemo(() => {
    const map = new Map<number, typeof TARGET_COLORS[0]>();
    files.forEach((f, idx) => {
      if (f.id) map.set(f.id, TARGET_COLORS[idx % TARGET_COLORS.length]);
    });
    return map;
  }, [files]);

  // Compute common B-parties across all targets
  const commonBParties = useMemo(() => {
    if (files.length === 0 || records.length === 0) return [];

    const map = new Map<string, {
      bParty: string;
      carrier: ReturnType<typeof detectCarrier>;
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
      const targetPhone = file?.phoneNumber || 'Unknown Target';
      const targetCategory = file?.category || 'Suspect';
      const targetOwner = file?.ownerName || 'Target';

      const isSms = rec.usageType?.toUpperCase().includes('SMS') || rec.duration === 0 && rec.usageType?.toLowerCase().includes('sms');
      const durationSec = typeof rec.duration === 'number' ? rec.duration : 0;

      if (!map.has(cleanNumber)) {
        map.set(cleanNumber, {
          bParty: cleanNumber,
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

      // Record target breakdown
      const item = map.get(cleanNumber)!;
      if (!item.targetBreakdownsMap.has(rec.fileId)) {
        const tb: TargetBreakdown = {
          fileId: rec.fileId,
          targetPhone,
          targetCategory,
          targetOwner,
          callCount: isSms ? 0 : 1,
          smsCount: isSms ? 1 : 0,
          totalDuration: isSms ? 0 : durationSec,
          firstTime: rec.timestamp,
          lastTime: rec.timestamp,
          locations: new Set(rec.address ? [rec.address] : []),
          records: [rec]
        };
        item.targetBreakdownsMap.set(rec.fileId, tb);
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

    // Convert map to list and filter for common B-Parties (shared by 2 or more targets)
    const list: CommonBPartyGroup[] = [];
    map.forEach(val => {
      // Sort each contact's records chronologically
      val.allRecords.sort((a, b) => a.timestamp - b.timestamp);

      list.push({
        bParty: val.bParty,
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

  // Filtered and sorted results
  const filteredBParties = useMemo(() => {
    let result = commonBParties.filter(item => item.targetsCount >= minTargets);

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(item => 
        item.bParty.toLowerCase().includes(q) ||
        item.carrier.name.toLowerCase().includes(q) ||
        item.targetBreakdowns.some(tb => tb.targetPhone.toLowerCase().includes(q))
      );
    }

    // Target filter
    if (selectedTargetFilter !== 'all') {
      const targetIdNum = parseInt(selectedTargetFilter);
      result = result.filter(item => item.targetFileIds.has(targetIdNum));
    }

    // Communication type
    if (commTypeFilter === 'calls') {
      result = result.filter(item => item.totalCalls > 0);
    } else if (commTypeFilter === 'sms') {
      result = result.filter(item => item.totalSms > 0);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'targets') {
        if (b.targetsCount !== a.targetsCount) return b.targetsCount - a.targetsCount;
        return b.totalInteractions - a.totalInteractions;
      }
      if (sortBy === 'interactions') {
        return b.totalInteractions - a.totalInteractions;
      }
      if (sortBy === 'duration') {
        return b.totalDuration - a.totalDuration;
      }
      if (sortBy === 'recent') {
        return b.lastTimestamp - a.lastTimestamp;
      }
      return 0;
    });

    return result;
  }, [commonBParties, minTargets, searchTerm, selectedTargetFilter, commTypeFilter, sortBy]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalMutual = commonBParties.filter(i => i.targetsCount >= 2).length;
    const maxOverlap = commonBParties.reduce((max, i) => Math.max(max, i.targetsCount), 0);
    const totalCrossInteractions = commonBParties
      .filter(i => i.targetsCount >= 2)
      .reduce((sum, i) => sum + i.totalInteractions, 0);

    return {
      totalTargets: files.length,
      totalContacts: commonBParties.length,
      totalMutual,
      maxOverlap,
      totalCrossInteractions
    };
  }, [commonBParties, files]);

  // Copy single number
  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  // Copy batch of all filtered common numbers
  const handleCopyAllNumbers = () => {
    if (filteredBParties.length === 0) return;
    const text = filteredBParties.map(i => i.bParty).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedBatch(true);
    setTimeout(() => setCopiedBatch(false), 2500);
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = async () => {
    if (filteredBParties.length === 0) return;

    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      const exportRows = filteredBParties.map((item, idx) => {
        const targetNumbers = item.targetBreakdowns.map(tb => tb.targetPhone).join(', ');
        const breakdownSummary = item.targetBreakdowns
          .map(tb => `${tb.targetPhone} (${tb.callCount} calls, ${tb.smsCount} sms)`)
          .join(' | ');

        return {
          'SL': idx + 1,
          'Common B-Party': item.bParty,
          'Operator': item.carrier.name,
          'Target Count': item.targetsCount,
          'Overlap Ratio': `${item.targetsCount}/${files.length} (${Math.round((item.targetsCount / files.length) * 100)}%)`,
          'Shared Targets': targetNumbers,
          'Total Interactions': item.totalInteractions,
          'Total Calls': item.totalCalls,
          'Total SMS': item.totalSms,
          'Total Duration (Sec)': item.totalDuration,
          'Total Duration (Formatted)': formatDuration(item.totalDuration),
          'First Contact': new Date(item.firstTimestamp).toLocaleString(),
          'Last Contact': new Date(item.lastTimestamp).toLocaleString(),
          'Target Details': breakdownSummary
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Common_BParty_Report');

      const fileName = `Common_BParty_Case_${activeCase.caseIdString || activeCase.id}_${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Failed to export Excel:', err);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (filteredBParties.length === 0) return;

    const headers = [
      'Common B-Party', 'Operator', 'Target Count', 'Shared Targets',
      'Total Interactions', 'Total Calls', 'Total SMS', 'Total Duration',
      'First Contact', 'Last Contact'
    ];

    const rows = filteredBParties.map(item => [
      `"${item.bParty}"`,
      `"${item.carrier.name}"`,
      item.targetsCount,
      `"${item.targetBreakdowns.map(tb => tb.targetPhone).join(', ')}"`,
      item.totalInteractions,
      item.totalCalls,
      item.totalSms,
      `"${formatDuration(item.totalDuration)}"`,
      `"${new Date(item.firstTimestamp).toLocaleString()}"`,
      `"${new Date(item.lastTimestamp).toLocaleString()}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Common_BParty_Case_${activeCase.caseIdString || activeCase.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#121212] text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#3ecf8e] border-r-2 border-transparent mb-4"></div>
        <span className="text-xs font-semibold font-mono uppercase tracking-wider">
          Analyzing Mutual Contacts Across Case Targets...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden flex flex-col bg-[#121212] animate-in fade-in duration-300 text-left">
      
      {/* 1. Header Toolbar */}
      <div className="p-6 pb-4 border-b border-[#2e2e2e] shrink-0 bg-[#171717]/60">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 flex items-center justify-center">
                <Users className="h-4.5 w-4.5 text-[#3ecf8e]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                  <span>Common B-Party Intelligence</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#3ecf8e]/15 text-[#3ecf8e] border border-[#3ecf8e]/30 uppercase">
                    Cross-Target Mutual Contacts
                  </span>
                </h2>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  Detecting phone numbers contacted by multiple targets across <strong className="text-gray-300">{files.length} CDR files</strong> in case: <strong className="text-gray-200">{activeCase.title}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCopyAllNumbers}
              disabled={filteredBParties.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#252525] border border-[#2e2e2e] hover:border-gray-500 text-gray-300 hover:text-white rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Copy all common B-party numbers to clipboard"
            >
              {copiedBatch ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#3ecf8e]" />
                  <span className="text-[#3ecf8e] font-semibold">Copied {filteredBParties.length} Numbers!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-gray-400" />
                  <span>Copy Numbers ({filteredBParties.length})</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportCsv}
              disabled={filteredBParties.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#252525] border border-[#2e2e2e] hover:border-gray-500 text-gray-300 hover:text-white rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Export CSV"
            >
              <Download className="h-3.5 w-3.5 text-gray-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={filteredBParties.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0b1c15] hover:bg-[#0e241c] border border-emerald-950/50 hover:border-emerald-600/40 text-[#3ecf8e] hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-[0_0_12px_rgba(62,207,142,0.1)] hover:shadow-[0_0_18px_rgba(62,207,142,0.25)] disabled:opacity-40 disabled:cursor-not-allowed"
              title="Export Excel Worksheet"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-[#3ecf8e]" />
              <span>Export Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* 2. KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
          <div className="bg-[#141416] border border-[#27272a] p-3 rounded-xl">
            <span className="text-[10px] text-gray-500 uppercase font-mono font-bold block">Case Targets</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-gray-100">{stats.totalTargets}</span>
              <span className="text-[10px] text-gray-400 font-sans">Spreadsheets</span>
            </div>
          </div>

          <div className="bg-[#141416] border border-[#27272a] p-3 rounded-xl">
            <span className="text-[10px] text-gray-500 uppercase font-mono font-bold block">Unique B-Parties</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-gray-100">{stats.totalContacts.toLocaleString()}</span>
              <span className="text-[10px] text-gray-400 font-sans">Numbers</span>
            </div>
          </div>

          <div className="bg-[#141416] border border-[#3ecf8e]/30 p-3 rounded-xl bg-gradient-to-br from-[#3ecf8e]/5 to-transparent">
            <span className="text-[10px] text-[#3ecf8e] uppercase font-mono font-bold block flex items-center gap-1">
              <span>Common B-Parties</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#3ecf8e] animate-ping" />
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-[#3ecf8e]">{stats.totalMutual.toLocaleString()}</span>
              <span className="text-[10px] text-emerald-400/80 font-sans">≥ 2 Targets</span>
            </div>
          </div>

          <div className="bg-[#141416] border border-[#27272a] p-3 rounded-xl">
            <span className="text-[10px] text-gray-500 uppercase font-mono font-bold block">Highest Overlap</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-amber-400">{stats.maxOverlap}</span>
              <span className="text-[10px] text-gray-400 font-mono">/ {stats.totalTargets} Targets</span>
            </div>
          </div>

          <div className="bg-[#141416] border border-[#27272a] p-3 rounded-xl">
            <span className="text-[10px] text-gray-500 uppercase font-mono font-bold block">Cross Interactions</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-blue-400">{stats.totalCrossInteractions.toLocaleString()}</span>
              <span className="text-[10px] text-gray-400 font-sans">Calls & SMS</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter & Controls Bar */}
      <div className="p-4 border-b border-[#2e2e2e] bg-[#141414] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search B-party or carrier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1c1c1f] border border-[#27272a] rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#3ecf8e]/50 font-mono transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Min Targets Threshold */}
          <div className="flex items-center gap-1.5 bg-[#1c1c1f] border border-[#27272a] rounded-xl p-1 text-xs">
            <span className="text-[10px] text-gray-500 uppercase font-mono px-2 font-bold">Min Targets:</span>
            {[2, 3, files.length].filter((val, i, arr) => arr.indexOf(val) === i && val <= files.length).map(num => (
              <button
                key={num}
                onClick={() => setMinTargets(num)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  minTargets === num
                    ? 'bg-[#3ecf8e] text-black shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#252529]'
                }`}
              >
                {num === files.length && files.length > 2 ? `All (${num})` : `≥ ${num}`}
              </button>
            ))}
          </div>

          {/* Target Specific Filter */}
          {files.length > 2 && (
            <select
              value={selectedTargetFilter}
              onChange={(e) => setSelectedTargetFilter(e.target.value)}
              className="bg-[#1c1c1f] border border-[#27272a] rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-[#3ecf8e]/50 font-mono cursor-pointer"
            >
              <option value="all">Any Target Shared</option>
              {files.map(f => (
                <option key={f.id} value={f.id}>
                  Shared with: {f.phoneNumber} ({f.category})
                </option>
              ))}
            </select>
          )}

          {/* Comm Type */}
          <div className="flex items-center bg-[#1c1c1f] border border-[#27272a] rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setCommTypeFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                commTypeFilter === 'all' ? 'bg-[#2a2a2e] text-white font-semibold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setCommTypeFilter('calls')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                commTypeFilter === 'calls' ? 'bg-[#2a2a2e] text-white font-semibold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Calls
            </button>
            <button
              onClick={() => setCommTypeFilter('sms')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                commTypeFilter === 'sms' ? 'bg-[#2a2a2e] text-white font-semibold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              SMS
            </button>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-gray-500 font-bold uppercase text-[10px]">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#1c1c1f] border border-[#27272a] rounded-xl px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-[#3ecf8e]/50 cursor-pointer"
          >
            <option value="targets">Highest Overlap (Targets Count)</option>
            <option value="interactions">Most Interactions (Hits)</option>
            <option value="duration">Longest Call Duration</option>
            <option value="recent">Most Recent Contact</option>
          </select>
        </div>
      </div>

      {/* 4. Main Content Area (Empty Check or Split Table/Drawer View) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Check if fewer than 2 files uploaded */}
        {files.length < 2 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-500">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide">
              Minimum 2 Targets Required
            </h3>
            <p className="text-xs text-gray-500 max-w-md mt-2 leading-relaxed">
              Common B-Party analysis identifies overlapping mutual contacts among multiple suspects in this case. Currently, only <strong className="text-amber-400 font-mono">{files.length} target</strong> is uploaded.
            </p>
            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="mt-5 px-4 py-2 bg-[#3ecf8e] hover:bg-[#34b27b] text-black font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-[#3ecf8e]/10"
              >
                + Add Another CDR Spreadsheet
              </button>
            )}
          </div>
        ) : filteredBParties.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gray-800/50 border border-gray-700/40 flex items-center justify-center mb-4 text-gray-500">
              <Users className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-gray-300">
              No Common B-Parties Found
            </h3>
            <p className="text-xs text-gray-500 max-w-md mt-1.5 leading-relaxed">
              None of the targets in this case share mutual contacts matching your current filter criteria (≥ {minTargets} targets).
            </p>
            {(searchTerm || minTargets > 2 || selectedTargetFilter !== 'all' || commTypeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setMinTargets(2);
                  setSelectedTargetFilter('all');
                  setCommTypeFilter('all');
                }}
                className="mt-4 px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#252525] border border-[#2e2e2e] text-xs font-medium text-gray-300 rounded-lg cursor-pointer transition-colors"
              >
                Reset Filter Settings
              </button>
            )}
          </div>
        ) : (
          /* Table of Common B-Parties */
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500 font-mono px-1">
                <span>Displaying <strong className="text-[#3ecf8e]">{filteredBParties.length}</strong> mutual contacts</span>
                <span>Click any row to inspect timeline and location breakdown</span>
              </div>

              <div className="space-y-2.5">
                {filteredBParties.map((item) => {
                  const isSelected = selectedBParty?.bParty === item.bParty;
                  const overlapPercent = Math.round((item.targetsCount / files.length) * 100);

                  return (
                    <div
                      key={item.bParty}
                      onClick={() => setSelectedBParty(item)}
                      className={`group p-4 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden ${
                        isSelected
                          ? 'bg-[#1b221e] border-[#3ecf8e]/50 shadow-[0_0_20px_rgba(62,207,142,0.15)] ring-1 ring-[#3ecf8e]/30'
                          : 'bg-[#161618] hover:bg-[#1b1b1e] border-[#27272a] hover:border-gray-600'
                      }`}
                    >
                      {/* Left color bar indicating high overlap */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                        item.targetsCount === files.length 
                          ? 'bg-amber-400' 
                          : item.targetsCount >= 3 
                            ? 'bg-[#3ecf8e]' 
                            : 'bg-blue-500'
                      }`} />

                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pl-2">
                        {/* Number & Carrier details */}
                        <div className="space-y-1.5 min-w-[220px]">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm sm:text-base font-bold text-gray-100 tracking-wide select-all">
                              {item.bParty}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyNumber(item.bParty);
                              }}
                              className="p-1 hover:bg-[#2e2e2e] rounded text-gray-500 hover:text-gray-300 transition-colors"
                              title="Copy number"
                            >
                              {copiedNumber === item.bParty ? (
                                <Check className="h-3.5 w-3.5 text-[#3ecf8e]" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border font-mono ${item.carrier.bg} ${item.carrier.color} ${item.carrier.border}`}>
                              {item.carrier.name}
                            </span>
                          </div>

                          {/* Overlap indicator progress bar */}
                          <div className="flex items-center gap-2 max-w-xs">
                            <div className="flex-1 h-1.5 bg-[#252528] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  item.targetsCount === files.length ? 'bg-amber-400' : 'bg-[#3ecf8e]'
                                }`}
                                style={{ width: `${overlapPercent}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-gray-400 font-bold shrink-0">
                              {item.targetsCount} / {files.length} Targets ({overlapPercent}%)
                            </span>
                          </div>
                        </div>

                        {/* Shared Targets Badges */}
                        <div className="flex-1 flex flex-wrap items-center gap-1.5">
                          {item.targetBreakdowns.map((tb) => {
                            const colors = targetColorMap.get(tb.fileId) || TARGET_COLORS[0];
                            return (
                              <div
                                key={tb.fileId}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-medium ${colors.bg} ${colors.text} ${colors.border}`}
                                title={`Target ${tb.targetPhone} (${tb.targetCategory}): ${tb.callCount} calls, ${tb.smsCount} SMS`}
                              >
                                <Smartphone className="h-3 w-3 shrink-0 opacity-70" />
                                <span className="font-bold">{tb.targetPhone}</span>
                                <span className="text-[10px] opacity-70 font-sans">
                                  ({tb.callCount + tb.smsCount})
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Summary Metrics */}
                        <div className="flex items-center gap-4 text-right shrink-0">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs text-gray-300 font-mono font-bold">
                              <Phone className="h-3 w-3 text-emerald-400" />
                              <span>{item.totalCalls} Calls</span>
                              {item.totalDuration > 0 && (
                                <span className="text-gray-500 font-normal">({formatDuration(item.totalDuration)})</span>
                              )}
                            </div>
                            {item.totalSms > 0 && (
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono justify-end">
                                <MessageSquare className="h-3 w-3 text-sky-400" />
                                <span>{item.totalSms} SMS</span>
                              </div>
                            )}
                          </div>

                          <div className="hidden md:block text-right text-[10px] font-mono text-gray-500 space-y-0.5 min-w-[90px]">
                            <span>Last active:</span>
                            <p className="text-gray-400 font-medium">
                              {new Date(item.lastTimestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </p>
                          </div>

                          <ChevronRight className={`h-4 w-4 text-gray-500 transition-transform group-hover:translate-x-1 ${
                            isSelected ? 'text-[#3ecf8e] rotate-90' : ''
                          }`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Detailed Inspection Drawer (Right Side) */}
            {selectedBParty && (
              <aside className="w-full lg:w-[460px] border-l border-[#2e2e2e] bg-[#141416] flex flex-col h-full overflow-hidden animate-in slide-in-from-right-4 duration-200">
                {/* Drawer Header */}
                <div className="p-4 border-b border-[#2e2e2e] bg-[#171719] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 flex items-center justify-center">
                      <Share2 className="h-4 w-4 text-[#3ecf8e]" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wide">
                        Target Cross-Nexus
                      </h3>
                      <span className="text-[10px] font-mono text-gray-500">
                        Mutual Contacts Forensic Detail
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedBParty(null)}
                    className="p-1 text-gray-500 hover:text-gray-200 hover:bg-[#252528] rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Drawer Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5 text-left">
                  
                  {/* B-Party Highlight Card */}
                  <div className="p-4 bg-[#1a1a1d] border border-[#2e2e2e] rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-wider">
                        Common B-Party
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border font-mono ${selectedBParty.carrier.bg} ${selectedBParty.carrier.color} ${selectedBParty.carrier.border}`}>
                        {selectedBParty.carrier.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-mono font-black text-white select-all">
                        {selectedBParty.bParty}
                      </span>
                      <button
                        onClick={() => handleCopyNumber(selectedBParty.bParty)}
                        className="flex items-center gap-1 text-xs text-[#3ecf8e] hover:underline font-medium cursor-pointer"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#27272a] text-center font-mono">
                      <div className="p-2 bg-[#141416] rounded-xl">
                        <span className="text-[9px] text-gray-500 block uppercase font-bold">Targets</span>
                        <span className="text-sm font-bold text-[#3ecf8e]">{selectedBParty.targetsCount}</span>
                      </div>
                      <div className="p-2 bg-[#141416] rounded-xl">
                        <span className="text-[9px] text-gray-500 block uppercase font-bold">Total Calls</span>
                        <span className="text-sm font-bold text-gray-200">{selectedBParty.totalCalls}</span>
                      </div>
                      <div className="p-2 bg-[#141416] rounded-xl">
                        <span className="text-[9px] text-gray-500 block uppercase font-bold">Total SMS</span>
                        <span className="text-sm font-bold text-gray-200">{selectedBParty.totalSms}</span>
                      </div>
                    </div>
                  </div>

                  {/* Target-by-Target Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                      <Smartphone className="h-3.5 w-3.5 text-[#3ecf8e]" />
                      <span>Target Interaction Breakdown ({selectedBParty.targetBreakdowns.length})</span>
                    </h4>

                    <div className="space-y-2.5">
                      {selectedBParty.targetBreakdowns.map((tb) => {
                        const colors = targetColorMap.get(tb.fileId) || TARGET_COLORS[0];
                        return (
                          <div
                            key={tb.fileId}
                            className="p-3.5 bg-[#1a1a1d] border border-[#27272a] rounded-xl space-y-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
                                  {tb.targetPhone}
                                </span>
                                <span className="text-[10px] text-gray-400 font-sans">
                                  {tb.targetCategory} · {tb.targetOwner}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-gray-300">
                                {tb.callCount + tb.smsCount} events
                              </span>
                            </div>

                            {/* Metrics for this target */}
                            <div className="flex items-center justify-between text-xs font-mono text-gray-400 pt-1">
                              <span>Calls: <strong className="text-gray-200">{tb.callCount}</strong> ({formatDuration(tb.totalDuration)})</span>
                              <span>SMS: <strong className="text-gray-200">{tb.smsCount}</strong></span>
                            </div>

                            {/* Date range */}
                            <div className="text-[10px] font-mono text-gray-500 pt-1 border-t border-[#232326] flex items-center justify-between">
                              <span>First: {new Date(tb.firstTime).toLocaleDateString()}</span>
                              <span>Last: {new Date(tb.lastTime).toLocaleDateString()}</span>
                            </div>

                            {/* Visited Towers */}
                            {tb.locations.size > 0 && (
                              <div className="text-[10px] font-sans text-gray-400 pt-1">
                                <span className="text-gray-500 font-mono block text-[9px] uppercase font-bold">
                                  Towers / Locations visited with this contact:
                                </span>
                                <div className="space-y-1 mt-1 max-h-20 overflow-y-auto custom-scrollbar">
                                  {Array.from(tb.locations).slice(0, 3).map((loc, idx) => (
                                    <p key={idx} className="text-gray-300 truncate font-mono text-[10px] bg-[#141416] px-2 py-0.5 rounded">
                                      📍 {loc}
                                    </p>
                                  ))}
                                  {tb.locations.size > 3 && (
                                    <span className="text-[9px] text-gray-500 font-mono italic block">
                                      + {tb.locations.size - 3} more tower locations
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Unified Chronological Interaction Feed */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-blue-400" />
                      <span>Unified Interaction Sequence ({selectedBParty.allRecords.length})</span>
                    </h4>

                    <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                      {selectedBParty.allRecords.map((rec, i) => {
                        const file = fileMap.get(rec.fileId);
                        const isSms = rec.usageType?.toUpperCase().includes('SMS');
                        const colors = targetColorMap.get(rec.fileId) || TARGET_COLORS[0];

                        return (
                          <div
                            key={i}
                            className="p-2.5 bg-[#171719] border border-[#27272a] rounded-xl flex items-start gap-2.5 text-xs font-mono"
                          >
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 mt-0.5 ${colors.bg} ${colors.text} border ${colors.border}`}>
                              {file?.phoneNumber ? file.phoneNumber.slice(-5) : 'Target'}
                            </span>

                            <div className="flex-1 min-w-0 space-y-0.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className={`font-bold ${isSms ? 'text-sky-400' : 'text-emerald-400'}`}>
                                  {rec.usageType || 'CALL'}
                                </span>
                                <span className="text-[10px] text-gray-500 font-normal">
                                  {new Date(rec.timestamp).toLocaleString(undefined, {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                  })}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-gray-400">
                                <span>Duration: {formatDuration(rec.duration || 0)}</span>
                                {rec.lac && rec.cellId && (
                                  <span className="text-gray-500">LAC: {rec.lac} · CID: {rec.cellId}</span>
                                )}
                              </div>

                              {rec.address && (
                                <p className="text-[10px] text-gray-400 font-sans truncate" title={rec.address}>
                                  📍 {rec.address}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </aside>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
