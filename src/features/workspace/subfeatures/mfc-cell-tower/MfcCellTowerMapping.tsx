import React, { useMemo, useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Map as MapIcon, Target, Search } from 'lucide-react';
import { type Case } from '../../../../utils/db';
import { useCaseData } from '../../hooks/useCaseData';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MfcCellTowerMappingProps {
  activeCase: Case;
}

interface TowerStats {
  address: string;
  count: number;
  targets: Set<number>;
  lat?: number;
  lng?: number;
}

// Helper to create custom div icon showing name and hits directly on map
const createCustomIcon = (address: string, hits: number, isSelected: boolean) => {
  const cleanName = address.split(',')[0] || 'Unknown';
  return L.divIcon({
    className: 'custom-cell-tower-icon',
    html: `
      <div style="
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.95);
        border: 1.5px solid ${isSelected ? '#3ecf8e' : '#94a3b8'};
        box-shadow: 0 4px 10px rgba(0,0,0,0.12), ${isSelected ? '0 0 12px rgba(62,207,142,0.5)' : 'none'};
        padding: 4px 10px;
        border-radius: 9999px;
        color: #1e293b;
        font-family: monospace;
        font-size: 10px;
        font-weight: 700;
        white-space: nowrap;
        transform: translate(-50%, -50%);
        transition: all 0.25s ease;
        z-index: ${isSelected ? 999 : 1};
      ">
        <span style="
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: ${isSelected ? '#10b981' : '#ef4444'};
          box-shadow: 0 0 6px ${isSelected ? '#10b981' : '#ef4444'};
          display: inline-block;
          flex-shrink: 0;
        "></span>
        <span style="
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #334155;
        ">${cleanName}</span>
        <span style="
          background: ${isSelected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.08)'};
          color: ${isSelected ? '#047857' : '#b91c1c'};
          padding: 1px 5px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 850;
          border: 1px solid ${isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.15)'};
        ">${hits}</span>
      </div>
    `,
    iconSize: L.point(0, 0),
  });
};

// Helper to update map view dynamically and handle initial bounds fitting
const MapUpdater: React.FC<{
  center: [number, number];
  zoom: number;
  selectedCoords: [number, number] | null;
  fitAllBounds: L.LatLngBounds | null;
}> = ({ center, zoom, selectedCoords, fitAllBounds }) => {
  const map = useMap();
  const initialFitDone = useRef(false);

  useEffect(() => {
    if (selectedCoords) {
      map.setView(selectedCoords, 16, { animate: true, duration: 1.2 });
    } else if (fitAllBounds && !initialFitDone.current) {
      map.fitBounds(fitAllBounds, { padding: [50, 50], maxZoom: 13 });
      initialFitDone.current = true;
    }
  }, [selectedCoords, fitAllBounds, map]);

  return null;
};

// Custom Marker component that opens its popup automatically when mounted or selected
interface SelectedMarkerProps {
  position: [number, number];
  address: string;
  count: number;
  targets: Set<number>;
  targetMap: Map<number, string>;
  isGeocoded?: boolean;
}

