import React, { useMemo } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { Server, PhoneCall, MessageSquare, Clock, MapPin } from 'lucide-react';

interface MfcAnalysisProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

export const MfcAnalysis: React.FC<MfcAnalysisProps> = ({ cdrFile, records }) => {
  // Aggregate tower frequency
  const towerStats = useMemo(() => {
    const map: { 
      [key: string]: { 
        address: string; 
        lac: number; 
        cellId: number; 
        voiceCount: number; 
        smsCount: number; 
        total: number;
        hours: { [hr: number]: number };
      } 
    } = {};

    records.forEach(r => {
      const addr = r.address || 'Unknown Cell Location';
      const lac = r.lac || 0;
      const cellId = r.cellId || 0;
      const key = `${lac}-${cellId}-${addr}`;

      if (!map[key]) {
        map[key] = {
          address: addr,
          lac,
          cellId,
          voiceCount: 0,
          smsCount: 0,
          total: 0,
          hours: Array(24).fill(0).reduce((acc, _, idx) => ({ ...acc, [idx]: 0 }), {})
        };
      }

      // Check type
      const type = r.usageType.toLowerCase();
      if (type.includes('sms')) {
        map[key].smsCount++;
      } else {
        map[key].voiceCount++;
      }
      map[key].total++;

      // Hour parsing
      if (r.timestamp) {
        const timeStr = String(r.timestamp);
        let hr = -1;
        if (timeStr.length === 14) {
          hr = parseInt(timeStr.substring(8, 10), 10);
        } else {
          try {
            const d = new Date(r.timestamp);
            if (!isNaN(d.getTime())) {
              hr = d.getHours();
            }
          } catch (_) {}
        }
        if (hr >= 0 && hr < 24) {
          map[key].hours[hr] = (map[key].hours[hr] || 0) + 1;
        }
      }
    });

    const sorted = Object.values(map)
      .sort((a, b) => b.total - a.total)
      .map(item => {
        // Find peak hour
        let peakHr = 0;
        let peakCount = 0;
        Object.entries(item.hours).forEach(([hr, cnt]) => {
          if (cnt > peakCount) {
            peakCount = cnt;
            peakHr = parseInt(hr, 10);
          }
        });

        return {
          ...item,
          peakHourStr: `${peakHr.toString().padStart(2, '0')}:00 - ${(peakHr + 1).toString().padStart(2, '0')}:00`
        };
      });

    const totalRecords = records.length || 1;
    return {
      list: sorted,
      totalTowers: sorted.length,
      peakTower: sorted[0] || null,
      peakPct: sorted[0] ? ((sorted[0].total / totalRecords) * 100).toFixed(1) : '0'
    };
  }, [records]);

  return (
    <div className="w-full h-full overflow-y-auto p-6 space-y-6 custom-scrollbar text-left bg-[#121212] animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="border-b border-[#2e2e2e] pb-4">
        <h2 className="text-sm font-semibold text-gray-200">MFC / IMF Cell Tower Analysis</h2>
        <p className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-wider">
          Pinpoint most frequent locations and coverage densities for suspect: <strong className="text-gray-300 font-mono font-bold">{cdrFile.phoneNumber}</strong>
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Unique Cell Towers Visited</span>
          <span className="text-2xl font-bold text-gray-100 font-mono mt-2">{towerStats.totalTowers}</span>
          <span className="text-[11px] text-gray-500 font-mono mt-1">Total physical cell IDs logged</span>
        </div>
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Most Visited Cell Tower</span>
          <span className="text-sm font-semibold text-[#3ecf8e] mt-2 truncate" title={towerStats.peakTower?.address}>
            {towerStats.peakTower?.address || '—'}
          </span>
          <span className="text-[11px] text-gray-500 font-mono mt-1">
            {towerStats.peakTower ? `${towerStats.peakTower.total} connections logged` : '—'}
          </span>
        </div>
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Peak Tower Density Ratio</span>
          <span className="text-2xl font-bold text-gray-100 font-mono mt-2">{towerStats.peakPct}%</span>
          <span className="text-[11px] text-gray-500 font-mono mt-1">Percentage of total target activities at most frequent tower</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#2e2e2e] bg-[#1a1a1a]/30">
          <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Towers Frequency Ranking</h3>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse text-left text-xs font-mono">
            <thead>
              <tr className="bg-[#171717] border-b border-[#2e2e2e] text-gray-400 uppercase font-semibold text-[10px] tracking-wider">
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Location Address</th>
                <th className="py-3 px-4 text-center">LAC</th>
                <th className="py-3 px-4 text-center">Cell ID</th>
                <th className="py-3 px-4 text-right">Voice</th>
                <th className="py-3 px-4 text-right">SMS</th>
                <th className="py-3 px-4 text-center">Peak Hour Window</th>
                <th className="py-3 px-4 text-right w-28">Total Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e2e]/40 text-gray-300">
              {towerStats.list.length > 0 ? (
                towerStats.list.map((item, idx) => {
                  const maxTotal = towerStats.peakTower?.total || 1;
                  const barWidth = ((item.total / maxTotal) * 100).toFixed(0);
                  return (
                    <tr key={idx} className="hover:bg-[#171717]/40 transition-colors">
                      <td className="py-3 px-4 text-center text-gray-500 font-bold">#{idx + 1}</td>
                      <td className="py-3 px-4 font-sans text-gray-200 font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                          <span className="truncate max-w-[280px]" title={item.address}>{item.address}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">{item.lac}</td>
                      <td className="py-3 px-4 text-center">{item.cellId}</td>
                      <td className="py-3 px-4 text-right text-gray-400">
                        <span className="flex items-center justify-end gap-1">
                          <PhoneCall className="h-3 w-3 text-gray-500" />
                          {item.voiceCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-400">
                        <span className="flex items-center justify-end gap-1">
                          <MessageSquare className="h-3 w-3 text-gray-500" />
                          {item.smsCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-[#3ecf8e] font-semibold">{item.peakHourStr}</td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex justify-between font-bold text-gray-200">
                            <span>{item.total}</span>
                            <span className="text-gray-500 text-[10px]">
                              {((item.total / (records.length || 1)) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full h-1 bg-[#121212] rounded-full overflow-hidden">
                            <div className="bg-[#3ecf8e] h-full" style={{ width: `${barWidth}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No cell tower information found in the active file records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
