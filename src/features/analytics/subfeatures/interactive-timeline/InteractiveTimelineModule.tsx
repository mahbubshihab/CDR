import React, { useState, useMemo } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { TimelineFilters } from './components/TimelineFilters';
import { TimelineChart } from './components/TimelineChart';
import { ActivityIntensityHeatmap } from './components/ActivityIntensityHeatmap';
import { InvestigationLinks } from './components/InvestigationLinks';
import { TimelineRecordsTable } from './components/TimelineRecordsTable';

interface InteractiveTimelineModuleProps {
  cdrFile: CDRFile | null;
  records: CDRRecord[];
}

export const InteractiveTimelineModule: React.FC<InteractiveTimelineModuleProps> = ({ cdrFile, records }) => {
  const [filterState, setFilterState] = useState({
    fromDate: '',
    toDate: '',
    startTime: '',
    endTime: '',
    periodView: 'Day View',
    dayNight: '',
    callerNumber: '',
    receiverBParty: '',
    imei: '',
    location: ''
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilterState(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // 1. Text searches
      if (filterState.receiverBParty && !r.otherParty?.includes(filterState.receiverBParty)) return false;
      if (filterState.callerNumber && !r.aparty?.includes(filterState.callerNumber)) return false;
      if (filterState.imei && !r.imei?.includes(filterState.imei)) return false;
      if (filterState.location) {
        const searchLoc = filterState.location.toLowerCase();
        const hasLoc = r.address?.toLowerCase().includes(searchLoc);
        if (!hasLoc) return false;
      }

      const d = new Date(r.timestamp);

      // 2. Date filters
      if (filterState.fromDate) {
        const [dd, mm, yyyy] = filterState.fromDate.split('/');
        if (dd && mm && yyyy) {
          const from = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
          if (d < from) return false;
        }
      }
      if (filterState.toDate) {
        const [dd, mm, yyyy] = filterState.toDate.split('/');
        if (dd && mm && yyyy) {
          const to = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd), 23, 59, 59);
          if (d > to) return false;
        }
      }

      // 3. Time filters
      if (filterState.startTime) {
        const [hh, min] = filterState.startTime.split(':');
        if (hh && min) {
          const rMins = d.getHours() * 60 + d.getMinutes();
          const fMins = parseInt(hh) * 60 + parseInt(min);
          if (rMins < fMins) return false;
        }
      }
      if (filterState.endTime) {
        const [hh, min] = filterState.endTime.split(':');
        if (hh && min) {
          const rMins = d.getHours() * 60 + d.getMinutes();
          const fMins = parseInt(hh) * 60 + parseInt(min);
          if (rMins > fMins) return false;
        }
      }

      // 4. Day/Night filter (Day: 06:00-17:59, Night: 18:00-05:59)
      if (filterState.dayNight === 'Day') {
        const hour = d.getHours();
        if (hour < 6 || hour >= 18) return false;
      } else if (filterState.dayNight === 'Night') {
        const hour = d.getHours();
        if (hour >= 6 && hour < 18) return false;
      }

      return true;
    });
  }, [records, filterState]);

  const stats = useMemo(() => {
    let calls = 0;
    let sms = 0;
    let data = 0;
    
    // Calculate peak day
    const dayCounts: Record<string, number> = {};
    let peakDay = '';
    let maxCount = 0;

    filteredRecords.forEach(r => {
      if (r.usageType?.toLowerCase().includes('call')) calls++;
      else if (r.usageType?.toLowerCase().includes('sms')) sms++;
      else if (r.usageType?.toLowerCase().includes('data')) data++;

      const dateStr = new Date(r.timestamp).toISOString().split('T')[0];
      dayCounts[dateStr] = (dayCounts[dateStr] || 0) + 1;
      if (dayCounts[dateStr] > maxCount) {
        maxCount = dayCounts[dateStr];
        peakDay = dateStr;
      }
    });

    return { 
      calls, 
      sms, 
      data, 
      total: filteredRecords.length, 
      peak: peakDay ? `${peakDay} (${maxCount})` : 'N/A' 
    };
  }, [filteredRecords]);

  return (
    <div className="flex h-full w-full bg-[#0a0a0a] text-gray-200 overflow-hidden font-sans">
      {/* Sidebar Filters */}
      <div className="w-64 shrink-0 border-r border-[#2e2e2e] bg-[#121212] overflow-y-auto custom-scrollbar">
        <TimelineFilters 
          filterState={filterState} 
          onFilterChange={handleFilterChange} 
          onApplyFilters={handleApplyFilters}
          stats={stats}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
        {/* Header Block */}
        <div className="bg-[#121212] rounded-md p-4 shadow-sm border border-[#2e2e2e]">
          <h2 className="text-xl font-bold text-white mb-1">Interactive Timeline</h2>
          <p className="text-xs text-gray-400 font-medium">
            {stats.total} events · Blue=Call · Green=SMS · Purple=Data
          </p>
        </div>

        {/* Timeline Chart */}
        <TimelineChart records={filteredRecords} />

        {/* Heatmap */}
        <ActivityIntensityHeatmap records={filteredRecords} />

        {/* Investigation Links */}
        <InvestigationLinks records={filteredRecords} targetNumber={cdrFile?.phoneNumber || ''} />

        {/* Records Table */}
        <TimelineRecordsTable records={filteredRecords} total={stats.total} />
      </div>
    </div>
  );
};
