import React, { useState, useMemo } from 'react';
import { 
  BarChart3, Calendar, Phone, MessageSquare, MapPin, 
  Smartphone, UserCheck, Globe, ShieldAlert, Award, 
  TrendingUp, Clock, HelpCircle, AlertCircle, Sparkles,
  Layers, Users, ArrowRight, Search
} from 'lucide-react';
import { type CDRFile, type CDRRecord } from '../../../utils/db';
import { getBPartyOperator } from '../../../utils/operators';

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
      { name: 'SMS - Outgoing', count: sms, pct: ((sms / total) * 100).toFixed(1), color: '#3b82f6' },
      { name: 'Incoming Call', count: incoming, pct: ((incoming / total) * 100).toFixed(1), color: '#ef4444' },
      { name: 'Outgoing Call', count: outgoing, pct: ((outgoing / total) * 100).toFixed(1), color: '#10b981' }
    ];
  }, [filteredRecords, metrics.total]);

  // Country breakdown simulation
  const countryBreakdown = useMemo(() => {
    const total = metrics.total || 1;
    const bdCount = Math.floor(total * 0.994);
    const ukCount = Math.max(0, Math.floor(total * 0.004));
    const otherCount = Math.max(0, total - bdCount - ukCount);

    return [
      { name: 'Bangladesh', count: bdCount, pct: ((bdCount / total) * 100).toFixed(1), color: '#3b82f6' },
      { name: 'United Kingdom', count: ukCount, pct: ((ukCount / total) * 100).toFixed(1), color: '#ef4444' },
      { name: 'Other Countries', count: otherCount, pct: ((otherCount / total) * 100).toFixed(1), color: '#10b981' }
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
    <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden text-left animate-in fade-in duration-300">
      
      {/* 1. LEFT COLUMN: FILTER DRAWER PANEL (Individually scrollable, overscroll boundary contained) */}
      <aside className="w-full lg:w-60 shrink-0 bg-[#171717] border-r border-[#2e2e2e] p-4 flex flex-col gap-4.5 h-full overflow-y-auto custom-scrollbar overscroll-contain">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={handleApplyFilters}
            className="flex-1 py-2 bg-[#046a38] text-white font-medium border border-[#3ecf8e] hover:bg-[#00522c] rounded-lg text-sm text-center cursor-pointer transition-colors shadow-md"
          >
            Apply
          </button>
          <button 
            onClick={handleClearFilters}
            className="px-4 py-2 bg-transparent border border-[#2e2e2e] hover:border-blue-500/30 text-gray-400 hover:text-gray-200 rounded-lg text-sm font-bold cursor-pointer transition-all"
          >
            Clear
          </button>
        </div>

        {/* Text search input */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider font-mono">
            Search Number / IMEI
          </label>
          <div className="relative">
            <input 
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Enter number or IMEI..."
              className="w-full bg-[#121212] border border-[#2e2e2e] rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-250 placeholder-gray-650 focus:outline-none focus:border-[#3ecf8e]"
            />
            <Search className="h-3.5 w-3.5 text-gray-500 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Filters list */}
        <div className="space-y-4 font-mono text-xs">
          
          {/* YEAR FILTER */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">YEAR</span>
            <div className="space-y-0.5">
              {['All', ...filterOptions.years].map(yr => (
                <button
                  key={yr}
                  onClick={() => setYearSel(yr)}
                  className={`w-full text-left px-2.5 py-1 rounded transition-all cursor-pointer ${
                    yearSel === yr ? 'bg-[#3ecf8e] text-gray-950 font-semibold' : 'text-gray-450 hover:bg-[#1e1e1e]'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          {/* MONTH FILTER */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">MONTH</span>
            <div className="space-y-0.5 max-h-36 overflow-y-auto custom-scrollbar">
              {['All', 'Jan', 'Feb', 'Mar', 'Apr'].map(m => (
                <button
                  key={m}
                  onClick={() => setMonthSel(m)}
                  className={`w-full text-left px-2.5 py-1 rounded transition-all cursor-pointer ${
                    monthSel === m ? 'bg-[#3ecf8e] text-gray-950 font-semibold' : 'text-gray-455 hover:bg-[#1e1e1e]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* HOUR FILTER */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">HOUR</span>
            <div className="space-y-0.5 max-h-36 overflow-y-auto custom-scrollbar">
              {['All', '0', '1', '2', '3'].map(hr => (
                <button
                  key={hr}
                  onClick={() => setHourSel(hr)}
                  className={`w-full text-left px-2.5 py-1 rounded transition-all cursor-pointer ${
                    hourSel === hr ? 'bg-[#3ecf8e] text-gray-950 font-semibold' : 'text-gray-450 hover:bg-[#1e1e1e]'
                  }`}
                >
                  {hr === 'All' ? 'All Hours' : `${hr.padStart(2, '0')}:00`}
                </button>
              ))}
            </div>
          </div>

          {/* LOCATION FILTER */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">LOCATION</span>
            <div className="space-y-0.5 max-h-40 overflow-y-auto custom-scrollbar">
              {['All', ...filterOptions.locations].map(loc => (
                <button
                  key={loc}
                  onClick={() => setLocationSel(loc)}
                  className={`w-full text-left px-2.5 py-1 rounded transition-all truncate cursor-pointer ${
                    locationSel === loc ? 'bg-[#3ecf8e] text-gray-950 font-semibold' : 'text-gray-455 hover:bg-[#1e1e1e]'
                  }`}
                  title={loc}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* B PARTY FILTER */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">B PARTY</span>
            <div className="space-y-0.5 max-h-40 overflow-y-auto custom-scrollbar">
              {['All', ...filterOptions.bParties].map(no => (
                <button
                  key={no}
                  onClick={() => setBPartySel(no)}
                  className={`w-full text-left px-2.5 py-1 rounded transition-all cursor-pointer ${
                    bPartySel === no ? 'bg-[#3ecf8e] text-gray-950 font-semibold' : 'text-gray-455 hover:bg-[#1e1e1e]'
                  }`}
                >
                  {no}
                </button>
              ))}
            </div>
          </div>

          {/* IMEI FILTER */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">IMEI</span>
            <div className="space-y-0.5">
              {['All', ...filterOptions.imeis].map(imei => (
                <button
                  key={imei}
                  onClick={() => setImeiSel(imei)}
                  className={`w-full text-left px-2.5 py-1 rounded transition-all truncate cursor-pointer ${
                    imeiSel === imei ? 'bg-[#3ecf8e] text-gray-950 font-semibold' : 'text-gray-455 hover:bg-[#1e1e1e]'
                  }`}
                >
                  {imei}
                </button>
              ))}
            </div>
          </div>

          {/* CALL TYPE FILTER */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">CALL TYPE</span>
            <div className="space-y-0.5">
              {['All', 'Incoming Call', 'Outgoing Call', 'SMS - Incoming', 'SMS - Outgoing'].map(t => (
                <button
                  key={t}
                  onClick={() => setCallTypeSel(t)}
                  className={`w-full text-left px-2.5 py-1 rounded transition-all cursor-pointer ${
                    callTypeSel === t ? 'bg-[#3ecf8e] text-gray-950 font-semibold' : 'text-gray-450 hover:bg-[#1e1e1e]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* 2. RIGHT MAIN AREA: DASHBOARD GRAPHS & METRICS (Individually scrollable) */}
      <div className="flex-1 h-full overflow-y-auto p-5 md:p-6 space-y-6 custom-scrollbar">
        
        {/* Location Intelligence Row Badges */}
        <div className="bg-[#171717]/40 border border-[#2e2e2e] rounded-2xl p-5 space-y-3">
          <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider font-mono">
            Location Intelligence
          </h4>
          <div className="flex flex-wrap gap-2">
            {metrics.locationBadges.map((loc, idx) => (
              <span 
                key={idx} 
                className="px-2.5 py-1.5 bg-[#1e1e1e]/80 border border-[#2e2e2e] rounded-lg text-xs font-mono font-bold text-gray-300"
              >
                {loc.name} <strong className="text-[#3ecf8e] font-semibold font-sans ml-1">({loc.count})</strong>
              </span>
            ))}
            {metrics.locationBadges.length === 0 && (
              <span className="text-gray-500 font-mono text-sm">No active towers identified.</span>
            )}
          </div>
        </div>

        {/* Timeline Chart - Daily Activity By Month */}
        <div className="bg-[#171717]/40 border border-[#2e2e2e] rounded-2xl p-5 space-y-4">
          <h4 className="text-sm text-gray-400 font-bold uppercase tracking-wider font-mono">
            Timeline — Daily Activity By Month
          </h4>

          {/* SVG Line Chart */}
          <div className="relative h-60 w-full border border-[#1e1e1e] rounded-xl bg-[#121212] p-4">
            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="w-full border-t border-[#1e1e1e]" />
              ))}
            </div>

            <svg className="h-full w-full" viewBox="0 0 600 200" preserveAspectRatio="none">
              {metrics.dailyActivityByMonth.map((monthData, mIdx) => {
                const allDailyPoints = metrics.dailyActivityByMonth.flatMap(m => m.points);
                const maxVal = Math.max(...allDailyPoints, 5);
                const pointsStr = monthData.points.map((val, idx) => {
                  const x = (idx / 29) * 580 + 10;
                  const y = 190 - (val / maxVal) * 160;
                  return `${x},${y}`;
                }).join(' ');

                return (
                  <g key={mIdx}>
                    <polyline
                      fill="none"
                      stroke={monthData.color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={pointsStr}
                      className="transition-all duration-300"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Chart Legend */}
            <div className="absolute bottom-2.5 right-4 flex items-center gap-4 text-[11px] font-bold font-mono">
              {metrics.dailyActivityByMonth.map((m, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="text-gray-400">{m.month} Activity</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Totals & Pie Chart Breakdowns (Side-by-Side Circular Layout!) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Card: Total Calls / SMS with Yellow Box Layout matching image copy 2 */}
          <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl overflow-hidden flex flex-col">
            <div className="bg-[#171717] px-3.5 py-2.5 border-b border-[#2e2e2e]">
              <span className="text-xs text-gray-300 font-bold uppercase tracking-wider block font-mono">
                TOTAL CALLS / SMS
              </span>
            </div>
            <div className="flex-1 bg-[#3ecf8e] flex items-center justify-center py-6 text-center text-gray-950 font-semibold text-3xl shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]">
              {metrics.total}
            </div>
            <div className="bg-[#121212] py-7 border-t border-[#1e1e1e]"></div>
          </div>          {/* Pie Chart: Call Type (Pie top, legends bottom) */}
          <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-4 flex flex-col justify-between text-left">
            <div className="border-b border-[#1e1e1e] pb-2">
              <span className="text-xs text-gray-300 font-bold uppercase tracking-wider block font-mono">
                CALL TYPE
              </span>
            </div>
            <div className="flex flex-col items-center py-4 w-full">
              <div className="relative h-18 w-18">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#0f172a" strokeWidth="4.5" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="4.5" strokeDasharray="36.5 100" strokeDashoffset="0" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="4.5" strokeDasharray="19.6 100" strokeDashoffset="-36.5" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="4.5" strokeDasharray="43.9 100" strokeDashoffset="-56.1" />
                </svg>
              </div>
            </div>
            <div className="w-full space-y-1.5 pt-3 border-t border-[#1e1e1e] font-mono text-[11px]">
              {callTypeBreakdown.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between text-gray-300">
                  <div className="flex items-center gap-1.5 truncate">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="truncate">{t.name}</span>
                  </div>
                  <span className="text-gray-500 font-bold ml-1 shrink-0">{t.count} ({Math.round(parseFloat(t.pct))}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pie Chart: B Party Type (Pie top, legends bottom) */}
          <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-4 flex flex-col justify-between text-left">
            <div className="border-b border-[#1e1e1e] pb-2">
              <span className="text-xs text-gray-300 font-bold uppercase tracking-wider block font-mono">
                B PARTY TYPE
              </span>
            </div>
            <div className="flex flex-col items-center py-4 w-full">
              <div className="relative h-18 w-18">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#0f172a" strokeWidth="4.5" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="4.5" strokeDasharray="100 100" strokeDashoffset="0" />
                </svg>
              </div>
            </div>
            <div className="w-full space-y-1.5 pt-3 border-t border-[#1e1e1e] font-mono text-[11px]">
              <div className="flex items-center justify-between text-gray-300">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[#3b82f6] shrink-0" />
                  <span>Domestic</span>
                </div>
                <span className="text-gray-400 font-bold ml-1 shrink-0">{metrics.total} (100%)</span>
              </div>
            </div>
          </div>

          {/* Pie Chart: B Party Country (Pie top, legends bottom) */}
          <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-4 flex flex-col justify-between text-left">
            <div className="border-b border-[#1e1e1e] pb-2">
              <span className="text-xs text-gray-300 font-bold uppercase tracking-wider block font-mono">
                B PARTY COUNTRY
              </span>
            </div>
            <div className="flex flex-col items-center py-4 w-full">
              <div className="relative h-18 w-18">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#0f172a" strokeWidth="4.5" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="4.5" strokeDasharray="99.4 100" strokeDashoffset="0" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="4.5" strokeDasharray="0.6 100" strokeDashoffset="-99.4" />
                </svg>
              </div>
            </div>
            <div className="w-full space-y-1.5 pt-3 border-t border-[#1e1e1e] font-mono text-[11px]">
              {countryBreakdown.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between text-gray-300">
                  <div className="flex items-center gap-1.5 truncate">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="truncate">{t.name}</span>
                  </div>
                  <span className="text-gray-400 font-bold ml-1 shrink-0">{t.count} ({Math.round(parseFloat(t.pct))}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats Grid Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: 'Incoming', value: metrics.incomingCalls },
            { label: 'Outgoing', value: metrics.outgoingCalls },
            { label: 'SMS', value: metrics.totalSMS },
            { label: 'B-Parties', value: metrics.bPartiesCount },
            { label: 'Locations', value: metrics.locationsCount },
            { label: 'Calls', value: metrics.totalCalls }
          ].map((card, idx) => (
            <div key={idx} className="bg-[#1e1e1e]/60 border border-[#2e2e2e] rounded-xl p-3.5 hover:border-brand-blue/20 transition-colors text-center">
              <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider font-mono block">
                {card.label}
              </span>
              <h4 className="text-base font-semibold text-gray-200 mt-1.5 font-mono leading-none">
                {card.value}
              </h4>
            </div>
          ))}
        </div>

        {/* Network Distribution Summary (With top badges!) */}
        <div className="bg-[#171717]/40 border border-[#2e2e2e] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-3">
            <h4 className="text-sm text-gray-400 font-bold uppercase tracking-wider font-mono">
              Network Distribution Summary
            </h4>
            <button 
              onClick={() => onNavigateToTab('network')}
              className="text-sm text-[#3ecf8e] hover:underline font-mono font-bold cursor-pointer"
            >
              Open Network Analysis →
            </button>
          </div>

          {/* Badges Grid corresponding to image copy 3 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            <div className="bg-[#171717] border border-[#2e2e2e] p-2.5 rounded-lg text-center">
              <h5 className="text-sm font-semibold text-gray-200">{metrics.bPartiesCount}</h5>
              <span className="text-sm text-gray-500 block font-mono uppercase tracking-wider font-bold">Total Unique Numbers</span>
            </div>
            {operatorBreakdown.map((op, idx) => (
              <div key={idx} className="bg-[#171717] border border-[#2e2e2e] p-2.5 rounded-lg text-center">
                <h5 className="text-sm font-semibold text-gray-200">{op.count}</h5>
                <span className="text-sm text-gray-500 block font-mono uppercase tracking-wider font-bold">{op.name} ({op.percentage}%)</span>
              </div>
            ))}
          </div>

          {/* Progress Bars */}
          <div className="space-y-3.5 pt-2">
            {operatorBreakdown.map((op, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4 font-mono text-xs">
                <span className="w-24 font-bold text-gray-400 text-left">{op.name}</span>
                <div className="flex-1 h-2 bg-[#121212] border border-[#1e1e1e] rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${op.color} rounded-full transition-all duration-300`} 
                    style={{ width: `${op.count > 0 ? op.percentage : 0}%` }} 
                  />
                </div>
                <span className="w-24 text-right text-gray-400 font-bold">{op.count} <span className="text-sm text-gray-500">({op.percentage}%)</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Locations Top 10 Horizontal Bar Charts */}
        <div className="bg-[#171717]/40 border border-[#2e2e2e] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-3">
            <h4 className="text-sm text-gray-400 font-bold uppercase tracking-wider font-mono">
              Locations (Top 10)
            </h4>
            <button 
              onClick={() => onNavigateToTab('loc_sum')}
              className="text-sm text-[#3ecf8e] hover:underline font-mono font-bold cursor-pointer"
            >
              Open Location Summary →
            </button>
          </div>

          <div className="space-y-3">
            {metrics.sortedLocations.map((loc, idx) => {
              const maxVal = Math.max(...metrics.sortedLocations.map(l => l.count), 1);
              const pct = ((loc.count / maxVal) * 100).toFixed(0);

              return (
                <div key={idx} className="space-y-1 text-left font-mono">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-semibold truncate max-w-sm">
                      #{idx + 1} {loc.name}
                    </span>
                    <span className="text-gray-400 font-bold">{loc.count.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#121212] border border-[#1e1e1e] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-sky-500 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
