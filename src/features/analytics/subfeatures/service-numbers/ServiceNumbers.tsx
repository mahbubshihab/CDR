import React from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { useServiceAnalysis } from './hooks/useServiceAnalysis';
import { ServiceSummaryCards } from './components/ServiceSummaryCards';
import { ServiceChart } from './components/ServiceChart';
import { ServiceFilters } from './components/ServiceFilters';
import { ServiceTable } from './components/ServiceTable';

interface ServiceNumbersProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

export const ServiceNumbers: React.FC<ServiceNumbersProps> = ({ cdrFile, records }) => {
  const {
    summaryStats,
    chartData,
    tableData,
    searchTerm,
    setSearchTerm,
    activeCategory,
    setActiveCategory,
    dropdownCategory,
    setDropdownCategory
  } = useServiceAnalysis(records);

  return (
    <div className="w-full h-full bg-[#0a0a0a] overflow-y-auto p-4 md:p-6 space-y-4">
      {/* Summary Cards */}
      <ServiceSummaryCards stats={summaryStats} />

      {/* Chart Section */}
      <ServiceChart data={chartData} />

      {/* Table Section */}
      <div className="pt-2">
        <ServiceFilters 
          activeCategory={activeCategory} 
          setActiveCategory={setActiveCategory} 
        />
        
        <ServiceTable 
          data={tableData}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          dropdownCategory={dropdownCategory}
          setDropdownCategory={setDropdownCategory}
        />
      </div>
    </div>
  );
};
