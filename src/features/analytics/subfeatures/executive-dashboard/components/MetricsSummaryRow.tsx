import React from 'react';

interface MetricsSummaryRowProps {
  incoming: number;
  outgoing: number;
  sms: number;
  bParties: number;
  locations: number;
  calls: number;
}

export const MetricsSummaryRow: React.FC<MetricsSummaryRowProps> = ({
  incoming, outgoing, sms, bParties, locations, calls
}) => {
  const items = [
    { label: 'Incoming', value: incoming },
    { label: 'Outgoing', value: outgoing },
    { label: 'SMS', value: sms },
    { label: 'B-Parties', value: bParties },
    { label: 'Locations', value: locations },
    { label: 'Calls', value: calls }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {items.map((it, idx) => (
        <div 
          key={idx} 
          className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-4 flex flex-col justify-between text-left font-mono"
        >
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">
            {it.label}
          </span>
          <span className="text-xl font-bold text-gray-100 block mt-2">
            {it.value}
          </span>
        </div>
      ))}
    </div>
  );
};
