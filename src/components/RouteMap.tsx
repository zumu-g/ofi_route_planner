import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import type { Location } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface RouteMapProps {
  locations: Location[];
}

export const RouteMap: React.FC<RouteMapProps> = ({ locations }) => {
  const validLocations = locations.filter(loc => loc.coordinates);
  
  if (validLocations.length === 0) {
    return (
      <div className="card" style={{ 
        height: '400px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'var(--color-text-secondary)'
      }}>
        <p>Add locations with coordinates to view them on the map</p>
      </div>
    );
  }
  
  const bounds = validLocations.map(loc => [loc.coordinates!.lat, loc.coordinates!.lng] as [number, number]);
  const center = bounds[0] || [-33.8688, 151.2093]; // Default to Sydney, Australia
  
  const polylinePositions = validLocations.map(loc => [
    loc.coordinates!.lat,
    loc.coordinates!.lng
  ] as [number, number]);
  
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '400px', width: '100%' }}
        bounds={bounds.length > 1 ? bounds : undefined}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {validLocations.map((location, index) => (
          <Marker 
            key={location.id} 
            position={[location.coordinates!.lat, location.coordinates!.lng]}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <strong>{index + 1}. {location.name || location.address}</strong>
                <br />
                {location.address}
                <br />
                <small>Duration: {location.duration} min</small>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {polylinePositions.length > 1 && (
          <Polyline 
            positions={polylinePositions}
            color="#1e40af"
            weight={3}
            opacity={0.7}
          />
        )}
      </MapContainer>
    </div>
  );
};