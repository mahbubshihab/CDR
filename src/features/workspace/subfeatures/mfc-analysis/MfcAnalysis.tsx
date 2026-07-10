import React from 'react';
import { Database } from 'lucide-react';
import { type CDRFile } from '../../../../utils/db';

interface MfcAnalysisProps {
  cdrFile: CDRFile;
}

export const MfcAnalysis: React.FC<MfcAnalysisProps> = ({ cdrFile }) => {
  return (
    <div className="w-full h-full p-6 flex items-center justify-center bg-[#121212]">
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl p-8 text-center max-w-md mx-auto space-y-3.5">
        <Database className="h-8 w-8 text-[#3ecf8e] mx-auto" />
        <h3 className="font-bold text-gray-300">MFC / IMF Analysis</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          The MFC / IMF Analysis workspace for phone target <strong className="text-[#3ecf8e] font-mono">{cdrFile.phoneNumber}</strong> is configured. Detail views will activate in upcoming steps.
        </p>
      </div>
    </div>
  );
};
