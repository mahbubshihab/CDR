import React, { useMemo } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { Server, Phone, MessageSquare, ShieldAlert, Cpu } from 'lucide-react';

interface NetworkAnalysisProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

export const NetworkAnalysis: React.FC<NetworkAnalysisProps> = ({ cdrFile, records }) => {
  // Aggregate network carrier stats
  const carrierStats = useMemo(() => {
    const map: { 
      [key: string]: { 
        name: string; 
        voiceCount: number; 
        smsCount: number; 
        total: number;
        duration: number;
      } 
    } = {};

    records.forEach(r => {
      const name = r.provider || 'Unknown Operator';
      if (!map[name]) {
        map[name] = { name, voiceCount: 0, smsCount: 0, total: 0, duration: 0 };
      }
      
      const type = r.usageType.toLowerCase();
      if (type.includes('sms')) {
        map[name].smsCount++;
      } else {
        map[name].voiceCount++;
        map[name].duration += r.duration || 0;
      }
      map[name].total++;
    });

    const sorted = Object.values(map).sort((a, b) => b.total - a.total);
    const total = records.length || 1;

    return sorted.map(item => ({
      ...item,
      pct: ((item.total / total) * 100).toFixed(1)
    }));
  }, [records]);

  return (
    <div className="w-full h-full overflow-y-auto p-6 space-y-6 custom-scrollbar text-left bg-[#121212] animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="border-b border-[#2e2e2e] pb-4">
        <h2 className="text-sm font-semibold text-gray-200">Network / Carrier Analysis</h2>
        <p className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-wider">
          Cellular provider shares, durations, and SMS-voice splits for target: <strong className="text-gray-300 font-mono font-bold">{cdrFile.phoneNumber}</strong>
        </p>
      </div>

      {/* Grid of Operators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {carrierStats.map((op, idx) => (
          <div key={idx} className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-300">{op.name}</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/20 rounded">
                  {op.pct}%
                </span>
              </div>
              <span className="text-3xl font-bold text-gray-100 font-mono mt-3 block">{op.total}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block mt-1 font-semibold">Total Interactions</span>
            </div>

            <div className="mt-5 space-y-2 border-t border-[#2e2e2e]/55 pt-3.5 text-xs font-mono">
              <div className="flex justify-between text-gray-400">
                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-500" /> Calls</span>
                <strong>{op.voiceCount}</strong>
              </div>
              <div className="flex justify-between text-gray-400">
                <span className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5 text-gray-500" /> SMS</span>
                <strong>{op.smsCount}</strong>
              </div>
              <div className="flex justify-between text-gray-400">
                <span className="flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-gray-500" /> Duration</span>
                <strong>{(op.duration / 60).toFixed(0)}m</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Carrier List Table */}
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#2e2e2e] bg-[#1a1a1a]/30">
          <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Inter-Network Operator Analysis</h3>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse text-left text-xs font-mono">
            <thead>
              <tr className="bg-[#171717] border-b border-[#2e2e2e] text-gray-400 uppercase font-semibold text-[10px] tracking-wider">
                <th className="py-3 px-4">Operator Name</th>
                <th className="py-3 px-4 text-right">Voice Counts</th>
                <th className="py-3 px-4 text-right">SMS Counts</th>
                <th className="py-3 px-4 text-right">Total Duration</th>
                <th className="py-3 px-4 text-right">Avg Duration</th>
                <th className="py-3 px-4 text-right w-36">Volume Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e2e]/40 text-gray-300">
              {carrierStats.length > 0 ? (
                carrierStats.map((op, idx) => (
                  <tr key={idx} className="hover:bg-[#171717]/40 transition-colors">
                    <td className="py-3.5 px-4 font-sans text-gray-200 font-semibold">{op.name}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-gray-300">{op.voiceCount}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-gray-300">{op.smsCount}</td>
                    <td className="py-3.5 px-4 text-right text-gray-400">{op.duration}s</td>
                    <td className="py-3.5 px-4 text-right text-gray-400">
                      {op.voiceCount > 0 ? `${(op.duration / op.voiceCount).toFixed(0)}s` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold text-gray-200">
                          <span>{op.pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#121212] rounded-full overflow-hidden">
                          <div className="bg-[#3ecf8e] h-full" style={{ width: `${op.pct}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No operator records detected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
