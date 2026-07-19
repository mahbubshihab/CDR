import React from 'react';
import type { CountryAggregate } from '../types';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

interface IntlAlertsViewProps {
  countries: CountryAggregate[];
}

export const IntlAlertsView: React.FC<IntlAlertsViewProps> = ({ countries }) => {
  const highRisk = countries.filter(c => c.riskLevel === 'HIGH');
  
  return (
    <div className="space-y-6 mt-6 animate-in fade-in duration-300">
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 flex items-start gap-4">
        <div className="bg-red-500/20 p-3 rounded-full">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h3 className="text-red-500 font-bold text-lg mb-1">High Risk International Contacts Detected</h3>
          <p className="text-red-400/80 text-sm">
            {highRisk.length} countries meet the threshold for high-frequency or suspicious communication patterns. Immediate investigation recommended.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {highRisk.length > 0 ? (
          highRisk.map(c => (
            <div key={c.country} className="bg-[#1c1c1c] border border-[#f87171]/50 rounded-xl overflow-hidden shadow-lg shadow-black/20">
              <div className="p-4 border-b border-[#2e2e2e] bg-[#121212]/80 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#f87171]" />
                  <h4 className="font-bold text-gray-200">{c.country} ({c.code})</h4>
                </div>
                <span className="bg-[#f87171]/20 text-[#f87171] text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-[#f87171]/30">CRITICAL</span>
              </div>
              <div className="p-4 bg-gradient-to-br from-[#1e293b] to-[#0f172a]">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">Involved Numbers</div>
                    <div className="text-lg font-mono text-gray-200 font-bold">{c.numbers.length}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">Total Comms</div>
                    <div className="text-lg font-mono text-[#f87171] font-bold">{c.totalComms}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Target Numbers</div>
                  <div className="text-xs text-gray-400 font-mono break-all">{c.numbers.join(', ')}</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl text-gray-500">
            No high-risk international contacts detected.
          </div>
        )}
      </div>
    </div>
  );
};
