import React from 'react';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface LeadsGridProps {
  stats: {
    topParty: string;
    maxPartyCount: number;
    topAddress: string;
    maxAddressCount: number;
    mostUsedImei: string;
    maxImeiCount: number;
    topImsi: string;
    maxImsiCount: number;
    dayCallsCount: number;
    nightCallsCount: number;
    callsCount: number;
    smsCount: number;
  };
}

export const LeadsGrid: React.FC<LeadsGridProps> = ({ stats }) => {
  const leads = [
    {
      title: 'Top contacted B-party target',
      primary: stats.topParty,
      sec: `Frequency: ${stats.maxPartyCount} times`,
      desc: 'This number represents the highest interaction volume and represents the main cohort suspect.',
      action: 'Search logs'
    },
    {
      title: 'Most active cell tower address',
      primary: stats.topAddress,
      sec: `Dwellings: ${stats.maxAddressCount} logs`,
      desc: 'The geographic coordinate tower where the target lingers the most. Probable residence or workspace.',
      action: 'Map coordinate'
    },
    {
      title: 'Most used hardware handset IMEI',
      primary: stats.mostUsedImei,
      sec: `Logs count: ${stats.maxImeiCount}`,
      desc: 'Handset IMEI signature. Check database for device change anomalies or other linked SIM cards.',
      action: 'Track IMEI'
    },
    {
      title: 'Target SIM card IMSI identification',
      primary: stats.topImsi || 'Unknown IMSI',
      sec: `Registration events: ${stats.maxImsiCount || 0}`,
      desc: 'Unique IMSI ID mapping the SIM chip. Useful to request subscription data from operator.',
      action: 'Verify IMSI'
    },
    {
      title: 'Day / Night activity distribution',
      primary: `Day: ${stats.dayCallsCount} vs Night: ${stats.nightCallsCount}`,
      sec: `Total active days: ${stats.maxPartyCount}`,
      desc: 'Calculates active sleep patterns. Night watches indicate active anomalies.',
      action: 'Show timeline'
    },
    {
      title: 'Call volume vs SMS message ratio',
      primary: `${stats.callsCount} Calls vs ${stats.smsCount} SMS`,
      sec: `Activity share: ${((stats.callsCount / (stats.callsCount + stats.smsCount || 1)) * 100).toFixed(0)}% Voice`,
      desc: 'Determines target operational style. High SMS ratio indicates digital coordination/gateways.',
      action: 'Filter calls'
    }
  ];

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center gap-1.5 text-gray-450 font-semibold font-mono text-[10px] uppercase tracking-wider">
        <ShieldAlert className="h-4 w-4 text-[#3ecf8e]" />
        <span>Generated Analytical Leads & Key Suspect Cohorts</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {leads.map((lead, idx) => (
          <div key={idx} className="bg-[#1e1e1e] border border-[#2e2e2e] hover:border-[#3ecf8e]/20 transition-all rounded-xl p-5 flex flex-col justify-between text-left space-y-4 shadow-sm relative overflow-hidden group">
            <div className="space-y-2">
              <span className="text-[10px] text-[#3ecf8e] font-semibold font-mono uppercase tracking-wider block">
                Lead {idx + 1}: {lead.title}
              </span>
              <strong className="text-sm font-semibold text-gray-250 block truncate" title={lead.primary}>
                {lead.primary}
              </strong>
              <span className="text-xs text-gray-500 font-mono block leading-none">{lead.sec}</span>
              <p className="text-xs text-gray-400 font-medium leading-relaxed pt-1">
                {lead.desc}
              </p>
            </div>
            <button className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold font-mono uppercase group-hover:text-gray-205 transition-colors w-max pt-2 cursor-pointer">
              <span>{lead.action}</span>
              <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
