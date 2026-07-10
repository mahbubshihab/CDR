import React from 'react';
import { Search } from 'lucide-react';
import { type Case } from '../../../../utils/db';

interface SearchCDRLogsProps {
  activeCase: Case;
}

export const SearchCDRLogs: React.FC<SearchCDRLogsProps> = ({ activeCase }) => {
  return (
    <div className="w-full h-full p-6 text-left bg-[#121212] animate-in fade-in duration-300">
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-200">Search CDR Logs</h2>
          <p className="text-xs text-gray-500 font-mono uppercase tracking-wider block mt-1">
            Filter and query Call Detail Records dynamically for case: {activeCase.title}
          </p>
        </div>
        
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl p-6 text-center max-w-md mx-auto space-y-3">
          <Search className="h-8 w-8 text-[#3ecf8e] mx-auto" />
          <h3 className="font-bold text-gray-300">Advanced Log Search</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            You can search dialer patterns, tower addresses, and durations. Upload a CDR sheet in the overview tab to begin searching case records.
          </p>
        </div>
      </div>
    </div>
  );
};
