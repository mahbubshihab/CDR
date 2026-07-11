import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import type { ImeiAnalysisRow } from '../hooks/useImeiAnalysis';

interface ImeiTableProps {
  data: ImeiAnalysisRow[];
}

export const ImeiTable: React.FC<ImeiTableProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    return data.filter(row => {
      const s = searchTerm.toLowerCase();
      return (
        row.original.toLowerCase().includes(s) ||
        row.corrected.toLowerCase().includes(s) ||
        row.tac.toLowerCase().includes(s)
      );
    });
  }, [data, searchTerm]);

  return (
    <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl overflow-hidden mt-6">
      <div className="p-4 border-b border-[#2e2e2e] flex flex-wrap gap-4 items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-300">
          {data.length} IMEI devices <span className="text-gray-500 font-normal">· full device intelligence table</span>
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search IMEI or TAC..."
              className="bg-[#121212] border border-[#333] text-sm text-gray-200 rounded-md pl-9 pr-4 py-1.5 focus:outline-none focus:border-cyan-500 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-xs text-gray-500">{filteredData.length} rows</div>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#171717] border-b border-[#2e2e2e] text-gray-400 font-semibold">
            <tr>
              <th className="py-3 px-4 font-mono">#</th>
              <th className="py-3 px-4 font-mono text-gray-300">Original IMEI</th>
              <th className="py-3 px-4">IMEI Status</th>
              <th className="py-3 px-4 font-mono text-cyan-400">Corrected IMEI</th>
              <th className="py-3 px-4 font-mono text-purple-400">TAC</th>
              <th className="py-3 px-4">Confidence</th>
              <th className="py-3 px-4 text-right">In Calls</th>
              <th className="py-3 px-4 text-right">Out Calls</th>
              <th className="py-3 px-4 text-right">In SMS</th>
              <th className="py-3 px-4 text-right">Out SMS</th>
              <th className="py-3 px-4 text-right">Total Comms</th>
              <th className="py-3 px-4 text-right">Minutes</th>
              <th className="py-3 px-4 text-right">Usage Count</th>
              <th className="py-3 px-4">First Date</th>
              <th className="py-3 px-4">First Time</th>
              <th className="py-3 px-4">Last Date</th>
              <th className="py-3 px-4">Last Time</th>
              <th className="py-3 px-4 text-right">Active Days</th>
              <th className="py-3 px-4 text-right">Numbers</th>
              <th className="py-3 px-4 text-right">Locations</th>
              <th className="py-3 px-4 text-right">Usage %</th>
              <th className="py-3 px-4 text-right">SIMs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e2e]/50 text-gray-300">
            {filteredData.length > 0 ? (
              filteredData.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#252525] transition-colors">
                  <td className="py-3 px-4 font-mono text-gray-500">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono text-gray-400">{row.original}</td>
                  <td className={`py-3 px-4 font-bold ${row.status === 'CORRECTED' ? 'text-yellow-500' : row.status === 'VALID' ? 'text-green-500' : 'text-red-500'}`}>
                    {row.status}
                  </td>
                  <td className="py-3 px-4 font-mono text-cyan-400 font-bold">{row.corrected}</td>
                  <td className="py-3 px-4 font-mono text-purple-400">{row.tac}</td>
                  <td className="py-3 px-4">{row.confidence}</td>
                  <td className="py-3 px-4 text-right">{row.inCalls}</td>
                  <td className="py-3 px-4 text-right">{row.outCalls}</td>
                  <td className="py-3 px-4 text-right">{row.inSms}</td>
                  <td className="py-3 px-4 text-right">{row.outSms}</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-200">{row.totalComms}</td>
                  <td className="py-3 px-4 text-right">{row.minutes}</td>
                  <td className="py-3 px-4 text-right font-medium">{row.usageCount}</td>
                  <td className="py-3 px-4">{row.firstDate}</td>
                  <td className="py-3 px-4 font-mono">{row.firstTime}</td>
                  <td className="py-3 px-4">{row.lastDate}</td>
                  <td className="py-3 px-4 font-mono">{row.lastTime}</td>
                  <td className="py-3 px-4 text-right">{row.activeDays}</td>
                  <td className="py-3 px-4 text-right">{row.uniqueNumbers}</td>
                  <td className="py-3 px-4 text-right">{row.uniqueLocations}</td>
                  <td className="py-3 px-4 text-right">{row.usagePercentage}%</td>
                  <td className="py-3 px-4 text-right">{row.uniqueSims}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={22} className="py-8 text-center text-gray-500">
                  No IMEI records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
