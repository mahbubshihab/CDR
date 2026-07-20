import React, { useState, useEffect } from 'react';
import { db, type CDRRecord, type IntelligenceItem } from '../../utils/db';
import { Search, Phone, Shield, ArrowUpRight, ArrowDownLeft, Clock, MessageSquare, AlertTriangle, Activity } from 'lucide-react';

interface NumberStats {
  totalCalls: number;
  totalDuration: number;
  incoming: number;
  outgoing: number;
  sms: number;
  firstContact: number | null;
  lastContact: number | null;
  records: CDRRecord[];
}

export function NumberLookup() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [stats, setStats] = useState<NumberStats | null>(null);
  const [intelligenceMatch, setIntelligenceMatch] = useState<IntelligenceItem | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneNumber.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setStats(null);
    setIntelligenceMatch(null);

    const query = phoneNumber.trim().replace(/\s+/g, '');

    try {
      // Look up intelligence DB
      const intel = await db.intelligence.where('type').equals('Number').toArray();
      const match = intel.find(item => item.value.includes(query) || query.includes(item.value));
      if (match) {
        setIntelligenceMatch(match);
      }

      // Search all records
      const records = await db.cdrRecords.toArray();
      
      const matchedRecords = records.filter(r => 
        (r.otherParty && r.otherParty.includes(query)) ||
        // We'd ideally check the a-party (file owner) here too. 
        // A full implementation might fetch files and map.
        (r.aparty && r.aparty.includes(query))
      );

      if (matchedRecords.length === 0) {
        setIsSearching(false);
        return; // Empty state handles it
      }

      const calcStats: NumberStats = {
        totalCalls: 0,
        totalDuration: 0,
        incoming: 0,
        outgoing: 0,
        sms: 0,
        firstContact: null,
        lastContact: null,
        records: matchedRecords.sort((a, b) => b.timestamp - a.timestamp) // Latest first
      };

      for (const rec of matchedRecords) {
        calcStats.totalCalls++;
        calcStats.totalDuration += (rec.duration || 0);

        if (!calcStats.firstContact || rec.timestamp < calcStats.firstContact) calcStats.firstContact = rec.timestamp;
        if (!calcStats.lastContact || rec.timestamp > calcStats.lastContact) calcStats.lastContact = rec.timestamp;

        const uType = rec.usageType?.toUpperCase() || '';
        if (uType.includes('MTC')) calcStats.incoming++;
        else if (uType.includes('MOC')) calcStats.outgoing++;
        
        if (uType.includes('SMS')) calcStats.sms++;
      }

      setStats(calcStats);
    } catch (error) {
      console.error('Error during search:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const formatDate = (ts: number | null) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="p-6 text-slate-200 min-h-[calc(100vh-2rem)] flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Search className="w-8 h-8 text-emerald-500" />
          Global Number Lookup
        </h1>
        <p className="text-slate-400 mt-2">Search for any phone number across all indexed cases and records.</p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-2 flex gap-2 items-center max-w-2xl mx-auto shadow-xl focus-within:border-emerald-500 transition-colors">
          <Phone className="w-6 h-6 text-slate-400 ml-4" />
          <input
            type="text"
            placeholder="Enter phone number to trace..."
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="bg-transparent border-none outline-none flex-1 text-xl text-white placeholder-slate-500 px-4 py-3"
          />
          <button
            type="submit"
            disabled={isSearching || !phoneNumber.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2"
          >
            {isSearching ? 'Tracing...' : 'Trace'}
          </button>
        </div>
      </form>

      {hasSearched && !isSearching && !stats && (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-12 text-center max-w-lg mx-auto">
            <Search className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-xl font-semibold text-white mb-2">No Records Found</h3>
            <p className="text-slate-400">
              The number <span className="font-mono text-emerald-400">{phoneNumber}</span> does not appear in any uploaded CDR files or records.
            </p>
          </div>
        </div>
      )}

      {stats && (
        <div className="flex flex-col gap-6 flex-1">
          {intelligenceMatch && (
            <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-6 flex gap-4 items-start shadow-inner">
              <Shield className="w-8 h-8 text-amber-500 shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2 mb-1">
                  Intelligence Database Match
                  <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-300 font-mono">
                    {intelligenceMatch.tag.toUpperCase()}
                  </span>
                </h3>
                <div className="text-slate-300 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-3">
                  <div><span className="text-slate-500 text-sm">Target Name:</span> {intelligenceMatch.name}</div>
                  <div><span className="text-slate-500 text-sm">Match Value:</span> <span className="font-mono">{intelligenceMatch.value}</span></div>
                  <div className="col-span-full"><span className="text-slate-500 text-sm">Intel Notes:</span> {intelligenceMatch.notes || 'N/A'}</div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-5">
              <div className="text-slate-400 text-sm mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Total Events
              </div>
              <div className="text-3xl font-bold text-white">{stats.totalCalls}</div>
            </div>
            
            <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-5">
              <div className="text-slate-400 text-sm mb-2 flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" /> Incoming
              </div>
              <div className="text-3xl font-bold text-white">{stats.incoming}</div>
            </div>

            <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-5">
              <div className="text-slate-400 text-sm mb-2 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-blue-400" /> Outgoing
              </div>
              <div className="text-3xl font-bold text-white">{stats.outgoing}</div>
            </div>

            <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-5">
              <div className="text-slate-400 text-sm mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" /> SMS Total
              </div>
              <div className="text-3xl font-bold text-white">{stats.sms}</div>
            </div>

            <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-5">
              <div className="text-slate-400 text-sm mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Duration
              </div>
              <div className="text-xl font-bold text-white">
                {Math.floor(stats.totalDuration / 60)}m {stats.totalDuration % 60}s
              </div>
            </div>
          </div>

          <div className="flex gap-4 mb-2">
            <div className="bg-slate-800/40 rounded-lg px-4 py-2 border border-slate-700 text-sm">
              <span className="text-slate-500">First Contact:</span> <span className="text-slate-300 font-medium ml-2">{formatDate(stats.firstContact)}</span>
            </div>
            <div className="bg-slate-800/40 rounded-lg px-4 py-2 border border-slate-700 text-sm">
              <span className="text-slate-500">Last Contact:</span> <span className="text-slate-300 font-medium ml-2">{formatDate(stats.lastContact)}</span>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden flex flex-col flex-1">
            <div className="p-4 border-b border-slate-700 bg-slate-800/80 font-semibold text-lg flex items-center justify-between">
              Trace History
              <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300 font-normal">
                {stats.records.length} records found
              </span>
            </div>
            <div className="overflow-x-auto flex-1 custom-scrollbar max-h-[500px]">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-slate-900/80 sticky top-0 backdrop-blur-sm shadow-sm">
                  <tr>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Other Party</th>
                    <th className="px-6 py-4">Duration (s)</th>
                    <th className="px-6 py-4">IMEI / IMSI</th>
                    <th className="px-6 py-4">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {stats.records.map((rec, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-300">{formatDate(rec.timestamp)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          rec.usageType?.includes('MOC') ? 'bg-blue-500/20 text-blue-400' :
                          rec.usageType?.includes('MTC') ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-slate-600/40 text-slate-300'
                        }`}>
                          {rec.usageType || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-white font-medium">{rec.otherParty || 'N/A'}</td>
                      <td className="px-6 py-4">{rec.duration || 0}</td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-400 flex flex-col gap-1">
                        <span>{rec.imei ? `E: ${rec.imei}` : 'E: N/A'}</span>
                        <span>{rec.imsi ? `S: ${rec.imsi}` : 'S: N/A'}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {rec.address || (rec.lac && rec.cellId ? `LAC: ${rec.lac} | CELL: ${rec.cellId}` : 'N/A')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
