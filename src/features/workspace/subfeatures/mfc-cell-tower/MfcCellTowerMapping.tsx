import React from 'react';
import { MapPin } from 'lucide-react';
import { type Case } from '../../../../utils/db';

interface MfcCellTowerMappingProps {
  activeCase: Case;
}

export const MfcCellTowerMapping: React.FC<MfcCellTowerMappingProps> = ({ activeCase }) => {
  return (
    <div className="w-full h-full p-6 text-left bg-[#121212] animate-in fade-in duration-300">
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-200">MFC / IMF Cell Tower Mapping</h2>
          <p className="text-xs text-gray-500 font-mono uppercase tracking-wider block mt-1">
            Most Frequent Cell & Tower locations analysis for case: {activeCase.title}
          </p>
        </div>

        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl p-6 text-center max-w-md mx-auto space-y-3">
          <MapPin className="h-8 w-8 text-[#3ecf8e] mx-auto" />
          <h3 className="font-bold text-gray-300">Tower Coverage Profiler</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Profile towers by transit frequency to pinpoint candidate suspect hideouts, residence nodes, or workplace addresses dynamically.
          </p>
        </div>
      </div>
    </div>
  );
};
