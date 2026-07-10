import React, { useState, useMemo } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { FiltersSidebar } from './components/FiltersSidebar';
import { LocationTags } from './components/LocationTags';
import { ActivityTrendline } from './components/ActivityTrendline';
import { PieChartsGrid } from './components/PieChartsGrid';
import { MetricsSummaryRow } from './components/MetricsSummaryRow';
import { NetworkDistribution } from './components/NetworkDistribution';
import { TopLocationsList } from './components/TopLocationsList';

interface ExecutiveDashboardProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
  onNavigateToTab: (tabId: string) => void;
}

// Safely parse 14-digit strings/numbers or epoch timestamps
export function parseCDRTimestamp(ts: number | string | any): Date {
  const tsStr = String(ts || '');
  if (tsStr.length === 14) {
    const y = parseInt(tsStr.substring(0, 4), 10);
    const m = parseInt(tsStr.substring(4, 6), 10) - 1; // 0-indexed
    const d = parseInt(tsStr.substring(6, 8), 10);
    const hr = parseInt(tsStr.substring(8, 10), 10);
    const min = parseInt(tsStr.substring(10, 12), 10);
    const sec = parseInt(tsStr.substring(12, 14), 10);
    const date = new Date(y, m, d, hr, min, sec);
    if (!isNaN(date.getTime())) return date;
  }
  const date = new Date(Number(ts));
  if (!isNaN(date.getTime())) return date;
  return new Date();
}

// Extract country names from country codes
function getCountryFromNumber(numberStr: string): string {
  if (!numberStr) return 'Unknown';
  const num = numberStr.replace('+', '');
  if (num.startsWith('92')) return 'Pakistan';
  if (num.startsWith('91')) return 'India';
  if (num.startsWith('44')) return 'United Kingdom';
  if (num.startsWith('1')) return 'USA/Canada';
  if (num.startsWith('880') || num.startsWith('17') || num.startsWith('18') || num.startsWith('19') || num.startsWith('15')) return 'Bangladesh';
  return 'Other Countries';
}

