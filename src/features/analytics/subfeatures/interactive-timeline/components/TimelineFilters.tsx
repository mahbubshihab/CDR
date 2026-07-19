import React from 'react';
import { Filter, Calendar } from 'lucide-react';
import { DateTimeInput } from '../../../../../components/ui/DateTimeInput';

export const TimelineFilters: React.FC<any> = ({ filterState, onFilterChange, onApplyFilters, stats }) => {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-3 bg-[#121212] flex items-center gap-2 border-b border-[#2e2e2e]">
        <Filter className="w-4 h-4 text-gray-400" />
        <span className="text-gray-200 font-semibold text-sm">Filters</span>
      </div>

      <div className="p-3 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
        <div>
          <label className="text-[11px] text-gray-400 block mb-1 font-medium">From Date</label>
          <DateTimeInput
            mode="date"
            value={filterState.fromDate}
            onChange={(val: string) => onFilterChange('fromDate', val)}
            placeholder="YYYY-MM-DD"
          />
        </div>

        <div>
          <label className="text-[11px] text-gray-400 block mb-1 font-medium">To Date</label>
          <DateTimeInput
            mode="date"
            value={filterState.toDate}
            onChange={(val: string) => onFilterChange('toDate', val)}
            placeholder="YYYY-MM-DD"
          />
        </div>

        <div>
          <label className="text-[11px] text-gray-400 block mb-1 font-medium">Start Time</label>
          <DateTimeInput
            mode="time"
            value={filterState.startTime}
            onChange={(val: string) => onFilterChange('startTime', val)}
            placeholder="HH:MM"
          />
        </div>

        <div>
          <label className="text-[11px] text-gray-400 block mb-1 font-medium">End Time</label>
          <DateTimeInput
            mode="time"
            value={filterState.endTime}
            onChange={(val: string) => onFilterChange('endTime', val)}
            placeholder="HH:MM"
          />
        </div>

        <div>
          <label className="text-[11px] text-gray-400 block mb-1 font-medium">Period View</label>
          <select 
            className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-gray-500 appearance-none"
            value={filterState.periodView}
            onChange={(e) => onFilterChange('periodView', e.target.value)}
          >
            <option>Day View</option>
            <option>Month View</option>
          </select>
        </div>

        <div className="flex gap-1 w-full pt-1">
          <button 
            className={`flex-1 py-1.5 text-xs font-medium rounded border ${filterState.dayNight === 'Day' ? 'bg-[#2e2e2e] border-gray-500 text-white' : 'bg-[#1c1c1c] border-[#2e2e2e] text-gray-400'} hover:bg-[#2e2e2e] transition-colors cursor-pointer`}
            onClick={() => onFilterChange('dayNight', filterState.dayNight === 'Day' ? '' : 'Day')}
          >
            Day
          </button>
          <button 
            className={`flex-1 py-1.5 text-xs font-medium rounded border ${filterState.dayNight === 'Night' ? 'bg-[#2e2e2e] border-gray-500 text-white' : 'bg-[#1c1c1c] border-[#2e2e2e] text-gray-400'} hover:bg-[#2e2e2e] transition-colors cursor-pointer`}
            onClick={() => onFilterChange('dayNight', filterState.dayNight === 'Night' ? '' : 'Night')}
          >
            Night
          </button>
        </div>

        <div className="pt-2 space-y-2">
          <input 
            type="text" 
            placeholder="Caller Number" 
            className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-500"
            value={filterState.callerNumber}
            onChange={(e) => onFilterChange('callerNumber', e.target.value)}
          />
          <input 
            type="text" 
            placeholder="Receiver / B Party" 
            className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-500"
            value={filterState.receiverBParty}
            onChange={(e) => onFilterChange('receiverBParty', e.target.value)}
          />
          <input 
            type="text" 
            placeholder="IMEI" 
            className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-500"
            value={filterState.imei}
            onChange={(e) => onFilterChange('imei', e.target.value)}
          />
          <input 
            type="text" 
            placeholder="N/A - PESHAWAR" 
            className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-500"
            value={filterState.location}
            onChange={(e) => onFilterChange('location', e.target.value)}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-3 border-t border-[#2e2e2e] bg-[#121212]">
        <h4 className="text-[#3ecf8e] text-xs font-semibold mb-2">Quick Stats</h4>
        <div className="space-y-1 text-[11px] text-gray-400 font-mono">
          <div className="flex">
            <span className="w-12">Calls:</span>
            <span className="text-white">{stats.calls}</span>
          </div>
          <div className="flex">
            <span className="w-12">SMS:</span>
            <span className="text-white">{stats.sms}</span>
          </div>
          <div className="flex">
            <span className="w-12">Data:</span>
            <span className="text-white">{stats.data}</span>
          </div>
          <div className="flex mt-1.5 pt-1.5 border-t border-[#2e2e2e]">
            <span className="w-12">Peak:</span>
            <span className="text-white">{stats.peak}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
