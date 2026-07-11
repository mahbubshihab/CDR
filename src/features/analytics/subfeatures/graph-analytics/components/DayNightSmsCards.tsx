import React, { useMemo, useState } from 'react';
import { type CDRRecord } from '../../../../../utils/db';
import { ExportableChartCard } from '../../../../../components/ui/ExportableChartCard';
import { parseCDRTimestamp } from '../../advanced-analysis/AdvancedCDRAnalysis';

interface DayNightSmsCardsProps {
  records: CDRRecord[];
}

export const DayNightSmsCards: React.FC<DayNightSmsCardsProps> = ({ records }) => {
  const [hoveredDayNight, setHoveredDayNight] = useState<{ label: string; count: number; pct: string } | null>(null);
  const [hoveredCallSms, setHoveredCallSms] = useState<{ label: string; count: number; pct: string } | null>(null);

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
            const d = parseCDRTimestamp(r.timestamp);
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
      <ExportableChartCard
        title="Day vs Night Activity"
        exportData={dayNightActivity}
      >
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
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3ecf8e" strokeWidth="3.5"
                      strokeDasharray={`${dayStroke} ${100 - dayStroke}`}
                      strokeDashoffset="0"
                      className="cursor-pointer hover:stroke-white transition-all duration-150"
                      onMouseEnter={() => setHoveredDayNight({ label: 'Day Call', count: t.day, pct: t.dayPct })}
                      onMouseLeave={() => setHoveredDayNight(null)}
                    />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#8b5cf6" strokeWidth="3.5"
                      strokeDasharray={`${nightStroke} ${100 - nightStroke}`}
                      strokeDashoffset={`-${dayStroke}`}
                      className="cursor-pointer hover:stroke-white transition-all duration-150"
                      onMouseEnter={() => setHoveredDayNight({ label: 'Night Call', count: t.night, pct: t.nightPct })}
                      onMouseLeave={() => setHoveredDayNight(null)}
                    />
                  </>
                );
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-base font-bold text-white font-mono leading-none">
                {hoveredDayNight ? hoveredDayNight.count : dayNightActivity.total}
              </span>
              <span className="text-[9px] text-[#3ecf8e] uppercase tracking-wider mt-1 font-semibold">
                {hoveredDayNight ? hoveredDayNight.label : "Events"}
              </span>
              {hoveredDayNight && (
                <span className="text-[9px] text-gray-400 font-mono mt-0.5">{hoveredDayNight.pct}%</span>
              )}
            </div>
          </div>

          {/* Legends */}
          <div className="flex-1 space-y-2.5 w-full text-xs font-mono">
            <div 
              className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-[#2e2e2e]/50"
              onMouseEnter={() => setHoveredDayNight({ label: 'Day Call', count: dayNightActivity.day, pct: dayNightActivity.dayPct })}
              onMouseLeave={() => setHoveredDayNight(null)}
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#3ecf8e]" />
                <span className="text-gray-300">Day (06:00 - 22:00)</span>
              </div>
              <span className="text-white font-semibold">{dayNightActivity.day} ({dayNightActivity.dayPct}%)</span>
            </div>
            <div 
              className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-[#2e2e2e]/50"
              onMouseEnter={() => setHoveredDayNight({ label: 'Night Call', count: dayNightActivity.night, pct: dayNightActivity.nightPct })}
              onMouseLeave={() => setHoveredDayNight(null)}
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#8b5cf6]" />
                <span className="text-gray-300">Night (22:00 - 06:00)</span>
              </div>
              <span className="text-white font-semibold">{dayNightActivity.night} ({dayNightActivity.nightPct}%)</span>
            </div>
          </div>
        </div>
      </ExportableChartCard>

      {/* 12. Call vs SMS Distribution */}
      <ExportableChartCard
        title="Call vs SMS Distribution"
        exportData={callSmsDistribution}
      >
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
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3ecf8e" strokeWidth="3.5"
                      strokeDasharray={`${callsStroke} ${100 - callsStroke}`}
                      strokeDashoffset="0"
                      className="cursor-pointer hover:stroke-white transition-all duration-150"
                      onMouseEnter={() => setHoveredCallSms({ label: 'Voice Calls', count: t.calls, pct: t.callsPct })}
                      onMouseLeave={() => setHoveredCallSms(null)}
                    />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#8b5cf6" strokeWidth="3.5"
                      strokeDasharray={`${smsStroke} ${100 - smsStroke}`}
                      strokeDashoffset={`-${callsStroke}`}
                      className="cursor-pointer hover:stroke-white transition-all duration-150"
                      onMouseEnter={() => setHoveredCallSms({ label: 'SMS Activ.', count: t.sms, pct: t.smsPct })}
                      onMouseLeave={() => setHoveredCallSms(null)}
                    />
                  </>
                );
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-base font-bold text-white font-mono leading-none">
                {hoveredCallSms ? hoveredCallSms.count : callSmsDistribution.total}
              </span>
              <span className="text-[9px] text-[#3ecf8e] uppercase tracking-wider mt-1 font-semibold">
                {hoveredCallSms ? hoveredCallSms.label : "Events"}
              </span>
              {hoveredCallSms && (
                <span className="text-[9px] text-gray-400 font-mono mt-0.5">{hoveredCallSms.pct}%</span>
              )}
            </div>
          </div>

          {/* Legends */}
          <div className="flex-1 space-y-2.5 w-full text-xs font-mono">
            <div 
              className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-[#2e2e2e]/50"
              onMouseEnter={() => setHoveredCallSms({ label: 'Voice Calls', count: callSmsDistribution.calls, pct: callSmsDistribution.callsPct })}
              onMouseLeave={() => setHoveredCallSms(null)}
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#3ecf8e]" />
                <span className="text-gray-300">Voice Calls</span>
              </div>
              <span className="text-white font-semibold">{callSmsDistribution.calls} ({callSmsDistribution.callsPct}%)</span>
            </div>
            <div 
              className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-[#2e2e2e]/50"
              onMouseEnter={() => setHoveredCallSms({ label: 'SMS Activ.', count: callSmsDistribution.sms, pct: callSmsDistribution.smsPct })}
              onMouseLeave={() => setHoveredCallSms(null)}
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#8b5cf6]" />
                <span className="text-gray-300">SMS Activity</span>
              </div>
              <span className="text-white font-semibold">{callSmsDistribution.sms} ({callSmsDistribution.smsPct}%)</span>
            </div>
          </div>
        </div>
      </ExportableChartCard>
    </>
  );
};