const SelectedMarker: React.FC<SelectedMarkerProps> = ({
  position,
  address,
  count,
  targets,
  targetMap,
  isGeocoded
}) => {
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (markerRef.current) {
      const timer = setTimeout(() => {
        markerRef.current.openPopup();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [position]);

  return (
    <Marker ref={markerRef} position={position} icon={createCustomIcon(address, count, true)}>
      <Popup className="bg-[#171717] border border-[#2e2e2e] text-gray-200 font-mono text-xs">
        <div className="p-2 space-y-1">
          <strong className="text-[#3ecf8e] block text-sm border-b border-[#2e2e2e] pb-1 mb-1">{address}</strong>
          {isGeocoded && <div className="text-[10px] text-amber-400 font-semibold mb-1">📍 Geocoded from Address</div>}
          <div>Hits: {count}</div>
          <div>Targets: {Array.from(targets).map(id => targetMap.get(id)).join(', ')}</div>
        </div>
      </Popup>
    </Marker>
  );
};

export const MfcCellTowerMapping: React.FC<MfcCellTowerMappingProps> = ({ activeCase }) => {
  const { records, files, loading } = useCaseData(activeCase.id);

  // Map state
  const [selectedTower, setSelectedTower] = useState<TowerStats | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([23.685, 90.356]);
  const [mapZoom, setMapZoom] = useState<number>(7);
  const [geocodedCoords, setGeocodedCoords] = useState<[number, number] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);

  const { towers, hasCoordinates, targetMap } = useMemo(() => {
    const tMap = new Map<number, string>();
    files.forEach(f => {
      if (f.id) tMap.set(f.id, f.phoneNumber);
    });

    const towerMap = new Map<string, TowerStats>();
    let hasCoords = false;

    records.forEach((r: any) => {
      if (!r.address || r.address.trim() === '') return;
      
      const addr = r.address.trim();
      if (!towerMap.has(addr)) {
        towerMap.set(addr, {
          address: addr,
          count: 0,
          targets: new Set(),
          lat: r.latitude,
          lng: r.longitude
        });
      }
      
      const stats = towerMap.get(addr)!;
      stats.count++;
      if (r.fileId) stats.targets.add(r.fileId);
      
      if (r.latitude != null && r.longitude != null) {
        hasCoords = true;
      }
    });

    // Sort by most frequent
    const sortedTowers = Array.from(towerMap.values()).sort((a, b) => b.count - a.count);

    return { towers: sortedTowers, hasCoordinates: hasCoords, targetMap: tMap };
  }, [records, files]);

  // Bounds fitting calculations
  const fitAllBounds = useMemo(() => {
    const coords = towers.filter(t => t.lat && t.lng).map(t => [t.lat!, t.lng!] as [number, number]);
    if (coords.length > 0) {
      return L.latLngBounds(coords);
    }
    return null;
  }, [towers]);

  const selectedCoords = useMemo<[number, number] | null>(() => {
    if (selectedTower) {
      if (selectedTower.lat != null && selectedTower.lng != null) {
        return [selectedTower.lat, selectedTower.lng];
      }
      if (geocodedCoords) {
        return geocodedCoords;
      }
    }
    return null;
  }, [selectedTower, geocodedCoords]);

  // Geocoding logic with progressive fallbacks
  const searchGeocode = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      // 1. Full Query
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
      
      // 2. Clean fallback: part 0 + last part
      const parts = address.split(',').map(p => p.trim()).filter(Boolean);
      if (parts.length > 1) {
        const fallbackQuery = `${parts[0]}, ${parts[parts.length - 1]}`;
        const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&limit=1`;
        const resFb = await fetch(fallbackUrl);
        const dataFb = await resFb.json();
        if (dataFb && dataFb.length > 0) {
          return { lat: parseFloat(dataFb[0].lat), lng: parseFloat(dataFb[0].lon) };
        }
      }
      
      // 3. Last part (City/Region fallback)
      if (parts.length > 0) {
        const lastPart = parts[parts.length - 1];
        const lastUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(lastPart)}&limit=1`;
        const resLast = await fetch(lastUrl);
        const dataLast = await resLast.json();
        if (dataLast && dataLast.length > 0) {
          return { lat: parseFloat(dataLast[0].lat), lng: parseFloat(dataLast[0].lon) };
        }
      }
    } catch (err) {
      console.error("Geocoding lookup error:", err);
    }
    return null;
  };

  const handleTowerClick = async (tower: TowerStats) => {
    setSelectedTower(tower);
    setGeocodedCoords(null);
    setSearchFailed(false);
    
    if (tower.lat != null && tower.lng != null) {
      setMapCenter([tower.lat, tower.lng]);
      setMapZoom(15);
    } else {
      setIsSearching(true);
      const coords = await searchGeocode(tower.address);
      setIsSearching(false);
      if (coords) {
        setGeocodedCoords([coords.lat, coords.lng]);
        setMapCenter([coords.lat, coords.lng]);
        setMapZoom(15);
      } else {
        setSearchFailed(true);
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#121212]">
        <div className="text-gray-400 font-mono text-sm animate-pulse">Analyzing Cell Towers...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden flex flex-col p-6 text-left animate-in fade-in duration-300 bg-[#121212]">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-200">Global MFC Cell Tower Intelligence</h3>
        <p className="text-xs text-gray-500 font-mono mt-0.5">
          Most Frequent Cell towers across all {files.length} targets in case: {activeCase.title}
        </p>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row gap-6 min-h-0">
        {/* Top Towers List */}
        <div className="w-full xl:w-[400px] flex flex-col bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl overflow-hidden shrink-0">
          <div className="p-4 border-b border-[#2e2e2e] bg-[#171717] flex justify-between items-center">
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Target className="h-4 w-4 text-[#3ecf8e]" />
              Top Cell Towers
            </h4>
            <span className="text-xs font-mono text-gray-500">{towers.length} Unique Locations</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
            {towers.slice(0, 50).map((tower, idx) => {
              const isSelected = selectedTower?.address === tower.address;
              return (
                <div 
                  key={idx} 
                  onClick={() => handleTowerClick(tower)}
                  className={`p-3 bg-[#171717] border rounded-lg cursor-pointer hover:border-[#3ecf8e]/40 hover:bg-[#1e1e1e] transition-all relative ${
                    isSelected 
                      ? 'border-[#3ecf8e] shadow-[0_0_12px_rgba(62,207,142,0.15)] pl-4' 
                      : 'border-[#2e2e2e]'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#3ecf8e] rounded-l-lg" />
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-start gap-2 max-w-[70%]">
                      <div className="mt-0.5 bg-[#3ecf8e]/10 p-1 rounded">
                        <MapPin className="h-3.5 w-3.5 text-[#3ecf8e]" />
                      </div>
                      <span className="text-xs text-gray-200 break-words font-medium">{tower.address}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-[#3ecf8e] font-mono">{tower.count}</div>
                      <div className="text-[9px] text-gray-500 uppercase">Hits</div>
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-[#2e2e2e]/50 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-gray-550 mr-1">Targets found here:</span>
                    {Array.from(tower.targets).map(tId => (
                      <span key={tId} className="px-1.5 py-0.5 bg-blue-900/20 text-blue-400 border border-blue-800/30 rounded text-[9px] font-mono">
                        {targetMap.get(tId) || 'Unknown'}
                      </span>
                    ))}
                  </div>

                  {isSearching && isSelected && (
                    <span className="text-[10px] text-amber-400 animate-pulse mt-1.5 flex items-center gap-1">
                      <Search className="h-3 w-3 animate-spin" /> Searching location on map...
                    </span>
                  )}
                  {searchFailed && isSelected && (
                    <span className="text-[10px] text-red-400 mt-1.5 block">
                      ⚠️ Could not resolve address coordinates
                    </span>
                  )}
                </div>
              );
            })}
            {towers.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-xs">
                No cell tower address data found in case logs.
              </div>
            )}
          </div>
        </div>

        {/* Map Visualization */}
        <div className="flex-1 min-h-[400px] bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl overflow-hidden relative">
          {!hasCoordinates && towers.length > 0 && !geocodedCoords && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#121212] z-[400] text-gray-400 font-mono text-sm border-2 border-dashed border-[#2e2e2e] m-4 rounded-xl">
              <MapIcon className="h-8 w-8 text-gray-600 mb-3" />
              <div className="mb-2 text-gray-300 font-semibold">📍 Coordinates not available in CDR files</div>
              <div className="text-xs text-gray-500 max-w-sm text-center">
                Map plotting requires exact latitude and longitude fields. 
                Click on any tower to search it on the live map.
              </div>
            </div>
          )}
          
          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            style={{ height: '100%', width: '100%', background: '#f8fafc' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            <MapUpdater 
              center={mapCenter} 
              zoom={mapZoom} 
              selectedCoords={selectedCoords} 
              fitAllBounds={fitAllBounds} 
            />

            {/* Standard Database Markers */}
            {towers.filter(t => t.lat && t.lng).slice(0, 100).map((tower, idx) => {
              const isSelected = selectedTower?.address === tower.address;
              if (isSelected) {
                return (
                  <SelectedMarker
                    key={`selected-${idx}`}
                    position={[tower.lat!, tower.lng!]}
                    address={tower.address}
                    count={tower.count}
                    targets={tower.targets}
                    targetMap={targetMap}
                  />
                );
              }
              return (
                <Marker 
                  key={idx} 
                  position={[tower.lat!, tower.lng!]}
                  icon={createCustomIcon(tower.address, tower.count, false)}
                  eventHandlers={{
                    click: () => handleTowerClick(tower)
                  }}
                >
                  <Popup className="bg-[#171717] border border-[#2e2e2e] text-gray-200 font-mono text-xs">
                    <div className="p-2 space-y-1">
                      <strong className="text-[#3ecf8e] block text-sm border-b border-[#2e2e2e] pb-1 mb-1">{tower.address}</strong>
                      <div>Hits: {tower.count}</div>
                      <div>Targets: {Array.from(tower.targets).map(id => targetMap.get(id)).join(', ')}</div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Geocoded Marker */}
            {geocodedCoords && selectedTower && (
              <SelectedMarker
                position={geocodedCoords}
                address={selectedTower.address}
                count={selectedTower.count}
                targets={selectedTower.targets}
                targetMap={targetMap}
                isGeocoded={true}
              />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};
