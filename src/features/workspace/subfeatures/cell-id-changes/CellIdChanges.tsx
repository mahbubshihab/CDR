import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRightLeft, Search } from 'lucide-react';
import { db, type Case, type CDRRecord } from '../../../../utils/db';

interface CellIdChangesProps {
  activeCase: Case;
}

interface TransitionData {
  previous: string | number;
  next: string | number;
  freq: number;
  avgTimeStr: string;
  avgTimeRaw: number;
  direction: string;
}

export const CellIdChanges: React.FC<CellIdChangesProps> = ({ activeCase }) => {
  const [loading, setLoading] = useState(true);
  const [transitions, setTransitions] = useState<TransitionData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!activeCase.id) return;
      setLoading(true);
      try {
        const records = await db.cdrRecords.where('caseId').equals(activeCase.id).toArray();
        
        // Group by fileId (target)
        const recordsByFileId: Record<number, CDRRecord[]> = {};
        records.forEach(r => {
          if (!recordsByFileId[r.fileId]) recordsByFileId[r.fileId] = [];
          recordsByFileId[r.fileId].push(r);
        });

        const transitionCounts: Record<string, { count: number, totalTimeDiff: number }> = {};

        Object.values(recordsByFileId).forEach(group => {
          // Sort chronologically
          group.sort((a, b) => a.timestamp - b.timestamp);
          
          let prevCellId: number | string | undefined = undefined;
          let prevTimestamp: number | undefined = undefined;
          
          for (const record of group) {
            const currentCellId = record.cellId || record.address; // Fallback to address if cellId is not present
            if (currentCellId !== undefined && currentCellId !== null && currentCellId !== '') {
              if (prevCellId !== undefined && prevCellId !== currentCellId && prevTimestamp !== undefined) {
                const timeDiff = record.timestamp - prevTimestamp; // time difference in seconds or ms, assuming seconds based on db schema
                const key = `${prevCellId}|${currentCellId}`;
                
                if (!transitionCounts[key]) {
                  transitionCounts[key] = { count: 0, totalTimeDiff: 0 };
                }
                transitionCounts[key].count += 1;
                transitionCounts[key].totalTimeDiff += timeDiff;
              }
              prevCellId = currentCellId;
              prevTimestamp = record.timestamp;
            }
          }
        });

        const results: TransitionData[] = Object.keys(transitionCounts).map(key => {
          const [previous, next] = key.split('|');
          const data = transitionCounts[key];
          const avgTimeRaw = data.totalTimeDiff / data.count;
          
          return {
            previous,
            next,
            freq: data.count,
            avgTimeRaw: avgTimeRaw,
            avgTimeStr: avgTimeRaw.toFixed(1),
            direction: 'N/A' // Hardcoded based on rules
          };
        });

        // Sort by freq descending by default
        results.sort((a, b) => b.freq - a.freq);
        setTransitions(results);
      } catch (error) {
        console.error("Error fetching cell ID changes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeCase.id]);

  const filteredTransitions = useMemo(() => {
    if (!searchQuery) return transitions;
    const lowerQuery = searchQuery.toLowerCase();
    return transitions.filter(t => 
      t.previous.toString().toLowerCase().includes(lowerQuery) ||
      t.next.toString().toLowerCase().includes(lowerQuery)
    );
  }, [transitions, searchQuery]);

  return (
    <div className="w-full h-full p-6 text-left bg-[#121212] animate-in fade-in duration-300 flex flex-col">
      <div className="space-y-6 flex-shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-gray-200">Cell ID Changes</h2>
          <p className="text-xs text-gray-500 font-mono uppercase tracking-wider block mt-1">
            Analyze physical movement and transitions between cell towers for case: {activeCase.title}
          </p>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="mt-6 flex items-center justify-between bg-[#1e1e1e] p-4 rounded-t-xl border border-[#2e2e2e] border-b-0 shrink-0">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search Cell IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141414] border border-[#333] text-gray-200 text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-[#3ecf8e]/50 focus:ring-1 focus:ring-[#3ecf8e]/50 transition-all placeholder:text-gray-600"
          />
        </div>
        <div className="flex items-center gap-4 text-gray-300 text-sm">
          <span className="font-semibold text-gray-200">Columns</span>
          <span className="text-xs font-mono text-gray-500 bg-[#141414] px-3 py-1.5 rounded-md border border-[#333]">
            {filteredTransitions.length} rows
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden border border-[#2e2e2e] rounded-b-xl bg-[#1e1e1e]">
        <div className="h-full overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs text-gray-400 bg-[#171717] border-b border-[#2e2e2e] sticky top-0 z-10 font-medium">
              <tr>
                <th className="px-6 py-4">Previous</th>
                <th className="px-6 py-4">Next</th>
                <th className="px-6 py-4">Freq</th>
                <th className="px-6 py-4">Avg Time</th>
                <th className="px-6 py-4">Direction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e2e]/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <div className="animate-spin h-6 w-6 border-2 border-[#3ecf8e] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p>Analyzing movement patterns...</p>
                  </td>
                </tr>
              ) : filteredTransitions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <ArrowRightLeft className="h-10 w-10 text-gray-700 mx-auto mb-3" />
                    <p className="text-base font-medium text-gray-400">No cell transitions found</p>
                    <p className="text-xs mt-1">Upload more CDR logs or try a different search term.</p>
                  </td>
                </tr>
              ) : (
                filteredTransitions.map((t, index) => (
                  <tr key={index} className="hover:bg-[#252525] transition-colors group">
                    <td className="px-6 py-3 whitespace-nowrap font-medium text-gray-300">{t.previous}</td>
                    <td className="px-6 py-3 whitespace-nowrap font-medium text-gray-300">{t.next}</td>
                    <td className="px-6 py-3 whitespace-nowrap font-medium text-gray-200">{t.freq}</td>
                    <td className="px-6 py-3 whitespace-nowrap font-mono text-gray-400">{t.avgTimeStr}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-gray-500">{t.direction}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
