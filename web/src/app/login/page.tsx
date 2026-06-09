'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { User, Lock, Eye, EyeOff, X, Mail, CheckCircle, XCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Silakan isi email dan password.');
      setShowErrorModal(true);
      return;
    }
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      setShowSuccessModal(true);
      setTimeout(() => {
        if (res.data.user.role === 'admin' || res.data.user.role === 'super_admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }, 1500);
    } catch (error) {
      setErrorMessage('Login gagal. Cek kembali email dan password Anda.');
      setShowErrorModal(true);
    }
  };

  const handleGoogleLogin = async () => {
    if (!googleEmail || !googleEmail.includes('@')) {
      setErrorMessage('Masukkan email Google yang valid.');
      setShowErrorModal(true);
      return;
    }
    setIsGoogleLoading(true);
    try {
      const res = await api.post('/auth/google-login', { email: googleEmail });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      setShowSuccessModal(true);
      setTimeout(() => {
        if (res.data.user.role === 'admin' || res.data.user.role === 'super_admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }, 1500);
    } catch (error) {
      setErrorMessage('Login dengan Google gagal. Silakan coba lagi.');
      setShowErrorModal(true);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8F0] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-[#355872] tracking-tight">LaporPak</h1>
          <p className="mt-3 text-base text-gray-600">Mari bersama bangun kota yang lebih baik.</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email atau Nomor Telepon</label>
              <div className="relative flex items-center">
                <div className="absolute left-4">
                  <User className="h-5 w-5 text-[#7AAACE]" />
                </div>
                <input
                  type="email"
                  required
                  className="w-full bg-[#F7F8F0] text-gray-900 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-[#355872] transition-all"
                  placeholder="Masukkan email atau no telp"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-[#355872]">Lupa Password?</Link>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-4">
                  <Lock className="h-5 w-5 text-[#7AAACE]" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full bg-[#F7F8F0] text-gray-900 rounded-xl pl-12 pr-12 py-3.5 outline-none focus:ring-2 focus:ring-[#355872] transition-all"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="absolute right-4 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-5 w-5 text-[#7AAACE]" /> : <Eye className="h-5 w-5 text-[#7AAACE]" />}
                </div>
              </div>
            </div>

          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3.5 px-4 rounded-xl text-white font-bold bg-[#355872] hover:bg-[#355872] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#355872] transition-colors"
          >
            Masuk
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#F7F8F0] text-gray-500">Atau masuk dengan</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button 
              onClick={() => setShowGoogleModal(true)}
              className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl bg-[#F7F8F0] hover:bg-[#F7F8F0] transition-colors text-gray-900 font-medium"
            >
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Lanjutkan dengan Google
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Belum punya akun?{' '}
            <Link href="/register" className="font-bold text-[#355872] hover:underline">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>

      {/* Google Login Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <h3 className="text-lg font-bold text-gray-900">Masuk dengan Google</h3>
              </div>
              <button onClick={() => { setShowGoogleModal(false); setGoogleEmail(''); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">Masukkan email Google Anda untuk melanjutkan.</p>
            
            <div className="relative flex items-center mb-4">
              <div className="absolute left-4">
                <Mail className="h-5 w-5 text-[#7AAACE]" />
              </div>
              <input
                type="email"
                className="w-full bg-[#F5F5F0] text-gray-900 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-[#4285F4] transition-all"
                placeholder="email@gmail.com"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                autoFocus
              />
            </div>
            
            <button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || !googleEmail}
              className="w-full py-3.5 rounded-xl text-white font-bold bg-[#4285F4] hover:bg-[#3574d4] transition-colors disabled:opacity-50"
            >
              {isGoogleLoading ? 'Memproses...' : 'Lanjutkan'}
            </button>
            
            <p className="text-xs text-center text-gray-400 mt-3">
              Jika email belum terdaftar, akun baru akan dibuat otomatis.
            </p>
          </div>
        </div>
      )}
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Login Berhasil!</h3>
            <p className="text-gray-500 text-sm mb-6">
              Mengalihkan ke halaman utama...
            </p>
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Login Gagal</h3>
            <p className="text-gray-500 text-sm mb-6">
              {errorMessage}
            </p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full py-3 rounded-xl text-white font-bold bg-red-500 hover:bg-red-600 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
