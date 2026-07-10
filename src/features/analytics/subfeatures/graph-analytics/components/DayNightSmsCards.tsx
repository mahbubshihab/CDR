import React, { useMemo } from 'react';
import { type CDRRecord } from '../../../../../utils/db';
import { Download, Camera, Printer, Maximize2 } from 'lucide-react';

interface DayNightSmsCardsProps {
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

export const DayNightSmsCards: React.FC<DayNightSmsCardsProps> = ({ records }) => {
  // 11. Day vs Night Activity
  const dayNightActivity = useMemo(() => {
    let day = 0;
    let night = 0;
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
        if (hr >= 0) {
          if (hr >= 6 && hr < 22) day++;
          else night++;
        }
      }
    });
    const total = day + night || 1;
    return {
      day,
      night,
      dayPct: ((day / total) * 100).toFixed(1),
      nightPct: ((night / total) * 100).toFixed(1),
      total
    };
  }, [records]);

  // 12. Call vs SMS Distribution
  const callSmsDistribution = useMemo(() => {
    let calls = 0;
    let sms = 0;
    records.forEach(r => {
      if (r.usageType.toLowerCase().includes('sms')) sms++;
      else calls++;
    });
    const total = calls + sms || 1;
    return {
      calls,
      sms,
      callsPct: ((calls / total) * 100).toFixed(1),
      smsPct: ((sms / total) * 100).toFixed(1),
      total
    };
  }, [records]);

  return (
    <>
      {/* 11. Day vs Night Activity */}
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between text-left">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Day vs Night Activity</h3>
          <CardActions />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
          {/* Donut Chart SVG */}
          <div className="relative h-32 w-32 shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2e2e2e" strokeWidth="3" />
              
              {(() => {
                const t = dayNightActivity;
                const totalVal = t.total;
                const dayStroke = (t.day / totalVal) * 100;
                const nightStroke = (t.night / totalVal) * 100;

                return (
                  <>
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3ecf8e" strokeWidth="3"
                      strokeDasharray={`${dayStroke} ${100 - dayStroke}`}
                      strokeDashoffset="0"
                    />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#8b5cf6" strokeWidth="3"
                      strokeDasharray={`${nightStroke} ${100 - nightStroke}`}
                      strokeDashoffset={`-${dayStroke}`}
                    />
                  </>
                );
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-bold text-gray-100 font-mono leading-none">
                {dayNightActivity.total}
              </span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5 font-semibold">Events</span>
            </div>
          </div>

          {/* Legends */}
          <div className="flex-1 space-y-2.5 w-full text-xs font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#3ecf8e]" />
                <span className="text-gray-300">Day (06:00 - 22:00)</span>
              </div>
              <span className="text-gray-400 font-semibold">{dayNightActivity.day} ({dayNightActivity.dayPct}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#8b5cf6]" />
                <span className="text-gray-300">Night (22:00 - 06:00)</span>
              </div>
              <span className="text-gray-400 font-semibold">{dayNightActivity.night} ({dayNightActivity.nightPct}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 12. Call vs SMS Distribution */}
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between text-left">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Call vs SMS Distribution</h3>
          <CardActions />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
          {/* Donut Chart SVG */}
          <div className="relative h-32 w-32 shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2e2e2e" strokeWidth="3" />
              
              {(() => {
                const t = callSmsDistribution;
                const totalVal = t.total;
                const callsStroke = (t.calls / totalVal) * 100;
                const smsStroke = (t.sms / totalVal) * 100;

                return (
                  <>
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3ecf8e" strokeWidth="3"
                      strokeDasharray={`${callsStroke} ${100 - callsStroke}`}
                      strokeDashoffset="0"
                    />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#8b5cf6" strokeWidth="3"
                      strokeDasharray={`${smsStroke} ${100 - smsStroke}`}
                      strokeDashoffset={`-${callsStroke}`}
                    />
                  </>
                );
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-bold text-gray-100 font-mono leading-none">
                {callSmsDistribution.total}
              </span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5 font-semibold">Events</span>
            </div>
          </div>

          {/* Legends */}
          <div className="flex-1 space-y-2.5 w-full text-xs font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#3ecf8e]" />
                <span className="text-gray-300">Voice Calls</span>
              </div>
              <span className="text-gray-400 font-semibold">{callSmsDistribution.calls} ({callSmsDistribution.callsPct}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#8b5cf6]" />
                <span className="text-gray-300">SMS Activity</span>
              </div>
              <span className="text-gray-400 font-semibold">{callSmsDistribution.sms} ({callSmsDistribution.smsPct}%)</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
