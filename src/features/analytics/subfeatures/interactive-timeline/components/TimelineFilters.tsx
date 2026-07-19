import React from 'react';
import { Filter, Calendar } from 'lucide-react';

export const TimelineFilters: React.FC<any> = ({ filterState, onFilterChange, onApplyFilters, stats }) => {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-3 bg-[#15803d] flex items-center gap-2 border-b border-green-800">
        <Filter className="w-4 h-4 text-white" />
        <span className="text-white font-semibold text-sm">Filters</span>
      </div>

      <div className="p-3 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
        <div>
          <label className="text-[11px] text-slate-400 block mb-1 font-medium">From Date</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="dd/mm/yyyy" 
              className="w-full bg-[#0a1120] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-slate-600 focus:outline-none focus:border-slate-500"
              value={filterState.fromDate}
              onChange={(e) => onFilterChange('fromDate', e.target.value)}
            />
            <Calendar className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="text-[11px] text-slate-400 block mb-1 font-medium">To Date</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="dd/mm/yyyy" 
              className="w-full bg-[#0a1120] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-slate-600 focus:outline-none focus:border-slate-500"
              value={filterState.toDate}
              onChange={(e) => onFilterChange('toDate', e.target.value)}
            />
            <Calendar className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="text-[11px] text-slate-400 block mb-1 font-medium">Start Time</label>
          <input 
            type="text" 
            placeholder="--:--" 
            className="w-full bg-[#0a1120] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-slate-600 focus:outline-none focus:border-slate-500"
            value={filterState.startTime}
            onChange={(e) => onFilterChange('startTime', e.target.value)}
          />
        </div>

        <div>
          <label className="text-[11px] text-slate-400 block mb-1 font-medium">End Time</label>
          <input 
            type="text" 
            placeholder="--:--" 
            className="w-full bg-[#0a1120] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-slate-600 focus:outline-none focus:border-slate-500"
            value={filterState.endTime}
            onChange={(e) => onFilterChange('endTime', e.target.value)}
          />
        </div>

        <div>
          <label className="text-[11px] text-slate-400 block mb-1 font-medium">Period View</label>
          <select 
            className="w-full bg-[#0a1120] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-slate-500 appearance-none"
            value={filterState.periodView}
            onChange={(e) => onFilterChange('periodView', e.target.value)}
          >
            <option>Day View</option>
            <option>Month View</option>
          </select>
        </div>

        <div className="flex gap-1 w-full pt-1">
          <button 
            className={`flex-1 py-1.5 text-xs font-medium rounded border ${filterState.dayNight === 'Day' ? 'bg-slate-600 border-slate-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'} hover:bg-slate-700 transition-colors cursor-pointer`}
            onClick={() => onFilterChange('dayNight', 'Day')}
          >
            Day
          </button>
          <button 
            className={`flex-1 py-1.5 text-xs font-medium rounded border ${filterState.dayNight === 'Night' ? 'bg-slate-600 border-slate-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'} hover:bg-slate-700 transition-colors cursor-pointer`}
            onClick={() => onFilterChange('dayNight', 'Night')}
          >
            Night
          </button>
        </div>

        <div className="pt-2 space-y-2">
          <input 
            type="text" 
            placeholder="Caller Number" 
            className="w-full bg-[#0a1120] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-slate-500 focus:outline-none focus:border-slate-500"
            value={filterState.callerNumber}
            onChange={(e) => onFilterChange('callerNumber', e.target.value)}
          />
          <input 
            type="text" 
            placeholder="Receiver / B Party" 
            className="w-full bg-[#0a1120] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-slate-500 focus:outline-none focus:border-slate-500"
            value={filterState.receiverBParty}
            onChange={(e) => onFilterChange('receiverBParty', e.target.value)}
          />
          <input 
            type="text" 
            placeholder="IMEI" 
            className="w-full bg-[#0a1120] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-slate-500 focus:outline-none focus:border-slate-500"
            value={filterState.imei}
            onChange={(e) => onFilterChange('imei', e.target.value)}
          />
          <input 
            type="text" 
            placeholder="N/A - PESHAWAR" 
            className="w-full bg-[#0a1120] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-slate-500 focus:outline-none focus:border-slate-500"
            value={filterState.location}
            onChange={(e) => onFilterChange('location', e.target.value)}
          />
        </div>

        <button 
          onClick={onApplyFilters}
          className="w-full bg-[#3b82f6] hover:bg-blue-600 text-white font-semibold py-2 rounded transition-colors text-sm mt-2 cursor-pointer shadow-sm border border-blue-500"
        >
          Apply Filters
        </button>
      </div>

      {/* Quick Stats */}
      <div className="p-3 border-t border-slate-800 bg-[#0d1628]">
        <h4 className="text-[#22c55e] text-xs font-semibold mb-2">Quick Stats</h4>
        <div className="space-y-1 text-[11px] text-slate-400 font-mono">
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
          <div className="flex mt-1.5 pt-1.5 border-t border-slate-700/50">
            <span className="w-12">Peak:</span>
            <span className="text-white">{stats.peak}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
