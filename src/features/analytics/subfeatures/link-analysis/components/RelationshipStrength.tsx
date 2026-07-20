import React from 'react';
import type { RelationshipStrength as RankType } from '../types';

interface RelationshipStrengthProps {
  rankings: RankType[];
}

export const RelationshipStrength: React.FC<RelationshipStrengthProps> = ({ rankings }) => {
  return (
    <div className="bg-[#171717] border border-[#2e2e2e] rounded-xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold text-gray-200">Relationship strength ranking</h3>
      </div>
      
      <div className="flex flex-wrap gap-2 font-mono text-[11px]">
        {rankings.map((rank) => (
          <div key={rank.rank} className="bg-[#1e293b] text-gray-300 px-2 py-1 rounded border border-[#334155] flex items-center gap-2">
            <span className="text-gray-400">#{rank.rank}</span>
            <span className="text-gray-200">{rank.number}</span>
            <span className="text-gray-400">({rank.commCount}) &middot; {rank.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
