import React from 'react';
import type { ImsiSwitchEvent } from '../hooks/useImsiAnalysis';

interface ImsiSwitchingEventsProps {
  events: ImsiSwitchEvent[];
}

export const ImsiSwitchingEvents: React.FC<ImsiSwitchingEventsProps> = ({ events }) => {
  if (events.length === 0) return null;

  return (
    <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 mt-6">
      <h3 className="text-sm font-semibold text-gray-200 mb-4">SIM switching events ({events.length})</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {events.map((evt, idx) => (
          <div key={idx} className="flex flex-col text-sm">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-orange-400">{evt.fromImsi}</span>
              <span className="text-gray-500">→</span>
              <span className="text-[#3ecf8e]">{evt.toImsi}</span>
            </div>
            <div className="text-gray-500 font-mono text-xs mt-1">
              {evt.timestamp}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