// Helper to classify B-Party Type (Domestic, International, Short Code, Brand Masking)
function getBPartyType(otherParty: string, isPakistan: boolean): string {
  if (!otherParty) return 'Domestic';
  const cleaned = otherParty.replace('+', '');
  // Brand masking contains alphabets
  if (/[a-zA-Z]/.test(cleaned)) return 'Brand Masking';
  // Short code
  if (cleaned.length <= 6) return 'Short Code';
  // International vs Domestic
  if (isPakistan) {
    if (cleaned.startsWith('92') || cleaned.startsWith('0')) return 'Domestic';
    return 'International';
  } else {
    if (cleaned.startsWith('880') || cleaned.startsWith('0')) return 'Domestic';
    return 'International';
  }
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ 
  cdrFile, records, onNavigateToTab 
}) => {
  // Filter states
  const [searchInput, setSearchInput] = useState('');
  const [yearSel, setYearSel] = useState('All');
  const [monthSel, setMonthSel] = useState('All');
  const [hourSel, setHourSel] = useState('All');
  const [locationSel, setLocationSel] = useState('All');
  const [bPartySel, setBPartySel] = useState('All');
  const [imeiSel, setImeiSel] = useState('All');
  const [imsiSel, setImsiSel] = useState('All');
  const [callTypeSel, setCallTypeSel] = useState('All');
  const [bPartyTypeSel, setBPartyTypeSel] = useState('All');
  const [countrySel, setCountrySel] = useState('All');
  const [operatorSel, setOperatorSel] = useState('All');

  // Check if active file belongs to Pakistan dataset
  const isPakistanCase = useMemo(() => {
    return records.some(r => {
      if (r.provider && ['Jazz', 'Zong', 'Ufone', 'Telenor', 'Onic', 'SCO'].includes(r.provider)) return true;
      if (r.otherParty && r.otherParty.replace('+', '').startsWith('92')) return true;
      return false;
    });
  }, [records]);

  // Extract unique options from raw records dynamically for filter panel
  const filterOptions = useMemo(() => {
    const years = new Set<string>();
    const locations = new Set<string>();
    const bParties = new Set<string>();
    const imeis = new Set<string>();
    const imsis = new Set<string>();
    const operators = new Set<string>();
    const countries = new Set<string>();
    const activeMonths = new Set<string>();
    const activeHours = new Set<string>();

    const monthsMap = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    records.forEach(r => {
      if (r.timestamp) {
        const d = parseCDRTimestamp(r.timestamp);
        years.add(d.getFullYear().toString());
        activeMonths.add(monthsMap[d.getMonth()]);
        activeHours.add(d.getHours().toString());
      }
      if (r.address) locations.add(r.address);
      if (r.otherParty) {
        bParties.add(r.otherParty);
        countries.add(getCountryFromNumber(r.otherParty));
      }
      if (r.imei) imeis.add(r.imei);
      if (r.imsi) imsis.add(r.imsi);
      if (r.provider) operators.add(r.provider);
    });

    return {
      years: Array.from(years).sort(),
      months: monthsMap.filter(m => activeMonths.has(m)),
      hours: Array.from(activeHours).sort((a, b) => Number(a) - Number(b)),
      locations: Array.from(locations).sort().slice(0, 30),
      bParties: Array.from(bParties).sort().slice(0, 30),
      imeis: Array.from(imeis).sort().slice(0, 15),
      imsis: Array.from(imsis).sort().slice(0, 15),
      operators: Array.from(operators).sort(),
      countries: Array.from(countries).sort()
    };
  }, [records]);

  // Clear filters
  const handleClearFilters = () => {
    setSearchInput('');
    setYearSel('All');
    setMonthSel('All');
    setHourSel('All');
    setLocationSel('All');
    setBPartySel('All');
    setImeiSel('All');
    setImsiSel('All');
    setCallTypeSel('All');
    setBPartyTypeSel('All');
    setCountrySel('All');
    setOperatorSel('All');
  };

  // Filter records instantly whenever any selection state changes
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (searchInput) {
        const q = searchInput.toLowerCase();
        const matches = 
          (r.otherParty && r.otherParty.toLowerCase().includes(q)) ||
          (r.imei && r.imei.toLowerCase().includes(q)) ||
          (r.address && r.address.toLowerCase().includes(q));
        if (!matches) return false;
      }
      
      const d = parseCDRTimestamp(r.timestamp);

      if (yearSel !== 'All') {
        const yr = d.getFullYear().toString();
        if (yr !== yearSel) return false;
      }
      if (monthSel !== 'All') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const mIdx = d.getMonth();
        if (months[mIdx] !== monthSel) return false;
      }
      if (hourSel !== 'All') {
        const hr = d.getHours().toString();
        if (hr !== hourSel) return false;
      }
      if (locationSel !== 'All') {
        if (r.address !== locationSel) return false;
      }
      if (bPartySel !== 'All') {
        if (r.otherParty !== bPartySel) return false;
      }
      if (imeiSel !== 'All') {
        if (r.imei !== imeiSel) return false;
      }
      if (imsiSel !== 'All') {
        if (r.imsi !== imsiSel) return false;
      }
      if (operatorSel !== 'All') {
        if (r.provider !== operatorSel) return false;
      }
      if (countrySel !== 'All') {
        const country = getCountryFromNumber(r.otherParty || '');
        if (country !== countrySel) return false;
      }
      if (bPartyTypeSel !== 'All') {
        const type = getBPartyType(r.otherParty || '', isPakistanCase);
        if (type !== bPartyTypeSel) return false;
      }
      if (callTypeSel !== 'All') {
        const t = r.usageType.toLowerCase();
        if (callTypeSel === 'Incoming Call' && t !== 'mtc') return false;
        if (callTypeSel === 'Outgoing Call' && t !== 'moc') return false;
        if (callTypeSel === 'SMS - Incoming' && t !== 'sms_mtc') return false;
        if (callTypeSel === 'SMS - Outgoing' && t !== 'sms_moc') return false;
      }
      return true;
    });
  }, [records, searchInput, yearSel, monthSel, hourSel, locationSel, bPartySel, imeiSel, imsiSel, operatorSel, countrySel, bPartyTypeSel, callTypeSel, isPakistanCase]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = filteredRecords.length;
    const incomingCalls = filteredRecords.filter(r => r.usageType.toLowerCase() === 'mtc').length;
    const outgoingCalls = filteredRecords.filter(r => r.usageType.toLowerCase() === 'moc').length;
    const incomingSMS = filteredRecords.filter(r => r.usageType.toLowerCase() === 'sms_mtc').length;
    const outgoingSMS = filteredRecords.filter(r => r.usageType.toLowerCase() === 'sms_moc').length;
    const totalSMS = incomingSMS + outgoingSMS;
    const totalCalls = incomingCalls + outgoingCalls;

    const bPartiesSet = new Set(filteredRecords.map(r => r.otherParty).filter(Boolean));
    const locationsSet = new Set(filteredRecords.map(r => r.address).filter(Boolean));

    // Top locations
    const locCounts: Record<string, number> = {};
    filteredRecords.forEach(r => {
      if (r.address) locCounts[r.address] = (locCounts[r.address] || 0) + 1;
    });
    const sortedLocations = Object.entries(locCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const locationBadges = sortedLocations.slice(0, 12);

    // Timeline charts series by month dynamically derived
    const monthsList = filterOptions.months.slice(0, 4);
    const monthColors = ['#3ecf8e', '#3b82f6', '#f59e0b', '#8b5cf6'];
    const monthsMap = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dailyActivityByMonth = monthsList.map((m, idx) => {
      const dailyPoints = Array(30).fill(0);
      const mIdx = monthsMap.indexOf(m);
      filteredRecords.forEach(r => {
        const d = parseCDRTimestamp(r.timestamp);
        if (d.getMonth() === mIdx) {
          const day = d.getDate() - 1;
          if (day >= 0 && day < 30) dailyPoints[day]++;
        }
      });
      return { month: m, points: dailyPoints, color: monthColors[idx % monthColors.length] };
    });

    return {
      total,
      incomingCalls,
      outgoingCalls,
      totalSMS,
      totalCalls,
      bPartiesCount: bPartiesSet.size,
      locationsCount: locationsSet.size,
      sortedLocations,
      locationBadges,
      dailyActivityByMonth
    };
  }, [filteredRecords, filterOptions.months]);

  // Chart breakdowns
  const callTypeBreakdown = useMemo(() => {
    const total = metrics.total || 1;
    const sms = filteredRecords.filter(r => r.usageType.toLowerCase().includes('sms')).length;
    const incoming = metrics.incomingCalls;
    const outgoing = metrics.outgoingCalls;

    return [
      { name: 'SMS - Outgoing', count: sms, pct: ((sms / total) * 100).toFixed(1), color: '#3ecf8e' },
      { name: 'Incoming Call', count: incoming, pct: ((incoming / total) * 100).toFixed(1), color: '#ef4444' },
      { name: 'Outgoing Call', count: outgoing, pct: ((outgoing / total) * 100).toFixed(1), color: '#3b82f6' }
    ];
  }, [filteredRecords, metrics]);

  // Country Breakdown using resolved country codes
  const countryBreakdown = useMemo(() => {
    const total = metrics.total || 1;
    const counts: Record<string, number> = {};
    filteredRecords.forEach(r => {
      const c = getCountryFromNumber(r.otherParty || '');
      counts[c] = (counts[c] || 0) + 1;
    });

    const colors = ['#3ecf8e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'];
    return Object.entries(counts)
      .map(([name, count], idx) => ({
        name,
        count,
        pct: ((count / total) * 100).toFixed(1),
        color: colors[idx % colors.length]
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRecords, metrics.total]);

  // B-Party Type Breakdown (Domestic, International, Brand Masking, Short Code)
  const bPartyTypeBreakdown = useMemo(() => {
    const total = metrics.total || 1;
    const counts: Record<string, number> = {};
    filteredRecords.forEach(r => {
      const type = getBPartyType(r.otherParty || '', isPakistanCase);
      counts[type] = (counts[type] || 0) + 1;
    });

    const colors = ['#3ecf8e', '#a855f7', '#ffc107', '#f97316'];
    return Object.entries(counts)
      .map(([name, count], idx) => ({
        name,
        count,
        pct: ((count / total) * 100).toFixed(1),
        color: colors[idx % colors.length]
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRecords, metrics.total, isPakistanCase]);

  return (
    <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden text-left bg-[#121212] animate-in fade-in duration-300">
      
      {/* 1. LEFT SIDEBAR: FILTERS */}
      <FiltersSidebar
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        yearSel={yearSel}
        setYearSel={setYearSel}
        monthSel={monthSel}
        setMonthSel={setMonthSel}
        hourSel={hourSel}
        setHourSel={setHourSel}
        locationSel={locationSel}
        setLocationSel={setLocationSel}
        bPartySel={bPartySel}
        setBPartySel={setBPartySel}
        imeiSel={imeiSel}
        setImeiSel={setImeiSel}
        imsiSel={imsiSel}
        setImsiSel={setImsiSel}
        callTypeSel={callTypeSel}
        setCallTypeSel={setCallTypeSel}
        bPartyTypeSel={bPartyTypeSel}
        setBPartyTypeSel={setBPartyTypeSel}
        countrySel={countrySel}
        setCountrySel={setCountrySel}
        operatorSel={operatorSel}
        setOperatorSel={setOperatorSel}
        filterOptions={filterOptions}
        onApply={() => {}} // Dynamic filtration is now immediate on selection changes
        onClear={handleClearFilters}
      />

      {/* 2. RIGHT CONTENT AREA: SWITCHARABLE CHARTS */}
      <section className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
        
        {/* Row 1: Location pill tags */}
        <LocationTags locations={metrics.locationBadges} />

        {/* Row 2: Daily Activity Trendline */}
        <ActivityTrendline metrics={metrics} />

        {/* Row 3: Pie charts block (3 columns) */}
        <PieChartsGrid 
          callTypeBreakdown={callTypeBreakdown} 
          bPartyTypeBreakdown={bPartyTypeBreakdown}
          countryBreakdown={countryBreakdown} 
        />

        {/* Row 4: Row of small metric cards */}
        <MetricsSummaryRow 
          incoming={metrics.incomingCalls}
          outgoing={metrics.outgoingCalls}
          sms={metrics.totalSMS}
          bParties={metrics.bPartiesCount}
          locations={metrics.locationsCount}
          calls={metrics.totalCalls}
        />

        {/* Row 5: Dynamic Network distribution and Top Locations side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <NetworkDistribution 
            records={filteredRecords}
            onOpenNetwork={() => onNavigateToTab('network')}
          />
          <TopLocationsList 
            locations={metrics.sortedLocations}
            totalRecords={metrics.total}
            onOpenLocations={() => onNavigateToTab('locations')}
          />
        </div>

      </section>

    </div>
  );
};
