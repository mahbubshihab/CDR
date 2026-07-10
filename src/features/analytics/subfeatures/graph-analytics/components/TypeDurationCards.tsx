import React, { useMemo } from 'react';
import { type CDRRecord } from '../../../../../utils/db';
import { Download, Camera, Printer, Maximize2 } from 'lucide-react';

interface TypeDurationCardsProps {
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

export const TypeDurationCards: React.FC<TypeDurationCardsProps> = ({ records }) => {
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
      { name: '0-30s', count: range1, pct: ((range1 / total) * 100).toFixed(1) },
      { name: '30s-1m', count: range2, pct: ((range2 / total) * 100).toFixed(1) },
      { name: '1-5m', count: range3, pct: ((range3 / total) * 100).toFixed(1) },
      { name: '5-15m', count: range4, pct: ((range4 / total) * 100).toFixed(1) },
      { name: '15m+', count: range5, pct: ((range5 / total) * 100).toFixed(1) },
    ];
  }, [records]);

  return (
    <>
      {/* 3. Call Type Distribution */}
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between text-left">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xs font-semibold text-gray-250 uppercase tracking-wider">Call Type Distribution</h3>
          <CardActions />
        </div>

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
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3ecf8e" strokeWidth="3"
                      strokeDasharray={`${inStroke} ${100 - inStroke}`}
                      strokeDashoffset="0"
                    />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#8b5cf6" strokeWidth="3"
                      strokeDasharray={`${outStroke} ${100 - outStroke}`}
                      strokeDashoffset={`-${inStroke}`}
                    />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3"
                      strokeDasharray={`${smsStroke} ${100 - smsStroke}`}
                      strokeDashoffset={`-${inStroke + outStroke}`}
                    />
                  </>
                );
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-bold text-gray-100 font-mono leading-none">
                {callTypeDistribution.total}
              </span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5 font-semibold">Logs</span>
            </div>
          </div>

          {/* Legends */}
          <div className="flex-1 space-y-2.5 w-full text-xs font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#3ecf8e]" />
                <span className="text-gray-300">Incoming Calls</span>
              </div>
              <span className="text-gray-400 font-semibold">{callTypeDistribution.incoming} ({callTypeDistribution.incomingPct}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#8b5cf6]" />
                <span className="text-gray-300">Outgoing Calls</span>
              </div>
              <span className="text-gray-400 font-semibold">{callTypeDistribution.outgoing} ({callTypeDistribution.outgoingPct}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
                <span className="text-gray-300">SMS Activity</span>
              </div>
              <span className="text-gray-400 font-semibold">{callTypeDistribution.sms} ({callTypeDistribution.smsPct}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Call Duration Distribution */}
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between text-left">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xs font-semibold text-gray-250 uppercase tracking-wider">Call Duration Distribution</h3>
          <CardActions />
        </div>

        <div className="h-32 flex items-end gap-3 mt-4">
          {durationDistribution.map((item, idx) => {
            const max = Math.max(...durationDistribution.map(d => d.count)) || 1;
            const heightPct = (item.count / max) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                <span className="text-[10px] text-gray-500 font-mono mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.count}
                </span>
                <div 
                  className="w-full bg-[#3ecf8e]/20 hover:bg-[#3ecf8e]/40 border border-[#3ecf8e]/30 rounded-t transition-all duration-150"
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                />
                <span className="text-[10px] text-gray-405 mt-2 font-mono truncate max-w-full text-center">
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>
        <div className="text-[10px] text-gray-500 font-mono text-center mt-3">
          Note: SMS events excluded from duration aggregates.
        </div>
      </div>
    </>
  );
};
