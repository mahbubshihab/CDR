import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { type Case } from '../../../../utils/db';
import { useCaseData } from '../../hooks/useCaseData';

interface SearchCDRLogsProps {
  activeCase: Case;
}

export const SearchCDRLogs: React.FC<SearchCDRLogsProps> = ({ activeCase }) => {
  const { files, records, loading } = useCaseData(activeCase.id);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const lowerSearch = searchTerm.toLowerCase();
    return records.filter(rec => {
      // Also match against the file name if we can
      const file = files.find(f => f.id === rec.fileId);
      const fileMatch = file && (file.phoneNumber.includes(lowerSearch) || file.fileName.toLowerCase().includes(lowerSearch));
      
      return fileMatch || Object.values(rec).some(val => 
        val !== null && val !== undefined && String(val).toLowerCase().includes(lowerSearch)
      );
    });
  }, [records, files, searchTerm]);

  // Create a fast lookup for target phones by fileId
  const targetMap = useMemo(() => {
    const map = new Map<number, string>();
    files.forEach(f => {
      if (f.id) map.set(f.id, f.phoneNumber);
    });
    return map;
  }, [files]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#121212]">
        <div className="text-gray-400 font-mono text-sm animate-pulse">Loading case logs...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden flex flex-col text-left animate-in fade-in duration-300 bg-[#121212]">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-200">Global CDR Search</h3>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Searching across <strong className="text-[#3ecf8e]">{files.length}</strong> targets and <strong className="text-[#3ecf8e]">{records.length}</strong> total records in case: {activeCase.title}
          </p>
        </div>

        <div className="relative shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search records, targets, or towers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 bg-[#1a1a1a] border border-[#2e2e2e] text-gray-200 text-xs rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-[#3ecf8e]/50 focus:ring-1 focus:ring-[#3ecf8e]/50 transition-colors font-mono"
          />
        </div>
      </div>
      
      <div className="flex-1 min-h-0 bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar text-xs">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#171717] border-b border-[#2e2e2e] text-gray-400 uppercase font-semibold tracking-wider text-[10px]">
                <th className="py-2.5 px-4 whitespace-nowrap">Target (A-Party)</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Time</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Carrier</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Other Party (B-Party)</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Duration</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Type</th>
                <th className="py-2.5 px-4 whitespace-nowrap">LAC</th>
                <th className="py-2.5 px-4 whitespace-nowrap">CI (Cell ID)</th>
                <th className="py-2.5 px-4 whitespace-nowrap">IMEI</th>
                <th className="py-2.5 px-4 whitespace-nowrap">IMSI</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Cell tower Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e2e]/50 font-mono text-[11px]">
              {filteredRecords.slice(0, 200).map((rec, idx) => (
                <tr key={idx} className="hover:bg-[#171717]/30 transition-colors">
                  <td className="py-2.5 px-4 text-emerald-400 font-semibold">{rec.fileId ? targetMap.get(rec.fileId) || 'Unknown' : 'Unknown'}</td>
                  <td className="py-2.5 px-4 text-gray-300 truncate max-w-[120px]">{new Date(rec.timestamp * 1000).toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-gray-300">{rec.provider || '—'}</td>
                  <td className="py-2.5 px-4 text-[#3ecf8e] font-semibold">{rec.otherParty}</td>
                  <td className="py-2.5 px-4 text-gray-300">{rec.duration}s</td>
                  <td className="py-2.5 px-4">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      rec.usageType?.toLowerCase() === 'moc' ? 'bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/20' :
                      rec.usageType?.toLowerCase() === 'mtc' ? 'bg-orange-950/20 text-orange-400 border border-orange-800/20' :
                      'bg-emerald-950/20 text-emerald-400 border border-emerald-800/20'
                    }`}>
                      {rec.usageType || '—'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-gray-300">{rec.lac !== undefined ? rec.lac : '—'}</td>
                  <td className="py-2.5 px-4 text-gray-300">{rec.cellId !== undefined ? rec.cellId : '—'}</td>
                  <td className="py-2.5 px-4 text-gray-300">{rec.imei || '—'}</td>
                  <td className="py-2.5 px-4 text-gray-300">{rec.imsi || '—'}</td>
                  <td className="py-2.5 px-4 text-gray-300 truncate max-w-[200px]" title={rec.address}>{rec.address || '—'}</td>
                </tr>
              ))}
              
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-gray-500">
                    No records found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredRecords.length > 200 && (
            <div className="p-3 text-center bg-[#171717]/40 text-gray-450 border-t border-[#2e2e2e] font-semibold">
              Showing first 200 of {filteredRecords.length} logs. Please refine your search query for more specific results.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
