import React from 'react';
import { Users } from 'lucide-react';

interface MfcMetricsSummaryProps {
  suspectNumber: string;
  totalContacts: number;
  totalCommunications: number;
  perPage: number;
  inCalls: number;
  outCalls: number;
  inSms: number;
  outSms: number;
  totalMin: number;
  totalHrs: number;
}

export const MfcMetricsSummary: React.FC<MfcMetricsSummaryProps> = ({
  suspectNumber,
  totalContacts,
  totalCommunications,
  perPage,
  inCalls,
  outCalls,
  inSms,
  outSms,
  totalMin,
  totalHrs,
}) => {
  const KpiBox = ({ value, label }: { value: string | number; label: string }) => (
    <div className="bg-[#121212] border border-[#2e2e2e] rounded flex flex-col items-center justify-center py-2 px-4 min-w-[80px]">
      <span className="text-white font-bold text-sm leading-tight">{value}</span>
      <span className="text-gray-400 text-[9px] uppercase tracking-wider">{label}</span>
    </div>
  );

  return (
    <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left side */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 text-[#3b82f6] text-[10px] uppercase font-bold tracking-wider mb-1">
          <Users className="h-3.5 w-3.5" />
          <span>MFC ANALYSIS · MOST FREQUENT CONTACTS</span>
        </div>
        <h2 className="text-2xl font-bold text-white font-mono tracking-tight leading-none mb-1">
          {suspectNumber}
        </h2>
        <span className="text-[11px] text-gray-400 font-medium">
          {totalContacts} Pakistani contacts · {totalCommunications} communications · {perPage} per page
        </span>
      </div>

      {/* Right side - KPI Grid */}
      <div className="flex flex-wrap gap-2 md:justify-end">
        <KpiBox value={inCalls} label="In Calls" />
        <KpiBox value={outCalls} label="Out Calls" />
        <KpiBox value={inSms} label="In SMS" />
        <KpiBox value={outSms} label="Out SMS" />
        <KpiBox value={totalMin.toLocaleString()} label="Total Min" />
        <KpiBox value={totalHrs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} label="Total Hrs" />
      </div>
    </div>
  );
};
