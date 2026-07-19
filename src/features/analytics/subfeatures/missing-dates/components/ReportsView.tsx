import React from 'react';
import { Download, Printer } from 'lucide-react';
import { type CDRFile } from '../../../../../utils/db';

interface DateStats {
  dateStr: string;
  date: Date;
  isActive: boolean;
  count: number;
}

interface ReportsViewProps {
  cdrFile: CDRFile | null;
  dateStats: DateStats[];
  globalStats: any;
  dateRange: { start: string; end: string };
}

export const ReportsView: React.FC<ReportsViewProps> = ({ cdrFile, dateStats, globalStats, dateRange }) => {
  const formatDateLabel = (d: Date) => `${String(d.getDate()).padStart(2, '0')}-${d.toLocaleString('default', { month: 'short' })}-${d.getFullYear()} (${d.toLocaleString('default', { weekday: 'long' })})`;
  const missingDaysList = dateStats.filter(d => !d.isActive).map(d => formatDateLabel(d.date)).join(', ');
  const truncatedMissingList = missingDaysList.length > 150 ? missingDaysList.substring(0, 150) + '... (+' + (globalStats.missingDays - 10) + ' more)' : missingDaysList;

  return (
    <div className="flex flex-col gap-6 pb-8 max-w-6xl mx-auto w-full">
      <div className="bg-[#131f37] border border-[#1e293b] rounded-lg p-5">
        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wide">Export missing dates</h3>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#0a1120] border border-[#1e293b] hover:bg-[#1e293b] text-sm text-gray-200 rounded transition-colors cursor-pointer">
            <Download className="w-4 h-4 text-gray-400" /> Missing dates table (CSV)
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#0a1120] border border-[#1e293b] hover:bg-[#1e293b] text-sm text-gray-200 rounded transition-colors cursor-pointer">
            <Download className="w-4 h-4 text-gray-400" /> Missing dates (Excel)
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#0a1120] border border-[#1e293b] hover:bg-[#1e293b] text-sm text-gray-200 rounded transition-colors cursor-pointer">
            <Printer className="w-4 h-4 text-gray-400" /> Full report (PDF)
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#0a1120] border border-[#1e293b] hover:bg-[#1e293b] text-sm text-gray-200 rounded transition-colors cursor-pointer">
            <Printer className="w-4 h-4 text-gray-400" /> Print dashboard (PDF)
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#0a1120] border border-[#1e293b] hover:bg-[#1e293b] text-sm text-gray-200 rounded transition-colors cursor-pointer">
            <Printer className="w-4 h-4 text-gray-400" /> Print calendars (PDF)
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a1120] border border-[#1e293b] hover:bg-[#1e293b] text-xs text-gray-300 rounded transition-colors cursor-pointer"><Download className="w-3 h-3" /> CSV (All)</button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a1120] border border-[#1e293b] hover:bg-[#1e293b] text-xs text-gray-300 rounded transition-colors cursor-pointer"><Download className="w-3 h-3" /> Excel</button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a1120] border border-[#1e293b] hover:bg-[#1e293b] text-xs text-gray-300 rounded transition-colors cursor-pointer"><Printer className="w-3 h-3" /> PDF Report</button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a1120] border border-[#1e293b] hover:bg-[#1e293b] text-xs text-gray-300 rounded transition-colors cursor-pointer"><Printer className="w-3 h-3" /> Print</button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a1120] border border-[#1e293b] hover:bg-[#1e293b] text-xs text-gray-300 rounded transition-colors cursor-pointer"><Download className="w-3 h-3" /> KML</button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a1120] border border-[#1e293b] hover:bg-[#1e293b] text-xs text-gray-300 rounded transition-colors cursor-pointer"><Download className="w-3 h-3" /> KMZ</button>
        </div>
        <p className="text-xs text-gray-500 mt-5 font-medium">Excel and PDF exports use server-side cached analysis. Print calendars for month-wise PDF views.</p>
      </div>

      <div className="bg-[#131f37] border border-[#1e293b] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#1e293b]">
          <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-wide">Missing dates audit (CDR coverage)</h3>
          <p className="text-xs text-gray-400 font-medium">Row-wise coverage gaps per dataset segment</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#1e293b]">
            <thead className="bg-[#0a1120]">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Record ID</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Group Type</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Primary Number</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Start Date</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">End Date</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Total Span Days</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Available Dates</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Missing Dates Count</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Severity</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Missing Dates List</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Missing Dates Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b] bg-[#131f37]">
              <tr className="hover:bg-[#1e293b]/50 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-300 align-top">DATASET-001</td>
                <td className="px-4 py-3 text-xs text-gray-300 align-top">CDR Dataset<br/>(Overall)</td>
                <td className="px-4 py-3 text-xs text-gray-300 align-top">{cdrFile?.phoneNumber || 'N/A'}</td>
                <td className="px-4 py-3 text-xs text-gray-300 align-top">{dateRange.start}</td>
                <td className="px-4 py-3 text-xs text-gray-300 align-top">{dateRange.end}</td>
                <td className="px-4 py-3 text-xs text-gray-300 align-top">{globalStats.totalDays}</td>
                <td className="px-4 py-3 text-xs text-gray-300 align-top">{globalStats.activeDays}</td>
                <td className="px-4 py-3 text-xs text-gray-300 align-top">{globalStats.missingDays}</td>
                <td className="px-4 py-3 align-top">
                  {globalStats.missingPercentage > 50 ? (
                    <span className="px-2 py-1 bg-red-900/50 text-red-400 text-[10px] font-bold rounded border border-red-800">HIGH</span>
                  ) : globalStats.missingPercentage > 20 ? (
                    <span className="px-2 py-1 bg-orange-900/50 text-orange-400 text-[10px] font-bold rounded border border-orange-800">MEDIUM</span>
                  ) : (
                    <span className="px-2 py-1 bg-teal-900/50 text-teal-400 text-[10px] font-bold rounded border border-teal-800">LOW</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate align-top">{truncatedMissingList}</td>
                <td className="px-4 py-3 text-xs text-gray-400 max-w-xs align-top">
                  {globalStats.missingDays} dates missing: {truncatedMissingList}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
