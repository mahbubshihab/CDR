import React from 'react';
import { TrendingUp, Award, MapPin } from 'lucide-react';

interface ActivityTrendlineProps {
  metrics: {
    dailyActivityByMonth: Array<{
      month: string;
      points: number[];
      color: string;
    }>;
    locationBadges: Array<{
      name: string;
      count: number;
    }>;
  };
}

export const ActivityTrendline: React.FC<ActivityTrendlineProps> = ({ metrics }) => {
  // Peak value across all series to prevent clipping at boundaries
  const maxVal = React.useMemo(() => {
    let peak = 0;
    metrics.dailyActivityByMonth.forEach(m => {
      m.points.forEach(p => {
        if (p > peak) peak = p;
      });
    });
    return peak || 1;
  }, [metrics.dailyActivityByMonth]);

  return (
    <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 space-y-5 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4.5 w-4.5 text-[#3ecf8e]" />
          <h3 className="text-xs font-semibold text-gray-250 uppercase tracking-wider">
            Daily Activity Trend Line
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          {metrics.dailyActivityByMonth.map(m => (
            <div key={m.month} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
              <span className="text-gray-400">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Daily Trend Chart Container */}
      <div className="h-48 w-full border border-[#2e2e2e] bg-[#121212]/35 rounded-xl p-3 relative overflow-hidden">
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none opacity-20">
          <div className="border-b border-gray-700 w-full" />
          <div className="border-b border-gray-700 w-full" />
          <div className="border-b border-gray-700 w-full" />
          <div className="border-b border-gray-700 w-full" />
        </div>

        <svg className="w-full h-full" viewBox="0 0 600 150" preserveAspectRatio="none">
          {metrics.dailyActivityByMonth.map(series => {
            const pointsStr = series.points.map((val, idx) => {
              const x = (idx / 29) * 600;
              const y = 140 - (val / maxVal) * 125;
              return `${x},${y}`;
            }).join(' ');

            return (
              <polyline
                key={series.month}
                fill="none"
                stroke={series.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsStr}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>
      </div>

      {/* Location Intel metrics bar */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-1 text-gray-450 font-semibold font-mono text-[10px] uppercase tracking-wider">
          <Award className="h-3.5 w-3.5 text-[#3ecf8e]" />
          <span>Location Intelligence — Peak cell tower transitions</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
          {metrics.locationBadges.map((badge, idx) => (
            <span key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-[#171717] border border-[#2e2e2e] text-gray-300 rounded-lg hover:border-[#3ecf8e]/30 transition-colors">
              <MapPin className="h-3 w-3 text-gray-500" />
              <span className="truncate max-w-[120px]" title={badge.name}>{badge.name}</span>
              <strong className="text-[#3ecf8e] ml-1">{badge.count}</strong>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
