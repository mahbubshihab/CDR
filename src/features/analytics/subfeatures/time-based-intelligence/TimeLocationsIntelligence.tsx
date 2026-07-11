import React, { useMemo, useState } from 'react';
import { Sun, Moon, Download, FileText, Map as MapIcon, Search } from 'lucide-react';
import { ExportableChartCard } from '../../../../components/ui/ExportableChartCard';
import { type CDRRecord } from '../../../../utils/db';
import { TimeRangeFilter } from './TimeRangeFilter';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TimeLocationsIntelligenceProps {
  records: CDRRecord[];
  mode: 'day' | 'night';
}

const isTimeInRange = (timestamp: number | string | undefined, startHM: string, endHM: string) => {
  if (!timestamp) return false;
  const d = new Date(timestamp);
  const m = d.getHours() * 60 + d.getMinutes();
  
  const [sH, sM] = startHM.split(':').map(Number);
  const [eH, eM] = endHM.split(':').map(Number);
  
  const startM = sH * 60 + sM;
  const endM = eH * 60 + eM;
  
  if (startM <= endM) {
    return m >= startM && m <= endM;
  } else {
    // Crosses midnight
    return m >= startM || m <= endM;
  }
};

export const TimeLocationsIntelligence: React.FC<TimeLocationsIntelligenceProps> = ({ records, mode }) => {
  const [ranges, setRanges] = useState({
    dayStart: '06:00',
    dayEnd: '17:59',
    nightStart: '18:00',
    nightEnd: '05:59'
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Filter records based on mode and time ranges
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (mode === 'day') {
        return isTimeInRange(r.timestamp, ranges.dayStart, ranges.dayEnd);
      } else {
        return isTimeInRange(r.timestamp, ranges.nightStart, ranges.nightEnd);
      }
    });
  }, [records, mode, ranges]);

  // Compute table and chart data
  const locStats = useMemo(() => {
    const map = new Map<string, any>();

    filteredRecords.forEach(r => {
      const loc = (r.address && r.address.trim() !== '') ? r.address : 'Unknown Location';
      if (!map.has(loc)) {
        map.set(loc, {
          location: loc,
          visits: 0,
          activity: 0,
          inCalls: 0,
          outCalls: 0,
          inSms: 0,
          outSms: 0,
          dates: new Set<string>(),
          first: r.timestamp,
          last: r.timestamp
        });
      }

      const stat = map.get(loc);
      stat.visits += 1;
      stat.activity += 1; // Assuming 1 CDR = 1 activity
      
      const type = r.usageType?.toLowerCase() || '';
      if (type.includes('call') || type.includes('voice')) {
        if (type.includes('in') || type.includes('mt')) stat.inCalls += 1;
        else stat.outCalls += 1;
      } else if (type.includes('sms') || type.includes('msg')) {
        if (type.includes('in') || type.includes('mt')) stat.inSms += 1;
        else stat.outSms += 1;
      }

      const dateStr = new Date(r.timestamp).toISOString().split('T')[0];
      stat.dates.add(dateStr);

      if (r.timestamp < stat.first) stat.first = r.timestamp;
      if (r.timestamp > stat.last) stat.last = r.timestamp;
    });

    const result = Array.from(map.values()).map(s => ({
      ...s,
      activeDays: s.dates.size,
      firstStr: new Date(s.first).toISOString().replace('T', ' ').substring(0, 16),
      lastStr: new Date(s.last).toISOString().replace('T', ' ').substring(0, 16)
    })).sort((a, b) => b.visits - a.visits);

    return result;
  }, [filteredRecords]);


  // Aggregate stats
  const stats = useMemo(() => {
    const visits = filteredRecords.length;
    const uniqueLocations = locStats.length;
    const allEvents = records.length;
    const share = allEvents > 0 ? ((visits / allEvents) * 100).toFixed(1) : '0.0';
    
    return { visits, uniqueLocations, allEvents, share };
  }, [filteredRecords, locStats.length, records]);

  const Icon = mode === 'day' ? Sun : Moon;
  const title = mode === 'day' ? 'Day Locations' : 'Night Locations';
  const subtitle = `Sirf ${mode} time window ke events dikhaye jate hain — Location Summary se kam hona normal hai. Neeche time range badal kar zyada data include kar sakte hain.`;
  const filteredLocStats = useMemo(() => {
    if (!searchTerm) return locStats;
    const lower = searchTerm.toLowerCase();
    return locStats.filter(s => s.location.toLowerCase().includes(lower));
  }, [locStats, searchTerm]);

  const totalPages = Math.ceil(filteredLocStats.length / pageSize);
  const paginatedLocStats = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLocStats.slice(start, start + pageSize);
  }, [filteredLocStats, currentPage]);

  const primaryColor = mode === 'day' ? '#facc15' : '#60a5fa';

  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 pb-10 bg-[#0a0a0a] custom-scrollbar overflow-y-auto">
      {/* Header Panel */}
      <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-5 shadow-lg shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <Icon className={`w-5 h-5 ${mode === 'day' ? 'text-yellow-400' : 'text-blue-400'}`} />
          <h1 className="text-lg font-bold text-white">{title}</h1>
        </div>
        <p className="text-xs text-gray-400 font-mono">{subtitle}</p>
      </div>

      {/* Day / Night Time Range */}
      <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-5 shadow-lg">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Day / Night Time Range</h3>
        <TimeRangeFilter onApply={setRanges} buttonLabel="Apply Time Range" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-5 flex flex-col items-center justify-center shadow-lg">
          <div className="text-3xl font-bold text-white mb-1">{stats.visits}</div>
          <div className="text-xs text-gray-400 capitalize">{mode} Visits</div>
        </div>
        <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-5 flex flex-col items-center justify-center shadow-lg">
          <div className="text-3xl font-bold text-white mb-1">{stats.uniqueLocations}</div>
          <div className="text-xs text-gray-400">Locations</div>
        </div>
        <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-5 flex flex-col items-center justify-center shadow-lg">
          <div className="text-3xl font-bold text-white mb-1">{stats.allEvents}</div>
          <div className="text-xs text-gray-400">All CDR Events</div>
        </div>
        <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-5 flex flex-col items-center justify-center shadow-lg">
          <div className="text-3xl font-bold text-white mb-1">{stats.share}%</div>
          <div className="text-xs text-gray-400 capitalize">{mode} Share</div>
        </div>
      </div>

      {/* Location Frequency Chart */}
      <ExportableChartCard 
        title="Location Frequency"
        exportData={locStats}
        className="h-[400px] !bg-[#121212] !border-[#2e2e2e]"
        contentClassName="!bg-[#121212] flex flex-col p-5 min-h-0"
      >
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={locStats.slice(0, 20)}>
              <XAxis dataKey="location" stroke="#4b5563" fontSize={10} tickFormatter={(val) => val.substring(0, 10) + '...'} />
              <YAxis stroke="#4b5563" fontSize={10} />
              <Tooltip cursor={{fill: '#1e1e1e'}} contentStyle={{ backgroundColor: '#121212', borderColor: '#2e2e2e', color: '#fff', fontSize: '12px' }} />
              <Bar dataKey="visits" radius={[2, 2, 0, 0]}>
                {locStats.slice(0, 20).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={primaryColor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ExportableChartCard>

      {/* Location Table */}
      <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl flex flex-col shadow-lg overflow-hidden">
        <div className="p-4 border-b border-[#2e2e2e] flex items-center justify-between bg-[#1a1a1a]">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#1e1e1e] border border-[#2e2e2e] rounded pl-9 pr-3 py-1.5 text-xs text-white w-64 focus:outline-none focus:border-[#3ecf8e]" 
            />
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
            <span className="bg-[#1e1e1e] border border-[#2e2e2e] px-3 py-1 rounded">Columns</span>
            <span>{filteredLocStats.length} rows</span>
          </div>
        </div>
        
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead className="bg-[#1a1a1a] sticky top-0 z-10">
              <tr>
                <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">Location</th>
                <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">Visits</th>
                <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">Activity</th>
                <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">In Calls</th>
                <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">Out Calls</th>
                <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">In SMS</th>
                <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">Out SMS</th>
                <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">Active Days</th>
                <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">First</th>
                <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">Last</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e2e]">
              {paginatedLocStats.map((s, i) => (
                <tr key={i} className="hover:bg-[#1e1e1e] transition-colors font-mono">
                  <td className="p-3 text-gray-200">{s.location}</td>
                  <td className="p-3 text-gray-300">{s.visits}</td>
                  <td className="p-3 text-gray-300">{s.activity}</td>
                  <td className="p-3 text-gray-300">{s.inCalls}</td>
                  <td className="p-3 text-gray-300">{s.outCalls}</td>
                  <td className="p-3 text-gray-300">{s.inSms}</td>
                  <td className="p-3 text-gray-300">{s.outSms}</td>
                  <td className="p-3 text-gray-300">{s.activeDays}</td>
                  <td className="p-3 text-gray-400">{s.firstStr}</td>
                  <td className="p-3 text-gray-400">{s.lastStr}</td>
                </tr>
              ))}
              {paginatedLocStats.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-500 font-mono">
                    No locations found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-[#2e2e2e] bg-[#1a1a1a] flex items-center justify-between text-xs text-gray-400">
            <div>
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredLocStats.length)} of {filteredLocStats.length} entries
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded bg-[#1e1e1e] border border-[#2e2e2e] hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="px-3 py-1 font-mono">
                {currentPage} / {totalPages}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded bg-[#1e1e1e] border border-[#2e2e2e] hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
