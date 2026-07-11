import React, { useState } from 'react';
import { Clock } from 'lucide-react';

interface TimeRangeFilterProps {
  onApply: (ranges: {
    dayStart: string;
    dayEnd: string;
    nightStart: string;
    nightEnd: string;
  }) => void;
  buttonLabel?: string;
}

export const TimeRangeFilter: React.FC<TimeRangeFilterProps> = ({ 
  onApply, 
  buttonLabel = "Apply Time Range" 
}) => {
  const [dayStart, setDayStart] = useState('06:00');
  const [dayEnd, setDayEnd] = useState('17:59');
  const [nightStart, setNightStart] = useState('18:00');
  const [nightEnd, setNightEnd] = useState('05:59');

  const handleApply = () => {
    onApply({ dayStart, dayEnd, nightStart, nightEnd });
  };

  return (
    <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-3 mb-4 shrink-0">
      <div className="flex items-center gap-4">
        <h3 className="text-sm font-semibold text-gray-300 whitespace-nowrap">Day / Night Range</h3>
        <div className="w-px h-6 bg-[#2e2e2e]"></div>
        
        <div className="flex-1 flex items-center gap-4">
          {/* Day Range */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Day</span>
            <input 
              type="time" 
              value={dayStart}
              onChange={(e) => setDayStart(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="bg-[#1e1e1e] border border-[#2e2e2e] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#3ecf8e]" 
            />
            <span className="text-gray-500 text-xs">to</span>
            <input 
              type="time" 
              value={dayEnd}
              onChange={(e) => setDayEnd(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="bg-[#1e1e1e] border border-[#2e2e2e] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#3ecf8e]" 
            />
          </div>

          <div className="w-px h-4 bg-[#2e2e2e]"></div>
          
          {/* Night Range */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Night</span>
            <input 
              type="time" 
              value={nightStart}
              onChange={(e) => setNightStart(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="bg-[#1e1e1e] border border-[#2e2e2e] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#3ecf8e]" 
            />
            <span className="text-gray-500 text-xs">to</span>
            <input 
              type="time" 
              value={nightEnd}
              onChange={(e) => setNightEnd(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="bg-[#1e1e1e] border border-[#2e2e2e] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#3ecf8e]" 
            />
          </div>
        </div>

        <button 
          onClick={handleApply}
          className="px-4 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-semibold rounded transition-colors whitespace-nowrap"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
};
