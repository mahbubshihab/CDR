import React, { useState, useMemo } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { getBPartyOperator } from '../../../../utils/operators';
import { MetricsSummary } from './components/MetricsSummary';
import { CarrierChart } from './components/CarrierChart';
import { AIKeyFindings } from './components/AIKeyFindings';
import { LeadsGrid } from './components/LeadsGrid';

interface AdvancedCDRAnalysisProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

export const AdvancedCDRAnalysis: React.FC<AdvancedCDRAnalysisProps> = ({ 
  cdrFile, records 
}) => {
  // Date and Activity Filters State
  const [dateFilter, setDateFilter] = useState<'all' | '3days' | '7days' | '30days' | 'month'>('all');
  const [activityFilter, setActivityFilter] = useState<'all' | 'incoming_calls' | 'outgoing_calls' | 'incoming_sms' | 'outgoing_sms'>('all');

  // Filtered records
  const filteredRecords = useMemo(() => {
    let result = [...records];

    // Apply activity filter
    if (activityFilter === 'incoming_calls') {
      result = result.filter(r => r.usageType.toLowerCase() === 'mtc');
    } else if (activityFilter === 'outgoing_calls') {
      result = result.filter(r => r.usageType.toLowerCase() === 'moc');
    } else if (activityFilter === 'incoming_sms') {
      result = result.filter(r => r.usageType.toLowerCase() === 'sms_mtc');
    } else if (activityFilter === 'outgoing_sms') {
      result = result.filter(r => r.usageType.toLowerCase() === 'sms_moc');
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      if (records.length > 0) {
        const maxTime = Math.max(...records.map(r => r.timestamp));
        let cutoff = 0;
        if (dateFilter === '3days') cutoff = 3 * 24 * 3600 * 1000;
        else if (dateFilter === '7days') cutoff = 7 * 24 * 3600 * 1000;
        else if (dateFilter === '30days') cutoff = 30 * 24 * 3600 * 1000;
        else if (dateFilter === 'month') cutoff = 30 * 24 * 3600 * 1000; // fallback

        result = result.filter(r => maxTime - r.timestamp <= cutoff);
      }
    }

    return result;
  }, [records, dateFilter, activityFilter]);

  // Dynamic Statistics Calculations
  const stats = useMemo(() => {
    const totalCount = filteredRecords.length;
    const calls = filteredRecords.filter(r => ['moc', 'mtc'].includes(r.usageType.toLowerCase()));
    const sms = filteredRecords.filter(r => r.usageType.toLowerCase().includes('sms'));
    
    // Unique B-Parties
    const contactsSet = new Set(filteredRecords.map(r => r.otherParty).filter(Boolean));
    
    // Unique IMEIs
    const imeisSet = new Set(filteredRecords.map(r => r.imei).filter(Boolean));
    
    // Unique IMSIs
    const imsiFreq: Record<string, number> = {};
    filteredRecords.forEach(r => {
      if (r.imsi) {
        imsiFreq[r.imsi] = (imsiFreq[r.imsi] || 0) + 1;
      }
    });
    let topImsi = '';
    let maxImsiCount = 0;
    Object.entries(imsiFreq).forEach(([imsi, count]) => {
      if (count > maxImsiCount) {
        maxImsiCount = count;
        topImsi = imsi;
      }
    });
    
    // Unique Locations
    const locationsSet = new Set(filteredRecords.map(r => r.address).filter(Boolean));

    // Active days count
    const activeDaysSet = new Set(filteredRecords.map(r => {
      const d = new Date(r.timestamp);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }));

    // Operator Distribution
    const opCounts: Record<string, number> = {};
    filteredRecords.forEach(r => {
      const op = getBPartyOperator(r.otherParty);
      opCounts[op] = (opCounts[op] || 0) + 1;
    });

    // Day vs Night calls
    const dayCalls = calls.filter(r => {
      const hr = new Date(r.timestamp).getHours();
      return hr >= 6 && hr < 22; // 6 AM to 10 PM
    });
    const nightCalls = calls.filter(r => {
      const hr = new Date(r.timestamp).getHours();
      return hr < 6 || hr >= 22; // 10 PM to 6 AM
    });

    const dayCallsCount = dayCalls.length;
    const nightCallsCount = nightCalls.length;

    // Most used IMEI
    const imeiFreq: Record<string, number> = {};
    filteredRecords.forEach(r => {
      if (r.imei) imeiFreq[r.imei] = (imeiFreq[r.imei] || 0) + 1;
    });
    let mostUsedImei = '—';
    let maxImeiCount = 0;
    Object.entries(imeiFreq).forEach(([imei, count]) => {
      if (count > maxImeiCount) {
        maxImeiCount = count;
        mostUsedImei = imei;
      }
    });

    // Top contacted target (B-party)
    const partyFreq: Record<string, number> = {};
    filteredRecords.forEach(r => {
      if (r.otherParty) partyFreq[r.otherParty] = (partyFreq[r.otherParty] || 0) + 1;
    });
    let topParty = '—';
    let maxPartyCount = 0;
    Object.entries(partyFreq).forEach(([party, count]) => {
      if (count > maxPartyCount) {
        maxPartyCount = count;
        topParty = party;
      }
    });

    // Top visited address
    const addressFreq: Record<string, number> = {};
    filteredRecords.forEach(r => {
      if (r.address) addressFreq[r.address] = (addressFreq[r.address] || 0) + 1;
    });
    let topAddress = '—';
    let maxAddressCount = 0;
    Object.entries(addressFreq).forEach(([addr, count]) => {
      if (count > maxAddressCount) {
        maxAddressCount = count;
        topAddress = addr;
      }
    });

    // Key findings timeline limits
    let firstActivityDate = '—';
    let lastActivityDate = '—';
    if (filteredRecords.length > 0) {
      const times = filteredRecords.map(r => r.timestamp);
      firstActivityDate = new Date(Math.min(...times)).toISOString().split('T')[0];
      lastActivityDate = new Date(Math.max(...times)).toISOString().split('T')[0];
    }

    // Peak activity day calculation
    const dayFreq: Record<string, number> = {};
    filteredRecords.forEach(r => {
      const d = new Date(r.timestamp).toISOString().split('T')[0];
      dayFreq[d] = (dayFreq[d] || 0) + 1;
    });
    let peakDay = '—';
    let peakDayCount = 0;
    Object.entries(dayFreq).forEach(([day, count]) => {
      if (count > peakDayCount) {
        peakDayCount = count;
        peakDay = day;
      }
    });

    // Top active hour
    const hourFreq: Record<number, number> = {};
    filteredRecords.forEach(r => {
      const hr = new Date(r.timestamp).getHours();
      hourFreq[hr] = (hourFreq[hr] || 0) + 1;
    });
    let peakHour = -1;
    let peakHourCount = 0;
    Object.entries(hourFreq).forEach(([hrStr, count]) => {
      const hr = parseInt(hrStr, 10);
      if (count > peakHourCount) {
        peakHourCount = count;
        peakHour = hr;
      }
    });

    const callsCount = calls.length;
    const smsCount = sms.length;
    const activeDays = activeDaysSet.size;
    const locationsCount = locationsSet.size;
    const nightRatio = ((nightCallsCount / (callsCount || 1)) * 100).toFixed(1);

    return {
      totalCount,
      callsCount,
      smsCount,
      activeDays,
      locationsCount,
      opCounts,
      topParty,
      maxPartyCount,
      topAddress,
      maxAddressCount,
      mostUsedImei,
      maxImeiCount,
      topImsi,
      maxImsiCount,
      dayCallsCount,
      nightCallsCount,
      firstActivityDate,
      lastActivityDate,
      peakDay,
      peakDayCount,
      peakHour,
      peakHourCount,
      nightRatio
    };
  }, [filteredRecords]);

  return (
    <div className="w-full h-full flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar text-left animate-in fade-in duration-300 bg-[#121212]">
      
      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2e2e2e]/55 pb-4 shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-gray-200">Advanced Log Intelligence</h3>
          <p className="text-xs text-gray-500 mt-0.5">Automated signal forensics, timeline anomalies, and dynamic device tracking</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg p-1">
            {(['all', '3days', '7days', '30days'] as const).map(f => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                  dateFilter === f ? 'bg-[#2e2e2e] text-white font-semibold' : 'text-gray-455 hover:text-gray-200'
                }`}
              >
                {f === 'all' ? 'All' : f === '3days' ? '3D' : f === '7days' ? '7D' : '30D'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg p-1">
            {(['all', 'incoming_calls', 'outgoing_calls', 'incoming_sms', 'outgoing_sms'] as const).map(f => (
              <button
                key={f}
                onClick={() => setActivityFilter(f)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                  activityFilter === f ? 'bg-[#2e2e2e] text-white font-semibold' : 'text-gray-455 hover:text-gray-200'
                }`}
              >
                {f === 'all' ? 'All Types' : f === 'incoming_calls' ? 'MTC' : f === 'outgoing_calls' ? 'MOC' : f === 'incoming_sms' ? 'SMS-In' : 'SMS-Out'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <MetricsSummary stats={stats} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <CarrierChart totalCount={stats.totalCount} opCounts={stats.opCounts} />
        <AIKeyFindings stats={stats} />
      </div>

      <LeadsGrid stats={stats} />

    </div>
  );
};
