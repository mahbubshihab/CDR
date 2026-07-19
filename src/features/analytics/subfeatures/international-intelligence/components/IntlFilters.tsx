import React from 'react';
import { Search } from 'lucide-react';
import type { CountryAggregate } from '../types';

export interface IntlFiltersState {
  country: string;
  riskLevel: 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH';
  usageType: 'ALL' | 'VOICE' | 'SMS';
  direction: 'ALL' | 'INCOMING' | 'OUTGOING';
}

interface IntlFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filters: IntlFiltersState;
  setFilters: (filters: IntlFiltersState) => void;
  availableCountries: CountryAggregate[];
}

export const IntlFilters: React.FC<IntlFiltersProps> = ({ 
  searchQuery, setSearchQuery, filters, setFilters, availableCountries 
}) => {
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
          className="w-full bg-[#121212] border border-[#2e2e2e] text-gray-200 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all placeholder:text-gray-600"
        />
      </div>

      {/* Dropdowns */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        
        <select
          value={filters.country}
          onChange={(e) => setFilters({ ...filters, country: e.target.value })}
          className="bg-[#121212] border border-[#2e2e2e] hover:border-gray-500 text-gray-300 text-xs px-3 py-2.5 rounded-lg transition-colors focus:outline-none focus:border-[#38bdf8]"
        >
          <option value="ALL">All countries</option>
          {availableCountries.map(c => (
            <option key={c.country} value={c.country}>{c.country}</option>
          ))}
        </select>

        <select
          value={filters.riskLevel}
          onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value as any })}
          className="bg-[#121212] border border-[#2e2e2e] hover:border-gray-500 text-gray-300 text-xs px-3 py-2.5 rounded-lg transition-colors focus:outline-none focus:border-[#38bdf8]"
        >
          <option value="ALL">All risk levels</option>
          <option value="HIGH">High / Critical</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="LOW">Low Risk</option>
        </select>

        <select
          value={filters.usageType}
          onChange={(e) => setFilters({ ...filters, usageType: e.target.value as any })}
          className="bg-[#121212] border border-[#2e2e2e] hover:border-gray-500 text-gray-300 text-xs px-3 py-2.5 rounded-lg transition-colors focus:outline-none focus:border-[#38bdf8]"
        >
          <option value="ALL">Calls + SMS</option>
          <option value="VOICE">Calls Only</option>
          <option value="SMS">SMS Only</option>
        </select>

        <select
          value={filters.direction}
          onChange={(e) => setFilters({ ...filters, direction: e.target.value as any })}
          className="bg-[#121212] border border-[#2e2e2e] hover:border-gray-500 text-gray-300 text-xs px-3 py-2.5 rounded-lg transition-colors focus:outline-none focus:border-[#38bdf8]"
        >
          <option value="ALL">All directions</option>
          <option value="INCOMING">Incoming</option>
          <option value="OUTGOING">Outgoing</option>
        </select>

      </div>
    </div>
  );
};
