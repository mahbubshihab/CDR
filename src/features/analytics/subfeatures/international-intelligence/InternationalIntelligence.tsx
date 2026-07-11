import React, { useState, useMemo } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { processInternationalData } from './types';
import { IntlSummaryCard } from './components/IntlSummaryCard';
import { IntlFilters } from './components/IntlFilters';
import { IntlCharts } from './components/IntlCharts';
import { CountryRiskRanking } from './components/CountryRiskRanking';
import { CountryClusters } from './components/CountryClusters';
import { CountryMapSummary } from './components/CountryMapSummary';

interface InternationalIntelligenceProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

export const InternationalIntelligence: React.FC<InternationalIntelligenceProps> = ({ cdrFile, records }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Process data once
  const { intlRecords, countries } = useMemo(() => {
    return processInternationalData(records);
  }, [records]);

  // Aggregate overall metrics
  const { totalComms, activeDays, dayComms, nightComms, dayDuration, nightDuration } = useMemo(() => {
    let tc = 0;
    let dc = 0;
    let nc = 0;
    let dd = 0;
    let nd = 0;
    const days = new Set<string>();

    intlRecords.forEach(r => {
      tc += r.totalComms;
      dc += r.dayComms;
      nc += r.nightComms;
      dd += r.dayDuration;
      nd += r.nightDuration;
      r.activeDays.forEach(d => days.add(d));
    });

    return {
      totalComms: tc,
      activeDays: days.size,
      dayComms: dc,
      nightComms: nc,
      dayDuration: dd,
      nightDuration: nd
    };
  }, [intlRecords]);

  // Filter countries for the bottom components (Ranking, Clusters, Map) if search is active
  // The search applies globally in the mock UI.
  // Actually I'll let the individual components handle their own search or filter it here.
  // The IntlFilters has a search bar. We'll pass search state to it, but maybe apply filter to countries list.
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    const q = searchQuery.toLowerCase();
    return countries.filter(c => 
      c.country.toLowerCase().includes(q) || 
      c.code.toLowerCase().includes(q) ||
      c.numbers.some(n => n.includes(q))
    );
  }, [countries, searchQuery]);

  return (
    <div className="w-full h-full overflow-y-auto p-6 space-y-6 custom-scrollbar text-left bg-[#0b1121] animate-in fade-in duration-300">
      
      {/* Top Summary & KPIs */}
      <IntlSummaryCard 
        countries={countries} 
        records={intlRecords} 
        totalComms={totalComms} 
        activeDays={activeDays} 
        dayComms={dayComms} 
        nightComms={nightComms} 
      />

      {/* Filters */}
      <IntlFilters 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
      />

      {/* Charts (pass unfiltered countries for global context, or filtered? The mock usually filters charts too) */}
      <IntlCharts 
        countries={filteredCountries}
        dayComms={dayComms}
        nightComms={nightComms}
        dayDuration={dayDuration}
        nightDuration={nightDuration}
      />

      {/* Detailed Data Views */}
      <CountryRiskRanking countries={filteredCountries} />
      
      <CountryClusters countries={filteredCountries} />

      <CountryMapSummary countries={filteredCountries} />
      
    </div>
  );
};
