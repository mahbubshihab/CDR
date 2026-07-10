import React, { useMemo } from 'react';
import { type CDRRecord } from '../../../../../utils/db';
import { Download, Camera, Printer, Maximize2, Globe } from 'lucide-react';

interface MonthlyInternationalCardsProps {
  records: CDRRecord[];
}

const CardActions = () => (
  <div className="flex items-center gap-1.5 shrink-0 opacity-40 hover:opacity-100 transition-opacity">
    <button className="p-1 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-250 rounded transition-colors cursor-pointer" title="Download data">
      <Download className="h-3 w-3" />
    </button>
    <button className="p-1 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-250 rounded transition-colors cursor-pointer" title="Screenshot">
      <Camera className="h-3 w-3" />
    </button>
    <button className="p-1 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-250 rounded transition-colors cursor-pointer" title="Print">
      <Printer className="h-3 w-3" />
    </button>
    <button className="p-1 hover:bg-[#2e2e2e] text-gray-400 hover:text-gray-250 rounded transition-colors cursor-pointer" title="Maximize">
      <Maximize2 className="h-3 w-3" />
    </button>
  </div>
);

export const MonthlyInternationalCards: React.FC<MonthlyInternationalCardsProps> = ({ records }) => {
  // 15. Monthly Activity Graph
  const monthlyData = useMemo(() => {
    const monthsMap: { [month: string]: number } = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    records.forEach(r => {
      if (r.timestamp) {
        const timeStr = String(r.timestamp);
        let mIdx = -1;
        let yr = '';
        if (timeStr.length === 14) {
          mIdx = parseInt(timeStr.substring(4, 6), 10) - 1;
          yr = timeStr.substring(2, 4);
        } else {
          try {
            const d = new Date(r.timestamp);
            if (!isNaN(d.getTime())) {
              mIdx = d.getMonth();
              yr = d.getFullYear().toString().substring(2);
            }
          } catch (_) {}
        }
        if (mIdx >= 0 && mIdx < 12) {
          const key = `${monthNames[mIdx]} ${yr}`;
          monthsMap[key] = (monthsMap[key] || 0) + 1;
        }
      }
    });

    const list = Object.entries(monthsMap).map(([month, count]) => ({ month, count }));
    const total = list.reduce((a, b) => a + b.count, 0) || 1;
    
    let peakMonth = '—';
    let peakCount = 0;
    list.forEach(item => {
      if (item.count > peakCount) {
        peakCount = item.count;
        peakMonth = item.month;
      }
    });

    return {
      list: list.map(item => ({ ...item, pct: ((item.count / total) * 100).toFixed(1) })),
      peakMonth,
      peakCount,
      totalMonths: list.length
    };
  }, [records]);

  // 16. International Activity Graph
  const internationalData = useMemo(() => {
    const countriesMap: { [country: string]: number } = {};
    records.forEach(r => {
      if (r.otherParty) {
        let num = r.otherParty.replace('+', '');
        if (num.startsWith('0')) num = num.substring(1);
        
        let country = 'Bangladesh';
        if (num.startsWith('92')) country = 'Pakistan';
        else if (num.startsWith('91')) country = 'India';
        else if (num.startsWith('44')) country = 'United Kingdom';
        else if (num.startsWith('971')) country = 'United Arab Emirates';
        else if (num.startsWith('966')) country = 'Saudi Arabia';
        else if (num.startsWith('973')) country = 'Bahrain';
        else if (num.startsWith('965')) country = 'Kuwait';
        else if (num.startsWith('93')) country = 'Afghanistan';
        else if (num.startsWith('49')) country = 'Germany';
        else if (num.startsWith('1')) country = 'USA/Canada';
        
        if (country !== 'Bangladesh') {
          countriesMap[country] = (countriesMap[country] || 0) + 1;
        }
      }
    });

    const sorted = Object.entries(countriesMap)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    const total = sorted.reduce((sum, item) => sum + item.count, 0) || 1;
    return sorted.slice(0, 4).map(item => ({
      ...item,
      pct: ((item.count / total) * 100).toFixed(1)
    }));
  }, [records]);

  return (
    <>
      {/* 15. Monthly Activity Graph */}
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between text-left">
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Monthly Activity Graph</h3>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500 font-mono">
                <span>PEAK MONTH: <strong className="text-[#3ecf8e] font-semibold">{monthlyData.peakMonth} ({monthlyData.peakCount})</strong></span>
              </div>
            </div>
            <CardActions />
          </div>

          {/* Histogram */}
          <div className="h-40 w-full relative flex items-end gap-3.5 border-b border-[#2e2e2e]/55 mt-4 pb-1">
            {monthlyData.list.map((item, idx) => {
              const max = Math.max(...monthlyData.list.map(d => d.count)) || 1;
              const heightPct = (item.count / max) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div 
                    className="w-full bg-[#3ecf8e] rounded-t transition-all duration-150"
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                    title={`${item.month} - ${item.count} events`}
                  />
                  <span className="text-[10px] text-gray-405 mt-2 font-mono text-center truncate max-w-full">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mini Table */}
        <div className="mt-4">
          <div className="overflow-hidden border border-[#2e2e2e]/60 rounded-lg">
            <table className="w-full text-left border-collapse text-[11px] font-mono">
              <thead>
                <tr className="bg-[#171717] border-b border-[#2e2e2e] text-gray-400">
                  <th className="py-1.5 px-3">Month</th>
                  <th className="py-1.5 px-3 text-right">Events</th>
                  <th className="py-1.5 px-3 text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e2e]/40 text-gray-300">
                {monthlyData.list.slice(0, 3).map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#171717]/40">
                    <td className="py-1.5 px-3">{item.month}</td>
                    <td className="py-1.5 px-3 text-right font-semibold text-gray-200">{item.count}</td>
                    <td className="py-1.5 px-3 text-right text-gray-500">{item.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 16. International Activity Graph */}
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between text-left">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">International Activity</h3>
          <CardActions />
        </div>

        <div className="space-y-3.5 mt-4 text-xs font-mono">
          {internationalData.length > 0 ? (
            internationalData.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-gray-300">
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <Globe className="h-3.5 w-3.5 text-gray-500" />
                    <span>{item.country}</span>
                  </span>
                  <span className="font-semibold text-gray-200">{item.count} ({item.pct}%)</span>
                </div>
                <div className="w-full h-1.5 bg-[#121212] border border-[#2e2e2e] rounded-full overflow-hidden">
                  <div className="bg-[#3ecf8e] h-full" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))
          ) : (
            <div className="h-28 flex items-center justify-center text-gray-500">
              No international activity logged.
            </div>
          )}
        </div>
      </div>
    </>
  );
};
