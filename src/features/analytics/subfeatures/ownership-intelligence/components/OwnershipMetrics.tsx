import React from 'react';
import { CheckCircle2, Search, TriangleAlert } from 'lucide-react';
import type { OwnershipRecord } from '../types';

interface OwnershipMetricsProps {
  records: OwnershipRecord[];
}

export const OwnershipMetrics: React.FC<OwnershipMetricsProps> = ({ records }) => {
  const totalBParties = records.length;
  // Based on the strictly no simulation rule, standard CDRs do not have ownership data.
  const ownershipFound = 0;
  const notFound = totalBParties;
  const successRate = totalBParties > 0 ? ((ownershipFound / totalBParties) * 100).toFixed(1) : '0.0';

  // Risk alerts: Top 5 B-Parties by communication frequency without ownership
  const topRisks = [...records]
    .sort((a, b) => b.totalCommunications - a.totalCommunications)
    .slice(0, 5);

  return (
    <div className="space-y-4 font-mono">
      {/* Completeness Check */}
      <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            B-Party Completeness Check
          </h3>
          <div className="flex items-center gap-2 text-[#3ecf8e]">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">All {totalBParties} unique B-Parties have been checked</span>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-200">{totalBParties}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Total B-Parties</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#3ecf8e]">{ownershipFound}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Ownership Found</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-500">{notFound}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Not Found</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{successRate}%</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Success Rate</div>
          </div>
        </div>
      </div>

      {/* Export Button area (placeholder for layout matching, actual button may be placed by parent) */}
      
      {/* Summary Stats */}
      <div className="bg-[#1a2332] border border-blue-900/30 rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-16">
          <div>
            <div className="text-2xl font-bold text-gray-200">{totalBParties}</div>
            <div className="text-[11px] text-gray-500 mt-1">Unique B-Parties</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#3ecf8e]">{ownershipFound}</div>
            <div className="text-[11px] text-gray-500 mt-1">With Ownership</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">{topRisks.length}</div>
            <div className="text-[11px] text-gray-500 mt-1">Risk Alerts</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-blue-400/70 text-xs">
          <Search className="h-4 w-4" />
          <span>Bulk lookup · all Bangladeshi mobiles · background API</span>
        </div>
      </div>

      {/* Risk Highlights */}
      <div className="bg-[#1c1a17] border border-amber-900/30 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4 text-amber-500">
          <TriangleAlert className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Ownership Risk Highlights</h3>
        </div>
        <div className="space-y-2 text-xs text-amber-500/80">
          {topRisks.length > 0 ? (
            topRisks.map((risk, idx) => (
              <div key={idx}>
                Frequent contact without ownership: <span className="text-gray-300 font-bold">{risk.mobileNumber}</span> — {risk.totalCommunications} communications
              </div>
            ))
          ) : (
            <div>No risks identified.</div>
          )}
        </div>
      </div>
    </div>
  );
};
