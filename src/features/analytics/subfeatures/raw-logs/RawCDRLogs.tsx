import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';

interface RawCDRLogsProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

export const RawCDRLogs: React.FC<RawCDRLogsProps> = ({ cdrFile, records }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const lowerSearch = searchTerm.toLowerCase();
    return records.filter(rec => {
      return (
        (rec.otherParty && rec.otherParty.toLowerCase().includes(lowerSearch)) ||
        (rec.imei && rec.imei.toLowerCase().includes(lowerSearch)) ||
        (rec.imsi && rec.imsi.toLowerCase().includes(lowerSearch)) ||
        (rec.address && rec.address.toLowerCase().includes(lowerSearch)) ||
        (rec.usageType && rec.usageType.toLowerCase().includes(lowerSearch)) ||
        (rec.provider && rec.provider.toLowerCase().includes(lowerSearch))
      );
    });
  }, [records, searchTerm]);

  return (
    <div className="w-full h-full overflow-hidden flex flex-col p-6 text-left animate-in fade-in duration-300 bg-[#121212]">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-200">Raw CDR Records Log</h3>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Viewing raw spreadsheet logs for target A-Party phone: <strong className="text-[#3ecf8e]">{cdrFile.phoneNumber}</strong>
          </p>
        </div>

        <div className="relative shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 bg-[#1a1a1a] border border-[#2e2e2e] text-gray-200 text-xs rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-[#3ecf8e]/50 focus:ring-1 focus:ring-[#3ecf8e]/50 transition-colors font-mono"
          />
        </div>
      </div>
      
      <div className="flex-1 min-h-0 bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar text-xs">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#171717] border-b border-[#2e2e2e] text-gray-400 uppercase font-semibold tracking-wider text-[10px]">
                <th className="py-2.5 px-4 whitespace-nowrap">Time</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Carrier</th>
                <th className="py-2.5 px-4 whitespace-nowrap">A-Party</th>
                <th className="py-2.5 px-4 whitespace-nowrap">B-Party (Contact)</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Duration</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Type</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Net Type</th>
                <th className="py-2.5 px-4 whitespace-nowrap">MCC</th>
                <th className="py-2.5 px-4 whitespace-nowrap">MNC</th>
                <th className="py-2.5 px-4 whitespace-nowrap">LAC</th>
                <th className="py-2.5 px-4 whitespace-nowrap">CI (Cell ID)</th>
                <th className="py-2.5 px-4 whitespace-nowrap">IMEI</th>
                <th className="py-2.5 px-4 whitespace-nowrap">IMSI</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Cell tower Address</th>
                <th className="py-2.5 px-4 whitespace-nowrap">UE Port</th>
                <th className="py-2.5 px-4 whitespace-nowrap">UE Local IP</th>
                <th className="py-2.5 px-4 whitespace-nowrap">UE Local Port</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Country Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e2e]/50 font-mono text-[11px]">
              {filteredRecords.slice(0, 100).map((rec, idx) => (
                <tr key={idx} className="hover:bg-[#171717]/30 transition-colors">
                  <td className="py-2.5 px-4 text-gray-300 truncate max-w-[120px]">{rec.timestamp}</td>
                  <td className="py-2.5 px-4 text-gray-300">{rec.provider || '—'}</td>
                  <td className="py-2.5 px-4 text-gray-300">{rec.aparty || '—'}</td>
                  <td className="py-2.5 px-4 text-[#3ecf8e] font-semibold">{rec.otherParty}</td>
                  <td className="py-2.5 px-4 text-gray-300">{rec.duration}s</td>
                  <td className="py-2.5 px-4">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      rec.usageType.toLowerCase() === 'moc' ? 'bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/20' :
                      rec.usageType.toLowerCase() === 'mtc' ? 'bg-orange-950/20 text-orange-400 border border-orange-800/20' :
                      'bg-emerald-950/20 text-emerald-400 border border-emerald-800/20'
                    }`}>
                      {rec.usageType}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-gray-300">{rec.networkType || '—'}</td>
                  <td className="py-2.5 px-4 text-gray-300">{rec.mcc !== undefined ? rec.mcc : '—'}</td>
                  <td className="py-2.5 px-4 text-gray-300">{rec.mnc !== undefined ? rec.mnc : '—'}</td>
                  <td className="py-2.5 px-4 text-gray-300">{rec.lac !== undefined ? rec.lac : '—'}</td>
                  <td className="py-2.5 px-4 text-gray-300">{rec.cellId !== undefined ? rec.cellId : '—'}</td>
                  <td className="py-2.5 px-4 text-gray-300">{rec.imei || '—'}</td>
                  <td className="py-2.5 px-4 text-gray-300">{rec.imsi || '—'}</td>
                  <td className="py-2.5 px-4 text-gray-300 truncate max-w-[200px]">{rec.address || '—'}</td>
                  <td className="py-2.5 px-4 text-gray-300">{rec.uePort || '—'}</td>
                  <td className="py-2.5 px-4 text-gray-300">{rec.ueLocalIp || '—'}</td>
                  <td className="py-2.5 px-4 text-gray-300">{rec.ueLocalPort || '—'}</td>
                  <td className="py-2.5 px-4 text-gray-300">{rec.countryCode || '—'}</td>
                </tr>
              ))}
              
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={18} className="py-8 text-center text-gray-500">
                    No records found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredRecords.length > 100 && (
            <div className="p-3 text-center bg-[#171717]/40 text-gray-450 border-t border-[#2e2e2e] font-semibold">
              Showing first 100 of {filteredRecords.length} logs. Use exports to view full dataset.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

