import React from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { useImsiAnalysis } from './hooks/useImsiAnalysis';
import { ImsiSummaryStats } from './components/ImsiSummaryStats';
import { ImsiAlerts } from './components/ImsiAlerts';
import { ImsiCharts } from './components/ImsiCharts';
import { ImsiSwitchingEvents } from './components/ImsiSwitchingEvents';
import { ImsiTable } from './components/ImsiTable';

interface ImsiSummaryProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

export const ImsiSummary: React.FC<ImsiSummaryProps> = ({ cdrFile, records }) => {
  const { tableData, stats, chartData, switchEvents } = useImsiAnalysis(records);

  return (
    <div className="w-full h-full overflow-y-auto p-6 space-y-6 custom-scrollbar text-left bg-[#121212] animate-in fade-in duration-300">
      
      <ImsiSummaryStats phoneNumber={cdrFile.phoneNumber} stats={stats} />
      
      <ImsiAlerts stats={stats} />
      
      {chartData.length > 0 && (
        <ImsiCharts data={chartData} />
      )}

      {switchEvents.length > 0 && (
        <ImsiSwitchingEvents events={switchEvents} />
      )}

      <ImsiTable data={tableData} />

    </div>
  );
};
