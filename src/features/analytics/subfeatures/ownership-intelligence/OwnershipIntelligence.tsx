import React, { useState, useMemo } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { OwnershipMetrics } from './components/OwnershipMetrics';
import { OwnershipFilters } from './components/OwnershipFilters';
import { OwnershipDataTable } from './components/OwnershipDataTable';
import type { OwnershipRecord } from './types';
import * as XLSX from 'xlsx';

interface OwnershipIntelligenceProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

// Bangladeshi operator prefix mapping logic
const getOperatorFromPrefix = (num: string): string => {
  if (!num) return 'Unknown';
  // Standardize number (remove +880, 880, or leading 0 if starting with 1)
  let clean = num.replace(/[^0-9]/g, '');
  if (clean.startsWith('880')) clean = clean.substring(3);
  if (clean.startsWith('0')) clean = clean.substring(1);
  
  if (clean.startsWith('17') || clean.startsWith('13')) return 'Grameenphone';
  if (clean.startsWith('19') || clean.startsWith('14')) return 'Banglalink';
  if (clean.startsWith('18') || clean.startsWith('16')) return 'Robi';
  if (clean.startsWith('15')) return 'Teletalk';
  return 'Unknown';
};

export const OwnershipIntelligence: React.FC<OwnershipIntelligenceProps> = ({ cdrFile, records }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [nidFilter, setNidFilter] = useState('');
  const [networkFilter, setNetworkFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [recordsFilter, setRecordsFilter] = useState('All');

  const computedRecords = useMemo(() => {
    const map = new Map<string, OwnershipRecord>();
    
    records.forEach(r => {
      if (!r.otherParty) return;
      const bNumber = r.otherParty;
      
      let stat = map.get(bNumber);
      if (!stat) {
        stat = {
          mobileNumber: bNumber,
          ownerName: 'N/A', // No mock data
          nid: 'N/A',
          network: getOperatorFromPrefix(bNumber),
          address: 'N/A',
          city: 'N/A',
          totalCalls: 0,
          totalSms: 0,
          firstContact: '',
          lastContact: '',
          totalCommunications: 0
        };
        map.set(bNumber, stat);
      }

      stat.totalCommunications++;
      
      // Determine call vs sms
      const uType = r.usageType.toLowerCase();
      if (uType.includes('sms')) {
        stat.totalSms++;
      } else if (uType.includes('call') || uType.includes('voice') || uType.includes('moc') || uType.includes('mtc') || uType === 'incoming' || uType === 'outgoing') {
        stat.totalCalls++;
      } else {
        // Default to calls if unknown
        stat.totalCalls++;
      }

      // Handle timestamps
      const timeStr = String(r.timestamp);
      let dateStr = timeStr;
      if (timeStr.length === 14) {
        const y = timeStr.substring(0, 4);
        const m = timeStr.substring(4, 6);
        const d = timeStr.substring(6, 8);
        dateStr = `${y}-${m}-${d}`; // Consistent YYYY-MM-DD
      } else {
        try {
          const d = new Date(r.timestamp);
          if (!isNaN(d.getTime())) {
            dateStr = d.toISOString().split('T')[0];
          }
        } catch (_) {}
      }

      if (!stat.firstContact) stat.firstContact = dateStr;
      
      // Compare dates for min/max
      if (dateStr < stat.firstContact) stat.firstContact = dateStr;
      if (!stat.lastContact || dateStr > stat.lastContact) stat.lastContact = dateStr;
    });

    return Array.from(map.values()).sort((a, b) => b.totalCommunications - a.totalCommunications);
  }, [records]);

  const filteredRecords = useMemo(() => {
    return computedRecords.filter(r => {
      // Search
      const searchMatch = !searchQuery || 
        r.mobileNumber.includes(searchQuery) ||
        r.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.nid.includes(searchQuery);
        
      if (!searchMatch) return false;

      // NID
      if (nidFilter && !r.nid.includes(nidFilter)) return false;

      // Network
      if (networkFilter !== 'All' && r.network !== networkFilter) return false;

      // City
      if (cityFilter !== 'All' && r.city !== cityFilter) return false;

      // Records Filter (With/Without Ownership)
      if (recordsFilter === 'With Ownership' && r.ownerName === 'N/A') return false;
      if (recordsFilter === 'Without Ownership' && r.ownerName !== 'N/A') return false;

      return true;
    });
  }, [computedRecords, searchQuery, nidFilter, networkFilter, cityFilter, recordsFilter]);

  const handleExport = () => {
    const exportData = filteredRecords.map(r => ({
      'Mobile Number': r.mobileNumber,
      'Owner Name': r.ownerName,
      'NID': r.nid,
      'Network': r.network,
      'Address': r.address,
      'City': r.city,
      'Total Calls': r.totalCalls,
      'Total SMS': r.totalSms,
      'First Contact': r.firstContact,
      'Last Contact': r.lastContact
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ownership Intelligence');
    XLSX.writeFile(workbook, `Ownership_Intelligence_${cdrFile.phoneNumber}.xlsx`);
  };

  return (
    <div className="w-full h-full overflow-y-auto p-6 space-y-6 custom-scrollbar text-left bg-[#0b0c10] animate-in fade-in duration-300">
      
      {/* Title Header with Export Button */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 pb-2">
        <div>
          {/* Header styling could match the image loosely, though top layout was generic. The image starts with B-PARTY COMPLETENESS CHECK */}
        </div>
        <button 
          onClick={handleExport}
          className="bg-[#1c1c1c] hover:bg-[#334155] border border-blue-900/50 text-blue-400 text-xs font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap self-start"
        >
          Export Excel (full report)
        </button>
      </div>

      <OwnershipMetrics records={computedRecords} />

      <OwnershipFilters 
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        nidFilter={nidFilter} setNidFilter={setNidFilter}
        networkFilter={networkFilter} setNetworkFilter={setNetworkFilter}
        cityFilter={cityFilter} setCityFilter={setCityFilter}
        recordsFilter={recordsFilter} setRecordsFilter={setRecordsFilter}
      />

      <OwnershipDataTable records={filteredRecords} totalRecords={computedRecords.length} />

    </div>
  );
};
