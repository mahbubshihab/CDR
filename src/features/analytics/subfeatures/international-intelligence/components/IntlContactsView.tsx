import React from 'react';
import type { InternationalRecord } from '../types';
import { Search } from 'lucide-react';

interface IntlContactsViewProps {
  records: InternationalRecord[];
}

export const IntlContactsView: React.FC<IntlContactsViewProps> = ({ records }) => {
  const [search, setSearch] = React.useState('');

  const filtered = records.filter(r => 
    r.number.includes(search) || r.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl overflow-hidden mt-6 animate-in fade-in duration-300">
      <div className="p-4 border-b border-[#2e2e2e] bg-[#121212]/50 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-200">International Contacts Database</h3>
        <div className="relative group">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 group-focus-within:text-[#38bdf8] transition-colors" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#121212] border border-[#2e2e2e] text-gray-200 text-xs rounded pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all w-48 placeholder:text-gray-600"
          />
        </div>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#2e2e2e] text-gray-400 font-semibold bg-[#172136]">
              <th className="py-3 px-4">Contact Number</th>
              <th className="py-3 px-4">Country</th>
              <th className="py-3 px-4">Voice Calls</th>
              <th className="py-3 px-4">SMS</th>
              <th className="py-3 px-4">Total Comms</th>
              <th className="py-3 px-4">Duration (sec)</th>
              <th className="py-3 px-4">Active Days</th>
              <th className="py-3 px-4">Night Comms</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#334155]/50">
            {filtered.length > 0 ? (
              filtered.map((r, i) => (
                <tr key={i} className="hover:bg-[#334155]/20 transition-colors">
                  <td className="py-3 px-4 text-[#38bdf8] font-mono">{r.number}</td>
                  <td className="py-3 px-4 text-gray-200">{r.flag} {r.country}</td>
                  <td className="py-3 px-4 text-gray-300">{r.voiceCount}</td>
                  <td className="py-3 px-4 text-gray-300">{r.smsCount}</td>
                  <td className="py-3 px-4 font-bold text-gray-100">{r.totalComms}</td>
                  <td className="py-3 px-4 text-gray-300">{r.duration}</td>
                  <td className="py-3 px-4 text-gray-300">{r.activeDays.size}</td>
                  <td className="py-3 px-4 text-[#f87171]">{r.nightComms}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500">
                  No contacts match your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
