'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/api';

// Dynamically import the map component with ssr disabled
// Leaflet uses 'window' object which is not available during server-side rendering
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-[#F7F8F0] flex items-center justify-center flex-col space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#355872]"></div>
      <p className="text-[#355872] font-bold">Memuat Peta Laporan...</p>
    </div>
  )
});

export default function MapPage() {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints');
      setComplaints(res.data);
    } catch (error) {
      console.error('Error fetching complaints for map:', error);
    }
  };

  return (
    <main className="w-full h-screen overflow-hidden bg-[#F7F8F0]">
      <MapComponent complaints={complaints} />
    </main>
  );
}
