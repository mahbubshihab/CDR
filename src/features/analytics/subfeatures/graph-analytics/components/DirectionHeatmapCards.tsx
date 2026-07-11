import React, { useMemo, useState } from 'react';
import { type CDRRecord } from '../../../../../utils/db';
import { ExportableChartCard } from '../../../../../components/ui/ExportableChartCard';
import { parseCDRTimestamp } from '../../advanced-analysis/AdvancedCDRAnalysis';

interface DirectionHeatmapCardsProps {
  records: CDRRecord[];
}

export const DirectionHeatmapCards: React.FC<DirectionHeatmapCardsProps> = ({ records }) => {
  const [hoveredDir, setHoveredDir] = useState<{ label: string; count: number; pct: string } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: number; count: number } | null>(null);

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
            const d = parseCDRTimestamp(r.timestamp);
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
      <ExportableChartCard
        title="Call Direction Analysis"
        exportData={callDirection}
      >
        <div className="space-y-4 my-2 text-xs font-mono relative">
          <div 
            className="space-y-1 cursor-pointer p-1 rounded hover:bg-[#2e2e2e]/30 transition-colors"
            onMouseEnter={() => setHoveredDir({ label: 'Outgoing Voice Calls', count: callDirection.calls, pct: callDirection.callsPct })}
            onMouseLeave={() => setHoveredDir(null)}
          >
            <div className="flex justify-between text-gray-300">
              <span className="text-gray-200">Outgoing Voice Calls</span>
              <strong className="text-white">{callDirection.calls} ({callDirection.callsPct}%)</strong>
            </div>
            <div className="w-full h-2 bg-[#121212] border border-[#2e2e2e] rounded-full overflow-hidden">
              <div className="bg-[#3ecf8e] h-full" style={{ width: `${callDirection.callsPct}%` }} />
            </div>
          </div>

          <div 
            className="space-y-1 cursor-pointer p-1 rounded hover:bg-[#2e2e2e]/30 transition-colors"
            onMouseEnter={() => setHoveredDir({ label: 'Outgoing SMS Activities', count: callDirection.sms, pct: callDirection.smsPct })}
            onMouseLeave={() => setHoveredDir(null)}
          >
            <div className="flex justify-between text-gray-300">
              <span className="text-gray-200">Outgoing SMS Activities</span>
              <strong className="text-white">{callDirection.sms} ({callDirection.smsPct}%)</strong>
            </div>
            <div className="w-full h-2 bg-[#121212] border border-[#2e2e2e] rounded-full overflow-hidden">
              <div className="bg-[#8b5cf6] h-full" style={{ width: `${callDirection.smsPct}%` }} />
            </div>
          </div>

          {/* Interactive Floating Tooltip */}
          {hoveredDir && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[#171717] border border-gray-600 rounded-lg p-2 text-[10px] font-mono text-white shadow-xl z-20 pointer-events-none">
              <span className="block text-gray-400 font-bold">{hoveredDir.label}</span>
              <span className="block text-[#3ecf8e] font-semibold mt-0.5">Events: {hoveredDir.count} ({hoveredDir.pct}%)</span>
            </div>
          )}
        </div>
      </ExportableChartCard>

      {/* 8. Call Activity Heatmap */}
      <ExportableChartCard
        title="Call Activity Heatmap"
        exportData={heatmapData.grid}
        subdetails={
          <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-gray-400 font-mono">
            <span className="h-2 w-2 rounded bg-[#1e1e1e] border border-[#2e2e2e]" /><span>Idle</span>
            <span className="h-2 w-2 rounded bg-[#3ecf8e]/30" /><span>Low</span>
            <span className="h-2 w-2 rounded bg-[#3ecf8e]/70" /><span>Medium</span>
            <span className="h-2 w-2 rounded bg-[#3ecf8e]" /><span>Peak</span>
          </div>
        }
      >
        {/* Heatmap Grid Wrapper */}
        <div className="overflow-x-auto custom-scrollbar pt-4 pb-2 relative">
          <div className="min-w-[480px] space-y-1 text-[10px] font-mono">
            {/* Hour Labels Header */}
            <div className="flex pl-8 text-gray-400">
              {Array(24).fill(0).map((_, idx) => (
                <span key={idx} className="flex-1 text-center font-bold">{idx}</span>
              ))}
            </div>

            {/* Grid Rows */}
            {daysList.map((day, dIdx) => (
              <div key={dIdx} className="flex items-center">
                <span className="w-8 text-gray-300 text-left font-bold">{day}</span>
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
                        className={`flex-1 h-5 rounded-sm border flex items-center justify-center transition-colors hover:border-white cursor-pointer ${color}`}
                        style={{ backgroundColor: val > 0 ? undefined : '#121212' }}
                        onMouseEnter={() => setHoveredCell({ day, hour: hIdx, count: val })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {val > 0 ? val : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Floating Tooltip */}
          {hoveredCell && (
            <div 
              className="absolute bg-[#171717] border border-gray-600 rounded-lg p-2 text-[10px] font-mono text-white shadow-xl z-20 pointer-events-none"
              style={{
                left: '50%',
                top: '5%',
                transform: 'translateX(-50%)'
              }}
            >
              <span className="block text-gray-400 font-bold">{hoveredCell.day} {hoveredCell.hour.toString().padStart(2, '0')}:00</span>
              <span className="block text-[#3ecf8e] font-semibold mt-0.5">Events: {hoveredCell.count}</span>
            </div>
          )}
        </div>
      </ExportableChartCard>
    </>
  );
};
