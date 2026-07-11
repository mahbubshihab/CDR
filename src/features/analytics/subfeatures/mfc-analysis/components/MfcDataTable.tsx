import React, { useState } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight, PhoneCall, PhoneForwarded, MessageSquare, ArrowRightSquare } from 'lucide-react';
import type { BPartyStats } from '../types';

interface MfcDataTableProps {
  data: BPartyStats[];
}

export const MfcDataTable: React.FC<MfcDataTableProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter(d => 
      d.bNumber.toLowerCase().includes(lower) ||
      d.operator.toLowerCase().includes(lower) ||
      d.country.toLowerCase().includes(lower)
    );
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const formatDuration = (seconds: number) => {
    if (!seconds) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const Th = ({ children, align = 'left', w }: { children: React.ReactNode, align?: 'left'|'center'|'right', w?: string }) => (
    <th className={`py-3 px-3 border-b border-[#2e2e2e] font-semibold text-[10px] tracking-wider uppercase ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'} ${w ? w : ''}`}>
      {children}
    </th>
  );

  const Td = ({ children, align = 'left', bold = false, color = 'text-gray-300' }: { children: React.ReactNode, align?: 'left'|'center'|'right', bold?: boolean, color?: string }) => (
    <td className={`py-3 px-3 whitespace-nowrap ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'} ${bold ? 'font-bold' : 'font-medium'} ${color}`}>
      {children}
    </td>
  );

  return (
    <div className="bg-[#171717] border border-[#2e2e2e] rounded-xl flex flex-col font-mono text-[11px] overflow-hidden">
      {/* Table Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#2e2e2e] bg-[#1a1a1a]/50">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search number or operator..."
            className="bg-[#121212] border border-[#2e2e2e] rounded pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#3b82f6] w-64 placeholder-gray-600 transition-colors"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-[#121212] border border-[#2e2e2e] hover:bg-[#2e2e2e] transition-colors rounded text-gray-300">
          Columns <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#121212] text-gray-400">
              <Th align="center" w="w-12">Rank</Th>
              <Th>B-Party Number</Th>
              <Th>Type</Th>
              <Th>Operator</Th>
              <Th align="center">Country</Th>
              <Th align="right">Total</Th>
              <Th align="right">In Calls</Th>
              <Th align="right">Out Calls</Th>
              <Th align="right">In SMS</Th>
              <Th align="right">Out SMS</Th>
              <Th align="right">Total Min</Th>
              <Th align="right">Total Hrs</Th>
              <Th align="right">Avg Dur</Th>
              <Th align="right">Longest</Th>
              <Th align="right">Shortest</Th>
              <Th align="center">First Date</Th>
              <Th align="center">First Time</Th>
              <Th align="center">Last Date</Th>
              <Th align="center">Last Time</Th>
              <Th align="center">Active Days</Th>
              <Th align="center">Locations</Th>
              <Th align="center">IMEIs</Th>
              <Th align="right">Freq Score</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e2e]/40">
            {currentData.map((row, idx) => {
              const rank = (page - 1) * itemsPerPage + idx + 1;
              const isHighFreq = row.freqScore > 50;
              
              return (
                <tr key={row.bNumber} className="hover:bg-[#1a1a1a] transition-colors group">
                  <Td align="center" color="text-gray-500">{rank}</Td>
                  <Td color="text-[#3b82f6]" bold>{row.bNumber}</Td>
                  <Td color="text-gray-400">{row.type}</Td>
                  <Td color="text-gray-300">{row.operator}</Td>
                  <Td align="center" color="text-gray-400">{row.country}</Td>
                  
                  <Td align="right" bold color="text-white">{row.totalActivities}</Td>
                  
                  <Td align="right" color="text-gray-400">
                    <span className="flex items-center justify-end gap-1.5">
                      <PhoneCall className="h-3 w-3 text-green-500" />
                      {row.inCalls}
                    </span>
                  </Td>
                  <Td align="right" color="text-gray-400">
                    <span className="flex items-center justify-end gap-1.5">
                      <PhoneForwarded className="h-3 w-3 text-blue-500" />
                      {row.outCalls}
                    </span>
                  </Td>
                  <Td align="right" color="text-gray-400">
                    <span className="flex items-center justify-end gap-1.5">
                      <MessageSquare className="h-3 w-3 text-emerald-500" />
                      {row.inSms}
                    </span>
                  </Td>
                  <Td align="right" color="text-gray-400">
                    <span className="flex items-center justify-end gap-1.5">
                      <ArrowRightSquare className="h-3 w-3 text-indigo-500" />
                      {row.outSms}
                    </span>
                  </Td>
                  
                  <Td align="right">{Math.round(row.totalDurationSeconds / 60)}</Td>
                  <Td align="right" color="text-gray-400">{(row.totalDurationSeconds / 3600).toFixed(2)}</Td>
                  
                  <Td align="right">{formatDuration(Math.round(row.totalDurationSeconds / Math.max(row.inCalls + row.outCalls, 1)))}</Td>
                  <Td align="right" color="text-gray-400">{formatDuration(row.longestDurationSeconds)}</Td>
                  <Td align="right" color="text-gray-400">{formatDuration(row.shortestDurationSeconds)}</Td>
                  
                  <Td align="center" color="text-gray-400">{row.firstDate}</Td>
                  <Td align="center" color="text-gray-500">{row.firstTime}</Td>
                  <Td align="center" color="text-gray-400">{row.lastDate}</Td>
                  <Td align="center" color="text-gray-500">{row.lastTime}</Td>
                  
                  <Td align="center">{row.activeDays}</Td>
                  <Td align="center">{row.locations}</Td>
                  <Td align="center">{row.imeis}</Td>
                  
                  <Td align="right" bold color={isHighFreq ? 'text-red-500' : 'text-gray-300'}>
                    {row.freqScore.toFixed(0)}%
                  </Td>
                </tr>
              );
            })}
            
            {currentData.length === 0 && (
              <tr>
                <td colSpan={23} className="py-8 text-center text-gray-500 font-sans text-sm">
                  No records found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-[#2e2e2e] bg-[#1a1a1a]/50 flex items-center justify-between text-xs text-gray-400">
        <div>
          Showing {currentData.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} to {Math.min(page * itemsPerPage, filteredData.length)} of {filteredData.length} entries
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-2.5 py-1 bg-[#121212] border border-[#2e2e2e] rounded hover:bg-[#2e2e2e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <ChevronLeft className="h-3 w-3" /> Prev
          </button>
          
          <span className="px-2">Page {page} / {totalPages || 1}</span>
          
          <button 
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1 bg-[#121212] border border-[#2e2e2e] rounded hover:bg-[#2e2e2e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            Next <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
