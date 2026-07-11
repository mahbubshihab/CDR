import React from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface IntlFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export const IntlFilters: React.FC<IntlFiltersProps> = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center">
      {/* Search Bar */}
      <div className="relative flex-1 w-full group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-[#38bdf8] transition-colors" />
        <input
          type="text"
          placeholder="Search number or country..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#0f172a] border border-[#1e293b] text-gray-200 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all placeholder:text-gray-600"
        />
      </div>

      {/* Dropdowns */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <button className="flex items-center gap-2 bg-[#0f172a] border border-[#1e293b] hover:border-gray-500 text-gray-300 text-xs px-4 py-2.5 rounded-lg transition-colors">
          All countries <ChevronDown className="w-3 h-3 text-gray-500" />
        </button>
        <button className="flex items-center gap-2 bg-[#0f172a] border border-[#1e293b] hover:border-gray-500 text-gray-300 text-xs px-4 py-2.5 rounded-lg transition-colors">
          All risk levels <ChevronDown className="w-3 h-3 text-gray-500" />
        </button>
        <button className="flex items-center gap-2 bg-[#0f172a] border border-[#1e293b] hover:border-gray-500 text-gray-300 text-xs px-4 py-2.5 rounded-lg transition-colors">
          Calls + SMS <ChevronDown className="w-3 h-3 text-gray-500" />
        </button>
        <button className="flex items-center gap-2 bg-[#0f172a] border border-[#1e293b] hover:border-gray-500 text-gray-300 text-xs px-4 py-2.5 rounded-lg transition-colors">
          All directions <ChevronDown className="w-3 h-3 text-gray-500" />
        </button>
      </div>
    </div>
  );
};
