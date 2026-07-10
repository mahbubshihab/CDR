import React from 'react';

interface LocationTagsProps {
  locations: Array<{ name: string; count: number }>;
}

export const LocationTags: React.FC<LocationTagsProps> = ({ locations }) => {
  return (
    <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-4 space-y-3 text-left">
      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono block">
        Location Intelligence
      </span>
      <div className="flex flex-wrap gap-2">
        {locations.map((loc, idx) => (
          <span 
            key={idx} 
            className="px-2 py-1 bg-[#121212] border border-[#2e2e2e] text-gray-300 text-[10px] font-mono rounded-md font-semibold hover:border-gray-500 transition-colors"
          >
            {loc.name} ({loc.count})
          </span>
        ))}
        {locations.length === 0 && (
          <span className="text-xs text-gray-500 font-mono">No cell locations logged.</span>
        )}
      </div>
    </div>
  );
};
