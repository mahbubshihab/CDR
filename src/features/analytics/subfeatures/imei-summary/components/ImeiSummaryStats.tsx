import React from 'react';
import { Smartphone } from 'lucide-react';
import type { ImeiSummaryStats as Stats } from '../hooks/useImeiAnalysis';

interface ImeiSummaryStatsProps {
  phoneNumber: string;
  totalRecords: number;
  stats: Stats;
}

export const ImeiSummaryStats: React.FC<ImeiSummaryStatsProps> = ({ phoneNumber, totalRecords, stats }) => {
  return (
    <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl flex items-center p-4">
      {/* Left side details */}
      <div className="flex-1 flex items-start gap-3">
        <Smartphone className="w-5 h-5 text-gray-400 mt-1" />
        <div>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">IMEI SUMMARY · DEVICE INTELLIGENCE</h2>
          <div className="text-xl font-bold text-white mb-1 font-mono">{phoneNumber}</div>
          <div className="text-sm text-gray-400">
            {stats.totalDevices} devices · {stats.switches} switches
          </div>
          <div className="text-[10px] text-gray-500 mt-3">
            TAC column = first 8 digits of IMEI (always shown).
          </div>
        </div>
      </div>
      
      {/* Right side stats boxes */}
      <div className="flex gap-2 shrink-0">
        <StatBox label="Devices" value={stats.totalDevices} />
        <StatBox label="Valid" value={stats.validDevices} />
        <StatBox label="Corrected" value={stats.correctedDevices} />
        <StatBox label="Invalid" value={stats.invalidDevices} />
        <StatBox label="Empty rows" value={stats.emptyRows} />
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
