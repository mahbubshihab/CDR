import React from 'react';
import type { ImeiAnalysisRow } from '../hooks/useImeiAnalysis';

interface ForensicDeviceCardsProps {
  data: ImeiAnalysisRow[];
}

export const ForensicDeviceCards: React.FC<ForensicDeviceCardsProps> = ({ data }) => {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Forensic Device Cards</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.slice(0, 6).map((device, idx) => (
          <div key={idx} className="bg-[#1a1c23] border border-[#2e2e2e] rounded-xl p-5">
            <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">IMEI SUMMARY</h4>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Original IMEI:</span>
                <span className="text-sm font-mono text-gray-200 font-bold">{device.original}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">IMEI Status:</span>
                <span className={`text-xs font-bold ${device.status === 'CORRECTED' ? 'text-yellow-500' : device.status === 'VALID' ? 'text-green-500' : 'text-red-500'}`}>
                  {device.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Corrected IMEI:</span>
                <span className="text-sm font-mono text-cyan-400 font-bold">{device.corrected}</span>
              </div>
            </div>

            <div className="border-t border-[#2e2e2e]/50 pt-3">
              <h5 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2">TAC INFORMATION</h5>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">TAC:</span>
                <span className="text-sm font-mono text-gray-200 font-bold">{device.tac}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
