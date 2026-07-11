import React from 'react';
import type { CountryAggregate } from '../types';

interface CountryMapSummaryProps {
  countries: CountryAggregate[];
}

export const CountryMapSummary: React.FC<CountryMapSummaryProps> = ({ countries }) => {
  if (countries.length === 0) return null;

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden mt-6 mb-10">
      <div className="p-4 border-b border-[#334155] bg-[#0f172a]/50">
        <h3 className="text-sm font-semibold text-gray-200">Country Map Summary</h3>
      </div>
      
      <div className="p-5 flex flex-wrap gap-3">
        {countries.map((c) => (
          <div 
            key={c.country} 
            className="flex items-center gap-2 bg-[#0f172a] border border-[#1e293b] rounded-md py-1.5 px-3"
          >
            <span className="text-[10px] font-bold text-[#38bdf8] bg-[#0f172a] border border-[#38bdf8]/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
              {c.code}
            </span>
            <span className="text-xs font-semibold text-gray-200">
              {c.country}
            </span>
            <span className="text-xs text-gray-500">
              {c.numbers.length} · {c.totalComms} comms
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
