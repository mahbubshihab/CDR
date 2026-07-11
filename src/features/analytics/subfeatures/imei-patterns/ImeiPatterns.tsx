import React, { useMemo, useState } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { Search } from 'lucide-react';

interface ImeiPatternsProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

interface SwapEvent {
  from: string;
  to: string;
  when: string;
  gap: string;
  epoch: number;
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

export const ImeiPatterns: React.FC<ImeiPatternsProps> = ({ cdrFile, records }) => {
  const [searchSummary, setSearchSummary] = useState('');
  const [searchSwaps, setSearchSwaps] = useState('');

  const { summaryTable, swapEvents } = useMemo(() => {
    const sorted = [...records].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    const imeiSims = new Map<string, Set<string>>();
    const swaps: SwapEvent[] = [];
    
    let currentImei: string | null = null;
    let lastImeiTimestamp = 0;

    for (const r of sorted) {
      if (!r.imei || r.imei.trim() === '') continue;

      if (!imeiSims.has(r.imei)) {
        imeiSims.set(r.imei, new Set());
      }
      if (r.imsi) {
        imeiSims.get(r.imei)!.add(r.imsi);
      }

      if (currentImei !== null && currentImei !== r.imei && r.timestamp) {
        const gapMs = r.timestamp - lastImeiTimestamp;
        const gapHours = Math.floor(gapMs / (1000 * 60 * 60));
        const gapMins = Math.floor((gapMs % (1000 * 60 * 60)) / (1000 * 60));
        
        swaps.push({
          from: currentImei,
          to: r.imei,
          when: formatDate(r.timestamp),
          gap: `${Math.max(0, gapHours)}h ${Math.max(0, gapMins)}m`,
          epoch: r.timestamp
        });
      }

      currentImei = r.imei;
      if (r.timestamp) {
        lastImeiTimestamp = r.timestamp;
      }
    }

    const summary = Array.from(imeiSims.entries()).map(([imei, sims]) => ({
      imei,
      sims: sims.size
    })).sort((a, b) => b.sims - a.sims);

    swaps.sort((a, b) => b.epoch - a.epoch);

    return { summaryTable: summary, swapEvents: swaps };
  }, [records]);

  const filteredSummary = summaryTable.filter(s => s.imei.includes(searchSummary));
  const filteredSwaps = swapEvents.filter(s => 
    s.from.includes(searchSwaps) || s.to.includes(searchSwaps)
  );

  return (
    <div className="w-full h-full bg-[#121212] overflow-y-auto p-6 space-y-6 text-left animate-in fade-in duration-300">
      
      {/* Summary Table */}
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#2e2e2e] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-gray-200">
            SIM Swap Analysis
          </h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchSummary}
                onChange={(e) => setSearchSummary(e.target.value)}
                className="bg-[#121212] border border-[#2e2e2e] rounded-md pl-9 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-[#3ecf8e] w-64"
              />
            </div>
            <div className="flex items-center text-sm">
              <span className="text-gray-400 bg-[#121212] px-3 py-1.5 border border-[#2e2e2e] rounded-l-md font-medium">Columns</span>
              <span className="text-gray-500 bg-[#121212]/50 px-3 py-1.5 border border-[#2e2e2e] border-l-0 rounded-r-md">{filteredSummary.length} rows</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[300px] custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#121212] border-b border-[#2e2e2e] sticky top-0">
              <tr>
                <th className="p-3 text-gray-400 font-semibold">IMEI</th>
                <th className="p-3 text-gray-400 font-semibold">SIMs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e2e]">
              {filteredSummary.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#121212]/50">
                  <td className="p-3 text-gray-200 font-mono font-bold select-all">{row.imei}</td>
                  <td className="p-3 text-gray-400 font-mono">{row.sims}</td>
                </tr>
              ))}
              {filteredSummary.length === 0 && (
                <tr>
                  <td colSpan={2} className="p-8 text-center text-gray-500">No data found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Swaps Table */}
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#2e2e2e] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-gray-200">
            Device Swap Analysis
          </h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchSwaps}
                onChange={(e) => setSearchSwaps(e.target.value)}
                className="bg-[#121212] border border-[#2e2e2e] rounded-md pl-9 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-[#3ecf8e] w-64"
              />
            </div>
            <div className="flex items-center text-sm">
              <span className="text-gray-400 bg-[#121212] px-3 py-1.5 border border-[#2e2e2e] rounded-l-md font-medium">Columns</span>
              <span className="text-gray-500 bg-[#121212]/50 px-3 py-1.5 border border-[#2e2e2e] border-l-0 rounded-r-md">{filteredSwaps.length} rows</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#121212] border-b border-[#2e2e2e]">
              <tr>
                <th className="p-3 text-gray-400 font-semibold">From</th>
                <th className="p-3 text-gray-400 font-semibold">To</th>
                <th className="p-3 text-gray-400 font-semibold">When</th>
                <th className="p-3 text-gray-400 font-semibold">Gap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e2e]">
              {filteredSwaps.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#121212]/50">
                  <td className="p-3 text-[#3ecf8e] font-mono font-bold select-all">{row.from}</td>
                  <td className="p-3 text-orange-400 font-mono font-bold select-all">{row.to}</td>
                  <td className="p-3 text-gray-400 font-mono">{row.when}</td>
                  <td className="p-3 text-gray-400 font-mono">{row.gap}</td>
                </tr>
              ))}
              {filteredSwaps.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">No swap events found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
