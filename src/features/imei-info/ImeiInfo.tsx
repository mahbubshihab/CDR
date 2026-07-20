import React, { useState, useEffect, useMemo } from 'react';
import { db, type CDRRecord } from '../../utils/db';
import { Search, Smartphone, Hash, Calendar, Activity, Cpu } from 'lucide-react';

interface ImeiStats {
  imei: string;
  callCount: number;
  firstSeen: number;
  lastSeen: number;
  operators: Set<string>;
  imsiList: Set<string>;
  numbersUsed: Set<string>;
  records: CDRRecord[];
}

export function ImeiInfo() {
  const [searchTerm, setSearchTerm] = useState('');
  const [imeiStatsList, setImeiStatsList] = useState<ImeiStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImei, setSelectedImei] = useState<string | null>(null);

  useEffect(() => {
    const scanImeis = async () => {
      setIsLoading(true);
      try {
        const records = await db.cdrRecords.toArray();
        const statsMap = new Map<string, ImeiStats>();

        for (const record of records) {
          if (!record.imei || record.imei.trim() === '') continue;

          let stats = statsMap.get(record.imei);
          if (!stats) {
            stats = {
              imei: record.imei,
              callCount: 0,
              firstSeen: record.timestamp,
              lastSeen: record.timestamp,
              operators: new Set<string>(),
              imsiList: new Set<string>(),
              numbersUsed: new Set<string>(),
              records: [],
            };
            statsMap.set(record.imei, stats);
          }

          stats.callCount++;
          if (record.timestamp < stats.firstSeen) stats.firstSeen = record.timestamp;
          if (record.timestamp > stats.lastSeen) stats.lastSeen = record.timestamp;
          if (record.provider) stats.operators.add(record.provider);
          if (record.imsi) stats.imsiList.add(record.imsi);
          // Getting the a-party or assuming the file owner used this IMEI (requires a join ideally, but we can just note we have a record)
          // Simplified: we don't have the a-party reliably in all records without joining cdrFiles, so we just collect what we have.
          stats.records.push(record);
        }

        setImeiStatsList(Array.from(statsMap.values()).sort((a, b) => b.callCount - a.callCount));
      } catch (error) {
        console.error('Failed to scan IMEIs', error);
      } finally {
        setIsLoading(false);
      }
    };

    scanImeis();
  }, []);

  const filteredStats = useMemo(() => {
    return imeiStatsList.filter(s => s.imei.includes(searchTerm));
  }, [imeiStatsList, searchTerm]);

  const selectedStats = useMemo(() => {
    return imeiStatsList.find(s => s.imei === selectedImei);
  }, [imeiStatsList, selectedImei]);

  const formatDate = (ts: number) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="p-6 text-slate-200 h-[calc(100vh-2rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Smartphone className="w-8 h-8 text-indigo-500" />
          IMEI Intelligence
        </h1>
        <p className="text-slate-400 mt-2">Scan and analyze device footprints across all CDR data.</p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="w-1/3 flex flex-col min-h-0 border-r border-slate-800 pr-6">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-3 mb-4 flex gap-3 items-center">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search IMEI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none flex-1 text-slate-200 placeholder-slate-500"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {isLoading ? (
              <div className="text-center p-8 text-slate-400">Scanning records...</div>
            ) : filteredStats.length === 0 ? (
              <div className="text-center p-8 text-slate-500">No IMEI records found.</div>
            ) : (
              filteredStats.map(stat => (
                <button
                  key={stat.imei}
                  onClick={() => setSelectedImei(stat.imei)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedImei === stat.imei 
                      ? 'bg-indigo-600/20 border-indigo-500 text-white' 
                      : 'bg-slate-800/40 border-slate-700 hover:border-slate-500 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="font-mono text-lg font-semibold mb-1 flex items-center justify-between">
                    {stat.imei}
                    <span className="text-xs bg-slate-900/50 px-2 py-1 rounded text-slate-400 font-sans">
                      {stat.callCount} recs
                    </span>
                  </div>
                  <div className="text-sm text-slate-400 flex justify-between">
                    <span>{Array.from(stat.operators).join(', ') || 'Unknown Op'}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="w-2/3 flex flex-col min-h-0">
          {!selectedStats ? (
            <div className="h-full flex items-center justify-center flex-col text-slate-500 bg-slate-800/20 rounded-2xl border border-slate-800 border-dashed">
              <Cpu className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-xl">Select an IMEI to view device footprint</p>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-6 mb-6 shrink-0">
                <h2 className="text-2xl font-mono font-bold text-white flex items-center gap-3 mb-6">
                  <Smartphone className="w-6 h-6 text-indigo-400" />
                  {selectedStats.imei}
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <div className="text-slate-400 text-sm mb-1 flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Activity
                    </div>
                    <div className="text-xl font-semibold text-white">{selectedStats.callCount} events</div>
                  </div>
                  
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <div className="text-slate-400 text-sm mb-1 flex items-center gap-2">
                      <Hash className="w-4 h-4" /> IMSIs Associated
                    </div>
                    <div className="text-xl font-semibold text-white">{selectedStats.imsiList.size}</div>
                  </div>
                  
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <div className="text-slate-400 text-sm mb-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> First Seen
                    </div>
                    <div className="text-sm font-medium text-white">{formatDate(selectedStats.firstSeen)}</div>
                  </div>
                  
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <div className="text-slate-400 text-sm mb-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Last Seen
                    </div>
                    <div className="text-sm font-medium text-white">{formatDate(selectedStats.lastSeen)}</div>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-slate-800/40 rounded-xl border border-slate-700 flex flex-col min-h-0 overflow-hidden">
                <div className="p-4 border-b border-slate-700 bg-slate-800/80 font-semibold flex items-center justify-between">
                  <span>Call & Data Footprint</span>
                  <span className="text-xs font-normal text-slate-400 bg-slate-900 px-2 py-1 rounded">
                    Latest 500 records shown
                  </span>
                </div>
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 sticky top-0 backdrop-blur-md">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Date/Time</th>
                        <th className="px-4 py-3">Usage</th>
                        <th className="px-4 py-3">Other Party</th>
                        <th className="px-4 py-3">Duration (s)</th>
                        <th className="px-4 py-3">Provider</th>
                        <th className="px-4 py-3 rounded-tr-lg">IMSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStats.records.slice(0, 500).map((rec, i) => (
                        <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">{formatDate(rec.timestamp)}</td>
                          <td className="px-4 py-3 font-medium">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              rec.usageType.includes('MOC') ? 'bg-green-500/20 text-green-400' :
                              rec.usageType.includes('MTC') ? 'bg-blue-500/20 text-blue-400' :
                              'bg-slate-600/40 text-slate-300'
                            }`}>
                              {rec.usageType || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono">{rec.otherParty || 'N/A'}</td>
                          <td className="px-4 py-3">{rec.duration || 0}</td>
                          <td className="px-4 py-3">{rec.provider || 'N/A'}</td>
                          <td className="px-4 py-3 font-mono text-xs">{rec.imsi || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
