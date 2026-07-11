import React, { useMemo, useState } from 'react';
import { type CDRRecord } from '../../../../../utils/db';
import { ExportableChartCard } from '../../../../../components/ui/ExportableChartCard';

interface TypeDurationCardsProps {
  records: CDRRecord[];
}

export const TypeDurationCards: React.FC<TypeDurationCardsProps> = ({ records }) => {
  const [hoveredSlice, setHoveredSlice] = useState<{ label: string; count: number; pct: string } | null>(null);
  const [hoveredBar, setHoveredBar] = useState<{ name: string; count: number; pct: string } | null>(null);

  // 3. Call Type Distribution (MOC vs MTC vs SMS)
  const callTypeDistribution = useMemo(() => {
    let incoming = 0;
    let outgoing = 0;
    let sms = 0;
    records.forEach(r => {
      const type = r.usageType.toLowerCase();
      if (type.includes('sms')) sms++;
      else if (type.includes('mtc') || type.includes('incoming')) incoming++;
      else if (type.includes('moc') || type.includes('outgoing')) outgoing++;
      else outgoing++;
    });
    const total = incoming + outgoing + sms || 1;
    return {
      incoming,
      outgoing,
      sms,
      incomingPct: ((incoming / total) * 100).toFixed(1),
      outgoingPct: ((outgoing / total) * 100).toFixed(1),
      smsPct: ((sms / total) * 100).toFixed(1),
      total
    };
  }, [records]);

  // 4. Call Duration Distribution (0-30s, 30s-1m, 1-5m, 5-15m, 15m+)
  const durationDistribution = useMemo(() => {
    let range1 = 0;
    let range2 = 0;
    let range3 = 0;
    let range4 = 0;
    let range5 = 0;

    records.forEach(r => {
      if (r.usageType.toLowerCase().includes('sms')) return;
      const d = r.duration || 0;
      if (d <= 30) range1++;
      else if (d <= 60) range2++;
      else if (d <= 300) range3++;
      else if (d <= 900) range4++;
      else range5++;
    });
    const total = range1 + range2 + range3 + range4 + range5 || 1;
    return [
      { name: '0-30s', count: range1, pct: ((range1 / total) * 100).toFixed(1), color: '#3b82f6' },
      { name: '30s-1m', count: range2, pct: ((range2 / total) * 100).toFixed(1), color: '#8b5cf6' },
      { name: '1-5m', count: range3, pct: ((range3 / total) * 100).toFixed(1), color: '#f59e0b' },
      { name: '5-15m', count: range4, pct: ((range4 / total) * 100).toFixed(1), color: '#10b981' },
      { name: '15m+', count: range5, pct: ((range5 / total) * 100).toFixed(1), color: '#ec4899' },
    ];
  }, [records]);

  return (
    <>
      {/* 3. Call Type Distribution */}
      <ExportableChartCard
        title="Call Type Distribution"
        exportData={callTypeDistribution}
      >
        <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
          {/* Donut Chart SVG */}
          <div className="relative h-32 w-32 shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2e2e2e" strokeWidth="3" />
              
              {(() => {
                const t = callTypeDistribution;
                const totalVal = t.total;
                const inStroke = (t.incoming / totalVal) * 100;
                const outStroke = (t.outgoing / totalVal) * 100;
                const smsStroke = (t.sms / totalVal) * 100;

                return (
                  <>
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3ecf8e" strokeWidth="3.5"
                      strokeDasharray={`${inStroke} ${100 - inStroke}`}
                      strokeDashoffset="0"
                      className="cursor-pointer hover:stroke-white transition-all duration-150"
                      onMouseEnter={() => setHoveredSlice({ label: 'Incoming', count: t.incoming, pct: t.incomingPct })}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#8b5cf6" strokeWidth="3.5"
                      strokeDasharray={`${outStroke} ${100 - outStroke}`}
                      strokeDashoffset={`-${inStroke}`}
                      className="cursor-pointer hover:stroke-white transition-all duration-150"
                      onMouseEnter={() => setHoveredSlice({ label: 'Outgoing', count: t.outgoing, pct: t.outgoingPct })}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3.5"
                      strokeDasharray={`${smsStroke} ${100 - smsStroke}`}
                      strokeDashoffset={`-${inStroke + outStroke}`}
                      className="cursor-pointer hover:stroke-white transition-all duration-150"
                      onMouseEnter={() => setHoveredSlice({ label: 'SMS', count: t.sms, pct: t.smsPct })}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                  </>
                );
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-base font-bold text-white font-mono leading-none">
                {hoveredSlice ? hoveredSlice.count : callTypeDistribution.total}
              </span>
              <span className="text-[9px] text-[#3ecf8e] uppercase tracking-wider mt-1 font-semibold">
                {hoveredSlice ? hoveredSlice.label : "Logs"}
              </span>
              {hoveredSlice && (
                <span className="text-[9px] text-gray-400 font-mono mt-0.5">{hoveredSlice.pct}%</span>
              )}
            </div>
          </div>

          {/* Legends */}
          <div className="flex-1 space-y-2.5 w-full text-xs font-mono">
            <div 
              className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-[#2e2e2e]/50"
              onMouseEnter={() => setHoveredSlice({ label: 'Incoming', count: callTypeDistribution.incoming, pct: callTypeDistribution.incomingPct })}
              onMouseLeave={() => setHoveredSlice(null)}
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#3ecf8e]" />
                <span className="text-gray-300">Incoming Calls</span>
              </div>
              <span className="text-white font-semibold">{callTypeDistribution.incoming} ({callTypeDistribution.incomingPct}%)</span>
            </div>
            <div 
              className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-[#2e2e2e]/50"
              onMouseEnter={() => setHoveredSlice({ label: 'Outgoing', count: callTypeDistribution.outgoing, pct: callTypeDistribution.outgoingPct })}
              onMouseLeave={() => setHoveredSlice(null)}
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#8b5cf6]" />
                <span className="text-gray-300">Outgoing Calls</span>
              </div>
              <span className="text-white font-semibold">{callTypeDistribution.outgoing} ({callTypeDistribution.outgoingPct}%)</span>
            </div>
            <div 
              className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-[#2e2e2e]/50"
              onMouseEnter={() => setHoveredSlice({ label: 'SMS', count: callTypeDistribution.sms, pct: callTypeDistribution.smsPct })}
              onMouseLeave={() => setHoveredSlice(null)}
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
                <span className="text-gray-300">SMS Activity</span>
              </div>
              <span className="text-white font-semibold">{callTypeDistribution.sms} ({callTypeDistribution.smsPct}%)</span>
            </div>
          </div>
        </div>
      </ExportableChartCard>

      {/* 4. Call Duration Distribution */}
      <ExportableChartCard
        title="Call Duration Distribution"
        exportData={durationDistribution}
      >
        <div className="h-32 flex items-end gap-3 mt-4 relative">
          {durationDistribution.map((item, idx) => {
            const max = Math.max(...durationDistribution.map(d => d.count)) || 1;
            const heightPct = (item.count / max) * 100;
            const gradients = [
              'bg-gradient-to-t from-[#2563eb] to-[#3b82f6] hover:brightness-110 shadow-lg shadow-blue-500/10',
              'bg-gradient-to-t from-[#7c3aed] to-[#8b5cf6] hover:brightness-110 shadow-lg shadow-purple-500/10',
              'bg-gradient-to-t from-[#d97706] to-[#f59e0b] hover:brightness-110 shadow-lg shadow-amber-500/10',
              'bg-gradient-to-t from-[#059669] to-[#10b981] hover:brightness-110 shadow-lg shadow-emerald-500/10',
              'bg-gradient-to-t from-[#db2777] to-[#ec4899] hover:brightness-110 shadow-lg shadow-pink-500/10'
            ];
            return (
              <div 
                key={idx} 
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                onMouseEnter={() => setHoveredBar(item)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {item.count > 0 && (
                  <span className="text-[9px] font-mono text-gray-300 mb-1 leading-none select-none">
                    {item.count}
                  </span>
                )}
                <div 
                  className={`w-full ${gradients[idx % gradients.length]} rounded-t transition-all duration-150`}
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                />
                <span className="text-[10px] text-gray-300 mt-2 font-mono truncate max-w-full text-center">
                  {item.name}
                </span>
              </div>
            );
          })}

          {/* Interactive Floating Tooltip */}
          {hoveredBar && (
            <div 
              className="absolute bg-[#171717] border border-gray-600 rounded-lg p-2 text-[10px] font-mono text-white shadow-xl z-20 pointer-events-none"
              style={{
                left: '50%',
                top: '5%',
                transform: 'translateX(-50%)'
              }}
            >
              <span className="block text-gray-400 font-bold">{hoveredBar.name} Duration</span>
              <span className="block text-[#3ecf8e] font-semibold mt-0.5">Calls: {hoveredBar.count} ({hoveredBar.pct}%)</span>
            </div>
          )}
        </div>
        <div className="text-[10px] text-gray-400 font-mono text-center mt-3">
          Note: SMS events excluded from duration aggregates.
        </div>
      </ExportableChartCard>
    </>
  );
};
