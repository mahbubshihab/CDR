import React from 'react';
import { Layers } from 'lucide-react';
import type { SharedContactCluster, LocationCluster } from '../types';

interface ClusterDetectionProps {
  sharedImeis: SharedContactCluster[];
  commonLocations: LocationCluster[];
}

export const ClusterDetection: React.FC<ClusterDetectionProps> = ({ sharedImeis, commonLocations }) => {
  return (
    <div className="bg-[#171717] border border-[#2e2e2e] rounded-xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-200">Cluster & shared contact detection</h3>
      </div>
      
      <div className="space-y-3 font-mono text-[11px]">
        {sharedImeis.slice(0, 4).map((cluster, idx) => (
          <div key={idx} className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[#f59e0b]">Shared IMEI:</span>
            <span className="text-gray-300">{cluster.imei} &rarr;</span>
            <div className="flex flex-wrap gap-1">
              {cluster.numbers.map((num: string, i: number) => (
                <span key={i} className="bg-[#1e293b] text-[#38bdf8] px-2 py-0.5 rounded border border-[#0f172a]">
                  {num}
                </span>
              ))}
            </div>
          </div>
        ))}
        
        <div className="mt-4 space-y-1 pt-2">
          {commonLocations.slice(0, 3).map((loc, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-gray-300 font-medium">Common location:</span>
              <span className="text-gray-400">{loc.location} ({loc.count} numbers)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
