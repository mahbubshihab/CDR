import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Clock, Calendar } from 'lucide-react';

interface DateTimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  initialValue?: string;
  mode: 'date' | 'time' | 'datetime';
}

export const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  initialValue = '',
  mode
}) => {
  // Date State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Time State
  const [hours, setHours] = useState('12');
  const [minutes, setMinutes] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [timeView, setTimeView] = useState<'hours' | 'minutes'>('hours');

  useEffect(() => {
    if (isOpen) {
      if (initialValue) {
        if (mode === 'date') {
          // Parse YYYY-MM-DD or DD/MM/YYYY
          if (initialValue.includes('-')) {
            const [y, m, d] = initialValue.split('-');
            const parsed = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            if (!isNaN(parsed.getTime())) {
              setSelectedDate(parsed);
              setCurrentDate(parsed);
            }
          } else if (initialValue.includes('/')) {
            const [d, m, y] = initialValue.split('/');
            const parsed = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            if (!isNaN(parsed.getTime())) {
              setSelectedDate(parsed);
              setCurrentDate(parsed);
            }
          }
        } else if (mode === 'time') {
          const [hStr, mStr] = initialValue.split(':');
          if (hStr && mStr) {
            let h = parseInt(hStr, 10);
            const isPM = h >= 12;
            setPeriod(isPM ? 'PM' : 'AM');
            
            h = h % 12;
            if (h === 0) h = 12;
            
            setHours(h.toString().padStart(2, '0'));
            setMinutes(mStr.padStart(2, '0'));
          }
        }
      } else {
        setSelectedDate(null);
        setHours('12');
        setMinutes('00');
        setPeriod('AM');
        setCurrentDate(new Date());
      }
    }
  }, [isOpen, initialValue, mode]);

  if (!isOpen) return null;

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(new Date(currentDate.getFullYear(), parseInt(e.target.value), 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(new Date(parseInt(e.target.value), currentDate.getMonth(), 1));
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  const handleApply = () => {
    if (mode === 'date') {
      if (selectedDate) {
        const yyyy = selectedDate.getFullYear();
        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(selectedDate.getDate()).padStart(2, '0');
        onSelect(`${yyyy}-${mm}-${dd}`);
      }
    } else if (mode === 'time') {
      let h = parseInt(hours, 10);
      if (period === 'PM' && h < 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      onSelect(`${h.toString().padStart(2, '0')}:${minutes}`);
    }
    onClose();
  };

  const handleClear = () => {
    onSelect('');
    onClose();
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() && 
           currentDate.getMonth() === selectedDate.getMonth() && 
           currentDate.getFullYear() === selectedDate.getFullYear();
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  
  // Generate array of years for the dropdown (e.g., from 1990 to currentYear + 10)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - 20 + i);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#121212] border border-[#2e2e2e] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2e2e2e] bg-[#1c1c1c]">
          <h3 className="text-gray-200 font-semibold text-sm flex items-center gap-2">
            {mode === 'time' ? <Clock className="w-4 h-4 text-[#3ecf8e]" /> : <Calendar className="w-4 h-4 text-[#3ecf8e]" />}
            {mode === 'date' ? 'Select Date' : 'Select Time'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-[#2e2e2e] rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          {mode === 'date' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#1c1c1c] rounded-lg p-2 border border-[#2e2e2e]">
                <button 
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-[#2e2e2e] rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-2">
                  <select 
                    value={currentDate.getMonth()} 
                    onChange={handleMonthChange}
                    className="bg-[#2e2e2e] text-gray-200 text-sm font-semibold rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e] cursor-pointer"
                  >
                    {months.map((m, i) => (
                      <option key={m} value={i}>{m}</option>
                    ))}
                  </select>
                  <select 
                    value={currentDate.getFullYear()} 
                    onChange={handleYearChange}
                    className="bg-[#2e2e2e] text-gray-200 text-sm font-semibold rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e] cursor-pointer"
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-[#2e2e2e] rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {weekDays.map(day => (
                  <div key={day} className="text-[10px] font-bold text-gray-500 py-1 uppercase">{day}</div>
                ))}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const selected = isSelected(day);
                  const today = isToday(day);
                  return (
                    <button
                      key={day}
                      onClick={() => handleDayClick(day)}
                      className={`
                        w-8 h-8 mx-auto flex items-center justify-center rounded-full text-xs font-medium transition-colors cursor-pointer
                        ${selected ? 'bg-[#3ecf8e] text-[#0a0a0a]' : 'hover:bg-[#2e2e2e] text-gray-300'}
                        ${!selected && today ? 'border border-[#3ecf8e]/50 text-[#3ecf8e]' : ''}
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {mode === 'time' && (
            <div className="py-6 flex flex-col items-center">
              {/* Digital Time Display (Toggle between Hours / Minutes) */}
              <div className="flex gap-2 items-center justify-center mb-6">
                <button 
                  onClick={() => setTimeView('hours')}
                  className={`text-4xl font-mono px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${timeView === 'hours' ? 'text-[#3ecf8e] bg-[#3ecf8e]/10' : 'text-gray-400 hover:text-gray-200 hover:bg-[#2e2e2e]'}`}
                >
                  {hours.padStart(2, '0')}
                </button>
                <span className="text-2xl font-bold text-gray-600 mb-1">:</span>
                <button 
                  onClick={() => setTimeView('minutes')}
                  className={`text-4xl font-mono px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${timeView === 'minutes' ? 'text-[#3ecf8e] bg-[#3ecf8e]/10' : 'text-gray-400 hover:text-gray-200 hover:bg-[#2e2e2e]'}`}
                >
                  {minutes.padStart(2, '0')}
                </button>
              </div>

              {/* Analog Clock Dial */}
              <div 
                className="relative bg-[#1c1c1c] border border-[#2e2e2e] rounded-full shadow-inner cursor-pointer"
                style={{ width: 240, height: 240 }}
                onMouseDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left - 120;
                  const y = e.clientY - rect.top - 120;
                  let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
                  if (angle < 0) angle += 360;

                  if (timeView === 'hours') {
                    let hour = Math.round(angle / 30);
                    if (hour === 0) hour = 12;
                    setHours(hour.toString().padStart(2, '0'));
                    // Small delay before switching to minutes so the user sees the selection
                    setTimeout(() => setTimeView('minutes'), 300);
                  } else {
                    let min = Math.round(angle / 6);
                    if (min === 60) min = 0;
                    setMinutes(min.toString().padStart(2, '0'));
                  }
                }}
              >
                {/* Center Dot */}
                <div 
                  className="absolute bg-[#3ecf8e] rounded-full z-20"
                  style={{ width: 8, height: 8, left: 116, top: 116 }}
                />

                {/* Hand */}
                <div 
                  className="absolute bg-[#3ecf8e] z-10 transition-transform duration-200 origin-bottom"
                  style={{
                    width: 2,
                    height: 90,
                    bottom: 120,
                    left: 119,
                    transform: `rotate(${timeView === 'hours' ? parseInt(hours) * 30 : parseInt(minutes) * 6}deg)`
                  }}
                >
                  {/* Circle at the end of the hand */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full border-[2px] border-[#3ecf8e] bg-transparent" />
                </div>

                {/* Numbers */}
                {(timeView === 'hours' ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]).map((val) => {
                  const angle = (val * (timeView === 'hours' ? 30 : 6) - 90) * (Math.PI / 180);
                  const x = 120 + 90 * Math.cos(angle);
                  const y = 120 + 90 * Math.sin(angle);
                  
                  // Check if this number is exactly selected
                  const isSelected = timeView === 'hours' 
                    ? parseInt(hours) === val || (parseInt(hours) === 12 && val === 0)
                    : parseInt(minutes) === val;

                  return (
                    <div
                      key={val}
                      className={`absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center text-sm font-medium rounded-full z-10 pointer-events-none transition-colors
                        ${isSelected ? 'text-[#0a0a0a]' : 'text-gray-300'}`}
                      style={{ left: x, top: y }}
                    >
                      {val === 0 && timeView === 'minutes' ? '00' : val}
                    </div>
                  );
                })}
              </div>

              {/* AM/PM Toggle */}
              <div className="flex bg-[#1c1c1c] rounded-lg border border-[#2e2e2e] p-1 mt-6">
                <button
                  className={`px-8 py-2 rounded-md text-sm font-bold transition-colors cursor-pointer ${period === 'AM' ? 'bg-[#3ecf8e] text-[#0a0a0a]' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setPeriod('AM')}
                >
                  AM
                </button>
                <button
                  className={`px-8 py-2 rounded-md text-sm font-bold transition-colors cursor-pointer ${period === 'PM' ? 'bg-[#3ecf8e] text-[#0a0a0a]' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setPeriod('PM')}
                >
                  PM
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2e2e2e] bg-[#1a1a1a] flex gap-3">
          <button 
            onClick={handleClear}
            className="flex-1 py-2 text-xs font-semibold text-gray-400 bg-transparent border border-gray-600 hover:text-white hover:border-gray-500 rounded-lg transition-colors"
          >
            Clear
          </button>
          <button 
            onClick={handleApply}
            className="flex-1 py-2 text-xs font-semibold text-[#0a0a0a] bg-[#3ecf8e] hover:bg-[#34b079] rounded-lg transition-colors shadow-lg shadow-[#3ecf8e]/10"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
