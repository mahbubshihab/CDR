import React from 'react';
import { Download, Camera, Printer, Maximize2 } from 'lucide-react';
import type { BPartyStats } from '../types';

interface MfcChartsRowProps {
  topContacts: BPartyStats[];
}

const COLORS = ['#06b6d4', '#8b5cf6', '#eab308', '#10b981', '#ec4899'];

export const MfcChartsRow: React.FC<MfcChartsRowProps> = ({ topContacts }) => {
  const maxTotal = Math.max(...topContacts.map(c => c.totalActivities), 1);

  const HeaderActions = () => (
    <div className="flex items-center gap-1.5 text-gray-500">
      <button className="p-1 hover:bg-[#2e2e2e] rounded transition-colors"><Download className="h-3.5 w-3.5" /></button>
      <button className="p-1 hover:bg-[#2e2e2e] rounded transition-colors"><Camera className="h-3.5 w-3.5" /></button>
      <button className="p-1 hover:bg-[#2e2e2e] rounded transition-colors"><Printer className="h-3.5 w-3.5" /></button>
      <button className="p-1 hover:bg-[#2e2e2e] rounded transition-colors"><Maximize2 className="h-3.5 w-3.5" /></button>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Top 5 Contacts */}
      <div className="bg-[#171717] border border-[#2e2e2e] rounded-xl flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-semibold text-gray-200">Top 5 Bangladeshi Contacts</h3>
          <HeaderActions />
        </div>
        
        <div className="flex flex-col gap-4 flex-1 justify-center">
          {topContacts.slice(0, 5).map((contact, idx) => {
            const color = COLORS[idx % COLORS.length];
            const pct = ((contact.totalActivities / maxTotal) * 100).toFixed(1);
            
            return (
              <div key={contact.bNumber} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">#{idx + 1}</span>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-gray-200 font-bold">{contact.bNumber}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">{contact.totalActivities}</span>
                    <span className="font-bold" style={{ color }}>{pct}%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-[#121212] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
          
          {topContacts.length === 0 && (
            <div className="text-center text-gray-500 text-xs py-10">No contacts available.</div>
          )}
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-[#171717] border border-[#2e2e2e] rounded-xl flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-semibold text-gray-200">Contact Activity Heatmap (Hourly)</h3>
          <HeaderActions />
        </div>
        
        <div className="flex-1 overflow-x-auto custom-scrollbar">
          <div className="min-w-[400px]">
            {/* Heatmap Header */}
            <div className="flex items-end mb-2 text-[10px] text-gray-500 font-mono tracking-wider">
              <div className="w-24 shrink-0">Contact</div>
              <div className="flex-1 flex justify-between ml-2">
                {[0, 3, 6, 9, 12, 15, 18, 21].map(hr => (
                  <div key={hr} className="w-[12.5%] text-left">{hr}</div>
                ))}
              </div>
            </div>
            
            {/* Heatmap Rows */}
            <div className="flex flex-col gap-1">
              {topContacts.slice(0, 10).map((contact, idx) => {
                const color = COLORS[idx % COLORS.length];
                // find max activity for this contact to scale colors
                const maxAct = Math.max(...contact.hourlyActivity, 1);
                
                return (
                  <div key={contact.bNumber} className="flex items-center text-[10px] font-mono">
                    <div className="w-24 shrink-0 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-gray-300 truncate">{contact.bNumber}</span>
                    </div>
                    
                    <div className="flex-1 flex gap-0.5 ml-2">
                      {contact.hourlyActivity.map((count, hr) => {
                        let bg = '#121212';
                        if (count > 0) {
                          // Simple scale: 1 = #0f766e (teal), max = #ec4899 (pink/hot) or #22d3ee (cyan)
                          // I'll use opacity on a cyan base for simplicity and match dashboard vibe
                          const intensity = count / maxAct;
                          if (intensity > 0.8) bg = '#ec4899'; // Very hot
                          else if (intensity > 0.5) bg = '#06b6d4'; // Hot
                          else if (intensity > 0.2) bg = '#0369a1'; // Medium
                          else bg = '#0f172a'; // Low
                        }
                        
                        return (
                          <div 
                            key={hr} 
                            className="flex-1 aspect-square rounded-[1px] transition-colors"
                            style={{ backgroundColor: bg }}
                            title={`${hr}:00 - ${count} activities`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              
              {topContacts.length === 0 && (
                <div className="text-center text-gray-500 text-xs py-10">No contacts available.</div>
              )}
            </div>
            
            {/* Legend */}
            {topContacts.length > 0 && (
              <div className="flex items-center justify-center gap-2 mt-4 text-[9px] text-gray-500 font-mono">
                <span>Low</span>
                <div className="w-24 h-1.5 rounded-full bg-gradient-to-r from-[#0f172a] via-[#06b6d4] to-[#ec4899]" />
                <span>High activity</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
