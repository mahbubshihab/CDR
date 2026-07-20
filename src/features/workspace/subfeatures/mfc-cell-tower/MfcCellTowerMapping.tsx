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

// Local cache structures for geocoding coordinates to speed up loading
interface CachedCoords {
  lat: number;
  lng: number;
}

const getGeoCache = (): Record<string, CachedCoords> => {
  try {
    const raw = localStorage.getItem('cdr_geo_cache_v3');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveGeoCache = (cache: Record<string, CachedCoords>) => {
  try {
    localStorage.setItem('cdr_geo_cache_v3', JSON.stringify(cache));
  } catch (err) {
    console.error('Failed to save geo cache:', err);
  }
};

interface TowerStats {
  address: string;
  count: number;
  targets: Set<number>;
  lat?: number;
  lng?: number;
}

// Helper to create custom div icon showing name and hits directly on map
const createCustomIcon = (address: string, hits: number, isSelected: boolean) => {
  const pinColor = isSelected ? '#10b981' : '#ef4444';
  
  return L.divIcon({
    className: 'custom-cell-tower-icon',
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        transform: translate(-50%, -100%);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${pinColor}" style="width: 36px; height: 36px; filter: drop-shadow(0px 3px 5px rgba(0, 0, 0, 0.45));">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: L.point(0, 0),
  });
};

// Helper to update map view dynamically and handle initial bounds fitting
const MapUpdater: React.FC<{
  selectedCoords: [number, number] | null;
}> = ({ selectedCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedCoords) {
      map.setView(selectedCoords, 16, { animate: true, duration: 1.2 });
    }
  }, [selectedCoords, map]);

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

  // Local storage coordinates cache state
  const [resolvedCoords, setResolvedCoords] = useState<Record<string, CachedCoords>>({});

  // Load cache on mount
  useEffect(() => {
    setResolvedCoords(getGeoCache());
  }, []);

  const { towers, targetMap } = useMemo(() => {
    const tMap = new Map<number, string>();
    files.forEach(f => {
      if (f.id) tMap.set(f.id, f.phoneNumber);
    });

    const towerMap = new Map<string, TowerStats>();

    records.forEach((r: any) => {
      if (!r.address || r.address.trim() === '') return;
      
      const addr = r.address.trim();
      if (!towerMap.has(addr)) {
        const cached = resolvedCoords[addr];
        towerMap.set(addr, {
          address: addr,
          count: 0,
          targets: new Set(),
          lat: r.latitude ?? cached?.lat,
          lng: r.longitude ?? cached?.lng
        });
      }
      
      const stats = towerMap.get(addr)!;
      stats.count++;
      if (r.fileId) stats.targets.add(r.fileId);
    });

    // Sort by most frequent
    const sortedTowers = Array.from(towerMap.values()).sort((a, b) => b.count - a.count);

    return { towers: sortedTowers, targetMap: tMap };
  }, [records, files, resolvedCoords]);

  const hasCoordinates = useMemo(() => {
    return towers.some(t => t.lat != null && t.lng != null);
  }, [towers]);

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

  // Background geocoding loop to resolve coordinates for top towers sequentially
  useEffect(() => {
    if (loading || towers.length === 0) return;

    // Limit sequential background geocoding to the top 20 towers to prevent API rate limits
    const towersToGeocode = towers.slice(0, 20).filter(t => !t.lat || !t.lng);
    if (towersToGeocode.length === 0) return;

    let active = true;

    const processGeocoding = async () => {
      // Small initial delay before starting background requests
      await new Promise(r => setTimeout(r, 600));

      const cache = getGeoCache();
      let updated = false;

      for (const tower of towersToGeocode) {
        if (!active) break;

        // Skip if already loaded in cache in the background
        if (cache[tower.address]) {
          const coords = cache[tower.address];
          setResolvedCoords(prev => ({
            ...prev,
            [tower.address]: coords
          }));
          continue;
        }

        const coords = await searchGeocode(tower.address);
        if (coords) {
          cache[tower.address] = coords;
          updated = true;
          
          setResolvedCoords(prev => ({
            ...prev,
            [tower.address]: coords
          }));

          // Wait 1.1s to respect Nominatim limits
          await new Promise(r => setTimeout(r, 1100));
        } else {
          // Cooldown on failure
          await new Promise(r => setTimeout(r, 500));
        }
      }

      if (updated && active) {
        saveGeoCache(cache);
      }
    };

    processGeocoding();

    return () => {
      active = false;
    };
  }, [towers, loading]);

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
          {!selectedTower && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#121212]/90 backdrop-blur-sm z-[999] text-gray-400 font-mono text-sm border-2 border-dashed border-[#2e2e2e] m-4 rounded-xl">
              <MapIcon className="h-8 w-8 text-[#3ecf8e] mb-3 animate-bounce" />
              <div className="mb-2 text-gray-300 font-bold tracking-wider">📍 Please select a location to view on map</div>
              <div className="text-xs text-gray-500 max-w-xs text-center">
                Select any cell tower address from the list on the left to plot and zoom to it.
              </div>
            </div>
          )}

          {selectedTower && !selectedCoords && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#121212]/95 z-[999] text-gray-400 font-mono text-sm border-2 border-dashed border-red-500/20 m-4 rounded-xl">
              <MapIcon className="h-8 w-8 text-red-500 mb-3" />
              <div className="mb-2 text-red-400 font-bold">⚠️ Could not resolve address coordinates</div>
              <div className="text-xs text-gray-550 max-w-sm text-center">
                Coordinates are not available in the database and geocoding search failed.
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
              selectedCoords={selectedCoords} 
            />

            {selectedTower && selectedCoords && (
              <SelectedMarker
                position={selectedCoords}
                address={selectedTower.address}
                count={selectedTower.count}
                targets={selectedTower.targets}
                targetMap={targetMap}
                isGeocoded={!(selectedTower.lat != null && selectedTower.lng != null)}
              />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};
