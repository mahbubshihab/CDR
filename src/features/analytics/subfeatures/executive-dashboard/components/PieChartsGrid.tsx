import React from 'react';
import { BarChart3 } from 'lucide-react';

interface PieChartsGridProps {
  callTypeBreakdown: Array<{
    name: string;
    count: number;
    pct: string;
    color: string;
  }>;
  bPartyTypeBreakdown: Array<{
    name: string;
    count: number;
    pct: string;
    color: string;
  }>;
  countryBreakdown: Array<{
    name: string;
    count: number;
    pct: string;
    color: string;
  }>;
}

export const PieChartsGrid: React.FC<PieChartsGridProps> = ({ 
  callTypeBreakdown, bPartyTypeBreakdown, countryBreakdown 
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-left">
      {/* 1. Call Type Donut Card */}
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col items-center">
        <div className="w-full flex items-center gap-2 mb-4 border-b border-[#2e2e2e]/55 pb-2">
          <BarChart3 className="h-4.5 w-4.5 text-[#3ecf8e]" />
          <h3 className="text-xs font-semibold text-gray-250 uppercase tracking-wider text-left">
            Activity Type Share
          </h3>
        </div>
        
        {/* Simple inline SVG donut representation */}
        <div className="relative h-28 w-28 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2e2e2e" strokeWidth="3" />
            
            {/* Draw pie rings dynamically */}
            {(() => {
              let currentOffset = 0;
              return callTypeBreakdown.map((item, idx) => {
                const percentage = parseFloat(item.pct) || 0;
                if (percentage === 0) return null;
                const strokeDash = `${percentage} ${100 - percentage}`;
                const offset = 100 - currentOffset;
                currentOffset += percentage;
                return (
                  <circle
                    key={idx}
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke={item.color}
                    strokeWidth="3.5"
                    strokeDasharray={strokeDash}
                    strokeDashoffset={offset}
                  />
                );
              });
            })()}
          </svg>
        </div>

        {/* Vertical legend stack under the chart */}
        <div className="w-full mt-4 space-y-2.5 font-mono text-[11px] border-t border-[#2e2e2e]/40 pt-3">
          {callTypeBreakdown.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-left">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-gray-400 font-semibold">{item.name}</span>
              </div>
              <span className="text-gray-300 font-bold">
                {item.count.toLocaleString()} <span className="text-gray-500 font-normal text-[9px] ml-0.5">({item.pct}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. B-Party Type Donut Card */}
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col items-center">
        <div className="w-full flex items-center gap-2 mb-4 border-b border-[#2e2e2e]/55 pb-2">
          <BarChart3 className="h-4.5 w-4.5 text-[#a855f7]" />
          <h3 className="text-xs font-semibold text-gray-250 uppercase tracking-wider text-left">
            B-Party Type Share
          </h3>
        </div>

        {/* Simple inline SVG donut representation */}
        <div className="relative h-28 w-28 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2e2e2e" strokeWidth="3" />
            
            {/* Draw pie rings dynamically */}
            {(() => {
              let currentOffset = 0;
              return bPartyTypeBreakdown.map((item, idx) => {
                const percentage = parseFloat(item.pct) || 0;
                if (percentage === 0) return null;
                const strokeDash = `${percentage} ${100 - percentage}`;
                const offset = 100 - currentOffset;
                currentOffset += percentage;
                return (
                  <circle
                    key={idx}
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke={item.color}
                    strokeWidth="3.5"
                    strokeDasharray={strokeDash}
                    strokeDashoffset={offset}
                  />
                );
              });
            })()}
          </svg>
        </div>

        {/* Vertical legend stack under the chart */}
        <div className="w-full mt-4 space-y-2.5 font-mono text-[11px] border-t border-[#2e2e2e]/40 pt-3">
          {bPartyTypeBreakdown.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-left">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-gray-400 font-semibold">{item.name}</span>
              </div>
              <span className="text-gray-300 font-bold">
                {item.count.toLocaleString()} <span className="text-gray-500 font-normal text-[9px] ml-0.5">({item.pct}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. B-Party Country Donut Card */}
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col items-center">
        <div className="w-full flex items-center gap-2 mb-4 border-b border-[#2e2e2e]/55 pb-2">
          <BarChart3 className="h-4.5 w-4.5 text-[#3b82f6]" />
          <h3 className="text-xs font-semibold text-gray-250 uppercase tracking-wider text-left">
            Geographic Call Share
          </h3>
        </div>

        {/* Simple inline SVG donut representation */}
        <div className="relative h-28 w-28 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2e2e2e" strokeWidth="3" />
            
            {/* Draw pie rings dynamically */}
            {(() => {
              let currentOffset = 0;
              return countryBreakdown.map((item, idx) => {
                const percentage = parseFloat(item.pct) || 0;
                if (percentage === 0) return null;
                const strokeDash = `${percentage} ${100 - percentage}`;
                const offset = 100 - currentOffset;
                currentOffset += percentage;
                return (
                  <circle
                    key={idx}
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke={item.color}
                    strokeWidth="3.5"
                    strokeDasharray={strokeDash}
                    strokeDashoffset={offset}
                  />
                );
              });
            })()}
          </svg>
        </div>

        {/* Vertical legend stack under the chart */}
        <div className="w-full mt-4 space-y-2.5 font-mono text-[11px] border-t border-[#2e2e2e]/40 pt-3">
          {countryBreakdown.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-left">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-gray-400 font-semibold">{item.name}</span>
              </div>
              <span className="text-gray-300 font-bold">
                {item.count.toLocaleString()} <span className="text-gray-500 font-normal text-[9px] ml-0.5">({item.pct}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
