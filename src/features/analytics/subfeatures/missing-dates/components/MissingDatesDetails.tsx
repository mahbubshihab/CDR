import React from 'react';
import { Clock } from 'lucide-react';

interface DateStats {
  dateStr: string;
  date: Date;
  isActive: boolean;
  count: number;
}

interface MissingDatesDetailsProps {
  dateStats: DateStats[];
  firstRecord: string;
  lastRecord: string;
}

export const MissingDatesDetails: React.FC<MissingDatesDetailsProps> = ({ dateStats, firstRecord, lastRecord }) => {
  const formatDateLabel = (d: Date) => `${String(d.getDate()).padStart(2, '0')}-${d.toLocaleString('default', { month: 'short' })}-${d.getFullYear()} (${d.toLocaleString('default', { weekday: 'long' })})`;

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="mb-2">
        <h3 className="text-lg font-semibold text-white mb-1">Missing dates details</h3>
        <p className="text-sm text-gray-400">All missing dates within the detected CDR range ({firstRecord} — {lastRecord}), in chronological order.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {dateStats.filter(d => !d.isActive).map((d, i) => (
          <div key={i} className="bg-[#1c1c1c] border border-[#2e2e2e] rounded px-4 py-3 flex items-center gap-3">
            <Clock className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-sm font-medium text-gray-300">{formatDateLabel(d.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
