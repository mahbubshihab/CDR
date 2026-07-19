import React from 'react';
import type { NetworkStats } from '../types';

interface NetworkSummaryCardProps {
  stats: NetworkStats;
}

// Operators to display in specific order with specific colors
const OPERATORS = [
  { key: 'Grameenphone', label: 'Grameenphone', color: 'bg-blue-500' },
  { key: 'Banglalink', label: 'Banglalink', color: 'bg-orange-500' },
  { key: 'Robi', label: 'Robi', color: 'bg-red-500' },
  { key: 'Airtel', label: 'Airtel', color: 'bg-red-400' },
  { key: 'Teletalk', label: 'Teletalk', color: 'bg-green-500' },
  { key: 'Unknown', label: 'Unknown', color: 'bg-gray-500' }
];

export const NetworkSummaryCard: React.FC<NetworkSummaryCardProps> = ({ stats }) => {
  return (
    <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl overflow-hidden font-mono text-[11px] mb-6 shadow-xl">
      <div className="px-5 py-4 border-b border-[#2e2e2e]">
        <h3 className="text-gray-200 font-bold text-sm">Network Distribution Summary</h3>
      </div>
      
      <div className="p-5 flex gap-3 overflow-x-auto custom-scrollbar pb-3">
        {/* Total Unique Box */}
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4 flex flex-col justify-center items-center min-w-[140px] shrink-0">
          <div className="text-white text-2xl font-bold">{stats.totalUnique}</div>
          <div className="text-gray-400 text-[10px] mt-1 text-center">Total Unique Mobile Numbers</div>
        </div>

        {/* Individual Operator Boxes */}
        {OPERATORS.map(op => {
          const count = stats.operatorCounts[op.key] || 0;
          const pct = stats.operatorPercentages[op.key] || '0.0';
          
          return (
            <div key={op.key} className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4 flex flex-col justify-center items-center min-w-[100px] shrink-0">
              <div className="text-white text-xl font-bold">{count}</div>
              <div className="text-gray-400 text-[10px] mt-1 text-center">{op.label}</div>
              <div className="text-gray-500 text-[9px]">{pct}%</div>
            </div>
          );
        })}
      </div>

      <div className="px-5 pb-6 pt-2 space-y-4">
        {OPERATORS.map(op => {
          const count = stats.operatorCounts[op.key] || 0;
          const pct = stats.operatorPercentages[op.key] || '0.0';
          if (count === 0 && op.key !== 'Grameenphone') return null; // Only hide if 0 to save space, but maybe show them all to match design

          return (
            <div key={op.key} className="flex items-center gap-4">
              <div className="w-24 text-gray-400 shrink-0">{op.label}</div>
              <div className="flex-1 h-3 bg-[#0a0a0a] rounded-full overflow-hidden flex items-center">
                <div 
                  className={`h-full ${op.color} rounded-full`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="w-8 text-right text-gray-300 shrink-0">{count}</div>
              <div className="w-12 text-right text-gray-400 shrink-0">{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
