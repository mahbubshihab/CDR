import React, { useMemo, useState } from 'react';
import { type CDRRecord } from '../../../../../utils/db';
import { ExportableChartCard } from '../../../../../components/ui/ExportableChartCard';
import { PhoneCall, MapPin } from 'lucide-react';

interface FrequencyLocationCardsProps {
  records: CDRRecord[];
}

export const FrequencyLocationCards: React.FC<FrequencyLocationCardsProps> = ({ records }) => {
  const [hoveredContact, setHoveredContact] = useState<{ number: string; count: number; pct: string } | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<{ address: string; count: number; pct: string } | null>(null);

  // 9. Contact Frequency
  const contactFrequency = useMemo(() => {
    const map: { [num: string]: number } = {};
    records.forEach(r => {
      if (r.otherParty) {
        map[r.otherParty] = (map[r.otherParty] || 0) + 1;
      }
    });
    const sorted = Object.entries(map)
      .map(([number, count]) => ({ number, count }))
      .sort((a, b) => b.count - a.count);

    const total = sorted.reduce((sum, item) => sum + item.count, 0) || 1;
    return sorted.slice(0, 6).map(item => ({
      ...item,
      pct: ((item.count / total) * 100).toFixed(1)
    }));
  }, [records]);

  // 10. Top Location Activity
  const locationActivity = useMemo(() => {
    const map: { [addr: string]: number } = {};
    records.forEach(r => {
      if (r.address) {
        map[r.address] = (map[r.address] || 0) + 1;
      }
    });
    const sorted = Object.entries(map)
      .map(([address, count]) => ({ address, count }))
      .sort((a, b) => b.count - a.count);

    const total = sorted.reduce((sum, item) => sum + item.count, 0) || 1;
    return sorted.slice(0, 6).map(item => ({
      ...item,
      pct: ((item.count / total) * 100).toFixed(1)
    }));
  }, [records]);

  return (
    <>
      {/* 9. Contact Frequency */}
      <ExportableChartCard
        title="Contact Frequency"
        exportData={contactFrequency}
      >
        <div className="space-y-3.5 mt-4 text-xs font-mono relative">
          {contactFrequency.map((item, idx) => (
            <div 
              key={idx} 
              className="space-y-1 cursor-pointer p-1 rounded hover:bg-[#2e2e2e]/30 transition-colors"
              onMouseEnter={() => setHoveredContact(item)}
              onMouseLeave={() => setHoveredContact(null)}
            >
              <div className="flex justify-between items-center text-gray-300">
                <span className="flex items-center gap-1.5 text-gray-200">
                  <PhoneCall className="h-3.5 w-3.5 text-gray-400" />
                  <span>{item.number}</span>
                </span>
                <span className="font-semibold text-white">{item.count} ({item.pct}%)</span>
              </div>
              <div className="w-full h-1.5 bg-[#121212] border border-[#2e2e2e] rounded-full overflow-hidden">
                <div className="bg-[#3ecf8e] h-full" style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}

          {/* Interactive Floating Tooltip */}
          {hoveredContact && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#171717] border border-gray-600 rounded-lg p-2.5 text-[10px] font-mono text-white shadow-xl z-20 pointer-events-none">
              <span className="block text-gray-400 font-bold">Contact Frequency Details</span>
              <span className="block text-gray-200 mt-0.5">B-Party Number: {hoveredContact.number}</span>
              <span className="block text-[#3ecf8e] font-semibold mt-0.5">Interactions: {hoveredContact.count} ({hoveredContact.pct}%)</span>
            </div>
          )}
        </div>
      </ExportableChartCard>

      {/* 10. Top Location Activity */}
      <ExportableChartCard
        title="Top Location Activity"
        exportData={locationActivity}
      >
        <div className="space-y-3.5 mt-4 text-xs font-mono relative">
          {locationActivity.length > 0 ? (
            locationActivity.map((item, idx) => (
              <div 
                key={idx} 
                className="space-y-1 cursor-pointer p-1 rounded hover:bg-[#2e2e2e]/30 transition-colors"
                onMouseEnter={() => setHoveredLocation(item)}
                onMouseLeave={() => setHoveredLocation(null)}
              >
                <div className="flex justify-between items-center text-gray-300">
                  <span className="flex items-center gap-1.5 text-gray-255 truncate max-w-[200px]" title={item.address}>
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{item.address}</span>
                  </span>
                  <span className="font-semibold text-white shrink-0">{item.count} ({item.pct}%)</span>
                </div>
                <div className="w-full h-1.5 bg-[#121212] border border-[#2e2e2e] rounded-full overflow-hidden">
                  <div className="bg-[#8b5cf6] h-full" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))
          ) : (
            <div className="h-44 flex items-center justify-center text-gray-500">
              No cell tower address logs.
            </div>
          )}

          {/* Interactive Floating Tooltip */}
          {hoveredLocation && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#171717] border border-gray-600 rounded-lg p-2.5 text-[10px] font-mono text-white shadow-xl z-20 pointer-events-none">
              <span className="block text-gray-400 font-bold">Location Frequency Details</span>
              <span className="block text-gray-200 mt-0.5 truncate max-w-xs">{hoveredLocation.address}</span>
              <span className="block text-[#8b5cf6] font-semibold mt-0.5">Hits Count: {hoveredLocation.count} ({hoveredLocation.pct}%)</span>
            </div>
          )}
        </div>
      </ExportableChartCard>
    </>
  );
};
