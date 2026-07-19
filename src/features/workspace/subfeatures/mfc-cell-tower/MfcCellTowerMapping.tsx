import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Map as MapIcon, Target } from 'lucide-react';
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

export const MfcCellTowerMapping: React.FC<MfcCellTowerMappingProps> = ({ activeCase }) => {
  const { records, files, loading } = useCaseData(activeCase.id);

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
            {towers.slice(0, 50).map((tower, idx) => (
              <div key={idx} className="p-3 bg-[#171717] border border-[#2e2e2e] rounded-lg">
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
                  <span className="text-[10px] text-gray-500 mr-1">Targets found here:</span>
                  {Array.from(tower.targets).map(tId => (
                    <span key={tId} className="px-1.5 py-0.5 bg-blue-900/20 text-blue-400 border border-blue-800/30 rounded text-[9px] font-mono">
                      {targetMap.get(tId) || 'Unknown'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {towers.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-xs">
                No cell tower address data found in case logs.
              </div>
            )}
          </div>
        </div>

        {/* Map Visualization */}
        <div className="flex-1 min-h-[400px] bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl overflow-hidden relative">
          {!hasCoordinates && towers.length > 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#121212] z-[400] text-gray-400 font-mono text-sm border-2 border-dashed border-[#2e2e2e] m-4 rounded-xl">
              <MapIcon className="h-8 w-8 text-gray-600 mb-3" />
              <div className="mb-2 text-gray-300 font-semibold">📍 Coordinates not available in CDR files</div>
              <div className="text-xs text-gray-500 max-w-sm text-center">
                Map plotting requires exact latitude and longitude fields. 
                Tower frequencies are available in the side panel.
              </div>
            </div>
          )}
          
          <MapContainer 
            center={[23.685, 90.356]} 
            zoom={7} 
            style={{ height: '100%', width: '100%', background: '#1e1e1e' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {hasCoordinates && towers.filter(t => t.lat && t.lng).slice(0, 100).map((tower, idx) => (
              <Marker key={idx} position={[tower.lat!, tower.lng!]}>
                <Popup className="bg-[#171717] border border-[#2e2e2e] text-gray-200 font-mono text-xs">
                  <div className="p-2 space-y-1">
                    <strong className="text-[#3ecf8e] block text-sm border-b border-[#2e2e2e] pb-1 mb-1">{tower.address}</strong>
                    <div>Hits: {tower.count}</div>
                    <div>Targets: {Array.from(tower.targets).map(id => targetMap.get(id)).join(', ')}</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};
