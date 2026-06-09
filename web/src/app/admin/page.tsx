'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import dynamic from 'next/dynamic';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  HelpCircle, 
  ShieldAlert, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ArrowUpRight, 
  ChevronRight, 
  MoreVertical,
  Eye,
  Trash2,
  MapPin,
  MessageSquare,
  ArrowLeft,
  Share2,
  Camera,
  Image as ImageIcon,
  Send
} from 'lucide-react';

const MapViewer = dynamic(() => import('@/components/MapViewer'), { ssr: false });
const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });
const MapOverviewAdmin = dynamic(() => import('@/components/MapOverviewAdmin'), { ssr: false });

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'users' | 'settings' | 'chat'>('dashboard');
  const [complaints, setComplaints] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [responseMsg, setResponseMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportCategoryFilter, setReportCategoryFilter] = useState('Semua Kategori');
  const [reportStatusFilter, setReportStatusFilter] = useState('Semua Status');
  const [dashboardDateFilter, setDashboardDateFilter] = useState('30');
  
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [deleteResponseConfirmId, setDeleteResponseConfirmId] = useState<number | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // User Management Filter & Edit States
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('Semua Peran');
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editUserData, setEditUserData] = useState<any>(null);

  // Settings / Admin Profile Edit States
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isSubmittingAdminProfile, setIsSubmittingAdminProfile] = useState(false);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  // Live Chat States
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [adminChatInput, setAdminChatInput] = useState('');

  // Create Report States for Admin
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [category, setCategory] = useState('Infrastruktur Jalan');
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState('Jalan Sudirman');
  const [resolvedSubAddress, setResolvedSubAddress] = useState('Jakarta Pusat, DKI Jakarta 10220');
  const [searchMapQuery, setSearchMapQuery] = useState('');
  const [isCreateReportOpen, setIsCreateReportOpen] = useState(false);
  
  // Comments Data state for detailed view timeline
  const [commentsData, setCommentsData] = useState<{ [key: number]: any[] }>({});

  const router = useRouter();

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints');
      setComplaints(res.data);
    } catch (error) {
      console.error(error);
      router.push('/login');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error(error);
      }
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setCurrentUser(parsed);
      setAdminEmail(parsed.email || '');
    }
    fetchComplaints();
    fetchUsers();
    setMounted(true);

    // Background auto-polling for true real-time reactivity without reload!
    const pollInterval = setInterval(() => {
      fetchComplaints();
      fetchUsers();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  const fetchChatRooms = async () => {
    try {
      const res = await api.get('/chats/rooms');
      setChatRooms(res.data);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error('Gagal mengambil daftar room chat:', error);
      }
    }
  };

  const fetchRoomMessages = async (roomId: number) => {
    try {
      const res = await api.get(`/chats/messages?room_id=${roomId}`);
      setChatMessages(res.data);
    } catch (error) {
      console.error('Gagal mengambil pesan room:', error);
    }
  };

  const handleSendAdminChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId || !adminChatInput.trim()) return;

    try {
      await api.post('/chats/messages', { 
        room_id: selectedRoomId, 
        message: adminChatInput 
      });
      setAdminChatInput('');
      fetchRoomMessages(selectedRoomId);
      fetchChatRooms();
    } catch (error) {
      console.error('Gagal mengirim pesan:', error);
    }
  };

  // Poll Chat Rooms when activeTab is 'chat'
  useEffect(() => {
    if (activeTab !== 'chat') return;

    fetchChatRooms();
    const roomsInterval = setInterval(() => {
      fetchChatRooms();
    }, 5000);

    return () => clearInterval(roomsInterval);
  }, [activeTab]);

  // Poll Messages when room is selected and activeTab is 'chat'
  useEffect(() => {
    if (activeTab !== 'chat' || !selectedRoomId) return;

    fetchRoomMessages(selectedRoomId);
    const msgsInterval = setInterval(() => {
      fetchRoomMessages(selectedRoomId);
    }, 3000);

    return () => clearInterval(msgsInterval);
  }, [activeTab, selectedRoomId]);

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Yakin ingin menghapus pengguna ini?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menghapus pengguna');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('Mohon lengkapi semua field');
      return;
    }
    setIsSubmittingUser(true);
    try {
      await api.post('/users', newUser);
      alert('Pengguna berhasil ditambahkan!');
      setIsAddUserModalOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'admin' });
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menambahkan pengguna');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserData) return;
    setIsSubmittingUser(true);
    try {
      await api.put(`/users/${editUserData.id}`, {
        name: editUserData.name,
        email: editUserData.email,
        role: editUserData.role,
        password: editUserData.password || undefined
      });
      alert('Pengguna berhasil diperbarui!');
      setIsEditUserModalOpen(false);
      setEditUserData(null);
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal memperbarui pengguna');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleDeleteComplaint = async (id: number) => {
    if (!confirm('Yakin ingin menghapus laporan ini?')) return;
    try {
      await api.delete(`/complaints/${id}`);
      setSelectedComplaint(null);
      fetchComplaints();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menghapus laporan');
    }
  };

  const handleExport = () => {
    const dataToExport = activeTab === 'reports' ? filteredComplaints : dashboardComplaints;
    
    if (dataToExport.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    const headers = ['ID Laporan', 'Judul', 'Kategori', 'Pelapor', 'Tanggal', 'Status'];
    const csvRows = [headers.join(',')];

    dataToExport.forEach((c: any) => {
      const row = [
        `RP-2026-${c.id.toString().padStart(3, '0')}`,
        `"${(c.title || '').replace(/"/g, '""')}"`,
        `"${c.category || 'Lainnya'}"`,
        `"${(c.user_name || '').replace(/"/g, '""')}"`,
        new Date(c.created_at).toLocaleDateString('id-ID'),
        c.status
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_LaporPak_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/complaints/${id}/status`, { status });
      fetchComplaints();
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint({ ...selectedComplaint, status });
      }
    } catch (error) {
      alert('Gagal update status');
    }
  };

  const handleViewDetails = async (c: any) => {
    try {
      setIsCreateReportOpen(false);
      setActivePhotoIndex(0);
      const res = await api.get(`/complaints/${c.id}`);
      setSelectedComplaint(res.data);
      
      // Fetch comments too
      const commentsRes = await api.get(`/complaints/${c.id}/comments`);
      setCommentsData(prev => ({ ...prev, [c.id]: commentsRes.data }));
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      alert('Gagal mengambil detail pengaduan');
    }
  };

  // Reverse geocoding on coordinates selection
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

  const handleSubmitAdminReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      alert('Mohon isi judul dan deskripsi laporan');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (image) formData.append('image', image);
    if (latitude) formData.append('latitude', latitude.toString());
    if (longitude) formData.append('longitude', longitude.toString());
    formData.append('category', category);

    try {
      await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Pengaduan berhasil dikirim oleh Admin!');
      setTitle('');
      setDescription('');
      setImage(null);
      setImagePreview(null);
      setLatitude(null);
      setLongitude(null);
      setIsCreateReportOpen(false);
      fetchComplaints();
    } catch (error) {
      alert('Gagal mengirim pengaduan');
    }
  };

  const submitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !responseMsg.trim()) return;
    try {
      await api.post('/responses', { complaint_id: selectedComplaint.id, message: responseMsg });
      setResponseMsg('');
      const res = await api.get(`/complaints/${selectedComplaint.id}`);
      setSelectedComplaint(res.data);
    } catch (error) {
      alert('Gagal mengirim tanggapan');
    }
  };

  const handleDeleteResponse = (id: number) => {
    setDeleteResponseConfirmId(id);
  };

  const executeDeleteResponse = async (id: number) => {
    try {
      await api.delete(`/responses/${id}`);
      if (selectedComplaint) {
        const res = await api.get(`/complaints/${selectedComplaint.id}`);
        setSelectedComplaint(res.data);
      }
    } catch (error) {
      alert('Gagal menghapus tanggapan');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleAdminProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAdminProfile(true);
    try {
      const formData = new FormData();
      if (adminEmail) formData.append('email', adminEmail);
      if (adminPassword) formData.append('password', adminPassword);
      if (profileFile) {
        formData.append('profile_image', profileFile);
      }

      const res = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('Profil Admin berhasil diperbarui!');
      const updatedUser = {
        ...currentUser,
        ...(adminEmail ? { email: adminEmail } : {}),
        profile_image: res.data.profile_image
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setAdminPassword('');
      setProfileFile(null);
      setProfilePreview(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal memperbarui profil admin');
    } finally {
      setIsSubmittingAdminProfile(false);
    }
  };

  // Dashboard Metrics Computations
  const dashboardComplaints = complaints.filter(c => {
    if (dashboardDateFilter === 'all') return true;
    if (!c.created_at) return false;
    const days = parseInt(dashboardDateFilter);
    const date = new Date(c.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days;
  });

  const totalPending = dashboardComplaints.filter(c => c.status === 'pending').length;
  const totalResolved = dashboardComplaints.filter(c => c.status === 'done' || c.status === 'approved').length;
  
  // Top 3 categories mapping
  const categoriesObj = dashboardComplaints.reduce((acc: any, curr: any) => {
    const cat = curr.category || 'Lainnya';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const topCats = Object.entries(categoriesObj).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3);

  // Weekly Activity Graph Computations
  const daysOfWeekShort = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
  const currentDayIndex = mounted ? new Date().getDay() : 0;
  const reportsByDay = dashboardComplaints.reduce((acc: any, curr: any) => {
    if (!curr.created_at) return acc;
    const date = new Date(curr.created_at);
    if (isNaN(date.getTime())) return acc;
    const d = date.getDay();
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});
  
  const dayValues = Object.values(reportsByDay).filter((v: any) => !isNaN(v)) as number[];
  const maxDailyReports = dayValues.length > 0 ? Math.max(...dayValues, 1) : 1;

  // Search Filter for complaints in Reports View
  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.user_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = reportCategoryFilter === 'Semua Kategori' || c.category === reportCategoryFilter;
    const matchesStatus = reportStatusFilter === 'Semua Status' || 
                          (reportStatusFilter === 'Menunggu' && c.status === 'pending') ||
                          (reportStatusFilter === 'Diproses' && c.status === 'process') ||
                          (reportStatusFilter === 'Selesai' && (c.status === 'done' || c.status === 'approved')) ||
                          (reportStatusFilter === 'Dilaporkan' && c.is_reported === 1);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Search Filter for Users View
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
    const matchesRole = userRoleFilter === 'Semua Peran' || 
                        (userRoleFilter === 'Warga' && u.role === 'user') || 
                        (userRoleFilter === 'Admin' && u.role === 'admin') ||
                        (userRoleFilter === 'Super Admin' && u.role === 'super_admin');
    return matchesSearch && matchesRole;
  });

  const getStatusDesign = (status: string) => {
    switch(status) {
      case 'done':
      case 'approved':
        return { bg: 'bg-[#F0F9F0] border-[#F7F8F0]', text: 'text-[#2E7D32]', dot: 'bg-[#4CAF50]', label: 'Selesai' };
      case 'process':
        return { bg: 'bg-[#FDF3E7] border-[#FAD7B5]', text: 'text-[#D97706]', dot: 'bg-[#F59E0B]', label: 'Sedang Diproses' };
      case 'rejected':
        return { bg: 'bg-[#FEF2F2] border-[#FEE2E2]', text: 'text-[#DC2626]', dot: 'bg-[#EF4444]', label: 'Ditolak' };
      default:
        return { bg: 'bg-[#F3F4F6] border-[#E5E7EB]', text: 'text-[#4B5563]', dot: 'bg-[#9CA3AF]', label: 'Menunggu' };
    }
  };

  // Chronological timeline updates for Admin detailed view
  const allTimelineUpdates = selectedComplaint
    ? [
        ...(commentsData[selectedComplaint.id] || []).map((com: any) => ({
          id: `comment-${com.id}`,
          sender: com.user_name,
          role: 'Warga Terverifikasi',
          avatar: com.user_name?.[0]?.toUpperCase() || 'U',
          profile_image: com.user_profile_image,
          message: com.comment,
          created_at: com.created_at,
          is_official: false
        })),
        ...(selectedComplaint.responses || []).map((resp: any) => ({
          id: `response-${resp.id}`,
          sender: resp.admin_name || 'Super Admin',
          role: 'TANGGAPAN RESMI',
          avatar: resp.admin_name?.[0]?.toUpperCase() || 'A',
          profile_image: resp.admin_profile_image,
          message: resp.message,
          created_at: resp.created_at,
          is_official: true
        }))
      ].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  const relatedComplaints = complaints
    .filter((c: any) => c.id !== selectedComplaint?.id)
    .slice(0, 2);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F9FBF9] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-[#355872] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-[#355872] mt-2">Memuat konsol sistem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FAFBFA] font-sans text-[#2D3748] relative">
      
      {/* Map Picker Modal */}
      {isMapPickerOpen && (
        <MapPicker 
          onLocationSelected={handleLocationSelected} 
          onClose={() => setIsMapPickerOpen(false)} 
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-[#F2F4ED] border-r border-[#E2E8E0] flex flex-col h-screen sticky top-0 flex-shrink-0 z-20">
        
        {/* Branding Profile Card */}
        <div className="p-6 pt-8 flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#355872] rounded-xl flex items-center justify-center shadow-sm">
            <ShieldAlert className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-[#355872] leading-tight">Panel Admin</h1>
            <p className="text-xs font-semibold text-[#7AAACE]">{currentUser?.role === 'super_admin' ? 'Super Admin' : 'Admin Sistem'}</p>
          </div>
        </div>

        {/* Dynamic Navigation Routes */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto pt-4">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard' && !isCreateReportOpen} 
            onClick={() => { setActiveTab('dashboard'); setIsCreateReportOpen(false); setSelectedComplaint(null); }} 
          />
          <NavItem 
            icon={<FileText size={20} />} 
            label="Laporan" 
            active={activeTab === 'reports' && !isCreateReportOpen && !selectedComplaint} 
            onClick={() => { setActiveTab('reports'); setIsCreateReportOpen(false); setSelectedComplaint(null); }} 
          />
          
          {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
            <NavItem 
              icon={<Users size={20} />} 
              label="Pengguna" 
              active={activeTab === 'users' && !isCreateReportOpen} 
              onClick={() => { setActiveTab('users'); setIsCreateReportOpen(false); setSelectedComplaint(null); }} 
            />
          )}

          <NavItem 
            icon={<MessageSquare size={20} />} 
            label="Live Chat" 
            active={activeTab === 'chat' && !isCreateReportOpen} 
            onClick={() => { setActiveTab('chat'); setIsCreateReportOpen(false); setSelectedComplaint(null); }} 
          />

          <NavItem 
            icon={<Settings size={20} />} 
            label="Pengaturan" 
            active={activeTab === 'settings' && !isCreateReportOpen} 
            onClick={() => { setActiveTab('settings'); setIsCreateReportOpen(false); setSelectedComplaint(null); }} 
          />
        </nav>



        {/* Bottom Actions links */}
        <div className="px-3 py-4 border-t border-[#E2E8E0] space-y-1">
          <button 
            onClick={() => setIsHelpModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-[#7AAACE] hover:bg-[#E8ECD9] rounded-xl transition-colors"
          >
            <HelpCircle size={18} />
            Pusat Bantuan
          </button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-[#B91C1C] hover:bg-red-50 rounded-xl transition-colors">
            <LogOut size={18} />
            Keluar
          </button>
        </div>

        {/* Footer Profile Segment */}
        <div className="p-4 bg-[#EBF0E8] flex items-center gap-3 border-t border-[#F7F8F0]">
          <div className="w-8 h-8 rounded-full bg-[#355872] text-white flex items-center justify-center text-xs font-bold shadow-sm overflow-hidden flex-shrink-0 animate-none">
            {currentUser?.profile_image && currentUser?.role !== 'super_admin' ? (
              <img src={`http://localhost:5000${currentUser.profile_image}`} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              currentUser?.name?.[0]?.toUpperCase() || 'A'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#355872] truncate leading-none mb-1">{currentUser?.name || 'Admin'}</p>
            <p className="text-[10px] font-medium text-[#7AAACE] uppercase tracking-wider">Sesi Aktif</p>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT WRAPPER --- */}
      <main className="flex-1 overflow-y-auto h-screen relative">
        
        {/* Header Bar */}
        <header className="h-16 bg-[#FAFBFA]/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10 border-b border-gray-100">
          <div className="text-xs font-bold text-[#7AAACE] uppercase tracking-widest">Konsol Sistem LaporPak</div>
          <div />
        </header>

        {/* Container Body */}
        <div className="p-8 pt-4">


          {/* 2. ANALYTICS DASHBOARD VIEW */}
          {activeTab === 'dashboard' && !isCreateReportOpen && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="flex justify-between items-end mb-2">
                <div>
                  <h2 className="text-3xl font-black text-[#355872] tracking-tight">Ikhtisar Analitik</h2>
                  <p className="text-[#7AAACE] font-medium mt-1">Wawasan real-time untuk operasional dan sistem Anda.</p>
                </div>
                <div className="flex gap-3">
                  <select 
                    value={dashboardDateFilter}
                    onChange={(e) => setDashboardDateFilter(e.target.value)}
                    className="bg-white border border-gray-200 text-sm font-bold px-4 py-2.5 rounded-xl outline-none text-[#355872] shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <option value="7">📅 7 Hari Terakhir</option>
                    <option value="30">📅 30 Hari Terakhir</option>
                    <option value="all">📅 Semua Waktu</option>
                  </select>
                  <button onClick={handleExport} className="bg-white border border-gray-200 text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm text-[#355872] hover:bg-gray-50 transition-colors">
                    <Download size={16} /> Ekspor
                  </button>
                </div>
              </header>

              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard 
                  label="TOTAL LAPORAN" 
                  value={dashboardComplaints.length.toLocaleString()} 
                  change="+12%" 
                  icon={<FileText className="text-gray-500" size={20} />} 
                />
                <StatCard 
                  label="MENUNGGU" 
                  value={totalPending.toString()} 
                  change="~3%" 
                  icon={<Clock className="text-orange-500" size={20} />} 
                  glow="bg-orange-50/50"
                />
                <StatCard 
                  label="SELESAI" 
                  value={totalResolved.toString()} 
                  change="~8%" 
                  icon={<CheckCircle2 className="text-green-600" size={20} />} 
                  glow="bg-green-50/50"
                />
                <StatCard 
                  label="TOTAL PENGGUNA" 
                  value={users.length.toLocaleString()} 
                  change="+24%" 
                  icon={<Users className="text-blue-500" size={20} />} 
                />
              </div>

              {/* Weekly bar and category doughnuts */}
              <div className="grid grid-cols-3 gap-6">
                
                {/* Main Weekly Bar Chart Simulation */}
                <div className="col-span-2 bg-white border border-gray-100 shadow-sm rounded-3xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-[#355872]">Laporan Masuk (Mingguan)</h3>
                    <MoreVertical size={20} className="text-gray-400 cursor-pointer" />
                  </div>
                  <div className="h-64 flex items-end justify-around px-4 pb-4 relative border-b border-gray-100 pt-4">
                    {[1, 2, 3, 4, 5, 6, 0].map((dIndex) => {
                      const count = reportsByDay[dIndex] || 0;
                      const percentHeight = (count / maxDailyReports) * 85; 
                      const isToday = dIndex === currentDayIndex;
                      
                      return (
                        <div key={dIndex} className="flex flex-col items-center group gap-2 flex-1 h-full justify-end">
                          <div className="relative w-full h-full flex flex-col justify-end items-center group">
                            <span className="absolute -top-6 scale-0 group-hover:scale-100 bg-[#355872] text-white text-[10px] font-bold px-1.5 py-0.5 rounded transition-all duration-100 z-10">
                              {count} Laporan
                            </span>
                            <div 
                              className={`w-10 rounded-md transition-all duration-500 shadow-sm ${isToday ? 'bg-[#355872]' : 'bg-[#EBECE6] group-hover:bg-[#D5D8C8]'}`} 
                              style={{ height: `${percentHeight > 5 ? percentHeight : 5}%` }}
                            ></div>
                          </div>
                          <span className={`text-[10px] font-bold ${isToday ? 'text-[#355872]' : 'text-gray-400'}`}>
                            {daysOfWeekShort[dIndex]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Category distribution doughnut */}
                <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6">
                  <h3 className="font-bold text-lg text-[#355872] mb-6">Distribusi Kategori</h3>
                  <div className="flex justify-center mb-6 relative">
                    <div className="w-36 h-36 rounded-full border-[14px] border-[#F1F3F0] relative flex items-center justify-center">
                      <div className="absolute rounded-full border-[14px] border-transparent border-t-[#355872] border-r-[#7AAACE] rotate-45" style={{ inset: '-14px' }}></div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-[#355872]">{complaints.length}</p>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[#7AAACE]">DATA</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {topCats.map(([name, cnt]: any, idx) => (
                      <div key={name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 font-medium text-[#355872]">
                          <span className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-[#355872]' : idx === 1 ? 'bg-[#7AAACE]' : 'bg-[#7AAACE]'}`}></span>
                          {name}
                        </div>
                        <span className="font-bold text-gray-900">{cnt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Map overview section */}
              <div className="grid grid-cols-5 gap-6 pb-10">
                <div className="col-span-3 bg-white border border-gray-100 shadow-sm rounded-3xl p-6 overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-[#355872]">Peta Sebaran Laporan</h3>
                    <button onClick={() => router.push('/map')} className="text-xs font-bold text-[#355872] hover:underline flex items-center gap-1">LIHAT PETA PENUH <ArrowUpRight size={12}/></button>
                  </div>
                  <div className="h-60 bg-[#E8ECE6] rounded-2xl overflow-hidden border relative">
                    {dashboardComplaints.length > 0 ? (
                      <MapOverviewAdmin complaints={dashboardComplaints} />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-[#7AAACE]">
                        <MapPin size={32} />
                        <p className="text-sm font-bold mt-2">Data laporan tidak ditemukan.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity List */}
                <div className="col-span-2 bg-white border border-gray-100 shadow-sm rounded-3xl p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-[#355872]">Aktivitas Terbaru</h3>
                    <span className="text-xs font-bold text-[#355872] cursor-pointer hover:underline">LIHAT SEMUA</span>
                  </div>
                  <div className="flex-1 space-y-4">
                    {dashboardComplaints.slice(0, 3).map((item: any) => (
                      <div key={item.id} className="flex gap-4 items-start group cursor-pointer hover:bg-[#F9FBF9] p-2 rounded-xl transition-colors" onClick={() => { setActiveTab('reports'); handleViewDetails(item); }}>
                        <div className="w-10 h-10 rounded-xl bg-[#F0F3EF] flex items-center justify-center flex-shrink-0 shadow-inner">
                          <FileText size={16} className="text-[#355872]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="text-sm font-bold text-[#355872] line-clamp-1">{item.title}</h4>
                            <span className="text-[10px] font-medium text-gray-400 flex-shrink-0">Baru</span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
                          <div className="mt-2 flex items-center">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase ${getStatusDesign(item.status).bg} ${getStatusDesign(item.status).text} border-current`}>{getStatusDesign(item.status).label}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 3. REPORTS TAB VIEW */}
          {activeTab === 'reports' && !isCreateReportOpen && (
            <div className="animate-in fade-in duration-500 pb-10">
              
              {/* Check if complaint selected - Show premium full page view */}
              {selectedComplaint ? (
                <div className="space-y-8 animate-in fade-in duration-300">
                                {/* Back Navigation Bar */}
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => setSelectedComplaint(null)} 
                      className="flex items-center gap-2 text-sm font-bold text-gray-550 hover:text-[#355872] transition-colors"
                    >
                      <ArrowLeft size={16} />
                      <span>Kembali ke Laporan</span>
                      <span className="text-gray-300">/</span>
                      <span className="text-gray-450 font-medium">Laporan #RP-2026-{selectedComplaint.id.toString().padStart(3, '0')}</span>
                    </button>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDeleteComplaint(selectedComplaint.id)}
                        className="px-4 py-2 border border-red-200 text-red-500 bg-white hover:bg-red-50 rounded-xl text-xs font-bold transition-all"
                      >
                        Hapus Laporan
                      </button>
                    </div>
                  </div>

                  {/* Redesigned Admin Two-Column Details layout */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    
                    {/* Left Column (70%) */}
                    <div className="xl:col-span-2 space-y-8">
                      
                      {/* Title Metadata card with control status */}
                      <div className="bg-white rounded-3xl p-6 border border-[#E8ECE6] shadow-sm space-y-4">
                        
                        {/* Status Admin Control panel */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#F2F4ED]">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Status Resolusi</span>
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase border shadow-sm ${getStatusDesign(selectedComplaint.status).bg} ${getStatusDesign(selectedComplaint.status).text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${getStatusDesign(selectedComplaint.status).dot}`}></span>
                              {getStatusDesign(selectedComplaint.status).label}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Ubah Status Laporan</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <button 
                                onClick={() => updateStatus(selectedComplaint.id, 'pending')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selectedComplaint.status === 'pending' ? 'bg-[#4B5563] text-white shadow-md' : 'bg-white text-gray-650 hover:bg-gray-50'}`}
                              >
                                Menunggu
                              </button>
                              <button 
                                onClick={() => updateStatus(selectedComplaint.id, 'process')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selectedComplaint.status === 'process' ? 'bg-[#D97706] text-white shadow-md' : 'bg-white text-gray-655 hover:bg-gray-50'}`}
                              >
                                Sedang Diproses
                              </button>
                              <button 
                                onClick={() => updateStatus(selectedComplaint.id, 'done')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selectedComplaint.status === 'done' || selectedComplaint.status === 'approved' ? 'bg-[#166534] text-white shadow-md' : 'bg-white text-gray-655 hover:bg-gray-50'}`}
                              >
                                Selesai
                              </button>
                              <button 
                                onClick={() => updateStatus(selectedComplaint.id, 'rejected')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selectedComplaint.status === 'rejected' ? 'bg-[#DC2626] text-white shadow-md' : 'bg-white text-gray-655 hover:bg-gray-50'}`}
                              >
                                Tolak Laporan
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2">
                          {selectedComplaint.is_reported === 1 && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 mb-4">
                              <ShieldAlert size={16} /> Laporan ini telah ditandai oleh warga karena mengandung konten spam atau melanggar aturan.
                            </div>
                          )}
                          <h2 className="text-3xl font-black text-[#355872] leading-tight tracking-tight">{selectedComplaint.title}</h2>
                          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs font-semibold text-gray-400">
                            <span className="text-[#355872] font-bold uppercase bg-[#EBF0E8] px-2 py-0.5 rounded text-[10px]">{selectedComplaint.category || 'Infrastruktur'}</span>
                            <span>•</span>
                            <span>Dilaporkan pada: {new Date(selectedComplaint.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                        </div>

                        {/* Citizen Profile Row */}
                        <div className="flex items-center gap-3 pt-4 border-t border-[#FDFEFC]">
                          <div className="w-10 h-10 rounded-full bg-[#F7F8F0] flex items-center justify-center text-[#355872] font-bold text-sm shadow-inner overflow-hidden flex-shrink-0">
                            {selectedComplaint.user_profile_image ? (
                              <img src={`http://localhost:5000${selectedComplaint.user_profile_image}`} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              selectedComplaint.user_name?.[0]?.toUpperCase() || 'U'
                            )}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-[14px] text-gray-900 leading-tight">{selectedComplaint.user_name}</h4>
                            <p className="text-xs font-bold text-gray-450">Warga Terverifikasi</p>
                          </div>
                        </div>

                      </div>

                      {/* Evidence Photo */}
                      <div className="bg-white rounded-3xl p-6 border border-[#E8ECE6] shadow-sm space-y-4">
                        {(() => {
                          const images = selectedComplaint.image ? selectedComplaint.image.split(',') : [];
                          const activeImage = images[activePhotoIndex] || images[0] || '';
                          return (
                            <>
                              <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl border border-gray-100 bg-[#FAFBFA] flex items-center justify-center relative">
                                {activeImage ? (
                                  <img 
                                    src={`http://localhost:5000${activeImage}`} 
                                    alt="Evidence Image" 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-gray-300">
                                    <ImageIcon size={64} className="stroke-[1.2]" />
                                    <span className="text-xs mt-2 font-bold uppercase tracking-wider text-gray-400">Tidak Ada Bukti Foto</span>
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

                      {/* Description & Location details side by side */}
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        
                        {/* Description */}
                        <div className="md:col-span-3 bg-white rounded-3xl p-6 border border-[#E8ECE6] shadow-sm flex flex-col h-full">
                          <h3 className="font-extrabold text-[15px] text-[#355872] uppercase tracking-wider mb-3 pb-2 border-b border-[#F2F4ED] flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-[#355872] rounded-full"></span>
                            Deskripsi
                          </h3>
                          <p className="text-sm text-gray-700 leading-relaxed font-semibold whitespace-pre-line flex-1">
                            {selectedComplaint.description}
                          </p>
                        </div>

                        {/* Location map */}
                        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-[#E8ECE6] shadow-sm flex flex-col h-full">
                          <h3 className="font-extrabold text-[15px] text-[#355872] uppercase tracking-wider mb-3 pb-2 border-b border-[#F2F4ED] flex items-center gap-2">
                            <MapPin size={16} className="text-[#355872]" />
                            Koordinat Lokasi
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
                              <div className="bg-[#FAFBFA] border border-gray-150 p-2.5 rounded-xl flex items-center gap-2">
                                <MapPin size={14} className="text-[#355872] flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-[10px] font-extrabold text-gray-800 truncate leading-none">Koordinat Peta</p>
                                  <p className="text-[9px] font-bold text-gray-400 mt-1 truncate">{parseFloat(selectedComplaint.latitude).toFixed(5)}, {parseFloat(selectedComplaint.longitude).toFixed(5)}</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center bg-[#FAFBFA] rounded-2xl p-4 text-center border border-dashed border-gray-200">
                              <MapPin size={32} className="text-gray-300 stroke-[1.2]" />
                              <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Tidak Ada Koordinat GPS</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Community Updates timeline combine citizen & responses */}
                      <div className="bg-white rounded-3xl p-6 border border-[#E8ECE6] shadow-sm space-y-6">
                        <h3 className="font-extrabold text-lg text-[#355872] tracking-tight">Log Aktivitas Komunitas</h3>

                        {/* Timeline list of comment logs */}
                        <div className="space-y-4 pl-2 border-l border-[#EBF0E8]">
                          {allTimelineUpdates.length === 0 ? (
                            <p className="pl-6 text-sm text-gray-400 italic">Belum ada tanggapan atau komentar.</p>
                          ) : (
                            allTimelineUpdates.map((item: any) => (
                              <div key={item.id} className="relative pl-6">
                                <div className={`absolute -left-[6px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${item.is_official ? 'bg-[#C53030]' : 'bg-[#355872]'}`}></div>
                                <div className="bg-[#FAFBFA] border border-gray-150 rounded-2xl p-4 shadow-sm relative group">
                                  <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-inner overflow-hidden flex-shrink-0 ${item.is_official ? 'bg-red-100 text-red-650' : 'bg-[#F7F8F0] text-[#355872]'}`}>
                                        {item.profile_image ? (
                                          <img src={`http://localhost:5000${item.profile_image}`} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                          item.avatar
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-xs font-black text-[#355872] leading-none mb-1">{item.sender}</p>
                                        <span className={`text-[8px] font-bold uppercase tracking-wider ${item.is_official ? 'text-[#C53030]' : 'text-gray-400'}`}>{item.role}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-gray-400 font-bold">{new Date(item.created_at).toLocaleString()}</span>
                                      {item.is_official && (
                                        <button 
                                          onClick={() => handleDeleteResponse(parseInt(item.id.split('-')[1]))} 
                                          className="text-red-400 hover:text-red-650 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-xs font-medium text-gray-650 bg-white p-3 rounded-xl border border-gray-100 italic font-semibold">"{item.message}"</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Submit Admin Official Response Form */}
                        <div className="pt-4 border-t border-[#F2F4ED]">
                          <div className="bg-[#FAFBFA] border border-[#E2E8E0] rounded-3xl p-5 shadow-sm">
                            <h4 className="font-extrabold text-[#355872] text-sm mb-3">Tambah Tanggapan Resmi Administrator</h4>
                            <form onSubmit={submitResponse} className="space-y-3">
                              <textarea 
                                required
                                value={responseMsg}
                                onChange={e => setResponseMsg(e.target.value)}
                                placeholder="Masukkan respon penanganan resmi dinas terkait..." 
                                className="w-full bg-white rounded-xl border border-gray-250 p-3 text-xs outline-none focus:ring-1 focus:ring-[#355872] h-24 resize-none shadow-inner font-semibold"
                              ></textarea>
                              <button type="submit" className="w-full bg-[#355872] hover:bg-[#355872] text-white font-bold py-3 rounded-xl transition-all shadow flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                                <Send size={12} /> Kirim Respon Resmi
                              </button>
                            </form>
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Right Column sidebar - Related Reports */}
                    <div className="xl:col-span-1 space-y-6">
                      <div className="bg-white rounded-3xl p-5 border border-[#E8ECE6] shadow-sm space-y-4">
                        <h3 className="font-extrabold text-base text-[#355872] tracking-tight">Laporan Terkait</h3>
                        <div className="space-y-3">
                          {relatedComplaints.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">Tidak ada laporan terkait lainnya.</p>
                          ) : (
                            relatedComplaints.map((item: any) => (
                              <div 
                                key={item.id} 
                                onClick={() => handleViewDetails(item)}
                                className="bg-[#FAFBFA] border border-gray-150 rounded-2xl p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow transition-all group"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm ${getStatusDesign(item.status).bg} ${getStatusDesign(item.status).text}`}>
                                    {getStatusDesign(item.status).label}
                                  </span>
                                  <span className="text-[9px] font-extrabold text-gray-400">1 hari yang lalu</span>
                                </div>
                                <h4 className="font-bold text-sm text-[#355872] group-hover:text-[#355872] transition-colors line-clamp-1">{item.title}</h4>
                                <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-snug">{item.description}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              ) : (
                <>
                  {/* Standard Admin Reports Table view */}
                  <div className="mb-6 flex justify-between items-end">
                    <div>
                      <h2 className="text-3xl font-black text-[#355872] tracking-tight">Manajemen Laporan</h2>
                      <p className="text-[#7AAACE] font-medium mt-1">Tinjau, klasifikasikan, dan selesaikan keluhan warga.</p>
                    </div>
                    <div className="flex gap-3">
                      <select 
                        value={reportCategoryFilter}
                        onChange={(e) => setReportCategoryFilter(e.target.value)}
                        className="bg-white border border-gray-200 text-sm font-bold px-4 py-2 rounded-xl outline-none text-[#355872] shadow-sm hover:bg-gray-50 cursor-pointer"
                      >
                        <option>Semua Kategori</option>
                        <option>Infrastruktur Jalan</option>
                        <option>Fasilitas Umum</option>
                        <option>Layanan Masyarakat</option>
                        <option>Lainnya</option>
                      </select>
                      <select 
                        value={reportStatusFilter}
                        onChange={(e) => setReportStatusFilter(e.target.value)}
                        className="bg-white border border-gray-200 text-sm font-bold px-4 py-2 rounded-xl outline-none text-[#355872] shadow-sm hover:bg-gray-50 cursor-pointer"
                      >
                        <option>Semua Status</option>
                        <option>Menunggu</option>
                        <option>Diproses</option>
                        <option>Selesai</option>
                        <option value="Dilaporkan">⚠ Dilaporkan (Spam)</option>
                      </select>
                      <button onClick={handleExport} className="bg-white border border-gray-200 text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm text-[#355872] hover:bg-gray-50">
                        <Download size={16} /> Ekspor
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-gray-200 shadow-md overflow-hidden mb-6">
                    <div className="p-4 px-6 border-b border-gray-100 flex justify-between bg-[#FDFEFC]">
                      <div className="flex items-center gap-2 text-sm text-[#7AAACE] font-bold">
                        <input type="checkbox" className="w-4 h-4 accent-[#355872]" />
                        Pilih Semua
                      </div>
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input 
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Cari laporan..." 
                          className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg bg-white border border-gray-200 outline-none focus:ring-1 focus:ring-[#355872]"
                        />
                      </div>
                    </div>

                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#FAFBFA] text-[11px] font-bold text-[#7AAACE] uppercase tracking-wider">
                          <th className="p-4 pl-6 w-10"></th>
                          <th className="p-4">ID Laporan</th>
                          <th className="p-4">Judul & Detail</th>
                          <th className="p-4">Pelapor</th>
                          <th className="p-4">Kategori</th>
                          <th className="p-4">Tanggal</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredComplaints.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-12 text-center text-gray-400 italic font-medium">Tidak ada data laporan tersedia.</td>
                          </tr>
                        ) : (
                          filteredComplaints.map((c: any) => {
                            const st = getStatusDesign(c.status);
                            return (
                              <tr key={c.id} className="hover:bg-[#F9FBF8] transition-colors group cursor-pointer" onClick={() => handleViewDetails(c)}>
                                <td className="p-4 pl-6" onClick={e => e.stopPropagation()}>
                                  <input type="checkbox" className="w-4 h-4 rounded accent-[#355872] border-gray-300" />
                                </td>
                                <td className="p-4 font-bold text-xs text-[#355872]">#LP-{c.id.toString().padStart(4, '0')}</td>
                                <td className="p-4 max-w-xs">
                                  <p className="font-bold text-[#355872] line-clamp-1 text-[14px] mb-0.5 flex items-center gap-2">
                                    {c.is_reported === 1 && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md font-bold uppercase shrink-0">Dilaporkan</span>}
                                    {c.title}
                                  </p>
                                  <p className="text-xs text-gray-500 line-clamp-1">{c.description}</p>
                                </td>
                                 <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-[#F7F8F0] flex items-center justify-center text-[10px] font-bold text-[#355872] overflow-hidden flex-shrink-0">
                                      {c.user_profile_image ? (
                                        <img src={`http://localhost:5000${c.user_profile_image}`} alt="Profile" className="w-full h-full object-cover" />
                                      ) : (
                                        c.user_name?.[0]?.toUpperCase() || 'U'
                                      )}
                                    </div>
                                    <span className="font-bold text-sm text-[#355872]">{c.user_name}</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="text-sm font-medium text-[#4B5563]">{c.category || 'Tanpa Kategori'}</span>
                                </td>
                                <td className="p-4">
                                  <span className="text-xs font-semibold text-[#6B7280]">{new Date(c.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </td>
                                <td className="p-4">
                                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border shadow-sm ${st.bg} ${st.text}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                                    {st.label}
                                  </div>
                                </td>
                                <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => handleViewDetails(c)}
                                      className="p-1.5 bg-white border border-gray-200 rounded-lg text-[#355872] hover:bg-[#EBF0E8] shadow-sm transition-colors"
                                      title="Lihat Detail"
                                    >
                                      <Eye size={15} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteComplaint(c.id)}
                                      className="p-1.5 bg-white border border-gray-200 rounded-lg text-red-500 hover:bg-red-50 shadow-sm transition-colors"
                                      title="Hapus"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                    <div className="px-6 py-4 border-t border-gray-100 bg-[#FAFBFA] flex justify-between items-center text-xs text-[#7AAACE] font-bold">
                      <div>Menampilkan {filteredComplaints.length} dari {complaints.length} entri</div>
                      <div className="flex gap-1">
                        <button className="p-1.5 border rounded-lg bg-white disabled:opacity-50"><ChevronRight size={14} className="rotate-180" /></button>
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#355872] text-white">1</button>
                        <button className="p-1.5 border rounded-lg bg-white"><ChevronRight size={14} /></button>
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>
          )}


          {/* 4. USER MANAGEMENT VIEW */}
          {activeTab === 'users' && !isCreateReportOpen && (
            <div className="animate-in fade-in duration-500 pb-10">
              <header className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-black text-[#355872] tracking-tight">Manajemen Pengguna</h2>
                  <p className="text-[#7AAACE] font-medium mt-1">Kelola hak akses platform, peran, dan anggota komunitas.</p>
                </div>
                <button 
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="bg-[#355872] hover:bg-[#355872] text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5"
                >
                  <Users size={18} />
                  <span>Tambah Pengguna Baru</span>
                </button>
              </header>

              {/* Statistics Topbar Cards */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
                  <div className="w-14 h-14 bg-[#F0F3EF] rounded-2xl flex items-center justify-center shadow-inner text-[#355872]">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-wider text-[#7AAACE] uppercase mb-1">Total Pengguna</p>
                    <h4 className="text-3xl font-black text-[#355872]">{users.length.toLocaleString()}</h4>
                  </div>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
                  <div className="w-14 h-14 bg-[#FFF4F2] rounded-2xl flex items-center justify-center shadow-inner text-[#C05621]">
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-wider text-[#7AAACE] uppercase mb-1">Super Admin</p>
                    <h4 className="text-3xl font-black text-[#355872]">{users.filter(u => u.role === 'super_admin').length}</h4>
                  </div>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
                  <div className="w-14 h-14 bg-[#EFF6FF] rounded-2xl flex items-center justify-center shadow-inner text-[#1D4ED8]">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-wider text-[#7AAACE] uppercase mb-1">Admin Standar</p>
                    <h4 className="text-3xl font-black text-[#355872]">{users.filter(u => u.role === 'admin').length}</h4>
                  </div>
                </div>
              </div>

              {/* Users Grid Table */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
                <div className="p-5 px-8 bg-[#FDFEFC] border-b border-gray-100 flex items-center justify-between">
                  <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Cari berdasarkan nama atau email..." 
                      className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#355872] outline-none shadow-inner animate-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <select 
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="bg-white border border-gray-200 text-sm font-bold px-4 py-2 rounded-xl outline-none text-[#355872]"
                    >
                      <option>Semua Peran</option>
                      <option>Warga</option>
                      <option>Admin</option>
                      <option>Super Admin</option>
                    </select>
                    <select className="bg-white border border-gray-200 text-sm font-bold px-4 py-2 rounded-xl outline-none text-[#355872]">
                      <option>Semua Status</option>
                      <option>Aktif</option>
                    </select>
                  </div>
                </div>

                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAF7] text-[11px] font-extrabold tracking-widest text-[#7AAACE] uppercase border-b">
                      <th className="p-5 pl-8">Profil Pengguna</th>
                      <th className="p-5">Alamat Email</th>
                      <th className="p-5">Hak Akses</th>
                      <th className="p-5">Tanggal Registrasi</th>
                      <th className="p-5 text-center">Kontrol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-gray-400 italic font-medium">Tidak ada data pengguna ditemukan.</td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-[#FAFCFA] transition-colors group">
                        <td className="p-5 pl-8">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-sm overflow-hidden flex-shrink-0 ${u.role === 'super_admin' ? 'bg-[#FFF2F0] text-red-650' : u.role === 'admin' ? 'bg-[#F0F6FF] text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                              {u.profile_image && u.role !== 'super_admin' && u.role !== 'admin' ? (
                                <img src={`http://localhost:5000${u.profile_image}`} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                u.name?.[0]?.toUpperCase() || 'U'
                              )}
                            </div>
                            <span className="font-black text-[15px] text-[#355872]">{u.name}</span>
                          </div>
                        </td>
                        <td className="p-5">
                          <span className="text-sm text-gray-500 font-medium">{u.email}</span>
                        </td>
                        <td className="p-5">
                          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${
                            u.role === 'super_admin' ? 'bg-[#FFEBE8] text-[#C53030]' : 
                            u.role === 'admin' ? 'bg-[#E6F4EA] text-[#166534]' : 
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {u.role === 'super_admin' ? 'Super Admin' : u.role === 'admin' ? 'Admin' : 'Warga'}
                          </span>
                        </td>
                        <td className="p-5">
                          <span className="text-xs font-bold text-[#7AAACE]">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => { setEditUserData({ ...u, password: '' }); setIsEditUserModalOpen(true); }}
                              className="p-2 rounded-xl border bg-white text-gray-400 hover:text-[#355872] hover:border-[#355872] shadow-sm transition-colors"
                            >
                              <Settings size={14} />
                            </button>
                            {u.id !== currentUser?.id && (
                              <button 
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-2 rounded-xl border bg-white text-gray-400 hover:text-red-600 hover:border-red-200 shadow-sm transition-colors"
                              >
                                <XCircle size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="p-6 border-t bg-[#FAFBFA] flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-bold">Menampilkan total {filteredUsers.length} pengguna terdaftar.</span>
                  <div className="flex items-center gap-1">
                    <button className="p-2 bg-[#355872] text-white text-xs font-bold rounded-lg w-8 h-8 flex items-center justify-center shadow">1</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. LIVE CHAT VIEW */}
          {activeTab === 'chat' && !isCreateReportOpen && (
            <div className="bg-white border border-gray-200 shadow-xl rounded-3xl overflow-hidden h-[calc(100vh-120px)] flex animate-in fade-in duration-300">
              <div className="w-80 sm:w-96 border-r border-gray-100 flex flex-col bg-[#F9FBF9]">
                <div className="p-6 border-b border-gray-100 bg-white">
                  <h3 className="text-xl font-black text-[#355872]">Ruang Chat Warga</h3>
                  <p className="text-xs text-[#7AAACE] mt-1 font-medium">Kelola & respons keluhan langsung warga.</p>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {chatRooms.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 font-medium text-xs">
                      Tidak ada obrolan aktif saat ini.
                    </div>
                  ) : (
                    chatRooms.map((room) => {
                      const isSelected = selectedRoomId === room.room_id;
                      const hasNewMessage = room.is_admin_reply === 0;
                      return (
                        <button
                          key={room.room_id}
                          onClick={() => setSelectedRoomId(room.room_id)}
                          className={`w-full text-left p-4 sm:p-5 flex items-start space-x-3 transition-colors ${
                            isSelected ? 'bg-[#355872]/5 border-l-4 border-l-[#355872]' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0 overflow-hidden ${
                            isSelected ? 'bg-[#355872] text-white' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {room.user_profile_image ? (
                              <img src={`http://localhost:5000${room.user_profile_image}`} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              room.user_name?.[0]?.toUpperCase() || 'W'
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <h4 className={`text-sm truncate ${isSelected || hasNewMessage ? 'font-black text-[#355872]' : 'font-bold text-gray-700'}`}>
                                {room.user_name}
                              </h4>
                              {room.last_message_time && (
                                <span className="text-[9px] font-bold text-gray-400">
                                  {new Date(room.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium truncate mb-1">{room.user_email}</p>
                            <p className={`text-xs truncate ${hasNewMessage ? 'font-black text-[#355872]' : 'text-gray-550 font-medium'}`}>
                              {room.last_message}
                            </p>
                          </div>
                          {hasNewMessage && (
                            <span className="w-2.5 h-2.5 rounded-full bg-[#355872] flex-shrink-0 animate-pulse mt-1.5"></span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-white">
                {selectedRoomId ? (
                  <>
                    <div className="p-4 px-6 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {(() => {
                          const activeRoom = chatRooms.find(r => r.room_id === selectedRoomId);
                          return (
                            <div className="w-10 h-10 rounded-full bg-[#9CD5FF] flex items-center justify-center text-[#355872] font-bold text-sm shadow-sm overflow-hidden flex-shrink-0 animate-none">
                              {activeRoom?.user_profile_image ? (
                                <img src={`http://localhost:5000${activeRoom.user_profile_image}`} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                activeRoom?.user_name?.[0]?.toUpperCase() || 'W'
                              )}
                            </div>
                          );
                        })()}
                        <div>
                          <h4 className="font-black text-[#355872] text-sm">
                            {chatRooms.find(r => r.room_id === selectedRoomId)?.user_name}
                          </h4>
                          <p className="text-[10px] text-[#7AAACE] font-bold tracking-wider uppercase">Sesi Chat Warga</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto bg-[#F9FBF9] space-y-4">
                      {chatMessages.map((msg, idx) => {
                        const isMe = msg.is_admin_reply === 1;
                        return (
                          <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${
                              isMe 
                                ? 'bg-[#355872] text-white rounded-tr-none' 
                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                            }`}>
                              {!isMe && (
                                <p className="text-[9px] font-bold text-[#355872] mb-1 uppercase tracking-wider">{msg.sender_name}</p>
                              )}
                              <p className="text-xs font-semibold leading-relaxed break-words">{msg.message}</p>
                              <p className={`text-[9px] mt-1.5 text-right ${isMe ? 'text-gray-200' : 'text-gray-400 font-bold'}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <form onSubmit={handleSendAdminChatMessage} className="p-4 border-t border-gray-100 flex items-center space-x-3 bg-white">
                      <input
                        type="text"
                        value={adminChatInput}
                        onChange={e => setAdminChatInput(e.target.value)}
                        placeholder="Ketik balasan Anda ke warga..."
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-250 bg-[#F9FBF9] text-xs text-gray-800 focus:bg-white focus:ring-2 focus:ring-[#355872] focus:border-transparent outline-none transition-all shadow-inner font-medium"
                      />
                      <button
                        type="submit"
                        className="bg-[#355872] hover:bg-[#355872] text-white p-3 rounded-xl transition-all shadow-md shadow-[#355872]/15 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                      >
                        Kirim Balasan
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-[#EBECE6] flex items-center justify-center text-[#355872] shadow-inner animate-pulse">
                      <MessageSquare size={32} />
                    </div>
                    <div>
                      <h4 className="font-black text-[#355872] text-lg">Pilih Ruang Chat Warga</h4>
                      <p className="text-xs text-gray-400 font-bold max-w-sm mt-1 leading-relaxed uppercase tracking-wider">
                        Pilih salah satu warga dari daftar obrolan di sebelah kiri untuk melihat pesan dan mulai membalas tanggapan.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. SETTINGS VIEW */}
          {activeTab === 'settings' && !isCreateReportOpen && (
            <div className="max-w-md mx-auto bg-white border border-gray-100 shadow-sm rounded-3xl p-8 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#E8F0E6] rounded-xl flex items-center justify-center text-[#355872]">
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#355872]">Pengaturan Akun Admin</h3>
                  <p className="text-sm font-medium text-[#7AAACE]">Perbarui informasi profil admin Anda.</p>
                </div>
              </div>

              <form onSubmit={handleAdminProfileUpdate} className="space-y-4">
                {/* Profile Image Picker */}
                <div className="flex flex-col items-center mb-6">
                  {currentUser?.role === 'super_admin' ? (
                    <div className="flex flex-col items-center">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-50 flex items-center justify-center relative shadow-inner">
                        <span className="text-3xl font-bold text-gray-400">{currentUser?.name?.[0]?.toUpperCase() || 'A'}</span>
                      </div>
                      <p className="text-[11px] text-red-500 font-bold mt-2.5 text-center uppercase tracking-wider">Super Administrator tidak diperbolehkan menggunakan foto profil</p>
                    </div>
                  ) : (
                    <>
                      <label className="relative cursor-pointer group block">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-dashed border-[#355872] hover:border-solid bg-gray-50 flex items-center justify-center relative transition-all shadow-inner">
                          {profilePreview ? (
                            <img src={profilePreview} alt="Preview" className="w-full h-full object-cover" />
                          ) : currentUser?.profile_image ? (
                            <img src={`http://localhost:5000${currentUser.profile_image}`} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl font-bold text-[#355872]">{currentUser?.name?.[0]?.toUpperCase() || 'A'}</span>
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
                  <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                  <input 
                    type="text"
                    disabled
                    value={currentUser?.name || ''}
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm text-[#355872] cursor-not-allowed outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Email Admin</label>
                  <input 
                    type="email"
                    required
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F9FBF9] text-sm text-[#355872] focus:bg-white focus:ring-2 focus:ring-[#355872] focus:border-transparent outline-none transition-all shadow-inner"
                    placeholder="admin@laporpak.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Password Baru</label>
                  <input 
                    type="password"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F9FBF9] text-sm text-[#355872] focus:bg-white focus:ring-2 focus:ring-[#355872] focus:border-transparent outline-none transition-all shadow-inner"
                    placeholder="Kosongkan jika tidak ingin diubah"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmittingAdminProfile} 
                  className="w-full px-4 py-3.5 rounded-xl font-bold text-white bg-[#355872] hover:bg-[#355872] transition-colors disabled:opacity-70 flex justify-center items-center mt-6"
                >
                  {isSubmittingAdminProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </form>
            </div>
          )}

          {/* Add User Modal */}
          {isAddUserModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-205">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddUserModalOpen(false)}></div>
              <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 transform transition-all scale-100">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-black text-[#355872]">Tambah Pengguna Baru</h3>
                    <p className="text-sm font-medium text-[#7AAACE]">Buat akses untuk Admin atau User biasa.</p>
                  </div>
                  <button onClick={() => setIsAddUserModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <XCircle size={24} />
                  </button>
                </div>

                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                    <input 
                      type="text"
                      required
                      value={newUser.name}
                      onChange={e => setNewUser({...newUser, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F9FBF9] text-sm focus:bg-white focus:ring-2 focus:ring-[#355872] focus:border-transparent outline-none transition-all shadow-inner"
                      placeholder="Contoh: Admin Desa"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Email</label>
                    <input 
                      type="email"
                      required
                      value={newUser.email}
                      onChange={e => setNewUser({...newUser, email: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F9FBF9] text-sm focus:bg-white focus:ring-2 focus:ring-[#355872] focus:border-transparent outline-none transition-all shadow-inner"
                      placeholder="admin@laporpak.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Password</label>
                    <input 
                      type="password"
                      required
                      value={newUser.password}
                      onChange={e => setNewUser({...newUser, password: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F9FBF9] text-sm focus:bg-white focus:ring-2 focus:ring-[#355872] focus:border-transparent outline-none transition-all shadow-inner"
                      placeholder="Minimal 6 karakter"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Role Pengguna</label>
                    <select 
                      value={newUser.role}
                      onChange={e => setNewUser({...newUser, role: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F9FBF9] text-sm focus:bg-white focus:ring-2 focus:ring-[#355872] focus:border-transparent outline-none transition-all shadow-inner font-semibold text-[#355872]"
                    >
                      <option value="admin">Admin Sistem</option>
                      <option value="user">Warga / User Biasa</option>
                    </select>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
                      Batal
                    </button>
                    <button type="submit" disabled={isSubmittingUser} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-[#355872] hover:bg-[#355872] transition-colors disabled:opacity-70 flex justify-center items-center">
                      {isSubmittingUser ? 'Menyimpan...' : 'Simpan Pengguna'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit User Modal */}
          {isEditUserModalOpen && editUserData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-205">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditUserModalOpen(false)}></div>
              <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 transform transition-all scale-100">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-black text-[#355872]">Edit Pengguna</h3>
                    <p className="text-sm font-medium text-[#7AAACE]">Perbarui data dan hak akses pengguna.</p>
                  </div>
                  <button onClick={() => setIsEditUserModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <XCircle size={24} />
                  </button>
                </div>

                <form onSubmit={handleEditUserSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                    <input 
                      type="text"
                      required
                      value={editUserData.name}
                      onChange={e => setEditUserData({...editUserData, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F9FBF9] text-sm focus:bg-white focus:ring-2 focus:ring-[#355872] focus:border-transparent outline-none transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Email</label>
                    <input 
                      type="email"
                      required
                      value={editUserData.email}
                      onChange={e => setEditUserData({...editUserData, email: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F9FBF9] text-sm focus:bg-white focus:ring-2 focus:ring-[#355872] focus:border-transparent outline-none transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Password Baru</label>
                    <input 
                      type="password"
                      value={editUserData.password}
                      onChange={e => setEditUserData({...editUserData, password: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F9FBF9] text-sm focus:bg-white focus:ring-2 focus:ring-[#355872] focus:border-transparent outline-none transition-all shadow-inner"
                      placeholder="Biarkan kosong jika tidak diubah"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Role Pengguna</label>
                    <select 
                      value={editUserData.role}
                      onChange={e => setEditUserData({...editUserData, role: e.target.value})}
                      disabled={currentUser?.role !== 'super_admin'}
                      className={`w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none transition-all shadow-inner font-semibold ${currentUser?.role !== 'super_admin' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-[#F9FBF9] text-[#355872] focus:bg-white focus:ring-2 focus:ring-[#355872] focus:border-transparent'}`}
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="admin">Admin Sistem</option>
                      <option value="user">Warga / User Biasa</option>
                    </select>
                    {currentUser?.role !== 'super_admin' && (
                      <p className="text-[10px] text-red-500 mt-1">Hanya Super Admin yang dapat mengubah role.</p>
                    )}
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsEditUserModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
                      Batal
                    </button>
                    <button type="submit" disabled={isSubmittingUser} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-[#355872] hover:bg-[#355872] transition-colors disabled:opacity-70 flex justify-center items-center">
                      {isSubmittingUser ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Response Modal */}
          {deleteResponseConfirmId !== null && (
            <div className="fixed inset-0 bg-[#355872]/45 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-gray-900">Hapus Tanggapan?</h3>
                </div>
                <p className="text-[#7AAACE] text-xs font-medium mb-6 leading-relaxed">
                  Apakah Anda yakin ingin menghapus tanggapan resmi ini? Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="flex space-x-3 justify-end">
                  <button
                    onClick={() => setDeleteResponseConfirmId(null)}
                    className="px-4 py-2.5 text-xs font-bold text-gray-550 hover:bg-gray-50 rounded-xl transition duration-200"
                  >
                    Batal
                  </button>
                  <button
                    onClick={async () => {
                      if (deleteResponseConfirmId !== null) {
                        await executeDeleteResponse(deleteResponseConfirmId);
                        setDeleteResponseConfirmId(null);
                      }
                    }}
                    className="px-4 py-2.5 text-xs font-bold text-white bg-red-500 hover:bg-red-650 rounded-xl shadow-lg shadow-red-500/20 transition duration-200"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Help Modal */}
          {isHelpModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-205">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsHelpModalOpen(false)}></div>
              <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 transform transition-all scale-100">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-xl font-black text-[#355872]">Pusat Bantuan LaporPak</h3>
                    <p className="text-sm font-medium text-[#7AAACE]">Panduan penggunaan sistem administrator</p>
                  </div>
                  <button onClick={() => setIsHelpModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <XCircle size={24} />
                  </button>
                </div>
                
                <div className="space-y-4 text-sm font-medium text-gray-600">
                  <div className="p-4 bg-[#F9FBF9] rounded-2xl border border-gray-100">
                    <h4 className="font-bold text-[#355872] mb-1">1. Tab Laporan</h4>
                    <p>Kelola keluhan warga dengan mengubah statusnya (Menunggu, Sedang Diproses, Selesai) atau memberi tanggapan resmi.</p>
                  </div>
                  <div className="p-4 bg-[#F9FBF9] rounded-2xl border border-gray-100">
                    <h4 className="font-bold text-[#355872] mb-1">2. Tab Pengguna</h4>
                    <p>Tambahkan akun admin baru, ubah hak akses (role), atau hapus user yang bermasalah (Hanya Super Admin yang dapat mengubah role).</p>
                  </div>
                  <div className="p-4 bg-[#F9FBF9] rounded-2xl border border-gray-100">
                    <h4 className="font-bold text-[#355872] mb-1">3. Kontak Support</h4>
                    <p>Butuh bantuan teknis lebih lanjut? Email kami di: <a href="mailto:support@laporpak.id" className="text-[#355872] font-bold underline">support@laporpak.id</a></p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                  <button onClick={() => setIsHelpModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#355872] hover:bg-[#28465c] transition-colors">
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// --- REUSABLE SUB-COMPONENTS ---

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-300 group
        ${active 
          ? 'bg-[#7AAACE] text-[#355872] shadow-sm' 
          : 'text-[#7AAACE] hover:bg-[#E8ECD9] hover:text-[#355872]'
        }
      `}
    >
      <div className={`${active ? 'text-[#355872]' : 'text-[#7AAACE] group-hover:text-[#355872]'} transition-colors`}>
        {icon}
      </div>
      <span className="tracking-tight">{label}</span>
    </button>
  );
}

function StatCard({ label, value, change, icon, glow = 'bg-white' }: any) {
  return (
    <div className={`rounded-3xl border border-[#EDF0ED] p-6 shadow-sm relative overflow-hidden flex flex-col gap-3 transition-all hover:shadow-md hover:-translate-y-0.5 ${glow} bg-white`}>
      <div className="flex justify-between items-start">
        <div className="w-10 h-10 bg-[#F9FBF9] border border-gray-50 rounded-xl shadow-inner flex items-center justify-center text-[#355872]">
          {icon}
        </div>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${change.startsWith('+') ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
          {change}
        </span>
      </div>
      <div>
        <h4 className="text-3xl font-black tracking-tight text-[#355872] leading-none mb-1">{value}</h4>
        <p className="text-[10px] tracking-widest font-bold text-[#7AAACE] uppercase opacity-80">{label}</p>
      </div>
      <div className="absolute bottom-0 right-0 w-16 h-16 bg-[#E8F0E6] rounded-full blur-2xl opacity-40 -mr-6 -mb-6"></div>
    </div>
  );
}
