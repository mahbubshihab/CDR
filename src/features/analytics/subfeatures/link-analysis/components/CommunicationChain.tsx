import React from 'react';
import { GitMerge } from 'lucide-react';
import type { CommunicationChain as ChainType } from '../types';

interface CommunicationChainProps {
  chains: ChainType[];
}

export const CommunicationChain: React.FC<CommunicationChainProps> = ({ chains }) => {
  return (
    <div className="bg-[#171717] border border-[#2e2e2e] rounded-xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <GitMerge className="h-4 w-4 text-gray-400 rotate-90" />
        <h3 className="text-sm font-semibold text-gray-200">Communication chain analysis (via target)</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-4 font-mono">
        {chains.map((chain, idx) => (
          <div key={idx} className="flex flex-col">
            <div className="text-[11px] mb-1">
              <span className="text-[#38bdf8]">{chain.aParty}</span>
              <span className="text-gray-500 mx-2">&rarr;</span>
              <span className="text-[#3ecf8e]">{chain.bParty}</span>
            </div>
            <div className="text-[10px] text-gray-500">
              {chain.combinedComm} combined comm - via {chain.via}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
