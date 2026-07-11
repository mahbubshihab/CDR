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
    { label: 'Incoming', value: incoming, sublabel: 'Total Incoming Calls' },
    { label: 'Outgoing', value: outgoing, sublabel: 'Total Outgoing Calls' },
    { label: 'SMS', value: sms, sublabel: 'Total SMS Count' },
    { label: 'B-Parties', value: bParties, sublabel: 'Unique Interacting Contacts' },
    { label: 'Locations', value: locations, sublabel: 'Unique Cell Towers' },
    { label: 'Calls', value: calls, sublabel: 'Total Call Activities' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {items.map((it, idx) => (
        <div 
          key={idx} 
          className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-4 flex flex-col justify-between text-left font-mono"
        >
          <div>
            <span className="text-2xl font-bold text-gray-100 block">
              {it.value.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block mt-1 font-bold">
              {it.label}
            </span>
          </div>
          <span className="text-[9px] text-gray-600 mt-3 block font-semibold">
            {it.sublabel}
          </span>
        </div>
      ))}
    </div>
  );
};
