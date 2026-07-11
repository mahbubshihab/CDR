import { useMemo } from 'react';
import type { CDRRecord } from '../../../../../utils/db';

export interface ImsiAnalysisRow {
  imsi: string;
  operator: string;
  usageCount: number;
  inCalls: number;
  outCalls: number;
  inSms: number;
  outSms: number;
  totalComms: number;
  minutes: number;
  firstDate: string;
  firstTime: string;
  lastDate: string;
  lastTime: string;
  firstEpoch: number;
  lastEpoch: number;
  activeDays: number;
  uniqueNumbers: number;
  uniqueDevices: number; // Unique IMEIs
}

export interface ImsiChartData {
  imsi: string;
  usageCount: number;
  operator: string;
  devices: number;
}

export interface ImsiSwitchEvent {
  fromImsi: string;
  toImsi: string;
  timestamp: string;
  epoch: number;
}

export interface ImsiSummaryStats {
  totalSims: number;
  switches: number;
  deviceSwitches: number;
  sharedSims: number;
  multipleSims: boolean;
  simSwitching: boolean;
  deviceChangeOnSim: boolean;
  sharedImsiActivity: boolean;
  dominantOperator: string;
}

function formatDate(epoch: number): string {
  if (!epoch) return 'N/A';
  const d = new Date(epoch);
  if (isNaN(d.getTime())) return 'N/A';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(epoch: number): string {
  if (!epoch) return 'N/A';
  const d = new Date(epoch);
  if (isNaN(d.getTime())) return 'N/A';
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function useImsiAnalysis(records: CDRRecord[]) {
  return useMemo(() => {
    let emptyRows = 0;
    const imsiMap = new Map<string, {
      imsi: string;
      operator: string;
      usageCount: number;
      inCalls: number;
      outCalls: number;
      inSms: number;
      outSms: number;
      totalDuration: number;
      firstEpoch: number;
      lastEpoch: number;
      uniqueNumbers: Set<string>;
      uniqueDates: Set<string>;
      uniqueImeis: Set<string>;
    }>();

    let switches = 0;
    let deviceSwitches = 0;
    let sharedSims = 0;
    let previousImsi: string | null = null;
    let previousImei: string | null = null;
    const switchEvents: ImsiSwitchEvent[] = [];

    const sortedRecords = [...records].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    sortedRecords.forEach(r => {
      if (!r.imsi || r.imsi.trim() === '') {
        emptyRows++;
        return;
      }

      // Track SIM switching
      if (previousImsi !== null && previousImsi !== r.imsi) {
        switches++;
        switchEvents.push({
          fromImsi: previousImsi,
          toImsi: r.imsi,
          timestamp: `${formatDate(r.timestamp)} ${formatTime(r.timestamp)}`,
          epoch: r.timestamp
        });
      }
      
      // Track Device Switching
      if (previousImei !== null && r.imei && previousImei !== r.imei) {
        deviceSwitches++;
      }

      previousImsi = r.imsi;
      if (r.imei) previousImei = r.imei;

      let entry = imsiMap.get(r.imsi);
      if (!entry) {
        entry = {
          imsi: r.imsi,
          operator: r.provider || 'Unknown',
          usageCount: 0,
          inCalls: 0,
          outCalls: 0,
          inSms: 0,
          outSms: 0,
          totalDuration: 0,
          firstEpoch: r.timestamp || 0,
          lastEpoch: r.timestamp || 0,
          uniqueNumbers: new Set<string>(),
          uniqueDates: new Set<string>(),
          uniqueImeis: new Set<string>()
        };
        imsiMap.set(r.imsi, entry);
      }

      entry.usageCount++;
      if (r.timestamp) {
        entry.uniqueDates.add(formatDate(r.timestamp));
        if (r.timestamp < entry.firstEpoch || entry.firstEpoch === 0) entry.firstEpoch = r.timestamp;
        if (r.timestamp > entry.lastEpoch) entry.lastEpoch = r.timestamp;
      }

      if (r.otherParty) entry.uniqueNumbers.add(r.otherParty);
      if (r.imei) entry.uniqueImeis.add(r.imei);

      if (r.usageType === 'MOC') {
        entry.outCalls++;
        entry.totalDuration += r.duration || 0;
      } else if (r.usageType === 'MTC') {
        entry.inCalls++;
        entry.totalDuration += r.duration || 0;
      } else if (r.usageType === 'SMS_MOC') {
        entry.outSms++;
      } else if (r.usageType === 'SMS_MTC') {
        entry.inSms++;
      }
    });

    const tableData: ImsiAnalysisRow[] = [];
    let multipleSims = false;
    let sharedImsiActivity = false;
    let deviceChangeOnSim = false;

    const operatorCount = new Map<string, number>();

    imsiMap.forEach((entry) => {
      const totalComms = entry.inCalls + entry.outCalls + entry.inSms + entry.outSms;
      const minutes = Math.round(entry.totalDuration / 60);

      if (entry.uniqueNumbers.size > 100 && entry.uniqueImeis.size > 2) {
        sharedImsiActivity = true;
        sharedSims++;
      }

      if (entry.uniqueImeis.size > 1) {
        deviceChangeOnSim = true;
      }

      const currentOpCount = operatorCount.get(entry.operator) || 0;
      operatorCount.set(entry.operator, currentOpCount + entry.usageCount);

      tableData.push({
        imsi: entry.imsi,
        operator: entry.operator,
        usageCount: entry.usageCount,
        inCalls: entry.inCalls,
        outCalls: entry.outCalls,
        inSms: entry.inSms,
        outSms: entry.outSms,
        totalComms,
        minutes,
        firstDate: formatDate(entry.firstEpoch),
        firstTime: formatTime(entry.firstEpoch),
        lastDate: formatDate(entry.lastEpoch),
        lastTime: formatTime(entry.lastEpoch),
        firstEpoch: entry.firstEpoch,
        lastEpoch: entry.lastEpoch,
        activeDays: entry.uniqueDates.size,
        uniqueNumbers: entry.uniqueNumbers.size,
        uniqueDevices: entry.uniqueImeis.size,
      });
    });

    if (tableData.length > 1) multipleSims = true;
    tableData.sort((a, b) => b.usageCount - a.usageCount);

    let dominantOperator = 'Unknown';
    let maxOpCount = -1;
    operatorCount.forEach((count, op) => {
      if (count > maxOpCount) {
        maxOpCount = count;
        dominantOperator = op;
      }
    });

    const stats: ImsiSummaryStats = {
      totalSims: tableData.length,
      switches,
      deviceSwitches,
      sharedSims,
      multipleSims,
      simSwitching: switches > 0,
      deviceChangeOnSim,
      sharedImsiActivity,
      dominantOperator
    };

    const chartData: ImsiChartData[] = tableData.slice(0, 10).map(row => ({
      imsi: row.imsi,
      usageCount: row.usageCount,
      operator: row.operator,
      devices: row.uniqueDevices
    }));

    return { tableData, stats, chartData, switchEvents };
  }, [records]);
}
