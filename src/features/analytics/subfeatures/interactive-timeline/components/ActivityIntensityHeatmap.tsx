import React, { useMemo } from 'react';
import { type CDRRecord } from '../../../../../utils/db';

export const ActivityIntensityHeatmap: React.FC<any> = ({ records }) => {
  const heatmapData = useMemo(() => {
    const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));
    let maxVal = 0;

    records.forEach((r: any) => {
      const d = new Date(r.timestamp);
      let day = d.getDay();
      day = day === 0 ? 6 : day - 1;
      const hour = d.getHours();
      
      matrix[day][hour]++;
      if (matrix[day][hour] > maxVal) {
        maxVal = matrix[day][hour];
      }
    });

    return { matrix, maxVal };
  }, [records]);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getOpacity = (val: number, max: number) => {
    if (val === 0) return 0.05;
    return Math.max(0.15, val / max);
  };

  return (
    <div className="bg-[#121212] border border-[#2e2e2e] rounded-md p-4 shadow-sm">
      <h3 className="text-sm font-bold text-white mb-4">Activity Intensity Heatmap</h3>
      
      <div className="flex">
        <div className="flex flex-col justify-between pr-3 text-[10px] text-gray-400 font-mono mt-6">
          {days.map(d => (
            <div key={d} className="h-5 flex items-center">{d}</div>
          ))}
        </div>

        <div className="flex-1 overflow-x-auto pr-2">
          <div className="text-center text-[10px] text-gray-500 mb-2 font-mono">Hour</div>
          
          <div className="flex flex-col gap-1">
            {heatmapData.matrix.map((row, dayIdx) => (
              <div key={dayIdx} className="flex gap-1 h-4">
                {row.map((val, hourIdx) => (
                  <div
                    key={`${dayIdx}-${hourIdx}`}
                    className="flex-1 rounded-sm bg-[#3b82f6] transition-opacity hover:opacity-100 cursor-pointer"
                    style={{ opacity: getOpacity(val, heatmapData.maxVal) }}
                    title={`${days[dayIdx]} ${hourIdx}:00 - ${val} events`}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="flex mt-2">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="flex-1 text-center text-[9px] text-gray-500 font-mono">
                {i % 2 === 0 ? i : ''}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
