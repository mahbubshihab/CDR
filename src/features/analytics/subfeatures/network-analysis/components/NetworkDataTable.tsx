import React from 'react';
import type { NetworkRecord } from '../types';

interface NetworkDataTableProps {
  records: NetworkRecord[];
}

export const NetworkDataTable: React.FC<NetworkDataTableProps> = ({ records }) => {
  return (
    <div className="bg-[#121212] border-x border-b border-[#2e2e2e] rounded-b-xl flex flex-col font-mono text-[11px]">
      <div className="overflow-x-auto w-full custom-scrollbar">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="text-gray-400 border-y border-[#2e2e2e]">
            <tr>
              <th className="px-4 py-3 font-semibold">Number</th>
              <th className="px-4 py-3 font-semibold">Operator</th>
              <th className="px-4 py-3 font-semibold">Party</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a3441]/40">
            {records.length > 0 ? (
              records.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#1c1c1c] transition-colors">
                  <td className="px-4 py-3 font-bold text-blue-400">
                    {row.number}
                  </td>
                  <td className="px-4 py-3 text-gray-300 font-semibold">{row.operator}</td>
                  <td className="px-4 py-3 text-gray-300 font-semibold">{row.party}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
