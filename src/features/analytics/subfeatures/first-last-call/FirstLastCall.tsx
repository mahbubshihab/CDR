import React, { useMemo, useState } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { Search } from 'lucide-react';
import { getBPartyOperator } from '../../../../utils/operators';

interface FirstLastCallProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

interface OtherPartySummary {
  number: string;
  operator: string;
  type: string;
  firstTimestamp: number;
  lastTimestamp: number;
  total: number;
  firstLoc: string;
  lastLoc: string;
}

function formatDate(epoch: number): string {
  if (!epoch) return 'N/A';
  const d = new Date(epoch);
  if (isNaN(d.getTime())) return 'N/A';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${h}:${m}:${s}`;
}

export const FirstLastCall: React.FC<FirstLastCallProps> = ({ records }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  const data = useMemo(() => {
    const map = new Map<string, OtherPartySummary>();

    for (const r of records) {
      if (!r.otherParty || r.otherParty.trim() === '') continue;

      const num = r.otherParty;
      const ts = r.timestamp || 0;
      const loc = r.address || 'N/A';

      if (!map.has(num)) {
        map.set(num, {
          number: num,
          operator: getBPartyOperator(num),
          type: r.usageType || 'N/A',
          firstTimestamp: ts,
          lastTimestamp: ts,
          total: 1,
          firstLoc: loc,
          lastLoc: loc,
        });
      } else {
        const existing = map.get(num)!;
        existing.total += 1;
        
        // Update first
        if (ts < existing.firstTimestamp) {
          existing.firstTimestamp = ts;
          existing.firstLoc = loc;
        }
        // Update last
        if (ts > existing.lastTimestamp) {
          existing.lastTimestamp = ts;
          existing.lastLoc = loc;
        }

        // Aggregate types if different (e.g. if we have SMS and Voice)
        if (existing.type !== r.usageType && r.usageType) {
          if (existing.type !== 'Both') {
            existing.type = 'Both';
          }
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [records]);

  const filteredData = data.filter(d => 
    d.number.includes(searchTerm) || 
    d.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.firstLoc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.lastLoc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  // Reset page when searching
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="w-full h-full bg-[#121212] overflow-y-auto p-6 space-y-6 text-left animate-in fade-in duration-300">
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl overflow-hidden flex flex-col min-h-[400px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#2e2e2e] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#121212] border border-[#2e2e2e] rounded-md pl-9 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-[#3ecf8e] w-64"
              />
            </div>
            <div className="flex items-center text-sm">
              <span className="text-gray-400 bg-[#121212] px-3 py-1.5 border border-[#2e2e2e] rounded-l-md font-medium">Columns</span>
              <span className="text-gray-500 bg-[#121212]/50 px-3 py-1.5 border border-[#2e2e2e] border-l-0 rounded-r-md">{filteredData.length} rows</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#121212] border-b border-[#2e2e2e] sticky top-0">
              <tr>
                <th className="p-3 text-gray-400 font-semibold">Number</th>
                <th className="p-3 text-gray-400 font-semibold">Operator</th>
                <th className="p-3 text-gray-400 font-semibold">Type</th>
                <th className="p-3 text-gray-400 font-semibold">First</th>
                <th className="p-3 text-gray-400 font-semibold">Last</th>
                <th className="p-3 text-gray-400 font-semibold">Total</th>
                <th className="p-3 text-gray-400 font-semibold">First Loc</th>
                <th className="p-3 text-gray-400 font-semibold">Last Loc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e2e]">
              {currentData.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#121212]/50 text-gray-300">
                  <td className="p-3 text-[#3ecf8e] font-mono font-bold select-all">{row.number}</td>
                  <td className="p-3 font-mono">{row.operator}</td>
                  <td className="p-3 font-mono">{row.type}</td>
                  <td className="p-3 font-mono">{formatDate(row.firstTimestamp)}</td>
                  <td className="p-3 font-mono">{formatDate(row.lastTimestamp)}</td>
                  <td className="p-3 font-mono text-center font-bold">{row.total}</td>
                  <td className="p-3">{row.firstLoc}</td>
                  <td className="p-3">{row.lastLoc}</td>
                </tr>
              ))}
              {currentData.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">No data found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Matches Image Layout */}
        <div className="p-3 border-t border-[#2e2e2e] bg-[#171717] flex justify-center items-center gap-4 text-xs">
          <button 
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="px-4 py-1.5 bg-[#121212] border border-[#2e2e2e] rounded-md text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1e1e1e] transition-colors"
          >
            Prev
          </button>
          <span className="text-gray-400 font-mono">
            Page {currentPage} / {Math.max(1, totalPages)}
          </span>
          <button 
            onClick={handleNext}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-4 py-1.5 bg-[#121212] border border-[#2e2e2e] rounded-md text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1e1e1e] transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
