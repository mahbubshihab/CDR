import React, { useMemo, useState } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { Search } from 'lucide-react';

interface LocationSummaryProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

interface LocationSummaryData {
  location: string;
  activity: number;
  visits: number;
  firstTimestamp: number;
  lastTimestamp: number;
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

export const LocationSummary: React.FC<LocationSummaryProps> = ({ records }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  const data = useMemo(() => {
    const map = new Map<string, LocationSummaryData>();

    for (const r of records) {
      if (!r.address || r.address.trim() === '') continue;

      const loc = r.address;
      const ts = r.timestamp || 0;

      if (!map.has(loc)) {
        map.set(loc, {
          location: loc,
          activity: 1,
          visits: 1,
          firstTimestamp: ts,
          lastTimestamp: ts
        });
      } else {
        const existing = map.get(loc)!;
        existing.activity += 1;
        existing.visits += 1;
        
        // Update first
        if (ts < existing.firstTimestamp) {
          existing.firstTimestamp = ts;
        }
        // Update last
        if (ts > existing.lastTimestamp) {
          existing.lastTimestamp = ts;
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.activity - a.activity);
  }, [records]);

  const filteredData = data.filter(d => 
    d.location.toLowerCase().includes(searchTerm.toLowerCase())
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
                <th className="p-3 text-gray-400 font-semibold">Location</th>
                <th className="p-3 text-gray-400 font-semibold w-24">Activity</th>
                <th className="p-3 text-gray-400 font-semibold w-24">Visits</th>
                <th className="p-3 text-gray-400 font-semibold w-48">First</th>
                <th className="p-3 text-gray-400 font-semibold w-48">Last</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e2e]">
              {currentData.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#121212]/50 text-gray-300">
                  <td className="p-3 font-semibold text-gray-200 truncate max-w-lg">{row.location}</td>
                  <td className="p-3 font-mono">{row.activity}</td>
                  <td className="p-3 font-mono">{row.visits}</td>
                  <td className="p-3 font-mono">{formatDate(row.firstTimestamp)}</td>
                  <td className="p-3 font-mono">{formatDate(row.lastTimestamp)}</td>
                </tr>
              ))}
              {currentData.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No locations found</td>
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
