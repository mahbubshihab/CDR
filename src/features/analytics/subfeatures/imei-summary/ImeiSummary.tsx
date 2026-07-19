import React from 'react';
import type { CDRFile, CDRRecord } from '../../../../utils/db';
import { useImeiAnalysis } from './hooks/useImeiAnalysis';
import { ImeiSummaryStats } from './components/ImeiSummaryStats';
import { ImeiAlerts } from './components/ImeiAlerts';
import { ImeiCharts } from './components/ImeiCharts';
import { ForensicDeviceCards } from './components/ForensicDeviceCards';
import { ImeiTable } from './components/ImeiTable';

interface ImeiSummaryProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

export const ImeiSummary: React.FC<ImeiSummaryProps> = ({ cdrFile, records }) => {
  const { tableData, stats, chartData } = useImeiAnalysis(records);

  return (
    <div className="w-full h-full overflow-y-auto p-6 space-y-6 custom-scrollbar text-left bg-[#0a0a0a] animate-in fade-in duration-300">
      <ImeiSummaryStats 
        phoneNumber={cdrFile.phoneNumber} 
        totalRecords={records.length} 
        stats={stats} 
      />
      
      <ImeiAlerts stats={stats} />

      {/* Top Controls like Filters could go here (High usage, Shared devices, etc.) */}
      {/* For now, they are just visual in the image or integrated directly into the table component. */}
      
      <ImeiCharts data={chartData} />

      <ForensicDeviceCards data={tableData} />

      <ImeiTable data={tableData} />
    </div>
  );
};
