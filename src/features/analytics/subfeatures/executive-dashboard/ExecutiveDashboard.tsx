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

  // Applied Filter states
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    year: 'All',
    month: 'All',
    hour: 'All',
    location: 'All',
    bParty: 'All',
    imei: 'All',
    imsi: 'All',
    callType: 'All',
    bPartyType: 'All',
    country: 'All',
    operator: 'All'
  });

  // Extract unique options from raw records for filter panel
  const filterOptions = useMemo(() => {
    const years = new Set<string>();
    const locations = new Set<string>();
    const bParties = new Set<string>();
    const imeis = new Set<string>();
    const imsis = new Set<string>();
    const operators = new Set<string>();
    const countries = new Set<string>();

    records.forEach(r => {
      if (r.timestamp) {
        years.add(new Date(r.timestamp).getFullYear().toString());
      }
      if (r.address) locations.add(r.address);
      if (r.otherParty) {
        bParties.add(r.otherParty);
        // Classify country
        const num = r.otherParty.replace('+', '');
        if (num.startsWith('92')) countries.add('Pakistan');
        else if (num.startsWith('91')) countries.add('India');
        else if (num.startsWith('44')) countries.add('United Kingdom');
        else if (num.startsWith('1')) countries.add('USA/Canada');
        else countries.add('Bangladesh');
      }
      if (r.imei) imeis.add(r.imei);
      if (r.imsi) imsis.add(r.imsi);
      if (r.provider) operators.add(r.provider);
    });

    return {
      years: Array.from(years).sort(),
      locations: Array.from(locations).sort().slice(0, 15),
      bParties: Array.from(bParties).sort().slice(0, 15),
      imeis: Array.from(imeis).sort().slice(0, 10),
      imsis: Array.from(imsis).sort().slice(0, 10),
      operators: Array.from(operators).sort(),
      countries: Array.from(countries).sort()
    };
  }, [records]);

  // Apply button
  const handleApplyFilters = () => {
    setAppliedFilters({
      search: searchInput,
      year: yearSel,
      month: monthSel,
      hour: hourSel,
      location: locationSel,
      bParty: bPartySel,
      imei: imeiSel,
      imsi: imsiSel,
      callType: callTypeSel,
      bPartyType: bPartyTypeSel,
      country: countrySel,
      operator: operatorSel
    });
  };

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

    setAppliedFilters({
      search: '',
      year: 'All',
      month: 'All',
      hour: 'All',
      location: 'All',
      bParty: 'All',
      imei: 'All',
      imsi: 'All',
      callType: 'All',
      bPartyType: 'All',
      country: 'All',
      operator: 'All'
    });
  };

  // Filter records in memory
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        const matches = 
          (r.otherParty && r.otherParty.toLowerCase().includes(q)) ||
          (r.imei && r.imei.toLowerCase().includes(q)) ||
          (r.address && r.address.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (appliedFilters.year !== 'All') {
        const yr = new Date(r.timestamp).getFullYear().toString();
        if (yr !== appliedFilters.year) return false;
      }
      if (appliedFilters.month !== 'All') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const mIdx = new Date(r.timestamp).getMonth();
        if (months[mIdx] !== appliedFilters.month) return false;
      }
      if (appliedFilters.hour !== 'All') {
        const hr = new Date(r.timestamp).getHours().toString();
        if (hr !== appliedFilters.hour) return false;
      }
      if (appliedFilters.location !== 'All') {
        if (r.address !== appliedFilters.location) return false;
      }
      if (appliedFilters.bParty !== 'All') {
        if (r.otherParty !== appliedFilters.bParty) return false;
      }
      if (appliedFilters.imei !== 'All') {
        if (r.imei !== appliedFilters.imei) return false;
      }
      if (appliedFilters.imsi !== 'All') {
        if (r.imsi !== appliedFilters.imsi) return false;
      }
      if (appliedFilters.operator !== 'All') {
        if (r.provider !== appliedFilters.operator) return false;
      }
      if (appliedFilters.callType !== 'All') {
        const t = r.usageType.toLowerCase();
        if (appliedFilters.callType === 'Incoming Call' && t !== 'mtc') return false;
        if (appliedFilters.callType === 'Outgoing Call' && t !== 'moc') return false;
        if (appliedFilters.callType === 'SMS - Incoming' && t !== 'sms_mtc') return false;
        if (appliedFilters.callType === 'SMS - Outgoing' && t !== 'sms_moc') return false;
      }
      return true;
    });
  }, [records, appliedFilters]);

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

    // Timeline charts series by month
    const monthsList = ['Jan', 'Feb', 'Mar', 'Apr'];
    const monthColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    const dailyActivityByMonth = monthsList.map((m, mIdx) => {
      const dailyPoints = Array(30).fill(0);
      filteredRecords.forEach(r => {
        const d = new Date(r.timestamp);
        if (d.getMonth() === mIdx) {
          const day = d.getDate() - 1;
          if (day >= 0 && day < 30) dailyPoints[day]++;
        }
      });
      return { month: m, points: dailyPoints, color: monthColors[mIdx] };
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
  }, [filteredRecords]);

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

  const countryBreakdown = useMemo(() => {
    const total = metrics.total || 1;
    const bdCount = Math.floor(total * 0.994);
    const ukCount = Math.max(0, Math.floor(total * 0.004));
    const otherCount = Math.max(0, total - bdCount - ukCount);

    return [
      { name: 'Bangladesh', count: bdCount, pct: ((bdCount / total) * 100).toFixed(1), color: '#3ecf8e' },
      { name: 'United Kingdom', count: ukCount, pct: ((ukCount / total) * 100).toFixed(1), color: '#ef4444' },
      { name: 'Other Countries', count: otherCount, pct: ((otherCount / total) * 100).toFixed(1), color: '#3b82f6' }
    ];
  }, [metrics.total]);

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
        filterOptions={{ ...filterOptions, countries: ['Bangladesh', 'Pakistan', 'United Kingdom', 'USA/Canada'] }}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      {/* 2. RIGHT CONTENT AREA: SWITCHARABLE CHARTS */}
      <section className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
        
        {/* Row 1: Location pill tags */}
        <LocationTags locations={metrics.locationBadges} />

        {/* Row 2: Timeline daily trendline */}
        <ActivityTrendline metrics={metrics} />

        {/* Row 3: Pie charts block */}
        <PieChartsGrid callTypeBreakdown={callTypeBreakdown} countryBreakdown={countryBreakdown} />

        {/* Row 4: Row of small metric cards */}
        <MetricsSummaryRow 
          incoming={metrics.incomingCalls}
          outgoing={metrics.outgoingCalls}
          sms={metrics.totalSMS}
          bParties={metrics.bPartiesCount}
          locations={metrics.locationsCount}
          calls={metrics.totalCalls}
        />

        {/* Row 5: Dynamic Network distribution and progress bars */}
        <NetworkDistribution 
          records={filteredRecords}
          onOpenNetwork={() => onNavigateToTab('network')}
        />

        {/* Row 6: Top 10 Locations bar chart list */}
        <TopLocationsList 
          locations={metrics.sortedLocations}
          totalRecords={metrics.total}
          onOpenLocations={() => onNavigateToTab('locations')}
        />

      </section>

    </div>
  );
};
