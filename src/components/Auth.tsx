import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../data';
import { Shield, Mail, Lock, User as UserIcon, Phone, MapPin, CheckCircle, AlertCircle, Trophy } from 'lucide-react';

interface AuthProps {
  onLoginSuccess: (user: User) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Register States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  
  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // General Status
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Validations
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!loginEmail || !loginPassword) {
      setStatus({ type: 'error', message: 'Harap isi semua kolom email dan kata sandi.' });
      return;
    }

    if (!validateEmail(loginEmail)) {
      setStatus({ type: 'error', message: 'Format alamat email tidak valid.' });
      return;
    }

    const users = db.getUsers();
    const user = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase());

    if (!user) {
      setStatus({ type: 'error', message: 'Email tidak terdaftar.' });
      return;
    }

    if (user.passwordHash !== loginPassword) {
      setStatus({ type: 'error', message: 'Kata sandi salah.' });
      return;
    }

    if (user.status === 'nonaktif') {
      setStatus({ type: 'error', message: 'Akun Anda dinonaktifkan oleh administrator. Silakan hubungi kami untuk informasi lebih lanjut.' });
      return;
    }

    // Success
    setStatus({ type: 'success', message: 'Login berhasil! Mengalihkan...' });
    
    // Save to LocalStorage session
    if (rememberMe) {
      localStorage.setItem('futsal_remember_email', loginEmail);
    } else {
      localStorage.removeItem('futsal_remember_email');
    }
    
    setTimeout(() => {
      onLoginSuccess(user);
    }, 800);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!regName || !regEmail || !regPhone || !regAddress || !regPassword || !regConfirmPassword) {
      setStatus({ type: 'error', message: 'Semua kolom registrasi wajib diisi!' });
      return;
    }

    if (regName.trim().length < 3) {
      setStatus({ type: 'error', message: 'Nama lengkap minimal harus 3 karakter.' });
      return;
    }

    if (!validateEmail(regEmail)) {
      setStatus({ type: 'error', message: 'Format email tidak valid.' });
      return;
    }

    if (regPhone.length < 10) {
      setStatus({ type: 'error', message: 'Nomor HP minimal harus 10 digit.' });
      return;
    }

    if (regPassword.length < 6) {
      setStatus({ type: 'error', message: 'Kata sandi minimal harus 6 karakter demi keamanan.' });
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setStatus({ type: 'error', message: 'Kata sandi dan Konfirmasi Kata sandi tidak cocok.' });
      return;
    }

    const users = db.getUsers();
    const emailExist = users.some(u => u.email.toLowerCase() === regEmail.toLowerCase());

    if (emailExist) {
      setStatus({ type: 'error', message: 'Alamat email ini sudah terdaftar. Silakan gunakan email lain.' });
      return;
    }

    // Register User
    const newUser: User = {
      id: 'user-' + Date.now(),
      name: regName,
      email: regEmail,
      passwordHash: regPassword,
      phone: regPhone,
      address: regAddress,
      role: 'pelanggan',
      photo: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(regName)}`,
      status: 'aktif',
      createdAt: new Date().toISOString()
    };

    const updatedUsers = [...users, newUser];
    db.saveUsers(updatedUsers);

    setStatus({ type: 'success', message: 'Registrasi berhasil! Silakan login menggunakan email dan sandi baru Anda.' });
    
    // Clear registration form and toggle back to login
    setRegName('');
    setRegEmail('');
    setRegPhone('');
    setRegAddress('');
    setRegPassword('');
    setRegConfirmPassword('');
    
    setTimeout(() => {
      setMode('login');
      setLoginEmail(regEmail);
      setStatus(null);
    }, 2000);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus(null);

    if (!forgotEmail) {
      setForgotStatus({ type: 'error', message: 'Harap masukkan email Anda.' });
      return;
    }

    if (!validateEmail(forgotEmail)) {
      setForgotStatus({ type: 'error', message: 'Format email tidak valid.' });
      return;
    }

    const users = db.getUsers();
    const user = users.find(u => u.email.toLowerCase() === forgotEmail.toLowerCase());

    if (!user) {
      setForgotStatus({ type: 'error', message: 'Alamat email tersebut tidak dapat ditemukan dalam sistem kami.' });
      return;
    }

    // Direct simulated recovery: Show the password to help the user directly during simulation!
    setForgotStatus({
      type: 'success',
      message: `Simulasi: Tautan reset dikirim ke email Anda! Kata sandi akun Anda adalah: "${user.passwordHash}".`
    });
  };

  // Pre-fill email helper if Remember me was used in previous sessions
  React.useEffect(() => {
    const saved = localStorage.getItem('futsal_remember_email');
    if (saved) {
      setLoginEmail(saved);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Ambient Background Glows */}
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full animate-glow-1 z-0"></div>
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full animate-glow-2 z-0"></div>
      
      {/* Brand Logo Header */}
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Trophy className="w-7 h-7 text-white animate-pulse" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-white inline-flex items-center gap-1">
            CHAMPION<span className="text-emerald-400">FUTSAL</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono tracking-wider">SISTEM BOOKING LAPANGAN MODERN</p>
        </div>
      </div>

      {/* Main card panel */}
      <div className="w-full max-w-md bg-slate-950/40 border border-slate-800/50 backdrop-blur-xl rounded-[32px] p-6 md:p-8 shadow-2xl relative z-10">

        {/* Global form alerts */}
        {status && (
          <div className={`p-4 mb-5 rounded-lg flex items-start gap-2 text-sm border ${
            status.type === 'success' 
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' 
              : 'bg-red-950/40 text-red-300 border-red-800'
          }`}>
            {status.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <div>{status.message}</div>
          </div>
        )}

        {/* MODE: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold font-sans">Selamat Datang Kembali</h2>
              <p className="text-sm text-slate-400 mt-1">Masuk untuk melihat jadwal dan pesan lapangan futsal game Anda.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Alamat Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg p-3 pl-11 text-sm outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Kata Sandi</label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setForgotStatus(null); setStatus(null); }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 focus:outline-none transition-colors"
                >
                  Lupa Sandi?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="******"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg p-3 pl-11 text-sm outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                />
                Remember Me (Ingat Email)
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition-all duration-150 transform active:scale-[0.98] shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              Masuk Akun
            </button>

            <div className="text-center pt-4 text-xs text-slate-400">
              Belum punya akun Pelanggan?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setStatus(null); }}
                className="text-emerald-400 font-semibold hover:text-emerald-300 focus:outline-none transition-colors"
              >
                Daftar Sekarang
              </button>
            </div>
            
            <div className="border-t border-slate-800/60 pt-4 text-center">
              <div className="text-[10px] text-slate-500">
                <span className="font-semibold text-slate-400">Kredensial Demo Cepat:</span>
                <br />
                Pelanggan: <span className="text-orange-400">pelanggan@futsal.com</span> / <span className="text-orange-400">user123</span>
                <br />
                Administrator: <span className="text-orange-400">admin@futsal.com</span> / <span className="text-orange-400">admin123</span>
              </div>
            </div>
          </form>
        )}

        {/* MODE: REGISTER */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold font-sans">Registrasi Pelanggan Baru</h2>
              <p className="text-sm text-slate-400 mt-1">Buat akun untuk melakukan booking cepat dan pembayaran online.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Nama Lengkap</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Contoh: Zaky Maulana"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg p-3 pl-11 text-sm outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Alamat Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg p-3 pl-11 text-sm outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Nomor HP / WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg p-3 pl-11 text-sm outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Alamat Rumah</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <textarea
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="Masukkan alamat tinggal Anda..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg p-3 pl-11 text-sm outline-none transition-all placeholder:text-slate-600 resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Sandi</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mín. 6 karakter"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg p-3 pl-11 text-xs outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Ulangi Sandi</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Konfirmasi"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg p-3 pl-11 text-xs outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition-all duration-150 transform active:scale-[0.98] shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              Daftar Sebagai Pelanggan
            </button>

            <div className="text-center pt-2 text-xs text-slate-400">
              Sudah punya akun?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setStatus(null); }}
                className="text-emerald-400 font-semibold hover:text-emerald-300 focus:outline-none transition-colors"
              >
                Login Sekarang
              </button>
            </div>
          </form>
        )}

        {/* MODE: FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold font-sans">Lupa Kata Sandi?</h2>
              <p className="text-sm text-slate-400 mt-1">Masukkan alamat email terdaftar Anda untuk memulihkan akses kredensial akun.</p>
            </div>

            {forgotStatus && (
              <div className={`p-4 mb-2 rounded-lg text-sm border ${
                forgotStatus.type === 'success' 
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' 
                  : 'bg-red-950/40 text-red-300 border-red-800'
              }`}>
                <div className="font-semibold mb-1">
                  {forgotStatus.type === 'success' ? 'Berhasil Terverifikasi' : 'Terjadi Kesalahan'}
                </div>
                <div>{forgotStatus.message}</div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Alamat Email Anda</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg p-3 pl-11 text-sm outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition-all duration-150 transform active:scale-[0.98] cursor-pointer"
            >
              Pulihkan Kata Sandi
            </button>

            <div className="text-center pt-2 text-xs text-slate-400">
              Kembali ke halaman{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setStatus(null); setForgotStatus(null); }}
                className="text-emerald-400 font-semibold hover:text-emerald-300 focus:outline-none transition-colors"
              >
                Login Masuk
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
