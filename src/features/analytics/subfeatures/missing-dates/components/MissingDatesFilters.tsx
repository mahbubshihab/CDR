import React from 'react';
import { Filter } from 'lucide-react';

interface MissingDatesFiltersProps {
  selectedYear: string;
  setSelectedYear: (y: string) => void;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  dateRange: { start: string; end: string };
}

export const MissingDatesFilters: React.FC<MissingDatesFiltersProps> = ({
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  dateRange
}) => {
  return (
    <div className="bg-[#131f37] border border-[#1e293b] rounded-lg p-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Filter Icon */}
        <div className="text-gray-400 border-r border-[#1e293b] pr-4">
          <Filter className="w-5 h-5" />
        </div>

        {/* Year Dropdown */}
        <div className="flex items-center">
          <select 
            className="bg-[#0a1120] text-sm text-gray-200 border border-[#1e293b] rounded px-3 py-1.5 outline-none cursor-pointer focus:border-blue-500 w-32"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option>All years</option>
            {/* Add more options dynamically if needed */}
          </select>
        </div>

        {/* Month Dropdown */}
        <div className="flex items-center">
          <select 
            className="bg-[#0a1120] text-sm text-gray-200 border border-[#1e293b] rounded px-3 py-1.5 outline-none cursor-pointer focus:border-blue-500 w-36"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option>All months</option>
          </select>
        </div>

        {/* Date Inputs */}
        <div className="flex items-center gap-2 text-sm ml-4">
          <div className="relative">
            <input 
              type="text" 
              value={dateRange.start} 
              readOnly 
              className="bg-[#0a1120] border border-[#1e293b] rounded px-3 py-1.5 w-32 text-gray-300" 
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">📅</div>
          </div>
          <span className="text-gray-500 mx-1">to</span>
          <div className="relative">
            <input 
              type="text" 
              value={dateRange.end} 
              readOnly 
              className="bg-[#0a1120] border border-[#1e293b] rounded px-3 py-1.5 w-32 text-gray-300" 
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">📅</div>
          </div>
        </div>
      </div>

      {/* Legends */}
      <div className="flex items-center gap-4 text-sm mr-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-teal-600/80 border border-teal-500"></div>
          <span className="text-gray-400 font-medium">Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-900/60 border border-red-700"></div>
          <span className="text-gray-400 font-medium">Missing</span>
        </div>
      </div>
    </div>
  );
};
