'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

// Fix for default marker icons in React-Leaflet
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

// A component to auto-fit the map bounds based on markers
function MapBounds({ complaints }: { complaints: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (complaints.length > 0) {
      const bounds = L.latLngBounds(complaints.map(c => [parseFloat(c.latitude), parseFloat(c.longitude)]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [complaints, map]);
  return null;
}

export default function MapComponent({ complaints }: { complaints: any[] }) {
  const router = useRouter();

  // Filter out complaints that don't have valid coordinates
  const validComplaints = complaints.filter(c => c.latitude && c.longitude);

  return (
    <div className="w-full h-full relative flex flex-col">
      {/* Header */}
      <div className="absolute top-4 left-4 z-[1000] flex items-center space-x-3">
        <button 
          onClick={() => router.push('/dashboard')} 
          className="bg-white p-3 rounded-xl shadow-lg text-gray-700 hover:text-[#355872] hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="bg-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 border border-gray-100">
          <h2 className="text-xl font-bold text-[#355872]">Peta Laporan Warga</h2>
          <span className="bg-[#9CD5FF] text-[#355872] text-xs font-bold px-2 py-1 rounded-full">{validComplaints.length} Titik</span>
        </div>
      </div>

      <MapContainer 
        center={[-6.385589, 106.830711]} // Default to somewhere in Indonesia (Depok area)
        zoom={13} 
        style={{ height: '100%', width: '100%', zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validComplaints.length > 0 && <MapBounds complaints={validComplaints} />}
        
        {validComplaints.map(complaint => (
          <Marker 
            key={complaint.id} 
            position={[parseFloat(complaint.latitude), parseFloat(complaint.longitude)]}
            icon={icon}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs font-bold bg-[#9CD5FF] text-[#355872] px-2 py-0.5 rounded-full uppercase">
                    {complaint.status}
                  </span>
                  <span className="text-xs text-gray-500">{new Date(complaint.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{complaint.title}</h3>
                <p className="text-xs text-gray-600 line-clamp-2">{complaint.description}</p>
                <p className="text-xs font-semibold text-gray-400 mt-2">Oleh: {complaint.user_name}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
