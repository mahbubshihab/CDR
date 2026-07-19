import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { DateTimeInput } from '../../../../components/ui/DateTimeInput';

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
            <div className="w-24">
              <DateTimeInput 
                mode="time"
                value={dayStart}
                onChange={setDayStart}
                className="w-full" 
              />
            </div>
            <span className="text-gray-500 text-xs">to</span>
            <div className="w-24">
              <DateTimeInput 
                mode="time"
                value={dayEnd}
                onChange={setDayEnd}
                className="w-full" 
              />
            </div>
          </div>

          <div className="w-px h-4 bg-[#2e2e2e]"></div>
          
          {/* Night Range */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Night</span>
            <div className="w-24">
              <DateTimeInput 
                mode="time"
                value={nightStart}
                onChange={setNightStart}
                className="w-full" 
              />
            </div>
            <span className="text-gray-500 text-xs">to</span>
            <div className="w-24">
              <DateTimeInput 
                mode="time"
                value={nightEnd}
                onChange={setNightEnd}
                className="w-full" 
              />
            </div>
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
