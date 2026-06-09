'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [0, -30],
  shadowSize: [32, 32]
});

function MapBounds({ complaints }: { complaints: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (complaints.length > 0) {
      const bounds = L.latLngBounds(complaints.map(c => [parseFloat(c.latitude), parseFloat(c.longitude)]));
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [complaints, map]);
  return null;
}

export default function MapOverviewAdmin({ complaints }: { complaints: any[] }) {
  const validComplaints = complaints.filter(c => c.latitude && c.longitude);

  return (
    <div className="w-full h-full relative">
      <MapContainer 
        center={[-6.385589, 106.830711]} 
        zoom={12} 
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validComplaints.length > 0 && <MapBounds complaints={validComplaints} />}
        
        {validComplaints.map(complaint => (
          <Marker 
            key={complaint.id} 
            position={[parseFloat(complaint.latitude), parseFloat(complaint.longitude)]}
            icon={icon}
          >
            <Popup>
              <div className="min-w-[150px]">
                <h3 className="font-bold text-xs mb-1">{complaint.title}</h3>
                <p className="text-[10px] text-gray-500">{complaint.user_name}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
