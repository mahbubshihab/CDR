import React, { useState } from 'react';
import { Smartphone, Cpu } from 'lucide-react';
import { type Case, type CDRFile } from '../../../../utils/db';
import { useCaseData } from '../../hooks/useCaseData';
import { ImeiSummary } from '../../../analytics/subfeatures/imei-summary/ImeiSummary';
import { ImsiSummary } from '../../../analytics/subfeatures/imsi-summary/ImsiSummary';

interface ImeiImsiSummaryProps {
  activeCase: Case;
}

export const ImeiImsiSummary: React.FC<ImeiImsiSummaryProps> = ({ activeCase }) => {
  const { records, loading } = useCaseData(activeCase.id);
  const [activeTab, setActiveTab] = useState<'imei' | 'imsi'>('imei');

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#121212]">
        <div className="text-gray-400 font-mono text-sm animate-pulse">Analyzing Case Devices...</div>
      </div>
    );
  }

  // Create a dummy CDRFile object to satisfy the props of ImeiSummary/ImsiSummary
  // This allows us to reuse the existing single-file components for a case-wide view
  const dummyFile = {
    id: 0,
    caseId: activeCase.id!,
    phoneNumber: 'All Targets (Case Level)',
    operator: 'Multiple',
    fileName: 'Combined Analysis',
    uploadDate: Date.now(),
    status: 'Completed',
    category: 'Multiple',
    ownerName: 'Multiple',
    description: '',
    notes: '',
    recordsCount: records.length
  } as CDRFile;

  return (
    <div className="w-full h-full overflow-hidden flex flex-col bg-[#121212] animate-in fade-in duration-300 text-left">
      <div className="p-6 pb-0 border-b border-[#2e2e2e]">
        <div>
          <h2 className="text-sm font-semibold text-gray-200">Global IMEI / IMSI Intelligence</h2>
          <p className="text-xs text-gray-500 font-mono uppercase tracking-wider block mt-1">
            Analyze device and SIM card usage across all {records.length} records in {activeCase.title}
          </p>
        </div>

        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={() => setActiveTab('imei')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'imei' ? 'border-[#3ecf8e] text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            IMEI Analysis
          </button>
          <button
            onClick={() => setActiveTab('imsi')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'imsi' ? 'border-[#3ecf8e] text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Cpu className="h-4 w-4" />
            IMSI Analysis
          </button>
        </div>
      </div>
      
      <div className="flex-1 relative overflow-hidden">
        {activeTab === 'imei' ? (
          <ImeiSummary cdrFile={dummyFile} records={records} />
        ) : (
          <ImsiSummary cdrFile={dummyFile} records={records} />
        )}
      </div>
    </div>
  );
};
