import React, { useState, useMemo } from 'react';
import { ArrowRight, User2, Smartphone, ShieldCheck, Globe, UserCheck, MapPin, Sun, Moon, MessageSquare, PhoneCall } from 'lucide-react';
import { parseCDRTimestamp } from '../AdvancedCDRAnalysis';

interface ExecutivePortalGridProps {
  records: any[];
  isPakistanCase: boolean;
  onNavigateToTab?: (tabId: string) => void;
}

export const ExecutivePortalGrid: React.FC<ExecutivePortalGridProps> = ({ 
  records, isPakistanCase, onNavigateToTab 
}) => {
  const [timeRange, setTimeRange] = useState<'all' | '3days' | '7days' | '30days' | 'month'>('all');
  const [activityType, setActivityType] = useState<'all' | 'incoming_calls' | 'outgoing_calls' | 'incoming_sms' | 'outgoing_sms'>('all');

  // Filter records locally based on range & type pills
  const filtered = useMemo(() => {
    let result = [...records];

    // Activity type
    if (activityType === 'incoming_calls') {
      result = result.filter(r => r.usageType.toLowerCase() === 'mtc');
    } else if (activityType === 'outgoing_calls') {
      result = result.filter(r => r.usageType.toLowerCase() === 'moc');
    } else if (activityType === 'incoming_sms') {
      result = result.filter(r => r.usageType.toLowerCase() === 'sms_mtc');
    } else if (activityType === 'outgoing_sms') {
      result = result.filter(r => r.usageType.toLowerCase() === 'sms_moc');
    }

    // Time range (relative to max record timestamp)
    if (timeRange !== 'all' && records.length > 0) {
      const maxTime = Math.max(...records.map(r => r.timestamp));
      let cutoff = 0;
      if (timeRange === '3days') cutoff = 3 * 24 * 3600 * 1000;
      else if (timeRange === '7days') cutoff = 7 * 24 * 3600 * 1000;
      else if (timeRange === '30days') cutoff = 30 * 24 * 3600 * 1000;
      else if (timeRange === 'month') cutoff = 30 * 24 * 3600 * 1000;

      result = result.filter(r => maxTime - r.timestamp <= cutoff);
    }

    return result;
  }, [records, timeRange, activityType]);

  // Aggregate stats based on dynamic filters
  const stats = useMemo(() => {
    const total = filtered.length;
    const calls = filtered.filter(r => ['moc', 'mtc'].includes(r.usageType.toLowerCase()));
    const sms = filtered.filter(r => r.usageType.toLowerCase().includes('sms'));

    const bPartiesSet = new Set(filtered.map(r => r.otherParty).filter(Boolean));
    const uniqueBParties = Array.from(bPartiesSet);
    
    // Ownership check (Not present in raw CDR file)
    const ownershipFound = 0;
    const ownershipMissing = uniqueBParties.length;

    const imeisSet = new Set(filtered.map(r => r.imei).filter(Boolean));
    const imsisSet = new Set(filtered.map(r => r.imsi).filter(Boolean));
    const locationsSet = new Set(filtered.map(r => r.address).filter(Boolean));

    // Day vs Night calls
    const dayCalls = calls.filter(r => {
      const d = parseCDRTimestamp(r.timestamp);
      const hr = d.getHours();
      return hr >= 6 && hr < 22; // 6 AM to 10 PM
    }).length;

    const nightCalls = calls.length - dayCalls;

    // Day vs Night Locations
    const dayLocs = new Set(filtered.filter(r => {
      const d = parseCDRTimestamp(r.timestamp);
      const hr = d.getHours();
      return hr >= 6 && hr < 22;
    }).map(r => r.address).filter(Boolean)).size;

    const nightLocs = new Set(filtered.filter(r => {
      const d = parseCDRTimestamp(r.timestamp);
      const hr = d.getHours();
      return hr < 6 || hr >= 22;
    }).map(r => r.address).filter(Boolean)).size;

    // International contacts
    const intlCount = uniqueBParties.filter(bp => {
      const clean = bp.replace('+', '');
      if (isPakistanCase) {
        return !clean.startsWith('92') && !clean.startsWith('0');
      } else {
        return !clean.startsWith('880') && !clean.startsWith('0');
      }
    }).length;

    // Most used IMEI
    const imeiFreq: Record<string, number> = {};
    filtered.forEach(r => {
      if (r.imei) imeiFreq[r.imei] = (imeiFreq[r.imei] || 0) + 1;
    });
    let topImei = '—';
    let maxImeiCount = 0;
    Object.entries(imeiFreq).forEach(([imei, count]) => {
      if (count > maxImeiCount) {
        maxImeiCount = count;
        topImei = imei;
      }
    });

    // Most used IMSI
    const imsiFreq: Record<string, number> = {};
    filtered.forEach(r => {
      if (r.imsi) imsiFreq[r.imsi] = (imsiFreq[r.imsi] || 0) + 1;
    });
    let topImsi = '—';
    let maxImsiCount = 0;
    Object.entries(imsiFreq).forEach(([imsi, count]) => {
      if (count > maxImsiCount) {
        maxImsiCount = count;
        topImsi = imsi;
      }
    });

    return {
      total,
      callsCount: calls.length,
      smsCount: sms.length,
      bPartiesCount: uniqueBParties.length,
      ownershipFound,
      ownershipMissing,
      imeisCount: imeisSet.size,
      imsisCount: imsisSet.size,
      locationsCount: locationsSet.size,
      dayCalls,
      nightCalls,
      dayLocs,
      nightLocs,
      intlCount,
      topImei,
      topImsi
    };
  }, [filtered, isPakistanCase]);

  // Card definition configuration
  const cards = [
    {
      id: 'mfc',
      title: 'Total B-Parties',
      value: stats.bPartiesCount,
      sub: 'Total Unique B-Parties',
      meta: `Total Contacts: ${stats.bPartiesCount}`,
      icon: User2,
      color: 'text-blue-400'
    },
    {
      id: 'imei',
      title: 'Total IMEIs',
      value: stats.imeisCount,
      sub: 'Total IMEIs',
      meta: `Most Used: ${stats.topImei}`,
      icon: Smartphone,
      color: 'text-amber-400'
    },
    {
      id: 'imsi',
      title: 'Total IMSIs',
      value: stats.imsisCount,
      sub: 'Total IMSIs',
      meta: `Most Used: ${stats.topImsi}`,
      icon: ShieldCheck,
      color: 'text-purple-400'
    },
    {
      id: 'international',
      title: 'International Contacts',
      value: stats.intlCount,
      sub: 'Total International Numbers',
      meta: `Foreign Contacts: ${stats.intlCount}`,
      icon: Globe,
      color: 'text-red-400'
    },
    {
      id: 'ownership',
      title: 'Ownership Intelligence',
      value: 'N/A',
      sub: 'Ownership Found',
      meta: 'Not in CDR file',
      icon: UserCheck,
      color: 'text-emerald-400'
    },
    {
      id: 'locations',
      title: 'Locations',
      value: stats.locationsCount,
      sub: 'Total Locations',
      meta: `Active Towers: ${stats.locationsCount}`,
      icon: MapPin,
      color: 'text-teal-400'
    },
    {
      id: 'loc_intel',
      title: 'Day Locations',
      value: stats.dayLocs,
      sub: 'Total Day Locations',
      meta: 'Active 6 AM to 10 PM',
      icon: Sun,
      color: 'text-orange-400'
    },
    {
      id: 'loc_intel',
      title: 'Night Locations',
      value: stats.nightLocs,
      sub: 'Total Night Locations',
      meta: 'Active 10 PM to 6 AM',
      icon: Moon,
      color: 'text-indigo-400'
    },
    {
      id: 'graph',
      title: 'Day Calls',
      value: stats.dayCalls,
      sub: 'Total Day Calls',
      meta: 'Active 6 AM to 10 PM',
      icon: Sun,
      color: 'text-yellow-500'
    },
    {
      id: 'graph',
      title: 'Night Calls',
      value: stats.nightCalls,
      sub: 'Total Night Calls',
      meta: 'Active 10 PM to 6 AM',
      icon: Moon,
      color: 'text-blue-500'
    },
    {
      id: 'raw',
      title: 'SMS Analysis',
      value: stats.smsCount,
      sub: 'Total SMS Logged',
      meta: `Count: ${stats.smsCount}`,
      icon: MessageSquare,
      color: 'text-[#3ecf8e]'
    },
    {
      id: 'raw',
      title: 'Call Analysis',
      value: stats.callsCount,
      sub: 'Total Calls Logged',
      meta: `Count: ${stats.callsCount}`,
      icon: PhoneCall,
      color: 'text-green-400'
    }
  ];

  return (
    <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 space-y-5 text-left font-mono">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#2e2e2e]/55 pb-3">
        <div>
          <h4 className="text-xs font-semibold text-gray-250 uppercase tracking-wider">
            Executive Dashboard Portal
          </h4>
          <span className="text-[10px] text-gray-500 block mt-0.5">
            Click any card to open the related analysis module
          </span>
        </div>
        <button className="px-4 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold text-[10px] rounded-lg transition-colors cursor-pointer self-start lg:self-center uppercase tracking-wide">
          Apply Filters
        </button>
      </div>

      {/* Date Filters Row */}
      <div className="flex flex-wrap items-center gap-2">
        {([
          { id: 'all', label: 'All CDR' },
          { id: '3days', label: 'Last 3 Days' },
          { id: '7days', label: 'Last 7 Days' },
          { id: '30days', label: 'Last 30 Days' },
          { id: 'month', label: 'This Month' }
        ] as const).map(p => (
          <button
            key={p.id}
            onClick={() => setTimeRange(p.id)}
            className={`px-3 py-1 text-[10px] rounded-full font-semibold transition-all border cursor-pointer ${
              timeRange === p.id 
                ? 'bg-[#3b82f6]/15 border-[#3b82f6] text-blue-400 shadow-sm' 
                : 'bg-transparent border-[#2e2e2e] text-gray-450 hover:text-gray-200 hover:border-gray-500'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Activity Filters Row */}
      <div className="flex flex-wrap items-center gap-2">
        {([
          { id: 'all', label: 'All Activities' },
          { id: 'incoming_calls', label: 'Incoming Calls' },
          { id: 'outgoing_calls', label: 'Outgoing Calls' },
          { id: 'incoming_sms', label: 'Incoming SMS' },
          { id: 'outgoing_sms', label: 'Outgoing SMS' }
        ] as const).map(p => (
          <button
            key={p.id}
            onClick={() => setActivityType(p.id)}
            className={`px-3 py-1 text-[10px] rounded-full font-semibold transition-all border cursor-pointer ${
              activityType === p.id 
                ? 'bg-[#3ecf8e]/15 border-[#3ecf8e] text-[#3ecf8e] shadow-sm' 
                : 'bg-transparent border-[#2e2e2e] text-gray-450 hover:text-gray-200 hover:border-gray-500'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Grid of 12 Portal Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div 
              key={idx}
              onClick={() => onNavigateToTab?.(c.id)}
              className="bg-[#121212]/40 border border-[#2e2e2e]/60 rounded-xl p-4 flex flex-col justify-between hover:border-gray-500 hover:bg-[#121212]/70 cursor-pointer transition-all duration-200 relative group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4.5 w-4.5 ${c.color}`} />
                  <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wider">{c.title}</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-gray-500 group-hover:text-gray-300 transition-colors" />
              </div>

              <div className="mt-4">
                <span className="text-2xl font-bold text-gray-150 block">{c.value}</span>
                <span className="text-[9px] text-gray-500 font-semibold block mt-1.5">{c.sub}</span>
              </div>

              <div className="border-t border-[#2e2e2e]/55 mt-3 pt-2 text-[8px] text-gray-600 font-bold uppercase tracking-wide truncate max-w-full">
                {c.meta}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
