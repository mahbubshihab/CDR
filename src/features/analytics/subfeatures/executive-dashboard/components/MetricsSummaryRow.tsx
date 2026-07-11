import React from 'react';

interface MetricsSummaryRowProps {
  bParties: number;
  locations: number;
  calls: number;
}

export const MetricsSummaryRow: React.FC<MetricsSummaryRowProps> = ({
  bParties, locations, calls
}) => {
  const items = [
    { label: 'B-Parties', value: bParties, sublabel: 'Total Unique B-Parties' },
    { label: 'Locations', value: locations, sublabel: 'Total Unique Locations' },
    { label: 'Calls', value: calls, sublabel: 'Total Calls' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((it, idx) => (
        <div 
          key={idx} 
          className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-4 flex flex-col justify-between text-left font-mono"
        >
          <div>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">
              {it.label}
            </span>
            <span className="text-2xl font-bold text-gray-100 block mt-2">
              {it.value}
            </span>
          </div>
          <span className="text-[9px] text-gray-500 mt-2 block">
            {it.sublabel}
          </span>
        </div>
      ))}
    </div>
  );
};
