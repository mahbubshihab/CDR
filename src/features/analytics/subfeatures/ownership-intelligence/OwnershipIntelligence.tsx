import React, { useState, useMemo } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { Search, UserCheck, ShieldAlert, BadgeCheck, MapPin, Calendar, Smartphone, Landmark } from 'lucide-react';

interface OwnershipIntelligenceProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

export const OwnershipIntelligence: React.FC<OwnershipIntelligenceProps> = ({ cdrFile, records }) => {
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Group contacts
  const contacts = useMemo(() => {
    const map: { 
      [num: string]: { 
        number: string; 
        count: number; 
        operator: string;
        firstTime: string;
        lastTime: string;
      } 
    } = {};

    records.forEach(r => {
      if (!r.otherParty) return;
      const num = r.otherParty;
      if (!map[num]) {
        map[num] = {
          number: num,
          count: 0,
          operator: r.provider || 'Unknown',
          firstTime: '',
          lastTime: ''
        };
      }

      map[num].count++;

      // Timestamp range formatting
      const timeStr = String(r.timestamp);
      let dateStr = timeStr;
      if (timeStr.length === 14) {
        const y = timeStr.substring(0, 4);
        const m = timeStr.substring(4, 6);
        const d = timeStr.substring(6, 8);
        dateStr = `${d}/${m}/${y}`;
      } else {
        try {
          const d = new Date(r.timestamp);
          if (!isNaN(d.getTime())) {
            dateStr = d.toLocaleDateString();
          }
        } catch (_) {}
      }

      if (!map[num].firstTime) map[num].firstTime = dateStr;
      map[num].lastTime = dateStr;
    });

    const list = Object.values(map).sort((a, b) => b.count - a.count);
    
    // Auto-select first number
    if (list.length > 0 && !selectedNumber) {
      setSelectedNumber(list[0].number);
    }

    return list;
  }, [records, selectedNumber]);

  // Filter contacts by search query
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => 
      c.number.includes(searchQuery) || c.operator.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contacts, searchQuery]);

  // Retrieve dynamic attributes derived purely from records
  const ownerProfile = useMemo(() => {
    if (!selectedNumber) return null;

    const contactRecords = records.filter(r => r.otherParty === selectedNumber);
    const times = contactRecords.map(r => Number(r.timestamp)).filter(t => !isNaN(t));
    
    let firstTime = '—';
    let lastTime = '—';
    if (times.length > 0) {
      firstTime = new Date(Math.min(...times)).toLocaleDateString();
      lastTime = new Date(Math.max(...times)).toLocaleDateString();
    }

    const uniqueImeis = Array.from(new Set(contactRecords.map(r => r.imei).filter(Boolean)));
    const uniqueImsis = Array.from(new Set(contactRecords.map(r => r.imsi).filter(Boolean)));
    const uniqueLocations = Array.from(new Set(contactRecords.map(r => r.address).filter(Boolean)));

    return {
      number: selectedNumber,
      firstTime,
      lastTime,
      totalInteractions: contactRecords.length,
      imei: uniqueImeis.join(', ') || '—',
      imsi: uniqueImsis.join(', ') || '—',
      locations: uniqueLocations.join(', ') || '—'
    };
  }, [selectedNumber, records]);

  return (
    <div className="w-full h-full overflow-y-auto p-6 space-y-6 custom-scrollbar text-left bg-[#121212] animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="border-b border-[#2e2e2e] pb-4">
        <h2 className="text-sm font-semibold text-gray-200">Ownership Intelligence Finder</h2>
        <p className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-wider">
          Carrier and contact profile analytics extracted directly from uploaded CDR files
        </p>
      </div>

      {/* Split Pane View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[480px] items-stretch">
        
        {/* Left Side: Contact List (Col 5) */}
        <div className="lg:col-span-5 bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#2e2e2e] bg-[#1a1a1a]/30 flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Top Contacts Directory</h3>
            <div className="flex items-center bg-[#121212] border border-[#2e2e2e] rounded-lg px-2.5 py-1.5 focus-within:border-[#3ecf8e]/50 transition-colors">
              <Search className="h-4 w-4 text-gray-500 mr-2 shrink-0" />
              <input 
                type="text" 
                placeholder="Search phone number or operator..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-gray-250 focus:outline-none placeholder-gray-600 font-mono"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[420px] divide-y divide-[#2e2e2e]/40 custom-scrollbar">
            {filteredContacts.length > 0 ? (
              filteredContacts.map((c, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedNumber(c.number)}
                  className={`w-full p-3 flex justify-between items-center text-left transition-colors cursor-pointer ${
                    selectedNumber === c.number ? 'bg-[#2e2e2e]/55' : 'hover:bg-[#171717]/35'
                  }`}
                >
                  <div className="font-mono text-xs space-y-0.5">
                    <span className={`block font-bold transition-colors ${selectedNumber === c.number ? 'text-[#3ecf8e]' : 'text-gray-200'}`}>
                      {c.number}
                    </span>
                    <span className="text-[10px] text-gray-500 block">{c.operator}</span>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span className="font-bold text-gray-300">{c.count}</span>
                    <span className="text-[10px] text-gray-500 block">interactions</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 text-xs">
                No matching phone targets found.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Identity Details Card (Col 7) */}
        <div className="lg:col-span-7 flex">
          {ownerProfile ? (
            <div className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-6 flex flex-col justify-between text-left">
              <div>
                <div className="flex justify-between items-start border-b border-[#2e2e2e] pb-4 mb-5">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200">Contact Number Profile</h3>
                    <span className="text-xs text-gray-500 font-mono block mt-0.5">{ownerProfile.number}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-red-950/20 text-red-400 border-red-800/20">
                    Biometric Lookup Unavailable
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-5 text-xs font-mono">
                  <div className="space-y-1.5">
                    <span className="text-gray-500 text-[10px] uppercase tracking-wider block font-semibold">Total Interactions</span>
                    <div className="flex items-center gap-2 text-gray-300">
                      <strong>{ownerProfile.totalInteractions} logs found in dataset</strong>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-gray-500 text-[10px] uppercase tracking-wider block font-semibold">First / Last Call Activity</span>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="h-4 w-4 text-gray-500 shrink-0" />
                      <strong>{ownerProfile.firstTime} — {ownerProfile.lastTime}</strong>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-gray-500 text-[10px] uppercase tracking-wider block font-semibold">Associated IMEI Handsets</span>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Smartphone className="h-4 w-4 text-gray-500 shrink-0" />
                      <strong className="break-all">{ownerProfile.imei}</strong>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-gray-500 text-[10px] uppercase tracking-wider block font-semibold">Associated IMSI SIMs</span>
                    <div className="flex items-center gap-2 text-gray-300">
                      <strong>{ownerProfile.imsi}</strong>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-gray-500 text-[10px] uppercase tracking-wider block font-semibold">Resolved Locations / Towers</span>
                    <div className="flex items-center gap-2 text-gray-350 font-sans font-medium">
                      <MapPin className="h-4 w-4 text-gray-500 shrink-0" />
                      <strong>{ownerProfile.locations}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning/Security Alert */}
              <div className="mt-6 p-3 bg-amber-950/10 border border-amber-900/20 text-amber-500 rounded-lg flex gap-3 text-xs">
                <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-semibold block mb-0.5">Biometric Database Missing:</strong>
                  CNIC registration registry records (Subscriber Name, CNIC, and Billing Address) are not stored in standard CDR Excel spreadsheets. To view biometric records, upload the corresponding carrier register files.
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl flex items-center justify-center text-center p-8">
              <div className="space-y-2 text-xs text-gray-500 font-mono">
                <UserCheck className="h-8 w-8 text-gray-600 mx-auto" />
                <p>Select a contact number from the directory to inspect its activity profile.</p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
