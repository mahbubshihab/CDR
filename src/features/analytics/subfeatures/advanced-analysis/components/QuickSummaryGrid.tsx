import React from 'react';

interface QuickSummaryGridProps {
  targetOperator: string;
  totalCalls: number;
  totalSMS: number;
  totalContacts: number;
  totalImeis: number;
  totalImsis: number;
  totalLocations: number;
  totalActiveDays: number;
  internationalContacts: number;
  ownershipFound: string | number;
}

export const QuickSummaryGrid: React.FC<QuickSummaryGridProps> = ({
  targetOperator,
  totalCalls,
  totalSMS,
  totalContacts,
  totalImeis,
  totalImsis,
  totalLocations,
  totalActiveDays,
  internationalContacts,
  ownershipFound
}) => {
  const items = [
    { label: 'Target Operator', value: targetOperator, subtitle: 'Suspect carrier' },
    { label: 'Total Calls', value: totalCalls, subtitle: 'MOC + MTC' },
    { label: 'Total SMS', value: totalSMS, subtitle: 'SMS logs' },
    { label: 'Total Contacts', value: totalContacts, subtitle: 'Unique B-parties' },
    { label: 'Total IMEIs', value: totalImeis, subtitle: 'Handset swaps' },
    { label: 'Total IMSIs', value: totalImsis, subtitle: 'SIM card swaps' },
    { label: 'Total Locations', value: totalLocations, subtitle: 'Unique cell towers' },
    { label: 'Total Active Days', value: totalActiveDays, subtitle: 'Active calendar dates' },
    { label: 'International Contacts', value: internationalContacts, subtitle: 'Cross-border numbers' },
    { label: 'Ownership Found', value: ownershipFound, subtitle: 'Biometrically resolved' }
  ];

  return (
    <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 space-y-4 text-left font-mono">
      <span className="text-[10px] text-[#3ecf8e] font-bold uppercase tracking-wider block">
        Quick Investigation Summary
      </span>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {items.map((it, idx) => (
          <div 
            key={idx} 
            className="bg-[#121212]/40 border border-[#2e2e2e]/60 rounded-lg p-4 flex flex-col justify-between"
          >
            <div>
              <span className="text-xl font-bold text-gray-100 block">{it.value}</span>
              <span className="text-[10px] text-gray-400 font-semibold block mt-1.5">{it.label}</span>
            </div>
            <span className="text-[8px] text-gray-600 font-medium block mt-1">{it.subtitle}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
