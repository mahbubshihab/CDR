import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Search } from 'lucide-react';
import { type CDRRecord } from '../../../../utils/db';

interface TimelineChartProps {
  records: CDRRecord[];
}

export const TimelineChart: React.FC<TimelineChartProps> = ({ records }) => {
  const chartData = useMemo(() => {
    // Group records by day for a high-level timeline, or by hour if we want it denser.
    // Let's group by day for this mockup, creating a dense array.
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
        else entry.call++; // default to call if unknown for visual sake
      }
    });

    return Array.from(dataMap.values());
  }, [records]);

  // To simulate the dense block look from the screenshot, we'll map each entry to a primary color.
  // The screenshot shows bars that are solidly one color (the dominant type).
  const getDominantColor = (entry: any) => {
    if (entry.data > entry.call && entry.data > entry.sms) return '#a855f7'; // Purple for data
    if (entry.sms > entry.call) return '#22c55e'; // Green for SMS
    if (entry.total === 0) return 'transparent';
    return '#3b82f6'; // Blue for Call
  };

  return (
    <div className="bg-[#121212] border border-[#2e2e2e] rounded-lg overflow-hidden flex flex-col">
      {/* Chart Toolbar */}
      <div className="p-3 border-b border-[#2e2e2e] flex items-center justify-between bg-[#171717]">
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-[#2e2e2e] rounded text-gray-400 hover:text-white transition-colors cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
          <button className="p-1.5 hover:bg-[#2e2e2e] rounded text-gray-400 hover:text-white transition-colors cursor-pointer"><ZoomOut className="w-4 h-4" /></button>
          <span className="text-xs text-gray-400 px-2 font-mono">100%</span>
          <button className="p-1.5 hover:bg-[#2e2e2e] rounded text-gray-400 hover:text-white transition-colors cursor-pointer"><ZoomIn className="w-4 h-4" /></button>
          <button className="p-1.5 hover:bg-[#2e2e2e] rounded text-gray-400 hover:text-white transition-colors cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
        </div>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="Compare number..." 
            className="bg-[#1c1c1c] border border-[#3e3e3e] rounded-full pl-8 pr-4 py-1 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 w-48"
          />
          <Search className="w-3 h-3 text-gray-500 absolute left-3 top-1.5" />
        </div>
      </div>

      {/* Chart Area */}
      <div className="p-4 h-48 relative w-full overflow-x-auto custom-scrollbar">
        <div style={{ minWidth: `${Math.max(chartData.length * 8, 800)}px`, height: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barGap={1} barCategoryGap={1}>
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1c1c1c', borderColor: '#2e2e2e', color: '#e5e7eb', fontSize: '12px' }}
                cursor={{ fill: '#2e2e2e', opacity: 0.4 }}
                formatter={(value: number, name: string) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
              />
              <Bar dataKey="total" radius={[2, 2, 2, 2]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getDominantColor(entry)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="absolute bottom-2 left-4 text-[10px] text-gray-500">
          ← Scroll horizontally · Click block for details →
        </div>
      </div>
    </div>
  );
};
