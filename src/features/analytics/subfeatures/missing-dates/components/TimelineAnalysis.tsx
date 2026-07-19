import React from 'react';

interface Period {
  start: Date;
  end: Date;
  days: number;
}

interface TimelineAnalysisProps {
  activePeriods: Period[];
  missingPeriods: Period[];
  globalStats: any;
}

export const TimelineAnalysis: React.FC<TimelineAnalysisProps> = ({ activePeriods, missingPeriods, globalStats }) => {
  const formatShortDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="bg-[#131f37] border border-[#1e293b] rounded-lg p-5">
          <h3 className="text-teal-400 font-bold text-sm mb-4 tracking-wide uppercase">Continuous active periods</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {activePeriods.map((p, i) => (
              <div key={i} className="bg-[#0a1120] border border-[#1e293b] rounded p-3 text-sm text-gray-300 flex items-center gap-2">
                <span>{formatShortDate(p.start)}</span>
                <span className="text-gray-500">→</span>
                <span>{formatShortDate(p.end)}</span>
                <span className="text-teal-500 ml-auto font-medium">({p.days} day{p.days > 1 ? 's' : ''})</span>
              </div>
            ))}
            {activePeriods.length === 0 && <div className="text-gray-500 text-sm italic">No continuous active periods found.</div>}
          </div>
        </div>
        <div className="bg-[#131f37] border border-[#1e293b] rounded-lg p-5">
          <h3 className="text-red-400 font-bold text-sm mb-4 tracking-wide uppercase">Continuous missing periods</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {missingPeriods.map((p, i) => (
              <div key={i} className="bg-[#0a1120] border border-[#1e293b] rounded p-3 text-sm text-gray-300 flex items-center gap-2">
                <span>{formatShortDate(p.start)}</span>
                <span className="text-gray-500">→</span>
                <span>{formatShortDate(p.end)}</span>
                <span className="text-red-500 ml-auto font-medium">({p.days} day{p.days > 1 ? 's' : ''})</span>
              </div>
            ))}
            {missingPeriods.length === 0 && <div className="text-gray-500 text-sm italic">No missing periods found.</div>}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 mt-2">
        <div className="bg-[#131f37] border border-[#1e293b] rounded-lg p-5 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-red-400 mb-1">{globalStats.longestMissingGap} days</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">LONGEST MISSING GAP</span>
        </div>
        <div className="bg-[#131f37] border border-[#1e293b] rounded-lg p-5 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-teal-400 mb-1">{globalStats.longestActivePeriod} days</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">LONGEST ACTIVE PERIOD</span>
        </div>
        <div className="bg-[#131f37] border border-[#1e293b] rounded-lg p-5 flex flex-col items-center justify-center text-center">
          <span className="text-lg font-medium text-yellow-500 mb-1">{globalStats.lastMissing}</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">LAST MISSING</span>
        </div>
        <div className="bg-[#131f37] border border-[#1e293b] rounded-lg p-5 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-white mb-1">{globalStats.activePeriodCount}</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">ACTIVE PERIOD COUNT</span>
        </div>
      </div>
    </div>
  );
};
