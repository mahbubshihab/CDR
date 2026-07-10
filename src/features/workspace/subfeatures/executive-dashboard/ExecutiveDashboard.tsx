import React, { useState, useMemo } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { getBPartyOperator } from '../../../../utils/operators';
import { FiltersSidebar } from './components/FiltersSidebar';
import { MetricsGrid } from './components/MetricsGrid';
import { ActivityTrendline } from './components/ActivityTrendline';
import { PieChartsGrid } from './components/PieChartsGrid';

interface ExecutiveDashboardProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
  onNavigateToTab: (tabId: string) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ 
  cdrFile, records, onNavigateToTab 
}) => {
  // --- Filter states ---
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

  // Extract unique options from raw records for filter panel list
  const filterOptions = useMemo(() => {
    const years = new Set<string>();
    const locations = new Set<string>();
    const bParties = new Set<string>();
    const imeis = new Set<string>();
    const imsis = new Set<string>();
    const operators = new Set<string>();

    records.forEach(r => {
      if (r.timestamp) {
        years.add(new Date(r.timestamp).getFullYear().toString());
      }
      if (r.address) locations.add(r.address);
      if (r.otherParty) bParties.add(r.otherParty);
      if (r.imei) imeis.add(r.imei);
      if (r.imsi) imsis.add(r.imsi);
      if (r.provider) operators.add(r.provider);
    });

    return {
      years: Array.from(years).sort(),
      locations: Array.from(locations).sort().slice(0, 15),
      bParties: Array.from(bParties).sort().slice(0, 15),
      imeis: Array.from(imeis).sort(),
      imsis: Array.from(imsis).sort(),
      operators: Array.from(operators).sort()
    };
  }, [records]);

  // Apply button handler
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
      if (appliedFilters.callType !== 'All') {
        const t = r.usageType.toLowerCase();
        if (appliedFilters.callType === 'Incoming Call' && t !== 'mtc') return false;
        if (appliedFilters.callType === 'Outgoing Call' && t !== 'moc') return false;
        if (appliedFilters.callType === 'SMS - Incoming' && t !== 'sms_mtc') return false;
        if (appliedFilters.callType === 'SMS - Outgoing' && t !== 'sms_moc') return false;
      }
      if (appliedFilters.operator !== 'All') {
        if (r.provider !== appliedFilters.operator) return false;
      }
      return true;
    });
  }, [records, appliedFilters]);

  // Calculations for charts and summary blocks
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

    // Operator counts based on B-party number prefix!
    const opCounts: Record<string, number> = {};
    filteredRecords.forEach(r => {
      const op = getBPartyOperator(r.otherParty);
      opCounts[op] = (opCounts[op] || 0) + 1;
    });

    // Locations Top 10 counts
    const locCounts: Record<string, number> = {};
    filteredRecords.forEach(r => {
      if (r.address) locCounts[r.address] = (locCounts[r.address] || 0) + 1;
    });
    const sortedLocations = Object.entries(locCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const locationBadges = sortedLocations.slice(0, 8);

    // Timeline chart activity points by month (grouped daily activity)
    const monthColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    const monthsList = ['Jan', 'Feb', 'Mar', 'Apr'];

    const dailyActivityByMonth = monthsList.map((m, mIdx) => {
      const dailyPoints = Array(30).fill(0);
      filteredRecords.forEach(r => {
        const d = new Date(r.timestamp);
        if (d.getMonth() === mIdx) {
          const dateDay = d.getDate() - 1; // 0-indexed day
          if (dateDay >= 0 && dateDay < 30) {
            dailyPoints[dateDay]++;
          }
        }
      });
      return {
        month: m,
        points: dailyPoints,
        color: monthColors[mIdx]
      };
    });

    return {
      total,
      incomingCalls,
      outgoingCalls,
      totalSMS,
      totalCalls,
      bPartiesCount: bPartiesSet.size,
      locationsCount: locationsSet.size,
      opCounts,
      sortedLocations,
      locationBadges,
      dailyActivityByMonth
    };
  }, [filteredRecords]);

  // Call Type breakdown calculations for pie chart
  const callTypeBreakdown = useMemo(() => {
    const total = metrics.total || 1;
    const sms = filteredRecords.filter(r => r.usageType.toLowerCase().includes('sms')).length;
    const incoming = filteredRecords.filter(r => r.usageType.toLowerCase() === 'mtc').length;
    const outgoing = filteredRecords.filter(r => r.usageType.toLowerCase() === 'moc').length;

    return [
      { name: 'SMS - Outgoing', count: sms, pct: ((sms / total) * 100).toFixed(1), color: '#3ecf8e' },
      { name: 'Incoming Call', count: incoming, pct: ((incoming / total) * 100).toFixed(1), color: '#ef4444' },
      { name: 'Outgoing Call', count: outgoing, pct: ((outgoing / total) * 100).toFixed(1), color: '#3b82f6' }
    ];
  }, [filteredRecords, metrics.total]);

  // Country breakdown simulation
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

  // Operator breakdowns
  const operatorBreakdown = useMemo(() => {
    const total = metrics.total || 1;
    const operators = ['Grameenphone', 'Robi', 'Banglalink', 'Teletalk', 'Airtel'];
    const colors: Record<string, string> = {
      'Grameenphone': 'bg-sky-500',
      'Robi': 'bg-orange-500',
      'Banglalink': 'bg-emerald-500',
      'Teletalk': 'bg-blue-500',
      'Airtel': 'bg-red-500'
    };

    return operators.map(op => {
      const count = metrics.opCounts[op] || 0;
      const percentage = ((count / total) * 100).toFixed(1);
      return { 
        name: op, 
        count, 
        percentage,
        color: colors[op] || 'bg-gray-500'
      };
    });
  }, [metrics]);

  return (
    <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden text-left animate-in fade-in duration-300 bg-[#121212]">
      
      {/* 1. LEFT COLUMN: FILTER DRAWER PANEL */}
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
        callTypeSel={callTypeSel}
        setCallTypeSel={setCallTypeSel}
        operatorSel={operatorSel}
        setOperatorSel={setOperatorSel}
        filterOptions={filterOptions}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      {/* 2. RIGHT COLUMN: WORKSPACE DASHBOARD PANELS */}
      <section className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
        <MetricsGrid metrics={metrics} operatorBreakdown={operatorBreakdown} />
        <ActivityTrendline metrics={metrics} />
        <PieChartsGrid callTypeBreakdown={callTypeBreakdown} countryBreakdown={countryBreakdown} />
      </section>

    </div>
  );
};
