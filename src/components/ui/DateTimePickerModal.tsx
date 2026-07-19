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
            <div className="py-6 flex flex-col items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Hours</label>
                  <input 
                    type="number"
                    min="1"
                    max="12"
                    value={hours}
                    onChange={(e) => {
                      let val = parseInt(e.target.value);
                      if (isNaN(val)) val = 12;
                      if (val > 12) val = 12;
                      if (val < 1) val = 1;
                      setHours(val.toString().padStart(2, '0'));
                    }}
                    className="w-20 h-16 bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl text-3xl font-mono text-center text-gray-200 focus:outline-none focus:border-[#3ecf8e] transition-colors"
                  />
                </div>
                <span className="text-2xl font-bold text-gray-600 mt-5">:</span>
                <div className="flex flex-col items-center gap-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Minutes</label>
                  <input 
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => {
                      let val = parseInt(e.target.value);
                      if (isNaN(val)) val = 0;
                      if (val > 59) val = 59;
                      if (val < 0) val = 0;
                      setMinutes(val.toString().padStart(2, '0'));
                    }}
                    className="w-20 h-16 bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl text-3xl font-mono text-center text-gray-200 focus:outline-none focus:border-[#3ecf8e] transition-colors"
                  />
                </div>
              </div>
              <div className="flex bg-[#1c1c1c] rounded-lg border border-[#2e2e2e] p-1">
                <button
                  className={`px-6 py-1.5 rounded-md text-sm font-semibold transition-colors cursor-pointer ${period === 'AM' ? 'bg-[#3ecf8e] text-[#0a0a0a]' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setPeriod('AM')}
                >
                  AM
                </button>
                <button
                  className={`px-6 py-1.5 rounded-md text-sm font-semibold transition-colors cursor-pointer ${period === 'PM' ? 'bg-[#3ecf8e] text-[#0a0a0a]' : 'text-gray-400 hover:text-white'}`}
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
