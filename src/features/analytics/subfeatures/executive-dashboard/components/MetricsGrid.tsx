import React from 'react';
import { Phone, MessageSquare, Users, MapPin } from 'lucide-react';

interface MetricsGridProps {
  metrics: {
    total: number;
    totalCalls: number;
    totalSMS: number;
    bPartiesCount: number;
    locationsCount: number;
  };
  operatorBreakdown: Array<{
    name: string;
    count: number;
    percentage: string;
    color: string;
  }>;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics, operatorBreakdown }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
      {/* 1. Left side banner: Total Calls & SMS */}
      <div className="md:col-span-2 bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl overflow-hidden flex flex-col justify-between">
        <div className="bg-[#171717] px-4 py-2 border-b border-[#2e2e2e] flex items-center justify-between">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider font-mono">
            Forensic Summary Logs
          </span>
          <span className="text-[10px] font-semibold text-[#3ecf8e] font-mono">
            Active Data Range
          </span>
        </div>
        <div className="p-5 flex items-center justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-[#171717] border border-[#2e2e2e] rounded-lg flex items-center justify-center">
                <Phone className="h-4.5 w-4.5 text-[#3ecf8e]" />
              </div>
              <div className="text-left">
                <span className="text-xs text-gray-400 font-mono block">Voice Calls</span>
                <span className="text-lg font-semibold text-gray-200 font-mono">{metrics.totalCalls.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-[#171717] border border-[#2e2e2e] rounded-lg flex items-center justify-center">
                <MessageSquare className="h-4.5 w-4.5 text-[#3ecf8e]" />
              </div>
              <div className="text-left">
                <span className="text-xs text-gray-400 font-mono block">SMS Messages</span>
                <span className="text-lg font-semibold text-gray-200 font-mono">{metrics.totalSMS.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          {/* Main counts banner card block with solid yellow background as per screenshot */}
          <div className="w-40 bg-amber-500 rounded-xl p-4 flex flex-col items-center justify-center shadow-lg relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 h-16 w-16 bg-white/5 rounded-full -mr-6 -mt-6" />
            <span className="text-[10px] text-amber-950 font-bold uppercase tracking-wider font-mono">Total Activities</span>
            <span className="text-3xl font-bold text-amber-950 font-mono mt-1 tracking-tighter">
              {metrics.total.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="px-5 py-3.5 bg-[#171717]/40 border-t border-[#2e2e2e] grid grid-cols-2 gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-gray-400">Contacts: <strong className="text-gray-200">{metrics.bPartiesCount}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-gray-400">Locations: <strong className="text-gray-200">{metrics.locationsCount}</strong></span>
          </div>
        </div>
      </div>

      {/* 2. Right side banner: Network breakdown */}
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider mb-3">
            Network Distribution Summary
          </h3>
          
          {/* Small top row operator badges */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {operatorBreakdown.slice(0, 3).map(op => (
              <span key={op.name} className="px-2 py-0.5 bg-[#171717] border border-[#2e2e2e] text-gray-400 text-[10px] font-mono rounded">
                {op.name.substring(0, 2).toUpperCase()}: <strong className="text-[#3ecf8e] ml-0.5">{op.percentage}%</strong>
              </span>
            ))}
          </div>

          {/* Horizontal rows progress alignment */}
          <div className="space-y-2.5 font-mono text-[11px]">
            {operatorBreakdown.map(op => (
              <div key={op.name} className="flex items-center gap-3">
                <span className="w-20 text-gray-400 text-left truncate" title={op.name}>{op.name}</span>
                <div className="flex-1 h-2 bg-[#121212] border border-[#2e2e2e] rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${op.color} rounded-full`}
                    style={{ width: `${op.percentage}%` }}
                  />
                </div>
                <span className="w-16 text-right text-gray-300 font-semibold">
                  {op.count} <span className="text-gray-500 text-[9px] font-normal ml-0.5">({op.percentage}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
