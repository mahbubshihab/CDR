import React, { useMemo, useState } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import type { BPartyStats } from './types';
import { MfcMetricsSummary } from './components/MfcMetricsSummary';
import { MfcFilterBar, type MfcFilterState } from './components/MfcFilterBar';
import { MfcHighFrequency } from './components/MfcHighFrequency';
import { MfcChartsRow } from './components/MfcChartsRow';
import { MfcDataTable } from './components/MfcDataTable';

interface MfcAnalysisProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

export const MfcAnalysis: React.FC<MfcAnalysisProps> = ({ cdrFile, records }) => {
  const [filters, setFilters] = useState<MfcFilterState>({
    incomingOnly: false,
    outgoingOnly: false,
    smsOnly: false,
    highFrequency: false,
    minMin: 0,
    minDays: 0,
  });

  // Aggregate stats
  const { allStats, maxActivities, summaryTotals } = useMemo(() => {
    const map = new Map<string, BPartyStats>();
    let maxAct = 1;
    
    const totals = {
      inCalls: 0,
      outCalls: 0,
      inSms: 0,
      outSms: 0,
      duration: 0,
      communications: 0
    };

    records.forEach(r => {
      if (!r.otherParty) return;
      const bNumber = r.otherParty;
      
      let stat = map.get(bNumber);
      if (!stat) {
        stat = {
          bNumber,
          type: 'Pakistani Mobile', // Mocked, ideally from a lookup
          operator: r.provider || 'Unknown',
          country: 'Pakistan',
          
          inCalls: 0,
          outCalls: 0,
          inSms: 0,
          outSms: 0,
          totalActivities: 0,
          
          totalDurationSeconds: 0,
          longestDurationSeconds: 0,
          shortestDurationSeconds: Infinity,
          
          firstDate: '',
          firstTime: '',
          lastDate: '',
          lastTime: '',
          
          firstTimestamp: Infinity,
          lastTimestamp: 0,
          
          activeDays: 0,
          uniqueDays: new Set<string>(),
          
          locations: 0,
          uniqueLocations: new Set<string>(),
          
          imeis: 0,
          uniqueImeis: new Set<string>(),
          
          hourlyActivity: Array(24).fill(0),
          freqScore: 0
        };
        map.set(bNumber, stat);
      }

      // Usage type logic
      const uType = r.usageType.toLowerCase();
      let isIncoming = false;
      let isOutgoing = false;
      let isSms = false;
      let isCall = false;
      
      if (uType.includes('mtc') || uType.includes('incoming call') || uType === 'incoming') {
        isIncoming = true;
        isCall = true;
        stat.inCalls++;
        totals.inCalls++;
      } else if (uType.includes('moc') || uType.includes('outgoing call') || uType === 'outgoing' || uType === 'voice') {
        isOutgoing = true;
        isCall = true;
        stat.outCalls++;
        totals.outCalls++;
      } else if (uType.includes('sms-mt') || uType.includes('incoming sms')) {
        isIncoming = true;
        isSms = true;
        stat.inSms++;
        totals.inSms++;
      } else if (uType.includes('sms-mo') || uType.includes('outgoing sms') || uType === 'sms') {
        isOutgoing = true;
        isSms = true;
        stat.outSms++;
        totals.outSms++;
      } else {
        // Fallback guess
        stat.outCalls++;
        totals.outCalls++;
      }
      
      stat.totalActivities++;
      totals.communications++;

      // Duration
      if (r.duration) {
        stat.totalDurationSeconds += r.duration;
        totals.duration += r.duration;
        if (r.duration > stat.longestDurationSeconds) stat.longestDurationSeconds = r.duration;
        if (r.duration < stat.shortestDurationSeconds) stat.shortestDurationSeconds = r.duration;
      }

      // Time & Temporal
      if (r.timestamp) {
        if (r.timestamp < stat.firstTimestamp) stat.firstTimestamp = r.timestamp;
        if (r.timestamp > stat.lastTimestamp) stat.lastTimestamp = r.timestamp;
        
        try {
          // CDRs often use exact 14 chars like 20260105000000
          const timeStr = String(r.timestamp);
          let dateStr = '';
          let timeOfDayStr = '';
          let hr = 0;
          
          if (timeStr.length === 14) {
            dateStr = `${timeStr.substring(0,4)}-${timeStr.substring(4,6)}-${timeStr.substring(6,8)}`;
            timeOfDayStr = `${timeStr.substring(8,10)}:${timeStr.substring(10,12)}:${timeStr.substring(12,14)}`;
            hr = parseInt(timeStr.substring(8,10), 10);
          } else {
            const d = new Date(r.timestamp);
            if (!isNaN(d.getTime())) {
              dateStr = d.toISOString().split('T')[0];
              timeOfDayStr = d.toTimeString().split(' ')[0];
              hr = d.getHours();
            }
          }
          
          if (dateStr) stat.uniqueDays.add(dateStr);
          if (hr >= 0 && hr < 24) stat.hourlyActivity[hr]++;
        } catch(e) {}
      }

      // Location & IMEI
      if (r.address || r.cellId) stat.uniqueLocations.add(`${r.lac}-${r.cellId}`);
      if (r.imei) stat.uniqueImeis.add(r.imei);
      
      if (stat.totalActivities > maxAct) {
        maxAct = stat.totalActivities;
      }
    });

    // Finalize stats (arrays -> sets -> counts)
    const statsArray = Array.from(map.values()).map(stat => {
      stat.activeDays = stat.uniqueDays.size;
      stat.locations = stat.uniqueLocations.size;
      stat.imeis = stat.uniqueImeis.size;
      if (stat.shortestDurationSeconds === Infinity) stat.shortestDurationSeconds = 0;
      
      // format first/last
      if (stat.firstTimestamp !== Infinity) {
        const timeStr = String(stat.firstTimestamp);
        if (timeStr.length === 14) {
          stat.firstDate = `${timeStr.substring(0,4)}-${timeStr.substring(4,6)}-${timeStr.substring(6,8)}`;
          stat.firstTime = `${timeStr.substring(8,10)}:${timeStr.substring(10,12)}:${timeStr.substring(12,14)}`;
        } else {
           const d = new Date(stat.firstTimestamp);
           if(!isNaN(d.getTime())) {
             stat.firstDate = d.toISOString().split('T')[0];
             stat.firstTime = d.toTimeString().split(' ')[0];
           }
        }
      }
      
      if (stat.lastTimestamp !== 0) {
        const timeStr = String(stat.lastTimestamp);
        if (timeStr.length === 14) {
          stat.lastDate = `${timeStr.substring(0,4)}-${timeStr.substring(4,6)}-${timeStr.substring(6,8)}`;
          stat.lastTime = `${timeStr.substring(8,10)}:${timeStr.substring(10,12)}:${timeStr.substring(12,14)}`;
        } else {
           const d = new Date(stat.lastTimestamp);
           if(!isNaN(d.getTime())) {
             stat.lastDate = d.toISOString().split('T')[0];
             stat.lastTime = d.toTimeString().split(' ')[0];
           }
        }
      }
      
      stat.freqScore = (stat.totalActivities / maxAct) * 100;
      return stat;
    });

    statsArray.sort((a, b) => b.totalActivities - a.totalActivities);

    return { allStats: statsArray, maxActivities: maxAct, summaryTotals: totals };
  }, [records]);

  // Apply Filters
  const filteredStats = useMemo(() => {
    return allStats.filter(stat => {
      if (filters.incomingOnly && (stat.inCalls + stat.inSms === 0)) return false;
      if (filters.outgoingOnly && (stat.outCalls + stat.outSms === 0)) return false;
      if (filters.smsOnly && (stat.inSms + stat.outSms === 0)) return false;
      if (filters.highFrequency && stat.freqScore <= 50) return false;
      
      if (filters.minMin > 0 && (stat.totalDurationSeconds / 60) < filters.minMin) return false;
      if (filters.minDays > 0 && stat.activeDays < filters.minDays) return false;
      
      return true;
    });
  }, [allStats, filters]);

  const topContacts = filteredStats.slice(0, 10);
  const highFreqContacts = allStats.filter(s => s.freqScore > 60).map(s => s.bNumber).slice(0, 5);

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting MFC Analysis as ${format}`);
    // Trigger export logic (mocked for now)
  };

  return (
    <div className="w-full h-full overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar text-left bg-[#121212] animate-in fade-in duration-300 flex flex-col">
      <MfcMetricsSummary 
        suspectNumber={cdrFile.phoneNumber}
        totalContacts={allStats.length}
        totalCommunications={summaryTotals.communications}
        perPage={15}
        inCalls={summaryTotals.inCalls}
        outCalls={summaryTotals.outCalls}
        inSms={summaryTotals.inSms}
        outSms={summaryTotals.outSms}
        totalMin={Math.round(summaryTotals.duration / 60)}
        totalHrs={summaryTotals.duration / 3600}
      />
      
      <MfcFilterBar 
        filters={filters}
        onChange={setFilters}
        onExport={handleExport}
      />

      <MfcHighFrequency contacts={highFreqContacts} />

      <MfcChartsRow topContacts={topContacts} />
      
      <div className="flex-1 min-h-[400px]">
        <MfcDataTable data={filteredStats} />
      </div>
    </div>
  );
};
