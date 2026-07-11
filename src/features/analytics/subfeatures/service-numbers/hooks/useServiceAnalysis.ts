import { useMemo, useState } from 'react';
import type { CDRRecord } from '../../../../../utils/db';
import { lookupService, type ServiceMapping } from '../utils/serviceMappings';

export interface ServiceTableRow extends ServiceMapping {
  value: string;
  source: string;
  total: number;
  firstSeen: string;
  lastSeen: string;
}

export function useServiceAnalysis(records: CDRRecord[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [dropdownCategory, setDropdownCategory] = useState<string>('All categories');

  // Step 1: Process records into unique service numbers
  const processedData = useMemo(() => {
    const serviceMap = new Map<string, { total: number, firstSeen: Date, lastSeen: Date, source: Set<string> }>();

    records.forEach(r => {
      const num = r.otherParty || '';
      // We consider "services" as:
      // 1. Strings with alphabetic characters (Hex IDs like 'bKash')
      // 2. Numbers with length <= 6 (Short codes)
      // 3. Numbers matching specific known formats like '091...' (handled in mapping, but we need to include them. For now, let's include anything <= 6 or letters)
      // To mirror reference image which had 0919330416 as "Peshawar Landline", we might just include them if they're in our lookup, but to avoid iterating all numbers, we'll check length <= 9 and starting with 02 for BD landlines, or anything alphabetic.
      
      let isService = false;
      if (num.match(/^[a-zA-Z]+[a-zA-Z0-9\s]*$/)) {
        isService = true; // Hex ID
      } else if (num.length <= 6 && num.length > 2) {
        isService = true; // Short code
      } else if (num.startsWith('02') && num.length === 9) {
        isService = true; // BD Landline
      }

      if (isService) {
        const existing = serviceMap.get(num);
        const date = new Date(r.timestamp);
        
        let source = 'b_number'; // default
        if (r.usageType === 'MOC' || r.usageType === 'SMS_MOC') source = 'b_number';
        if (r.usageType === 'MTC' || r.usageType === 'SMS_MTC') source = 'a_number'; // Incoming means other party was a_number

        if (existing) {
          existing.total += 1;
          if (date < existing.firstSeen) existing.firstSeen = date;
          if (date > existing.lastSeen) existing.lastSeen = date;
          existing.source.add(source);
        } else {
          serviceMap.set(num, {
            total: 1,
            firstSeen: date,
            lastSeen: date,
            source: new Set([source])
          });
        }
      }
    });

    // Step 2: Enrich with lookupService
    const tableData: ServiceTableRow[] = [];
    serviceMap.forEach((stats, value) => {
      const mapping = lookupService(value);
      tableData.push({
        value,
        ...mapping,
        total: stats.total,
        firstSeen: stats.firstSeen.toISOString().split('T')[0],
        lastSeen: stats.lastSeen.toISOString().split('T')[0],
        source: Array.from(stats.source).join(', ')
      });
    });

    // Sort by total descending
    tableData.sort((a, b) => b.total - a.total);

    return tableData;
  }, [records]);

  // Step 3: Compute Summary Stats
  const summaryStats = useMemo(() => {
    let serviceContacts = processedData.length;
    let hexIdentifiers = 0;
    let emergency = 0;
    let banking = 0;
    let telecom = 0;
    let government = 0;
    let shortCodes = 0;

    processedData.forEach(row => {
      if (row.idType === 'Hex ID') hexIdentifiers++;
      if (row.idType === 'Short Code') shortCodes++;
      if (row.category === 'Emergency') emergency++;
      if (row.category === 'Banking') banking++;
      if (row.category === 'Telecom') telecom++;
      if (row.category === 'Government') government++;
    });

    return {
      serviceContacts,
      hexIdentifiers,
      emergency,
      banking,
      telecom,
      government,
      shortCodes
    };
  }, [processedData]);

  // Step 4: Compute Chart Data (Services by Category)
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    processedData.forEach(row => {
      counts[row.category] = (counts[row.category] || 0) + row.total;
    });

    // Filter out 0s and format for recharts
    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [processedData]);

  // Step 5: Filter data for the table
  const filteredTableData = useMemo(() => {
    return processedData.filter(row => {
      // 1. Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          row.value.toLowerCase().includes(term) ||
          row.label.toLowerCase().includes(term) ||
          row.organization.toLowerCase().includes(term) ||
          row.operator.toLowerCase().includes(term) ||
          row.category.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }

      // 2. Active Category pill filter
      if (activeCategory !== 'All') {
        if (activeCategory === 'Hex IDs' && row.idType !== 'Hex ID') return false;
        if (activeCategory !== 'Hex IDs' && row.category !== activeCategory) return false;
      }

      // 3. Dropdown Category filter
      if (dropdownCategory !== 'All categories') {
        if (row.category !== dropdownCategory) return false;
      }

      return true;
    });
  }, [processedData, searchTerm, activeCategory, dropdownCategory]);

  return {
    summaryStats,
    chartData,
    tableData: filteredTableData,
    searchTerm,
    setSearchTerm,
    activeCategory,
    setActiveCategory,
    dropdownCategory,
    setDropdownCategory
  };
}
