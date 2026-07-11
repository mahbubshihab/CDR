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

import { CallsChartsTab } from './tabs/CallsChartsTab';
import { CallsLinkTab } from './tabs/CallsLinkTab';
import { CallsGeoTab } from './tabs/CallsGeoTab';
import { CallsDayVsNightTab } from './tabs/CallsDayVsNightTab';

export const TimeCallsIntelligence: React.FC<TimeCallsIntelligenceProps> = ({ records, mode }) => {
  const [ranges, setRanges] = useState({
    dayStart: '06:00',
    dayEnd: '17:59',
    nightStart: '18:00',
    nightEnd: '05:59'
  });
  
  const [activeTab, setActiveTab] = useState('Table');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Filter records based on mode and time ranges
  const filteredRecords = useMemo(() => {
    let result = records.filter(r => {
      if (mode === 'day') {
        return isTimeInRange(r.timestamp, ranges.dayStart, ranges.dayEnd);
      } else {
        return isTimeInRange(r.timestamp, ranges.nightStart, ranges.nightEnd);
      }
    });

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r => 
        (r.aparty && r.aparty.toLowerCase().includes(lower)) ||
        (r.otherParty && r.otherParty.toLowerCase().includes(lower)) ||
        (r.imei && r.imei.toLowerCase().includes(lower)) ||
        (r.imsi && r.imsi.toLowerCase().includes(lower)) ||
        (r.address && r.address.toLowerCase().includes(lower)) ||
        (r.cellId && r.cellId.toString().includes(lower))
      );
    }
    
    return result;
  }, [records, mode, ranges, searchTerm]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage]);

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
    <div className="w-full flex-1 min-h-0 flex flex-col bg-[#0a0a0a] p-6 custom-scrollbar overflow-y-auto">
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
        <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl flex flex-col flex-1 min-h-0">
          <div className="p-4 border-b border-[#2e2e2e] flex items-center justify-between shrink-0">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#1e1e1e] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white w-64 focus:outline-none focus:border-[#3ecf8e]" 
            />
            <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
              <span className="bg-[#1e1e1e] border border-[#2e2e2e] px-3 py-1 rounded cursor-pointer">Columns</span>
              <span>{filteredRecords.length} rows</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar relative">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead className="bg-[#1a1a1a] sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">Date</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">Time</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">Type</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">A-Number</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">B-Number</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">Duration</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">IMEI</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">IMSI</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">Cell</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">Location</th>
                  <th className="p-3 text-gray-400 font-semibold border-b border-[#2e2e2e]">Lng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e2e]">
                {paginatedRecords.map((r, i) => {
                  const d = new Date(r.timestamp);
                  const dateStr = d.toISOString().split('T')[0];
                  const timeStr = d.toTimeString().split(' ')[0].substring(0, 5);
                  
                  return (
                    <tr key={i} className="hover:bg-[#1e1e1e] transition-colors font-mono">
                      <td className="p-3 text-gray-300">{dateStr}</td>
                      <td className="p-3 text-gray-300">{timeStr}</td>
                      <td className="p-3 text-gray-200">{r.usageType || 'N/A'}</td>
                      <td className="p-3 text-gray-200">{r.aparty || 'N/A'}</td>
                      <td className="p-3 text-gray-200">{r.otherParty || 'N/A'}</td>
                      <td className="p-3 text-gray-400">{Math.floor((r.duration || 0) / 60)}</td>
                      <td className="p-3 text-gray-400 font-mono text-[10px]">{r.imei || 'N/A'}</td>
                      <td className="p-3 text-gray-400 font-mono text-[10px]">{r.imsi || 'N/A'}</td>
                      <td className="p-3 text-gray-400">{r.cellId ?? 'N/A'}</td>
                      <td className="p-3 text-gray-400 truncate max-w-[150px]" title={r.address}>{r.address || 'N/A'}</td>
                      <td className="p-3 text-gray-400">N/A</td>
                    </tr>
                  );
                })}
                {paginatedRecords.length === 0 && (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-gray-500 font-mono">
                      No records found in this time range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-[#2e2e2e] bg-[#1a1a1a] flex items-center justify-between text-xs font-mono text-gray-400 shrink-0">
              <div>
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredRecords.length)} of {filteredRecords.length} entries
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-[#1e1e1e] border border-[#2e2e2e] rounded hover:bg-[#2e2e2e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center px-3 font-semibold text-gray-300">
                  Page {currentPage} of {totalPages}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-[#1e1e1e] border border-[#2e2e2e] rounded hover:bg-[#2e2e2e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Charts' && <CallsChartsTab records={filteredRecords} mode={mode} />}
      {activeTab === 'Link' && <CallsLinkTab records={filteredRecords} />}
      {activeTab === 'Geo' && <CallsGeoTab records={filteredRecords} />}
      {activeTab === 'Day Vs Night' && <CallsDayVsNightTab records={records} />}
    </div>
  );
};
