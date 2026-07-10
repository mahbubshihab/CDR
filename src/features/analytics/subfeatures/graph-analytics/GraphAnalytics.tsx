import React from 'react';
import { AlertCircle } from 'lucide-react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { TimelinePatternCards } from './components/TimelinePatternCards';
import { TypeDurationCards } from './components/TypeDurationCards';
import { DayOfWeekImeiCards } from './components/DayOfWeekImeiCards';
import { DirectionHeatmapCards } from './components/DirectionHeatmapCards';
import { FrequencyLocationCards } from './components/FrequencyLocationCards';
import { DayNightSmsCards } from './components/DayNightSmsCards';
import { IncomingSmsActivityCards } from './components/IncomingSmsActivityCards';
import { MonthlyInternationalCards } from './components/MonthlyInternationalCards';

interface GraphAnalyticsProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

export const GraphAnalytics: React.FC<GraphAnalyticsProps> = ({ cdrFile, records }) => {
  // Guard clause for empty records
  if (!records || records.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8 bg-[#121212]">
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-6 text-center max-w-sm">
          <AlertCircle className="h-8 w-8 text-[#3ecf8e] mx-auto mb-3" />
          <h3 className="text-xs font-semibold text-gray-200">No Records Found</h3>
          <p className="text-xs text-gray-400 mt-1 font-medium">Please upload a valid CDR file first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto p-6 space-y-6 custom-scrollbar text-left bg-[#121212] animate-in fade-in duration-300">
      
      {/* Tab Header */}
      <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold text-gray-200">Graph Analytics Workspace</h2>
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-[#3ecf8e]" />
              <span className="h-2 w-2 rounded-full bg-[#8b5cf6]" />
              <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
              <span className="h-2 w-2 rounded-full bg-red-500" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Comprehensive multidimensional statistical graphs and behavioral timelines for target: <strong className="text-gray-300 font-mono">{cdrFile.phoneNumber}</strong>
          </p>
        </div>
      </div>

      {/* Grid containing 16 analytical cards grouped in 8 component cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
        <TimelinePatternCards records={records} />
        <TypeDurationCards records={records} />
        <DayOfWeekImeiCards records={records} />
        <DirectionHeatmapCards records={records} />
        <FrequencyLocationCards records={records} />
        <DayNightSmsCards records={records} />
        <IncomingSmsActivityCards records={records} />
        <MonthlyInternationalCards records={records} />
      </div>

    </div>
  );
};
