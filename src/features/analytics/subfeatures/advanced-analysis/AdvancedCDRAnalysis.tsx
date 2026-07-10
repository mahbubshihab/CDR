import React, { useMemo } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { QuickSummaryGrid } from './components/QuickSummaryGrid';
import { NetworkDistribution } from '../executive-dashboard/components/NetworkDistribution';
import { ExecutivePortalGrid } from './components/ExecutivePortalGrid';
import { SecondaryPortalGrid } from './components/SecondaryPortalGrid';
import { AIKeyFindings } from './components/AIKeyFindings';
import { LeadGenerationGrid } from './components/LeadGenerationGrid';

interface AdvancedCDRAnalysisProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
  onNavigateToTab?: (tabId: string) => void;
}

// Safe parser for 14-digit dates or epoch number strings
export function parseCDRTimestamp(ts: number | string | any): Date {
  const tsStr = String(ts || '');
  if (tsStr.length === 14) {
    const y = parseInt(tsStr.substring(0, 4), 10);
    const m = parseInt(tsStr.substring(4, 6), 10) - 1;
    const d = parseInt(tsStr.substring(6, 8), 10);
    const hr = parseInt(tsStr.substring(8, 10), 10);
    const min = parseInt(tsStr.substring(10, 12), 10);
    const sec = parseInt(tsStr.substring(12, 14), 10);
    const date = new Date(y, m, d, hr, min, sec);
    if (!isNaN(date.getTime())) return date;
  }
  const date = new Date(Number(ts));
  if (!isNaN(date.getTime())) return date;
  return new Date();
}

// Normalize country coding
function getCountryFromNumber(numberStr: string): string {
  if (!numberStr) return 'Unknown';
  const num = numberStr.replace('+', '');
  if (num.startsWith('92')) return 'Pakistan';
  if (num.startsWith('91')) return 'India';
  if (num.startsWith('44')) return 'United Kingdom';
  if (num.startsWith('1')) return 'USA/Canada';
  if (num.startsWith('880') || num.startsWith('17') || num.startsWith('18') || num.startsWith('19') || num.startsWith('15')) return 'Bangladesh';
  return 'Other Countries';
}

