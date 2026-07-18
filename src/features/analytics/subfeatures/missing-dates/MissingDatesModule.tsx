import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Filter, Info, AlertTriangle, Printer, Clock, AlertCircle } from 'lucide-react';
import { BarChart as BarChartIcon } from 'lucide-react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { MonthlyView } from './components/MonthlyView';
import { OverallStatistics } from './components/OverallStatistics';
import { MissingDatesDetails } from './components/MissingDatesDetails';
import { TimelineAnalysis } from './components/TimelineAnalysis';
import { HeatmapAnalysis } from './components/HeatmapAnalysis';
import { ReportsView } from './components/ReportsView';

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
  const [selectedYear, setSelectedYear] = useState('All years');
  const [selectedMonth, setSelectedMonth] = useState('All months');

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
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === tab 
                  ? 'border-blue-500 text-blue-400 bg-blue-500/10' 
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#1c1c1c]'
              }`}
            >
              {tab === 'Monthly view' && <CalendarIcon className="w-4 h-4" />}
              {tab === 'Overall statistics' && <Info className="w-4 h-4" />}
              {tab === 'Missing dates details' && <AlertCircle className="w-4 h-4" />}
              {tab === 'Timeline analysis' && <Clock className="w-4 h-4" />}
              {tab === 'Heatmap' && <BarChartIcon className="w-4 h-4" />}
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
            {activeTab === 'Monthly view' && <MonthlyView dateStats={dateStats} />}
            {activeTab === 'Overall statistics' && <OverallStatistics globalStats={globalStats} monthlyStats={monthlyStats} />}
            {activeTab === 'Missing dates details' && <MissingDatesDetails dateStats={dateStats} firstRecord={globalStats.firstRecord} lastRecord={globalStats.lastRecord} />}
            {activeTab === 'Timeline analysis' && <TimelineAnalysis activePeriods={activePeriods} missingPeriods={missingPeriods} globalStats={globalStats} />}
            {activeTab === 'Heatmap' && <HeatmapAnalysis monthlyStats={monthlyStats} dateStats={dateStats} weekdayStats={weekdayStats} />}
            {activeTab === 'Reports' && <ReportsView cdrFile={cdrFile} dateStats={dateStats} globalStats={globalStats} dateRange={dateRange} />}
          </div>
        )}
      </div>
    </div>
  );
};
