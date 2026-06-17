'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowUpRight, 
  Camera, 
  Clock, 
  CheckCircle2, 
  Map, 
  Phone, 
  MessageSquare, 
  Globe, 
  ChevronRight, 
  Users,
  Check,
  Send,
  Sparkles
} from 'lucide-react';
import api from '@/lib/api';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, resolved: 0, users: 0, locations: 0 });
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [publicComplaints, setPublicComplaints] = useState<any[]>([]);
  
  // WhatsApp Simulator States
  const [waPhone, setWaPhone] = useState('');
  const [isWaRegistered, setIsWaRegistered] = useState(false);
  const [showWaToast, setShowWaToast] = useState(false);
  const [simulatedStatus, setSimulatedStatus] = useState<'pending' | 'process' | 'done'>('pending');

  useEffect(() => {
    // Check login state
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsLoggedIn(true);
      try {
        setUser(JSON.parse(userData));
      } catch (e) {}
    }

    // Check if phone already registered in local storage
    const savedWa = localStorage.getItem('wa_registered_phone');
    if (savedWa) {
      setWaPhone(savedWa);
      setIsWaRegistered(true);
    }

    // Fetch live complaints statistics
    const fetchStats = async () => {
      try {
        const res = await api.get('/complaints/public/stats');
        const { totalUsers, totalCount, resolvedCount, locationsCount } = res.data;
        
        setStats({
          total: totalCount,
          resolved: resolvedCount,
          users: totalUsers,
          locations: locationsCount
        });
      } catch (error) {
        console.warn('Could not retrieve live database statistics:', error);
      }
    };

    const fetchPublicComplaints = async () => {
      try {
        const res = await api.get('/complaints/public/list');
        setPublicComplaints(res.data);
      } catch (error) {
        console.warn('Could not retrieve public complaints:', error);
      }
    };

    fetchStats();
    fetchPublicComplaints();
  }, []);

  const handleRegisterWa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waPhone.trim()) return;
    localStorage.setItem('wa_registered_phone', waPhone);
    setIsWaRegistered(true);
    setShowWaToast(true);
    setTimeout(() => {
      setShowWaToast(false);
    }, 4000);
  };

  const handleUnregisterWa = () => {
    localStorage.removeItem('wa_registered_phone');
    setIsWaRegistered(false);
    setWaPhone('');
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'pending': return 'MENUNGGU VERIFIKASI';
      case 'process': return 'SEDANG DIPROSES';
      case 'done': return 'SELESAI DIPERBAIKI';
      default: return 'MENUNGGU';
    }
  };

  const getStatusColorClass = (status: string) => {
    switch(status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'process': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'done': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBF7] font-sans antialiased text-[#355872] selection:bg-[#EAECE4]/50 selection:text-[#355872]">
      
      {/* Toast Notification for WhatsApp Sim */}
      {showWaToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-white border border-[#EAECE4] rounded-2xl p-4 shadow-xl flex items-center space-x-3 max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="w-10 h-10 bg-[#355872] text-white rounded-full flex items-center justify-center flex-shrink-0">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#355872]">WhatsApp Terhubung!</h4>
            <p className="text-xs text-gray-550 mt-0.5">Notifikasi otomatis diaktifkan untuk nomor {waPhone}.</p>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="w-full fixed top-0 z-50 bg-[#FAFBF7]/80 backdrop-blur-md border-b border-[#EAECE4]/30 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between h-20 items-center">
            
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt="LaporPak Logo" 
                className="h-16 w-auto object-contain" 
              />
              <h1 className="text-3xl font-black text-[#355872] tracking-tight font-sans">
                LaporPak<span className="text-[#7AAACE]">.</span>
              </h1>
            </Link>
            
            {/* Nav Actions */}
            <div className="flex items-center space-x-6">
              {isLoggedIn ? (
                <Link 
                  href="/dashboard" 
                  className="text-[#355872] font-bold hover:text-[#7AAACE] transition-colors text-sm"
                >
                  Masuk
                </Link>
              ) : (
                <Link 
                  href="/login" 
                  className="text-[#355872] font-bold hover:text-[#7AAACE] transition-colors text-sm"
                >
                  Masuk
                </Link>
              )}
              
              <Link 
                href={isLoggedIn ? "/dashboard?action=create" : "/login?redirect=dashboard&action=create"} 
                className="bg-[#355872] text-white px-6 py-2.5 rounded-full font-bold hover:bg-[#253E50] transition-all hover:shadow-md text-sm"
              >
                Lapor Sekarang
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-36 pb-24 sm:pt-40 sm:pb-32 lg:pt-48 lg:pb-40 overflow-hidden bg-[#FAFBF7]">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/eco_village_hero.png" 
            alt="Beautiful modern eco-friendly Indonesian village" 
            className="w-full h-full object-cover object-center opacity-[0.25]"
          />
          {/* Gradients to fade edges and integrate background photo */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAFBF7] via-[#FAFBF7]/85 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAFBF7] via-transparent to-[#FAFBF7]/20"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Content */}
          <div className="lg:col-span-7 text-left space-y-6">
            
            <div className="inline-flex items-center space-x-2 bg-[#EAECE4]/40 text-[#355872] px-4 py-1.5 rounded-full font-bold text-xs tracking-wider uppercase">
              <Sparkles className="h-3 w-3 text-[#7AAACE]" />
              <span>SUPPORTING COMMUNITIES</span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#355872] tracking-tight leading-[1.1] font-sans">
              Transformasi Desa Melalui <br />
              <span className="font-serif italic font-medium text-[#355872]">Partisipasi Digital.</span>
            </h2>

            <p className="text-base sm:text-lg text-gray-700 max-w-xl leading-relaxed font-medium">
              Menghubungkan aspirasi warga dengan aksi nyata pemerintah desa. Cepat, transparan, dan berdampak langsung bagi kemajuan infrastruktur serta kerukunan sosial.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link 
                href={isLoggedIn ? "/dashboard?action=create" : "/login?redirect=dashboard&action=create"} 
                className="inline-flex items-center justify-center space-x-2 bg-[#355872] text-white px-8 py-4 rounded-full font-bold text-base hover:bg-[#253E50] hover:shadow-lg transition-all"
              >
                <span>Buat Laporan</span>
                <ArrowUpRight className="h-5 w-5" />
              </Link>
              
              <button 
                onClick={() => setIsPopupOpen(true)} 
                className="inline-flex items-center justify-center bg-white text-[#355872] border border-[#EAECE4] px-8 py-4 rounded-full font-bold text-base hover:bg-[#FAFBF7] transition-all"
              >
                Eksplorasi Dampak
              </button>
            </div>

            {/* Social Proof Indicator */}
            <div className="flex items-center space-x-4 pt-6">
              {/* Avatar Stack */}
              <div className="flex -space-x-3 overflow-hidden">
                <div className="inline-block h-10 w-10 rounded-full ring-2 ring-[#FAFBF7] bg-[#7AAACE] flex items-center justify-center font-bold text-xs text-white">A</div>
                <div className="inline-block h-10 w-10 rounded-full ring-2 ring-[#FAFBF7] bg-[#EAECE4] flex items-center justify-center font-bold text-xs text-[#355872]">B</div>
                <div className="inline-block h-10 w-10 rounded-full ring-2 ring-[#FAFBF7] bg-[#355872] flex items-center justify-center font-bold text-xs text-white">W</div>
                <div className="inline-block h-10 w-10 rounded-full ring-2 ring-[#FAFBF7] bg-[#355872] flex items-center justify-center text-xs font-bold text-[#EAECE4]">+{stats.users}</div>
              </div>
              <p className="text-xs font-extrabold text-gray-500 tracking-wider uppercase">
                WARGA TELAH <br/> BERPARTISIPASI
              </p>
            </div>

          </div>

          {/* Spacer for desktop layout alignment */}
          <div className="hidden lg:block lg:col-span-5"></div>

        </div>
      </header>

      {/* Statistics Section */}
      <section className="bg-white border-y border-[#EAECE4]/30 py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-[#EAECE4]/30">
            
            {/* Stat 1 */}
            <div className="space-y-2 lg:px-4">
              <p className="text-4xl sm:text-5xl font-black text-[#355872] font-sans tracking-tight">
                {stats.resolved.toLocaleString()}+
              </p>
              <p className="text-xs font-bold text-[#7AAACE] tracking-widest uppercase">LAPORAN SELESAI</p>
            </div>

            {/* Stat 2 */}
            <div className="space-y-2 pt-8 lg:pt-0 lg:px-4">
              <p className="text-4xl sm:text-5xl font-black text-[#355872] font-sans tracking-tight">1</p>
              <p className="text-xs font-bold text-[#7AAACE] tracking-widest uppercase">DESA AKTIF</p>
            </div>

            {/* Stat 3 */}
            <div className="space-y-2 pt-8 lg:pt-0 lg:px-4">
              <p className="text-4xl sm:text-5xl font-black text-[#355872] font-sans tracking-tight">24h</p>
              <p className="text-xs font-bold text-[#7AAACE] tracking-widest uppercase">RESPON RATA-RATA</p>
            </div>

            {/* Stat 4 */}
            <div className="space-y-2 pt-8 lg:pt-0 lg:px-4">
              <p className="text-4xl sm:text-5xl font-black text-[#355872] font-sans tracking-tight">98%</p>
              <p className="text-xs font-bold text-[#7AAACE] tracking-widest uppercase">KEPUASAN WARGA</p>
            </div>

          </div>
        </div>
      </section>

      {/* Work Flow Section */}
      <section id="alur-kerja" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-16">
          
          {/* Header */}
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-extrabold text-[#7AAACE] tracking-widest uppercase">PROSES PLATFORM</span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#355872] tracking-tight">
              Alur Kerja yang Transparan & Terpercaya
            </h2>
            <p className="text-base text-gray-550 leading-relaxed font-medium">
              Dirancang untuk memastikan setiap suara didengar dan setiap masalah diselesaikan dengan akuntabilitas tinggi.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="bg-white border border-[#EAECE4]/30 p-8 rounded-3xl space-y-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 bg-[#FAFBF7] border border-[#EAECE4]/20 rounded-2xl flex items-center justify-center">
                  <Camera className="h-6 w-6 text-[#355872]" />
                </div>
                <span className="text-xs font-extrabold text-[#7AAACE]">01. PENGIRIMAN</span>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-[#355872]">Ambil & Kirim</h3>
                <p className="text-sm text-gray-550 leading-relaxed font-medium">
                  Laporkan masalah di lapangan dengan foto dan lokasi otomatis. Cepat dan mudah dari hp atau website.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-[#EAECE4]/30 p-8 rounded-3xl space-y-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 bg-[#FAFBF7] border border-[#EAECE4]/20 rounded-2xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-[#355872]" />
                </div>
                <span className="text-xs font-extrabold text-[#7AAACE]">02. VERIFIKASI</span>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-[#355872]">Proses Cepat</h3>
                <p className="text-sm text-gray-550 leading-relaxed font-medium">
                  Admin desa memverifikasi laporan dalam hitungan jam. Anda akan menerima notifikasi setiap ada progres.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-[#EAECE4]/30 p-8 rounded-3xl space-y-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 bg-[#FAFBF7] border border-[#EAECE4]/20 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-[#355872]" />
                </div>
                <span className="text-xs font-extrabold text-[#7AAACE]">03. PENYELESAIAN</span>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-[#355872]">Hasil Nyata</h3>
                <p className="text-sm text-gray-550 leading-relaxed font-medium">
                  Pekerjaan diselesaikan dan dipublikasikan di dashboard warga sebagai bentuk transparansi publik.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Feature Highlights Section (Interactive Split Layout) */}
      <section className="pb-24 sm:pb-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Full Card: Geo-Monitoring */}
          <div className="lg:col-span-12 bg-[#355872] text-white p-8 sm:p-12 rounded-3xl flex flex-col justify-between space-y-12 min-h-[460px] relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500"></div>
            
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Map className="h-6 w-6 text-[#EAECE4]" />
            </div>

            <div className="space-y-6 max-w-xl relative z-10">
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Geo-Monitoring <br/> Interaktif
              </h3>
              <p className="text-sm sm:text-base text-gray-250 leading-relaxed font-medium">
                Pantau sebaran pembangunan dan perbaikan desa secara real-time melalui peta digital yang presisi dan mudah diakses.
              </p>
              <Link 
                href="/map"
                className="inline-flex items-center space-x-2 bg-white text-[#355872] px-6 py-3 rounded-full font-bold text-sm hover:bg-[#FAFBF7] transition-all hover:translate-x-1"
              >
                <span>Buka Peta Live ({stats.locations} Lokasi)</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <div className="bg-[#355872] text-white rounded-[32px] p-8 sm:p-16 text-center space-y-8 relative overflow-hidden shadow-2xl">
            {/* Graphic Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
            
            <div className="max-w-2xl mx-auto space-y-4 relative z-10">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Mulai Perubahan Besar Hari Ini.
              </h2>
              <p className="text-sm sm:text-base text-gray-250 leading-relaxed font-medium">
                Jadilah bagian dari revolusi digital desa untuk masa depan yang lebih transparan, akuntabel, dan makmur bagi seluruh warga.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 relative z-10">
              <Link 
                href="/register" 
                className="bg-white text-[#355872] px-8 py-4 rounded-full font-bold text-base hover:bg-[#FAFBF7] hover:shadow-lg transition-all"
              >
                Daftar sebagai Warga
              </Link>
              
              <button 
                onClick={() => setIsPopupOpen(true)}
                className="bg-transparent border border-white/40 hover:border-white text-white px-8 py-4 rounded-full font-bold text-base transition-all"
              >
                Pelajari Lebih Lanjut
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#FAFBF7] border-t border-[#EAECE4]/30 py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            
            {/* Logo & Description */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center space-x-3">
                <img 
                  src="/logo.png" 
                  alt="LaporPak Logo" 
                  className="h-14 w-auto object-contain" 
                />
                <h3 className="text-2xl font-black text-[#355872] tracking-tight">
                  LaporPak<span className="text-[#7AAACE]">.</span>
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-550 leading-relaxed font-medium max-w-sm">
                Platform sistem digital desa yang menghubungkan warga dan pemerintah untuk membangun masa depan desa yang transparan, akuntabel, dan menarik.
              </p>
            </div>

            {/* Links Columns */}
            <div className="md:col-span-7 grid grid-cols-3 gap-6">
              
              {/* Navigasi */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-[#355872] uppercase tracking-wider">Navigasi</h4>
                <ul className="space-y-2 text-xs font-bold text-gray-400">
                  <li><Link href="/dashboard" className="hover:text-[#355872] transition-colors">Masuk</Link></li>
                  <li><Link href="/map" className="hover:text-[#355872] transition-colors">Peta Baru</Link></li>
                  <li><button onClick={() => handleScrollToSection('alur-kerja')} className="hover:text-[#355872] transition-colors">Statistik</button></li>
                </ul>
              </div>

              {/* Layanan */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-[#355872] uppercase tracking-wider">Layanan</h4>
                <ul className="space-y-2 text-xs font-bold text-gray-400">
                  <li><Link href="/dashboard" className="hover:text-[#355872] transition-colors">Aspirasi Warga</Link></li>
                  <li><Link href="/dashboard" className="hover:text-[#355872] transition-colors">Pengaduan Sosial</Link></li>
                  <li><Link href="/dashboard" className="hover:text-[#355872] transition-colors">Keamanan</Link></li>
                </ul>
              </div>

              {/* Organisasi */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-[#355872] uppercase tracking-wider">Organisasi</h4>
                <ul className="space-y-2 text-xs font-bold text-gray-400">
                  <li><Link href="/dashboard" className="hover:text-[#355872] transition-colors">Pusat Bantuan</Link></li>
                  <li><Link href="/login" className="hover:text-[#355872] transition-colors">Privasi</Link></li>
                </ul>
              </div>

            </div>

          </div>

          {/* Bottom Footer Row */}
          <div className="border-t border-[#EAECE4]/20 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-gray-400">
            <p>© {new Date().getFullYear()} LaporPak - All Rights Reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-[#355872] transition-colors">Instagram</a>
              <a href="#" className="hover:text-[#355872] transition-colors">Twitter</a>
              <a href="#" className="hover:text-[#355872] transition-colors">Facebook</a>
            </div>
          </div>

        </div>
      </footer>

      {/* Explorasi Dampak Popup Modal */}
      {isPopupOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsPopupOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-[#EAECE4]/30 flex justify-between items-center bg-[#FAFBF7]">
              <div>
                <h3 className="text-2xl font-black text-[#355872]">Eksplorasi Dampak</h3>
                <p className="text-sm text-gray-550 font-medium">Laporan nyata dari warga yang telah direspon.</p>
              </div>
              <button 
                onClick={() => setIsPopupOpen(false)}
                className="w-10 h-10 bg-white border border-[#EAECE4] rounded-full flex items-center justify-center text-[#355872] hover:bg-[#EAECE4]/20 transition-all font-bold"
              >
                X
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {publicComplaints.length > 0 ? publicComplaints.map((c: any) => {
                  const images = c.image ? c.image.split(',') : [];
                  const thumb = images.length > 0 ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${images[0]}` : null;
                  return (
                    <div key={c.id} className="bg-white border border-[#EAECE4]/30 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${c.status === 'done' || c.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                          {c.status === 'done' || c.status === 'approved' ? 'Selesai' : 'Diproses'}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">{new Date(c.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                      
                      <h4 className="font-bold text-[#355872] text-lg leading-tight line-clamp-2">{c.title}</h4>
                      <p className="text-sm text-gray-550 line-clamp-3">{c.description}</p>
                      
                      {thumb && (
                        <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-100">
                          <img src={thumb} alt={c.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 pt-2 border-t border-[#EAECE4]/20">
                        <div className="w-6 h-6 rounded-full bg-[#EAECE4] text-[#355872] flex items-center justify-center text-[10px] font-bold overflow-hidden">
                          {c.user_profile_image ? (
                            <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${c.user_profile_image}`} alt={c.user_name} className="w-full h-full object-cover" />
                          ) : (
                            c.user_name?.[0]?.toUpperCase() || 'W'
                          )}
                        </div>
                        <span className="text-xs font-bold text-[#355872]">{c.user_name}</span>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="col-span-1 md:col-span-2 py-12 text-center space-y-3">
                    <div className="w-16 h-16 bg-[#EAECE4]/20 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-8 w-8 text-[#355872]" />
                    </div>
                    <p className="text-gray-500 font-medium">Belum ada laporan publik yang dapat ditampilkan.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
