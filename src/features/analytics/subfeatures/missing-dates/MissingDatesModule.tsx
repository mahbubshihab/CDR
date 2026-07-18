import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Filter, Info, AlertTriangle, Download, Printer, Clock, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';

interface MissingDatesModuleProps {
  cdrFile: CDRFile | null;
  records: CDRRecord[];
}

interface DateStats {
  dateStr: string; // YYYY-MM-DD
  date: Date;
  isActive: boolean;
  count: number;
}

interface Period {
  start: Date;
  end: Date;
  days: number;
}

export const MissingDatesModule: React.FC<MissingDatesModuleProps> = ({ cdrFile, records }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Monthly view');
  const [dateStats, setDateStats] = useState<DateStats[]>([]);
  
  const [activePeriods, setActivePeriods] = useState<Period[]>([]);
  const [missingPeriods, setMissingPeriods] = useState<Period[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
  const [weekdayStats, setWeekdayStats] = useState<any[]>([]);

  const [globalStats, setGlobalStats] = useState({
    totalDays: 0,
    activeDays: 0,
    missingDays: 0,
    activityPercentage: 0,
    missingPercentage: 0,
    firstRecord: '',
    lastRecord: '',
    longestMissingGap: 0,
    longestActivePeriod: 0,
    firstMissing: '',
    lastMissing: '',
    activePeriodCount: 0,
    missingGapsCount: 0
  });

  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    if (!records || records.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const timer = setTimeout(() => {
      try {
        const sortedRecords = [...records].sort((a, b) => a.timestamp - b.timestamp);
        if (sortedRecords.length === 0) return;

        const firstDate = new Date(sortedRecords[0].timestamp);
        const lastDate = new Date(sortedRecords[sortedRecords.length - 1].timestamp);
        firstDate.setHours(0, 0, 0, 0);
        lastDate.setHours(0, 0, 0, 0);

        const dateMap = new Map<string, number>();
        for (const record of sortedRecords) {
          const d = new Date(record.timestamp);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
        }

        const stats: DateStats[] = [];
        let current = new Date(firstDate);
        let activeDaysCount = 0;
        let missingDaysCount = 0;
        
        const aPeriods: Period[] = [];
        const mPeriods: Period[] = [];
        let currentPeriodStart: Date | null = null;
        let currentIsActive = false;

        let maxMissingGap = 0;
        let maxActivePeriod = 0;
        
        const monthMap = new Map<string, { total: number, active: number, missing: number, name: string }>();
        const wdMap = [0,0,0,0,0,0,0]; // Sun to Sat (missing counts)

        while (current <= lastDate) {
          const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
          const count = dateMap.get(dateStr) || 0;
          const isActive = count > 0;
          const clonedDate = new Date(current);
          
          stats.push({ dateStr, date: clonedDate, isActive, count });
          
          const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
          if (!monthMap.has(monthKey)) {
            monthMap.set(monthKey, { total: 0, active: 0, missing: 0, name: current.toLocaleString('default', { month: 'short', year: 'numeric' }) });
          }
          const mStat = monthMap.get(monthKey)!;
          mStat.total++;

          if (isActive) {
            activeDaysCount++;
            mStat.active++;
          } else {
            missingDaysCount++;
            mStat.missing++;
            wdMap[current.getDay()]++;
          }

          if (currentPeriodStart === null) {
            currentPeriodStart = clonedDate;
            currentIsActive = isActive;
          } else if (currentIsActive !== isActive) {
            const days = Math.round((clonedDate.getTime() - currentPeriodStart.getTime()) / (1000 * 3600 * 24));
            const p: Period = { start: currentPeriodStart, end: new Date(clonedDate.getTime() - 86400000), days };
            if (currentIsActive) {
              aPeriods.push(p);
              if (days > maxActivePeriod) maxActivePeriod = days;
            } else {
              mPeriods.push(p);
              if (days > maxMissingGap) maxMissingGap = days;
            }
            currentPeriodStart = clonedDate;
            currentIsActive = isActive;
          }
          
          current.setDate(current.getDate() + 1);
        }
        
        if (currentPeriodStart !== null) {
          const clonedDate = new Date(current);
          const days = Math.round((clonedDate.getTime() - currentPeriodStart.getTime()) / (1000 * 3600 * 24));
          const p: Period = { start: currentPeriodStart, end: new Date(clonedDate.getTime() - 86400000), days };
          if (currentIsActive) {
            aPeriods.push(p);
            if (days > maxActivePeriod) maxActivePeriod = days;
          } else {
            mPeriods.push(p);
            if (days > maxMissingGap) maxMissingGap = days;
          }
        }

        const totalDays = stats.length;
        setDateStats(stats);
        setActivePeriods(aPeriods);
        setMissingPeriods(mPeriods);
        
        setMonthlyStats(Array.from(monthMap.values()));
        setWeekdayStats([
          { name: 'Sunday', missing: wdMap[0] },
          { name: 'Monday', missing: wdMap[1] },
          { name: 'Tuesday', missing: wdMap[2] },
          { name: 'Wednesday', missing: wdMap[3] },
          { name: 'Thursday', missing: wdMap[4] },
          { name: 'Friday', missing: wdMap[5] },
          { name: 'Saturday', missing: wdMap[6] },
        ]);
        
        const formatDateStr = (d: Date) => `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
        
        setGlobalStats({
          totalDays,
          activeDays: activeDaysCount,
          missingDays: missingDaysCount,
          activityPercentage: totalDays > 0 ? Number(((activeDaysCount / totalDays) * 100).toFixed(2)) : 0,
          missingPercentage: totalDays > 0 ? Number(((missingDaysCount / totalDays) * 100).toFixed(2)) : 0,
          firstRecord: formatDateStr(firstDate),
          lastRecord: formatDateStr(lastDate),
          longestMissingGap: maxMissingGap,
          longestActivePeriod: maxActivePeriod,
          firstMissing: mPeriods.length > 0 ? formatDateStr(mPeriods[0].start) : 'N/A',
          lastMissing: mPeriods.length > 0 ? formatDateStr(mPeriods[mPeriods.length - 1].end) : 'N/A',
          activePeriodCount: aPeriods.length,
          missingGapsCount: mPeriods.length
        });

        setDateRange({
          start: `${String(firstDate.getDate()).padStart(2, '0')}/${String(firstDate.getMonth() + 1).padStart(2, '0')}/${firstDate.getFullYear()}`,
          end: `${String(lastDate.getDate()).padStart(2, '0')}/${String(lastDate.getMonth() + 1).padStart(2, '0')}/${lastDate.getFullYear()}`
        });

      } catch (error) {
        console.error("Error processing missing dates:", error);
      } finally {
        setLoading(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [records]);

  const tabs = ['Monthly view', 'Overall statistics', 'Missing dates details', 'Timeline analysis', 'Heatmap', 'Reports'];

  const formatDateLabel = (d: Date) => `${String(d.getDate()).padStart(2, '0')}-${d.toLocaleString('default', { month: 'short' })}-${d.getFullYear()} (${d.toLocaleString('default', { weekday: 'long' })})`;
  const formatShortDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;

  // Helper for rendering monthly view calendar
  const renderMonthlyView = () => {
    // Group stats by month
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
              <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs text-gray-500 font-medium">
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

  const renderOverallStats = () => (
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
        
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4 flex flex-col items-center justify-center text-center col-start-2">
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

  const renderMissingDetails = () => (
    <div className="flex flex-col gap-4 pb-8">
      <div className="mb-2">
        <h3 className="text-lg font-semibold text-white mb-1">Missing dates details</h3>
        <p className="text-sm text-gray-400">All missing dates within the detected CDR range ({globalStats.firstRecord} — {globalStats.lastRecord}), in chronological order.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {dateStats.filter(d => !d.isActive).map((d, i) => (
          <div key={i} className="bg-[#1c1c1c] border border-[#2e2e2e] rounded px-4 py-3 flex items-center gap-3">
            <Clock className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-sm font-medium text-gray-300">{formatDateLabel(d.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTimelineAnalysis = () => (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-8 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4">
          <h3 className="text-teal-400 font-semibold text-sm mb-4">Continuous active periods</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {activePeriods.map((p, i) => (
              <div key={i} className="bg-[#121212] border border-teal-500/20 rounded p-3 text-sm text-gray-300 flex items-center gap-2">
                <span>{formatShortDate(p.start)}</span>
                <span className="text-gray-500">→</span>
                <span>{formatShortDate(p.end)}</span>
                <span className="text-teal-500 ml-auto font-medium">({p.days} day{p.days > 1 ? 's' : ''})</span>
              </div>
            ))}
            {activePeriods.length === 0 && <div className="text-gray-500 text-sm italic">No continuous active periods found.</div>}
          </div>
        </div>
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4">
          <h3 className="text-red-400 font-semibold text-sm mb-4">Continuous missing periods</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {missingPeriods.map((p, i) => (
              <div key={i} className="bg-[#121212] border border-red-500/20 rounded p-3 text-sm text-gray-300 flex items-center gap-2">
                <span>{formatShortDate(p.start)}</span>
                <span className="text-gray-500">→</span>
                <span>{formatShortDate(p.end)}</span>
                <span className="text-red-500 ml-auto font-medium">({p.days} day{p.days > 1 ? 's' : ''})</span>
              </div>
            ))}
            {missingPeriods.length === 0 && <div className="text-gray-500 text-sm italic">No missing periods found.</div>}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 mt-2">
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-red-400 mb-1">{globalStats.longestMissingGap} days</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">LONGEST MISSING GAP</span>
        </div>
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-teal-400 mb-1">{globalStats.longestActivePeriod} days</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">LONGEST ACTIVE PERIOD</span>
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

  const renderHeatmap = () => (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-8 w-full">
      <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-2">Monthly activity heatmap</h3>
        <p className="text-xs text-gray-500 mb-6">Darker red = missing day • Teal/green = active CDR day</p>
        
        <div className="space-y-4">
          {monthlyStats.map(ms => {
            const mDays = dateStats.filter(ds => {
              const k = `${ds.date.getFullYear()}-${String(ds.date.getMonth() + 1).padStart(2, '0')}`;
              return k === ms.name || ds.date.toLocaleString('default', { month: 'short', year: 'numeric' }) === ms.name;
            });
            return (
              <div key={ms.name} className="flex items-center gap-4">
                <div className="w-20 text-xs text-gray-400">{ms.name.split(' ')[0]}</div>
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

      <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-4">Missing by weekday</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekdayStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1c1c1c', borderColor: '#2e2e2e', color: '#e5e7eb' }}
                cursor={{ fill: '#2e2e2e' }}
              />
              <Bar dataKey="missing" name="Missing days" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderReports = () => {
    const missingDaysList = dateStats.filter(d => !d.isActive).map(d => formatDateLabel(d.date)).join(', ');
    const truncatedMissingList = missingDaysList.length > 150 ? missingDaysList.substring(0, 150) + '... (+' + (globalStats.missingDays - 10) + ' more)' : missingDaysList;
    
    return (
      <div className="flex flex-col gap-6 pb-8">
        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Export missing dates</h3>
          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#121212] border border-[#3e3e3e] hover:bg-[#2e2e2e] text-sm text-gray-200 rounded transition-colors">
              <Download className="w-4 h-4 text-gray-400" /> Missing dates table (CSV)
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#121212] border border-[#3e3e3e] hover:bg-[#2e2e2e] text-sm text-gray-200 rounded transition-colors">
              <Download className="w-4 h-4 text-gray-400" /> Missing dates (Excel)
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#121212] border border-[#3e3e3e] hover:bg-[#2e2e2e] text-sm text-gray-200 rounded transition-colors">
              <Printer className="w-4 h-4 text-gray-400" /> Full report (PDF)
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#121212] border border-[#3e3e3e] hover:bg-[#2e2e2e] text-sm text-gray-200 rounded transition-colors">
              <Printer className="w-4 h-4 text-gray-400" /> Print dashboard (PDF)
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#121212] border border-[#3e3e3e] hover:bg-[#2e2e2e] text-sm text-gray-200 rounded transition-colors">
              <Printer className="w-4 h-4 text-gray-400" /> Print calendars (PDF)
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121212] border border-[#2e2e2e] hover:bg-[#2e2e2e] text-xs text-gray-300 rounded transition-colors"><Download className="w-3 h-3" /> CSV (All)</button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121212] border border-[#2e2e2e] hover:bg-[#2e2e2e] text-xs text-gray-300 rounded transition-colors"><Download className="w-3 h-3" /> Excel</button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121212] border border-[#2e2e2e] hover:bg-[#2e2e2e] text-xs text-gray-300 rounded transition-colors"><Printer className="w-3 h-3" /> PDF Report</button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121212] border border-[#2e2e2e] hover:bg-[#2e2e2e] text-xs text-gray-300 rounded transition-colors"><Printer className="w-3 h-3" /> Print</button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121212] border border-[#2e2e2e] hover:bg-[#2e2e2e] text-xs text-gray-300 rounded transition-colors"><Download className="w-3 h-3" /> KML</button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121212] border border-[#2e2e2e] hover:bg-[#2e2e2e] text-xs text-gray-300 rounded transition-colors"><Download className="w-3 h-3" /> KMZ</button>
          </div>
          <p className="text-xs text-gray-500 mt-4">Excel and PDF exports use server-side cached analysis. Print calendars for month-wise PDF views.</p>
        </div>

        <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#2e2e2e]">
            <h3 className="text-sm font-semibold text-white mb-1">Missing dates audit (CDR coverage)</h3>
            <p className="text-xs text-gray-400">Row-wise coverage gaps per dataset segment</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#2e2e2e]">
              <thead className="bg-[#171717]">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Record ID</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Group Type</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Primary Number</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Start Date</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">End Date</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Span Days</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Available Dates</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Missing Dates Count</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Severity</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Missing Dates List</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Missing Dates Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e2e] bg-[#121212]">
                <tr className="hover:bg-[#1c1c1c]/80 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-300 align-top">DATASET-001</td>
                  <td className="px-4 py-3 text-xs text-gray-300 align-top">CDR Dataset<br/>(Overall)</td>
                  <td className="px-4 py-3 text-xs text-gray-300 align-top">{cdrFile?.phoneNumber || 'N/A'}</td>
                  <td className="px-4 py-3 text-xs text-gray-300 align-top">{dateRange.start}</td>
                  <td className="px-4 py-3 text-xs text-gray-300 align-top">{dateRange.end}</td>
                  <td className="px-4 py-3 text-xs text-gray-300 align-top">{globalStats.totalDays}</td>
                  <td className="px-4 py-3 text-xs text-gray-300 align-top">{globalStats.activeDays}</td>
                  <td className="px-4 py-3 text-xs text-gray-300 align-top">{globalStats.missingDays}</td>
                  <td className="px-4 py-3 align-top">
                    {globalStats.missingPercentage > 50 ? (
                      <span className="px-2 py-1 bg-red-900/50 text-red-400 text-[10px] font-bold rounded border border-red-800">HIGH</span>
                    ) : globalStats.missingPercentage > 20 ? (
                      <span className="px-2 py-1 bg-orange-900/50 text-orange-400 text-[10px] font-bold rounded border border-orange-800">MEDIUM</span>
                    ) : (
                      <span className="px-2 py-1 bg-teal-900/50 text-teal-400 text-[10px] font-bold rounded border border-teal-800">LOW</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate align-top">{truncatedMissingList}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 max-w-xs align-top">
                    {globalStats.missingDays} dates missing: {truncatedMissingList}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a] text-gray-200 overflow-hidden">
      {/* Date Range & Filters Header */}
      <div className="p-4 bg-[#121212] flex flex-col gap-4 border-b border-[#2e2e2e]">
        <div className="flex items-center gap-2 bg-[#1c1c1c] px-4 py-2 rounded-md border border-[#2e2e2e] w-max">
          <CalendarIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-300">CDR date range: <span className="text-white font-medium">{globalStats.firstRecord} → {globalStats.lastRecord}</span></span>
          <span className="text-[10px] px-2 py-0.5 ml-2 rounded border border-teal-500/30 text-teal-400 bg-teal-500/10">Range validated</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1c1c1c] rounded border border-[#2e2e2e]">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              className="bg-transparent text-sm text-gray-200 outline-none border-none cursor-pointer"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option>All years</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1c1c1c] rounded border border-[#2e2e2e]">
            <select 
              className="bg-transparent text-sm text-gray-200 outline-none border-none cursor-pointer"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option>All months</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-300 ml-4">
            <input type="text" value={dateRange.start} readOnly className="bg-[#1c1c1c] border border-[#2e2e2e] rounded px-3 py-1.5 w-28 text-center text-gray-400" />
            <span className="text-gray-500">to</span>
            <input type="text" value={dateRange.end} readOnly className="bg-[#1c1c1c] border border-[#2e2e2e] rounded px-3 py-1.5 w-28 text-center text-gray-400" />
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-4 text-sm mr-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-teal-500"></div>
              <span className="text-gray-400">Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-400">Missing</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-2 border-b border-[#2e2e2e] pb-0">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab 
                  ? 'border-blue-500 text-blue-400 bg-blue-500/10' 
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#1c1c1c]'
              }`}
            >
              {tab === 'Monthly view' && <CalendarIcon className="w-4 h-4" />}
              {tab === 'Overall statistics' && <Info className="w-4 h-4" />}
              {tab === 'Missing dates details' && <AlertCircle className="w-4 h-4" />}
              {tab === 'Timeline analysis' && <Clock className="w-4 h-4" />}
              {tab === 'Heatmap' && <BarChart className="w-4 h-4" />}
              {tab === 'Reports' && <Printer className="w-4 h-4" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#0a0a0a]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3ecf8e]"></div>
            <p className="text-gray-400 mt-4 text-sm font-mono">Analyzing dates...</p>
          </div>
        ) : (
          <div className="h-full">
            {activeTab === 'Monthly view' && renderMonthlyView()}
            {activeTab === 'Overall statistics' && renderOverallStats()}
            {activeTab === 'Missing dates details' && renderMissingDetails()}
            {activeTab === 'Timeline analysis' && renderTimelineAnalysis()}
            {activeTab === 'Heatmap' && renderHeatmap()}
            {activeTab === 'Reports' && renderReports()}
          </div>
        )}
      </div>
    </div>
  );
};
