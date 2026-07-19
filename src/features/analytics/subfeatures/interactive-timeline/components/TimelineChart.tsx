import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Search } from 'lucide-react';
import { type CDRRecord } from '../../../../../utils/db';

export const TimelineChart: React.FC<any> = ({ records }) => {
  const chartData = useMemo(() => {
    if (records.length === 0) return [];
    
    const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);
    const firstDate = new Date(sorted[0].timestamp);
    const lastDate = new Date(sorted[sorted.length - 1].timestamp);
    firstDate.setHours(0,0,0,0);
    lastDate.setHours(0,0,0,0);

    const dataMap = new Map();
    let current = new Date(firstDate);
    while (current <= lastDate) {
      const dateStr = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      dataMap.set(dateStr, { name: dateStr, call: 0, sms: 0, data: 0, total: 0 });
      current.setDate(current.getDate() + 1);
    }

    sorted.forEach(r => {
      const d = new Date(r.timestamp);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const entry = dataMap.get(dateStr);
      if (entry) {
        entry.total++;
        if (r.usageType?.toLowerCase().includes('call')) entry.call++;
        else if (r.usageType?.toLowerCase().includes('sms')) entry.sms++;
        else if (r.usageType?.toLowerCase().includes('data')) entry.data++;
        else entry.call++;
      }
    });

    return Array.from(dataMap.values());
  }, [records]);

  const getDominantColor = (entry: any) => {
    if (entry.total === 0) return 'transparent';
    if (entry.data > entry.call && entry.data > entry.sms) return '#a855f7'; 
    if (entry.sms > entry.call) return '#22c55e'; 
    return '#3b82f6';
  };

  return (
    <div className="bg-[#131f37] border border-slate-700/60 rounded-md overflow-hidden flex flex-col shadow-sm">
      <div className="px-3 py-2 border-b border-slate-700/60 flex items-center justify-between bg-[#0a1120]">
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-slate-800 rounded border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"><ChevronLeft className="w-3.5 h-3.5" /></button>
          <button className="p-1 hover:bg-slate-800 rounded border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"><ZoomOut className="w-3.5 h-3.5" /></button>
          <span className="text-[11px] text-slate-400 px-2 font-mono">100%</span>
          <button className="p-1 hover:bg-slate-800 rounded border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"><ZoomIn className="w-3.5 h-3.5" /></button>
          <button className="p-1 hover:bg-slate-800 rounded border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"><ChevronRight className="w-3.5 h-3.5" /></button>
        </div>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="Compare number..." 
            className="bg-[#131f37] border border-slate-700 rounded-full pl-7 pr-3 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44"
          />
          <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1.5" />
        </div>
      </div>

      <div className="pt-4 pb-2 px-4 h-36 relative w-full overflow-x-auto custom-scrollbar">
        <div style={{ minWidth: `${Math.max(chartData.length * 10, 800)}px`, height: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={1} barCategoryGap={1}>
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0a1120', borderColor: '#334155', color: '#e2e8f0', fontSize: '11px', padding: '4px 8px' }}
                cursor={{ fill: '#334155', opacity: 0.4 }}
                formatter={(value: number, name: string) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
              />
              <Bar dataKey="total" radius={[1, 1, 1, 1]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getDominantColor(entry)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="px-4 py-1.5 bg-[#131f37] text-[10px] text-slate-500 border-t border-slate-700/60">
        ← Scroll horizontally · Click block for details →
      </div>
    </div>
  );
};
