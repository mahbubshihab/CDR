import React from 'react';
import { Globe, AlertTriangle, MessageSquare, Phone, Activity } from 'lucide-react';
import type { CountryAggregate, InternationalRecord } from '../types';

interface IntlSummaryCardProps {
  countries: CountryAggregate[];
  records: InternationalRecord[];
  totalComms: number;
  activeDays: number;
  dayComms: number;
  nightComms: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const IntlSummaryCard: React.FC<IntlSummaryCardProps> = ({ 
  countries, 
  records,
  totalComms,
  activeDays,
  dayComms,
  nightComms,
  activeTab,
  setActiveTab
}) => {
  const topCountries = countries.slice(0, 3);
  const topCountriesText = topCountries.map(c => `${c.country} (${c.totalComms} comms)`).join(', ');
  const highRiskCount = countries.filter(c => c.riskLevel === 'HIGH').length;

  return (
    <div className="space-y-4">
      {/* Investigation Summary */}
      <div className="bg-[#121212] border border-[#2e2e2e] rounded-lg p-5">
        <h3 className="text-xs font-bold text-[#38bdf8] uppercase tracking-wider mb-3">
          Investigation Summary
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed font-sans">
          Target communicated with {records.length} international numbers across {countries.length} countries, with {totalComms} total interactions over {activeDays} active days. 
          {topCountries.length > 0 && ` Most activity was observed with: ${topCountriesText}. `}
          {highRiskCount} contacts are rated HIGH or CRITICAL risk. Day communications: {dayComms}; night communications: {nightComms}.
        </p>
      </div>

      {/* KPIs */}
      <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-black/20">
        <div className="flex-1 min-w-[120px]">
          <div className="text-3xl font-bold text-white mb-1">{records.length}</div>
          <div className="text-[10px] text-gray-400 font-medium tracking-wider">Intl Contacts</div>
        </div>
        <div className="flex-1 min-w-[120px]">
          <div className="text-3xl font-bold text-[#38bdf8] mb-1">{totalComms}</div>
          <div className="text-[10px] text-gray-400 font-medium tracking-wider">Communications</div>
        </div>
        <div className="flex-1 min-w-[120px]">
          <div className="text-3xl font-bold text-[#fbbf24] mb-1">{countries.length}</div>
          <div className="text-[10px] text-gray-400 font-medium tracking-wider">Countries</div>
        </div>
        <div className="flex-1 min-w-[120px]">
          <div className="text-3xl font-bold text-[#f87171] mb-1">{highRiskCount}</div>
          <div className="text-[10px] text-gray-400 font-medium tracking-wider">High / Critical Risk</div>
        </div>
        <div className="flex-1 min-w-[150px] border-l border-[#2e2e2e] pl-6 flex items-center gap-3">
          <Globe className="w-8 h-8 text-[#38bdf8]" />
          <div className="text-[11px] text-gray-300 font-medium leading-snug">
            Investigation-grade<br/>international module
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#2e2e2e] pb-0">
        {['Overview', 'Contacts', 'Timeline', 'Correlations', 'Link Graph', 'Alerts'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-[#38bdf8] text-white bg-[#121212]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#1c1c1c]/50'
            } rounded-t-md`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
};
