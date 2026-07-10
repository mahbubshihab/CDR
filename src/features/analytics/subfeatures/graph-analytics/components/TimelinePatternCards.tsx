import React, { useMemo, useState } from 'react';
import { type CDRRecord } from '../../../../../utils/db';
import { ChartCardWrapper } from './ChartCardWrapper';
import { parseCDRTimestamp } from '../../advanced-analysis/AdvancedCDRAnalysis';

interface TimelinePatternCardsProps {
  records: CDRRecord[];
}

export const TimelinePatternCards: React.FC<TimelinePatternCardsProps> = ({ records }) => {
  // Tooltip States
  const [timelineHover, setTimelineHover] = useState<{ date: string; count: number; x: number; y: number } | null>(null);
  const [hourlyHover, setHourlyHover] = useState<{ hour: string; count: number; x: number; y: number } | null>(null);

  // 1. Communication Timeline Data
  const timelineData = useMemo(() => {
    const countsMap: { [date: string]: number } = {};
    records.forEach(r => {
      if (r.timestamp) {
        const timeStr = String(r.timestamp);
        let dateStr = '';
        if (timeStr.length === 14) {
          dateStr = `${timeStr.substring(0, 4)}-${timeStr.substring(4, 6)}-${timeStr.substring(6, 8)}`;
        } else {
          try {
            const d = parseCDRTimestamp(r.timestamp);
            if (!isNaN(d.getTime())) {
              dateStr = d.toISOString().split('T')[0];
            }
          } catch (_) {}
        }
        if (dateStr) {
          countsMap[dateStr] = (countsMap[dateStr] || 0) + 1;
        }
      }
    });

    const sortedDates = Object.keys(countsMap).sort();
    const list: { date: string; count: number }[] = [];
    if (sortedDates.length > 0) {
      const minDate = new Date(sortedDates[0]);
      const maxDate = new Date(sortedDates[sortedDates.length - 1]);
      
      const curr = new Date(minDate);
      while (curr <= maxDate) {
        const dateStr = curr.toISOString().split('T')[0];
        list.push({
          date: dateStr,
          count: countsMap[dateStr] || 0
        });
        curr.setDate(curr.getDate() + 1);
      }
    }
    
    // Find Peak
    let peakDate = '—';
    let peakCount = 0;
    list.forEach(item => {
      if (item.count > peakCount) {
        peakCount = item.count;
        peakDate = item.date;
      }
    });

    const startDate = sortedDates[0] || '—';
    const endDate = sortedDates[sortedDates.length - 1] || '—';

    return { list, peakDate, peakCount, startDate, endDate, totalDays: list.length };
  }, [records]);

  // 2. Hourly Call Pattern
  const hourlyData = useMemo(() => {
    const hours = Array(24).fill(0);
    records.forEach(r => {
      if (r.timestamp) {
        const timeStr = String(r.timestamp);
        let hr = -1;
        if (timeStr.length === 14) {
          hr = parseInt(timeStr.substring(8, 10), 10);
        } else {
          try {
            const d = parseCDRTimestamp(r.timestamp);
            if (!isNaN(d.getTime())) {
              hr = d.getHours();
            }
          } catch (_) {}
        }
        if (hr >= 0 && hr < 24) {
          hours[hr]++;
        }
      }
    });

    let peakHour = 0;
    let peakCount = 0;
    let activeHours = 0;
    hours.forEach((count, hr) => {
      if (count > 0) activeHours++;
      if (count > peakCount) {
        peakCount = count;
        peakHour = hr;
      }
    });

    return { hours, peakHour, peakCount, activeHours };
  }, [records]);

  const handleTimelineMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const idx = Math.max(0, Math.min(timelineData.list.length - 1, Math.round(pct * (timelineData.list.length - 1))));
    const item = timelineData.list[idx];
    if (item) {
      setTimelineHover({
        date: item.date,
        count: item.count,
        x: (idx / (timelineData.list.length - 1)) * 100, // percentage for SVG rendering
        y: 40
      });
    }
  };

  const handleHourlyMouseMove = (e: React.MouseEvent<HTMLDivElement>, hr: number, count: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHourlyHover({
      hour: `${hr.toString().padStart(2, '0')}:00`,
      count,
      x: rect.left + rect.width / 2,
      y: rect.top - 40
    });
  };

  return (
    <>
      {/* 1. Communication Timeline */}
      <ChartCardWrapper
        title="Communication Timeline"
        exportData={timelineData.list}
        subdetails={
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400 font-mono">
            <span>Total: <strong className="text-white font-semibold">{timelineData.list.reduce((a,b)=>a+b.count,0)}</strong></span>
            <span>Days: <strong className="text-white font-semibold">{timelineData.totalDays}</strong></span>
            <span>Peak: <strong className="text-[#3ecf8e] font-semibold">{timelineData.peakDate} ({timelineData.peakCount})</strong></span>
          </div>
        }
      >
        <div className="h-40 w-full relative border-b border-[#2e2e2e]/55 mt-4">
          {timelineData.list.length > 1 ? (
            <svg 
              className="w-full h-full cursor-crosshair" 
              viewBox="0 0 500 100" 
              preserveAspectRatio="none"
              onMouseMove={handleTimelineMouseMove}
              onMouseLeave={() => setTimelineHover(null)}
            >
              {/* Grid Lines */}
              <line x1="0" y1="25" x2="500" y2="25" stroke="#2e2e2e" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="0" y1="50" x2="500" y2="50" stroke="#2e2e2e" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="0" y1="75" x2="500" y2="75" stroke="#2e2e2e" strokeWidth="0.5" strokeDasharray="3,3" />
              
              {/* Curve Path */}
              {(() => {
                const maxVal = Math.max(...timelineData.list.map(d => d.count)) || 1;
                const points = timelineData.list.map((item, idx) => {
                  const x = (idx / (timelineData.list.length - 1)) * 500;
                  const y = 90 - (item.count / maxVal) * 80;
                  return `${x},${y}`;
                }).join(' ');

                return (
                  <>
                    <polyline
                      fill="none"
                      stroke="#3ecf8e"
                      strokeWidth="2.2"
                      points={points}
                    />
                    {/* Shadow path */}
                    <path
                      fill="url(#timelineGradNested2)"
                      stroke="none"
                      d={`M 0,100 L ${points} L 500,100 Z`}
                    />
                    <defs>
                      <linearGradient id="timelineGradNested2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3ecf8e" stopOpacity="0.16" />
                        <stop offset="100%" stopColor="#3ecf8e" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </>
                );
              })()}

              {/* Hover Indicator Vertical Line */}
              {timelineHover && (
                <>
                  <line 
                    x1={`${(timelineHover.x / 100) * 500}`} 
                    y1="0" 
                    x2={`${(timelineHover.x / 100) * 500}`} 
                    y2="100" 
                    stroke="#ffffff" 
                    strokeWidth="0.8" 
                    strokeDasharray="2,2" 
                  />
                  <circle 
                    cx={`${(timelineHover.x / 100) * 500}`} 
                    cy={`${90 - (timelineHover.count / (Math.max(...timelineData.list.map(d => d.count)) || 1)) * 80}`} 
                    r="4" 
                    fill="#3ecf8e" 
                    stroke="#ffffff" 
                    strokeWidth="1.2" 
                  />
                </>
              )}
            </svg>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 font-mono">
              Insufficient daily span to render trendline.
            </div>
          )}

          {/* Interactive Floating Tooltip */}
          {timelineHover && (
            <div 
              className="absolute bg-[#171717] border border-gray-600 rounded-lg p-2 text-[10px] font-mono text-white shadow-xl z-20 pointer-events-none"
              style={{ 
                left: `${Math.min(85, Math.max(5, timelineHover.x))}%`,
                top: '5%'
              }}
            >
              <span className="block text-gray-400 font-bold">{timelineHover.date}</span>
              <span className="block text-[#3ecf8e] font-semibold mt-0.5">Events: {timelineHover.count}</span>
            </div>
          )}
        </div>

        {/* Timeline Mini Data Table */}
        <div className="mt-4">
          <div className="border border-[#2e2e2e]/60 rounded-lg overflow-hidden">
            <div className="max-h-36 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-[11px] font-mono">
                <thead className="sticky top-0 bg-[#171717] border-b border-[#2e2e2e] text-gray-300 z-10">
                  <tr>
                    <th className="py-1.5 px-3">Date</th>
                    <th className="py-1.5 px-3 text-right">Events</th>
                    <th className="py-1.5 px-3 text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2e2e2e]/40 text-gray-300">
                  {timelineData.list.map((item, idx) => {
                    const total = timelineData.list.reduce((a,b)=>a+b.count,0) || 1;
                    return (
                      <tr key={idx} className="hover:bg-[#171717]/40">
                        <td className="py-1.5 px-3 text-gray-200 font-medium">{item.date}</td>
                        <td className="py-1.5 px-3 text-right font-semibold text-white">{item.count}</td>
                        <td className="py-1.5 px-3 text-right text-gray-400">{((item.count / total) * 100).toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ChartCardWrapper>

      {/* 2. Hourly Call Pattern */}
      <ChartCardWrapper
        title="Hourly Call Pattern"
        exportData={hourlyData.hours}
        subdetails={
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400 font-mono">
            <span>TOTAL EVENTS: <strong className="text-white font-semibold">{records.length}</strong></span>
            <span>ACTIVE HOURS: <strong className="text-white font-semibold">{hourlyData.activeHours}</strong></span>
            <span>PEAK HOUR: <strong className="text-red-400 font-semibold">{hourlyData.peakHour.toString().padStart(2,'0')}:00 ({hourlyData.peakCount})</strong></span>
          </div>
        }
      >
        <div className="h-40 w-full relative flex items-end gap-1 border-b border-[#2e2e2e]/55 mt-4 pb-1">
          {hourlyData.hours.map((count, hr) => {
            const max = Math.max(...hourlyData.hours) || 1;
            const heightPct = (count / max) * 100;
            const isPeak = hr === hourlyData.peakHour;
            return (
              <div 
                key={hr} 
                className="flex-1 flex flex-col items-center group h-full justify-end"
                onMouseMove={(e) => handleHourlyMouseMove(e, hr, count)}
                onMouseLeave={() => setHourlyHover(null)}
              >
                <div 
                  className={`w-full rounded-t transition-all duration-150 cursor-pointer ${isPeak ? 'bg-gradient-to-t from-red-600 to-red-400 hover:brightness-110 shadow-lg shadow-red-500/10' : 'bg-gradient-to-t from-[#059669] to-[#3ecf8e] hover:brightness-110 shadow-lg shadow-emerald-500/10'}`}
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                />
              </div>
            );
          })}

          {/* Interactive Floating Tooltip */}
          {hourlyHover && (
            <div 
              className="absolute bg-[#171717] border border-gray-600 rounded-lg p-2 text-[10px] font-mono text-white shadow-xl z-20 pointer-events-none"
              style={{
                left: '50%',
                top: '5%',
                transform: 'translateX(-50%)'
              }}
            >
              <span className="block text-gray-400 font-bold">{hourlyHover.hour}</span>
              <span className="block text-[#3ecf8e] font-semibold mt-0.5">Events: {hourlyHover.count}</span>
            </div>
          )}
        </div>

        {/* Hourly Mini Data Table */}
        <div className="mt-4">
          <div className="overflow-hidden border border-[#2e2e2e]/60 rounded-lg">
            <table className="w-full text-left border-collapse text-[11px] font-mono">
              <thead>
                <tr className="bg-[#171717] border-b border-[#2e2e2e] text-gray-300">
                  <th className="py-1.5 px-3">Hour</th>
                  <th className="py-1.5 px-3 text-right">Events</th>
                  <th className="py-1.5 px-3 text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e2e]/40 text-gray-300">
                {[hourlyData.peakHour, (hourlyData.peakHour + 1) % 24, (hourlyData.peakHour + 2) % 24].map((hr, idx) => {
                  const count = hourlyData.hours[hr] || 0;
                  const pct = ((count / (records.length || 1)) * 100).toFixed(1);
                  return (
                    <tr key={idx} className="hover:bg-[#171717]/40">
                      <td className="py-1.5 px-3 text-gray-200 font-medium">{hr.toString().padStart(2,'0')}:00</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-white">{count}</td>
                      <td className="py-1.5 px-3 text-right text-gray-400">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </ChartCardWrapper>
    </>
  );
};
