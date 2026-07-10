import React from 'react';
import { BarChart3 } from 'lucide-react';

interface CarrierChartProps {
  totalCount: number;
  opCounts: Record<string, number>;
}

export const CarrierChart: React.FC<CarrierChartProps> = ({ totalCount, opCounts }) => {
  const operators = ['Grameenphone', 'Robi', 'Banglalink', 'Teletalk', 'Airtel'];
  const colors: Record<string, string> = {
    'Grameenphone': 'bg-sky-500',
    'Robi': 'bg-orange-500',
    'Banglalink': 'bg-emerald-500',
    'Teletalk': 'bg-blue-500',
    'Airtel': 'bg-red-500'
  };

  const total = totalCount || 1;
  const breakdown = operators.map(op => {
    const count = opCounts[op] || 0;
    const percentage = ((count / total) * 100).toFixed(1);
    return { name: op, count, percentage, color: colors[op] || 'bg-gray-500' };
  });

  return (
    <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between text-left">
      <div>
        <div className="flex items-center gap-2 mb-4 border-b border-[#2e2e2e]/55 pb-2">
          <BarChart3 className="h-4.5 w-4.5 text-[#3ecf8e]" />
          <h3 className="text-xs font-semibold text-gray-255 uppercase tracking-wider">
            Carrier logs breakdown
          </h3>
        </div>

        <div className="space-y-3 font-mono text-[11px]">
          {breakdown.map(op => (
            <div key={op.name} className="flex items-center gap-3">
              <span className="w-20 text-gray-400 text-left truncate" title={op.name}>{op.name}</span>
              <div className="flex-1 h-2 bg-[#121212] border border-[#2e2e2e] rounded-full overflow-hidden">
                <div 
                  className={`h-full ${op.color} rounded-full`}
                  style={{ width: `${op.percentage}%` }}
                />
              </div>
              <span className="w-16 text-right text-gray-300 font-semibold">
                {op.count} <span className="text-gray-500 text-[9px] font-normal ml-0.5">({op.percentage}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
