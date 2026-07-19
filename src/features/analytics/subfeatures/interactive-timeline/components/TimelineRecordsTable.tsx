import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { type CDRRecord } from '../../../../../utils/db';

export const TimelineRecordsTable: React.FC<any> = ({ records, total }) => {
  const [page, setPage] = useState(1);
  const rowsPerPage = 2000;
  
  const sortedRecords = [...records].sort((a, b) => a.timestamp - b.timestamp);
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / rowsPerPage));
  const currentRecords = sortedRecords.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handlePrev = () => {
    if (page > 1) setPage(p => p - 1);
  };
  
  const handleNext = () => {
    if (page < totalPages) setPage(p => p + 1);
  };

  return (
    <div className="bg-[#121212] border border-[#2e2e2e] rounded-md overflow-hidden flex flex-col shadow-sm">
      <div className="px-4 py-3 bg-[#121212] border-b border-[#2e2e2e] flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">
          Timeline Records ({Math.min(rowsPerPage, sortedRecords.length)} shown / {total} total)
        </h3>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-[#1c1c1c] border border-[#2e2e2e] rounded pl-7 pr-3 py-1.5 text-[11px] text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-500 w-48"
            />
            <Search className="w-3 h-3 text-gray-500 absolute left-2.5 top-2" />
          </div>
          <button className="px-3 py-1.5 bg-[#1c1c1c] border border-[#2e2e2e] hover:bg-[#2e2e2e] rounded text-[11px] text-gray-300 font-medium transition-colors cursor-pointer">
            Columns
          </button>
          <span className="text-[11px] text-gray-500">{rowsPerPage} rows</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#2e2e2e]">
          <thead className="bg-[#1c1c1c]">
            <tr>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-300">Yr</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-300">Mth</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-300">Date</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-300">Hr</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-300">Min</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-300">Call Type</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-300">B Party</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-300">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e2e] bg-[#121212]">
            {currentRecords.map((r, i) => {
              const d = new Date(r.timestamp);
              return (
                <tr key={i} className="hover:bg-[#1c1c1c] transition-colors font-mono">
                  <td className="px-4 py-2 text-[11px] text-gray-300 whitespace-nowrap">{d.getFullYear()}</td>
                  <td className="px-4 py-2 text-[11px] text-gray-300 whitespace-nowrap">{d.toLocaleString('default', { month: 'short' })}</td>
                  <td className="px-4 py-2 text-[11px] text-gray-300 whitespace-nowrap">{d.getDate()}</td>
                  <td className="px-4 py-2 text-[11px] text-gray-300 whitespace-nowrap">{d.getHours()}</td>
                  <td className="px-4 py-2 text-[11px] text-gray-300 whitespace-nowrap">{d.getMinutes()}</td>
                  <td className="px-4 py-2 text-[11px] text-gray-300 whitespace-nowrap font-sans">{r.usageType || 'N/A'}</td>
                  <td className="px-4 py-2 text-[11px] text-gray-300 whitespace-nowrap">{r.otherParty || 'N/A'}</td>
                  <td className="px-4 py-2 text-[11px] text-gray-300 whitespace-nowrap font-sans">{r.address || 'N/A'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-2.5 bg-[#1c1c1c] border-t border-[#2e2e2e] flex items-center justify-center gap-4">
        <button 
          onClick={handlePrev} 
          disabled={page === 1}
          className="px-3 py-1 bg-[#121212] border border-[#2e2e2e] hover:bg-[#2e2e2e] rounded text-[11px] text-gray-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Prev
        </button>
        <span className="text-[11px] text-gray-400">Page {page} / {totalPages}</span>
        <button 
          onClick={handleNext} 
          disabled={page === totalPages}
          className="px-3 py-1 bg-[#121212] border border-[#2e2e2e] hover:bg-[#2e2e2e] rounded text-[11px] text-gray-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
};
