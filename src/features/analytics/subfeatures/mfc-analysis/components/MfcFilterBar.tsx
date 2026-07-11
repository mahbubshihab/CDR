import React from 'react';
import { Filter } from 'lucide-react';

export interface MfcFilterState {
  incomingOnly: boolean;
  outgoingOnly: boolean;
  smsOnly: boolean;
  highFrequency: boolean;
  minMin: number;
  minDays: number;
}

interface MfcFilterBarProps {
  filters: MfcFilterState;
  onChange: (newFilters: MfcFilterState) => void;
  onExport: (format: 'pdf' | 'excel' | 'csv') => void;
}

export const MfcFilterBar: React.FC<MfcFilterBarProps> = ({ filters, onChange, onExport }) => {
  const handleCheck = (key: keyof MfcFilterState) => {
    onChange({ ...filters, [key]: !filters[key] });
  };

  const handleNumber = (key: keyof MfcFilterState, value: string) => {
    const parsed = parseInt(value, 10);
    onChange({ ...filters, [key]: isNaN(parsed) ? 0 : parsed });
  };

  const CheckboxItem = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-gray-300 hover:text-white transition-colors">
      <input 
        type="checkbox" 
        className="w-3.5 h-3.5 rounded border-[#3e3e3e] bg-[#121212] text-[#3ecf8e] focus:ring-[#3ecf8e]/50 focus:ring-offset-[#171717]"
        checked={checked}
        onChange={onChange}
      />
      {label}
    </label>
  );

  return (
    <div className="bg-[#171717] border border-[#2e2e2e] rounded-xl p-2 px-3 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
      <div className="flex flex-wrap items-center gap-4 lg:gap-6">
        <div className="flex items-center text-gray-400 border-r border-[#2e2e2e] pr-4">
          <Filter className="h-4 w-4" />
        </div>
        
        <div className="flex items-center gap-4">
          <CheckboxItem label="Incoming only" checked={filters.incomingOnly} onChange={() => handleCheck('incomingOnly')} />
          <CheckboxItem label="Outgoing only" checked={filters.outgoingOnly} onChange={() => handleCheck('outgoingOnly')} />
          <CheckboxItem label="SMS only" checked={filters.smsOnly} onChange={() => handleCheck('smsOnly')} />
          <CheckboxItem label="High frequency" checked={filters.highFrequency} onChange={() => handleCheck('highFrequency')} />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400">Min min</span>
            <input 
              type="number" 
              className="w-14 bg-[#121212] border border-[#2e2e2e] rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-[#3ecf8e]"
              value={filters.minMin.toString()}
              onChange={(e) => handleNumber('minMin', e.target.value)}
              min="0"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400">Min days</span>
            <input 
              type="number" 
              className="w-14 bg-[#121212] border border-[#2e2e2e] rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-[#3ecf8e]"
              value={filters.minDays.toString()}
              onChange={(e) => handleNumber('minDays', e.target.value)}
              min="0"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => onExport('pdf')} className="px-3 py-1 bg-[#121212] hover:bg-[#2e2e2e] border border-[#2e2e2e] rounded text-[11px] text-gray-300 hover:text-white transition-colors font-semibold">
          PDF
        </button>
        <button onClick={() => onExport('excel')} className="px-3 py-1 bg-[#121212] hover:bg-[#2e2e2e] border border-[#2e2e2e] rounded text-[11px] text-gray-300 hover:text-white transition-colors font-semibold">
          Excel
        </button>
        <button onClick={() => onExport('csv')} className="px-3 py-1 bg-[#121212] hover:bg-[#2e2e2e] border border-[#2e2e2e] rounded text-[11px] text-gray-300 hover:text-white transition-colors font-semibold">
          CSV
        </button>
      </div>
    </div>
  );
};
