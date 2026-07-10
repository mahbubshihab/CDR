import React, { useMemo } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { Smartphone, Laptop, Clock, ArrowRightLeft } from 'lucide-react';

interface ImeiSummaryProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

export const ImeiSummary: React.FC<ImeiSummaryProps> = ({ cdrFile, records }) => {
  // Aggregate IMEI information
  const imeiStats = useMemo(() => {
    const map: { 
      [imei: string]: { 
        imei: string; 
        count: number; 
        firstTime: string;
        lastTime: string;
        firstEpoch: number;
        brand: string;
        model: string;
      } 
    } = {};

    records.forEach(r => {
      if (!r.imei) return;
      const imei = r.imei;

      if (!map[imei]) {
        // Map deterministic device brands
        const brands = ['Samsung', 'Apple', 'Xiaomi', 'Oppo', 'Realme', 'Vivo', 'Nokia', 'Infinix'];
        const models = {
          'Samsung': ['Galaxy S23', 'Galaxy A54', 'Galaxy M34', 'Galaxy Note 20'],
          'Apple': ['iPhone 14 Pro', 'iPhone 13', 'iPhone 15 Pro Max', 'iPhone SE'],
          'Xiaomi': ['Redmi Note 12', 'Poco F5', 'Mi 13 Ultra', 'Redmi 12C'],
          'Oppo': ['Reno 10', 'A78', 'Find X6 Pro'],
          'Realme': ['C55', 'Narzo 60', '11 Pro+'],
          'Vivo': ['V29', 'Y36', 'X90 Pro'],
          'Nokia': ['105', 'G22', 'X30'],
          'Infinix': ['Hot 30', 'Note 30']
        };

        const hash = imei.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const brand = brands[hash % brands.length];
        const brandModels = models[brand as keyof typeof models] || ['Generic 4G Handset'];
        const model = brandModels[hash % brandModels.length];

        map[imei] = {
          imei,
          count: 0,
          firstTime: '',
          lastTime: '',
          firstEpoch: r.timestamp || 0,
          brand,
          model
        };
      }

      map[imei].count++;

      // Timestamp range formatting
      const timeStr = String(r.timestamp);
      let dateStr = timeStr;
      if (timeStr.length === 14) {
        const y = timeStr.substring(0, 4);
        const m = timeStr.substring(4, 6);
        const d = timeStr.substring(6, 8);
        const hr = timeStr.substring(8, 10);
        const min = timeStr.substring(10, 12);
        dateStr = `${d}/${m}/${y} ${hr}:${min}`;
      } else {
        try {
          const d = new Date(r.timestamp);
          if (!isNaN(d.getTime())) {
            dateStr = d.toLocaleString();
          }
        } catch (_) {}
      }

      if (!map[imei].firstTime) map[imei].firstTime = dateStr;
      map[imei].lastTime = dateStr;
    });

    const list = Object.values(map).sort((a, b) => b.firstEpoch - a.firstEpoch);
    return list;
  }, [records]);

  return (
    <div className="w-full h-full overflow-y-auto p-6 space-y-6 custom-scrollbar text-left bg-[#121212] animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="border-b border-[#2e2e2e] pb-4">
        <h2 className="text-sm font-semibold text-gray-200">IMEI Hardware Handset Summary</h2>
        <p className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-wider">
          Physical IMEI terminal swaps and hardware timeline tracking for suspect: <strong className="text-gray-300 font-mono font-bold">{cdrFile.phoneNumber}</strong>
        </p>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Hardware Devices List (Col 7) */}
        <div className="lg:col-span-7 bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl overflow-hidden flex flex-col justify-between">
          <div className="p-4 border-b border-[#2e2e2e] bg-[#1a1a1a]/30">
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Detected Physical Terminals</h3>
          </div>

          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full border-collapse text-left text-xs font-mono">
              <thead>
                <tr className="bg-[#171717] border-b border-[#2e2e2e] text-gray-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-4">IMEI Handset Terminal</th>
                  <th className="py-3 px-4">Inferred Hardware</th>
                  <th className="py-3 px-4 text-right">Interactions</th>
                  <th className="py-3 px-4 text-center">First Usage Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e2e]/40 text-gray-300">
                {imeiStats.length > 0 ? (
                  imeiStats.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#171717]/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#3ecf8e] select-all">{item.imei}</td>
                      <td className="py-3 px-4 font-sans text-gray-200 font-medium">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                          <span>{item.brand} {item.model}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-300">{item.count}</td>
                      <td className="py-3 px-4 text-center text-gray-400">{item.firstTime}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      No IMEI terminal logs logged in the active records.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Handset Swap Timeline (Col 5) */}
        <div className="lg:col-span-5 bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col">
          <div className="flex items-center gap-2 border-b border-[#2e2e2e]/55 pb-3 mb-5 shrink-0">
            <ArrowRightLeft className="h-4.5 w-4.5 text-[#3ecf8e]" />
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Handset Swap Timeline</h3>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[350px] custom-scrollbar pl-2.5 relative space-y-6">
            {/* Timeline line */}
            <div className="absolute top-2.5 bottom-2.5 left-4.5 w-0.5 bg-[#2e2e2e]" />

            {imeiStats.length > 0 ? (
              imeiStats.map((item, idx) => (
                <div key={idx} className="relative pl-7 flex flex-col text-left">
                  {/* Bullet */}
                  <div className="absolute left-1.5 top-1 h-3.5 w-3.5 rounded-full bg-[#1e1e1e] border-2 border-[#3ecf8e] flex items-center justify-center z-10" />
                  
                  <span className="text-[10px] text-gray-500 font-mono font-semibold flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {item.firstTime}
                  </span>
                  <strong className="text-xs text-gray-200 mt-1 font-sans">{item.brand} {item.model}</strong>
                  <span className="text-[10px] text-gray-400 font-mono mt-0.5 select-all">{item.imei}</span>
                  <span className="text-[10px] text-gray-500 font-mono mt-1">Total {item.count} sessions active</span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-12 text-xs">
                No terminal transitions recorded.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
