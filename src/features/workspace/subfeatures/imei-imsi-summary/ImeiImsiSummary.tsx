import React from 'react';
import { Smartphone } from 'lucide-react';
import { type Case } from '../../../../utils/db';

interface ImeiImsiSummaryProps {
  activeCase: Case;
}

export const ImeiImsiSummary: React.FC<ImeiImsiSummaryProps> = ({ activeCase }) => {
  return (
    <div className="w-full h-full p-6 text-left bg-[#121212] animate-in fade-in duration-300">
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-200">IMEI & IMSI Summary</h2>
          <p className="text-xs text-gray-500 font-mono uppercase tracking-wider block mt-1">
            Handset swaps and SIM exchange timeline profiles for case: {activeCase.title}
          </p>
        </div>

        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl p-6 text-center max-w-md mx-auto space-y-3">
          <Smartphone className="h-8 w-8 text-[#3ecf8e] mx-auto" />
          <h3 className="font-bold text-gray-300">Device Swap Tracker</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Identifies hardware transitions when multiple IMSI SIMs are used in a single IMEI device handset.
          </p>
        </div>
      </div>
    </div>
  );
};
