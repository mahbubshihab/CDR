import React, { useState, useMemo } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { processInternationalData, isInternationalNumber } from './types';
import { IntlSummaryCard } from './components/IntlSummaryCard';
import { IntlFilters } from './components/IntlFilters';
import type { IntlFiltersState } from './components/IntlFilters';
import { IntlCharts } from './components/IntlCharts';
import { CountryRiskRanking } from './components/CountryRiskRanking';
import { CountryClusters } from './components/CountryClusters';
import { CountryMapSummary } from './components/CountryMapSummary';
import { IntlContactsView } from './components/IntlContactsView';
import { IntlAlertsView } from './components/IntlAlertsView';
import { IntlTimelineView } from './components/IntlTimelineView';

interface InternationalIntelligenceProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

export const InternationalIntelligence: React.FC<InternationalIntelligenceProps> = ({ cdrFile, records }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<IntlFiltersState>({
    country: 'ALL',
    riskLevel: 'ALL',
    usageType: 'ALL',
    direction: 'ALL'
  });

  // 1. First Pass: Filter raw records based on basic Usage Type and Direction before aggregating
  const preFilteredRecords = useMemo(() => {
    return records.filter(r => {
      if (!r.otherParty || !isInternationalNumber(r.otherParty)) return false;

      const type = (r.usageType || '').toLowerCase();
      
      // Usage Type filter
      if (filters.usageType === 'VOICE' && type.includes('sms')) return false;
      if (filters.usageType === 'SMS' && !type.includes('sms')) return false;

      // Direction filter
      const isIncoming = type.includes('mtc') || type.includes('incoming') || type.includes('sms-mt') || type === 'smsmt';
      const isOutgoing = type.includes('moc') || type.includes('outgoing') || type.includes('sms-mo') || type === 'smsmo' || type === 'voice';

      if (filters.direction === 'INCOMING' && !isIncoming) return false;
      if (filters.direction === 'OUTGOING' && !isOutgoing) return false;

      return true;
    });
  }, [records, filters.usageType, filters.direction]);

  // 2. Process data based on pre-filtered records
  const { intlRecords, countries } = useMemo(() => {
    return processInternationalData(preFilteredRecords);
  }, [preFilteredRecords]);

  // 3. Aggregate overall metrics for the Summary Card
  const { totalComms, activeDays, dayComms, nightComms, dayDuration, nightDuration } = useMemo(() => {
    let tc = 0; let dc = 0; let nc = 0; let dd = 0; let nd = 0;
    const days = new Set<string>();
    intlRecords.forEach(r => {
      tc += r.totalComms; dc += r.dayComms; nc += r.nightComms; dd += r.dayDuration; nd += r.nightDuration;
      r.activeDays.forEach(d => days.add(d));
    });
    return {
      totalComms: tc, activeDays: days.size, dayComms: dc, nightComms: nc, dayDuration: dd, nightDuration: nd
    };
  }, [intlRecords]);

  // 4. Second Pass: Filter aggregated countries and contacts based on Search, Country, and Risk
  const filteredCountries = useMemo(() => {
    return countries.filter(c => {
      if (filters.country !== 'ALL' && c.country !== filters.country) return false;
      if (filters.riskLevel !== 'ALL' && c.riskLevel !== filters.riskLevel) return false;
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesQ = c.country.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.numbers.some(n => n.includes(q));
        if (!matchesQ) return false;
      }
      return true;
    });
  }, [countries, filters.country, filters.riskLevel, searchQuery]);

  // For the contacts view specifically, we filter the raw intlRecords
  const filteredContacts = useMemo(() => {
    return intlRecords.filter(r => {
      if (filters.country !== 'ALL' && r.country !== filters.country) return false;
      // We don't have riskLevel on individual record, but we could filter by something else. 
      // For now, if RiskLevel is set, we only show contacts from countries matching that risk level.
      if (filters.riskLevel !== 'ALL') {
        const cAgg = countries.find(c => c.country === r.country);
        if (!cAgg || cAgg.riskLevel !== filters.riskLevel) return false;
      }
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesQ = r.country.toLowerCase().includes(q) || r.number.includes(q);
        if (!matchesQ) return false;
      }
      return true;
    });
  }, [intlRecords, countries, filters.country, filters.riskLevel, searchQuery]);

  return (
    <div className="w-full h-full overflow-y-auto p-6 space-y-6 custom-scrollbar text-left bg-[#0b1121] animate-in fade-in duration-300">
      
      {/* Top Summary & KPIs */}
      <IntlSummaryCard 
        countries={countries} // pass all raw aggregated for summary stats
        records={intlRecords} 
        totalComms={totalComms} 
        activeDays={activeDays} 
        dayComms={dayComms} 
        nightComms={nightComms}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Filters */}
      <IntlFilters 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        filters={filters}
        setFilters={setFilters}
        availableCountries={countries} // The dropdown shows all available countries from base data
      />

      {/* Dynamic Tab Content */}
      {activeTab === 'Overview' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
          <IntlCharts 
            countries={filteredCountries}
            dayComms={dayComms}
            nightComms={nightComms}
            dayDuration={dayDuration}
            nightDuration={nightDuration}
          />
          <CountryRiskRanking countries={filteredCountries} />
          <CountryClusters countries={filteredCountries} />
          <CountryMapSummary countries={filteredCountries} />
        </div>
      )}

      {activeTab === 'Contacts' && (
        <IntlContactsView records={filteredContacts} />
      )}

      {activeTab === 'Timeline' && (
        <IntlTimelineView records={preFilteredRecords} />
      )}

      {activeTab === 'Alerts' && (
        <IntlAlertsView countries={filteredCountries} />
      )}

      {(activeTab === 'Correlations' || activeTab === 'Link Graph') && (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-12 text-center text-gray-500 mt-6 animate-in fade-in duration-300">
          <div className="text-4xl mb-4">🚧</div>
          <h3 className="text-lg font-bold text-gray-300 mb-2">{activeTab} Interface</h3>
          <p>This module is currently being provisioned. Data structures are ready, but visual layout is pending.</p>
        </div>
      )}

    </div>
  );
};
