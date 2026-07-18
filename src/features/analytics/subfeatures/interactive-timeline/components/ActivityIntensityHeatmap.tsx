import React, { useMemo } from 'react';
import { type CDRRecord } from '../../../../utils/db';

interface ActivityIntensityHeatmapProps {
  records: CDRRecord[];
}

export const ActivityIntensityHeatmap: React.FC<ActivityIntensityHeatmapProps> = ({ records }) => {
  const heatmapData = useMemo(() => {
    // 7 days (0=Sun, 1=Mon, ..., 6=Sat) x 24 hours
    // Wait, standard getDay is 0=Sun. The screenshot has Mon, Tue, Wed, Thu, Fri, Sat, Sun
    const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));
    let maxVal = 0;

    records.forEach(r => {
      const d = new Date(r.timestamp);
      let day = d.getDay(); // 0 is Sunday
      // Convert to Mon=0, Sun=6
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
    if (val === 0) return 0.1;
    return Math.max(0.2, val / max);
  };

  return (
    <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4">
      <h3 className="text-sm font-semibold text-white mb-4">Activity Intensity Heatmap</h3>
      
      <div className="flex">
        {/* Y Axis Labels */}
        <div className="flex flex-col justify-between pr-2 text-xs text-gray-500 font-mono mt-6">
          {days.map(d => (
            <div key={d} className="h-5 flex items-center">{d}</div>
          ))}
        </div>

        {/* Heatmap Grid */}
        <div className="flex-1 overflow-x-auto">
          {/* X Axis Title */}
          <div className="text-center text-xs text-gray-400 mb-2">Hour</div>
          
          <div className="flex flex-col gap-1">
            {heatmapData.matrix.map((row, dayIdx) => (
              <div key={dayIdx} className="flex gap-1 h-4">
                {row.map((val, hourIdx) => (
                  <div
                    key={`${dayIdx}-${hourIdx}`}
                    className="flex-1 rounded-sm bg-blue-500 transition-opacity hover:opacity-100 cursor-pointer"
                    style={{ opacity: getOpacity(val, heatmapData.maxVal) }}
                    title={`${days[dayIdx]} ${hourIdx}:00 - ${val} events`}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* X Axis Labels */}
          <div className="flex mt-2">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="flex-1 text-center text-[10px] text-gray-500 font-mono">
                {i % 3 === 0 ? i : ''}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
