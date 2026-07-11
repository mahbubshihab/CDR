import React from 'react';
import type { CountryAggregate } from '../types';

interface CountryClustersProps {
  countries: CountryAggregate[];
}

export const CountryClusters: React.FC<CountryClustersProps> = ({ countries }) => {
  if (countries.length === 0) return null;

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden mt-6">
      <div className="p-4 border-b border-[#334155] bg-[#0f172a]/50">
        <h3 className="text-sm font-semibold text-gray-200">Country Clusters</h3>
      </div>
      
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {countries.map((c) => (
          <div key={c.country} className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-4 flex flex-col justify-between hover:border-[#334155] transition-colors">
            <div>
              <h4 className="text-[#38bdf8] text-sm font-bold mb-1">
                {c.country} Cluster
              </h4>
              <p className="text-xs text-gray-400 mb-3">
                {c.numbers.length} numbers • {c.totalComms} comms
              </p>
            </div>
            <p className="text-[10px] text-gray-500 font-mono break-words leading-relaxed">
              {c.numbers.join(', ')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
