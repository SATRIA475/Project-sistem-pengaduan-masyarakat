'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function LocationMarker({ position, setPosition }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void }) {
  useMapEvents({
    click(e: L.LeafletMouseEvent) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={icon}></Marker>
  );
}

export default function MapPicker({ 
  onLocationSelected, 
  onClose 
}: { 
  onLocationSelected: (lat: number, lng: number) => void,
  onClose: () => void 
}) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  // Auto detect user location initially if they want
  useEffect(() => {
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition(L.latLng(pos.coords.latitude, pos.coords.longitude));
        },
        () => {
          // If fail, default to Depok/Jakarta
          setPosition(L.latLng(-6.385589, 106.830711));
        }
      );
    } else {
      setPosition(L.latLng(-6.385589, 106.830711));
    }
  }, []);

  const handleConfirm = () => {
    if (position) {
      onLocationSelected(position.lat, position.lng);
      onClose();
    } else {
      alert('Silakan klik pada peta untuk memilih lokasi terlebih dahulu.');
    }
  };



  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#F7F8F0]">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Pilih Lokasi Kejadian</h3>
            <p className="text-xs text-gray-500">Klik pada peta untuk memindahkan pin merah.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 font-bold">
            ✕
          </button>
        </div>
        
        <div className="h-96 w-full relative">
          {position ? (
            <MapContainer 
              key={`picker-${position.lat}-${position.lng}`}
              center={position} 
              zoom={15} 
              style={{ height: '100%', width: '100%', zIndex: 1 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <span className="text-gray-500">Mencari lokasi awal...</span>
            </div>
          )}
        </div>

        <div className="p-4 bg-white flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-full font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Batal
          </button>
          <button 
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-full font-bold text-white bg-[#355872] hover:bg-[#355872] transition-colors"
          >
            Konfirmasi Lokasi
          </button>
        </div>
      </div>
    </div>
  );
}
