import React from 'react';
import { Search } from 'lucide-react';

interface OwnershipFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  nidFilter: string;
  setNidFilter: (val: string) => void;
  networkFilter: string;
  setNetworkFilter: (val: string) => void;
  cityFilter: string;
  setCityFilter: (val: string) => void;
  recordsFilter: string;
  setRecordsFilter: (val: string) => void;
}

export const OwnershipFilters: React.FC<OwnershipFiltersProps> = ({
  searchQuery, setSearchQuery,
  nidFilter, setNidFilter,
  networkFilter, setNetworkFilter,
  cityFilter, setCityFilter,
  recordsFilter, setRecordsFilter
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-3 mt-6 font-mono text-xs">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input 
          type="text" 
          placeholder="Search name, mobile, NID..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#121212] border border-[#2e2e2e] text-gray-200 placeholder-gray-500 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#3ecf8e]/50"
        />
      </div>

      {/* NID Filter */}
      <div className="w-full md:w-40">
        <input 
          type="text" 
          placeholder="NID filter" 
          value={nidFilter}
          onChange={(e) => setNidFilter(e.target.value)}
          className="w-full bg-[#121212] border border-[#2e2e2e] text-gray-200 placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#3ecf8e]/50"
        />
      </div>

      {/* Network Dropdown */}
      <select 
        value={networkFilter}
        onChange={(e) => setNetworkFilter(e.target.value)}
        className="w-full md:w-40 bg-[#121212] border border-[#2e2e2e] text-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#3ecf8e]/50 appearance-none"
      >
        <option value="All">All networks</option>
        <option value="Grameenphone">Grameenphone</option>
        <option value="Banglalink">Banglalink</option>
        <option value="Robi">Robi</option>
        <option value="Airtel">Airtel</option>
        <option value="Teletalk">Teletalk</option>
        <option value="Unknown">Unknown</option>
      </select>

      {/* City Dropdown */}
      <select 
        value={cityFilter}
        onChange={(e) => setCityFilter(e.target.value)}
        className="w-full md:w-40 bg-[#121212] border border-[#2e2e2e] text-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#3ecf8e]/50 appearance-none"
      >
        <option value="All">All cities</option>
        {/* With strictly no simulation, cities are mostly unknown unless provided by CDR */}
      </select>

      {/* Records Dropdown */}
      <select 
        value={recordsFilter}
        onChange={(e) => setRecordsFilter(e.target.value)}
        className="w-full md:w-40 bg-[#121212] border border-[#2e2e2e] text-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#3ecf8e]/50 appearance-none"
      >
        <option value="All">All records</option>
        <option value="With Ownership">With Ownership</option>
        <option value="Without Ownership">Without Ownership</option>
      </select>
    </div>
  );
};
