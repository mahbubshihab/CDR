import React, { useMemo } from 'react';
import { type CDRRecord } from '../../../../../utils/db';
import { Download, Camera, Printer, Maximize2 } from 'lucide-react';

interface TimelinePatternCardsProps {
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

export const TimelinePatternCards: React.FC<TimelinePatternCardsProps> = ({ records }) => {
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
            const d = new Date(r.timestamp);
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
    const list = sortedDates.map(date => ({ date, count: countsMap[date] }));
    
    // Find Peak
    let peakDate = '—';
    let peakCount = 0;
    list.forEach(item => {
      if (item.count > peakCount) {
        peakCount = item.count;
        peakDate = item.date;
      }
    });

    return { list, peakDate, peakCount, totalDays: list.length };
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
            const d = new Date(r.timestamp);
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

  return (
    <>
      {/* 1. Communication Timeline */}
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between text-left">
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xs font-semibold text-gray-250 uppercase tracking-wider">Communication Timeline</h3>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500 font-mono">
                <span>Total: <strong className="text-gray-300 font-semibold">{timelineData.list.reduce((a,b)=>a+b.count,0)}</strong></span>
                <span>Days: <strong className="text-gray-300 font-semibold">{timelineData.totalDays}</strong></span>
                <span>Peak: <strong className="text-[#3ecf8e] font-semibold">{timelineData.peakDate} ({timelineData.peakCount})</strong></span>
              </div>
            </div>
            <CardActions />
          </div>

          {/* Custom SVG Line Chart */}
          <div className="h-40 w-full relative border-b border-[#2e2e2e]/55 mt-4">
            {timelineData.list.length > 1 ? (
              <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
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
                        fill="url(#timelineGradNested)"
                        stroke="none"
                        d={`M 0,100 L ${points} L 500,100 Z`}
                      />
                      <defs>
                        <linearGradient id="timelineGradNested" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3ecf8e" stopOpacity="0.16" />
                          <stop offset="100%" stopColor="#3ecf8e" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </>
                  );
                })()}
              </svg>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 font-mono">
                Insufficient daily span to render trendline.
              </div>
            )}
          </div>
        </div>

        {/* Timeline Mini Data Table */}
        <div className="mt-4">
          <div className="overflow-hidden border border-[#2e2e2e]/60 rounded-lg">
            <table className="w-full text-left border-collapse text-[11px] font-mono">
              <thead>
                <tr className="bg-[#171717] border-b border-[#2e2e2e] text-gray-400">
                  <th className="py-1.5 px-3">Date</th>
                  <th className="py-1.5 px-3 text-right">Events</th>
                  <th className="py-1.5 px-3 text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e2e]/40 text-gray-300">
                {timelineData.list.slice(0, 3).map((item, idx) => {
                  const total = timelineData.list.reduce((a,b)=>a+b.count,0) || 1;
                  return (
                    <tr key={idx} className="hover:bg-[#171717]/40">
                      <td className="py-1.5 px-3">{item.date}</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-gray-200">{item.count}</td>
                      <td className="py-1.5 px-3 text-right text-gray-500">{((item.count / total) * 100).toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. Hourly Call Pattern */}
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between text-left">
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xs font-semibold text-gray-255 uppercase tracking-wider">Hourly Call Pattern</h3>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500 font-mono">
                <span>TOTAL EVENTS: <strong className="text-gray-300 font-semibold">{records.length}</strong></span>
                <span>ACTIVE HOURS: <strong className="text-gray-300 font-semibold">{hourlyData.activeHours}</strong></span>
                <span>PEAK HOUR: <strong className="text-red-500 font-semibold">{hourlyData.peakHour.toString().padStart(2,'0')}:00 ({hourlyData.peakCount})</strong></span>
              </div>
            </div>
            <CardActions />
          </div>

          {/* Custom SVG Bar Chart */}
          <div className="h-40 w-full relative flex items-end gap-1 border-b border-[#2e2e2e]/55 mt-4 pb-1">
            {hourlyData.hours.map((count, hr) => {
              const max = Math.max(...hourlyData.hours) || 1;
              const heightPct = (count / max) * 100;
              const isPeak = hr === hourlyData.peakHour;
              return (
                <div key={hr} className="flex-1 flex flex-col items-center group h-full justify-end">
                  <div 
                    className={`w-full rounded-t transition-all duration-155 ${isPeak ? 'bg-red-500' : 'bg-[#3ecf8e]/80 hover:bg-[#3ecf8e]'}`}
                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                    title={`${hr.toString().padStart(2,'0')}:00 - ${count} events`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Hourly Mini Data Table */}
        <div className="mt-4">
          <div className="overflow-hidden border border-[#2e2e2e]/60 rounded-lg">
            <table className="w-full text-left border-collapse text-[11px] font-mono">
              <thead>
                <tr className="bg-[#171717] border-b border-[#2e2e2e] text-gray-400">
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
                      <td className="py-1.5 px-3">{hr.toString().padStart(2,'0')}:00</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-gray-200">{count}</td>
                      <td className="py-1.5 px-3 text-right text-gray-500">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};
