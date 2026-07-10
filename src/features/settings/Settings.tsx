import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col p-6 text-left bg-[#121212] animate-in fade-in duration-300">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-200">Settings</h2>
        <p className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-wider">
          Manage user profiles, configuration tokens, and visual layout settings
        </p>
      </div>

      <div className="flex-1 bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 flex items-center justify-center mx-auto">
            <SettingsIcon className="h-6 w-6 text-[#3ecf8e]" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">System Settings</h3>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed font-mono">
              Database reset options, user roles configuration, and visual theme tokens will mount here in upcoming tasks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
