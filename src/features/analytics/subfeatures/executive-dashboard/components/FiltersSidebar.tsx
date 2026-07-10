import React from 'react';
import { Search } from 'lucide-react';

interface FiltersSidebarProps {
  searchInput: string;
  setSearchInput: (v: string) => void;
  yearSel: string;
  setYearSel: (v: string) => void;
  monthSel: string;
  setMonthSel: (v: string) => void;
  hourSel: string;
  setHourSel: (v: string) => void;
  locationSel: string;
  setLocationSel: (v: string) => void;
  bPartySel: string;
  setBPartySel: (v: string) => void;
  imeiSel: string;
  setImeiSel: (v: string) => void;
  imsiSel: string;
  setImsiSel: (v: string) => void;
  callTypeSel: string;
  setCallTypeSel: (v: string) => void;
  bPartyTypeSel: string;
  setBPartyTypeSel: (v: string) => void;
  countrySel: string;
  setCountrySel: (v: string) => void;
  operatorSel: string;
  setOperatorSel: (v: string) => void;
  filterOptions: {
    years: string[];
    locations: string[];
    bParties: string[];
    imeis: string[];
    imsis: string[];
    operators: string[];
    countries: string[];
  };
  onApply: () => void;
  onClear: () => void;
}

export const FiltersSidebar: React.FC<FiltersSidebarProps> = ({
  searchInput, setSearchInput,
  yearSel, setYearSel,
  monthSel, setMonthSel,
  hourSel, setHourSel,
  locationSel, setLocationSel,
  bPartySel, setBPartySel,
  imeiSel, setImeiSel,
  imsiSel, setImsiSel,
  callTypeSel, setCallTypeSel,
  bPartyTypeSel, setBPartyTypeSel,
  countrySel, setCountrySel,
  operatorSel, setOperatorSel,
  filterOptions,
  onApply, onClear
}) => {
  const hours = ['All', ...Array.from({ length: 24 }, (_, i) => String(i))];

  return (
    <aside className="w-full lg:w-60 shrink-0 bg-[#171717] border-r border-[#2e2e2e] p-4 flex flex-col gap-4.5 h-full overflow-y-auto custom-scrollbar overscroll-contain text-left">
      {/* Apply / Clear Actions */}
      <div className="flex items-center gap-2.5">
        <button 
          onClick={onApply}
          className="flex-1 py-2 bg-[#046a38] text-white font-medium border border-[#3ecf8e] hover:bg-[#00522c] rounded-lg text-xs text-center cursor-pointer transition-colors shadow-md font-sans"
        >
          Apply
        </button>
        <button 
          onClick={onClear}
          className="px-4 py-2 bg-transparent border border-[#2e2e2e] hover:border-[#3ecf8e]/35 text-gray-400 hover:text-gray-250 rounded-lg text-xs font-semibold cursor-pointer transition-all font-sans"
        >
          Clear
        </button>
      </div>

      {/* Text search input */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-[#3ecf8e] font-semibold uppercase tracking-wider font-mono">
          Search Number / IMEI
        </label>
        <div className="relative">
          <input 
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search number or IMEI..."
            className="w-full bg-[#121212] border border-[#2e2e2e] rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-250 placeholder-gray-600 focus:outline-none focus:border-[#3ecf8e] font-mono"
          />
          <Search className="h-3.5 w-3.5 text-gray-500 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Dynamic filters list */}
      <div className="space-y-4 font-mono text-xs">
        
        {/* YEAR FILTER */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-[#3ecf8e] font-semibold tracking-wider block">YEAR</span>
          <div className="space-y-0.5">
            {['All', ...filterOptions.years].map(yr => (
              <button
                key={yr}
                onClick={() => setYearSel(yr)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  yearSel === yr ? 'bg-[#2e2e2e] text-white font-semibold' : 'text-gray-400 hover:bg-[#1e1e1e]/60 hover:text-gray-200'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        {/* MONTH FILTER */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-[#3ecf8e] font-semibold tracking-wider block">MONTH</span>
          <div className="space-y-0.5 max-h-36 overflow-y-auto custom-scrollbar">
            {['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
              <button
                key={m}
                onClick={() => setMonthSel(m)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  monthSel === m ? 'bg-[#2e2e2e] text-white font-semibold' : 'text-gray-400 hover:bg-[#1e1e1e]/60 hover:text-gray-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* HOUR FILTER */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-[#3ecf8e] font-semibold tracking-wider block">HOUR</span>
          <div className="space-y-0.5 max-h-36 overflow-y-auto custom-scrollbar">
            {hours.map(hr => (
              <button
                key={hr}
                onClick={() => setHourSel(hr)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  hourSel === hr ? 'bg-[#2e2e2e] text-white font-semibold' : 'text-gray-400 hover:bg-[#1e1e1e]/60 hover:text-gray-200'
                }`}
              >
                {hr === 'All' ? 'All Hours' : `${hr.padStart(2, '0')}:00`}
              </button>
            ))}
          </div>
        </div>

        {/* LOCATION FILTER */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-[#3ecf8e] font-semibold tracking-wider block">LOCATION</span>
          <div className="space-y-0.5 max-h-40 overflow-y-auto custom-scrollbar">
            {['All', ...filterOptions.locations].map(loc => (
              <button
                key={loc}
                onClick={() => setLocationSel(loc)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all truncate cursor-pointer ${
                  locationSel === loc ? 'bg-[#2e2e2e] text-white font-semibold' : 'text-gray-400 hover:bg-[#1e1e1e]/60 hover:text-gray-200'
                }`}
                title={loc}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* B PARTY FILTER */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-[#3ecf8e] font-semibold tracking-wider block">B PARTY</span>
          <div className="space-y-0.5 max-h-40 overflow-y-auto custom-scrollbar">
            {['All', ...filterOptions.bParties].map(no => (
              <button
                key={no}
                onClick={() => setBPartySel(no)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  bPartySel === no ? 'bg-[#2e2e2e] text-white font-semibold' : 'text-gray-400 hover:bg-[#1e1e1e]/60 hover:text-gray-200'
                }`}
              >
                {no}
              </button>
            ))}
          </div>
        </div>

        {/* IMEI FILTER */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-[#3ecf8e] font-semibold tracking-wider block">IMEI</span>
          <div className="space-y-0.5 max-h-36 overflow-y-auto custom-scrollbar">
            {['All', ...filterOptions.imeis].map(imei => (
              <button
                key={imei}
                onClick={() => setImeiSel(imei)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all truncate cursor-pointer ${
                  imeiSel === imei ? 'bg-[#2e2e2e] text-white font-semibold' : 'text-gray-400 hover:bg-[#1e1e1e]/60 hover:text-gray-200'
                }`}
              >
                {imei}
              </button>
            ))}
          </div>
        </div>

        {/* IMSI FILTER */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-[#3ecf8e] font-semibold tracking-wider block">IMSI</span>
          <div className="space-y-0.5 max-h-36 overflow-y-auto custom-scrollbar">
            {['All', ...filterOptions.imsis].map(imsi => (
              <button
                key={imsi}
                onClick={() => setImsiSel(imsi)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all truncate cursor-pointer ${
                  imsiSel === imsi ? 'bg-[#2e2e2e] text-white font-semibold' : 'text-gray-400 hover:bg-[#1e1e1e]/60 hover:text-gray-200'
                }`}
              >
                {imsi}
              </button>
            ))}
          </div>
        </div>

        {/* CALL TYPE FILTER */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-[#3ecf8e] font-semibold tracking-wider block">CALL TYPE</span>
          <div className="space-y-0.5">
            {['All', 'Incoming Call', 'Outgoing Call', 'SMS - Incoming', 'SMS - Outgoing'].map(t => (
              <button
                key={t}
                onClick={() => setCallTypeSel(t)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  callTypeSel === t ? 'bg-[#2e2e2e] text-white font-semibold' : 'text-gray-400 hover:bg-[#1e1e1e]/60 hover:text-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* B PARTY TYPE FILTER */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-[#3ecf8e] font-semibold tracking-wider block">B PARTY TYPE</span>
          <div className="space-y-0.5">
            {['All', 'Domestic', 'International', 'Short Code', 'Brand Masking'].map(bt => (
              <button
                key={bt}
                onClick={() => setBPartyTypeSel(bt)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  bPartyTypeSel === bt ? 'bg-[#2e2e2e] text-white font-semibold' : 'text-gray-400 hover:bg-[#1e1e1e]/60 hover:text-gray-200'
                }`}
              >
                {bt}
              </button>
            ))}
          </div>
        </div>

        {/* COUNTRY FILTER */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-[#3ecf8e] font-semibold tracking-wider block">COUNTRY</span>
          <div className="space-y-0.5 max-h-36 overflow-y-auto custom-scrollbar">
            {['All', ...filterOptions.countries].map(c => (
              <button
                key={c}
                onClick={() => setCountrySel(c)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  countrySel === c ? 'bg-[#2e2e2e] text-white font-semibold' : 'text-gray-400 hover:bg-[#1e1e1e]/60 hover:text-gray-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* NETWORK OPERATOR FILTER */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-[#3ecf8e] font-semibold tracking-wider block">OPERATOR</span>
          <div className="space-y-0.5">
            {['All', ...filterOptions.operators].map(op => (
              <button
                key={op}
                onClick={() => setOperatorSel(op)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  operatorSel === op ? 'bg-[#2e2e2e] text-white font-semibold' : 'text-gray-400 hover:bg-[#1e1e1e]/60 hover:text-gray-200'
                }`}
              >
                {op}
              </button>
            ))}
          </div>
        </div>

      </div>
    </aside>
  );
};
