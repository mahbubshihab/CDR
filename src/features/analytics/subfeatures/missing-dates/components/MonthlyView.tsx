import React, { useMemo } from 'react';
import { type DateStats } from '../MissingDatesModule';
import { AlertCircle } from 'lucide-react';

export const MonthlyView: React.FC<{ dateStats: DateStats[] }> = ({ dateStats }) => {
  const months = useMemo(() => {
    const monthMap = new Map<string, DateStats[]>();
    dateStats.forEach(stat => {
      const key = `${stat.date.getFullYear()}-${String(stat.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(key)) monthMap.set(key, []);
      monthMap.get(key)!.push(stat);
    });
    return Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [dateStats]);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="flex flex-col gap-6">
      {months.map(([monthKey, stats]) => {
        const firstDay = stats[0].date;
        const monthName = firstDay.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        // Ensure calendar aligns to Monday
        const startDayIndex = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        const totalDaysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate();
        
        const calendarGrid: (DateStats | null)[] = Array(startDayIndex).fill(null);
        
        // Fill actual dates from stats if they are in the CDR range, otherwise just null/empty
        for (let i = 1; i <= totalDaysInMonth; i++) {
          const dateStr = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
          const stat = stats.find(s => s.dateStr === dateStr);
          calendarGrid.push(stat || null);
        }

        const activeDays = stats.filter(s => s.isActive).length;
        const missingDays = stats.filter(s => !s.isActive).length;
        const totalDays = stats.length;
        const activityPct = totalDays > 0 ? (activeDays / totalDays * 100).toFixed(2) : '0.00';
        const missingPct = totalDays > 0 ? (missingDays / totalDays * 100).toFixed(2) : '0.00';
        
        // We use missingDateStrs for the summary

        const missingDateStrs = stats.filter(s => !s.isActive).map(s => {
            return `${String(s.date.getDate()).padStart(2, '0')} ${s.date.toLocaleString('default', { month: 'short' })} ${s.date.getFullYear()}`;
        });

        return (
          <div key={monthKey} className="bg-[#131f37] border border-[#1e293b] rounded-lg overflow-hidden">
            {/* Header */}
            <div className="p-5 pb-4 flex justify-between items-start border-b border-[#1e293b]">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{monthName}</h3>
                <p className="text-sm text-gray-400">{firstDay.getFullYear()} · {totalDays} days in CDR range</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-full bg-[#112a3d] border border-teal-800 text-teal-400 text-xs font-medium">
                  Active: {activeDays}
                </div>
                <div className="px-3 py-1 rounded-full bg-red-950 border border-red-900 text-red-400 text-xs font-medium">
                  Missing: {missingDays}
                </div>
                <div className="px-3 py-1 rounded-full bg-[#112a3d] border border-blue-900 text-blue-400 text-xs font-medium">
                  Activity: {activityPct}%
                </div>
                <div className="px-3 py-1 rounded-full bg-[#3b2a1a] border border-yellow-900 text-yellow-500 text-xs font-medium">
                  Missing: {missingPct}%
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-5">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {calendarGrid.map((stat, i) => {
                  if (stat === null) {
                    return <div key={`empty-${i}`} className="h-10"></div>; // Empty cell
                  }

                  const isActive = stat.isActive;
                  return (
                    <div 
                      key={stat.dateStr}
                      className={`h-12 flex items-center justify-center text-sm font-semibold rounded-md border transition-all ${
                        isActive 
                          ? 'bg-teal-600/80 border-teal-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' 
                          : 'bg-red-900/60 border-red-700 text-gray-300'
                      }`}
                    >
                      {stat.date.getDate()}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Footer Summary */}
            <div className="px-5 py-4 bg-[#0a1120] border-t border-[#1e293b] flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-semibold text-red-400">Missing in {firstDay.toLocaleString('default', { month: 'long' })}: </span>
                <span className="text-gray-400 leading-relaxed">
                  {missingDateStrs.length > 0 ? missingDateStrs.join(', ') : 'None'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
