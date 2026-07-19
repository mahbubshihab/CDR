import React, { useMemo } from 'react';
import { UserCheck } from 'lucide-react';
import { type CDRRecord } from '../../../../../utils/db';

export const InvestigationLinks: React.FC<any> = ({ records, targetNumber }) => {
  const topLinks = useMemo(() => {
    const counts = new Map<string, number>();
    records.forEach((r: any) => {
      const bParty = r.otherParty;
      if (bParty) {
        counts.set(bParty, (counts.get(bParty) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);
  }, [records]);

  return (
    <div className="bg-[#121212] border border-[#2e2e2e] rounded-md p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <UserCheck className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-bold text-white">Investigation Links</h3>
      </div>
      
      <div className="flex flex-wrap gap-1.5">
        {topLinks.map(([bParty, count]) => (
          <div 
            key={bParty} 
            className="bg-[#1c1c1c] border border-[#2e2e2e] hover:border-gray-500 rounded px-2 py-1 text-[11px] text-gray-300 transition-colors cursor-pointer font-mono"
          >
            {targetNumber || 'TARGET'} ↔ {bParty} <span className="text-gray-500 ml-1">({count})</span>
          </div>
        ))}
        {topLinks.length === 0 && (
          <div className="text-xs text-gray-500 italic">No links available in current view.</div>
        )}
      </div>
    </div>
  );
};
