import React, { useState, useMemo } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { NetworkSummaryCard } from './components/NetworkSummaryCard';
import { NetworkFilters } from './components/NetworkFilters';
import { NetworkDataTable } from './components/NetworkDataTable';
import type { NetworkRecord, NetworkStats } from './types';
import * as XLSX from 'xlsx';

interface NetworkAnalysisProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

const getOperatorFromPrefix = (num: string): string => {
  if (!num) return 'Unknown';
  let clean = num.replace(/[^0-9]/g, '');
  if (clean.startsWith('880')) clean = clean.substring(3);
  if (clean.startsWith('0')) clean = clean.substring(1);
  
  if (clean.startsWith('17') || clean.startsWith('13')) return 'Grameenphone';
  if (clean.startsWith('19') || clean.startsWith('14')) return 'Banglalink';
  if (clean.startsWith('18') || clean.startsWith('16')) return 'Robi';
  if (clean.startsWith('15')) return 'Teletalk';
  // Note: Airtel is merged with Robi technically, but usually uses 16 prefix. We'll map 16 to Robi as done above, but if you want explicit Airtel:
  // if (clean.startsWith('16')) return 'Airtel'; 
  return 'Unknown';
};

export const NetworkAnalysis: React.FC<NetworkAnalysisProps> = ({ cdrFile, records }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [operatorFilter, setOperatorFilter] = useState('All');

  // Compute unique B-Party numbers
  const { allRecords, stats } = useMemo(() => {
    const uniqueNumbers = new Set<string>();
    
    records.forEach(r => {
      if (r.otherParty) {
        uniqueNumbers.add(r.otherParty);
      }
    });

    const parsedRecords: NetworkRecord[] = Array.from(uniqueNumbers).map(num => ({
      number: num,
      operator: getOperatorFromPrefix(num),
      party: 'B-Party'
    }));

    const opCounts: Record<string, number> = {};
    parsedRecords.forEach(r => {
      opCounts[r.operator] = (opCounts[r.operator] || 0) + 1;
    });

    const totalUnique = parsedRecords.length;
    const opPercentages: Record<string, string> = {};
    
    Object.keys(opCounts).forEach(op => {
      opPercentages[op] = totalUnique > 0 ? ((opCounts[op] / totalUnique) * 100).toFixed(1) : '0.0';
    });

    return {
      allRecords: parsedRecords,
      stats: {
        totalUnique,
        operatorCounts: opCounts,
        operatorPercentages: opPercentages
      }
    };
  }, [records]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return allRecords.filter(r => {
      if (operatorFilter !== 'All' && r.operator !== operatorFilter) return false;
      if (searchQuery) {
        const lowerSearch = searchQuery.toLowerCase();
        return (
          r.number.toLowerCase().includes(lowerSearch) ||
          r.operator.toLowerCase().includes(lowerSearch) ||
          r.party.toLowerCase().includes(lowerSearch)
        );
      }
      return true;
    });
  }, [allRecords, operatorFilter, searchQuery]);

  const handleExport = (format: 'excel' | 'csv') => {
    const exportData = filteredRecords.map(r => ({
      Number: r.number,
      Operator: r.operator,
      Party: r.party
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Network Analysis');
    
    if (format === 'excel') {
      XLSX.writeFile(workbook, `Network_Analysis_${cdrFile.phoneNumber}.xlsx`);
    } else {
      XLSX.writeFile(workbook, `Network_Analysis_${cdrFile.phoneNumber}.csv`);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto p-6 space-y-4 custom-scrollbar text-left bg-[#0a0a0a] animate-in fade-in duration-300 font-sans">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h2 className="text-[10px] font-semibold text-blue-400 tracking-widest uppercase flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-blue-500/20 flex items-center justify-center">
              <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </span>
            NETWORK ANALYSIS
          </h2>
          <div className="mt-1 flex items-baseline gap-3">
            <h1 className="text-2xl font-bold text-gray-200">{cdrFile.phoneNumber}</h1>
          </div>
          <p className="text-[11px] text-gray-400 font-mono mt-1">
            {stats.totalUnique} unique Bangladeshi mobile numbers
          </p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => handleExport('excel')}
            className="bg-[#1c1c1c] border border-[#2e2e2e] hover:bg-[#2e2e2e] hover:border-blue-500/50 text-gray-300 text-xs font-semibold px-4 py-2 rounded-lg transition-colors font-mono"
          >
            Excel
          </button>
          <button 
            onClick={() => handleExport('csv')}
            className="bg-[#1c1c1c] border border-[#2e2e2e] hover:bg-[#2e2e2e] hover:border-blue-500/50 text-gray-300 text-xs font-semibold px-4 py-2 rounded-lg transition-colors font-mono"
          >
            CSV
          </button>
        </div>
      </div>

      <NetworkSummaryCard stats={stats} />

      <div>
        <NetworkFilters 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          operatorFilter={operatorFilter}
          setOperatorFilter={setOperatorFilter}
          filteredCount={filteredRecords.length}
        />
        <NetworkDataTable records={filteredRecords} />
      </div>
    </div>
  );
};
