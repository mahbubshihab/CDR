import React from 'react';
import { Search } from 'lucide-react';
import type { OwnershipRecord } from '../types';

interface OwnershipDataTableProps {
  records: OwnershipRecord[];
  totalRecords: number;
}

export const OwnershipDataTable: React.FC<OwnershipDataTableProps> = ({ records, totalRecords }) => {
  return (
    <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl flex flex-col overflow-hidden font-mono text-[11px] mt-4">
      <div className="bg-[#1a1a1a]/50 border-b border-[#2e2e2e] px-4 py-2 flex items-center justify-between text-gray-500">
        <span>Showing {records.length} of {totalRecords} rows · {totalRecords} unique B-Parties in CDR</span>
      </div>
      
      <div className="overflow-x-auto w-full custom-scrollbar">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-[#1a1a1a] text-gray-400 border-b border-[#2e2e2e]">
            <tr>
              <th className="px-4 py-3 font-semibold">Mobile Number</th>
              <th className="px-4 py-3 font-semibold">Owner Name</th>
              <th className="px-4 py-3 font-semibold">NID</th>
              <th className="px-4 py-3 font-semibold">Network</th>
              <th className="px-4 py-3 font-semibold">Address</th>
              <th className="px-4 py-3 font-semibold">City</th>
              <th className="px-4 py-3 font-semibold text-right">Total Calls</th>
              <th className="px-4 py-3 font-semibold text-right">Total SMS</th>
              <th className="px-4 py-3 font-semibold">First Contact</th>
              <th className="px-4 py-3 font-semibold">Last Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e2e]/40">
            {records.length > 0 ? (
              records.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#1a1a1a]/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-blue-400 cursor-pointer hover:underline">
                    {row.mobileNumber}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{row.ownerName}</td>
                  <td className="px-4 py-3 text-gray-500">{row.nid}</td>
                  <td className="px-4 py-3 text-gray-300">{row.network}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate" title={row.address !== 'N/A' ? row.address : undefined}>
                    {row.address}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{row.city}</td>
                  <td className="px-4 py-3 text-right text-gray-300">{row.totalCalls}</td>
                  <td className="px-4 py-3 text-right text-gray-300">{row.totalSms}</td>
                  <td className="px-4 py-3 text-gray-400">{row.firstContact}</td>
                  <td className="px-4 py-3 text-gray-400">{row.lastContact}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                  No records match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
