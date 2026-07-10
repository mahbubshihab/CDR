import React, { useState, useEffect, useMemo, useRef } from 'react';
import { type CDRFile, type CDRRecord } from '../../../../utils/db';
import { Play, Pause, RotateCcw, Shield, Clock, MapPin, FastForward } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import towerLocationsRaw from '../../../../assets/tower_locations.json';

const towerLocations = towerLocationsRaw as Record<string, { lat: number; lng: number }>;

// Fix Leaflet default icon path issues
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface LocationIntelligenceProps {
  cdrFile: CDRFile;
  records: CDRRecord[];
}

// Map helper to auto-pan map to active target position
const MapRecenter: React.FC<{ coords: [number, number] }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, map.getZoom(), { animate: true });
    }
  }, [coords, map]);
  return null;
};

export const LocationIntelligence: React.FC<LocationIntelligenceProps> = ({ cdrFile, records }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [speed, setSpeed] = useState(1); // 1x, 2x, 4x
  const timerRef = useRef<any>(null);

  // Look up coordinates from tower_locations.json database, else fallback to deterministic generator around Dhaka center
  const getCoordinates = (lac: number, cellId: number): [number, number] => {
    const key = `${lac}-${cellId}`;
    if (towerLocations[key]) {
      return [towerLocations[key].lat, towerLocations[key].lng];
    }
    const latBase = 23.8103;
    const lngBase = 90.4125;
    const seedLat = Math.sin(lac * 11 + cellId * 7) * 0.04;
    const seedLng = Math.cos(lac * 7 + cellId * 13) * 0.04;
    return [latBase + seedLat, lngBase + seedLng];
  };

  // Extract sequence of chronological coordinates
  const locationTimeline = useMemo(() => {
    return records
      .filter(r => r.address || (r.lac && r.cellId))
      .map(r => {
        const timeStr = String(r.timestamp);
        let dateStr = timeStr;
        if (timeStr.length === 14) {
          const y = timeStr.substring(0, 4);
          const m = timeStr.substring(4, 6);
          const d = timeStr.substring(6, 8);
          const hr = timeStr.substring(8, 10);
          const min = timeStr.substring(10, 12);
          dateStr = `${d}/${m}/${y} ${hr}:${min}`;
        } else {
          try {
            const d = new Date(r.timestamp);
            if (!isNaN(d.getTime())) dateStr = d.toLocaleString();
          } catch (_) {}
        }

        return {
          address: r.address || `Cell (LAC: ${r.lac}, CID: ${r.cellId})`,
          lac: r.lac || 0,
          cellId: r.cellId || 0,
          coords: getCoordinates(r.lac || 0, r.cellId || 0),
          time: dateStr,
          type: r.usageType,
          otherParty: r.otherParty
        };
      });
  }, [records]);

  // Timeline player playback ticking loop
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(1000 / speed, 200);
      timerRef.current = setInterval(() => {
        setCurrentIdx(prev => {
          if (prev >= locationTimeline.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, locationTimeline.length]);

  const activePosition = locationTimeline[currentIdx] || null;
  const polylinePath = locationTimeline.map(item => item.coords);

  // Custom marker for current suspect position
  const activeSuspectIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div className="relative flex items-center justify-center">
             <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-red-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border border-white"></span>
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  return (
    <div className="w-full h-full flex flex-col lg:grid lg:grid-cols-12 gap-6 p-6 text-left bg-[#121212] animate-in fade-in duration-300">
      
      {/* Sidebar Controls (Col 4) */}
      <div className="lg:col-span-4 bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-gray-200">Location Intelligence</h2>
          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mt-1 block">
            Offline Cell Tower Movement timeline playback
          </p>

          {/* Active stats panel */}
          {activePosition ? (
            <div className="mt-5 space-y-4 border-t border-[#2e2e2e]/55 pt-4 text-xs font-mono text-gray-300">
              <div className="space-y-1">
                <span className="text-gray-500 text-[10px] uppercase tracking-wider block font-semibold">Active Tower Location</span>
                <span className="flex items-center gap-1.5 font-sans font-medium text-gray-200">
                  <MapPin className="h-4 w-4 text-[#3ecf8e] shrink-0" />
                  <span>{activePosition.address}</span>
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 text-[10px] uppercase tracking-wider block font-semibold">Connection Time</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-gray-500 shrink-0" />
                  <span>{activePosition.time}</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <span className="text-gray-500 text-[9px] uppercase tracking-wider block">LAC / CID</span>
                  <strong>{activePosition.lac} / {activePosition.cellId}</strong>
                </div>
                <div className="space-y-0.5">
                  <span className="text-gray-500 text-[9px] uppercase tracking-wider block">Activity Type</span>
                  <span className="text-[#3ecf8e] font-semibold">{activePosition.type}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 text-xs mt-4">
              No geographical records loaded.
            </div>
          )}
        </div>

        {/* Timeline Player controls */}
        {locationTimeline.length > 0 && (
          <div className="space-y-4 border-t border-[#2e2e2e]/55 pt-4 mt-6">
            {/* Scrub Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono text-gray-500">
                <span>Timeline playback</span>
                <span>{currentIdx + 1} / {locationTimeline.length}</span>
              </div>
              <input 
                type="range"
                min="0"
                max={locationTimeline.length - 1}
                value={currentIdx}
                onChange={e => setCurrentIdx(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-[#121212] border border-[#2e2e2e] rounded-lg appearance-none cursor-pointer accent-[#3ecf8e]"
              />
            </div>

            {/* Buttons Row */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="h-8 w-8 rounded-lg bg-[#3ecf8e]/10 hover:bg-[#3ecf8e]/20 border border-[#3ecf8e]/20 text-[#3ecf8e] flex items-center justify-center cursor-pointer transition-colors"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentIdx(0);
                  }}
                  className="h-8 w-8 rounded-lg bg-[#2e2e2e] hover:bg-[#3e3e3e] text-gray-400 hover:text-gray-200 border border-[#2e2e2e] flex items-center justify-center cursor-pointer transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              {/* Speed toggle */}
              <button
                onClick={() => setSpeed(prev => prev === 1 ? 2 : prev === 2 ? 4 : 1)}
                className="h-8 px-2.5 rounded-lg bg-[#2e2e2e] hover:bg-[#3e3e3e] border border-[#2e2e2e] text-gray-400 hover:text-gray-250 flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer transition-colors"
              >
                <FastForward className="h-3.5 w-3.5" />
                <span>{speed}x</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Leaflet Map (Col 8) */}
      <div className="lg:col-span-8 bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl overflow-hidden h-[480px] relative z-0">
        {locationTimeline.length > 0 ? (
          <MapContainer 
            center={locationTimeline[0].coords} 
            zoom={13} 
            className="h-full w-full"
            zoomControl={true}
          >
            {/* Dark Theme CartoDB Tile Layer */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            {/* Recenter Map Hook */}
            {activePosition && <MapRecenter coords={activePosition.coords} />}

            {/* Path Route Polylines */}
            <Polyline 
              positions={polylinePath} 
              color="#3ecf8e" 
              weight={3} 
              opacity={0.65} 
              dashArray="5, 10"
            />

            {/* Unique Tower Markers */}
            {locationTimeline.map((item, idx) => (
              <Marker key={idx} position={item.coords}>
                <Popup>
                  <div className="text-xs font-mono space-y-1">
                    <strong className="block text-gray-800">{item.address}</strong>
                    <span>Time: {item.time}</span><br />
                    <span>LAC: {item.lac} | CID: {item.cellId}</span>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* pulsing Suspect Active Marker */}
            {activePosition && (
              <Marker position={activePosition.coords} icon={activeSuspectIcon}>
                <Popup>
                  <div className="text-xs font-mono">
                    <strong className="text-red-600 block">Suspect Last Position</strong>
                    <span>Time: {activePosition.time}</span>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-500 text-xs font-mono">
            No geographical cell tower positions to load.
          </div>
        )}
      </div>

    </div>
  );
};
