'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function MapViewer({ latitude, longitude, title }: { latitude: number, longitude: number, title?: string }) {
  if (!latitude || !longitude) return null;
  
  const position = [latitude, longitude] as [number, number];

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden border border-gray-200 z-10 relative">
      <MapContainer 
        key={`${latitude}-${longitude}`}
        center={position} 
        zoom={16} 
        style={{ height: '100%', width: '100%', zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={icon}>
          {title && (
            <Popup>
              <strong>{title}</strong>
            </Popup>
          )}
        </Marker>
      </MapContainer>
      
      {/* Tombol Buka di Google Maps */}
      <a 
        href={`https://www.google.com/maps?q=${latitude},${longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 z-[1000] bg-white px-4 py-2 rounded-lg shadow-md text-sm font-bold text-[#355872] hover:bg-gray-50 border border-gray-200"
      >
        Buka di Google Maps
      </a>
    </div>
  );
}
