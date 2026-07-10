import React from 'react';
import { BookOpen } from 'lucide-react';

export const CommonReport: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col p-6 text-left bg-[#121212] animate-in fade-in duration-300">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-200">Common Report (Overlap Finder)</h2>
        <p className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-wider">
          Analyze overlapping contacts, shared locations, and IMEI swaps between multiple suspects
        </p>
      </div>

      <div className="flex-1 bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 flex items-center justify-center mx-auto">
            <BookOpen className="h-6 w-6 text-[#3ecf8e]" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Multi-target Cross Correlation</h3>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed font-mono">
              The common contact and location overlap detector workspace is configured. Interactive multi-case graph correlation panels will mount here in upcoming tasks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
