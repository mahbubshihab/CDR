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
    location: ''
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilterState(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (filterState.receiverBParty && !r.otherParty?.includes(filterState.receiverBParty)) return false;
      if (filterState.callerNumber && !r.aparty?.includes(filterState.callerNumber)) return false;
      if (filterState.imei && !r.imei?.includes(filterState.imei)) return false;
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
    <div className="flex h-full w-full bg-[#0a1120] text-gray-200 overflow-hidden font-sans">
      {/* Sidebar Filters */}
      <div className="w-64 shrink-0 border-r border-slate-800 bg-[#131f37] overflow-y-auto custom-scrollbar">
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
        <div className="bg-[#1a7f37] rounded-md p-4 shadow-sm border border-green-800">
          <h2 className="text-xl font-bold text-white mb-1">Interactive Timeline</h2>
          <p className="text-xs text-green-100 font-medium">
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
