import React from 'react';
import { type CDRRecord } from '../../../../../utils/db';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface CallsGeoTabProps {
  records: CDRRecord[];
}

export const CallsGeoTab: React.FC<CallsGeoTabProps> = ({ records }) => {
  // Check if any record actually has lat/lng coordinates
  // According to CDRRecord schema, lat/lng are not currently present.
  // If they were added later as an extension, we would use them.
  const hasCoordinates = (records as any[]).some(r => r.latitude && r.longitude);

  return (
    <div className="w-full h-[600px] flex flex-col bg-[#121212] border border-[#2e2e2e] rounded-xl overflow-hidden relative mb-10">
      {!hasCoordinates ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#121212] z-[1000] text-gray-400 font-mono text-sm">
          <div className="mb-2">📍 Coordinates not available in CDR file.</div>
          <div className="text-xs text-gray-500">Map plotting requires latitude and longitude fields.</div>
        </div>
      ) : null}
      
      <MapContainer 
        center={[23.685, 90.356]} // Default center (Bangladesh)
        zoom={7} 
        style={{ height: '100%', width: '100%', background: '#1e1e1e' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {/* We would render Markers and Polylines here if coordinates were available */}
      </MapContainer>
    </div>
  );
};
