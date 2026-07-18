import React from 'react';

interface DateStats {
  dateStr: string;
  date: Date;
  isActive: boolean;
  count: number;
}

interface MonthlyViewProps {
  dateStats: DateStats[];
}

export const MonthlyView: React.FC<MonthlyViewProps> = ({ dateStats }) => {
  const monthsMap = new Map<string, DateStats[]>();
  dateStats.forEach(stat => {
    const k = `${stat.date.getFullYear()}-${String(stat.date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthsMap.has(k)) monthsMap.set(k, []);
    monthsMap.get(k)!.push(stat);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from(monthsMap.entries()).map(([monthKey, days]) => {
        const firstDay = new Date(days[0].date.getFullYear(), days[0].date.getMonth(), 1).getDay();
        const blanks = Array.from({ length: firstDay }, (_, i) => i);
        const monthName = days[0].date.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        const missingCount = days.filter(d => !d.isActive).length;
        const activeCount = days.filter(d => d.isActive).length;

        return (
          <div key={monthKey} className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white">{monthName}</h3>
              <div className="flex gap-2 text-xs">
                <span className="text-teal-400">{activeCount} active</span>
                <span className="text-red-400">{missingCount} missing</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] text-gray-500 font-medium">
              <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {blanks.map(b => (
                <div key={`blank-${b}`} className="aspect-square rounded-sm"></div>
              ))}
              {days.map((d, i) => (
                <div 
                  key={i} 
                  title={`${d.dateStr}: ${d.isActive ? 'Active' : 'Missing'}`}
                  className={`aspect-square rounded-sm flex items-center justify-center text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                    d.isActive ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {d.date.getDate()}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
