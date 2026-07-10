import React from 'react';
import { Smartphone } from 'lucide-react';

export const ImeiInfo: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col p-6 text-left bg-[#121212] animate-in fade-in duration-300">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-200">IMEI Info Lookup</h2>
        <p className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-wider">
          Query device specifications, TAC details, and hardware status
        </p>
      </div>

      <div className="flex-1 bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 flex items-center justify-center mx-auto">
            <Smartphone className="h-6 w-6 text-[#3ecf8e]" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Device Hardware Database</h3>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed font-mono">
              The IMEI specifications lookup and blacklist reporting panel is configured. Hardware manufacturer directory features will mount here in upcoming tasks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
