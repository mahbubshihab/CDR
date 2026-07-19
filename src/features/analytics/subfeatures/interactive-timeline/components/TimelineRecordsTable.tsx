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
    <div className="bg-[#131f37] border border-slate-700/60 rounded-md overflow-hidden flex flex-col shadow-sm">
      <div className="px-4 py-3 bg-[#131f37] border-b border-slate-700/60 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">
          Timeline Records ({Math.min(rowsPerPage, sortedRecords.length)} shown / {total} total)
        </h3>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-[#0a1120] border border-slate-700 rounded pl-7 pr-3 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48"
            />
            <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2" />
          </div>
          <button className="px-3 py-1.5 bg-[#0a1120] border border-slate-700 hover:bg-slate-800 rounded text-[11px] text-slate-300 font-medium transition-colors">
            Columns
          </button>
          <span className="text-[11px] text-slate-500">{rowsPerPage} rows</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700/60">
          <thead className="bg-[#0a1120]">
            <tr>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-300">Yr</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-300">Mth</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-300">Date</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-300">Hr</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-300">Min</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-300">Call Type</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-300">B Party</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-300">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50 bg-[#131f37]">
            {currentRecords.map((r, i) => {
              const d = new Date(r.timestamp);
              return (
                <tr key={i} className="hover:bg-[#1e293b] transition-colors font-mono">
                  <td className="px-4 py-2 text-[11px] text-slate-300 whitespace-nowrap">{d.getFullYear()}</td>
                  <td className="px-4 py-2 text-[11px] text-slate-300 whitespace-nowrap">{d.toLocaleString('default', { month: 'short' })}</td>
                  <td className="px-4 py-2 text-[11px] text-slate-300 whitespace-nowrap">{d.getDate()}</td>
                  <td className="px-4 py-2 text-[11px] text-slate-300 whitespace-nowrap">{d.getHours()}</td>
                  <td className="px-4 py-2 text-[11px] text-slate-300 whitespace-nowrap">{d.getMinutes()}</td>
                  <td className="px-4 py-2 text-[11px] text-slate-300 whitespace-nowrap font-sans">{r.usageType || 'N/A'}</td>
                  <td className="px-4 py-2 text-[11px] text-slate-300 whitespace-nowrap">{r.otherParty || 'N/A'}</td>
                  <td className="px-4 py-2 text-[11px] text-slate-300 whitespace-nowrap font-sans">{r.address || 'N/A'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-2.5 bg-[#0a1120] border-t border-slate-700/60 flex items-center justify-center gap-4">
        <button 
          onClick={handlePrev} 
          disabled={page === 1}
          className="px-3 py-1 bg-[#131f37] border border-slate-700 hover:bg-slate-700 rounded text-[11px] text-slate-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Prev
        </button>
        <span className="text-[11px] text-slate-400">Page {page} / {totalPages}</span>
        <button 
          onClick={handleNext} 
          disabled={page === totalPages}
          className="px-3 py-1 bg-[#131f37] border border-slate-700 hover:bg-slate-700 rounded text-[11px] text-slate-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
};