export const AdvancedCDRAnalysis: React.FC<AdvancedCDRAnalysisProps> = ({ 
  cdrFile, records, onNavigateToTab 
}) => {

  // Detect Pakistani vs Bangladeshi dataset origin
  const isPakistanCase = useMemo(() => {
    return records.some(r => {
      if (r.provider && ['Jazz', 'Zong', 'Ufone', 'Telenor', 'Onic', 'SCO'].includes(r.provider)) return true;
      if (r.otherParty && r.otherParty.replace('+', '').startsWith('92')) return true;
      return false;
    });
  }, [records]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const totalCount = records.length;
    const calls = records.filter(r => ['moc', 'mtc'].includes(r.usageType.toLowerCase()));
    const sms = records.filter(r => r.usageType.toLowerCase().includes('sms'));
    const contactsSet = new Set(records.map(r => r.otherParty).filter(Boolean));
    const locationsSet = new Set(records.map(r => r.address).filter(Boolean));
    const imeisSet = new Set(records.map(r => r.imei).filter(Boolean));
    const imsisSet = new Set(records.map(r => r.imsi).filter(Boolean));

    // Target Operator carrier name
    const targetOperator = cdrFile.operator || records[0]?.provider || 'Unknown';

    // Active days count
    const activeDaysSet = new Set(records.map(r => {
      const d = parseCDRTimestamp(r.timestamp);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }));

    // International contacts count
    const uniqueBParties = Array.from(contactsSet);
    const intlCount = uniqueBParties.filter(bp => {
      const clean = bp.replace('+', '');
      if (isPakistanCase) {
        return !clean.startsWith('92') && !clean.startsWith('0');
      } else {
        return !clean.startsWith('880') && !clean.startsWith('0');
      }
    }).length;

    // Ownership stats (Not present in raw CDR file)
    const ownershipFound = 'N/A';

    // Top contacted target (B-party)
    const partyFreq: Record<string, number> = {};
    records.forEach(r => {
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
    records.forEach(r => {
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

    // Most used IMEI
    const imeiFreq: Record<string, number> = {};
    records.forEach(r => {
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

    // Timelines
    let firstActivityDate = '—';
    let lastActivityDate = '—';
    if (records.length > 0) {
      const times = records.map(r => parseCDRTimestamp(r.timestamp).getTime()).filter(t => !isNaN(t));
      if (times.length > 0) {
        firstActivityDate = new Date(Math.min(...times)).toISOString().split('T')[0];
        lastActivityDate = new Date(Math.max(...times)).toISOString().split('T')[0];
      }
    }

    // Peak activity day
    const dayFreq: Record<string, number> = {};
    records.forEach(r => {
      const d = parseCDRTimestamp(r.timestamp).toISOString().split('T')[0];
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
    records.forEach(r => {
      const hr = parseCDRTimestamp(r.timestamp).getHours();
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

    // Day vs Night calls
    const dayCallsCount = calls.filter(r => {
      const hr = parseCDRTimestamp(r.timestamp).getHours();
      return hr >= 6 && hr < 22;
    }).length;
    const nightCallsCount = calls.length - dayCallsCount;
    const nightRatio = ((nightCallsCount / (calls.length || 1)) * 100).toFixed(1);

    return {
      targetOperator,
      totalCount,
      callsCount: calls.length,
      smsCount: sms.length,
      bPartiesCount: contactsSet.size,
      locationsCount: locationsSet.size,
      imeisCount: imeisSet.size,
      imsisCount: imsisSet.size,
      activeDays: activeDaysSet.size,
      intlCount,
      ownershipFound,
      topParty,
      maxPartyCount,
      topAddress,
      maxAddressCount,
      mostUsedImei,
      maxImeiCount,
      firstActivityDate,
      lastActivityDate,
      peakDay,
      peakDayCount,
      peakHour,
      peakHourCount,
      nightRatio
    };
  }, [records, cdrFile, isPakistanCase]);

  return (
    <div className="w-full h-full flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar bg-[#121212] animate-in fade-in duration-300">
      
      {/* 1. Quick Summary Grid */}
      <QuickSummaryGrid
        targetOperator={stats.targetOperator}
        totalCalls={stats.callsCount}
        totalSMS={stats.smsCount}
        totalContacts={stats.bPartiesCount}
        totalImeis={stats.imeisCount}
        totalImsis={stats.imsisCount}
        totalLocations={stats.locationsCount}
        totalActiveDays={stats.activeDays}
        internationalContacts={stats.intlCount}
        ownershipFound={stats.ownershipFound}
      />

      {/* 2. Network Distribution Summary */}
      <NetworkDistribution
        records={records}
        onOpenNetwork={() => onNavigateToTab?.('network')}
      />

      {/* 3. Executive Portal Grid */}
      <ExecutivePortalGrid
        records={records}
        isPakistanCase={isPakistanCase}
        onNavigateToTab={onNavigateToTab}
      />

      {/* 4. Secondary Portal Grid */}
      <SecondaryPortalGrid
        locationsCount={stats.locationsCount}
        uniqueBPartiesCount={stats.bPartiesCount}
        firstActivity={stats.firstActivityDate}
        lastActivity={stats.lastActivityDate}
        activeDays={stats.activeDays}
        onNavigateToTab={onNavigateToTab}
      />

      {/* 5. Key Findings */}
      <AIKeyFindings
        stats={stats}
        records={records}
      />

      {/* 6. Investigation Metrics & Automatic Lead Generation */}
      <LeadGenerationGrid
        records={records}
        isPakistanCase={isPakistanCase}
      />

    </div>
  );
};
