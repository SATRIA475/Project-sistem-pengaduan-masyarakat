'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !newPassword || !confirmPassword) {
      alert('Silakan isi semua kolom.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Password baru dan konfirmasi password tidak cocok.');
      return;
    }

    if (newPassword.length < 6) {
      alert('Password minimal terdiri dari 6 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email, newPassword });
      alert('Password berhasil diperbarui! Silakan masuk kembali.');
      router.push('/login');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Gagal mengatur ulang sandi. Pastikan email Anda benar.';
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8F0] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8">
        
        {/* Header */}
        <div className="text-center relative">
          <Link href="/login" className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#355872] flex items-center transition-all">
            <ArrowLeft className="h-5 w-5 mr-1" />
            <span className="hidden sm:inline text-sm font-medium">Masuk</span>
          </Link>
          <h1 className="text-5xl font-extrabold text-[#355872] tracking-tight">LaporPak</h1>
          <p className="mt-3 text-base text-gray-600">Atur ulang password akun Anda.</p>
        </div>
        
        {/* Reset Card */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#355872]"></div>
          
          <form className="space-y-6" onSubmit={handleResetPassword}>
            <div className="space-y-4">
              
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Terdaftar</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4">
                    <Mail className="h-5 w-5 text-[#7AAACE]" />
                  </div>
                  <input
                    type="email"
                    required
                    className="w-full bg-[#F3F3ED] text-gray-900 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-[#355872] transition-all"
                    placeholder="Masukkan email terdaftar"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Baru Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password Baru</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4">
                    <Lock className="h-5 w-5 text-[#7AAACE]" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full bg-[#F3F3ED] text-gray-900 rounded-xl pl-12 pr-12 py-3.5 outline-none focus:ring-2 focus:ring-[#355872] transition-all"
                    placeholder="Masukkan password baru"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <div className="absolute right-4 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-5 w-5 text-[#7AAACE]" /> : <Eye className="h-5 w-5 text-[#7AAACE]" />}
                  </div>
                </div>
              </div>

              {/* Konfirmasi Password Baru Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password Baru</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4">
                    <ShieldCheck className="h-5 w-5 text-[#7AAACE]" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full bg-[#F3F3ED] text-gray-900 rounded-xl pl-12 pr-12 py-3.5 outline-none focus:ring-2 focus:ring-[#355872] transition-all"
                    placeholder="Konfirmasi password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3.5 px-4 rounded-xl text-white font-bold bg-[#355872] hover:bg-[#355872] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#355872] transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Memproses...' : 'Ubah Password'}
            </button>
          </form>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Kembali ke{' '}
            <Link href="/login" className="font-bold text-[#355872] hover:underline">
              Halaman Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
