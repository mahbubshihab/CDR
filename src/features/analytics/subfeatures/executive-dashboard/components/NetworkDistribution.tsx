import React from 'react';

interface NetworkDistributionProps {
  records: any[];
  onOpenNetwork: () => void;
}

// Prefix to Operator dynamic mapping for B-parties
function getOperatorFromNumber(numberStr: string, isPakistani: boolean): string {
  if (!numberStr) return 'Unknown';
  
  // Clean all non-numeric characters
  const clean = numberStr.replace(/\D/g, '');

  if (isPakistani) {
    // Pakistani prefixes: normalize to 3xx (starts with 923 or 03)
    let norm = clean;
    if (norm.startsWith('92')) norm = norm.substring(2);
    if (norm.startsWith('0')) norm = norm.substring(1);
    
    if (norm.startsWith('30') || norm.startsWith('32')) return 'Jazz';
    if (norm.startsWith('31')) return 'Zong';
    if (norm.startsWith('33')) return 'Ufone';
    if (norm.startsWith('34')) return 'Telenor';
    if (norm.startsWith('35')) return 'SCO';
    if (norm.startsWith('36')) return 'Onic';
    return 'Unknown';
  } else {
    // Bangladeshi prefixes: normalize to 1xx (starts with 8801 or 01)
    let norm = clean;
    if (norm.startsWith('88')) norm = norm.substring(2);
    if (norm.startsWith('0')) norm = norm.substring(1);
    
    if (norm.startsWith('17') || norm.startsWith('13')) return 'Grameenphone';
    if (norm.startsWith('18')) return 'Robi';
    if (norm.startsWith('19') || norm.startsWith('14')) return 'Banglalink';
    if (norm.startsWith('15')) return 'Teletalk';
    if (norm.startsWith('16')) return 'Airtel';
    return 'Unknown';
  }
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

  // Get unique B-parties
  const uniqueBParties = Array.from(new Set(records.map(r => r.otherParty).filter(Boolean)));
  
  // Count unique B-parties per parsed operator provider prefix
  const opCounts: Record<string, number> = {};
  uniqueBParties.forEach(bp => {
    const provider = getOperatorFromNumber(bp, isPakistani);
    opCounts[provider] = (opCounts[provider] || 0) + 1;
  });

  const uniqueNumbersCount = uniqueBParties.length;
  const total = uniqueNumbersCount || 1;

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
