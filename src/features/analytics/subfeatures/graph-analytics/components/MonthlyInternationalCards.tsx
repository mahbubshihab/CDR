import React, { useMemo, useState } from 'react';
import { type CDRRecord } from '../../../../../utils/db';
import { ChartCardWrapper } from './ChartCardWrapper';
import { Globe } from 'lucide-react';
import { parseCDRTimestamp } from '../../advanced-analysis/AdvancedCDRAnalysis';

interface MonthlyInternationalCardsProps {
  records: CDRRecord[];
}

export const MonthlyInternationalCards: React.FC<MonthlyInternationalCardsProps> = ({ records }) => {
  const [hoveredMonth, setHoveredMonth] = useState<{ month: string; count: number; pct: string } | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<{ country: string; count: number; pct: string } | null>(null);

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
            const d = parseCDRTimestamp(r.timestamp);
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
      <ChartCardWrapper
        title="Monthly Activity Graph"
        exportData={monthlyData.list}
        subdetails={
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400 font-mono">
            <span>PEAK MONTH: <strong className="text-[#3ecf8e] font-semibold">{monthlyData.peakMonth} ({monthlyData.peakCount})</strong></span>
          </div>
        }
      >
        <div className="h-40 w-full relative flex items-end gap-3.5 border-b border-[#2e2e2e]/55 mt-4 pb-1">
          {monthlyData.list.map((item, idx) => {
            const max = Math.max(...monthlyData.list.map(d => d.count)) || 1;
            const heightPct = (item.count / max) * 100;
            return (
              <div 
                key={idx} 
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                onMouseEnter={() => setHoveredMonth(item)}
                onMouseLeave={() => setHoveredMonth(null)}
              >
                <div 
                  className="w-full bg-gradient-to-t from-[#059669] to-[#3ecf8e] hover:brightness-110 shadow-lg shadow-emerald-500/10 rounded-t transition-all duration-150"
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                />
                <span className="text-[10px] text-gray-300 mt-2 font-mono text-center truncate max-w-full">
                  {item.month}
                </span>
              </div>
            );
          })}

          {/* Interactive Floating Tooltip */}
          {hoveredMonth && (
            <div 
              className="absolute bg-[#171717] border border-gray-600 rounded-lg p-2 text-[10px] font-mono text-white shadow-xl z-20 pointer-events-none"
              style={{
                left: '50%',
                top: '5%',
                transform: 'translateX(-50%)'
              }}
            >
              <span className="block text-gray-400 font-bold">{hoveredMonth.month} Events</span>
              <span className="block text-[#3ecf8e] font-semibold mt-0.5">Total: {hoveredMonth.count} ({hoveredMonth.pct}%)</span>
            </div>
          )}
        </div>

        {/* Mini Table */}
        <div className="mt-4">
          <div className="overflow-hidden border border-[#2e2e2e]/60 rounded-lg">
            <table className="w-full text-left border-collapse text-[11px] font-mono">
              <thead>
                <tr className="bg-[#171717] border-b border-[#2e2e2e] text-gray-300">
                  <th className="py-1.5 px-3">Month</th>
                  <th className="py-1.5 px-3 text-right">Events</th>
                  <th className="py-1.5 px-3 text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e2e]/40 text-gray-300">
                {monthlyData.list.slice(0, 3).map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#171717]/40">
                    <td className="py-1.5 px-3 text-gray-200 font-medium">{item.month}</td>
                    <td className="py-1.5 px-3 text-right font-semibold text-white">{item.count}</td>
                    <td className="py-1.5 px-3 text-right text-gray-400">{item.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ChartCardWrapper>

      {/* 16. International Activity Graph */}
      <ChartCardWrapper
        title="International Activity"
        exportData={internationalData}
      >
        <div className="space-y-3.5 mt-4 text-xs font-mono relative">
          {internationalData.length > 0 ? (
            internationalData.map((item, idx) => (
              <div 
                key={idx} 
                className="space-y-1 cursor-pointer p-1 rounded hover:bg-[#2e2e2e]/30 transition-colors"
                onMouseEnter={() => setHoveredCountry(item)}
                onMouseLeave={() => setHoveredCountry(null)}
              >
                <div className="flex justify-between items-center text-gray-300">
                  <span className="flex items-center gap-1.5 text-gray-200">
                    <Globe className="h-3.5 w-3.5 text-gray-400" />
                    <span>{item.country}</span>
                  </span>
                  <span className="font-semibold text-white">{item.count} ({item.pct}%)</span>
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

          {/* Interactive Floating Tooltip */}
          {hoveredCountry && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#171717] border border-gray-600 rounded-lg p-2.5 text-[10px] font-mono text-white shadow-xl z-20 pointer-events-none">
              <span className="block text-gray-400 font-bold">Country Activity</span>
              <span className="block text-gray-200 mt-0.5">{hoveredCountry.country}</span>
              <span className="block text-[#3ecf8e] font-semibold mt-0.5">Calls Count: {hoveredCountry.count} ({hoveredCountry.pct}%)</span>
            </div>
          )}
        </div>
      </ChartCardWrapper>
    </>
  );
};
