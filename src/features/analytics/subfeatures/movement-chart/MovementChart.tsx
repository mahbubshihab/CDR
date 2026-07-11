import React, { useState, useMemo, useEffect } from 'react';
import { 
  Download, FileSpreadsheet, FileText, Printer, Map as MapIcon, Image as ImageIcon, 
  Play, Pause, RotateCcw, SkipBack, SkipForward, Route, Calendar, Clock, MapPin, 
  Target, Radio, Smartphone, Check, X, ShieldAlert, Navigation, Compass, Layers
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';

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

  const [activeTab, setActiveTab] = useState<'map' | 'timeline' | 'table' | 'insights'>('map');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Filter records based on criteria
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Basic filtering logic here
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
    <div className="w-full flex flex-col gap-6 p-6 pb-10 bg-[#0a0a0a] overflow-y-auto custom-scrollbar">
      {/* 1. Header & Top Metrics */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
          <Route className="h-5 w-5 text-[#3ecf8e]" />
          Movement Intelligence
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <MetricCard title="Locations" value={hasCoordinates ? uniqueLocations.toString() : 'N/A'} icon={<MapPin className="h-4 w-4" />} />
          <MetricCard title="Movements" value={hasCoordinates ? totalMovements.toString() : 'N/A'} icon={<Navigation className="h-4 w-4" />} />
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
            <label className="text-gray-400 font-medium">Date Range</label>
            <div className="flex items-center gap-2">
              <input type="date" className="bg-[#1a1a1a] border border-[#333] text-gray-200 rounded px-2 py-1.5 w-full outline-none focus:border-[#3ecf8e]" />
              <span className="text-gray-500">-</span>
              <input type="date" className="bg-[#1a1a1a] border border-[#333] text-gray-200 rounded px-2 py-1.5 w-full outline-none focus:border-[#3ecf8e]" />
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label className="text-gray-400 font-medium">Time Range</label>
            <div className="flex items-center gap-2">
              <input type="time" className="bg-[#1a1a1a] border border-[#333] text-gray-200 rounded px-2 py-1.5 w-full outline-none focus:border-[#3ecf8e]" />
              <span className="text-gray-500">-</span>
              <input type="time" className="bg-[#1a1a1a] border border-[#333] text-gray-200 rounded px-2 py-1.5 w-full outline-none focus:border-[#3ecf8e]" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label className="text-gray-400 font-medium">Location</label>
            <input type="text" placeholder="Search area..." className="bg-[#1a1a1a] border border-[#333] text-gray-200 rounded px-2 py-1.5 w-full outline-none focus:border-[#3ecf8e]" />
          </div>

          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label className="text-gray-400 font-medium">Tower / Cell ID</label>
            <input type="text" placeholder="E.g. 12345" className="bg-[#1a1a1a] border border-[#333] text-gray-200 rounded px-2 py-1.5 w-full outline-none focus:border-[#3ecf8e]" />
          </div>
          
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label className="text-gray-400 font-medium">Distance (Min - Max)</label>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="Min" className="bg-[#1a1a1a] border border-[#333] text-gray-200 rounded px-2 py-1.5 w-full outline-none focus:border-[#3ecf8e]" />
              <input type="number" placeholder="Max" className="bg-[#1a1a1a] border border-[#333] text-gray-200 rounded px-2 py-1.5 w-full outline-none focus:border-[#3ecf8e]" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label className="text-gray-400 font-medium">Thresholds</label>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="Min Acts" className="bg-[#1a1a1a] border border-[#333] text-gray-200 rounded px-2 py-1.5 w-full outline-none focus:border-[#3ecf8e]" title="Min Activities" />
              <input type="number" placeholder="Min Stop (m)" className="bg-[#1a1a1a] border border-[#333] text-gray-200 rounded px-2 py-1.5 w-full outline-none focus:border-[#3ecf8e]" title="Min Stop Time" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-gray-400 font-medium">Call Type</label>
            <select className="bg-[#1a1a1a] border border-[#333] text-gray-200 rounded px-2 py-1.5 w-full outline-none focus:border-[#3ecf8e]">
              <option>All</option>
              <option>MOC</option>
              <option>MTC</option>
              <option>SMS</option>
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

      {/* 4. Map View */}
      {activeTab === 'map' && (
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
                  
                  {routePoints.slice(0, playbackIndex + 1).map((pos, idx) => (
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
                        setIsPlaying(false);
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
                  {routePoints.map((pos, idx) => (
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
      )}
    </div>
  );
}

// Subcomponents
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
