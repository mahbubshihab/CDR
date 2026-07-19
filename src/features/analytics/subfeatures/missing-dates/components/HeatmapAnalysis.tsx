import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DateStats {
  dateStr: string;
  date: Date;
  isActive: boolean;
  count: number;
}

interface HeatmapAnalysisProps {
  monthlyStats: any[];
  dateStats: DateStats[];
  weekdayStats: any[];
}

export const HeatmapAnalysis: React.FC<HeatmapAnalysisProps> = ({ monthlyStats, dateStats, weekdayStats }) => {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div className="bg-[#121212] border border-[#2e2e2e] rounded-lg p-5">
        <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wide">Monthly activity heatmap</h3>
        <p className="text-xs text-gray-400 mb-6 font-medium">Darker red = missing day • Teal/green = active CDR day</p>
        
        <div className="space-y-4">
          {monthlyStats.map(ms => {
            const mDays = dateStats.filter(ds => {
              const k = `${ds.date.getFullYear()}-${String(ds.date.getMonth() + 1).padStart(2, '0')}`;
              return k === ms.name || ds.date.toLocaleString('default', { month: 'short', year: 'numeric' }) === ms.name;
            });
            return (
              <div key={ms.name} className="flex items-center gap-4">
                <div className="w-20 text-xs text-gray-400 font-semibold uppercase">{ms.name.split(' ')[0]}</div>
                <div className="flex flex-wrap gap-1">
                  {mDays.map((d, i) => (
                    <div 
                      key={i} 
                      title={`${d.dateStr}: ${d.isActive ? 'Active' : 'Missing'}`}
                      className={`w-3 h-3 rounded-sm ${d.isActive ? 'bg-teal-500' : 'bg-red-500'}`}
                    ></div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-[#121212] border border-[#2e2e2e] rounded-lg p-5">
        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wide">Missing by weekday</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekdayStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#e5e7eb' }}
                cursor={{ fill: '#1e293b' }}
              />
              <Bar dataKey="missing" name="Missing days" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
