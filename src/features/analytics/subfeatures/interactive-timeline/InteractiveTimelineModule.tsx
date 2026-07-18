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
    dayNight: 'Day',
    callerNumber: '',
    receiverBParty: '',
    imei: '',
    location: 'N/A - PESHAWAR'
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilterState(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    // In a real application, this might trigger a more complex re-calculation or fetch.
    // For now, we rely on useMemo to filter records.
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Basic mock filtering based on input (e.g. BParty, location).
      // Case-insensitive includes.
      if (filterState.receiverBParty && !r.otherParty?.includes(filterState.receiverBParty)) return false;
      if (filterState.callerNumber && !r.aparty?.includes(filterState.callerNumber)) return false;
      if (filterState.imei && !r.imei?.includes(filterState.imei)) return false;
      // Ignoring date/time parsing for simplicity in this visual implementation unless needed.
      return true;
    });
  }, [records, filterState]);

  const stats = useMemo(() => {
    let calls = 0;
    let sms = 0;
    let data = 0;
    filteredRecords.forEach(r => {
      if (r.usageType?.toLowerCase().includes('call')) calls++;
      else if (r.usageType?.toLowerCase().includes('sms')) sms++;
      else if (r.usageType?.toLowerCase().includes('data')) data++;
    });
    return { calls, sms, data, total: filteredRecords.length, peak: '2026-04-13 @ 0:00' };
  }, [filteredRecords]);

  return (
    <div className="flex h-full w-full bg-[#0a0a0a] text-gray-200 overflow-hidden">
      {/* Sidebar Filters */}
      <div className="w-72 shrink-0 border-r border-[#2e2e2e] bg-[#121212] overflow-y-auto custom-scrollbar">
        <TimelineFilters 
          filterState={filterState} 
          onFilterChange={handleFilterChange} 
          onApplyFilters={handleApplyFilters}
          stats={stats}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#0a0a0a] flex flex-col gap-4">
        {/* Header Block */}
        <div className="bg-[#1e7b3e] rounded-lg p-4 border border-[#2e2e2e] shadow-sm">
          <h2 className="text-xl font-bold text-white mb-1">Interactive Timeline</h2>
          <p className="text-xs text-[#a0dfb9] font-medium">
            {stats.total} events · <span className="text-blue-300">Blue=Call</span> · <span className="text-green-300">Green=SMS</span> · <span className="text-purple-300">Purple=Data</span>
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
