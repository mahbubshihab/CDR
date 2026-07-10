import React, { useMemo } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { MapPin, Clock, Navigation, Map } from 'lucide-react';

interface LocationSummaryProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

export const LocationSummary: React.FC<LocationSummaryProps> = ({ cdrFile, records }) => {
  // Compute chronological path transitions
  const pathTransitions = useMemo(() => {
    const list: { 
      address: string; 
      lac: number; 
      cellId: number; 
      entryTime: string; 
      exitTime: string;
      count: number;
    }[] = [];

    let currentVisit: typeof list[0] | null = null;

    records.forEach(r => {
      const addr = r.address || 'Unknown Cell Location';
      const lac = r.lac || 0;
      const cellId = r.cellId || 0;

      // Format time
      const timeStr = String(r.timestamp);
      let dateStr = timeStr;
      if (timeStr.length === 14) {
        const y = timeStr.substring(0, 4);
        const m = timeStr.substring(4, 6);
        const d = timeStr.substring(6, 8);
        const hr = timeStr.substring(8, 10);
        const min = timeStr.substring(10, 12);
        dateStr = `${d}/${m}/${y} ${hr}:${min}`;
      } else {
        try {
          const d = new Date(r.timestamp);
          if (!isNaN(d.getTime())) {
            dateStr = d.toLocaleString();
          }
        } catch (_) {}
      }

      if (!currentVisit || currentVisit.address !== addr) {
        if (currentVisit) {
          list.push(currentVisit);
        }
        currentVisit = {
          address: addr,
          lac,
          cellId,
          entryTime: dateStr,
          exitTime: dateStr,
          count: 1
        };
      } else {
        currentVisit.exitTime = dateStr;
        currentVisit.count++;
      }
    });

    if (currentVisit) {
      list.push(currentVisit);
    }

    return list;
  }, [records]);

  return (
    <div className="w-full h-full overflow-y-auto p-6 space-y-6 custom-scrollbar text-left bg-[#121212] animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="border-b border-[#2e2e2e] pb-4">
        <h2 className="text-sm font-semibold text-gray-200">Chronological Location Summary</h2>
        <p className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-wider">
          SUSPECT cell tower path transitions and dwell durations log for target: <strong className="text-gray-300 font-mono font-bold">{cdrFile.phoneNumber}</strong>
        </p>
      </div>

      {/* Main Path Timeline */}
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-6 relative">
        <div className="flex items-center gap-2 border-b border-[#2e2e2e]/55 pb-3 mb-6">
          <Navigation className="h-4.5 w-4.5 text-[#3ecf8e]" />
          <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Physical Movement Transitions Log</h3>
        </div>

        {/* Timeline body */}
        <div className="relative pl-4 space-y-6">
          {/* Vertical path line */}
          <div className="absolute top-2 bottom-2 left-6 w-0.5 bg-[#2e2e2e]" />

          {pathTransitions.length > 0 ? (
            pathTransitions.map((visit, idx) => (
              <div key={idx} className="relative pl-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Node marker */}
                <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full bg-[#1e1e1e] border-2 border-[#3ecf8e] z-10" />

                <div className="space-y-1 max-w-xl text-left">
                  <span className="text-[10px] text-gray-500 font-mono font-semibold uppercase tracking-wider">
                    Location Step #{idx + 1}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Map className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    <strong className="text-xs text-gray-200 font-sans">{visit.address}</strong>
                  </div>
                  <div className="flex gap-4 text-[10px] text-gray-450 font-mono pt-1">
                    <span>LAC: <strong>{visit.lac}</strong></span>
                    <span>Cell ID: <strong>{visit.cellId}</strong></span>
                    <span>Hits: <strong>{visit.count}</strong></span>
                  </div>
                </div>

                {/* Date timings */}
                <div className="text-left md:text-right font-mono text-[10px] text-gray-500 space-y-0.5 shrink-0">
                  <div className="flex md:justify-end gap-1.5 items-center">
                    <Clock className="h-3 w-3 text-gray-500" />
                    <span>ARRIVED: <strong className="text-gray-300 font-semibold">{visit.entryTime}</strong></span>
                  </div>
                  <div className="flex md:justify-end gap-1.5 items-center">
                    <Clock className="h-3 w-3 text-gray-500" />
                    <span>DEPARTED: <strong className="text-gray-300 font-semibold">{visit.exitTime}</strong></span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-12 text-xs">
              No physical location transition logs recorded.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
