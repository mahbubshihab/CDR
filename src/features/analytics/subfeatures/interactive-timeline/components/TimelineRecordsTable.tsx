import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { type CDRRecord } from '../../../../utils/db';

interface TimelineRecordsTableProps {
  records: CDRRecord[];
  total: number;
}

export const TimelineRecordsTable: React.FC<TimelineRecordsTableProps> = ({ records, total }) => {
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
    <div className="bg-[#121212] border border-[#2e2e2e] rounded-lg overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-3 bg-[#171717] border-b border-[#2e2e2e] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          Timeline Records ({Math.min(rowsPerPage, sortedRecords.length)} shown / {total} total)
        </h3>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-[#1c1c1c] border border-[#3e3e3e] rounded pl-8 pr-4 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 w-64"
            />
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2" />
          </div>
          <button className="px-3 py-1.5 bg-[#1c1c1c] border border-[#3e3e3e] hover:bg-[#2e2e2e] rounded text-xs text-gray-300 font-medium transition-colors">
            Columns
          </button>
          <span className="text-xs text-gray-500">{rowsPerPage} rows</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#2e2e2e]">
          <thead className="bg-[#171717]">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Yr</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Mth</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Hr</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Min</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Call Type</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">B Party</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e2e] bg-[#121212]">
            {currentRecords.map((r, i) => {
              const d = new Date(r.timestamp);
              return (
                <tr key={i} className="hover:bg-[#1c1c1c]/80 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-gray-300 whitespace-nowrap">{d.getFullYear()}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-300 whitespace-nowrap">{d.toLocaleString('default', { month: 'short' })}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-300 whitespace-nowrap">{d.getDate()}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-300 whitespace-nowrap">{d.getHours()}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-300 whitespace-nowrap">{d.getMinutes()}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-300 whitespace-nowrap">{r.usageType || 'N/A'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-300 whitespace-nowrap">{r.otherParty || 'N/A'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-300 whitespace-nowrap">{r.address || 'N/A'}</td>
                </tr>
              );
            })}
            {currentRecords.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                  No records match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 bg-[#171717] border-t border-[#2e2e2e] flex items-center justify-center gap-4">
        <button 
          onClick={handlePrev} 
          disabled={page === 1}
          className="px-4 py-1.5 bg-[#1c1c1c] border border-[#3e3e3e] hover:bg-[#2e2e2e] rounded text-xs text-gray-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Prev
        </button>
        <span className="text-xs text-gray-400">Page {page} / {totalPages}</span>
        <button 
          onClick={handleNext} 
          disabled={page === totalPages}
          className="px-4 py-1.5 bg-[#1c1c1c] border border-[#3e3e3e] hover:bg-[#2e2e2e] rounded text-xs text-gray-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
};
