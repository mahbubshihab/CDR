import React, { useMemo } from 'react';
import type { InternationalRecord } from '../types';
import type { CDRRecord } from '../../../../../utils/db';
import { isInternationalNumber } from '../types';

interface IntlTimelineViewProps {
  records: CDRRecord[]; // Passing raw records to build a timeline
}

export const IntlTimelineView: React.FC<IntlTimelineViewProps> = ({ records }) => {
  const timelineData = useMemo(() => {
    const datesMap = new Map<string, { date: string, count: number, details: any[] }>();
    
    // Process only international records
    records.forEach(r => {
      if (!r.otherParty || !isInternationalNumber(r.otherParty)) return;
      
      let dateStr = 'Unknown';
      if (r.timestamp) {
        const timeStr = String(r.timestamp);
        if (timeStr.length === 14) {
          dateStr = `${timeStr.substring(0,4)}-${timeStr.substring(4,6)}-${timeStr.substring(6,8)}`;
        } else {
          const d = new Date(r.timestamp);
          if (!isNaN(d.getTime())) {
            dateStr = d.toISOString().split('T')[0];
          }
        }
      }

      if (dateStr === 'Unknown') return;

      if (!datesMap.has(dateStr)) {
        datesMap.set(dateStr, { date: dateStr, count: 0, details: [] });
      }
      const item = datesMap.get(dateStr)!;
      item.count++;
      if (item.details.length < 5) { // store first 5 per day for tooltip/preview
        item.details.push(r.otherParty);
      }
    });

    return Array.from(datesMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [records]);

  const maxCount = Math.max(...timelineData.map(d => d.count), 1);

  return (
    <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl p-5 mt-6 animate-in fade-in duration-300">
      <h3 className="text-sm font-semibold text-gray-200 mb-6">Chronological Activity Timeline</h3>
      
      {timelineData.length > 0 ? (
        <div className="relative h-48 w-full border-b border-l border-[#2e2e2e] px-2 pb-2">
          {timelineData.map((d, i) => {
            const heightPct = (d.count / maxCount) * 100;
            const leftPct = (i / (timelineData.length - 1 || 1)) * 100;
            return (
              <div 
                key={d.date}
                className="absolute bottom-0 w-4 bg-[#38bdf8] hover:bg-[#0ea5e9] rounded-t transition-all cursor-pointer group"
                style={{ height: `${heightPct}%`, left: `calc(${leftPct}% - 8px)` }}
              >
                <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#121212] border border-[#2e2e2e] p-2 rounded shadow-xl whitespace-nowrap z-10 text-xs">
                  <div className="font-bold text-gray-200">{d.date}</div>
                  <div className="text-[#38bdf8]">{d.count} Events</div>
                  <div className="text-gray-500 mt-1">Sample contacts:</div>
                  {d.details.map((num, idx) => (
                    <div key={idx} className="text-gray-400 font-mono text-[10px]">{num}</div>
                  ))}
                  {d.count > 5 && <div className="text-gray-500 text-[10px]">+{d.count - 5} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center text-gray-500">
          No timeline data available.
        </div>
      )}
    </div>
  );
};
