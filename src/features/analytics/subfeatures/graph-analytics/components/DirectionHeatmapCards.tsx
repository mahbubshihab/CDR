import React, { useMemo } from 'react';
import { type CDRRecord } from '../../../../../utils/db';
import { Download, Camera, Printer, Maximize2 } from 'lucide-react';

interface DirectionHeatmapCardsProps {
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

export const DirectionHeatmapCards: React.FC<DirectionHeatmapCardsProps> = ({ records }) => {
  // 7. Call Direction Analysis
  const callDirection = useMemo(() => {
    let outgoingCalls = 0;
    let outgoingSMS = 0;
    records.forEach(r => {
      const type = r.usageType.toLowerCase();
      if (type.includes('moc') || type.includes('outgoing')) {
        if (type.includes('sms')) {
          outgoingSMS++;
        } else {
          outgoingCalls++;
        }
      }
    });
    const total = outgoingCalls + outgoingSMS || 1;
    return {
      calls: outgoingCalls,
      sms: outgoingSMS,
      callsPct: ((outgoingCalls / total) * 100).toFixed(1),
      smsPct: ((outgoingSMS / total) * 100).toFixed(1)
    };
  }, [records]);

  // 8. Call Activity Heatmap Data
  const heatmapData = useMemo(() => {
    const grid = Array(7).fill(0).map(() => Array(24).fill(0));
    
    records.forEach(r => {
      if (r.timestamp) {
        const timeStr = String(r.timestamp);
        let hr = -1;
        let dayIdx = -1;
        if (timeStr.length === 14) {
          hr = parseInt(timeStr.substring(8, 10), 10);
          const y = parseInt(timeStr.substring(0, 4), 10);
          const m = parseInt(timeStr.substring(4, 6), 10) - 1;
          const d = parseInt(timeStr.substring(6, 8), 10);
          dayIdx = new Date(y, m, d).getDay();
        } else {
          try {
            const d = new Date(r.timestamp);
            if (!isNaN(d.getTime())) {
              hr = d.getHours();
              dayIdx = d.getDay();
            }
          } catch (_) {}
        }
        
        if (hr >= 0 && hr < 24 && dayIdx >= 0 && dayIdx < 7) {
          const displayIdx = dayIdx === 0 ? 6 : dayIdx - 1;
          grid[displayIdx][hr]++;
        }
      }
    });

    let maxCellVal = 0;
    grid.forEach(row => {
      row.forEach(val => {
        if (val > maxCellVal) maxCellVal = val;
      });
    });

    return { grid, maxCellVal: maxCellVal || 1 };
  }, [records]);

  const daysList = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <>
      {/* 7. Call Direction Analysis */}
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between text-left">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Call Direction Analysis</h3>
          <CardActions />
        </div>

        <div className="space-y-4 my-2 text-xs font-mono">
          <div className="space-y-1">
            <div className="flex justify-between text-gray-400">
              <span>Outgoing Voice Calls</span>
              <strong className="text-gray-200">{callDirection.calls} ({callDirection.callsPct}%)</strong>
            </div>
            <div className="w-full h-2 bg-[#121212] border border-[#2e2e2e] rounded-full overflow-hidden">
              <div className="bg-[#3ecf8e] h-full" style={{ width: `${callDirection.callsPct}%` }} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-gray-400">
              <span>Outgoing SMS Activities</span>
              <strong className="text-gray-200">{callDirection.sms} ({callDirection.smsPct}%)</strong>
            </div>
            <div className="w-full h-2 bg-[#121212] border border-[#2e2e2e] rounded-full overflow-hidden">
              <div className="bg-[#8b5cf6] h-full" style={{ width: `${callDirection.smsPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 8. Call Activity Heatmap */}
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between text-left">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Call Activity Heatmap</h3>
            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-gray-500 font-mono">
              <span className="h-2 w-2 rounded bg-[#1e1e1e] border border-[#2e2e2e]" /><span>Idle</span>
              <span className="h-2 w-2 rounded bg-[#3ecf8e]/30" /><span>Low</span>
              <span className="h-2 w-2 rounded bg-[#3ecf8e]/70" /><span>Medium</span>
              <span className="h-2 w-2 rounded bg-[#3ecf8e]" /><span>Peak</span>
            </div>
          </div>
          <CardActions />
        </div>

        {/* Heatmap Grid Wrapper */}
        <div className="overflow-x-auto custom-scrollbar pt-4 pb-2">
          <div className="min-w-[480px] space-y-1 text-[10px] font-mono">
            {/* Hour Labels Header */}
            <div className="flex pl-8 text-gray-500">
              {Array(24).fill(0).map((_, idx) => (
                <span key={idx} className="flex-1 text-center font-bold">{idx}</span>
              ))}
            </div>

            {/* Grid Rows */}
            {daysList.map((day, dIdx) => (
              <div key={dIdx} className="flex items-center">
                <span className="w-8 text-gray-400 text-left font-bold">{day}</span>
                <div className="flex-1 flex gap-0.5">
                  {Array(24).fill(0).map((_, hIdx) => {
                    const val = heatmapData.grid[dIdx][hIdx] || 0;
                    const pct = val / heatmapData.maxCellVal;
                    let color = 'bg-[#121212] border-[#2e2e2e]';
                    if (val > 0) {
                      if (pct <= 0.3) color = 'bg-[#3ecf8e]/25 text-[#3ecf8e]';
                      else if (pct <= 0.6) color = 'bg-[#3ecf8e]/55 text-white';
                      else color = 'bg-[#3ecf8e] text-gray-950 font-bold';
                    }
                    return (
                      <div
                        key={hIdx}
                        className={`flex-1 h-5 rounded-sm border flex items-center justify-center transition-colors hover:border-[#3ecf8e] cursor-pointer ${color}`}
                        style={{ backgroundColor: val > 0 ? undefined : '#121212' }}
                        title={`${day} ${hIdx.toString().padStart(2,'0')}:00 - ${val} events`}
                      >
                        {val > 0 ? val : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
