import React, { useMemo, useState } from 'react';
import { type CDRRecord } from '../../../../../utils/db';
import { ExportableChartCard } from '../../../../../components/ui/ExportableChartCard';
import { Smartphone } from 'lucide-react';
import { parseCDRTimestamp } from '../../advanced-analysis/AdvancedCDRAnalysis';

interface DayOfWeekImeiCardsProps {
  records: CDRRecord[];
}

export const DayOfWeekImeiCards: React.FC<DayOfWeekImeiCardsProps> = ({ records }) => {
  const [hoveredDay, setHoveredDay] = useState<{ name: string; count: number; pct: string; color: string } | null>(null);
  const [hoveredImei, setHoveredImei] = useState<{ imei: string; count: number; pct: string } | null>(null);

  // 5. Day of Week Analysis
  const dayOfWeekData = useMemo(() => {
    const days = Array(7).fill(0); // 0 = Sun, 1 = Mon ...
    records.forEach(r => {
      if (r.timestamp) {
        const timeStr = String(r.timestamp);
        let dayIdx = -1;
        if (timeStr.length === 14) {
          const y = parseInt(timeStr.substring(0, 4), 10);
          const m = parseInt(timeStr.substring(4, 6), 10) - 1;
          const d = parseInt(timeStr.substring(6, 8), 10);
          dayIdx = new Date(y, m, d).getDay();
        } else {
          try {
            const d = parseCDRTimestamp(r.timestamp);
            if (!isNaN(d.getTime())) {
              dayIdx = d.getDay();
            }
          } catch (_) {}
        }
        if (dayIdx >= 0 && dayIdx < 7) {
          days[dayIdx]++;
        }
      }
    });

    const total = days.reduce((a, b) => a + b, 0) || 1;
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const displayIndices = [1, 2, 3, 4, 5, 6, 0];
    const colors = [
      '#3ecf8e', // Mon - Emerald
      '#8b5cf6', // Tue - Purple
      '#f59e0b', // Wed - Amber
      '#10b981', // Thu - Teal/Green
      '#ec4899', // Fri - Pink
      '#3b82f6', // Sat - Blue
      '#f97316'  // Sun - Orange
    ];

    return displayIndices.map((idx, index) => ({
      name: names[idx],
      count: days[idx],
      pct: ((days[idx] / total) * 100).toFixed(1),
      color: colors[index]
    }));
  }, [records]);

  // 6. IMEI Usage Pattern
  const imeiUsage = useMemo(() => {
    const map: { [imei: string]: number } = {};
    records.forEach(r => {
      if (r.imei) {
        map[r.imei] = (map[r.imei] || 0) + 1;
      }
    });
    const sorted = Object.entries(map)
      .map(([imei, count]) => ({ imei, count }))
      .sort((a, b) => b.count - a.count);

    const total = sorted.reduce((sum, item) => sum + item.count, 0) || 1;
    return sorted.slice(0, 4).map(item => ({
      ...item,
      pct: ((item.count / total) * 100).toFixed(1)
    }));
  }, [records]);

  return (
    <>
      {/* 5. Day of Week Analysis */}
      <ExportableChartCard
        title="Day of Week Analysis"
        exportData={dayOfWeekData}
      >
        <div className="h-32 flex items-end gap-3.5 mt-4 relative">
          {dayOfWeekData.map((item, idx) => {
            const max = Math.max(...dayOfWeekData.map(d => d.count)) || 1;
            const heightPct = (item.count / max) * 100;
            return (
              <div 
                key={idx} 
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                onMouseEnter={() => setHoveredDay(item)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                {item.count > 0 && (
                  <span className="text-[10px] font-mono text-gray-300 mb-1 leading-none select-none">
                    {item.count}
                  </span>
                )}
                <div 
                  className="w-full rounded-t transition-all duration-150 opacity-80 hover:opacity-100"
                  style={{ 
                    height: `${Math.max(heightPct, 4)}%`,
                    backgroundColor: item.color
                  }}
                />
                <span className="text-[10px] text-gray-300 mt-2 font-mono text-center">
                  {item.name}
                </span>
              </div>
            );
          })}

          {/* Interactive Floating Tooltip */}
          {hoveredDay && (
            <div 
              className="absolute bg-[#171717] border border-gray-600 rounded-lg p-2 text-[10px] font-mono text-white shadow-xl z-20 pointer-events-none"
              style={{
                left: '50%',
                top: '5%',
                transform: 'translateX(-50%)'
              }}
            >
              <span className="block font-bold" style={{ color: hoveredDay.color }}>{hoveredDay.name} Analysis</span>
              <span className="block text-gray-200 mt-0.5">Events: {hoveredDay.count} ({hoveredDay.pct}%)</span>
            </div>
          )}
        </div>
      </ExportableChartCard>

      {/* 6. IMEI Usage Pattern */}
      <ExportableChartCard
        title="IMEI Usage Pattern"
        exportData={imeiUsage}
      >
        <div className="space-y-3.5 mt-4 text-xs font-mono relative">
          {imeiUsage.length > 0 ? (
            imeiUsage.map((item, idx) => (
              <div 
                key={idx} 
                className="space-y-1 cursor-pointer p-1 rounded hover:bg-[#2e2e2e]/30 transition-colors"
                onMouseEnter={() => setHoveredImei(item)}
                onMouseLeave={() => setHoveredImei(null)}
              >
                <div className="flex justify-between items-center text-gray-300">
                  <span className="flex items-center gap-1.5 text-gray-200">
                    <Smartphone className="h-3.5 w-3.5 text-gray-400" />
                    <span>{item.imei}</span>
                  </span>
                  <span className="font-semibold text-white">{item.count} ({item.pct}%)</span>
                </div>
                <div className="w-full h-1.5 bg-[#121212] border border-[#2e2e2e] rounded-full overflow-hidden">
                  <div className="bg-[#3ecf8e] h-full transition-all duration-300" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))
          ) : (
            <div className="h-28 flex items-center justify-center text-gray-500">
              No IMEI records logged.
            </div>
          )}

          {/* Interactive Floating Tooltip */}
          {hoveredImei && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#171717] border border-gray-600 rounded-lg p-2.5 text-[10px] font-mono text-white shadow-xl z-20 pointer-events-none">
              <span className="block text-gray-400 font-bold">Handset Details</span>
              <span className="block text-gray-200 mt-0.5">IMEI: {hoveredImei.imei}</span>
              <span className="block text-[#3ecf8e] font-semibold mt-0.5">Total Hits: {hoveredImei.count} ({hoveredImei.pct}%)</span>
            </div>
          )}
        </div>
      </ExportableChartCard>
    </>
  );
};
