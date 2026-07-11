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
    <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-5 mb-6">
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-gray-300">Day / Night Time Range</h3>
        
        <div className="flex items-end gap-6">
          <div className="flex-1 flex gap-6">
            <div className="flex-1">
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-2">Day start</label>
              <div className="relative">
                <input 
                  type="time" 
                  value={dayStart}
                  onChange={(e) => setDayStart(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3ecf8e]" 
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-2">Day end</label>
              <div className="relative">
                <input 
                  type="time" 
                  value={dayEnd}
                  onChange={(e) => setDayEnd(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3ecf8e]" 
                />
              </div>
            </div>
            
            <div className="w-px bg-[#2e2e2e] mx-2"></div>
            
            <div className="flex-1">
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-2">Night start</label>
              <div className="relative">
                <input 
                  type="time" 
                  value={nightStart}
                  onChange={(e) => setNightStart(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3ecf8e]" 
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-2">Night end</label>
              <div className="relative">
                <input 
                  type="time" 
                  value={nightEnd}
                  onChange={(e) => setNightEnd(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3ecf8e]" 
                />
              </div>
            </div>
          </div>
          
          <div>
            <button 
              onClick={handleApply}
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-md px-6 py-2 text-sm font-semibold h-[38px] transition-colors whitespace-nowrap"
            >
              {buttonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
