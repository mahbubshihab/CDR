import React, { useState, useMemo, useEffect } from 'react';
import { 
  Download, FileSpreadsheet, FileText, Printer, Map as MapIcon, Image as ImageIcon, 
  Play, Pause, RotateCcw, SkipBack, SkipForward, Route, Calendar, Clock, MapPin, 
  Target, Radio, Smartphone, Check, X, ShieldAlert, Navigation, Compass, Layers,
  ChevronLeft, ChevronRight, Activity, PieChart as PieChartIcon, BarChart2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { DateTimeInput } from '../../../../components/ui/DateTimeInput';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MovementChartProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

export function MovementChart({ cdrFile, records }: MovementChartProps) {
  // Check if any records have lat/lng fields
  const hasCoordinates = useMemo(() => {
    return records.some((r: any) => r.latitude != null && r.longitude != null);
  }, [records]);

  // Filters State
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    timeFrom: '',
    timeTo: '',
    location: '',
    cellId: '',
    minDistance: '',
    maxDistance: '',
    minActivities: '',
    minStop: '',
    callType: 'All',
    imei: '',
    imsi: '',
    dayOnly: false,
    nightOnly: false
  });

  const [isDateTimeModalOpen, setIsDateTimeModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'timeline' | 'table' | 'insights'>('map');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Filter records based on criteria
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Date Filter
      if (filters.startDate) {
        const rDate = new Date(r.timestamp);
        const sDate = new Date(filters.startDate);
        if (rDate < sDate) return false;
      }
      if (filters.endDate) {
        const rDate = new Date(r.timestamp);
        const eDate = new Date(filters.endDate);
        eDate.setHours(23, 59, 59, 999);
        if (rDate > eDate) return false;
      }
      
      // Time Filter
      if (filters.timeFrom || filters.timeTo) {
        const rDate = new Date(r.timestamp);
        const rHours = rDate.getHours();
        const rMins = rDate.getMinutes();
        const rTimeVal = rHours * 60 + rMins;
        
        if (filters.timeFrom) {
          const [h, m] = filters.timeFrom.split(':').map(Number);
          if (rTimeVal < h * 60 + m) return false;
        }
        if (filters.timeTo) {
          const [h, m] = filters.timeTo.split(':').map(Number);
          if (rTimeVal > h * 60 + m) return false;
        }
      }

      // Location & Tower
      if (filters.location && r.address && !r.address.toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.cellId && r.cellId && !String(r.cellId).toLowerCase().includes(filters.cellId.toLowerCase())) return false;

      // Call Type
      if (filters.callType !== 'All' && r.usageType !== filters.callType) return false;

      // Day / Night Only (Day = 06:00 to 18:00)
      if (filters.dayOnly || filters.nightOnly) {
        const rDate = new Date(r.timestamp);
        const rHours = rDate.getHours();
        const isDay = rHours >= 6 && rHours < 18;
        if (filters.dayOnly && !isDay) return false;
        if (filters.nightOnly && isDay) return false;
      }

      return true;
    }).sort((a, b) => a.timestamp - b.timestamp);
  }, [records, filters]);

  // Extract coords for the route
  const routePoints = useMemo(() => {
    if (!hasCoordinates) return [];
    return filteredRecords
      .filter((r: any) => r.latitude != null && r.longitude != null)
      .map((r: any) => [r.latitude, r.longitude] as [number, number]);
  }, [filteredRecords, hasCoordinates]);

  // Metrics
  const uniqueLocations = new Set(filteredRecords.map(r => r.address).filter(Boolean)).size;
  const totalMovements = routePoints.length > 1 ? routePoints.length - 1 : 0;
  
  // Handlers
  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setPlaybackIndex(0);
  };

  // Playback Effect
  useEffect(() => {
    let interval: any;
    if (isPlaying && playbackIndex < routePoints.length - 1) {
      interval = setInterval(() => {
        setPlaybackIndex(prev => {
          if (prev >= routePoints.length - 2) {
            setIsPlaying(false);
            return routePoints.length - 1;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackIndex, routePoints.length, playbackSpeed]);

  return (
    <div className="w-full flex flex-col gap-6 p-6 pb-10 bg-[#0a0a0a] overflow-y-auto custom-scrollbar relative">
      {/* 1. Header & Top Metrics */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
          <Route className="h-5 w-5 text-[#3ecf8e]" />
          Movement Intelligence
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <MetricCard title="Locations" value={uniqueLocations.toString()} icon={<MapPin className="h-4 w-4" />} />
          <MetricCard title="Movements" value={totalMovements.toString()} icon={<Navigation className="h-4 w-4" />} />
          <MetricCard title="Total Distance" value={hasCoordinates ? "0 km" : 'N/A'} icon={<Compass className="h-4 w-4" />} />
          <MetricCard title="Travel Time" value={hasCoordinates ? "0h 0m" : 'N/A'} icon={<Clock className="h-4 w-4" />} />
          <MetricCard title="Longest Stop" value={hasCoordinates ? "0h 0m" : 'N/A'} icon={<Target className="h-4 w-4" />} />
        </div>
      </div>

      {/* 2. Filters Panel */}
      <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl flex flex-col shadow-lg shrink-0">
        <div className="p-3 border-b border-[#2e2e2e] flex items-center gap-2 text-gray-200 bg-[#171717] rounded-t-xl">
          <Layers className="h-4 w-4 text-[#3ecf8e]" />
          <h3 className="font-semibold text-xs tracking-wider uppercase">Movement Intelligence Filters</h3>
        </div>
        
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-xs">
          
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label className="text-gray-400 font-medium">Date & Time Range</label>
            <button 
              onClick={() => setIsDateTimeModalOpen(true)}
              className="bg-[#1a1a1a] border border-[#333] hover:border-[#3ecf8e] hover:text-white text-gray-300 rounded px-3 py-1.5 w-full text-left flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-[#3ecf8e]" />
                <span className="truncate">
                  {filters.startDate || filters.endDate || filters.timeFrom || filters.timeTo 
                    ? 'Custom Range Applied' 
                    : 'Select Date & Time...'}
                </span>
              </div>
            </button>
          </div>

          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label className="text-gray-400 font-medium">Location</label>
            <input type="text" value={filters.location} onChange={e => handleFilterChange('location', e.target.value)} placeholder="Search area..." className="bg-[#1a1a1a] border border-[#333] text-gray-200 rounded px-2 py-1.5 w-full outline-none focus:border-[#3ecf8e]" />
          </div>

          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label className="text-gray-400 font-medium">Tower / Cell ID</label>
            <input type="text" value={filters.cellId} onChange={e => handleFilterChange('cellId', e.target.value)} placeholder="E.g. 12345" className="bg-[#1a1a1a] border border-[#333] text-gray-200 rounded px-2 py-1.5 w-full outline-none focus:border-[#3ecf8e]" />
          </div>
          
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label className="text-gray-400 font-medium">Distance (Min - Max)</label>
            <div className="flex items-center gap-2">
              <input type="number" value={filters.minDistance} onChange={e => handleFilterChange('minDistance', e.target.value)} placeholder="Min" className="bg-[#1a1a1a] border border-[#333] text-gray-200 rounded px-2 py-1.5 w-full outline-none focus:border-[#3ecf8e]" />
              <input type="number" value={filters.maxDistance} onChange={e => handleFilterChange('maxDistance', e.target.value)} placeholder="Max" className="bg-[#1a1a1a] border border-[#333] text-gray-200 rounded px-2 py-1.5 w-full outline-none focus:border-[#3ecf8e]" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label className="text-gray-400 font-medium">Thresholds</label>
            <div className="flex items-center gap-2">
              <input type="number" value={filters.minActivities} onChange={e => handleFilterChange('minActivities', e.target.value)} placeholder="Min Acts" className="bg-[#1a1a1a] border border-[#333] text-gray-200 rounded px-2 py-1.5 w-full outline-none focus:border-[#3ecf8e]" title="Min Activities" />
              <input type="number" value={filters.minStop} onChange={e => handleFilterChange('minStop', e.target.value)} placeholder="Min Stop (m)" className="bg-[#1a1a1a] border border-[#333] text-gray-200 rounded px-2 py-1.5 w-full outline-none focus:border-[#3ecf8e]" title="Min Stop Time" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-gray-400 font-medium">Call Type</label>
            <select value={filters.callType} onChange={e => handleFilterChange('callType', e.target.value)} className="bg-[#1a1a1a] border border-[#333] text-gray-200 rounded px-2 py-1.5 w-full outline-none focus:border-[#3ecf8e]">
              <option>All</option>
              <option>MOC</option>
              <option>MTC</option>
              <option>SMS_MOC</option>
              <option>SMS_MTC</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-gray-400 font-medium">Time Context</label>
            <div className="flex flex-col gap-1.5 mt-1">
              <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white">
                <input type="checkbox" className="accent-[#3ecf8e]" checked={filters.dayOnly} onChange={e => handleFilterChange('dayOnly', e.target.checked)} />
                <span>Day Only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white">
                <input type="checkbox" className="accent-[#3ecf8e]" checked={filters.nightOnly} onChange={e => handleFilterChange('nightOnly', e.target.checked)} />
                <span>Night Only</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Toolbar & Views */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
        <div className="flex bg-[#121212] rounded-lg p-1 border border-[#2e2e2e]">
          <TabButton active={activeTab === 'map'} onClick={() => setActiveTab('map')} icon={<MapIcon className="h-4 w-4" />} label="Map & Playback" />
          <TabButton active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} icon={<Clock className="h-4 w-4" />} label="Timeline" />
          <TabButton active={activeTab === 'table'} onClick={() => setActiveTab('table')} icon={<FileText className="h-4 w-4" />} label="Movement Table" />
          <TabButton active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} icon={<ShieldAlert className="h-4 w-4" />} label="Insights" />
        </div>
        
        <div className="flex flex-wrap gap-2 text-xs font-sans">
          <ExportButton icon={<Download className="h-3.5 w-3.5" />} label="CSV" />
          <ExportButton icon={<FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />} label="Excel" />
          <ExportButton icon={<FileText className="h-3.5 w-3.5 text-red-500" />} label="PDF" />
          <ExportButton icon={<MapIcon className="h-3.5 w-3.5 text-blue-500" />} label="KML" />
          <ExportButton icon={<MapIcon className="h-3.5 w-3.5 text-purple-500" />} label="KMZ" />
          <ExportButton icon={<ImageIcon className="h-3.5 w-3.5 text-amber-500" />} label="Screenshot" />
        </div>
      </div>

      {/* 4. Main Views Container */}
      
      {activeTab === 'map' && (
        <MapView 
          hasCoordinates={hasCoordinates}
          routePoints={routePoints}
          playbackIndex={playbackIndex}
          setPlaybackIndex={setPlaybackIndex}
          isPlaying={isPlaying}
          handlePlayPause={handlePlayPause}
          handleReset={handleReset}
          playbackSpeed={playbackSpeed}
          setPlaybackSpeed={setPlaybackSpeed}
        />
      )}

      {activeTab === 'timeline' && <TimelineView records={filteredRecords} />}
      {activeTab === 'table' && <TableView records={filteredRecords} />}
      {activeTab === 'insights' && <InsightsView records={filteredRecords} />}

      {/* Date Time Modal Overlay */}
      {isDateTimeModalOpen && (
        <DateTimeModal 
          currentFilters={filters}
          onApply={(newFilters) => {
            setFilters(prev => ({ ...prev, ...newFilters }));
            setIsDateTimeModalOpen(false);
          }}
          onClose={() => setIsDateTimeModalOpen(false)}
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Subcomponents & Views
// -----------------------------------------------------------------------------

function MapView({ 
  hasCoordinates, routePoints, playbackIndex, setPlaybackIndex, 
  isPlaying, handlePlayPause, handleReset, playbackSpeed, setPlaybackSpeed 
}: any) {
  return (
    <>
      {!hasCoordinates ? (
        <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl flex flex-col items-center justify-center p-16 text-center shrink-0 min-h-[400px]">
          <MapIcon className="h-16 w-16 text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-300">No Location Data Available</h3>
          <p className="text-gray-500 mt-2 max-w-md">
            The uploaded CDR file does not contain latitude and longitude coordinates. 
            Movement paths and map plots cannot be generated.
          </p>
        </div>
      ) : (
        <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl flex flex-col shadow-lg overflow-hidden shrink-0">
          <div className="h-[550px] w-full relative z-0">
            <MapContainer 
              center={routePoints[0] || [23.8103, 90.4125]} 
              zoom={12} 
              style={{ height: '100%', width: '100%', background: '#121212' }}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              
              {routePoints.length > 0 && (
                <Polyline 
                  positions={routePoints.slice(0, playbackIndex + 1)} 
                  pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.7 }} 
                />
              )}
              
              {routePoints.slice(0, playbackIndex + 1).map((pos: any, idx: number) => (
                <Marker key={idx} position={pos}>
                  <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                    <span className="font-mono text-xs">Point {idx + 1}</span>
                  </Tooltip>
                </Marker>
              ))}
              <MapUpdater center={routePoints[playbackIndex] || routePoints[0] || [23.8103, 90.4125]} />
            </MapContainer>
          </div>

          {/* Playback Controls */}
          <div className="p-4 border-t border-[#2e2e2e] bg-[#171717] flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 bg-[#0a0a0a] rounded-lg p-1 border border-[#2e2e2e]">
                <button onClick={handleReset} className="p-2 hover:bg-[#2e2e2e] rounded text-gray-400 hover:text-white transition-colors cursor-pointer" title="Restart">
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button onClick={() => setPlaybackIndex(Math.max(0, playbackIndex - 1))} className="p-2 hover:bg-[#2e2e2e] rounded text-gray-400 hover:text-white transition-colors cursor-pointer" title="Previous">
                  <SkipBack className="h-4 w-4" />
                </button>
                <button onClick={handlePlayPause} className="p-2 bg-[#3ecf8e] hover:bg-[#34b37b] rounded text-black transition-colors cursor-pointer" title={isPlaying ? "Pause" : "Play"}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button onClick={() => setPlaybackIndex(Math.min(routePoints.length - 1, playbackIndex + 1))} className="p-2 hover:bg-[#2e2e2e] rounded text-gray-400 hover:text-white transition-colors cursor-pointer" title="Next">
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex flex-col gap-1 w-32 shrink-0">
                <div className="flex justify-between text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                  <span>Speed</span>
                  <span>{playbackSpeed}x</span>
                </div>
                <input 
                  type="range" 
                  min="1" max="10" 
                  value={playbackSpeed} 
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))} 
                  className="w-full h-1.5 bg-[#2e2e2e] rounded-lg appearance-none cursor-pointer accent-[#3ecf8e]"
                />
              </div>

              <div className="flex-1 flex flex-col gap-1">
                <div className="flex justify-between text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                  <span>Progress</span>
                  <span>{playbackIndex + 1} / {Math.max(1, routePoints.length)}</span>
                </div>
                <input 
                  type="range" 
                  min="0" max={Math.max(0, routePoints.length - 1)} 
                  value={playbackIndex} 
                  onChange={(e) => {
                    setPlaybackIndex(Number(e.target.value));
                    handlePlayPause();
                  }} 
                  className="w-full h-1.5 bg-[#2e2e2e] rounded-lg appearance-none cursor-pointer accent-[#3ecf8e]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Geo Intelligence — Heatmap & Route */}
      {hasCoordinates && (
        <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl flex flex-col shadow-lg shrink-0 mt-4">
          <div className="p-3 border-b border-[#2e2e2e] flex items-center justify-between bg-[#171717] rounded-t-xl">
            <div className="flex items-center gap-2 text-gray-200">
              <Compass className="h-4 w-4 text-[#3ecf8e]" />
              <h3 className="font-semibold text-xs tracking-wider uppercase">Geo Intelligence — Heatmap & Route</h3>
            </div>
            
            <div className="flex items-center gap-1.5 text-[10px]">
              <button className="px-2 py-1 bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/30 rounded cursor-pointer hover:bg-[#3ecf8e]/20 transition-colors">Route</button>
              <button className="px-2 py-1 bg-[#2e2e2e] text-gray-400 border border-[#333] rounded cursor-pointer hover:text-white transition-colors">Morning</button>
              <button className="px-2 py-1 bg-[#2e2e2e] text-gray-400 border border-[#333] rounded cursor-pointer hover:text-white transition-colors">Afternoon</button>
              <button className="px-2 py-1 bg-[#2e2e2e] text-gray-400 border border-[#333] rounded cursor-pointer hover:text-white transition-colors">Evening</button>
              <button className="px-2 py-1 bg-[#2e2e2e] text-gray-400 border border-[#333] rounded cursor-pointer hover:text-white transition-colors">Night</button>
            </div>
          </div>
          <div className="h-[400px] w-full relative z-0">
            <MapContainer 
              center={routePoints[0] || [23.8103, 90.4125]} 
              zoom={11} 
              style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" />
              {routePoints.length > 0 && (
                <Polyline 
                  positions={routePoints} 
                  pathOptions={{ color: '#ef4444', weight: 4, opacity: 0.6 }} 
                />
              )}
              {routePoints.map((pos: any, idx: number) => (
                <Marker key={idx} position={pos} opacity={0.5}></Marker>
              ))}
            </MapContainer>
          </div>
          <div className="p-3 bg-[#171717] border-t border-[#2e2e2e] text-xs font-mono text-gray-400 flex items-center justify-between">
            <span>Total Nodes: {routePoints.length}</span>
            <span>Route Distance: 0.00 km</span>
          </div>
        </div>
      )}
    </>
  );
}

function TimelineView({ records }: { records: CDRRecord[] }) {
  if (records.length === 0) return <EmptyState />;

  return (
    <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl shadow-lg p-6 min-h-[500px] w-full shrink-0">
      <div className="relative border-l-2 border-[#2e2e2e] ml-4 space-y-6">
        {records.map((r, idx) => (
          <div key={idx} className="relative pl-6">
            <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-[#3ecf8e] border-2 border-[#121212]"></div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-gray-500">{new Date(r.timestamp).toLocaleString()}</span>
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 text-sm text-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-white">{r.usageType}</span>
                  <span className="text-gray-400 text-xs">{r.duration}s</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{r.address || 'Location N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-xs mt-1">
                  <Radio className="h-3.5 w-3.5" />
                  <span>Cell ID: {r.cellId || 'N/A'} (LAC: {r.lac || 'N/A'})</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableView({ records }: { records: CDRRecord[] }) {
  const [page, setPage] = useState(1);
  const rowsPerPage = 20;
  const totalPages = Math.ceil(records.length / rowsPerPage);
  
  const currentRecords = records.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  if (records.length === 0) return <EmptyState />;

  return (
    <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl shadow-lg flex flex-col shrink-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="text-xs uppercase bg-[#171717] text-gray-500 border-b border-[#2e2e2e]">
            <tr>
              <th className="px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Other Party</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Cell / LAC</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.map((r, i) => (
              <tr key={i} className="border-b border-[#2e2e2e] hover:bg-[#1a1a1a]">
                <td className="px-4 py-3 font-mono text-xs">{new Date(r.timestamp).toLocaleString()}</td>
                <td className="px-4 py-3">{r.usageType}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.otherParty}</td>
                <td className="px-4 py-3">{r.duration}s</td>
                <td className="px-4 py-3 truncate max-w-xs" title={r.address}>{r.address || 'N/A'}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.cellId || 'N/A'} / {r.lac || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="p-3 border-t border-[#2e2e2e] flex items-center justify-between text-xs text-gray-400 bg-[#171717] rounded-b-xl">
          <span>Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, records.length)} of {records.length} records</span>
          <div className="flex gap-2">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 bg-[#2e2e2e] rounded hover:bg-[#333] disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 bg-[#2e2e2e] rounded hover:bg-[#333] disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InsightsView({ records }: { records: CDRRecord[] }) {
  if (records.length === 0) return <EmptyState />;

  const locationCounts = records.reduce((acc, r) => {
    const loc = r.address || 'Unknown Location';
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topLocations = Object.entries(locationCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const typeCounts = records.reduce((acc, r) => {
    acc[r.usageType] = (acc[r.usageType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  const COLORS = ['#3ecf8e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-4 flex flex-col gap-4 shadow-lg">
        <h3 className="font-semibold text-gray-200 flex items-center gap-2 text-sm uppercase tracking-wider">
          <BarChart2 className="h-4 w-4 text-[#3ecf8e]" /> Top Visited Locations
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topLocations} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" horizontal={false} />
              <XAxis type="number" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" width={120} stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
              <RechartsTooltip cursor={{ fill: '#1a1a1a' }} contentStyle={{ backgroundColor: '#171717', borderColor: '#2e2e2e', color: '#fff', fontSize: '12px' }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-4 flex flex-col gap-4 shadow-lg">
        <h3 className="font-semibold text-gray-200 flex items-center gap-2 text-sm uppercase tracking-wider">
          <PieChartIcon className="h-4 w-4 text-purple-500" /> Activity Distribution
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#2e2e2e', color: '#fff', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
          {typeData.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
              <span>{entry.name} ({entry.value})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DateTimeModal({ currentFilters, onApply, onClose }: { currentFilters: any, onApply: (f: any) => void, onClose: () => void }) {
  const [localFilters, setLocalFilters] = useState({
    startDate: currentFilters.startDate,
    endDate: currentFilters.endDate,
    timeFrom: currentFilters.timeFrom,
    timeTo: currentFilters.timeTo
  });

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    setLocalFilters(p => ({
      ...p,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#171717] border border-[#2e2e2e] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-4 border-b border-[#2e2e2e] flex items-center justify-between bg-[#121212]">
          <h3 className="font-semibold text-gray-200 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#3ecf8e]" />
            Select Date & Time Range
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="flex gap-2 text-xs font-mono">
            <button onClick={() => applyPreset(0)} className="px-3 py-1.5 bg-[#2e2e2e] hover:bg-[#333] text-gray-300 rounded transition-colors">Today</button>
            <button onClick={() => applyPreset(1)} className="px-3 py-1.5 bg-[#2e2e2e] hover:bg-[#333] text-gray-300 rounded transition-colors">Yesterday</button>
            <button onClick={() => applyPreset(7)} className="px-3 py-1.5 bg-[#2e2e2e] hover:bg-[#333] text-gray-300 rounded transition-colors">Last 7 Days</button>
            <button onClick={() => applyPreset(30)} className="px-3 py-1.5 bg-[#2e2e2e] hover:bg-[#333] text-gray-300 rounded transition-colors">Last 30 Days</button>
            <button onClick={() => setLocalFilters({ startDate: '', endDate: '', timeFrom: '', timeTo: '' })} className="px-3 py-1.5 bg-[#2e2e2e] hover:bg-[#333] text-gray-300 rounded transition-colors ml-auto">Clear All</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-400 text-xs font-medium">Start Date</label>
              <DateTimeInput 
                mode="date"
                value={localFilters.startDate}
                onChange={val => setLocalFilters(p => ({ ...p, startDate: val }))}
                className="w-full"
                placeholder="Start Date"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-400 text-xs font-medium">End Date</label>
              <DateTimeInput 
                mode="date"
                value={localFilters.endDate}
                onChange={val => setLocalFilters(p => ({ ...p, endDate: val }))}
                className="w-full"
                placeholder="End Date"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-400 text-xs font-medium">Time From</label>
              <DateTimeInput 
                mode="time"
                value={localFilters.timeFrom}
                onChange={val => setLocalFilters(p => ({ ...p, timeFrom: val }))}
                className="w-full"
                placeholder="Time From"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-400 text-xs font-medium">Time To</label>
              <DateTimeInput 
                mode="time"
                value={localFilters.timeTo}
                onChange={val => setLocalFilters(p => ({ ...p, timeTo: val }))}
                className="w-full"
                placeholder="Time To"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#2e2e2e] flex justify-end gap-3 bg-[#121212]">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={() => onApply(localFilters)}
            className="px-4 py-2 text-sm bg-[#3ecf8e] hover:bg-[#34b37b] text-black font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            Apply Selection
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl flex flex-col items-center justify-center p-16 text-center min-h-[300px]">
      <Activity className="h-12 w-12 text-gray-600 mb-4" />
      <h3 className="text-lg font-semibold text-gray-300">No Records Match Filters</h3>
      <p className="text-gray-500 mt-2">Try adjusting your filters to see movement data.</p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Small Helpers
// -----------------------------------------------------------------------------

function MetricCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-[#121212] border border-[#2e2e2e] rounded-xl p-4 flex flex-col gap-2 hover:border-[#444] transition-colors shadow-sm">
      <div className="flex items-center gap-2 text-gray-400">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest">{title}</span>
      </div>
      <span className="text-2xl font-bold text-white font-mono">{value}</span>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
        active ? 'bg-[#2e2e2e] text-white font-medium' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1a1a]'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ExportButton({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#171717] border border-[#2e2e2e] hover:border-gray-500 text-gray-300 hover:text-white rounded-lg transition-colors cursor-pointer">
      {icon}
      <span>{label}</span>
    </button>
  );
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}
