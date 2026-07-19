import React, { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { DateTimePickerModal } from './DateTimePickerModal';

interface DateTimeInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  mode: 'date' | 'time';
  className?: string;
}

export const DateTimeInput: React.FC<DateTimeInputProps> = ({
  value,
  onChange,
  placeholder,
  mode,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className={`relative cursor-pointer group ${className}`}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {mode === 'date' ? (
            <Calendar className="h-4 w-4 text-gray-500 group-hover:text-[#3ecf8e] transition-colors" />
          ) : (
            <Clock className="h-4 w-4 text-gray-500 group-hover:text-[#3ecf8e] transition-colors" />
          )}
        </div>
        <input
          type="text"
          readOnly
          value={value}
          placeholder={placeholder || (mode === 'date' ? 'YYYY-MM-DD' : 'HH:MM')}
          className="w-full bg-[#1c1c1c] border border-[#2e2e2e] text-gray-200 placeholder-gray-600 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-[#3ecf8e] transition-colors cursor-pointer text-xs md:text-sm"
        />
      </div>

      <DateTimePickerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialValue={value}
        onSelect={onChange}
        mode={mode}
      />
    </>
  );
};
