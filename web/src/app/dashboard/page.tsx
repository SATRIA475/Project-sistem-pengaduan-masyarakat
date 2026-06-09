'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  LogOut,
  Home,
  Bell,
  Map,
  User as UserIcon,
  MessageSquare,
  ThumbsUp,
  MoreHorizontal,
  Image as ImageIcon,
  MapPin,
  Bookmark,
  ArrowLeft,
  Share2,
  Send,
  Camera,
  Check,
  Search,
  HelpCircle,
  Plus,
  Settings,
  Grid,
  Trash2,
  Flag
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import MapPicker & MapViewer to prevent SSR issues
const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });
const MapViewer = dynamic(() => import('@/components/MapViewer'), { ssr: false });

const CrossedImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#355872]/30">
    <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="m21 15-5-5L5 21" />
    <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export default function Dashboard() {
  const [complaints, setComplaints] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [category, setCategory] = useState('Infrastruktur Jalan');
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Laporan Saya Tab States
  const [laporanSayaStatusFilter, setLaporanSayaStatusFilter] = useState<'Semua' | 'Menunggu' | 'Proses' | 'Selesai'>('Semua');
  const [laporanSayaSearchQuery, setLaporanSayaSearchQuery] = useState('');

  // Reverse Geocoded Address
  const [resolvedAddress, setResolvedAddress] = useState('Jalan Sudirman');
  const [resolvedSubAddress, setResolvedSubAddress] = useState('Jakarta Pusat, DKI Jakarta 10220');
  const [searchMapQuery, setSearchMapQuery] = useState('');

  // Selected Detail View Complaint
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [isCreateReportOpen, setIsCreateReportOpen] = useState(false);

  // Interaction States
  const [openComments, setOpenComments] = useState<{ [key: number]: boolean }>({});
  const [commentsData, setCommentsData] = useState<{ [key: number]: any[] }>({});
  const [commentInput, setCommentInput] = useState<{ [key: number]: string }>({});

  const [activeTab, setActiveTab] = useState<'beranda' | 'notifikasi' | 'profil' | 'pengaturan'>('beranda');
  const [profileTab, setProfileTab] = useState<'laporan_saya' | 'tersimpan' | 'aktivitas'>('laporan_saya');
  const [notifications, setNotifications] = useState([]);

  // Saved / Bookmark State
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Edit Profile States
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ email: '', password: '' });
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [deleteResponseConfirmId, setDeleteResponseConfirmId] = useState<number | null>(null);

  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [activeHelpTab, setActiveHelpTab] = useState<'guide' | 'chat'>('guide');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    const saved = localStorage.getItem('saved_complaints');
    if (saved) {
      setSavedIds(JSON.parse(saved));
    }
    fetchComplaints();
    fetchNotifications();

    // Check for landing page action redirects (deep links)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'create') {
      setIsCreateReportOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Background auto-polling for true real-time reactivity without reload!
    const pollInterval = setInterval(() => {
      fetchComplaints();
      fetchNotifications();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  const fetchChatMessages = async () => {
    try {
      const res = await api.get('/chats/messages');
      setChatMessages(res.data);
    } catch (error) {
      console.error('Gagal mengambil pesan chat:', error);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    try {
      await api.post('/chats/messages', { message: chatInput });
      setChatInput('');
      fetchChatMessages();
    } catch (error) {
      console.error('Gagal mengirim pesan:', error);
    }
  };

  useEffect(() => {
    if (!isGuideModalOpen || activeHelpTab !== 'chat') return;

    fetchChatMessages();
    const chatInterval = setInterval(() => {
      fetchChatMessages();
    }, 3000); // 3s polling for fast real-time chat sync!

    return () => clearInterval(chatInterval);
  }, [isGuideModalOpen, activeHelpTab]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/complaints/notifications');
      setNotifications(res.data);
    } catch (error) {
      console.error('Gagal mengambil notifikasi:', error);
    }
  };

  const handleDeleteNotificationResponse = (id: number) => {
    setDeleteResponseConfirmId(id);
  };

  const executeDeleteNotificationResponse = async (id: number) => {
    try {
      await api.delete(`/responses/${id}`);
      alert('Tanggapan berhasil dihapus');
      fetchNotifications();
    } catch (error) {
      alert('Gagal menghapus tanggapan');
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints');
      setComplaints(res.data);
    } catch (error) {
      console.error(error);
      router.push('/login');
    }
  };

  // Reverse geocoding on location selection
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      if (data && data.address) {
        const road = data.address.road || data.address.suburb || data.address.village || 'Lokasi Tersemat';
        const city = data.address.city || data.address.regency || data.address.town || 'DKI Jakarta';
        const postcode = data.address.postcode || '';
        const state = data.address.state || '';

        setResolvedAddress(road);
        setResolvedSubAddress(`${city}, ${state} ${postcode}`.trim());
      }
    } catch (e) {
      setResolvedAddress(`Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      setResolvedSubAddress('Lokasi Tersemat');
    }
  };

  const handleLocationSelected = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    reverseGeocode(lat, lng);
  };

  const searchMapLocation = async () => {
    if (!searchMapQuery.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchMapQuery)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setLatitude(lat);
        setLongitude(lon);

        const road = data[0].display_name.split(',')[0] || 'Lokasi Tersemat';
        const parts = data[0].display_name.split(',');
        const sub = parts.slice(1, 3).join(',').trim() || 'DKI Jakarta';

        setResolvedAddress(road);
        setResolvedSubAddress(sub);
      } else {
        alert('Lokasi tidak ditemukan');
      }
    } catch (err) {
      console.error('Error searching location:', err);
    }
  };

  const toggleLike = async (complaintId: number) => {
    try {
      await api.post(`/complaints/${complaintId}/like`);
      fetchComplaints();
      if (selectedComplaint && selectedComplaint.id === complaintId) {
        // Refresh selected complaint details
        const updated = await api.get(`/complaints/${complaintId}`);
        setSelectedComplaint(updated.data);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const toggleSave = (complaintId: number) => {
    let updated;
    if (savedIds.includes(complaintId)) {
      updated = savedIds.filter(id => id !== complaintId);
    } else {
      updated = [...savedIds, complaintId];
    }
    setSavedIds(updated);
    localStorage.setItem('saved_complaints', JSON.stringify(updated));
  };

  const handleViewDetails = async (c: any) => {
    try {
      setIsCreateReportOpen(false);
      setActivePhotoIndex(0);
      const res = await api.get(`/complaints/${c.id}`);
      setSelectedComplaint(res.data);

      // Auto load comments
      const commentsRes = await api.get(`/complaints/${c.id}/comments`);
      setCommentsData(prev => ({ ...prev, [c.id]: commentsRes.data }));

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      alert('Gagal mengambil detail pengaduan');
    }
  };

  const handleShare = (id: number) => {
    const url = `${window.location.origin}/dashboard?report=${id}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Tautan laporan disalin ke clipboard!');
    }).catch(() => {
      alert('Gagal menyalin tautan');
    });
  };

  const handleReportContent = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin melaporkan konten ini sebagai spam atau melanggar aturan?')) return;
    try {
      await api.post(`/complaints/${id}/report`);
      alert('Laporan tentang konten ini berhasil dikirim ke Admin untuk ditinjau.');
      setShowMoreDropdown(false);
    } catch (error) {
      alert('Gagal melaporkan konten');
    }
  };

  const submitComment = async (e: React.FormEvent, complaintId: number) => {
    e.preventDefault();
    const text = commentInput[complaintId];
    if (!text || text.trim() === '') return;

    try {
      await api.post(`/complaints/${complaintId}/comments`, { comment: text });
      setCommentInput(prev => ({ ...prev, [complaintId]: '' }));

      // Refresh comments
      const res = await api.get(`/complaints/${complaintId}/comments`);
      setCommentsData(prev => ({ ...prev, [complaintId]: res.data }));
      fetchComplaints(); // to update comment count

      if (selectedComplaint && selectedComplaint.id === complaintId) {
        const updated = await api.get(`/complaints/${complaintId}`);
        setSelectedComplaint(updated.data);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      alert('Mohon isi judul dan deskripsi laporan');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);

    if (images.length > 0) {
      images.forEach((img) => {
        formData.append('image', img);
      });
    }

    if (latitude) formData.append('latitude', latitude.toString());
    if (longitude) formData.append('longitude', longitude.toString());
    formData.append('category', category);

    try {
      await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Pengaduan berhasil dikirim!');
      setTitle('');
      setDescription('');
      setImages([]);
      setImagePreviews([]);
      setLatitude(null);
      setLongitude(null);
      setIsCreateReportOpen(false);
      setActiveTab('notifikasi'); // Redirect to Laporan tab
      fetchComplaints();
    } catch (error) {
      alert('Gagal mengirim pengaduan');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProfileData.email && !editProfileData.password && !profileFile) {
      alert('Tidak ada perubahan yang disimpan');
      return;
    }

    setIsSubmittingProfile(true);
    try {
      const formData = new FormData();
      if (editProfileData.email) formData.append('email', editProfileData.email);
      if (editProfileData.password) formData.append('password', editProfileData.password);
      if (profileFile) formData.append('profile_image', profileFile);

      const res = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Profil berhasil diperbarui!');

      const updatedUser = {
        ...user,
        ...(editProfileData.email ? { email: editProfileData.email } : {}),
        profile_image: res.data.profile_image
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      setIsEditProfileModalOpen(false);
      setEditProfileData({ email: '', password: '' });
      setProfileFile(null);
      setProfilePreview(null);
      setActiveTab('profil');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'done':
      case 'approved':
        return { bg: 'bg-[#9CD5FF] text-[#355872] border-[#9CD5FF]', label: 'Disetujui', dot: 'bg-[#355872]' };
      case 'process':
        return { bg: 'bg-[#FFF4E0] text-[#D98A2C] border-[#FAD8B2]', label: 'Sedang Diproses', dot: 'bg-[#D98A2C]' };
      case 'rejected':
        return { bg: 'bg-[#7AAACE] text-[#D9534F] border-[#F8C1BE]', label: 'Ditolak', dot: 'bg-[#D9534F]' };
      default:
        return { bg: 'bg-[#F2F2F2] text-[#7AAACE] border-[#E3E3E3]', label: 'Menunggu', dot: 'bg-[#7AAACE]' };
    }
  };

  const filteredFeed = complaints.filter((c: any) => {
    // Relaxed search category match for mockup categories like 'Infrastruktur' to match 'Infrastruktur Jalan'
    const matchesCategory = selectedCategory
      ? (c.category || 'Lainnya').toLowerCase().includes(selectedCategory.toLowerCase())
      : true;
    const matchesSearch = searchQuery
      ? c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user_name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  const getIndonesianTimeAgo = (dateString: string) => {
    const created = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHrs < 1) return 'Baru saja';
    if (diffHrs < 24) return `${diffHrs} jam yang lalu`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays} hari yang lalu`;
  };

  const activeReportsCount = complaints.filter((c: any) => c.status === 'pending' || c.status === 'process' || c.status === 'waiting').length;
  const resolvedCount = complaints.filter((c: any) => c.status === 'done' || c.status === 'approved').length;
  const totalCount = complaints.length;
  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100;

  // Compute related complaints for selected detail view
  const relatedComplaints = complaints
    .filter((c: any) => c.id !== selectedComplaint?.id)
    .slice(0, 2);

  // Combine comments and official responses into a chronological stream
  const allTimelineUpdates = selectedComplaint
    ? [
      ...(commentsData[selectedComplaint.id] || []).map((com: any) => ({
        id: `comment-${com.id}`,
        sender: com.user_name,
        role: 'Warga Terverifikasi',
        avatar: com.user_profile_image ? `http://localhost:5000${com.user_profile_image}` : null,
        letter: com.user_name?.[0]?.toUpperCase() || 'U',
        message: com.comment,
        created_at: com.created_at,
        is_official: false
      })),
      ...(selectedComplaint.responses || []).map((resp: any) => ({
        id: `response-${resp.id}`,
        sender: resp.admin_name || 'Dinas Pertamanan',
        role: 'TANGGAPAN RESMI',
        avatar: resp.admin_profile_image ? `http://localhost:5000${resp.admin_profile_image}` : null,
        letter: resp.admin_name?.[0]?.toUpperCase() || 'A',
        message: resp.message,
        created_at: resp.created_at,
        is_official: true
      }))
    ].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  return (
    <div className="min-h-screen bg-[#FAFBF7] font-sans relative antialiased text-[#355872]">
      {/* Map Picker Modal */}
      {isMapPickerOpen && (
        <MapPicker
          onLocationSelected={handleLocationSelected}
          onClose={() => setIsMapPickerOpen(false)}
        />
      )}

      {/* Top Navbar (Mobile / Tablet Only) */}
      <nav className="lg:hidden sticky top-0 z-50 bg-[#FAFBF7]/90 backdrop-blur-md border-b border-[#EAECE4] px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => { setSelectedComplaint(null); setIsCreateReportOpen(false); setActiveTab('beranda'); }}>
          <h1 className="text-xl font-black text-[#355872] tracking-tight">LaporPak</h1>
        </div>
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative p-2 text-[#355872] hover:bg-[#EAECE4] rounded-full transition-all"
            >
              <Bell className="h-5.5 w-5.5" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full shadow-sm">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Dropdown Card */}
            {showNotifDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifDropdown(false)}></div>
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-gray-50 bg-[#F4F5F0] flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Notifikasi</h3>
                    <span className="text-xs text-[#355872] font-semibold">{notifications.length} Baru</span>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">Belum ada notifikasi baru.</p>
                      </div>
                    ) : (
                      notifications.map((n: any) => (
                        <div key={n.id} className="p-4 border-b border-gray-50 hover:bg-[#FAFBF7] transition-colors relative group">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#EAECE4] flex-shrink-0 flex items-center justify-center text-[#355872] font-bold text-xs overflow-hidden">
                              {n.admin_profile_image ? (
                                <img src={`http://localhost:5000${n.admin_profile_image}`} alt={n.admin_name} className="w-full h-full object-cover" />
                              ) : (
                                n.admin_name?.[0]?.toUpperCase() || 'A'
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-850 leading-snug mb-1">
                                <span className="font-bold">{n.admin_name}</span> membalas <span className="italic">"{n.complaint_title}"</span>
                              </p>
                              <p className="text-[11px] text-gray-500 bg-[#FAFBF7] p-1.5 rounded border border-gray-100">"{n.message}"</p>
                              <p className="text-[9px] text-gray-400 mt-1.5">{new Date(n.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile */}
          <button
            onClick={() => { setActiveTab('profil'); setSelectedComplaint(null); setIsCreateReportOpen(false); }}
            className="flex items-center space-x-2 group"
          >
            <div className="w-8 h-8 rounded-full border border-[#EAECE4] flex items-center justify-center bg-[#EAECE4] overflow-hidden text-[#355872] font-bold text-xs">
              {user?.profile_image ? (
                <img src={`http://localhost:5000${user.profile_image}`} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">

        {/* Left Sidebar (Desktop Only) */}
        <aside className="hidden lg:flex flex-col justify-between w-72 bg-[#F4F5F0] rounded-3xl p-6 h-[calc(100vh-4rem)] sticky top-8 flex-shrink-0">
          <div className="space-y-8">
            {/* Logo */}
            <div className="flex items-center space-x-2 py-2">
              <h1 className="text-2xl font-black text-[#355872] tracking-tight">LaporPak</h1>
            </div>

            {/* Navigation Tabs */}
            <nav className="space-y-1">
              <button
                onClick={() => { setActiveTab('beranda'); setSelectedComplaint(null); setIsCreateReportOpen(false); }}
                className={`w-full flex items-center space-x-4 px-4 py-3.5 rounded-2xl font-bold transition-all ${activeTab === 'beranda' && !isCreateReportOpen && !selectedComplaint ? 'bg-[#7AAACE] text-[#355872]' : 'text-[#7AAACE] hover:bg-[#EAECE4]'}`}
              >
                <Grid className="h-5 w-5" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => { setActiveTab('notifikasi'); setSelectedComplaint(null); setIsCreateReportOpen(false); }}
                className={`w-full flex items-center space-x-4 px-4 py-3.5 rounded-2xl font-bold transition-all ${activeTab === 'notifikasi' && !isCreateReportOpen && !selectedComplaint ? 'bg-[#7AAACE] text-[#355872]' : 'text-[#7AAACE] hover:bg-[#EAECE4]'}`}
              >
                <MessageSquare className="h-5 w-5" />
                <span>Laporan</span>
              </button>

              <button
                onClick={() => { setActiveTab('profil'); setSelectedComplaint(null); setIsCreateReportOpen(false); }}
                className={`w-full flex items-center space-x-4 px-4 py-3.5 rounded-2xl font-bold transition-all ${activeTab === 'profil' && !isCreateReportOpen && !selectedComplaint ? 'bg-[#7AAACE] text-[#355872]' : 'text-[#7AAACE] hover:bg-[#EAECE4]'}`}
              >
                <UserIcon className="h-5 w-5" />
                <span>Profil</span>
              </button>

              <button
                onClick={() => { setActiveTab('pengaturan'); setSelectedComplaint(null); setIsCreateReportOpen(false); }}
                className={`w-full flex items-center space-x-4 px-4 py-3.5 rounded-2xl font-bold transition-all ${activeTab === 'pengaturan' && !isCreateReportOpen && !selectedComplaint ? 'bg-[#7AAACE] text-[#355872]' : 'text-[#7AAACE] hover:bg-[#EAECE4]'}`}
              >
                <Settings className="h-5 w-5" />
                <span>Pengaturan</span>
              </button>
            </nav>
          </div>

          <div className="space-y-6">
            {/* Create Report Button */}
            <button
              onClick={() => { setIsCreateReportOpen(true); setSelectedComplaint(null); }}
              className="w-full bg-[#355872] hover:bg-[#355872] text-white font-extrabold py-3.5 px-6 rounded-full shadow-md transition-all flex items-center justify-center gap-2 text-sm"
            >
              <span className="text-lg leading-none">+</span> Buat Laporan
            </button>

            {/* Bottom Links */}
            <div className="border-t border-[#EAECE4] pt-4 space-y-1">
              <button
                onClick={() => { setIsGuideModalOpen(true); setActiveHelpTab('guide'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-[#7AAACE] hover:bg-[#EAECE4] rounded-xl transition-colors"
              >
                <HelpCircle size={18} />
                Pusat Bantuan
              </button>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors"
              >
                <LogOut size={18} />
                Keluar
              </button>
            </div>
          </div>
        </aside>

        {/* Main Dynamic View Area */}
        <main className="flex-1 min-w-0">

          {/* 1. DETAILED COMPLAINT VIEW */}
          {selectedComplaint && (
            <div className="animate-in fade-in duration-300">

              {/* Back Breadcrumb */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#355872] transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span>← Kembali ke Laporan</span>
                  <span className="text-gray-300 mx-1">/</span>
                  <span className="text-gray-400 font-medium">Laporan #RP-2026-{selectedComplaint.id.toString().padStart(3, '0')}</span>
                </button>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleShare(selectedComplaint.id)}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-550 transition-colors" title="Bagikan"
                  >
                    <Share2 size={18} />
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                      className="p-2 hover:bg-gray-100 rounded-full text-gray-550 transition-colors" title="Pilihan Lainnya"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {showMoreDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
                        <button 
                          onClick={() => handleReportContent(selectedComplaint.id)}
                          className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                        >
                          <Flag size={14} /> Laporkan Konten
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Redesigned Two-Column Details Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Left Side (70%) */}
                <div className="xl:col-span-2 space-y-8">

                  {/* Title & Metadata Card */}
                  <div className="bg-white rounded-3xl p-6 border border-[#EAECE4]/60 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase border shadow-sm ${getStatusConfig(selectedComplaint.status).bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusConfig(selectedComplaint.status).dot}`}></span>
                        {getStatusConfig(selectedComplaint.status).label}
                      </span>
                      <span className="text-xs font-bold text-[#355872] bg-[#EAECE4] px-3.5 py-1.5 rounded-full">{selectedComplaint.category || 'Infrastruktur'}</span>
                      <span className="text-xs font-semibold text-gray-450">{new Date(selectedComplaint.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>

                    <h2 className="text-3xl font-black text-[#355872] leading-tight tracking-tight">{selectedComplaint.title}</h2>

                    {/* Reporter Info Row */}
                    <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                      <div className="w-10 h-10 rounded-full bg-[#EAECE4] flex items-center justify-center text-[#355872] font-extrabold text-sm shadow-inner overflow-hidden flex-shrink-0">
                        {selectedComplaint.user_profile_image ? (
                          <img src={`http://localhost:5000${selectedComplaint.user_profile_image}`} alt={selectedComplaint.user_name} className="w-full h-full object-cover" />
                        ) : (
                          selectedComplaint.user_name?.[0]?.toUpperCase() || 'U'
                        )}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[14px] text-gray-900 leading-tight">{selectedComplaint.user_name}</h4>
                        <p className="text-xs font-bold text-gray-400">Warga Terverifikasi</p>
                      </div>
                    </div>
                  </div>

                  {/* Main Large Image & Gallery */}
                  <div className="bg-white rounded-3xl p-6 border border-[#EAECE4]/60 shadow-sm space-y-4">
                    {(() => {
                      const images = selectedComplaint.image ? selectedComplaint.image.split(',') : [];
                      const activeImage = images[activePhotoIndex] || images[0] || '';
                      return (
                        <>
                          <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl border border-gray-100 bg-[#FAFBF7] flex items-center justify-center relative">
                            {activeImage ? (
                              <img
                                src={`http://localhost:5000${activeImage}`}
                                alt="Evidence Image"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-gray-300">
                                <ImageIcon size={64} className="stroke-[1.2]" />
                                <span className="text-xs mt-2 font-bold uppercase tracking-wider text-gray-450">Tidak ada bukti gambar dilampirkan</span>
                              </div>
                            )}
                          </div>

                          {/* Dynamic Thumbnails Gallery */}
                          {images.length > 0 && (
                            <div className="flex flex-wrap gap-3">
                              {images.map((imgUrl: string, idx: number) => (
                                <div
                                  key={idx}
                                  onClick={() => setActivePhotoIndex(idx)}
                                  className={`aspect-video w-24 rounded-xl overflow-hidden cursor-pointer transition-all border-2 ${activePhotoIndex === idx ? 'border-[#355872] scale-105 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                >
                                  <img src={`http://localhost:5000${imgUrl}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Description & Location cards */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

                    {/* Description (60%) */}
                    <div className="md:col-span-3 bg-white rounded-3xl p-6 border border-[#EAECE4]/60 shadow-sm flex flex-col h-full">
                      <h3 className="font-extrabold text-[15px] text-[#355872] uppercase tracking-wider mb-3 pb-2 border-b border-gray-100 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-[#355872] rounded-full"></span>
                        Deskripsi
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-line flex-1">
                        {selectedComplaint.description}
                      </p>

                      {/* Likes count & comment count metrics */}
                      <div className="flex items-center space-x-6 pt-4 border-t border-gray-100 mt-6">
                        <button
                          onClick={() => toggleLike(selectedComplaint.id)}
                          className={`flex items-center space-x-2 transition-all ${selectedComplaint.is_liked_by_me ? 'text-[#355872] font-bold' : 'text-gray-500 hover:text-[#355872]'}`}
                        >
                          <ThumbsUp size={16} className={selectedComplaint.is_liked_by_me ? 'fill-current' : ''} />
                          <span className="text-xs">{selectedComplaint.likes_count || 0} Dukungan</span>
                        </button>
                        <div className="flex items-center space-x-2 text-gray-500">
                          <MessageSquare size={16} />
                          <span className="text-xs">{allTimelineUpdates.length} Komentar</span>
                        </div>
                      </div>
                    </div>

                    {/* Location (40%) */}
                    <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-[#EAECE4]/60 shadow-sm flex flex-col h-full">
                      <h3 className="font-extrabold text-[15px] text-[#355872] uppercase tracking-wider mb-3 pb-2 border-b border-gray-100 flex items-center gap-2">
                        <MapPin size={16} className="text-[#355872]" />
                        Lokasi
                      </h3>

                      {selectedComplaint.latitude && selectedComplaint.longitude ? (
                        <div className="flex-1 flex flex-col gap-3">
                          <div className="h-32 rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
                            <MapViewer
                              latitude={parseFloat(selectedComplaint.latitude)}
                              longitude={parseFloat(selectedComplaint.longitude)}
                              title={selectedComplaint.title}
                            />
                          </div>
                          <div className="bg-[#FAFBF7] border border-[#EAECE4] p-3 rounded-xl flex items-center gap-2">
                            <MapPin size={14} className="text-[#355872] flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[11px] font-extrabold text-[#355872] truncate leading-none">Lokasi Tersemat</p>
                              <p className="text-[9px] font-bold text-gray-400 mt-1 truncate">{parseFloat(selectedComplaint.latitude).toFixed(5)}, {parseFloat(selectedComplaint.longitude).toFixed(5)}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-[#FAFBF7] rounded-2xl p-4 text-center border border-dashed border-gray-200">
                          <MapPin size={32} className="text-gray-300 stroke-[1.2]" />
                          <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Koordinat lokasi tidak disematkan</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline updates & comments */}
                  <div className="bg-white rounded-3xl p-6 border border-[#EAECE4]/60 shadow-sm space-y-6">
                    <h3 className="font-extrabold text-lg text-[#355872] tracking-tight">Pembaruan & Komentar Warga</h3>

                    {/* Add comment form */}
                    <form onSubmit={(e) => submitComment(e, selectedComplaint.id)} className="bg-[#FAFBF7] border border-[#EAECE4] p-4 rounded-2xl space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#EAECE4] flex items-center justify-center text-[#355872] font-bold text-xs overflow-hidden flex-shrink-0">
                          {user?.profile_image ? (
                            <img src={`http://localhost:5000${user.profile_image}`} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user?.name?.[0]?.toUpperCase() || 'U'
                          )}
                        </div>
                        <textarea
                          value={commentInput[selectedComplaint.id] || ''}
                          onChange={(e) => setCommentInput(prev => ({ ...prev, [selectedComplaint.id]: e.target.value }))}
                          placeholder="Tambahkan pembaruan atau komentar..."
                          required
                          className="flex-1 bg-white border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#355872] focus:border-transparent outline-none resize-none h-20 shadow-inner font-medium text-[#355872]"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={!commentInput[selectedComplaint.id]?.trim()}
                          className="bg-[#355872] text-white text-xs font-bold py-2.5 px-5 rounded-full hover:bg-[#355872] transition-colors shadow disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <Send size={12} />
                          Posting Komentar
                        </button>
                      </div>
                    </form>

                    {/* Timeline Comment Feed */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      {allTimelineUpdates.length === 0 ? (
                        <p className="text-center py-6 text-sm text-gray-400 font-medium">Belum ada komentar atau tanggapan resmi.</p>
                      ) : (
                        allTimelineUpdates.map((item: any) => {
                          const commentTimeAgo = getIndonesianTimeAgo(item.created_at);
                          return (
                            <div key={item.id} className="flex gap-3.5 items-start p-3.5 rounded-2xl bg-[#FAFBF7] border border-gray-100">
                              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden ${item.is_official ? 'bg-red-100 text-red-700' : 'bg-[#EAECE4] text-[#355872]'}`}>
                                {item.avatar ? (
                                  <img src={item.avatar} alt={item.sender} className="w-full h-full object-cover" />
                                ) : (
                                  item.letter
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-sm text-gray-900 leading-none">{item.sender}</span>
                                    {item.is_official ? (
                                      <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-red-100 text-red-700 tracking-wider uppercase border border-red-200">TANGGAPAN RESMI</span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-gray-100 text-gray-555 tracking-wider uppercase border border-gray-200">Warga</span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-400">{commentTimeAgo}</span>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed font-medium mt-1">{item.message}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                  </div>

                </div>

                {/* Right Side Sidebar (30%) - Laporan Terkait */}
                <div className="xl:col-span-1 space-y-6">
                  <div className="bg-white rounded-3xl p-5 border border-[#EAECE4]/60 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-base text-[#355872] tracking-tight">Laporan Terkait</h3>
                    <div className="space-y-3">
                      {relatedComplaints.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Tidak ada laporan terkait lainnya.</p>
                      ) : (
                        relatedComplaints.map((item: any) => {
                          const itemTimeAgo = getIndonesianTimeAgo(item.created_at);
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleViewDetails(item)}
                              className="bg-[#FAFBF7] border border-gray-150 rounded-2xl p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow transition-all group"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm ${getStatusConfig(item.status).bg}`}>
                                  {getStatusConfig(item.status).label}
                                </span>
                                <span className="text-[9px] font-extrabold text-gray-450">{itemTimeAgo}</span>
                              </div>
                              <h4 className="font-bold text-sm text-[#355872] group-hover:text-[#355872] transition-colors line-clamp-1">{item.title}</h4>
                              <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-snug">{item.description}</p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 2. SUBMIT A NEW REPORT VIEW */}
          {isCreateReportOpen && !selectedComplaint && (
            <div className="animate-in fade-in duration-300">

              {/* Back Breadcrumb */}
              <div className="flex items-center mb-6">
                <button
                  onClick={() => setIsCreateReportOpen(false)}
                  className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#355872] transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span>Back to Dashboard</span>
                </button>
              </div>

              {/* Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-black text-[#355872] tracking-tight">Kirim Laporan Baru</h2>
                <p className="text-gray-500 font-semibold text-sm mt-1">Berikan rincian tentang masalah tersebut untuk membantu warga dan desa menanganinya dengan cepat.</p>
              </div>

              {/* Two-Column Form Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                {/* Left Card - Input Fields (60%) */}
                <div className="lg:col-span-3 bg-white rounded-3xl p-8 border border-[#EAECE4]/60 shadow-sm space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-xs font-black tracking-widest text-[#355872] uppercase mb-2">JUDUL LAPORAN</label>
                      <input
                        type="text"
                        placeholder="Contoh: Jalan Berlubang di Jalan Utama"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-[#FAFBF7] border border-gray-250 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-1 focus:ring-[#355872] focus:border-transparent outline-none shadow-inner font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black tracking-widest text-[#355872] uppercase mb-2">KATEGORI</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-[#FAFBF7] border border-gray-250 rounded-xl px-4 py-3 text-sm text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#355872] outline-none font-extrabold cursor-pointer shadow-inner"
                      >
                        <option value="Infrastruktur Jalan">Infrastruktur Jalan</option>
                        <option value="Kebersihan">Kebersihan</option>
                        <option value="Lampu Jalan">Lampu Jalan</option>
                        <option value="Keamanan">Keamanan</option>
                        <option value="Fasilitas Umum">Fasilitas Umum</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black tracking-widest text-[#355872] uppercase mb-2">DESKRIPSI RINCI</label>
                      <textarea
                        placeholder="Jelaskan masalah, potensi bahaya, dan detail relevan lainnya..."
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-[#FAFBF7] border border-gray-250 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-1 focus:ring-[#355872] focus:border-transparent outline-none resize-none h-32 shadow-inner font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black tracking-widest text-[#355872] uppercase mb-2">BUKTI FOTO</label>

                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative border border-gray-250 rounded-2xl overflow-hidden aspect-video bg-gray-50 flex items-center justify-center">
                              <img src={preview} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  setImages(prev => prev.filter((_, i) => i !== index));
                                  setImagePreviews(prev => prev.filter((_, i) => i !== index));
                                }}
                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow transition-all hover:scale-105 active:scale-95 text-xs font-bold"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          {imagePreviews.length < 10 && (
                            <label className="border-2 border-dashed border-gray-300 hover:border-[#355872] rounded-2xl flex flex-col items-center justify-center aspect-video p-4 text-center cursor-pointer bg-[#FAFBF7] hover:bg-gray-50 transition-all">
                              <Plus className="text-gray-400" size={24} />
                              <span className="text-xs font-bold text-gray-500 mt-1">Tambah</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []);
                                  if (files.length > 0) {
                                    setImages(prev => [...prev, ...files]);
                                    files.forEach(file => {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        setImagePreviews(prev => [...prev, reader.result as string]);
                                      };
                                      reader.readAsDataURL(file);
                                    });
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      )}

                      {imagePreviews.length === 0 && (
                        <label className="border-2 border-dashed border-gray-300 hover:border-[#355872] rounded-2xl flex flex-col items-center justify-center p-8 text-center cursor-pointer bg-[#FAFBF7] hover:bg-gray-50 transition-all">
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                            <Camera className="text-gray-400" size={20} />
                          </div>
                          <span className="text-sm font-extrabold text-gray-800 mb-1">Klik untuk mengunggah foto</span>
                          <span className="text-[11px] font-bold text-gray-450">Mendukung banyak foto (PNG, JPG hingga 10MB)</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length > 0) {
                                setImages(files);
                                files.forEach(file => {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setImagePreviews(prev => [...prev, reader.result as string]);
                                  };
                                  reader.readAsDataURL(file);
                                });
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setIsCreateReportOpen(false)}
                        className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 bg-[#FAFBF7] hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#355872] hover:bg-[#355872] transition-colors shadow-md shadow-[#355872]/10"
                      >
                        Kirim Laporan
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right Card - Location Pinpointer (40%) */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-[#EAECE4]/60 shadow-sm flex flex-col justify-between space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-xs font-black tracking-widest text-[#355872] uppercase">Tentukan Lokasi</label>
                      <button
                        type="button"
                        onClick={() => setIsMapPickerOpen(true)}
                        className="p-1.5 hover:bg-gray-100 rounded-full text-[#355872] transition-all"
                        title="Cari Saya"
                      >
                        <MapPin size={18} />
                      </button>
                    </div>

                    {/* Embed Interactive Pinpoint Map */}
                    <div className="h-64 rounded-2xl overflow-hidden border border-gray-250 relative shadow-inner mb-4 z-10">
                      {latitude && longitude ? (
                        <MapViewer
                          latitude={latitude}
                          longitude={longitude}
                          title="Tentukan Lokasi"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAFBF7] text-gray-400 text-center p-4">
                          <MapPin size={36} className="stroke-[1.2] text-gray-300 animate-bounce" />
                          <span className="text-xs font-bold mt-2 uppercase tracking-wider text-gray-400">Penunjuk Peta</span>
                          <button
                            type="button"
                            onClick={() => setIsMapPickerOpen(true)}
                            className="mt-3 bg-[#EAECE4] text-[#355872] font-bold text-[11px] py-1.5 px-3 rounded-full hover:bg-[#DCDFD7] transition-all uppercase tracking-wider border border-[#DCDFD7]"
                          >
                            Atur Koordinat Lokasi
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Search location bar */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                      <input
                        type="text"
                        placeholder="Cari lokasi (contoh: Depok, Jakarta)"
                        value={searchMapQuery}
                        onChange={(e) => setSearchMapQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') searchMapLocation(); }}
                        className="w-full pl-10 pr-16 py-2.5 bg-[#FAFBF7] border border-gray-250 rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#355872] focus:border-transparent font-semibold shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={searchMapLocation}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-[#355872] text-white px-2.5 py-1 rounded-lg hover:bg-[#355872] transition-colors"
                      >
                        Cari
                      </button>
                    </div>

                    {/* Resolved Street Address Display */}
                    <div className="bg-[#FAFBF7] border border-gray-150 p-4 rounded-2xl flex gap-3.5 items-start">
                      <div className="w-9 h-9 rounded-xl bg-[#EAECE4] flex items-center justify-center text-[#355872] shadow-sm flex-shrink-0">
                        <MapPin size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm text-gray-900 leading-tight truncate">{resolvedAddress}</h4>
                        <p className="text-xs font-semibold text-gray-450 mt-1 truncate">{resolvedSubAddress}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] font-bold text-gray-450 leading-relaxed uppercase tracking-wider text-center pt-4 border-t border-gray-100">
                    Koordinat GPS akurat Anda akan dikaitkan dengan laporan ini untuk mencegah spam dan mempercepat penyelesaian resmi.
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 3. STANDARD USER FEED (DEFAULT VIEW) */}
          {!selectedComplaint && !isCreateReportOpen && activeTab === 'beranda' && (
            <>
              {/* Header Search & Notifications (Desktop Only) */}
              <div className="hidden lg:flex items-center justify-between gap-4 mb-8">
                <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#355872]/60 h-4.5 w-4.5" />
                  <input
                    type="text"
                    placeholder="Cari laporan, lokasi, kategori..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#EAECE4] border-none rounded-full py-3.5 pl-12 pr-6 text-sm text-[#355872] placeholder-[#355872]/50 outline-none focus:ring-2 focus:ring-[#7AAACE]/40 transition-all font-semibold"
                  />
                </div>

                {/* Desktop Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                    className="relative p-2.5 text-[#355872] hover:bg-[#EAECE4] rounded-full transition-all"
                  >
                    <Bell className="h-6 w-6 stroke-[1.8]" />
                    {notifications.length > 0 && (
                      <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full shadow-sm">
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Card */}
                  {showNotifDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowNotifDropdown(false)}></div>
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-[#EAECE4] z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-3 border-b border-gray-100 bg-[#F4F5F0] flex justify-between items-center">
                          <h3 className="font-bold text-gray-900">Notifikasi</h3>
                          <span className="text-xs text-[#355872] font-semibold">{notifications.length} Baru</span>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                              <Bell className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                              <p className="text-sm text-gray-500">Belum ada notifikasi baru.</p>
                            </div>
                          ) : (
                            notifications.map((n: any) => (
                              <div key={n.id} className="p-4 border-b border-gray-50 hover:bg-[#FAFBF7] transition-colors relative group">
                                <div className="flex gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#EAECE4] flex-shrink-0 flex items-center justify-center text-[#355872] font-bold text-xs overflow-hidden">
                                    {n.admin_profile_image ? (
                                      <img src={`http://localhost:5000${n.admin_profile_image}`} alt={n.admin_name} className="w-full h-full object-cover" />
                                    ) : (
                                      n.admin_name?.[0]?.toUpperCase() || 'A'
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-800 leading-snug mb-1">
                                      <span className="font-bold">{n.admin_name}</span> membalas <span className="italic">"{n.complaint_title}"</span>
                                    </p>
                                    <p className="text-[11px] text-gray-500 bg-[#FAFBF7] p-1.5 rounded border border-gray-100">"{n.message}"</p>
                                    <p className="text-[9px] text-gray-400 mt-1.5">{new Date(n.created_at).toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Redesigned Category Chips Row */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-5 py-2 text-xs font-bold rounded-full transition-all ${!selectedCategory ? 'bg-[#355872] text-white' : 'bg-[#EAECE4] text-[#355872] hover:bg-[#DCDFD7]'}`}
                >
                  Semua Laporan
                </button>
                {['Infrastruktur', 'Lampu Jalan', 'Kebersihan', 'Keamanan'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2 text-xs font-bold rounded-full transition-all ${selectedCategory === cat ? 'bg-[#355872] text-white' : 'bg-[#EAECE4] text-[#355872] hover:bg-[#DCDFD7]'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Feed List */}
              <div className="space-y-6">
                {filteredFeed.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-[#EAECE4]/60 shadow-sm">
                    <div className="w-16 h-16 bg-[#FAFBF7] rounded-full flex items-center justify-center mx-auto mb-4">
                      <ImageIcon className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Belum Ada Laporan</h3>
                    <p className="text-sm text-gray-500 font-medium max-w-xs mx-auto">Laporan yang masuk dalam kategori ini akan ditampilkan di sini.</p>
                  </div>
                ) : (
                  filteredFeed.map((c: any) => {
                    const imagesList = c.image ? c.image.split(',') : [];
                    const mainImage = imagesList[0];

                    // Format relative time-ago text for maximum high fidelity
                    const timeAgoText = getIndonesianTimeAgo(c.created_at);

                    // Coordinates mapping to mockup locations
                    const mockupLocation = c.latitude && c.longitude
                      ? `Menteng, Jakarta Pusat`
                      : 'Kecamatan Sukamaju, RT 04/RW 02';

                    return (
                      <div
                        key={c.id}
                        onClick={() => handleViewDetails(c)}
                        className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-6 border border-[#EAECE4]/40"
                      >
                        {/* Reporter details and status */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-[#EAECE4] flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0 shadow-inner">
                              {c.user_profile_image ? (
                                <img src={`http://localhost:5000${c.user_profile_image}`} alt={c.user_name} className="w-full h-full object-cover" />
                              ) : (
                                c.user_name?.[0]?.toUpperCase() || 'U'
                              )}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-[15px] text-[#355872] leading-tight">{c.user_name}</h4>
                              <p className="text-[11px] font-semibold text-[#7AAACE] mt-0.5">{timeAgoText}</p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase border shadow-sm ${getStatusConfig(c.status).bg}`}>
                            {getStatusConfig(c.status).label}
                          </span>
                        </div>

                        {/* Title & Location */}
                        <div className="space-y-1">
                          <h3 className="text-2xl font-black text-[#355872] leading-tight tracking-tight group-hover:text-[#355872] transition-colors">{c.title}</h3>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#7AAACE]">
                            <MapPin size={14} className="text-[#355872]/60" />
                            <span>{mockupLocation}</span>
                          </div>
                        </div>

                        {/* Image or Grey Placeholder */}
                        {mainImage ? (
                          <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl border border-gray-100 bg-[#FAFBF7] flex items-center justify-center relative">
                            <img
                              src={`http://localhost:5000${mainImage}`}
                              alt="Evidence Image"
                              className="w-full h-full object-cover"
                            />
                            {imagesList.length > 1 && (
                              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow">
                                <span>📷</span>
                                <span>{imagesList.length} Foto</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          // Mockup style Crossed Image placeholder (Budi S. card style)
                          <div className="bg-[#EAECE4] rounded-2xl aspect-[16/9] w-full flex flex-col items-center justify-center p-8">
                            <CrossedImageIcon />
                          </div>
                        )}

                        {/* Description */}
                        <p className="text-sm text-[#355872]/90 leading-relaxed font-semibold">
                          {c.description}
                        </p>

                        {/* Metrics Footer */}
                        <div className="flex justify-between items-center pt-4 border-t border-[#EAECE4]/50">
                          <div className="flex items-center gap-6 text-[#355872]">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleLike(c.id); }}
                              className="flex items-center gap-2 hover:opacity-85 transition-opacity"
                            >
                              <ThumbsUp className="h-5 w-5 stroke-[1.8]" />
                              <span className="text-sm font-bold">{c.likes_count || 0}</span>
                            </button>
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-5 w-5 stroke-[1.8]" />
                              <span className="text-sm font-bold">{c.comments_count || 0} Komentar</span>
                            </div>
                          </div>

                          <span className="px-4 py-1.5 bg-[#EAECE4]/60 text-[#355872]/80 font-bold text-xs rounded-full">
                            {c.category || 'Infrastruktur'}
                          </span>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* 4. NOTIFICATIONS TAB / LAPORAN SAYA */}
          {activeTab === 'notifikasi' && !selectedComplaint && !isCreateReportOpen && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight">Laporan Saya</h3>
                  <p className="text-gray-500 font-medium text-sm mt-1">Kelola dan pantau progres pengaduan yang Anda ajukan</p>
                </div>
              </div>

              {/* Filters */}
              {(() => {
                const userComplaints = complaints.filter((c: any) => c.user_id === user?.id);
                const countSemua = userComplaints.length;
                const countMenunggu = userComplaints.filter((c: any) => c.status === 'pending').length;
                const countProses = userComplaints.filter((c: any) => c.status === 'process').length;
                const countSelesai = userComplaints.filter((c: any) => c.status === 'done' || c.status === 'approved').length;
                const countDitolak = userComplaints.filter((c: any) => c.status === 'rejected').length;

                return (
                  <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-full shadow-sm w-max border border-gray-100">
                    <button onClick={() => setLaporanSayaStatusFilter('Semua')} className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${laporanSayaStatusFilter === 'Semua' ? 'bg-[#EEF2FF] text-[#4F46E5] shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                      Semua <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${laporanSayaStatusFilter === 'Semua' ? 'bg-[#4F46E5] text-white' : 'bg-gray-200 text-gray-600'}`}>{countSemua}</span>
                    </button>
                    <button onClick={() => setLaporanSayaStatusFilter('Menunggu')} className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${laporanSayaStatusFilter === 'Menunggu' ? 'bg-[#FFFbeb] text-[#D97706] shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                      Menunggu <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${laporanSayaStatusFilter === 'Menunggu' ? 'bg-[#D97706] text-white' : 'bg-gray-200 text-gray-600'}`}>{countMenunggu}</span>
                    </button>
                    <button onClick={() => setLaporanSayaStatusFilter('Proses')} className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${laporanSayaStatusFilter === 'Proses' ? 'bg-[#EFF6FF] text-[#2563EB] shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                      Proses <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${laporanSayaStatusFilter === 'Proses' ? 'bg-[#2563EB] text-white' : 'bg-gray-200 text-gray-600'}`}>{countProses}</span>
                    </button>
                    <button onClick={() => setLaporanSayaStatusFilter('Selesai')} className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${laporanSayaStatusFilter === 'Selesai' ? 'bg-[#ECFDF5] text-[#059669] shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                      Selesai <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${laporanSayaStatusFilter === 'Selesai' ? 'bg-[#059669] text-white' : 'bg-gray-200 text-gray-600'}`}>{countSelesai}</span>
                    </button>
                    <button onClick={() => setLaporanSayaStatusFilter('Ditolak')} className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${laporanSayaStatusFilter === 'Ditolak' ? 'bg-[#FEF2F2] text-[#DC2626] shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                      Ditolak <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${laporanSayaStatusFilter === 'Ditolak' ? 'bg-[#DC2626] text-white' : 'bg-gray-200 text-gray-600'}`}>{countDitolak}</span>
                    </button>
                  </div>
                );
              })()}

              {/* Search Bar */}
              <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari judul laporan..."
                  value={laporanSayaSearchQuery}
                  onChange={(e) => setLaporanSayaSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-full py-3.5 pl-12 pr-4 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all shadow-sm"
                />
              </div>

              {/* List */}
              {(() => {
                let filtered = complaints.filter((c: any) => c.user_id === user?.id);
                if (laporanSayaStatusFilter === 'Menunggu') filtered = filtered.filter((c:any) => c.status === 'pending');
                if (laporanSayaStatusFilter === 'Proses') filtered = filtered.filter((c:any) => c.status === 'process');
                if (laporanSayaStatusFilter === 'Selesai') filtered = filtered.filter((c:any) => c.status === 'done' || c.status === 'approved');
                if (laporanSayaStatusFilter === 'Ditolak') filtered = filtered.filter((c:any) => c.status === 'rejected');

                if (laporanSayaSearchQuery) {
                  filtered = filtered.filter((c:any) => c.title.toLowerCase().includes(laporanSayaSearchQuery.toLowerCase()));
                }

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-20 bg-white rounded-[32px] border border-gray-100 shadow-sm">
                      <p className="text-gray-500 font-bold">Tidak ada laporan yang sesuai.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {filtered.map((c: any) => (
                      <div key={c.id} className="bg-white rounded-[32px] border border-gray-100 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-stretch gap-6 hover:shadow-md transition-shadow">
                        
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 ${c.status === 'pending' ? 'bg-[#FFFbeb] text-[#D97706]' : c.status === 'process' ? 'bg-[#EFF6FF] text-[#2563EB]' : c.status === 'rejected' ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#ECFDF5] text-[#059669]'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'pending' ? 'bg-[#D97706]' : c.status === 'process' ? 'bg-[#2563EB]' : c.status === 'rejected' ? 'bg-[#EF4444]' : 'bg-[#059669]'}`}></span>
                              {c.status === 'pending' ? 'MENUNGGU' : c.status === 'process' ? 'PROSES' : c.status === 'rejected' ? 'DITOLAK' : 'SELESAI'}
                            </span>
                            <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                              <span className="text-gray-300">📅</span> {new Date(c.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}).toUpperCase()}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-2xl font-black text-[#4F46E5] mb-2">{c.title}</h3>
                            <p className="text-sm font-medium text-gray-500 italic line-clamp-1">"{c.description}"</p>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 mt-2">
                            <MapPin size={14} className="text-[#4F46E5]" />
                            <span>{c.category || 'Infrastruktur'}, Jakarta</span>
                          </div>

                          <div className="flex items-center gap-6 pt-4 mt-2">
                            <button onClick={() => handleViewDetails(c)} className="text-[#4F46E5] text-xs font-black uppercase hover:underline">
                              LIHAT DETAIL PENANGANAN &gt;
                            </button>
                            <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold">
                              <MessageSquare size={14} />
                              <span>{c.comments_count || 0} Tanggapan</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* 5. SETTINGS / PROFILE TAB */}
          {activeTab === 'profil' && !selectedComplaint && !isCreateReportOpen && (
            <div className="space-y-8 w-full animate-in fade-in duration-300">

              <div className="bg-white rounded-3xl p-8 border border-[#EAECE4]/60 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#EAECE4]/20 to-transparent rounded-bl-full pointer-events-none"></div>

                <div className="flex flex-col md:flex-row items-center md:items-start relative z-10">
                  <div className="flex-shrink-0 mb-6 md:mb-0">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#EAECE4] to-[#355872] border-[6px] border-[#FAFBF7] shadow-md flex items-center justify-center text-white font-extrabold text-4xl relative overflow-hidden">
                      {user?.profile_image ? (
                        <img src={`http://localhost:5000${user.profile_image}`} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user?.name?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                  </div>

                  <div className="flex-1 md:ml-8 flex flex-col w-full">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start w-full mb-6">
                      <div className="text-center md:text-left mb-4 md:mb-0">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none">{user?.name}</h2>
                        <div className="flex items-center justify-center md:justify-start text-gray-400 font-semibold mt-2.5 space-x-1.5 text-xs">
                          <MapPin className="h-4 w-4 text-[#355872]" />
                          <span>Kelurahan Menteng, Jakarta Pusat</span>
                        </div>
                      </div>

                      <button
                        onClick={() => { setActiveTab('pengaturan'); setEditProfileData({ email: user?.email || '', password: '' }); }}
                        className="inline-flex items-center space-x-2 bg-[#355872] hover:bg-[#355872] text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow self-center md:self-start"
                      >
                        <span>Ubah Pengaturan Profil</span>
                      </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 w-full">
                      <div className="bg-[#FAFBF7] border border-[#EAECE4] p-4 rounded-2xl text-center shadow-inner">
                        <p className="text-3xl font-black text-gray-800 leading-none mb-1">
                          {complaints.filter((c: any) => c.user_id === user?.id).length}
                        </p>
                        <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase">TOTAL LAPORAN</p>
                      </div>
                      <div className="bg-[#FAFBF7] border border-[#EAECE4] p-4 rounded-2xl text-center shadow-inner">
                        <p className="text-3xl font-black text-[#355872] leading-none mb-1">
                          {complaints.filter((c: any) => c.user_id === user?.id && (c.status === 'done' || c.status === 'approved')).length}
                        </p>
                        <p className="text-[9px] font-bold text-[#355872]/80 tracking-widest uppercase">DISETUJUI</p>
                      </div>
                      <div className="bg-[#FAFBF7] border border-[#EAECE4] p-4 rounded-2xl text-center shadow-inner">
                        <p className="text-3xl font-black text-[#D98A2C] leading-none mb-1">
                          {complaints.filter((c: any) => c.user_id === user?.id && c.status === 'process').length}
                        </p>
                        <p className="text-[9px] font-bold text-[#D98A2C]/80 tracking-widest uppercase">DALAM PROSES</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div>
                <div className="flex space-x-8 border-b border-gray-200/70 pb-px mb-6">
                  <button onClick={() => setProfileTab('laporan_saya')} className={`pb-3 font-bold text-sm tracking-wider uppercase transition-colors ${profileTab === 'laporan_saya' ? 'text-[#355872] border-b-2 border-[#355872]' : 'text-gray-400 hover:text-gray-600 border-b-2 border-transparent'}`}>Laporan Saya</button>
                  <button onClick={() => setProfileTab('tersimpan')} className={`pb-3 font-bold text-sm tracking-wider uppercase transition-colors ${profileTab === 'tersimpan' ? 'text-[#355872] border-b-2 border-[#355872]' : 'text-gray-400 hover:text-gray-600 border-b-2 border-transparent'}`}>Tersimpan</button>
                </div>

                {profileTab === 'laporan_saya' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <button
                      onClick={() => setIsCreateReportOpen(true)}
                      className="bg-[#FAFBF7] border border-dashed border-gray-300 rounded-3xl p-6 flex flex-col items-center justify-center text-center h-full min-h-[240px] group hover:bg-[#F4F5F0] hover:border-[#355872] transition-all"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-[#EAECE4] text-[#355872] flex items-center justify-center mb-4 transition-colors">
                        <span className="text-xl font-bold">+</span>
                      </div>
                      <h4 className="text-sm font-extrabold text-gray-850 mb-1">Buat Laporan Baru</h4>
                      <p className="text-xs text-gray-400 max-w-[160px] font-semibold">Ada masalah di lingkungan Anda? Laporkan sekarang.</p>
                    </button>

                    {complaints.filter((c: any) => c.user_id === user?.id).map((c: any) => (
                      <div
                        key={c.id}
                        onClick={() => handleViewDetails(c)}
                        className="bg-white rounded-3xl border border-[#EAECE4]/60 p-5 flex flex-col justify-between h-full min-h-[240px] shadow-sm hover:shadow hover:-translate-y-0.5 transition-all cursor-pointer group"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getStatusConfig(c.status).bg}`}>
                            {getStatusConfig(c.status).label}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400">{getIndonesianTimeAgo(c.created_at)}</span>
                        </div>

                        <div className="w-full h-24 bg-gray-50 rounded-xl overflow-hidden mb-3 border border-gray-100 flex items-center justify-center">
                          {c.image ? (
                            <img src={`http://localhost:5000${c.image}`} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-gray-200 stroke-[1.2]" />
                          )}
                        </div>

                        <h3 className="text-sm font-extrabold text-gray-900 group-hover:text-[#355872] transition-colors line-clamp-2 leading-snug">{c.title}</h3>

                        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center text-gray-400 space-x-1">
                          <MapPin size={12} />
                          <span className="text-[10px] font-bold truncate">Jakarta, Indonesia</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {profileTab === 'tersimpan' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {complaints.filter((c: any) => savedIds.includes(c.id)).length > 0 ? (
                      complaints.filter((c: any) => savedIds.includes(c.id)).map((c: any) => (
                        <div
                          key={c.id}
                          onClick={() => handleViewDetails(c)}
                          className="bg-white rounded-3xl border border-[#EAECE4]/60 p-5 flex flex-col justify-between h-full min-h-[240px] shadow-sm hover:shadow hover:-translate-y-0.5 transition-all cursor-pointer group"
                        >
                          <div className="flex justify-between items-center mb-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getStatusConfig(c.status).bg}`}>
                              {getStatusConfig(c.status).label}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleSave(c.id); }}
                              className="text-[#355872] hover:scale-110 transition-transform"
                            >
                              <Bookmark className="h-4 w-4" fill="currentColor" />
                            </button>
                          </div>

                          <div className="w-full h-24 bg-gray-50 rounded-xl overflow-hidden mb-3 border border-gray-100 flex items-center justify-center">
                            {c.image ? (
                              <img src={`http://localhost:5000${c.image}`} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-gray-200 stroke-[1.2]" />
                            )}
                          </div>

                          <h3 className="text-sm font-extrabold text-gray-900 group-hover:text-[#355872] transition-colors line-clamp-2 leading-snug">{c.title}</h3>

                          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center text-gray-400 space-x-1">
                            <MapPin size={12} />
                            <span className="text-[10px] font-bold truncate">Jakarta, Indonesia</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-16 bg-[#FAFBF7] border border-[#EAECE4]/60 rounded-3xl shadow-sm">
                        <Bookmark className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-gray-900">Tidak Ada Laporan Tersimpan</h4>
                        <p className="text-xs text-gray-400 font-semibold mt-1">Laporan yang Anda simpan akan muncul di sini.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* 6. PENGATURAN TAB (DEDICATED IN-PAGE FORM) */}
          {activeTab === 'pengaturan' && !selectedComplaint && !isCreateReportOpen && (
            <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 border border-[#EAECE4]/60 shadow-sm animate-in fade-in duration-300">
              <div className="mb-6">
                <h3 className="text-2xl font-black text-[#355872]">Pengaturan Profil</h3>
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">Ubah email, password, dan foto profil Anda</p>
              </div>

              <form onSubmit={handleEditProfile} className="space-y-6">
                {/* Profile Image Picker */}
                <div className="flex flex-col items-center mb-6">
                  {user?.role === 'super_admin' ? (
                    <div className="flex flex-col items-center">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-50 flex items-center justify-center relative shadow-inner">
                        <span className="text-3xl font-bold text-gray-400">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                      </div>
                      <p className="text-[11px] text-red-500 font-bold mt-2.5 uppercase tracking-wider">Super Administrator tidak diperbolehkan menggunakan foto profil</p>
                    </div>
                  ) : (
                    <>
                      <label className="relative cursor-pointer group block">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-dashed border-[#355872] hover:border-solid bg-gray-50 flex items-center justify-center relative transition-all shadow-inner">
                          {profilePreview ? (
                            <img src={profilePreview} alt="Preview" className="w-full h-full object-cover" />
                          ) : user?.profile_image ? (
                            <img src={`http://localhost:5000${user.profile_image}`} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl font-bold text-[#355872]">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                          )}

                          {/* Hover Overlay with Camera Icon */}
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Camera className="h-8 w-8 mb-1" />
                            <span className="text-xs font-bold uppercase tracking-wider">Ubah</span>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setProfileFile(file);
                              setProfilePreview(URL.createObjectURL(file));
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[11px] text-gray-400 font-bold mt-2.5 uppercase tracking-wider">Ketuk lingkaran untuk mengganti foto profil</p>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black tracking-widest text-[#4B5563] uppercase mb-1.5">Email Baru</label>
                  <input
                    type="email"
                    value={editProfileData.email}
                    onChange={e => setEditProfileData({ ...editProfileData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F9FBF9] text-sm text-[#355872] focus:bg-white focus:ring-1 focus:ring-[#355872] focus:border-transparent outline-none transition-all shadow-inner"
                    placeholder="email.baru@laporpak.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black tracking-widest text-[#4B5563] uppercase mb-1.5">Password Baru</label>
                  <input
                    type="password"
                    value={editProfileData.password}
                    onChange={e => setEditProfileData({ ...editProfileData, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F9FBF9] text-sm text-[#355872] focus:bg-white focus:ring-1 focus:ring-[#355872] focus:border-transparent outline-none transition-all shadow-inner"
                    placeholder="Kosongkan jika tidak ingin diubah"
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('profil'); setProfileFile(null); setProfilePreview(null); }}
                    className="flex-1 px-4 py-3.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingProfile}
                    className="flex-1 px-4 py-3.5 rounded-xl font-bold text-white bg-[#355872] hover:bg-[#355872] transition-colors disabled:opacity-70 flex justify-center items-center shadow text-sm"
                  >
                    {isSubmittingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </main>

        {/* Right Sidebar (Desktop only) */}
        {!selectedComplaint && !isCreateReportOpen && activeTab === 'beranda' && (
          <aside className="hidden xl:flex flex-col gap-8 w-80 flex-shrink-0 sticky top-8 h-fit">
            {/* Panduan Melapor Card */}
            <div className="bg-[#F4F5F0] rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#355872]">
                <span className="text-lg">#</span>
                <h3 className="text-lg font-black tracking-tight">Panduan Melapor</h3>
              </div>
              <div className="space-y-4 text-xs font-semibold text-[#355872] leading-relaxed">
                <div className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#9CD5FF] text-[#355872] font-bold flex items-center justify-center flex-shrink-0 text-[10px]">1</span>
                  <p>Isi <strong>Judul Keluhan</strong> dan deskripsikan masalah secara mendetail di form pengaduan.</p>
                </div>
                <div className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#9CD5FF] text-[#355872] font-bold flex items-center justify-center flex-shrink-0 text-[10px]">2</span>
                  <p>Pilih <strong>Kategori Laporan</strong> yang sesuai agar dinas terkait dapat merespon dengan cepat.</p>
                </div>
                <div className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#9CD5FF] text-[#355872] font-bold flex items-center justify-center flex-shrink-0 text-[10px]">3</span>
                  <p>Gunakan fitur <strong>Sematkan Peta</strong> untuk menentukan koordinat lokasi masalah secara akurat.</p>
                </div>
                <div className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#9CD5FF] text-[#355872] font-bold flex items-center justify-center flex-shrink-0 text-[10px]">4</span>
                  <p>Unggah <strong>Foto Bukti</strong> agar laporan Anda memiliki bukti fisik yang kuat.</p>
                </div>
              </div>
            </div>
          </aside>
        )}

      </div>



      {/* Guide & Help Center Modal with Integrated Live Chat */}
      {isGuideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsGuideModalOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 transform transition-all scale-100 text-[#355872] flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <h3 className="text-xl font-black">Pusat Bantuan LaporPak</h3>
              <button onClick={() => setIsGuideModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
            </div>

            {/* Tabs Header */}
            <div className="flex space-x-6 border-b border-gray-200/70 pb-px mb-6 flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveHelpTab('guide')}
                className={`pb-3 font-bold text-xs tracking-wider uppercase transition-colors ${activeHelpTab === 'guide' ? 'text-[#355872] border-b-2 border-[#355872]' : 'text-gray-400 hover:text-gray-600 border-b-2 border-transparent'}`}
              >
                Panduan Melapor
              </button>
              <button
                type="button"
                onClick={() => setActiveHelpTab('chat')}
                className={`pb-3 font-bold text-xs tracking-wider uppercase transition-colors ${activeHelpTab === 'chat' ? 'text-[#355872] border-b-2 border-[#355872]' : 'text-gray-400 hover:text-gray-600 border-b-2 border-transparent'}`}
              >
                Tanya Operator (Live Chat)
              </button>
            </div>

            {/* Tab Contents */}
            {activeHelpTab === 'guide' ? (
              <div className="space-y-4 text-sm font-semibold leading-relaxed overflow-y-auto pr-1">
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#9CD5FF] text-[#355872] font-bold flex items-center justify-center flex-shrink-0 text-xs">1</span>
                  <p>Isi <strong>Judul Keluhan</strong> dan deskripsikan masalah secara mendetail di form pengaduan.</p>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#9CD5FF] text-[#355872] font-bold flex items-center justify-center flex-shrink-0 text-xs">2</span>
                  <p>Pilih <strong>Kategori Laporan</strong> yang sesuai agar dinas terkait dapat merespon dengan cepat.</p>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#9CD5FF] text-[#355872] font-bold flex items-center justify-center flex-shrink-0 text-xs">3</span>
                  <p>Gunakan fitur <strong>Sematkan Peta</strong> untuk menentukan koordinat lokasi masalah secara akurat.</p>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#9CD5FF] text-[#355872] font-bold flex items-center justify-center flex-shrink-0 text-xs">4</span>
                  <p>Unggah <strong>Foto Bukti</strong> agar laporan Anda memiliki bukti fisik yang kuat.</p>
                </div>
                <button onClick={() => setIsGuideModalOpen(false)} className="w-full bg-[#355872] text-white font-bold py-3 rounded-xl mt-8 hover:bg-[#355872] transition-colors shadow flex-shrink-0">Saya Mengerti</button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden min-h-[350px]">
                {/* Active Chat Operator Status */}
                <div className="flex items-center space-x-2.5 pb-3 border-b border-gray-100 mb-3 flex-shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-gray-450 tracking-wider uppercase">Operator Online</span>
                </div>

                {/* Message Streams List */}
                <div className="flex-1 overflow-y-auto space-y-3 bg-[#F9FBF9] p-4 rounded-2xl mb-3 shadow-inner">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-2">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mulai Percakapan</p>
                      <p className="text-[11px] text-gray-450 font-semibold leading-relaxed">Ada kendala? Tanyakan kepada operator kami.</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => {
                      const isMe = msg.is_admin_reply === 0;
                      return (
                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${isMe
                            ? 'bg-[#355872] text-white rounded-tr-none'
                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                            }`}>
                            {!isMe && (
                              <p className="text-[9px] font-bold text-[#355872] mb-0.5 tracking-wider uppercase">{msg.sender_name}</p>
                            )}
                            <p className="text-xs font-semibold leading-relaxed break-words">{msg.message}</p>
                            <p className={`text-[9px] mt-1 text-right ${isMe ? 'text-gray-200' : 'text-gray-450'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Composer Form */}
                <form onSubmit={handleSendChatMessage} className="p-1 bg-white flex items-center space-x-2 flex-shrink-0">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Ketik pesan di sini..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-250 bg-[#F9FBF9] text-xs text-gray-850 focus:bg-white focus:ring-1 focus:ring-[#355872] focus:border-transparent outline-none transition-all shadow-inner font-semibold"
                  />
                  <button
                    type="submit"
                    className="bg-[#355872] hover:bg-[#355872] text-white p-2.5 rounded-xl transition-colors shadow-md"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
