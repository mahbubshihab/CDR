import React from 'react';
import { Search, Filter, Shield } from 'lucide-react';
import type { ServiceTableRow } from '../hooks/useServiceAnalysis';

interface ServiceTableProps {
  data: ServiceTableRow[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  dropdownCategory: string;
  setDropdownCategory: (category: string) => void;
}

export const ServiceTable: React.FC<ServiceTableProps> = ({
  data,
  searchTerm,
  setSearchTerm,
  dropdownCategory,
  setDropdownCategory,
}) => {
  return (
    <div className="bg-[#1a2332] border border-[#2e3b4e] rounded-xl overflow-hidden flex flex-col">
      <div className="p-4 border-b border-[#2e3b4e] flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#151c28]">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search hex, decoded value, operator, service, identifier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a2332] border border-[#2e3b4e] text-sm text-white rounded-md pl-9 pr-4 py-2 focus:outline-none focus:border-[#3ecf8e] transition-colors placeholder:text-gray-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold">Columns</span>
          <span className="text-xs text-gray-500">{data.length} rows</span>
          <div className="relative ml-2">
            <select
              value={dropdownCategory}
              onChange={(e) => setDropdownCategory(e.target.value)}
              className="appearance-none bg-[#1a2332] border border-[#2e3b4e] text-sm text-white rounded-md pl-3 pr-8 py-2 focus:outline-none focus:border-[#3ecf8e] cursor-pointer"
            >
              <option value="All categories">All categories</option>
              <option value="Emergency">Emergency</option>
              <option value="Banking">Banking</option>
              <option value="Government">Government</option>
              <option value="Telecom">Telecom</option>
              <option value="Corporate">Corporate</option>
              <option value="Unknown">Unknown</option>
            </select>
            <Filter className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar flex-1">
        {data.length > 0 ? (
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#151c28] border-b border-[#2e3b4e] text-gray-400 font-semibold">
                <th className="py-3 px-4 font-bold">Value</th>
                <th className="py-3 px-4">Label</th>
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Decoded</th>
                <th className="py-3 px-4">ID Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4 text-center">Conf%</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4">First</th>
                <th className="py-3 px-4">Last</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e3b4e]/50">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#2a3649]/30 text-gray-300 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-400">{row.value}</td>
                  <td className="py-3 px-4 font-semibold">{row.label}</td>
                  <td className="py-3 px-4 text-gray-400">{row.organization}</td>
                  <td className="py-3 px-4">{row.operator}</td>
                  <td className="py-3 px-4 text-gray-500">—</td>
                  <td className="py-3 px-4">{row.idType}</td>
                  <td className="py-3 px-4">{row.category}</td>
                  <td className="py-3 px-4 text-gray-400">{row.classification}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      row.confidence >= 90 ? 'bg-emerald-500/20 text-emerald-400' :
                      row.confidence >= 50 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {row.confidence}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 font-mono text-[10px]">{row.source}</td>
                  <td className="py-3 px-4 text-right font-bold">{row.total}</td>
                  <td className="py-3 px-4 text-gray-500 font-mono text-[10px]">{row.firstSeen}</td>
                  <td className="py-3 px-4 text-gray-500 font-mono text-[10px]">{row.lastSeen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Shield className="h-10 w-10 mb-3 text-gray-600" />
            <p className="text-sm font-semibold">No service numbers found</p>
            <p className="text-xs mt-1">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
};
