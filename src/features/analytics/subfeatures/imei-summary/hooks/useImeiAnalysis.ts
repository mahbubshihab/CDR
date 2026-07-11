import { useMemo } from 'react';
import type { CDRRecord } from '../../../../../utils/db';
import { validateAndCorrectImei, type ImeiValidationResult } from '../utils/imeiUtils';

export interface ImeiAnalysisRow extends ImeiValidationResult {
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
  uniqueLocations: number;
  usagePercentage: number;
  uniqueSims: number;
  confidence: 'High' | 'Low' | 'Medium';
}

export interface ImeiActivityChartData {
  imei: string;
  date: string;
  events: number;
}

export interface ImeiSummaryStats {
  totalDevices: number;
  validDevices: number;
  correctedDevices: number;
  invalidDevices: number;
  emptyRows: number;
  switches: number;
  multipleDevices: boolean;
  deviceSwitching: boolean;
  sharedImei: boolean;
  correctedCount: number;
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

export function useImeiAnalysis(records: CDRRecord[]) {
  return useMemo(() => {
    let emptyRows = 0;
    const imeiMap = new Map<string, {
      validation: ImeiValidationResult;
      usageCount: number;
      inCalls: number;
      outCalls: number;
      inSms: number;
      outSms: number;
      totalDuration: number;
      firstEpoch: number;
      lastEpoch: number;
      uniqueNumbers: Set<string>;
      uniqueLocations: Set<string>;
      uniqueDates: Set<string>;
      uniqueSims: Set<string>;
    }>();

    // To track switching
    let switches = 0;
    let previousImei: string | null = null;
    let sharedImeiDetected = false;

    // Make sure records are sorted chronologically
    const sortedRecords = [...records].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    sortedRecords.forEach(r => {
      if (!r.imei || r.imei.trim() === '') {
        emptyRows++;
        return;
      }

      // Track switching
      if (previousImei !== null && previousImei !== r.imei) {
        switches++;
      }
      previousImei = r.imei;

      let entry = imeiMap.get(r.imei);
      if (!entry) {
        entry = {
          validation: validateAndCorrectImei(r.imei),
          usageCount: 0,
          inCalls: 0,
          outCalls: 0,
          inSms: 0,
          outSms: 0,
          totalDuration: 0,
          firstEpoch: r.timestamp || 0,
          lastEpoch: r.timestamp || 0,
          uniqueNumbers: new Set<string>(),
          uniqueLocations: new Set<string>(),
          uniqueDates: new Set<string>(),
          uniqueSims: new Set<string>()
        };
        imeiMap.set(r.imei, entry);
      }

      entry.usageCount++;
      if (r.timestamp) {
        entry.uniqueDates.add(formatDate(r.timestamp));
        if (r.timestamp < entry.firstEpoch || entry.firstEpoch === 0) entry.firstEpoch = r.timestamp;
        if (r.timestamp > entry.lastEpoch) entry.lastEpoch = r.timestamp;
      }

      if (r.otherParty) entry.uniqueNumbers.add(r.otherParty);
      
      const locKey = `${r.lac}-${r.cellId}`;
      if (r.lac && r.cellId) entry.uniqueLocations.add(locKey);

      if (r.imsi) entry.uniqueSims.add(r.imsi);

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

    const totalValidRecords = sortedRecords.length - emptyRows;
    const tableData: ImeiAnalysisRow[] = [];
    
    let validDevices = 0;
    let correctedDevices = 0;
    let invalidDevices = 0;

    imeiMap.forEach((entry) => {
      if (entry.validation.status === 'VALID') validDevices++;
      if (entry.validation.status === 'CORRECTED') correctedDevices++;
      if (entry.validation.status === 'INVALID') invalidDevices++;

      if (entry.uniqueNumbers.size > 100 && entry.uniqueSims.size > 2) {
        // Just a heuristic for "Shared IMEI" or "Bulk SMS box" based on large unique sims/numbers
        sharedImeiDetected = true;
      }

      const totalComms = entry.inCalls + entry.outCalls + entry.inSms + entry.outSms;
      const minutes = Math.round(entry.totalDuration / 60);
      const usagePercentage = totalValidRecords > 0 ? Math.round((entry.usageCount / totalValidRecords) * 100) : 0;

      let confidence: 'High' | 'Low' | 'Medium' = 'High';
      if (entry.validation.status === 'INVALID') confidence = 'Low';
      else if (entry.validation.status === 'CORRECTED') confidence = 'Medium';

      tableData.push({
        ...entry.validation,
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
        uniqueLocations: entry.uniqueLocations.size,
        usagePercentage,
        uniqueSims: entry.uniqueSims.size,
        confidence
      });
    });

    // Sort by usage count descending
    tableData.sort((a, b) => b.usageCount - a.usageCount);

    const stats: ImeiSummaryStats = {
      totalDevices: tableData.length,
      validDevices,
      correctedDevices,
      invalidDevices,
      emptyRows,
      switches,
      multipleDevices: tableData.length > 1,
      deviceSwitching: switches > 0,
      sharedImei: sharedImeiDetected,
      correctedCount: correctedDevices
    };

    // Prepare chart data (simple top 5 or so for usage frequency)
    const chartData = tableData.slice(0, 10).map(row => ({
      imei: row.corrected,
      usageCount: row.usageCount,
      linkedNumbers: row.uniqueNumbers
    }));

    return { tableData, stats, chartData };
  }, [records]);
}
