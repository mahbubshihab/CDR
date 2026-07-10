import React, { useMemo } from 'react';
import { type CDRRecord } from '../../../../../utils/db';
import { Download, Camera, Printer, Maximize2, PhoneCall, MapPin } from 'lucide-react';

interface FrequencyLocationCardsProps {
  records: CDRRecord[];
}

const CardActions = () => (
  <div className="flex items-center gap-1.5 shrink-0 opacity-40 hover:opacity-100 transition-opacity">
    <button className="p-1 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-250 rounded transition-colors cursor-pointer" title="Download data">
      <Download className="h-3 w-3" />
    </button>
    <button className="p-1 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-250 rounded transition-colors cursor-pointer" title="Screenshot">
      <Camera className="h-3 w-3" />
    </button>
    <button className="p-1 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-250 rounded transition-colors cursor-pointer" title="Print">
      <Printer className="h-3 w-3" />
    </button>
    <button className="p-1 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-250 rounded transition-colors cursor-pointer" title="Maximize">
      <Maximize2 className="h-3 w-3" />
    </button>
  </div>
);

export const FrequencyLocationCards: React.FC<FrequencyLocationCardsProps> = ({ records }) => {
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
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between text-left">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Contact Frequency</h3>
          <CardActions />
        </div>

        <div className="space-y-3.5 mt-4 text-xs font-mono">
          {contactFrequency.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-gray-300">
                <span className="flex items-center gap-1.5 text-gray-400">
                  <PhoneCall className="h-3.5 w-3.5 text-gray-500" />
                  <span>{item.number}</span>
                </span>
                <span className="font-semibold text-gray-255">{item.count} ({item.pct}%)</span>
              </div>
              <div className="w-full h-1.5 bg-[#121212] border border-[#2e2e2e] rounded-full overflow-hidden">
                <div className="bg-[#3ecf8e] h-full" style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 10. Top Location Activity */}
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between text-left">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Top Location Activity</h3>
          <CardActions />
        </div>

        <div className="space-y-3.5 mt-4 text-xs font-mono">
          {locationActivity.length > 0 ? (
            locationActivity.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-gray-300">
                  <span className="flex items-center gap-1.5 text-gray-400 truncate max-w-[200px]" title={item.address}>
                    <MapPin className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    <span className="truncate">{item.address}</span>
                  </span>
                  <span className="font-semibold text-gray-255 shrink-0">{item.count} ({item.pct}%)</span>
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
        </div>
      </div>
    </>
  );
};
