import React, { useMemo } from 'react';
import { UserCheck } from 'lucide-react';
import { type CDRRecord } from '../../../../../utils/db';

export const InvestigationLinks: React.FC<any> = ({ records, targetNumber }) => {
  const topLinks = useMemo(() => {
    const counts = new Map<string, number>();
    records.forEach(r => {
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
    <div className="bg-[#131f37] border border-slate-700/60 rounded-md p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <UserCheck className="w-4 h-4 text-slate-300" />
        <h3 className="text-sm font-bold text-white">Investigation Links</h3>
      </div>
      
      <div className="flex flex-wrap gap-1.5">
        {topLinks.map(([bParty, count]) => (
          <div 
            key={bParty} 
            className="bg-[#0a1120] border border-slate-700/80 hover:border-slate-500 rounded px-2 py-1 text-[11px] text-slate-300 transition-colors cursor-pointer font-mono"
          >
            {targetNumber || 'TARGET'} ↔ {bParty} <span className="text-slate-500 ml-1">({count})</span>
          </div>
        ))}
        {topLinks.length === 0 && (
          <div className="text-xs text-slate-500 italic">No links available in current view.</div>
        )}
      </div>
    </div>
  );
};
