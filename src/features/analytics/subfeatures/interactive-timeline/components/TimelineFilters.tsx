import React from 'react';
import { Filter, Calendar } from 'lucide-react';

interface TimelineFiltersProps {
  filterState: any;
  onFilterChange: (key: string, value: string) => void;
  onApplyFilters: () => void;
  stats: {
    calls: number;
    sms: number;
    data: number;
    peak: string;
  };
}

export const TimelineFilters: React.FC<TimelineFiltersProps> = ({ filterState, onFilterChange, onApplyFilters, stats }) => {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Title */}
      <div className="p-3 bg-[#1e7b3e] flex items-center gap-2 border-b border-[#14532a]">
        <Filter className="w-4 h-4 text-white" />
        <span className="text-white font-semibold text-sm">Filters</span>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* From Date */}
        <div>
          <label className="text-xs text-gray-400 block mb-1.5 font-medium">From Date</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="dd/mm/yyyy" 
              className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#3e3e3e]"
              value={filterState.fromDate}
              onChange={(e) => onFilterChange('fromDate', e.target.value)}
            />
            <Calendar className="w-4 h-4 text-gray-500 absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* To Date */}
        <div>
          <label className="text-xs text-gray-400 block mb-1.5 font-medium">To Date</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="dd/mm/yyyy" 
              className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#3e3e3e]"
              value={filterState.toDate}
              onChange={(e) => onFilterChange('toDate', e.target.value)}
            />
            <Calendar className="w-4 h-4 text-gray-500 absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Start Time */}
        <div>
          <label className="text-xs text-gray-400 block mb-1.5 font-medium">Start Time</label>
          <input 
            type="text" 
            placeholder="--:--" 
            className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#3e3e3e]"
            value={filterState.startTime}
            onChange={(e) => onFilterChange('startTime', e.target.value)}
          />
        </div>

        {/* End Time */}
        <div>
          <label className="text-xs text-gray-400 block mb-1.5 font-medium">End Time</label>
          <input 
            type="text" 
            placeholder="--:--" 
            className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#3e3e3e]"
            value={filterState.endTime}
            onChange={(e) => onFilterChange('endTime', e.target.value)}
          />
        </div>

        {/* Period View */}
        <div>
          <label className="text-xs text-gray-400 block mb-1.5 font-medium">Period View</label>
          <select 
            className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#3e3e3e] appearance-none"
            value={filterState.periodView}
            onChange={(e) => onFilterChange('periodView', e.target.value)}
          >
            <option>Day View</option>
            <option>Month View</option>
          </select>
        </div>

        {/* Day / Night Buttons */}
        <div className="flex gap-2 w-full pt-1">
          <button 
            className={`flex-1 py-1.5 text-xs font-medium rounded border ${filterState.dayNight === 'Day' ? 'bg-[#2a2a2a] border-[#3e3e3e] text-gray-200' : 'bg-[#1c1c1c] border-[#2e2e2e] text-gray-400'} hover:bg-[#2a2a2a] transition-colors`}
            onClick={() => onFilterChange('dayNight', 'Day')}
          >
            Day
          </button>
          <button 
            className={`flex-1 py-1.5 text-xs font-medium rounded border ${filterState.dayNight === 'Night' ? 'bg-[#2a2a2a] border-[#3e3e3e] text-gray-200' : 'bg-[#1c1c1c] border-[#2e2e2e] text-gray-400'} hover:bg-[#2a2a2a] transition-colors`}
            onClick={() => onFilterChange('dayNight', 'Night')}
          >
            Night
          </button>
        </div>

        {/* Caller Number */}
        <div className="pt-2">
          <input 
            type="text" 
            placeholder="Caller Number" 
            className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#3e3e3e]"
            value={filterState.callerNumber}
            onChange={(e) => onFilterChange('callerNumber', e.target.value)}
          />
        </div>

        {/* Receiver / B Party */}
        <div>
          <input 
            type="text" 
            placeholder="Receiver / B Party" 
            className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#3e3e3e]"
            value={filterState.receiverBParty}
            onChange={(e) => onFilterChange('receiverBParty', e.target.value)}
          />
        </div>

        {/* IMEI */}
        <div>
          <input 
            type="text" 
            placeholder="IMEI" 
            className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#3e3e3e]"
            value={filterState.imei}
            onChange={(e) => onFilterChange('imei', e.target.value)}
          />
        </div>

        {/* Location */}
        <div>
          <input 
            type="text" 
            placeholder="N/A - PESHAWAR" 
            className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#3e3e3e]"
            value={filterState.location}
            onChange={(e) => onFilterChange('location', e.target.value)}
          />
        </div>

        {/* Apply Filters Button */}
        <button 
          onClick={onApplyFilters}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded transition-colors text-sm mt-4 cursor-pointer"
        >
          Apply Filters
        </button>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-t border-[#2e2e2e]">
        <h4 className="text-[#3ecf8e] text-xs font-semibold mb-3">Quick Stats</h4>
        <div className="space-y-1.5 text-xs text-gray-400 font-mono">
          <div className="flex">
            <span className="w-14">Calls:</span>
            <span className="text-gray-200">{stats.calls}</span>
          </div>
          <div className="flex">
            <span className="w-14">SMS:</span>
            <span className="text-gray-200">{stats.sms}</span>
          </div>
          <div className="flex">
            <span className="w-14">Data:</span>
            <span className="text-gray-200">{stats.data}</span>
          </div>
          <div className="flex mt-2 pt-2 border-t border-[#2e2e2e]">
            <span className="w-14">Peak:</span>
            <span className="text-gray-200">{stats.peak}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
