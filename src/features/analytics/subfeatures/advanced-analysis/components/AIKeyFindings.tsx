import React from 'react';
import { Sparkles } from 'lucide-react';

interface AIKeyFindingsProps {
  stats: {
    firstActivityDate: string;
    lastActivityDate: string;
    peakDay: string;
    peakDayCount: number;
    peakHour: number;
    peakHourCount: number;
    nightRatio: string;
  };
}

export const AIKeyFindings: React.FC<AIKeyFindingsProps> = ({ stats }) => {
  return (
    <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between text-left">
      <div>
        <div className="flex items-center gap-2 mb-4 border-b border-[#2e2e2e]/55 pb-2">
          <Sparkles className="h-4.5 w-4.5 text-[#3ecf8e]" />
          <h3 className="text-xs font-semibold text-gray-255 uppercase tracking-wider">
            AI Key Findings Summary
          </h3>
        </div>

        <div className="space-y-3 font-mono text-[11px] text-gray-450">
          <div className="flex items-center justify-between border-b border-[#2e2e2e]/40 pb-2">
            <span>First Logged Activity</span>
            <strong className="text-gray-200">{stats.firstActivityDate}</strong>
          </div>
          <div className="flex items-center justify-between border-b border-[#2e2e2e]/40 pb-2">
            <span>Last Logged Activity</span>
            <strong className="text-gray-200">{stats.lastActivityDate}</strong>
          </div>
          <div className="flex items-center justify-between border-b border-[#2e2e2e]/40 pb-2">
            <span>Peak Activity Day</span>
            <strong className="text-gray-200">
              {stats.peakDay} <span className="text-gray-500 font-normal ml-1">({stats.peakDayCount} events)</span>
            </strong>
          </div>
          <div className="flex items-center justify-between border-b border-[#2e2e2e]/40 pb-2">
            <span>Peak Hour Window</span>
            <strong className="text-gray-200">
              {stats.peakHour === -1 ? '—' : `${String(stats.peakHour).padStart(2, '0')}:00`}
              <span className="text-gray-500 font-normal ml-1">({stats.peakHourCount} events)</span>
            </strong>
          </div>
          <div className="flex items-center justify-between pb-1 text-left">
            <span>Night Call Ratio</span>
            <strong className="text-gray-200">{stats.nightRatio}%</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
