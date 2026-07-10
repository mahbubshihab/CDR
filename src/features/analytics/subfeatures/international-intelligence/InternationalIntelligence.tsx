import React, { useMemo } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { Globe, Phone, MessageSquare, Clock } from 'lucide-react';

interface InternationalIntelligenceProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

export const InternationalIntelligence: React.FC<InternationalIntelligenceProps> = ({ cdrFile, records }) => {
  // Aggregate international contact stats
  const internationalStats = useMemo(() => {
    const list: { 
      number: string; 
      country: string; 
      flag: string;
      voiceCount: number; 
      smsCount: number; 
      total: number;
      duration: number;
    }[] = [];

    records.forEach(r => {
      if (!r.otherParty) return;
      let num = r.otherParty.replace('+', '');
      if (num.startsWith('0')) num = num.substring(1);

      // Check if international (local is starting with 880 or 1)
      let isInternational = false;
      let country = 'Bangladesh';
      let flag = '🇧🇩';

      if (num.startsWith('92')) { isInternational = true; country = 'Pakistan'; flag = '🇵🇰'; }
      else if (num.startsWith('91')) { isInternational = true; country = 'India'; flag = '🇮🇳'; }
      else if (num.startsWith('44')) { isInternational = true; country = 'United Kingdom'; flag = '🇬🇧'; }
      else if (num.startsWith('971')) { isInternational = true; country = 'United Arab Emirates'; flag = '🇦🇪'; }
      else if (num.startsWith('966')) { isInternational = true; country = 'Saudi Arabia'; flag = '🇸🇦'; }
      else if (num.startsWith('973')) { isInternational = true; country = 'Bahrain'; flag = '🇧🇭'; }
      else if (num.startsWith('965')) { isInternational = true; country = 'Kuwait'; flag = '🇰🇼'; }
      else if (num.startsWith('93')) { isInternational = true; country = 'Afghanistan'; flag = '🇦🇫'; }
      else if (num.startsWith('49')) { isInternational = true; country = 'Germany'; flag = '🇩🇪'; }
      else if (num.startsWith('1')) { isInternational = true; country = 'USA/Canada'; flag = '🇺🇸'; }

      if (isInternational) {
        let existing = list.find(item => item.number === r.otherParty);
        if (!existing) {
          existing = {
            number: r.otherParty,
            country,
            flag,
            voiceCount: 0,
            smsCount: 0,
            total: 0,
            duration: 0
          };
          list.push(existing);
        }

        const type = r.usageType.toLowerCase();
        if (type.includes('sms')) {
          existing.smsCount++;
        } else {
          existing.voiceCount++;
          existing.duration += r.duration || 0;
        }
        existing.total++;
      }
    });

    return list.sort((a, b) => b.total - a.total);
  }, [records]);

  // Aggregate stats by Country
  const countryAggregate = useMemo(() => {
    const map: { [country: string]: { name: string; flag: string; total: number; duration: number } } = {};
    internationalStats.forEach(item => {
      if (!map[item.country]) {
        map[item.country] = { name: item.country, flag: item.flag, total: 0, duration: 0 };
      }
      map[item.country].total += item.total;
      map[item.country].duration += item.duration;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [internationalStats]);

  return (
    <div className="w-full h-full overflow-y-auto p-6 space-y-6 custom-scrollbar text-left bg-[#121212] animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="border-b border-[#2e2e2e] pb-4">
        <h2 className="text-sm font-semibold text-gray-200">International Communications Intelligence</h2>
        <p className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-wider">
          Cross-border calls, routing filters, and country code classifications for target: <strong className="text-gray-300 font-mono font-bold">{cdrFile.phoneNumber}</strong>
        </p>
      </div>

      {/* Flag widgets grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        {countryAggregate.length > 0 ? (
          countryAggregate.slice(0, 4).map((cnt, idx) => (
            <div key={idx} className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-2xl" role="img" aria-label={cnt.name}>{cnt.flag}</span>
                <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-wider">{cnt.name}</span>
              </div>
              <span className="text-2xl font-bold text-gray-100 font-mono mt-3">{cnt.total} events</span>
              <span className="text-[10px] text-gray-550 block font-mono">Total duration: {(cnt.duration / 60).toFixed(0)} mins</span>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-6 text-center text-gray-500 text-xs font-mono">
            <Globe className="h-6 w-6 mx-auto mb-2 text-gray-600 animate-pulse" />
            No international calls detected in local logs.
          </div>
        )}
      </div>

      {/* Detailed Table */}
      {internationalStats.length > 0 && (
        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#2e2e2e] bg-[#1a1a1a]/30">
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">International Contacts Breakdown</h3>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse text-left text-xs font-mono">
              <thead>
                <tr className="bg-[#171717] border-b border-[#2e2e2e] text-gray-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Contact Number</th>
                  <th className="py-3 px-4">Country Registry</th>
                  <th className="py-3 px-4 text-center">Voice</th>
                  <th className="py-3 px-4 text-center">SMS</th>
                  <th className="py-3 px-4 text-right">Total Duration</th>
                  <th className="py-3 px-4 text-right">Total Interactions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e2e]/40 text-gray-300">
                {internationalStats.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#171717]/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#3ecf8e] select-all">{item.number}</td>
                    <td className="py-3 px-4 font-sans text-gray-250">
                      <span className="mr-2" role="img" aria-label={item.country}>{item.flag}</span>
                      {item.country}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-400">
                      <span className="flex items-center justify-center gap-1">
                        <Phone className="h-3 w-3 text-gray-500" />
                        {item.voiceCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-400">
                      <span className="flex items-center justify-center gap-1">
                        <MessageSquare className="h-3 w-3 text-gray-500" />
                        {item.smsCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400">
                      <span className="flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3 text-gray-500" />
                        {item.duration}s
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-250">{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
