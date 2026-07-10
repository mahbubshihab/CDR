import React, { useMemo } from 'react';
import { type CDRRecord } from '../../../../../utils/db';
import { Download, Camera, Printer, Maximize2, Smartphone } from 'lucide-react';

interface DayOfWeekImeiCardsProps {
  records: CDRRecord[];
}

const CardActions = () => (
  <div className="flex items-center gap-1.5 shrink-0 opacity-40 hover:opacity-100 transition-opacity">
    <button className="p-1 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-250 rounded transition-colors cursor-pointer" title="Download data">
      <Download className="h-3 w-3" />
    </button>
    <button className="p-1 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-250 rounded transition-colors cursor-pointer" title="Screenshot">
      <Camera className="h-3 w-3" />
    </button>
    <button className="p-1 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-250 rounded transition-colors cursor-pointer" title="Print">
      <Printer className="h-3 w-3" />
    </button>
    <button className="p-1 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-250 rounded transition-colors cursor-pointer" title="Maximize">
      <Maximize2 className="h-3 w-3" />
    </button>
  </div>
);

export const DayOfWeekImeiCards: React.FC<DayOfWeekImeiCardsProps> = ({ records }) => {
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
            const d = new Date(r.timestamp);
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
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between text-left">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Day of Week Analysis</h3>
          <CardActions />
        </div>

        <div className="h-32 flex items-end gap-3.5 mt-4">
          {dayOfWeekData.map((item, idx) => {
            const max = Math.max(...dayOfWeekData.map(d => d.count)) || 1;
            const heightPct = (item.count / max) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                <span className="text-[9px] text-gray-500 font-mono mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.pct}%
                </span>
                <div 
                  className="w-full rounded-t transition-all duration-155"
                  style={{ 
                    height: `${Math.max(heightPct, 4)}%`,
                    backgroundColor: item.color
                  }}
                />
                <span className="text-[10px] text-gray-405 mt-2 font-mono text-center">
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. IMEI Usage Pattern */}
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between text-left">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">IMEI Usage Pattern</h3>
          <CardActions />
        </div>

        <div className="space-y-3.5 mt-4 text-xs font-mono">
          {imeiUsage.length > 0 ? (
            imeiUsage.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-gray-300">
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <Smartphone className="h-3.5 w-3.5 text-gray-500" />
                    <span>{item.imei}</span>
                  </span>
                  <span className="font-semibold text-gray-200">{item.count} ({item.pct}%)</span>
                </div>
                <div className="w-full h-1.5 bg-[#121212] border border-[#2e2e2e] rounded-full overflow-hidden">
                  <div className="bg-[#3ecf8e] h-full" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))
          ) : (
            <div className="h-28 flex items-center justify-center text-gray-500">
              No IMEI records logged.
            </div>
          )}
        </div>
      </div>
    </>
  );
};
