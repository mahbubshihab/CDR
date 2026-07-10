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

  // Generate deterministic mock owner profile based on phone number hash
  const ownerProfile = useMemo(() => {
    if (!selectedNumber) return null;

    const hash = selectedNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const firstNames = ['Muhammad', 'Ahmed', 'Sajid', 'Tariq', 'Yasir', 'Imran', 'Kamran', 'Zubair', 'Bilal', 'Asif'];
    const lastNames = ['Khan', 'Ali', 'Iqbal', 'Mehmood', 'Raza', 'Shah', 'Hassan', 'Bhatt', 'Sheikh', 'Malik'];
    const cities = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Comilla', 'Mymensingh'];
    const addresses = ['Sector 4, Uttara', 'Road 11, Banani', 'Mirpur-10, Dhaka', 'Halishahar, Chittagong', 'Zindabazar, Sylhet', 'Upashahar, Rajshahi', 'Mujgunni, Khulna'];

    const name = `${firstNames[hash % firstNames.length]} ${lastNames[(hash + 3) % lastNames.length]}`;
    const cnic = `35201-${(hash * 13) % 10000000}-${hash % 10}`;
    const address = `${addresses[hash % addresses.length]}, ${cities[(hash + 2) % cities.length]}`;
    const activationDate = `${((hash % 28) + 1).toString().padStart(2, '0')}/${((hash % 12) + 1).toString().padStart(2, '0')}/202${hash % 6}`;

    return {
      number: selectedNumber,
      name,
      cnic,
      address,
      activationDate,
      status: hash % 7 === 0 ? 'Suspended' : 'Biometrically Verified',
      simSerial: `89921000${hash * 17921}F`
    };
  }, [selectedNumber]);

  return (
    <div className="w-full h-full overflow-y-auto p-6 space-y-6 custom-scrollbar text-left bg-[#121212] animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="border-b border-[#2e2e2e] pb-4">
        <h2 className="text-sm font-semibold text-gray-200">Ownership Intelligence Finder</h2>
        <p className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-wider">
          Simulated subscriber biometrics and CNIC verification database for contact numbers
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

        {/* Right Side: Biometric Owner Details Card (Col 7) */}
        <div className="lg:col-span-7 flex">
          {ownerProfile ? (
            <div className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-6 flex flex-col justify-between text-left">
              <div>
                <div className="flex justify-between items-start border-b border-[#2e2e2e] pb-4 mb-5">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200">{ownerProfile.name}</h3>
                    <span className="text-xs text-gray-500 font-mono block mt-0.5">{ownerProfile.number}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    ownerProfile.status.includes('Verified') 
                      ? 'bg-[#3ecf8e]/10 text-[#3ecf8e] border-[#3ecf8e]/20' 
                      : 'bg-red-950/20 text-red-400 border-red-800/20'
                  }`}>
                    {ownerProfile.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-mono">
                  <div className="space-y-1.5">
                    <span className="text-gray-500 text-[10px] uppercase tracking-wider block font-semibold">CNIC / NID Number</span>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Landmark className="h-4 w-4 text-gray-500 shrink-0" />
                      <strong>{ownerProfile.cnic}</strong>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-gray-500 text-[10px] uppercase tracking-wider block font-semibold">SIM Card Serial</span>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Smartphone className="h-4 w-4 text-gray-500 shrink-0" />
                      <strong>{ownerProfile.simSerial}</strong>
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <span className="text-gray-500 text-[10px] uppercase tracking-wider block font-semibold">Registered Billing Address</span>
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="h-4 w-4 text-gray-500 shrink-0" />
                      <strong className="font-sans font-medium text-gray-200">{ownerProfile.address}</strong>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-gray-500 text-[10px] uppercase tracking-wider block font-semibold">SIM Registration Date</span>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="h-4 w-4 text-gray-500 shrink-0" />
                      <strong>{ownerProfile.activationDate}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning/Security Alert */}
              <div className="mt-6 p-3 bg-amber-950/10 border border-amber-900/20 text-amber-500 rounded-lg flex gap-3 text-xs">
                <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-semibold block mb-0.5">National Security Registry Note:</strong>
                  This information corresponds to simulated subscriber records from biometric CNIC registers. Any unauthorized duplication or export of subscriber profiles is strictly regulated.
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl flex items-center justify-center text-center p-8">
              <div className="space-y-2 text-xs text-gray-500 font-mono">
                <UserCheck className="h-8 w-8 text-gray-600 mx-auto" />
                <p>Select a contact number from the directory to search registered biometric identity.</p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
