import React from 'react';
import { Search, Filter } from 'lucide-react';

interface NetworkFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  operatorFilter: string;
  setOperatorFilter: (val: string) => void;
  filteredCount: number;
}

const OPERATORS = ['All', 'Grameenphone', 'Banglalink', 'Robi', 'Airtel', 'Teletalk', 'Unknown'];

export const NetworkFilters: React.FC<NetworkFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  operatorFilter,
  setOperatorFilter,
  filteredCount
}) => {
  return (
    <div className="bg-[#1a1f2e] border border-blue-900/30 rounded-t-xl p-4 font-mono text-[11px] flex flex-col gap-4">
      {/* Operator Toggles */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-blue-400" />
        <span className="text-gray-400">Filter by operator:</span>
        <div className="flex gap-2 flex-wrap">
          {OPERATORS.map(op => (
            <button
              key={op}
              onClick={() => setOperatorFilter(op)}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                operatorFilter === op 
                  ? 'bg-blue-600 border-blue-500 text-white' 
                  : 'bg-[#121622] border-[#2a3441] text-gray-400 hover:border-blue-500/50 hover:text-gray-200'
              }`}
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Columns Info */}
      <div className="flex items-center gap-4">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121622] border border-[#2a3441] text-gray-200 placeholder-gray-500 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="bg-[#121622] border border-[#2a3441] text-gray-300 px-3 py-2 rounded-lg cursor-pointer hover:bg-[#1e2536] transition-colors">
          Columns
        </div>
        <div className="text-gray-500">
          {filteredCount} rows
        </div>
      </div>
    </div>
  );
};
