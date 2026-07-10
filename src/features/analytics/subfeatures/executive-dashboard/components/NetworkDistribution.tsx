import React from 'react';

interface NetworkDistributionProps {
  records: any[];
  onOpenNetwork: () => void;
}

export const NetworkDistribution: React.FC<NetworkDistributionProps> = ({ records, onOpenNetwork }) => {
  // Detect whether Pakistani or Bangladeshi operators are inside dataset
  const opSet = new Set(records.map(r => r.provider).filter(Boolean));
  const isPakistani = Array.from(opSet).some(op => 
    ['Jazz', 'Zong', 'Ufone', 'Telenor', 'Onic', 'SCO'].includes(op)
  );

  const operators = isPakistani 
    ? ['Jazz', 'Zong', 'Ufone', 'Telenor', 'Onic', 'SCO', 'Unknown']
    : ['Grameenphone', 'Robi', 'Banglalink', 'Teletalk', 'Airtel', 'Unknown'];

  const colors: Record<string, string> = {
    'Grameenphone': '#00a2e8',
    'Robi': '#ff6600',
    'Banglalink': '#e85c00',
    'Teletalk': '#008000',
    'Airtel': '#ff0000',
    'Jazz': '#ff9900',
    'Zong': '#00aa55',
    'Ufone': '#3399ff',
    'Telenor': '#00bbff',
    'Onic': '#8a2be2',
    'SCO': '#3366cc',
    'Unknown': '#888888'
  };

  const opCounts: Record<string, number> = {};
  records.forEach(r => {
    const op = r.provider || 'Unknown';
    opCounts[op] = (opCounts[op] || 0) + 1;
  });

  const uniqueNumbersCount = new Set(records.map(r => r.otherParty).filter(Boolean)).size;
  const total = records.length || 1;

  return (
    <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 space-y-5 text-left font-mono">
      <div className="flex justify-between items-center border-b border-[#2e2e2e]/55 pb-3">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">
          Network Distribution Summary
        </span>
        <button 
          onClick={onOpenNetwork} 
          className="text-xs text-[#3ecf8e] hover:underline font-semibold cursor-pointer"
        >
          Open Network Analysis &rarr;
        </button>
      </div>

      {/* Grid of Operators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-[#121212]/40 border border-[#2e2e2e]/60 rounded-lg p-3 text-center">
          <span className="text-xl font-bold text-gray-100">{uniqueNumbersCount}</span>
          <span className="text-[9px] text-gray-500 uppercase tracking-wider block mt-1">Total Numbers</span>
        </div>

        {operators.map(op => {
          const count = opCounts[op] || 0;
          const pct = ((count / total) * 100).toFixed(1);
          return (
            <div key={op} className="bg-[#121212]/40 border border-[#2e2e2e]/60 rounded-lg p-3 text-center">
              <span className="text-lg font-bold text-gray-250">{count}</span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wider block mt-1">{op}</span>
              <span className="text-[8px] text-gray-600 font-semibold block">{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Progress Bars */}
      <div className="space-y-2.5">
        {operators.map(op => {
          const count = opCounts[op] || 0;
          const pct = ((count / total) * 100).toFixed(1);
          const color = colors[op] || '#888888';
          return (
            <div key={op} className="space-y-1">
              <div className="flex justify-between text-[11px] text-gray-400">
                <span>{op}</span>
                <span>{count} ({pct}%)</span>
              </div>
              <div className="w-full h-1.5 bg-[#121212] rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full" 
                  style={{ width: `${pct}%`, backgroundColor: color }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
