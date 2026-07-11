import React, { useState, useMemo, useEffect, useRef } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { Search, Users, ArrowDownLeft, ArrowUpRight, MessageSquare, Clock, Phone, Download, Camera, Printer, Maximize2, MapPin, Filter, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
// @ts-ignore - vis-network types might be missing
import { Network } from 'vis-network';

interface LocationIntelligenceProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

interface LocationData {
  address: string;
  records: CDRRecord[];
  events: number;
  uniqueNumbers: Set<string>;
  durationSec: number;
  inCalls: number;
  outCalls: number;
  sms: number;
}

export const LocationIntelligence: React.FC<LocationIntelligenceProps> = ({ cdrFile, records }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLocation, setActiveLocation] = useState<string | null>(null);

  const [topContactSearchTerm, setTopContactSearchTerm] = useState('');
  const [activitySearchTerm, setActivitySearchTerm] = useState('');

  // Pagination for Activity Records table
  const [activityPage, setActivityPage] = useState(1);
  const rowsPerPage = 300;

  // Group records by location
  const locationsMap = useMemo(() => {
    const map = new Map<string, LocationData>();
    
    for (const r of records) {
      const loc = r.address && r.address.trim() !== '' ? r.address : 'Unknown';
      if (!map.has(loc)) {
        map.set(loc, {
          address: loc,
          records: [],
          events: 0,
          uniqueNumbers: new Set<string>(),
          durationSec: 0,
          inCalls: 0,
          outCalls: 0,
          sms: 0,
        });
      }
      
      const locData = map.get(loc)!;
      locData.records.push(r);
      locData.events += 1;
      if (r.otherParty) {
        locData.uniqueNumbers.add(r.otherParty);
      }
      locData.durationSec += r.duration || 0;
      
      if (r.usageType === 'Incoming') locData.inCalls += 1;
      else if (r.usageType === 'Outgoing') locData.outCalls += 1;
      else if (r.usageType === 'SMS') locData.sms += 1;
    }
    
    return map;
  }, [records]);

  const locationList = useMemo(() => {
    return Array.from(locationsMap.values())
      .sort((a, b) => b.events - a.events);
  }, [locationsMap]);

  const filteredLocations = useMemo(() => {
    if (!searchTerm) return locationList;
    const term = searchTerm.toLowerCase();
    return locationList.filter(l => l.address.toLowerCase().includes(term));
  }, [locationList, searchTerm]);

  // Select first location by default
  useEffect(() => {
    if (!activeLocation && filteredLocations.length > 0) {
      setActiveLocation(filteredLocations[0].address);
    }
  }, [filteredLocations, activeLocation]);

  const activeData = activeLocation ? locationsMap.get(activeLocation) : null;

  // Process data for charts
  const hourlyData = useMemo(() => {
    if (!activeData) return [];
    const hours = Array(24).fill(0).map((_, i) => ({ hour: String(i).padStart(2, '0') + ':00', events: 0 }));
    activeData.records.forEach(r => {
      if (r.timestamp) {
        const h = new Date(r.timestamp).getHours();
        hours[h].events += 1;
      }
    });
    return hours;
  }, [activeData]);

  const dayNightData = useMemo(() => {
    if (!activeData) return [];
    let day = 0;
    let night = 0;
    activeData.records.forEach(r => {
      if (r.timestamp) {
        const h = new Date(r.timestamp).getHours();
        if (h >= 6 && h < 18) day += 1;
        else night += 1;
      }
    });
    const total = day + night;
    return [
      { name: 'Day (06-18)', value: day, share: total > 0 ? (day/total)*100 : 0, color: '#10b981' }, 
      { name: 'Night (18-06)', value: night, share: total > 0 ? (night/total)*100 : 0, color: '#3b82f6' }
    ];
  }, [activeData]);

  // Top Contacted Numbers
  const topContactedNumbers = useMemo(() => {
    if (!activeData) return [];
    const stats = new Map<string, { inCalls: number, outCalls: number, sms: number, duration: number, total: number }>();
    activeData.records.forEach(r => {
      const num = r.otherParty;
      if (!num) return;
      if (!stats.has(num)) {
        stats.set(num, { inCalls: 0, outCalls: 0, sms: 0, duration: 0, total: 0 });
      }
      const s = stats.get(num)!;
      s.total += 1;
      s.duration += r.duration || 0;
      if (r.usageType === 'Incoming') s.inCalls += 1;
      if (r.usageType === 'Outgoing') s.outCalls += 1;
      if (r.usageType === 'SMS') s.sms += 1;
    });
    return Array.from(stats.entries())
      .map(([number, data]) => ({ number, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [activeData]);

  // Network graph ref
  const networkRef = useRef<HTMLDivElement>(null);
  const networkInstance = useRef<any>(null);

  useEffect(() => {
    if (networkRef.current && activeData) {
      const nodes = new Map();
      const edges = new Map();
      
      // Target node (center)
      nodes.set('center', { 
        id: 'center', 
        label: activeData.address, 
        color: '#3b82f6', 
        shape: 'dot', 
        size: 30,
        font: { color: '#ffffff' }
      });
      
      // Top 30 contacts for visibility
      const topContacts = topContactedNumbers.slice(0, 30);
      topContacts.forEach(contact => {
        const num = contact.number;
        const heat = Math.min(contact.total * 2, 25);
        nodes.set(num, { 
          id: num, 
          label: num, 
          color: '#10b981', 
          shape: 'dot', 
          size: 10 + heat,
          font: { color: '#a3a3a3' }
        });
        edges.set(`center-${num}`, { 
          from: 'center', 
          to: num, 
          color: { color: '#2e2e2e', highlight: '#3ecf8e' },
          width: Math.max(1, heat / 5)
        });
      });

      const data = {
        nodes: Array.from(nodes.values()),
        edges: Array.from(edges.values())
      };
      
      const options = {
        nodes: { borderWidth: 0 },
        edges: { smooth: true },
        physics: { 
          stabilization: false, 
          barnesHut: { springLength: 150, springConstant: 0.05 } 
        },
        interaction: { hover: true }
      };

      if (networkInstance.current) {
        networkInstance.current.setData(data);
      } else {
        networkInstance.current = new Network(networkRef.current, data, options);
        networkInstance.current.on('zoom', function (params: any) {
          if (params.scale < 0.5) {
            networkInstance.current.moveTo({ scale: 0.55 });
          }
        });
      }
    }
  }, [activeData, topContactedNumbers]);

  const handleZoomIn = () => {
    if (networkInstance.current) {
      networkInstance.current.moveTo({ scale: networkInstance.current.getScale() * 1.5, animation: true });
    }
  };

  const handleZoomOut = () => {
    if (networkInstance.current) {
      const newScale = Math.max(0.55, networkInstance.current.getScale() / 1.5);
      networkInstance.current.moveTo({ scale: newScale, animation: true });
    }
  };

  const handleResetZoom = () => {
    if (networkInstance.current) {
      networkInstance.current.fit({ animation: true });
    }
  };

  const formatDateTime = (ts?: number) => {
    if (!ts) return 'N/A';
    try {
      const d = new Date(ts);
      return d.toISOString().replace('T', ' ').substring(0, 19);
    } catch (_) {
      return 'N/A';
    }
  };

  if (!activeData) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500 font-mono text-xs bg-[#121212]">
        No location data available.
      </div>
    );
  }

  const filteredTopContactedNumbers = useMemo(() => {
    if (!topContactSearchTerm) return topContactedNumbers;
    const term = topContactSearchTerm.toLowerCase();
    return topContactedNumbers.filter(c => c.number.toLowerCase().includes(term));
  }, [topContactedNumbers, topContactSearchTerm]);

  const filteredActivityRecords = useMemo(() => {
    if (!activeData) return [];
    if (!activitySearchTerm) return activeData.records;
    const term = activitySearchTerm.toLowerCase();
    return activeData.records.filter(r => 
      (r.otherParty && r.otherParty.toLowerCase().includes(term)) ||
      (r.usageType && r.usageType.toLowerCase().includes(term))
    );
  }, [activeData, activitySearchTerm]);

  const paginatedActivity = filteredActivityRecords.slice((activityPage - 1) * rowsPerPage, activityPage * rowsPerPage);
  const totalActivityPages = Math.ceil(filteredActivityRecords.length / rowsPerPage);

  return (
    <div className="w-full h-full bg-[#0a0a0a] text-left flex animate-in fade-in duration-300">
      
      {/* LEFT SIDEBAR: Locations List */}
      <div className="w-[340px] flex-shrink-0 bg-[#121212] border-r border-[#2e2e2e] flex flex-col">
        <div className="p-4 border-b border-[#2e2e2e]">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-md pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#3ecf8e]"
            />
          </div>
          <div className="text-[10px] text-gray-500 mt-2">{filteredLocations.length} locations</div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredLocations.map((loc, idx) => {
            const isActive = activeLocation === loc.address;
            return (
              <div 
                key={idx}
                onClick={() => setActiveLocation(loc.address)}
                className={`p-4 border-b border-[#2e2e2e]/50 cursor-pointer transition-colors ${
                  isActive 
                    ? 'bg-[#1e1e1e] border-l-2 border-l-[#3ecf8e]' 
                    : 'hover:bg-[#1a1a1a] border-l-2 border-l-transparent'
                }`}
              >
                <h3 className="text-sm font-semibold text-gray-200 mb-1 leading-snug break-words">
                  {loc.address}
                </h3>
                <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono">
                  <span>{loc.events} events</span>
                  <span>{loc.uniqueNumbers.size} numbers</span>
                  <span>{Math.floor(loc.durationSec / 60)} min</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL: Details Dashboard */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0a0a0a] custom-scrollbar">
        
        {/* Header Title */}
        <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#3ecf8e]" />
          {activeData.address}
        </h2>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-6 gap-4">
          {[
            { label: 'Connected Numbers', value: activeData.uniqueNumbers.size, icon: Users, color: 'text-blue-400' },
            { label: 'Incoming Calls', value: activeData.inCalls, icon: ArrowDownLeft, color: 'text-green-400' },
            { label: 'Outgoing Calls', value: activeData.outCalls, icon: ArrowUpRight, color: 'text-purple-400' },
            { label: 'SMS', value: activeData.sms, icon: MessageSquare, color: 'text-yellow-400' },
            { label: 'Duration (min)', value: Math.floor(activeData.durationSec / 60), icon: Clock, color: 'text-orange-400' },
            { label: 'Total Activity', value: activeData.events, icon: Phone, color: 'text-gray-300' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <stat.icon className={`w-5 h-5 mb-2 ${stat.color}`} />
              <div className="text-xl font-bold text-gray-100">{stat.value.toLocaleString()}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters Box */}
        <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-gray-400">
            <Filter className="w-4 h-4" />
            Location View Filters
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="relative">
                <input type="text" placeholder="dd/mm/yyyy" className="bg-[#1e1e1e] border border-[#2e2e2e] rounded p-2 pr-8 text-xs text-white w-full" />
                <Calendar className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <div className="relative">
                <input type="text" placeholder="dd/mm/yyyy" className="bg-[#1e1e1e] border border-[#2e2e2e] rounded p-2 pr-8 text-xs text-white w-full" />
                <Calendar className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <div className="relative">
                <input type="text" placeholder="--:-- --" className="bg-[#1e1e1e] border border-[#2e2e2e] rounded p-2 pr-8 text-xs text-white w-full" />
                <Clock className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <div className="relative">
                <input type="text" placeholder="--:-- --" className="bg-[#1e1e1e] border border-[#2e2e2e] rounded p-2 pr-8 text-xs text-white w-full" />
                <Clock className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-4">
              <input type="text" placeholder="Caller / Number" className="bg-[#1e1e1e] border border-[#2e2e2e] rounded p-2 text-xs text-white w-full" />
              <input type="text" placeholder="Receiver" className="bg-[#1e1e1e] border border-[#2e2e2e] rounded p-2 text-xs text-white w-full" />
              <select className="bg-[#1e1e1e] border border-[#2e2e2e] rounded p-2 text-xs text-white w-full">
                <option>All Types</option>
              </select>
              <input type="text" placeholder="Min sec" className="bg-[#1e1e1e] border border-[#2e2e2e] rounded p-2 text-xs text-white w-full" />
              <input type="text" placeholder="Max sec" className="bg-[#1e1e1e] border border-[#2e2e2e] rounded p-2 text-xs text-white w-full" />
            </div>
            <div>
              <button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded px-6 py-2 text-xs font-semibold">
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Hourly Activity */}
          <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-semibold text-gray-300">Hourly Activity</h3>
              <div className="flex gap-2">
                <Download className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" />
                <Camera className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" />
                <Printer className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" />
                <Maximize2 className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" />
              </div>
            </div>
            <div className="flex justify-around mb-6 border-b border-[#2e2e2e] pb-4">
              <div className="text-center">
                <div className="text-[10px] text-gray-500 uppercase">Total Events</div>
                <div className="text-lg font-bold text-gray-200">{activeData.events.toLocaleString()}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-gray-500 uppercase">Active Hours</div>
                <div className="text-lg font-bold text-gray-200">
                  {hourlyData.filter(d => d.events > 0).length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-gray-500 uppercase">Peak Hour</div>
                <div className="text-lg font-bold text-gray-200">
                  {hourlyData.reduce((prev, current) => (prev.events > current.events) ? prev : current).hour}
                  <span className="text-xs text-gray-500 ml-1">
                    ({hourlyData.reduce((prev, current) => (prev.events > current.events) ? prev : current).events})
                  </span>
                </div>
              </div>
            </div>
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="hour" stroke="#4b5563" fontSize={10} tickMargin={10} />
                  <YAxis stroke="#4b5563" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#2e2e2e', color: '#fff', fontSize: '12px' }}
                    itemStyle={{ color: '#3ecf8e' }}
                  />
                  <Bar dataKey="events" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar bg-[#0a0a0a] rounded border border-[#2e2e2e] mt-2 max-h-[250px] flex flex-col">
              <table className="w-full text-left text-xs whitespace-nowrap flex-1">
                <thead className="bg-[#1e1e1e] sticky top-0 z-10 shadow-[0_1px_0_#2e2e2e]">
                  <tr>
                    <th className="p-2 text-gray-400 font-semibold">Hour</th>
                    <th className="p-2 text-gray-400 font-semibold text-right">Events</th>
                    <th className="p-2 text-gray-400 font-semibold text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2e2e2e]">
                  {hourlyData.filter(d => d.events > 0).map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#1a1a1a]">
                      <td className="p-2 font-mono text-gray-300">{row.hour}</td>
                      <td className="p-2 font-mono text-gray-200 font-bold text-right">{row.events.toLocaleString()}</td>
                      <td className="p-2 font-mono text-blue-400 text-right">{activeData.events > 0 ? ((row.events / activeData.events) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-2 text-[10px] text-gray-500 text-right border-t border-[#2e2e2e] sticky bottom-0 bg-[#0a0a0a] z-10">
                Total: 100.0%
              </div>
            </div>
          </div>

          {/* Day vs Night */}
          <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-5">
             <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-semibold text-gray-300">Day vs Night</h3>
              <div className="flex gap-2">
                <Download className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" />
                <Camera className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" />
                <Printer className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" />
                <Maximize2 className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" />
              </div>
            </div>
            <div className="flex h-48 items-center mb-4">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dayNightData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {dayNightData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#2e2e2e', color: '#fff', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 flex flex-col gap-4">
                {dayNightData.map((d, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                      <span className="text-gray-300">{d.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-gray-200">{d.value.toLocaleString()}</div>
                      <div className="text-[10px] text-gray-500">{d.share.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar bg-[#0a0a0a] rounded border border-[#2e2e2e] mt-2 max-h-[250px] flex flex-col">
              <table className="w-full text-left text-xs whitespace-nowrap flex-1">
                <thead className="bg-[#1e1e1e] sticky top-0 z-10 shadow-[0_1px_0_#2e2e2e]">
                  <tr>
                    <th className="p-2 text-gray-400 font-semibold">Period</th>
                    <th className="p-2 text-gray-400 font-semibold text-right">Events</th>
                    <th className="p-2 text-gray-400 font-semibold text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2e2e2e]">
                  {dayNightData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#1a1a1a]">
                      <td className="p-2 font-mono text-gray-300">{row.name}</td>
                      <td className="p-2 font-mono text-gray-200 font-bold text-right">{row.value.toLocaleString()}</td>
                      <td className="p-2 font-mono text-blue-400 text-right">{row.share.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-2 text-[10px] text-gray-500 text-right border-t border-[#2e2e2e] sticky bottom-0 bg-[#0a0a0a] z-10">
                Total: 100.0%
              </div>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-5">
           <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-semibold text-gray-300">Activity Timeline</h3>
            <div className="flex gap-2">
              <Download className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" />
              <Camera className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" />
              <Printer className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" />
              <Maximize2 className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" />
            </div>
          </div>
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="hour" stroke="#4b5563" fontSize={10} tickMargin={10} />
                <YAxis stroke="#4b5563" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#2e2e2e', color: '#fff', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="events" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="overflow-y-auto custom-scrollbar bg-[#0a0a0a] rounded border border-[#2e2e2e] mt-2 max-h-[250px]">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#1e1e1e] sticky top-0 z-10 shadow-[0_1px_0_#2e2e2e]">
                <tr>
                  <th className="p-2 text-gray-400 font-semibold">Date</th>
                  <th className="p-2 text-gray-400 font-semibold text-right">Events</th>
                  <th className="p-2 text-gray-400 font-semibold text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e2e]">
                {hourlyData.filter(d => d.events > 0).map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#1a1a1a]">
                    <td className="p-2 font-mono text-gray-300">2026-01-05</td> {/* Placeholder date */}
                    <td className="p-2 font-mono text-gray-200 font-bold text-right">{row.events.toLocaleString()}</td>
                    <td className="p-2 font-mono text-blue-400 text-right">-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Network Graph & Top Contacted */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-5 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-gray-300">Location Network Graph</h3>
                <span className="text-[10px] text-gray-500">Center = location • Connected nodes = phone numbers • Color = activity heat</span>
              </div>
              <div className="flex gap-2">
                <button onClick={handleZoomIn} className="text-gray-400 hover:text-white px-2 py-1 rounded bg-[#1e1e1e] border border-[#2e2e2e]">+</button>
                <button onClick={handleZoomOut} className="text-gray-400 hover:text-white px-2 py-1 rounded bg-[#1e1e1e] border border-[#2e2e2e]">-</button>
                <button onClick={handleResetZoom} className="text-gray-400 hover:text-white px-2 py-1 rounded bg-[#1e1e1e] border border-[#2e2e2e]">↺</button>
              </div>
            </div>
            <div ref={networkRef} className="flex-1 bg-[#0a0a0a] rounded-lg h-[400px] min-h-[400px] border border-[#2e2e2e] relative overflow-hidden"></div>
          </div>

          <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#2e2e2e] flex flex-col">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Top Contacted Numbers</h3>
              <div className="flex justify-between items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3 h-3 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={topContactSearchTerm}
                    onChange={(e) => setTopContactSearchTerm(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <button className="bg-[#1e1e1e] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white hover:bg-[#2e2e2e]">Columns</button>
                  <span className="text-[10px] text-gray-500">{filteredTopContactedNumbers.length} rows</span>
                </div>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 custom-scrollbar min-h-[300px] max-h-[300px]">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-[#1e1e1e] sticky top-0 z-10 shadow-[0_1px_0_#2e2e2e]">
                  <tr>
                    <th className="p-3 text-gray-400 font-semibold">Number</th>
                    <th className="p-3 text-gray-400 font-semibold text-center">In Calls</th>
                    <th className="p-3 text-gray-400 font-semibold text-center">Out Calls</th>
                    <th className="p-3 text-gray-400 font-semibold text-center">SMS</th>
                    <th className="p-3 text-gray-400 font-semibold text-center">Minutes</th>
                    <th className="p-3 text-gray-400 font-semibold">Most Contacted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2e2e2e]">
                  {filteredTopContactedNumbers.slice(0, 50).map((row, idx) => {
                    const maxTotal = filteredTopContactedNumbers.length > 0 ? filteredTopContactedNumbers[0].total : 1;
                    const barWidth = Math.max(2, (row.total / maxTotal) * 100);
                    return (
                      <tr key={idx} className="hover:bg-[#1a1a1a]">
                        <td className="p-3 font-mono text-[#3ecf8e]">{row.number}</td>
                        <td className="p-3 font-mono text-center">{row.inCalls}</td>
                        <td className="p-3 font-mono text-center">{row.outCalls}</td>
                        <td className="p-3 font-mono text-center">{row.sms}</td>
                        <td className="p-3 font-mono text-center">{Math.floor(row.duration / 60)}</td>
                        <td className="p-3 w-48">
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-[#1e1e1e] h-1.5 rounded-full overflow-hidden">
                              <div className="bg-[#3b82f6] h-full rounded-full" style={{ width: `${barWidth}%` }}></div>
                            </div>
                            <span className="text-[10px] text-gray-500 w-8 text-right">{row.total}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Activity Records Table */}
        <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#2e2e2e] flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-300">Activity Records ({filteredActivityRecords.length})</h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Search..." 
                value={activitySearchTerm}
                onChange={(e) => {
                  setActivitySearchTerm(e.target.value);
                  setActivityPage(1);
                }}
                className="bg-[#1e1e1e] border border-[#2e2e2e] rounded px-3 py-1 text-xs text-white" 
              />
              <button className="bg-[#1e1e1e] border border-[#2e2e2e] rounded px-3 py-1 text-xs text-white">Columns</button>
            </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar max-h-[400px]">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#1e1e1e] sticky top-0">
                <tr>
                  <th className="p-3 text-gray-400 font-semibold">Caller</th>
                  <th className="p-3 text-gray-400 font-semibold">Receiver</th>
                  <th className="p-3 text-gray-400 font-semibold">Timestamp</th>
                  <th className="p-3 text-gray-400 font-semibold">Type</th>
                  <th className="p-3 text-gray-400 font-semibold">Duration (s)</th>
                  <th className="p-3 text-gray-400 font-semibold">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e2e]">
                {paginatedActivity.map((r, idx) => {
                  const isIncoming = r.usageType?.includes('Incoming') || r.usageType?.includes('MTC');
                  const caller = isIncoming ? r.otherParty : cdrFile.phoneNumber;
                  const receiver = isIncoming ? cdrFile.phoneNumber : r.otherParty;
                  return (
                    <tr key={idx} className="hover:bg-[#1a1a1a]">
                      <td className="p-3 font-mono text-gray-300">{caller || 'N/A'}</td>
                      <td className="p-3 font-mono text-gray-300">{receiver || 'N/A'}</td>
                      <td className="p-3 font-mono text-gray-400">{formatDateTime(r.timestamp)}</td>
                      <td className="p-3 font-mono text-gray-300">{r.usageType || 'N/A'}</td>
                      <td className="p-3 font-mono text-gray-300">{r.duration || 0}</td>
                      <td className="p-3 font-mono text-gray-300">{r.address || 'N/A'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-[#2e2e2e] bg-[#171717] flex justify-center items-center gap-4 text-xs">
            <button 
              onClick={() => setActivityPage(p => Math.max(1, p - 1))}
              disabled={activityPage === 1}
              className="px-4 py-1.5 bg-[#121212] border border-[#2e2e2e] rounded-md text-gray-300 disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-gray-400 font-mono">
              Page {activityPage} / {Math.max(1, totalActivityPages)}
            </span>
            <button 
              onClick={() => setActivityPage(p => Math.min(totalActivityPages, p + 1))}
              disabled={activityPage === totalActivityPages || totalActivityPages === 0}
              className="px-4 py-1.5 bg-[#121212] border border-[#2e2e2e] rounded-md text-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
