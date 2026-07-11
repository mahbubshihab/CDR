import React, { useMemo, useState } from 'react';
import { Sun, Moon, Download, Camera, Printer, Maximize2 } from 'lucide-react';
import { type CDRRecord } from '../../../../utils/db';
import { TimeRangeFilter } from './TimeRangeFilter';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (mode === 'day') {
        return isTimeInRange(r.timestamp, ranges.dayStart, ranges.dayEnd);
      } else {
        return isTimeInRange(r.timestamp, ranges.nightStart, ranges.nightEnd);
      }
    });
  }, [records, mode, ranges]);

  // Aggregate by location
  const locationData = useMemo(() => {
    const map = new Map<string, number>();
    
    filteredRecords.forEach(r => {
      const loc = r.address && r.address.trim() !== '' ? r.address : 'Unknown Location';
      map.set(loc, (map.get(loc) || 0) + 1);
    });
    
    return Array.from(map.entries())
      .map(([address, visits]) => ({ address, visits }))
      .sort((a, b) => b.visits - a.visits);
  }, [filteredRecords]);

  const stats = useMemo(() => {
    const visits = filteredRecords.length;
    const locations = locationData.length;
    const allEvents = records.length;
    const share = allEvents > 0 ? ((visits / allEvents) * 100).toFixed(1) : '0.0';
    
    return { visits, locations, allEvents, share };
  }, [filteredRecords, locationData, records]);

  const Icon = mode === 'day' ? Sun : Moon;
  const title = mode === 'day' ? 'Day Locations' : 'Night Locations';
  const subtitle = mode === 'day' 
    ? 'Sirf day time window ke events dikhaye jate hain — Location Summary se kam hona normal hai. Neeche time range badal kar zyada data include kar sakte hain.'
    : 'Sirf night time window ke events dikhaye jate hain — Location Summary se kam hona normal hai. Neeche time range badal kar zyada data include kar sakte hain.';

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a] p-6 custom-scrollbar overflow-y-auto">
      {/* Header */}
      <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-5 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Icon className={`w-6 h-6 ${mode === 'day' ? 'text-yellow-400' : 'text-blue-400'}`} />
          <h1 className="text-xl font-bold text-white">{title}</h1>
        </div>
        <p className="text-xs text-gray-500 mb-6 font-mono">{subtitle}</p>

        <TimeRangeFilter onApply={setRanges} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-6 text-center">
          <div className="text-2xl font-bold text-gray-200 mb-1">{stats.visits.toLocaleString()}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">{mode === 'day' ? 'Day' : 'Night'} Visits</div>
        </div>
        <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-6 text-center">
          <div className="text-2xl font-bold text-gray-200 mb-1">{stats.locations.toLocaleString()}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Locations</div>
        </div>
        <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-6 text-center">
          <div className="text-2xl font-bold text-gray-200 mb-1">{stats.allEvents.toLocaleString()}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">All CDR Events</div>
        </div>
        <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-6 text-center">
          <div className="text-2xl font-bold text-gray-200 mb-1">{stats.share}%</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">{mode === 'day' ? 'Day' : 'Night'} Share</div>
        </div>
      </div>

      {/* Location Frequency Chart */}
      <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-6 flex-1 flex flex-col min-h-[400px]">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-semibold text-gray-300">Location Frequency</h3>
          <div className="flex gap-3">
            <Download className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" />
            <Camera className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" />
            <Printer className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" />
            <Maximize2 className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" />
          </div>
        </div>
        
        <div className="flex-1 w-full relative">
          {locationData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationData.slice(0, 20)} margin={{ top: 10, right: 10, left: -20, bottom: 60 }}>
                <XAxis 
                  dataKey="address" 
                  stroke="#4b5563" 
                  fontSize={10} 
                  tickMargin={30} 
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis stroke="#4b5563" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#2e2e2e', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: mode === 'day' ? '#facc15' : '#60a5fa' }}
                  cursor={{ fill: '#ffffff10' }}
                />
                <Bar 
                  dataKey="visits" 
                  fill={mode === 'day' ? '#facc15' : '#60a5fa'} 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-mono text-sm">
              No locations found in this time range.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
