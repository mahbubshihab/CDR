import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface OverallStatisticsProps {
  globalStats: any;
  monthlyStats: any[];
}

export const OverallStatistics: React.FC<OverallStatisticsProps> = ({ globalStats, monthlyStats }) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Row 1: Metrics */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'TOTAL DAYS IN RANGE', value: globalStats.totalDays, color: 'text-white' },
          { label: 'ACTIVE DAYS', value: globalStats.activeDays, color: 'text-teal-400' },
          { label: 'MISSING DAYS', value: globalStats.missingDays, color: 'text-red-400' },
          { label: 'ACTIVITY %', value: `${globalStats.activityPercentage}%`, color: 'text-[#22c55e]' },
          { label: 'MISSING %', value: `${globalStats.missingPercentage}%`, color: 'text-yellow-500' }
        ].map((item, i) => (
          <div key={i} className="bg-[#121212] border border-[#2e2e2e] rounded-lg p-5 flex flex-col items-center justify-center text-center shadow-sm h-28">
            <div className={`text-3xl font-bold mb-2 ${item.color}`}>{item.value}</div>
            <div className="text-[10px] text-gray-500 font-bold tracking-wider uppercase">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Row 2: Range & Gaps */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'FIRST CDR RECORD', value: globalStats.firstRecord, color: 'text-teal-300' },
          { label: 'LAST CDR RECORD', value: globalStats.lastRecord, color: 'text-teal-300' },
          { label: 'LONGEST MISSING GAP', value: `${globalStats.longestMissingGap} days`, color: 'text-red-400' },
          { label: 'LONGEST ACTIVE PERIOD', value: `${globalStats.longestActivePeriod} days`, color: 'text-teal-300' }
        ].map((item, i) => (
          <div key={i} className="bg-[#121212] border border-[#2e2e2e] rounded-lg p-5 flex flex-col items-center justify-center text-center shadow-sm h-28">
            <div className={`text-2xl font-bold mb-2 ${item.color}`}>{item.value}</div>
            <div className="text-[10px] text-gray-500 font-bold tracking-wider uppercase">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Row 3: Charts */}
      <div className="grid grid-cols-2 gap-4 h-80">
        {/* Monthly active vs missing (BarChart) */}
        <div className="bg-[#121212] border border-[#2e2e2e] rounded-lg p-4 flex flex-col">
          <h3 className="text-sm font-bold text-white mb-4">Monthly active vs missing</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="active" fill="#0d9488" name="Active" radius={[4, 4, 0, 0]} />
                <Bar dataKey="missing" fill="#f97316" name="Missing" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Coverage trend (LineChart) */}
        <div className="bg-[#121212] border border-[#2e2e2e] rounded-lg p-4 flex flex-col">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Coverage trend
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                />
                <Line type="monotone" dataKey="active" stroke="#0d9488" strokeWidth={2} dot={false} name="Active" />
                <Line type="monotone" dataKey="missing" stroke="#f97316" strokeWidth={2} dot={false} name="Missing" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Monthly statistics table */}
      <div className="bg-[#121212] border border-[#2e2e2e] rounded-lg p-4">
        <h3 className="text-sm font-bold text-white mb-4">Monthly statistics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 font-medium uppercase border-b border-[#2e2e2e]">
              <tr>
                <th className="px-4 py-3 font-medium">Month / year</th>
                <th className="px-4 py-3 text-center font-medium">Total days</th>
                <th className="px-4 py-3 text-center font-medium">Active</th>
                <th className="px-4 py-3 text-center font-medium">Missing</th>
                <th className="px-4 py-3 text-center font-medium">Activity %</th>
                <th className="px-4 py-3 text-center font-medium">Missing %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {monthlyStats.map((stat, idx) => (
                <tr key={idx} className="hover:bg-[#1e293b]/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-200">{stat.name}</td>
                  <td className="px-4 py-3 text-center text-gray-400">{stat.total}</td>
                  <td className="px-4 py-3 text-center text-teal-400">{stat.active}</td>
                  <td className="px-4 py-3 text-center text-red-400">{stat.missing}</td>
                  <td className="px-4 py-3 text-center text-[#22c55e]">{stat.total > 0 ? ((stat.active / stat.total) * 100).toFixed(2) : '0'}%</td>
                  <td className="px-4 py-3 text-center text-yellow-500">{stat.total > 0 ? ((stat.missing / stat.total) * 100).toFixed(2) : '0'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 5: Bottom summary stats */}
      <div className="grid grid-cols-4 gap-4 mt-2">
        {[
          { label: 'MISSING GAPS', value: globalStats.missingGapsCount, color: 'text-white' },
          { label: 'FIRST MISSING', value: globalStats.firstMissing, color: 'text-yellow-500' },
          { label: 'LAST MISSING', value: globalStats.lastMissing, color: 'text-yellow-500' },
          { label: 'ACTIVE PERIOD COUNT', value: globalStats.activePeriodCount, color: 'text-white' }
        ].map((item, i) => (
          <div key={i} className="bg-[#121212] border border-[#2e2e2e] rounded-lg p-5 flex flex-col items-center justify-center text-center shadow-sm h-24">
            <div className={`text-xl font-bold mb-1 ${item.color}`}>{item.value}</div>
            <div className="text-[10px] text-gray-500 font-bold tracking-wider uppercase">{item.label}</div>
          </div>
        ))}
      </div>

    </div>
  );
};
