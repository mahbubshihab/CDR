import React from 'react';
import type { LinkNodeIntelligence } from '../types';

interface NodeIntelligencePanelProps {
  node: LinkNodeIntelligence | null;
}

export const NodeIntelligencePanel: React.FC<NodeIntelligencePanelProps> = ({ node }) => {
  if (!node) {
    return (
      <div className="bg-[#121212]/80 border border-[#2e2e2e] rounded-xl p-4 w-72 flex-shrink-0 flex flex-col items-center justify-center text-center backdrop-blur-sm h-64">
        <p className="text-xs text-gray-400 font-mono">Hover nodes or relationship lines for detailed communication metadata.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#121212]/80 border border-[#2e2e2e] rounded-xl p-5 w-72 flex-shrink-0 backdrop-blur-sm flex flex-col font-mono">
      <div className="text-[10px] text-gray-500 font-semibold mb-3 uppercase tracking-wider">Node Intelligence</div>
      
      <div className="text-base text-[#4da8da] font-medium mb-4">{node.number}</div>

      <div className="flex justify-between items-center mb-2 text-xs">
        <span className="text-gray-500">Type</span>
        <span className="text-gray-200">{node.type}</span>
      </div>

      <div className="flex justify-between items-center mb-2 text-xs">
        <span className="text-gray-500">Country</span>
        <span className="text-gray-200">{node.country}</span>
      </div>

      <div className="flex justify-between items-center mb-2 text-xs">
        <span className="text-gray-500">Call count</span>
        <span className="text-gray-200">In {node.callCountIn} / Out {node.callCountOut}</span>
      </div>

      <div className="flex justify-between items-center mb-2 text-xs">
        <span className="text-gray-500">SMS count</span>
        <span className="text-gray-200">In {node.smsCountIn} / Out {node.smsCountOut}</span>
      </div>

      <div className="flex justify-between items-center mb-2 text-xs">
        <span className="text-gray-500">Total duration</span>
        <span className="text-gray-200">{node.totalDuration} min</span>
      </div>

      <div className="flex justify-between items-center mb-2 text-xs">
        <span className="text-gray-500">Total comm</span>
        <span className="text-gray-200">{node.totalComm}</span>
      </div>

      <div className="flex justify-between items-center mb-2 text-xs">
        <span className="text-gray-500">First contact</span>
        <span className="text-gray-200">{node.firstContact}</span>
      </div>

      <div className="flex justify-between items-center mb-4 text-xs">
        <span className="text-gray-500">Last contact</span>
        <span className="text-gray-200">{node.lastContact}</span>
      </div>

      <button className="w-full bg-[#1e1e1e] hover:bg-[#2e2e2e] text-gray-300 transition-colors rounded-lg py-2 text-xs font-semibold">
        Focus node
      </button>
    </div>
  );
};
