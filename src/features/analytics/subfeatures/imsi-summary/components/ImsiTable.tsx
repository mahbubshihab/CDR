import React, { useState } from 'react';
import { Search } from 'lucide-react';
import type { ImsiAnalysisRow } from '../hooks/useImsiAnalysis';

interface ImsiTableProps {
  data: ImsiAnalysisRow[];
}

export const ImsiTable: React.FC<ImsiTableProps> = ({ data }) => {
  const [search, setSearch] = useState('');

  const filteredData = data.filter(
    (row) =>
      row.imsi.toLowerCase().includes(search.toLowerCase()) ||
      row.operator.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl overflow-hidden mt-6 flex flex-col">
      <div className="p-4 border-b border-[#2e2e2e] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-sm font-semibold text-gray-200">
          {data.length} SIM cards · full IMSI intelligence table
        </h3>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search IMSI or Operator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#121212] border border-[#2e2e2e] rounded-md pl-9 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-[#3ecf8e] w-64"
            />
          </div>
          <div className="flex items-center text-sm">
            <span className="text-gray-400 bg-[#121212] px-3 py-1.5 border border-[#2e2e2e] rounded-l-md font-medium">Columns</span>
            <span className="text-gray-500 bg-[#121212]/50 px-3 py-1.5 border border-[#2e2e2e] border-l-0 rounded-r-md">{filteredData.length} rows</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#121212] border-b border-[#2e2e2e]">
            <tr>
              <th className="p-3 text-gray-400 font-semibold w-8 text-center">#</th>
              <th className="p-3 text-gray-400 font-semibold">IMSI</th>
              <th className="p-3 text-gray-400 font-semibold">Operator</th>
              <th className="p-3 text-gray-400 font-semibold text-right">In Calls</th>
              <th className="p-3 text-gray-400 font-semibold text-right">Out Calls</th>
              <th className="p-3 text-gray-400 font-semibold text-right">In SMS</th>
              <th className="p-3 text-gray-400 font-semibold text-right">Out SMS</th>
              <th className="p-3 text-gray-400 font-semibold text-right">Total Comms</th>
              <th className="p-3 text-gray-400 font-semibold text-right">Minutes</th>
              <th className="p-3 text-gray-400 font-semibold text-right">Usage Count</th>
              <th className="p-3 text-gray-400 font-semibold text-right">Devices</th>
              <th className="p-3 text-gray-400 font-semibold">First Date</th>
              <th className="p-3 text-gray-400 font-semibold">First Time</th>
              <th className="p-3 text-gray-400 font-semibold">Last Date</th>
              <th className="p-3 text-gray-400 font-semibold">Last Time</th>
              <th className="p-3 text-gray-400 font-semibold text-right">Active Days</th>
              <th className="p-3 text-gray-400 font-semibold text-right">Numbers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e2e]">
            {filteredData.map((row, idx) => (
              <tr key={row.imsi} className="hover:bg-[#121212]/50">
                <td className="p-3 text-gray-500 text-center">{idx + 1}</td>
                <td className="p-3 text-gray-200 font-mono font-bold select-all">{row.imsi}</td>
                <td className="p-3 text-gray-300">{row.operator}</td>
                <td className="p-3 text-gray-400 text-right">{row.inCalls}</td>
                <td className="p-3 text-gray-400 text-right">{row.outCalls}</td>
                <td className="p-3 text-gray-400 text-right">{row.inSms}</td>
                <td className="p-3 text-gray-400 text-right">{row.outSms}</td>
                <td className="p-3 text-gray-300 text-right font-medium">{row.totalComms}</td>
                <td className="p-3 text-gray-300 text-right">{row.minutes}</td>
                <td className="p-3 text-gray-300 text-right">{row.usageCount}</td>
                <td className="p-3 text-gray-300 text-right font-mono">{row.uniqueDevices}</td>
                <td className="p-3 text-gray-400 font-mono">{row.firstDate}</td>
                <td className="p-3 text-gray-400 font-mono">{row.firstTime}</td>
                <td className="p-3 text-gray-400 font-mono">{row.lastDate}</td>
                <td className="p-3 text-gray-400 font-mono">{row.lastTime}</td>
                <td className="p-3 text-gray-300 text-right">{row.activeDays}</td>
                <td className="p-3 text-gray-300 text-right">{row.uniqueNumbers}</td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={17} className="p-8 text-center text-gray-500">
                  No SIM cards found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
