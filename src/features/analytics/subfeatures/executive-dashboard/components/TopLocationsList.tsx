import React from 'react';

interface TopLocationsListProps {
  locations: Array<{ name: string; count: number }>;
  totalRecords: number;
  onOpenLocations: () => void;
}

export const TopLocationsList: React.FC<TopLocationsListProps> = ({ 
  locations, totalRecords, onOpenLocations 
}) => {
  const maxVal = locations[0]?.count || 1;

  return (
    <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 space-y-4 text-left font-mono">
      <div className="flex justify-between items-center border-b border-[#2e2e2e]/55 pb-3">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">
          Locations (Top 10)
        </span>
        <button 
          onClick={onOpenLocations} 
          className="text-xs text-[#3ecf8e] hover:underline font-semibold cursor-pointer"
        >
          Open Location Summary &rarr;
        </button>
      </div>

      <div className="space-y-3.5">
        {locations.map((loc, idx) => {
          const pct = ((loc.count / (totalRecords || 1)) * 100).toFixed(1);
          const barWidth = ((loc.count / maxVal) * 100).toFixed(0);
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-[11px] text-gray-300">
                <span className="truncate max-w-[280px] sm:max-w-md">#{idx + 1} {loc.name}</span>
                <span className="shrink-0">{loc.count} hits ({pct}%)</span>
              </div>
              <div className="w-full h-2 bg-[#121212] rounded-full overflow-hidden">
                <div 
                  className="bg-[#3ecf8e]/85 h-full rounded-full" 
                  style={{ width: `${barWidth}%` }} 
                />
              </div>
            </div>
          );
        })}
        {locations.length === 0 && (
          <div className="text-center py-6 text-gray-600 text-xs">
            No location coordinates recorded.
          </div>
        )}
      </div>
    </div>
  );
};
