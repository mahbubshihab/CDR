import React, { useState } from 'react';
import { Search, Shield } from 'lucide-react';
import type { CountryAggregate } from '../types';

interface CountryRiskRankingProps {
  countries: CountryAggregate[];
}

export const CountryRiskRanking: React.FC<CountryRiskRankingProps> = ({ countries }) => {
  const [search, setSearch] = useState('');

  const filteredCountries = countries.filter(c => 
    c.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl overflow-hidden mt-6">
      {/* Header */}
      <div className="p-4 border-b border-[#2e2e2e] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121212]/50">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#38bdf8]" />
          <h3 className="text-sm font-semibold text-gray-200">Country Risk Ranking</h3>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 group-focus-within:text-[#38bdf8] transition-colors" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#121212] border border-[#2e2e2e] text-gray-200 text-xs rounded pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all w-40 placeholder:text-gray-600"
            />
          </div>
          <button className="bg-[#121212] border border-[#2e2e2e] hover:border-gray-500 text-gray-300 text-xs px-3 py-1.5 rounded transition-colors font-medium">
            Columns
          </button>
          <span className="text-xs text-gray-500 font-medium">
            {filteredCountries.length} rows
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#2e2e2e] text-gray-400 font-semibold bg-[#172136]">
              <th className="py-3 px-4 font-medium">Rank</th>
              <th className="py-3 px-4 font-medium">Country</th>
              <th className="py-3 px-4 font-medium">Numbers</th>
              <th className="py-3 px-4 font-medium">Calls</th>
              <th className="py-3 px-4 font-medium">SMS</th>
              <th className="py-3 px-4 font-medium">Comms</th>
              <th className="py-3 px-4 font-medium">Active Days</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#334155]/50">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c, idx) => (
                <tr key={c.country} className="hover:bg-[#334155]/20 transition-colors">
                  <td className="py-3 px-4 text-gray-300 font-medium">{idx + 1}</td>
                  <td className="py-3 px-4 text-gray-200">{c.country}</td>
                  <td className="py-3 px-4 text-gray-300">{c.numbers.length}</td>
                  <td className="py-3 px-4 text-gray-300">{c.voiceCount}</td>
                  <td className="py-3 px-4 text-gray-300">{c.smsCount}</td>
                  <td className="py-3 px-4 text-gray-300">{c.totalComms}</td>
                  <td className="py-3 px-4 text-gray-300">{c.activeDays}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  No countries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
