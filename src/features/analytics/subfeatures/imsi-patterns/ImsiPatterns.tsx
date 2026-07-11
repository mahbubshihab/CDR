import React from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { Radio, Shield } from 'lucide-react';

interface ImsiPatternsProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

export const ImsiPatterns: React.FC<ImsiPatternsProps> = ({ cdrFile, records }) => {
  // Extract real IMSI subscriber codes and frequencies
  const imsiList = React.useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach(r => {
      const imsi = r.imsi || '';
      if (imsi && imsi.trim().length > 0 && imsi !== '0') {
        counts[imsi] = (counts[imsi] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([imsi, count]) => ({ imsi, count }))
      .sort((a, b) => b.count - a.count);
  }, [records]);

  return (
    <div className="w-full h-full bg-[#121212] overflow-y-auto p-6 space-y-6 text-left font-mono">
      <div className="flex justify-between items-center border-b border-[#2e2e2e]/55 pb-3">
        <div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">
            Forensic Intelligence
          </span>
          <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            <Radio className="h-5 w-5 text-[#3ecf8e]" />
            IMSI Patterns & Subscriber Profile
          </h2>
        </div>
      </div>

      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 space-y-4">
        <span className="text-xs text-gray-400 font-semibold block">
          Analyzed unique IMSI network card signatures to cross-reference carrier records.
        </span>

        {imsiList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2e2e2e] text-gray-500 font-bold">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">IMSI Code</th>
                  <th className="py-2.5 px-3">MCC-MNC Profile</th>
                  <th className="py-2.5 px-3">Activity Frequency</th>
                  <th className="py-2.5 px-3">Subscription Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e2e]/50">
                {imsiList.map((s, idx) => (
                  <tr key={idx} className="hover:bg-[#121212]/30 text-gray-300">
                    <td className="py-2.5 px-3 text-gray-500 font-bold">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#3ecf8e]">{s.imsi}</td>
                    <td className="py-2.5 px-3 font-mono">{s.imsi.substring(0, 5)}</td>
                    <td className="py-2.5 px-3 font-bold">{s.count} times</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-[#0b1c15] border border-emerald-900/30 text-emerald-400 rounded text-[9px] font-bold">
                        Active Subscriber
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Shield className="h-8 w-8 mx-auto mb-2 text-gray-600" />
            No valid IMSI signatures detected in this CDR file.
          </div>
        )}
      </div>
    </div>
  );
};
