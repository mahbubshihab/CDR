import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

interface OverallStatisticsProps {
  globalStats: any;
  monthlyStats: any[];
}

export const OverallStatistics: React.FC<OverallStatisticsProps> = ({ globalStats, monthlyStats }) => {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-white mb-1">{globalStats.totalDays}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">TOTAL DAYS IN RANGE</span>
        </div>
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-teal-400 mb-1">{globalStats.activeDays}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">ACTIVE DAYS</span>
        </div>
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-red-400 mb-1">{globalStats.missingDays}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">MISSING DAYS</span>
        </div>
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-teal-400 mb-1">{globalStats.activityPercentage}%</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">ACTIVITY %</span>
        </div>
        
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-red-400 mb-1">{globalStats.missingPercentage}%</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">MISSING %</span>
        </div>
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4 flex flex-col items-center justify-center text-center">
          <span className="text-lg font-medium text-white mb-1">{globalStats.firstRecord}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">FIRST CDR RECORD</span>
        </div>
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4 flex flex-col items-center justify-center text-center">
          <span className="text-lg font-medium text-white mb-1">{globalStats.lastRecord}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">LAST CDR RECORD</span>
        </div>
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-red-400 mb-1">{globalStats.longestMissingGap} days</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">LONGEST MISSING GAP</span>
        </div>
        
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4 flex flex-col items-center justify-center text-center col-start-2 md:col-start-auto">
          <span className="text-2xl font-bold text-teal-400 mb-1">{globalStats.longestActivePeriod} days</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">LONGEST ACTIVE PERIOD</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Monthly active vs missing</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1c1c1c', borderColor: '#2e2e2e', color: '#e5e7eb' }}
                  itemStyle={{ color: '#e5e7eb' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="missing" name="Missing days" fill="#f97316" radius={[2, 2, 0, 0]} />
                <Bar dataKey="active" name="Active days" fill="#14b8a6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Coverage trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1c1c1c', borderColor: '#2e2e2e', color: '#e5e7eb' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="missing" name="Missing days" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="active" name="Active days" stroke="#14b8a6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg overflow-hidden mt-4">
        <h3 className="text-sm font-semibold text-white p-4 border-b border-[#2e2e2e]">Monthly statistics</h3>
        <table className="min-w-full divide-y divide-[#2e2e2e]">
          <thead className="bg-[#171717]">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Month / Year</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total days</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Active</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Missing</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Activity %</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Missing %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e2e] bg-[#121212]">
            {monthlyStats.map((ms, idx) => (
              <tr key={idx} className="hover:bg-[#1c1c1c]/80 transition-colors">
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300">{ms.name}</td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300">{ms.total}</td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-teal-400">{ms.active}</td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-red-400">{ms.missing}</td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300">
                  {ms.total > 0 ? ((ms.active / ms.total) * 100).toFixed(2) : '0.00'}%
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-300">
                  {ms.total > 0 ? ((ms.missing / ms.total) * 100).toFixed(2) : '0.00'}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-4">
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-red-400 mb-1">{globalStats.missingGapsCount}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">MISSING GAPS</span>
        </div>
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4 flex flex-col items-center justify-center text-center">
          <span className="text-lg font-medium text-orange-400 mb-1">{globalStats.firstMissing}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">FIRST MISSING</span>
        </div>
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4 flex flex-col items-center justify-center text-center">
          <span className="text-lg font-medium text-orange-400 mb-1">{globalStats.lastMissing}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">LAST MISSING</span>
        </div>
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-white mb-1">{globalStats.activePeriodCount}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">ACTIVE PERIOD COUNT</span>
        </div>
      </div>
    </div>
  );
};
