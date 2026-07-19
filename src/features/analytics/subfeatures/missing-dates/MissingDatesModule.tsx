import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Info, AlertCircle, Printer, Clock } from 'lucide-react';
import { BarChart as BarChartIcon } from 'lucide-react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { MonthlyView } from './components/MonthlyView';
import { OverallStatistics } from './components/OverallStatistics';
import { MissingDatesDetails } from './components/MissingDatesDetails';
import { TimelineAnalysis } from './components/TimelineAnalysis';
import { HeatmapAnalysis } from './components/HeatmapAnalysis';
import { ReportsView } from './components/ReportsView';
import { MissingDatesFilters } from './components/MissingDatesFilters';

interface MissingDatesModuleProps {
  cdrFile: CDRFile | null;
  records: CDRRecord[];
}

export interface DateStats {
  dateStr: string; // YYYY-MM-DD
  date: Date;
  isActive: boolean;
  count: number;
}

export interface Period {
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

  const tabs = [
    { id: 'Monthly view', icon: CalendarIcon },
    { id: 'Overall statistics', icon: Info },
    { id: 'Missing dates details', icon: AlertCircle },
    { id: 'Timeline analysis', icon: Clock },
    { id: 'Heatmap', icon: BarChartIcon },
    { id: 'Reports', icon: Printer }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0a1120]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="text-gray-400 mt-4 text-sm font-mono">Analyzing dates...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a] text-gray-200 overflow-y-auto custom-scrollbar font-sans">
      <div className="p-4 flex flex-col gap-4">
        {/* Executive Summary Block */}
        <div className="bg-[#131f37] rounded-lg border border-[#1e293b] p-4 relative overflow-hidden">
          {/* Subtle blue accent line on top */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500/20" />
          <h3 className="text-blue-500 text-xs font-bold tracking-wider mb-2 uppercase">Executive Summary</h3>
          <p className="text-sm text-gray-200 leading-relaxed">
            CDR data spans from <span className="font-semibold text-white">{globalStats.firstRecord}</span> to <span className="font-semibold text-white">{globalStats.lastRecord}</span>. 
            Total covered days: <span className="font-semibold text-white">{globalStats.totalDays}</span>. 
            Missing days: <span className="font-semibold text-white">{globalStats.missingDays}</span>. 
            Coverage ratio: <span className="font-semibold text-white">{globalStats.activityPercentage}%</span>. 
            Longest missing gap: <span className="font-semibold text-white">{globalStats.longestMissingGap} consecutive days</span>.
          </p>
        </div>

        {/* Date Range Indication */}
        <div className="bg-[#131f37] border border-[#1e293b] rounded-lg p-3 flex items-center gap-3">
          <CalendarIcon className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-gray-300">
            CDR date range: <span className="text-white font-semibold ml-1">{globalStats.firstRecord} → {globalStats.lastRecord}</span>
          </span>
          <span className="px-2 py-0.5 rounded-full border border-teal-500/30 text-teal-400 bg-teal-500/10 text-[10px] font-medium ml-2">
            Range validated
          </span>
        </div>

        {/* Filters Row */}
        <MissingDatesFilters 
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          dateRange={dateRange}
        />

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-1 bg-[#131f37] border border-[#1e293b] rounded-lg p-1 w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#1e293b]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.id}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 pt-0">
        <div className="h-full">
          {activeTab === 'Monthly view' && <MonthlyView dateStats={dateStats} />}
          {activeTab === 'Overall statistics' && <OverallStatistics globalStats={globalStats} monthlyStats={monthlyStats} />}
          {activeTab === 'Missing dates details' && <MissingDatesDetails dateStats={dateStats} />}
          {activeTab === 'Timeline analysis' && <TimelineAnalysis activePeriods={activePeriods} missingPeriods={missingPeriods} globalStats={globalStats} />}
          {activeTab === 'Heatmap' && <HeatmapAnalysis monthlyStats={monthlyStats} dateStats={dateStats} weekdayStats={weekdayStats} />}
          {activeTab === 'Reports' && <ReportsView cdrFile={cdrFile} dateStats={dateStats} globalStats={globalStats} dateRange={dateRange} />}
        </div>
      </div>
    </div>
  );
};
