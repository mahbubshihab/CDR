import React, { useMemo, useState } from 'react';
import { Sun, Moon, Download, FileText, Map as MapIcon, Database, BarChart3, Link, Globe } from 'lucide-react';
import { type CDRRecord } from '../../../../utils/db';
import { TimeRangeFilter } from './TimeRangeFilter';

interface TimeCallsIntelligenceProps {
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

export const TimeCallsIntelligence: React.FC<TimeCallsIntelligenceProps> = ({ records, mode }) => {
  const [ranges, setRanges] = useState({
    dayStart: '06:00',
    dayEnd: '17:59',
    nightStart: '18:00',
    nightEnd: '05:59'
  });
  
  const [activeTab, setActiveTab] = useState('Table');

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

  // Aggregate stats
  const stats = useMemo(() => {
    const uniqueContacts = new Set(filteredRecords.map(r => r.otherParty).filter(Boolean));
    const totalDuration = filteredRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
    
    return {
      calls: filteredRecords.length,
      contacts: uniqueContacts.size,
      durationMin: Math.floor(totalDuration / 60)
    };
  }, [filteredRecords]);

  const Icon = mode === 'day' ? Sun : Moon;
  const title = mode === 'day' ? 'Day Calls Intelligence' : 'Night Calls Intelligence';

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a] p-6 custom-scrollbar overflow-y-auto">
      {/* Header */}
      <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Icon className={`w-6 h-6 ${mode === 'day' ? 'text-yellow-400' : 'text-blue-400'}`} />
            <div>
              <h1 className="text-xl font-bold text-white">{title}</h1>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                {stats.calls} calls - {stats.contacts} contacts - {stats.durationMin} min total
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded text-xs text-gray-300 hover:bg-[#2a2a2a] transition-colors">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded text-xs text-gray-300 hover:bg-[#2a2a2a] transition-colors">
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded text-xs text-gray-300 hover:bg-[#2a2a2a] transition-colors">
              <MapIcon className="w-3.5 h-3.5" /> KML
            </button>
          </div>
        </div>

        <TimeRangeFilter onApply={setRanges} buttonLabel="Apply Hours" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['Table', 'Charts', 'Link', 'Geo', 'Day Vs Night'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded text-xs font-semibold transition-colors ${
              activeTab === tab 
                ? 'bg-[#3b82f6] text-white' 
                : 'bg-[#1e1e1e] border border-[#2e2e2e] text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {activeTab === 'Table' && (
        <div className="flex-1 bg-[#121212] border border-[#2e2e2e] rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#2e2e2e] flex items-center justify-between">
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-[#1e1e1e] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white w-64 focus:outline-none focus:border-[#3ecf8e]" 
            />
            <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
              <span>Columns</span>
              <span>{filteredRecords.length} rows</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#1a1a1a] sticky top-0 z-10">
                <tr>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">A-Number</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">A Operator</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">B-Number</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">B Operator</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">Type</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">In/Out</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">Date</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">Time</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">Min</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">IMEI</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">IMSI</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">Cell</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">Location</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">Lat</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">Lng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e2e]">
                {filteredRecords.slice(0, 100).map((r, i) => {
                  const d = new Date(r.timestamp);
                  const dateStr = d.toISOString().split('T')[0];
                  const timeStr = d.toTimeString().split(' ')[0].substring(0, 5);
                  
                  return (
                    <tr key={i} className="hover:bg-[#1e1e1e] transition-colors font-mono">
                      <td className="p-3 text-gray-200">{r.aparty || 'N/A'}</td>
                      <td className="p-3 text-gray-400">N/A</td>
                      <td className="p-3 text-gray-200">{r.otherParty || 'N/A'}</td>
                      <td className="p-3 text-gray-400">N/A</td>
                      <td className="p-3 text-gray-400">{r.usageType.toLowerCase()}</td>
                      <td className="p-3 text-gray-400">{r.usageType}</td>
                      <td className="p-3 text-gray-300">{dateStr}</td>
                      <td className="p-3 text-gray-300">{timeStr}</td>
                      <td className="p-3 text-gray-400">{Math.floor((r.duration || 0) / 60)}</td>
                      <td className="p-3 text-gray-400">{r.imei || 'N/A'}</td>
                      <td className="p-3 text-gray-400">{r.imsi || 'N/A'}</td>
                      <td className="p-3 text-gray-400">{r.cellId || 'N/A'}</td>
                      <td className="p-3 text-gray-400 truncate max-w-[150px]" title={r.address}>{r.address || 'N/A'}</td>
                      <td className="p-3 text-gray-400">N/A</td>
                      <td className="p-3 text-gray-400">N/A</td>
                    </tr>
                  );
                })}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={15} className="p-8 text-center text-gray-500 font-mono">
                      No records found in this time range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Placeholder for other tabs */}
      {activeTab !== 'Table' && (
        <div className="flex-1 bg-[#121212] border border-[#2e2e2e] rounded-xl flex items-center justify-center">
          <div className="text-center text-gray-500 font-mono flex flex-col items-center">
            {activeTab === 'Charts' && <BarChart3 className="w-8 h-8 mb-4 opacity-50" />}
            {activeTab === 'Link' && <Link className="w-8 h-8 mb-4 opacity-50" />}
            {activeTab === 'Geo' && <MapIcon className="w-8 h-8 mb-4 opacity-50" />}
            {activeTab === 'Day Vs Night' && <Globe className="w-8 h-8 mb-4 opacity-50" />}
            <p>The {activeTab} view is currently under construction.</p>
          </div>
        </div>
      )}
    </div>
  );
};
