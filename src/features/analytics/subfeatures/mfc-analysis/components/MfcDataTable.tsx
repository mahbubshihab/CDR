import React, { useState } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight, PhoneCall, PhoneForwarded, MessageSquare, ArrowRightSquare } from 'lucide-react';
import type { BPartyStats } from '../types';

interface MfcDataTableProps {
  data: BPartyStats[];
}

export const MfcDataTable: React.FC<MfcDataTableProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const itemsPerPage = 15;

  const allColumns = [
    'Rank', 'B-Party Number', 'Type', 'Operator', 'Country', 'Total',
    'In Calls', 'Out Calls', 'Total SMS', 'Total Min', 'Total Hrs',
    'Avg Dur', 'Longest', 'Shortest', 'First Date', 'First Time', 'Last Date',
    'Last Time', 'Active Days', 'Locations', 'IMEIs', 'Freq Score'
  ];

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    allColumns.reduce((acc, col) => ({ ...acc, [col]: true }), {})
  );

  const toggleColumn = (col: string) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

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

  const Th = ({ children, align = 'left', w, colName }: { children: React.ReactNode, align?: 'left'|'center'|'right', w?: string, colName: string }) => {
    if (!visibleColumns[colName]) return null;
    return (
      <th className={`py-3 px-3 border-b border-[#2e2e2e] font-semibold text-[10px] tracking-wider uppercase ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'} ${w ? w : ''}`}>
        {children}
      </th>
    );
  };

  const Td = ({ children, align = 'left', bold = false, color = 'text-gray-300', colName }: { children: React.ReactNode, align?: 'left'|'center'|'right', bold?: boolean, color?: string, colName: string }) => {
    if (!visibleColumns[colName]) return null;
    return (
      <td className={`py-3 px-3 whitespace-nowrap ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'} ${bold ? 'font-bold' : 'font-medium'} ${color}`}>
        {children}
      </td>
    );
  };

  const renderTableHeaders = () => (
    <tr className="bg-[#121212] text-gray-400">
      <Th align="center" w="w-12" colName="Rank">Rank</Th>
      <Th colName="B-Party Number">B-Party Number</Th>
      <Th colName="Type">Type</Th>
      <Th colName="Operator">Operator</Th>
      <Th align="center" colName="Country">Country</Th>
      <Th align="right" colName="Total">Total</Th>
      <Th align="right" colName="In Calls">In Calls</Th>
      <Th align="right" colName="Out Calls">Out Calls</Th>
      <Th align="right" colName="Total SMS">Total SMS</Th>
      <Th align="right" colName="Total Min">Total Min</Th>
      <Th align="right" colName="Total Hrs">Total Hrs</Th>
      <Th align="right" colName="Avg Dur">Avg Dur</Th>
      <Th align="right" colName="Longest">Longest</Th>
      <Th align="right" colName="Shortest">Shortest</Th>
      <Th align="center" colName="First Date">First Date</Th>
      <Th align="center" colName="First Time">First Time</Th>
      <Th align="center" colName="Last Date">Last Date</Th>
      <Th align="center" colName="Last Time">Last Time</Th>
      <Th align="center" colName="Active Days">Active Days</Th>
      <Th align="center" colName="Locations">Locations</Th>
      <Th align="center" colName="IMEIs">IMEIs</Th>
      <Th align="right" colName="Freq Score">Freq Score</Th>
    </tr>
  );

  const renderRow = (row: BPartyStats, idx: number, isPrint = false) => {
    const rank = isPrint ? idx + 1 : (page - 1) * itemsPerPage + idx + 1;
    const isHighFreq = row.freqScore > 50;
    
    return (
      <tr key={`${isPrint ? 'p-' : ''}${row.bNumber}`} className="hover:bg-[#1a1a1a] transition-colors group">
        <Td align="center" color="text-gray-500" colName="Rank">{rank}</Td>
        <Td color="text-[#3b82f6]" bold colName="B-Party Number">{row.bNumber}</Td>
        <Td color="text-gray-400" colName="Type">{row.type}</Td>
        <Td color="text-gray-300" colName="Operator">{row.operator}</Td>
        <Td align="center" color="text-gray-400" colName="Country">{row.country}</Td>
        
        <Td align="right" bold color="text-white" colName="Total">{row.totalActivities}</Td>
        
        <Td align="right" color="text-gray-400" colName="In Calls">
          <span className="flex items-center justify-end gap-1.5">
            <PhoneCall className="h-3 w-3 text-green-500 print:text-green-700" />
            {row.inCalls}
          </span>
        </Td>
        <Td align="right" color="text-gray-400" colName="Out Calls">
          <span className="flex items-center justify-end gap-1.5">
            <PhoneForwarded className="h-3 w-3 text-blue-500 print:text-blue-700" />
            {row.outCalls}
          </span>
        </Td>
        <Td align="right" color="text-gray-400" colName="Total SMS">
          <span className="flex items-center justify-end gap-1.5">
            <MessageSquare className="h-3 w-3 text-emerald-500 print:text-emerald-700" />
            {row.totalSms}
          </span>
        </Td>
        
        <Td align="right" colName="Total Min">{Math.round(row.totalDurationSeconds / 60)}</Td>
        <Td align="right" color="text-gray-400" colName="Total Hrs">{(row.totalDurationSeconds / 3600).toFixed(2)}</Td>
        
        <Td align="right" colName="Avg Dur">{formatDuration(Math.round(row.totalDurationSeconds / Math.max(row.inCalls + row.outCalls, 1)))}</Td>
        <Td align="right" color="text-gray-400" colName="Longest">{formatDuration(row.longestDurationSeconds)}</Td>
        <Td align="right" color="text-gray-400" colName="Shortest">{formatDuration(row.shortestDurationSeconds)}</Td>
        
        <Td align="center" color="text-gray-400" colName="First Date">{row.firstDate}</Td>
        <Td align="center" color="text-gray-500" colName="First Time">{row.firstTime}</Td>
        <Td align="center" color="text-gray-400" colName="Last Date">{row.lastDate}</Td>
        <Td align="center" color="text-gray-500" colName="Last Time">{row.lastTime}</Td>
        
        <Td align="center" colName="Active Days">{row.activeDays}</Td>
        <Td align="center" colName="Locations">{row.locations}</Td>
        <Td align="center" colName="IMEIs">{row.imeis}</Td>
        
        <Td align="right" bold color={isHighFreq ? 'text-red-500' : 'text-gray-300'} colName="Freq Score">
          {row.freqScore.toFixed(0)}%
        </Td>
      </tr>
    );
  };

  return (
    <div className="bg-[#171717] border border-[#2e2e2e] rounded-xl flex flex-col font-mono text-[11px] overflow-hidden">
      {/* Table Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#2e2e2e] bg-[#1a1a1a]/50 no-print-actions">
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
        <div className="relative">
          <button 
            onClick={() => setShowColumnsMenu(!showColumnsMenu)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#121212] border border-[#2e2e2e] hover:bg-[#2e2e2e] transition-colors rounded text-gray-300 cursor-pointer"
          >
            Columns <ChevronDown className="h-3.5 w-3.5" />
          </button>
          
          {showColumnsMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 max-h-64 overflow-y-auto custom-scrollbar bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg shadow-xl z-50 p-2">
              <div className="text-xs font-semibold text-gray-400 mb-2 px-2 uppercase tracking-wider">Toggle Columns</div>
              {allColumns.map(col => (
                <label key={col} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#2e2e2e] rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={visibleColumns[col]}
                    onChange={() => toggleColumn(col)}
                    className="w-3.5 h-3.5 rounded border-[#3e3e3e] bg-[#121212] text-[#3ecf8e] focus:ring-[#3ecf8e]/50 focus:ring-offset-[#171717] cursor-pointer"
                  />
                  <span className="text-gray-200">{col}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table Container (Screen) */}
      <div className="overflow-x-auto custom-scrollbar print:hidden">
        <table className="w-full border-collapse">
          <thead>
            {renderTableHeaders()}
          </thead>
          <tbody className="divide-y divide-[#2e2e2e]/40">
            {currentData.map((row, idx) => renderRow(row, idx))}
            
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

      {/* Table Container (Print - Shows All Rows) */}
      <div className="hidden print:block w-full">
        <table className="w-full border-collapse">
          <thead>
            {renderTableHeaders()}
          </thead>
          <tbody className="divide-y divide-[#2e2e2e]/40">
            {filteredData.map((row, idx) => renderRow(row, idx, true))}
            
            {filteredData.length === 0 && (
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
      <div className="p-3 border-t border-[#2e2e2e] bg-[#1a1a1a]/50 flex items-center justify-between text-xs text-gray-400 print:hidden">
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
