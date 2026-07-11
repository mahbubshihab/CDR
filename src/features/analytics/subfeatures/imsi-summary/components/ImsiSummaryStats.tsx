import React from 'react';
import { Radio } from 'lucide-react';
import type { ImsiSummaryStats as Stats } from '../hooks/useImsiAnalysis';

interface ImsiSummaryStatsProps {
  phoneNumber: string;
  stats: Stats;
}

export const ImsiSummaryStats: React.FC<ImsiSummaryStatsProps> = ({ phoneNumber, stats }) => {
  return (
    <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl flex items-center p-4">
      <div className="flex-1 flex items-start gap-3">
        <Radio className="w-5 h-5 text-gray-400 mt-1" />
        <div>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">IMSI SUMMARY · SIM INTELLIGENCE</h2>
          <div className="text-xl font-bold text-white mb-1 font-mono">{phoneNumber}</div>
          <div className="text-sm text-gray-400">
            {stats.totalSims} SIMs · {stats.switches} switches · {stats.dominantOperator}
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 shrink-0">
        <StatBox label="SIMs" value={stats.totalSims} />
        <StatBox label="Switches" value={stats.switches} />
        <StatBox label="Device Sw." value={stats.deviceSwitches} />
        <StatBox label="Shared" value={stats.sharedSims} />
      </div>
    </div>
  );
};

const StatBox = ({ label, value }: { label: string; value: number }) => (
  <div className="border border-[#2e2e2e] bg-[#1a1a1a] rounded px-5 py-3 flex flex-col items-center justify-center min-w-[80px]">
    <div className="text-lg font-bold text-white">{value}</div>
    <div className="text-[10px] text-gray-400 mt-1">{label}</div>
  </div>
);
