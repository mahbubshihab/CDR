import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { parseCDRTimestamp } from '../AdvancedCDRAnalysis';

interface AIKeyFindingsProps {
  stats: {
    firstActivityDate: string;
    lastActivityDate: string;
    peakDay: string;
    peakDayCount: number;
    peakHour: number;
    peakHourCount: number;
    topParty: string;
    maxPartyCount: number;
    topAddress: string;
    maxAddressCount: number;
    mostUsedImei: string;
    maxImeiCount: number;
    activeDays: number;
    bPartiesCount: number;
    smsCount: number;
  };
  records: any[];
}

export const AIKeyFindings: React.FC<AIKeyFindingsProps> = ({ stats, records }) => {
  
  // Calculate longest inactivity gap in days
  const maxGapDays = useMemo(() => {
    if (records.length < 2) return 0;
    const times = records
      .map(r => parseCDRTimestamp(r.timestamp).getTime())
      .filter(t => !isNaN(t))
      .sort((a, b) => a - b);
    
    let maxGapMs = 0;
    for (let i = 1; i < times.length; i++) {
      const diff = times[i] - times[i - 1];
      if (diff > maxGapMs) maxGapMs = diff;
    }
    return Math.floor(maxGapMs / (24 * 3600 * 1000));
  }, [records]);

  const findings = [
    stats.peakDay !== '—' && `Peak activity observed on ${stats.peakDay} with ${stats.peakDayCount} events.`,
    stats.topParty !== '—' && `Most contacted number: ${stats.topParty} (${stats.maxPartyCount} communications).`,
    stats.topAddress !== '—' && `Highest activity location: ${stats.topAddress} (${stats.maxAddressCount} events).`,
    stats.mostUsedImei !== '—' && `Most used IMEI: ${stats.mostUsedImei} (${stats.maxImeiCount} records).`,
    stats.peakHour !== -1 && `Most active hour: ${String(stats.peakHour).padStart(2, '0')}:00 with ${stats.peakHourCount} events.`,
    stats.activeDays > 0 && `Subject active on ${stats.activeDays} days across period ${stats.firstActivityDate} \u2192 ${stats.lastActivityDate}.`,
    `Total unique contacts identified: ${stats.bPartiesCount}.`,
    `SMS volume: ${stats.smsCount} messages in filtered dataset.`,
    maxGapDays > 0 && `Longest inactivity gap: ${maxGapDays} consecutive days without CDR activity.`
  ].filter(Boolean) as string[];

  return (
    <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 space-y-4 text-left font-mono">
      <div className="flex items-center gap-1.5 border-b border-[#2e2e2e]/55 pb-3">
        <Sparkles className="h-4 w-4 text-[#3ecf8e]" />
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
          Key Findings
        </span>
      </div>

      <ul className="space-y-2.5 text-[11px] text-gray-300 list-disc list-inside">
        {findings.map((f, idx) => (
          <li key={idx} className="leading-relaxed hover:text-white transition-colors">
            {f}
          </li>
        ))}
        {findings.length === 0 && (
          <li className="text-gray-600 list-none">No key findings could be generated from current logs.</li>
        )}
      </ul>
    </div>
  );
};
