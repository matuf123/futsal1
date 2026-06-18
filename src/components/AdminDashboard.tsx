import React, { useState, useEffect } from 'react';
import { User, Lapangan, Booking, Pembayaran, ProfilUsaha, OperasionalConfig, BookingStatus, PaymentStatus } from '../types';
import { db } from '../data';
import { 
  LayoutDashboard, Users, Calendar, DollarSign, FileText, Settings, Key, 
  Plus, Edit2, Trash2, Check, X, Shield, Phone, MapPin, Eye, Filter, Download, 
  TrendingUp, Activity, Coffee, ShieldAlert, BadgeInfo, CheckCircle, Info, CalendarRange, Clock, Award
} from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'pengguna' | 'lapangan' | 'jadwal' | 'booking' | 'pembayaran' | 'laporan' | 'profil'>('dashboard');

  // Unified global databases loaded in memory
  const [usersList, setUsersList] = useState<User[]>([]);
  const [courtsList, setCourtsList] = useState<Lapangan[]>([]);
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const [paymentsList, setPaymentsList] = useState<Pembayaran[]>([]);
  const [businessProfile, setBusinessProfile] = useState<ProfilUsaha | null>(null);
  const [opConfig, setOpConfig] = useState<OperasionalConfig | null>(null);

  // Stats Calculations
  const [revenueToday, setRevenueToday] = useState(0);
  const [revenueWeek, setRevenueWeek] = useState(0);
  const [revenueMonth, setRevenueMonth] = useState(0);

  // Forms Notifications
  const [adminStatus, setAdminStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // User Management CRUD modal/form states
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormName, setUserFormName] = useState('');
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormPhone, setUserFormPhone] = useState('');
  const [userFormAddress, setUserFormAddress] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [userFormRole, setUserFormRole] = useState<'admin' | 'pelanggan'>('pelanggan');
  const [userFormStatus, setUserFormStatus] = useState<'aktif' | 'nonaktif'>('aktif');

  // Court Management CRUD states
  const [showCourtModal, setShowCourtModal] = useState(false);
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);
  const [courtFormName, setCourtFormName] = useState('');
  const [courtFormDescription, setCourtFormDescription] = useState('');
  const [courtFormPrice, setCourtFormPrice] = useState(100000);
  const [courtFormLocation, setCourtFormLocation] = useState('');
  const [courtFormType, setCourtFormType] = useState<'Vinyl' | 'Rumput Sintetis' | 'Semen' | 'Interlock'>('Vinyl');
  const [courtFormFacilities, setCourtFormFacilities] = useState<string[]>([]);
  const [courtFormPhoto, setCourtFormPhoto] = useState('');
  const [courtFormStatus, setCourtFormStatus] = useState<'aktif' | 'maintenance' | 'nonaktif'>('aktif');

  // Scheduling Configurations
  const [opStartHour, setOpStartHour] = useState(8);
  const [opEndHour, setOpEndHour] = useState(23);
  const [opDaysOpen, setOpDaysOpen] = useState<string[]>([]);
  const [newHoliday, setNewHoliday] = useState('');
  const [newMaintenance, setNewMaintenance] = useState('');

  // Payment proof lightbox modal path
  const [viewProofImage, setViewProofImage] = useState<string | null>(null);

  // Laporan / Reports Filter parameters
  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [reportEndDate, setReportEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [reportFilterType, setReportFilterType] = useState<'semua' | 'selesai' | 'batal'>('semua');

  // Profil Usaha Edit States
  const [usName, setUsName] = useState('');
  const [usOwner, setUsOwner] = useState('');
  const [usAddress, setUsAddress] = useState('');
  const [usPhone, setUsPhone] = useState('');
  const [adminPassOld, setAdminPassOld] = useState('');
  const [adminPassNew, setAdminPassNew] = useState('');

  // Reload lists on menu mount
  useEffect(() => {
    loadDatabaseFromStorage();
  }, [activeMenu]);

  const loadDatabaseFromStorage = () => {
    const listU = db.getUsers();
    const listC = db.getCourts();
    const listB = db.getBookings();
    const listP = db.getPayments();
    const prof = db.getProfilUsaha();
    const op = db.getOperasional();

    setUsersList(listU);
    setCourtsList(listC);
    setBookingsList(listB);
    setPaymentsList(listP);
    setBusinessProfile(prof);
    setOpConfig(op);

    // Populate profile forms
    setUsName(prof.name);
    setUsOwner(prof.owner);
    setUsAddress(prof.address);
    setUsPhone(prof.phone);

    // Populate operational states
    setOpStartHour(op.startHour);
    setOpEndHour(op.endHour);
    setOpDaysOpen(op.daysOpen);

    // Calculate revenue sums
    const { today, week, month } = db.getRevenueStats();
    setRevenueToday(today);
    setRevenueWeek(week);
    setRevenueMonth(month);
  };

  const syncAllLocalDatabases = (newU?: User[], newC?: Lapangan[], newB?: Booking[], newP?: Pembayaran[]) => {
    if (newU) { db.saveUsers(newU); setUsersList(newU); }
    if (newC) { db.saveCourts(newC); setCourtsList(newC); }
    if (newB) { db.saveBookings(newB); setBookingsList(newB); }
    if (newP) { db.savePayments(newP); setPaymentsList(newP); }
    loadDatabaseFromStorage();
  };

  // KELOLA PENGGUNA CRUD CONTROLLER
  const handleOpenUserModal = (targetUser: User | null = null) => {
    if (targetUser) {
      setEditingUserId(targetUser.id);
      setUserFormName(targetUser.name);
      setUserFormEmail(targetUser.email);
      setUserFormPhone(targetUser.phone);
      setUserFormAddress(targetUser.address);
      setUserFormPassword(targetUser.passwordHash);
      setUserFormRole(targetUser.role);
      setUserFormStatus(targetUser.status);
    } else {
      setEditingUserId(null);
      setUserFormName('');
      setUserFormEmail('');
      setUserFormPhone('');
      setUserFormAddress('');
      setUserFormPassword('');
      setUserFormRole('pelanggan');
      setUserFormStatus('aktif');
    }
    setShowUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminStatus(null);

    if (!userFormName || !userFormEmail || !userFormPhone || !userFormPassword) {
      alert('Nama, Email, HP, dan Password wajib diisi.');
      return;
    }

    const currentUsers = [...usersList];

    if (editingUserId) {
      // Edit mode
      const updated = currentUsers.map(u => {
        if (u.id === editingUserId) {
          return {
            ...u,
            name: userFormName,
            email: userFormEmail,
            phone: userFormPhone,
            address: userFormAddress,
            passwordHash: userFormPassword,
            role: userFormRole,
            status: userFormStatus
          };
        }
        return u;
      });
      syncAllLocalDatabases(updated);
    } else {
      // Create mode
      const emailExists = currentUsers.some(u => u.email.toLowerCase() === userFormEmail.toLowerCase());
      if (emailExists) {
        alert('Email tersebut sudah terdaftar.');
        return;
      }
      const newUserObj: User = {
        id: 'user-' + Date.now(),
        name: userFormName,
        email: userFormEmail,
        passwordHash: userFormPassword,
        phone: userFormPhone,
        address: userFormAddress,
        role: userFormRole,
        photo: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(userFormName)}`,
        status: userFormStatus,
        createdAt: new Date().toISOString()
      };
      syncAllLocalDatabases([...currentUsers, newUserObj]);
    }
    setShowUserModal(false);
  };

  const handleDeleteUser = (id: string) => {
    if (id === 'user-admin') {
      alert('Akun admin utama tidak boleh dihapus demi kelancaran simulasi.');
      return;
    }
    if (confirm('Apakah Anda yakin ingin menghapus pengguna ini dari database permanently?')) {
      const updated = usersList.filter(u => u.id !== id);
      syncAllLocalDatabases(updated);
    }
  };

  const toggleUserStatus = (id: string) => {
    if (id === 'user-admin') return;
    const updated = usersList.map(u => {
      if (u.id === id) {
        return { ...u, status: u.status === 'aktif' ? 'nonaktif' as const : 'aktif' as const };
      }
      return u;
    });
    syncAllLocalDatabases(updated);
  };


  // KELOLA LAPANGAN CRUD CONTROLLER
  const handleOpenCourtModal = (targetCourt: Lapangan | null = null) => {
    if (targetCourt) {
      setEditingCourtId(targetCourt.id);
      setCourtFormName(targetCourt.name);
      setCourtFormDescription(targetCourt.description);
      setCourtFormPrice(targetCourt.pricePerHour);
      setCourtFormLocation(targetCourt.location);
      setCourtFormType(targetCourt.type);
      setCourtFormFacilities(targetCourt.facilities);
      setCourtFormPhoto(targetCourt.photo);
      setCourtFormStatus(targetCourt.status);
    } else {
      setEditingCourtId(null);
      setCourtFormName('');
      setCourtFormDescription('');
      setCourtFormPrice(100000);
      setCourtFormLocation('');
      setCourtFormType('Vinyl');
      setCourtFormFacilities([]);
      setCourtFormPhoto('https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&auto=format&fit=crop&q=80');
      setCourtFormStatus('aktif');
    }
    setShowCourtModal(true);
  };

  const handleSaveCourt = (e: React.FormEvent) => {
    e.preventDefault();

    if (!courtFormName || !courtFormLocation || !courtFormPrice) {
      alert('Harap isi Nama Lapangan, Lokasi, dan Harga.');
      return;
    }

    const currentCourts = [...courtsList];

    if (editingCourtId) {
      const updated = currentCourts.map(c => {
        if (c.id === editingCourtId) {
          return {
            ...c,
            name: courtFormName,
            description: courtFormDescription,
            pricePerHour: Number(courtFormPrice),
            location: courtFormLocation,
            type: courtFormType,
            facilities: courtFormFacilities as any,
            photo: courtFormPhoto || 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&auto=format&fit=crop&q=80',
            status: courtFormStatus
          };
        }
        return c;
      });
      syncAllLocalDatabases(undefined, updated);
    } else {
      const newC: Lapangan = {
        id: 'court-' + Date.now(),
        name: courtFormName,
        description: courtFormDescription,
        pricePerHour: Number(courtFormPrice),
        location: courtFormLocation,
        type: courtFormType,
        facilities: courtFormFacilities as any,
        photo: courtFormPhoto || 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&auto=format&fit=crop&q=80',
        status: courtFormStatus
      };
      syncAllLocalDatabases(undefined, [...currentCourts, newC]);
    }
    setShowCourtModal(false);
  };

  const handleDeleteCourt = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus lapangan futsal ini secara permanen?')) {
      const updated = courtsList.filter(c => c.id !== id);
      syncAllLocalDatabases(undefined, updated);
    }
  };

  const handleFacilityCheckbox = (facName: string, checked: boolean) => {
    if (checked) {
      setCourtFormFacilities([...courtFormFacilities, facName]);
    } else {
      setCourtFormFacilities(courtFormFacilities.filter(f => f !== facName));
    }
  };


  // KELOLA OPERASIONAL JADWAL CONTROLLER
  const handleSaveOperasionalSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (opConfig) {
      const updated: OperasionalConfig = {
        ...opConfig,
        startHour: Number(opStartHour),
        endHour: Number(opEndHour),
        daysOpen: opDaysOpen
      };
      db.saveOperasional(updated);
      setOpConfig(updated);
      alert('Ketentuan operasional harian berhasil diperbarui.');
    }
  };

  const handleAddHoliday = () => {
    if (!newHoliday) return;
    if (opConfig) {
      if (opConfig.holidays.includes(newHoliday)) return;
      const updated = {
        ...opConfig,
        holidays: [...opConfig.holidays, newHoliday]
      };
      db.saveOperasional(updated);
      setOpConfig(updated);
      setNewHoliday('');
    }
  };

  const handleRemoveHoliday = (date: string) => {
    if (opConfig) {
      const updated = {
        ...opConfig,
        holidays: opConfig.holidays.filter(h => h !== date)
      };
      db.saveOperasional(updated);
      setOpConfig(updated);
    }
  };

  const handleAddMaintenance = () => {
    if (!newMaintenance) return;
    if (opConfig) {
      if (opConfig.maintenanceDates.includes(newMaintenance)) return;
      const updated = {
         ...opConfig,
         maintenanceDates: [...opConfig.maintenanceDates, newMaintenance]
      };
      db.saveOperasional(updated);
      setOpConfig(updated);
      setNewMaintenance('');
    }
  };

  const handleRemoveMaintenance = (date: string) => {
    if (opConfig) {
      const updated = {
        ...opConfig,
        maintenanceDates: opConfig.maintenanceDates.filter(m => m !== date)
      };
      db.saveOperasional(updated);
      setOpConfig(updated);
    }
  };


  // BOOKING MASUK CONTROLLERS (Approve/Reject)
  const handleUpdateBookingStatus = (bookingId: string, newStatus: BookingStatus) => {
    const updated = bookingsList.map(b => {
      if (b.id === bookingId) {
        return { ...b, status: newStatus };
      }
      return b;
    });

    // Automatically sync corresponding payments
    let paymentStatusMatch: PaymentStatus = 'Belum Bayar';
    if (newStatus === 'Dikonfirmasi') paymentStatusMatch = 'Diterima';
    if (newStatus === 'Ditolak' || newStatus === 'Dibatalkan') paymentStatusMatch = 'Ditolak';

    const updatedPayments = paymentsList.map(p => {
      if (p.bookingId === bookingId) {
        return { ...p, status: paymentStatusMatch };
      }
      return p;
    });

    syncAllLocalDatabases(undefined, undefined, updated, updatedPayments);
  };


  // KELOLA VERIFIKASI PEMBAYARAN MASUK
  const handleVerifyPayment = (paymentId: string, action: 'TERIMA' | 'TOLAK') => {
    const paymentItem = paymentsList.find(p => p.id === paymentId);
    if (!paymentItem) return;

    const newPaymentStatus: PaymentStatus = action === 'TERIMA' ? 'Diterima' : 'Ditolak';
    const newBookingStatus: BookingStatus = action === 'TERIMA' ? 'Dikonfirmasi' : 'Ditolak';

    const updatedPayments = paymentsList.map(p => {
      if (p.id === paymentId) {
        return { ...p, status: newPaymentStatus };
      }
      return p;
    });

    const updatedBookings = bookingsList.map(b => {
      if (b.id === paymentItem.bookingId) {
        return { ...b, status: newBookingStatus };
      }
      return b;
    });

    syncAllLocalDatabases(undefined, undefined, updatedBookings, updatedPayments);
  };


  // PROFIL USAHA SETTING SUBMIT
  const handleSaveUsaha = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ProfilUsaha = {
      name: usName,
      owner: usOwner,
      address: usAddress,
      phone: usPhone
    };
    db.saveProfilUsaha(updated);
    setBusinessProfile(updated);
    alert('Rincian identitas usaha/arena futsal berhasil disimpan.');
  };

  const handleAdminChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassOld || !adminPassNew) {
      alert('Mohon isi pasword lama dan baru.');
      return;
    }
    
    if (user.passwordHash !== adminPassOld) {
      alert('Sandi saat ini tidak cocok.');
      return;
    }

    // save 
    const users = db.getUsers();
    const updated = users.map(u => {
      if (u.id === user.id) {
        return { ...u, passwordHash: adminPassNew };
      }
      return u;
    });
    db.saveUsers(updated);
    setAdminPassOld('');
    setAdminPassNew('');
    alert('Sandi admin berhasil diubah.');
  };

  // Filtered reports calculation
  const reportsFilteredBookings = bookingsList.filter(b => {
    const bDate = new Date(b.date);
    const start = new Date(reportStartDate);
    const end = new Date(reportEndDate);
    const dateMatch = bDate >= start && bDate <= end;
    
    if (!dateMatch) return false;

    if (reportFilterType === 'selesai') {
      return b.status === 'Selesai' || b.status === 'Dikonfirmasi';
    } else if (reportFilterType === 'batal') {
      return b.status === 'Dibatalkan' || b.status === 'Ditolak';
    }
    return true; // semua
  });

  const reportsTotalRevenue = reportsFilteredBookings.reduce((sum, b) => {
    if (b.status === 'Selesai' || b.status === 'Dikonfirmasi') {
      return sum + b.totalPrice;
    }
    return sum;
  }, 0);

  // Status Badge helpers
  const getBookingBadge = (status: BookingStatus) => {
    switch (status) {
      case 'Menunggu Pembayaran':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">Menunggu Pembayaran</span>;
      case 'Menunggu Verifikasi':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Menunggu Verifikasi</span>;
      case 'Dikonfirmasi':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Dikonfirmasi</span>;
      case 'Ditolak':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">Ditolak</span>;
      case 'Selesai':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">Selesai</span>;
      case 'Dibatalkan':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">Dibatalkan</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col md:flex-row relative overflow-hidden font-sans">
      {/* Ambient Background Glows */}
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-emerald-500/10 blur-[130px] rounded-full animate-glow-1 z-0"></div>
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-blue-600/10 blur-[130px] rounded-full animate-glow-2 z-0"></div>

      {/* PROFESSIONAL DASHBOARD SIDEBAR FOR ADMIN */}
      <aside className="w-full md:w-64 bg-slate-950/50 backdrop-blur-xl border-b md:border-b-0 md:border-r border-slate-800/50 p-6 flex flex-col justify-between flex-shrink-0 z-10">
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-5 border-b border-slate-800/60">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm text-white block tracking-tight font-display">CHAMPION<span className="text-emerald-400 font-extrabold">FUTSAL</span></span>
              <span className="text-[9px] text-slate-400 font-semibold uppercase block tracking-wider font-mono">PORTAL ADMIN</span>
            </div>
          </div>

          {/* Menus list icons */}
          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard Analisis', icon: <LayoutDashboard className="w-4 h-4" /> },
              { id: 'pengguna', label: 'Kelola Pengguna', icon: <Users className="w-4 h-4" /> },
              { id: 'lapangan', label: 'Kelola Lapangan', icon: <DollarSign className="w-4 h-4" /> }, // Use DollarSign instead of CourtIcon as standard
              { id: 'jadwal', label: 'Kelola Jadwal', icon: <CalendarRange className="w-4 h-4" /> },
              { id: 'booking', label: 'Booking Masuk', icon: <Calendar className="w-4 h-4" /> },
              { id: 'pembayaran', label: 'Verifikasi Pembayaran', icon: <DollarSign className="w-4 h-4" /> },
              { id: 'laporan', label: 'Rekap Laporan', icon: <FileText className="w-4 h-4" /> },
              { id: 'profil', label: 'Profil Arena Usaha', icon: <Settings className="w-4 h-4" /> }
            ].map(menu => (
              <button
                key={menu.id}
                onClick={() => setActiveMenu(menu.id as any)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all text-left cursor-pointer ${
                  activeMenu === menu.id 
                    ? 'bg-emerald-500 text-slate-950 shadow shadow-emerald-500/25 font-bold' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {menu.icon}
                <span>{menu.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Footer Admin Card */}
        <div className="pt-6 border-t border-slate-800 space-y-3 hidden md:block">
          <div className="flex items-center gap-2">
            <img referrerPolicy="no-referrer" src={user.photo} alt={user.name} className="w-8 h-8 rounded-full border border-slate-700 object-cover" />
            <div className="text-[10px] text-slate-400 overflow-hidden">
              <span className="font-bold block text-slate-200 truncate">{user.name}</span>
              <span className="block text-slate-500 truncate">{user.email}</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full py-1.5 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 border border-rose-850/60 rounded text-[10px] font-bold uppercase cursor-pointer"
          >
            Log Out Perusahaan
          </button>
        </div>
      </aside>

      {/* ADMIN CONTENT CONTAINER CONTAINER */}
      <main className="flex-1 p-5 md:p-8 overflow-y-auto max-w-6xl relative z-10">
        
        {/* ==================== SCREEN 1: DASHBOARD ==================== */}
        {activeMenu === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header info */}
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5.5 h-5.5 text-emerald-400" /> Ringkasan Kinerja Bisnis Futsal
              </h2>
              <p className="text-xs text-slate-400 mt-1">Data dikalkulasi instan berdasarkan status reservasi lunas terkini.</p>
            </div>

            {/* Premium Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">TOTAL AKTIF LAPANGAN</span>
                <span className="text-2xl font-black text-white block">{courtsList.filter(c => c.status === 'aktif').length}</span>
                <span className="text-[10px] text-slate-500 block">Unit Lapangan Aktif</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">TOTAL RESERVASI BOOKING</span>
                <span className="text-2xl font-black text-white block">{bookingsList.length}</span>
                <span className="text-[10px] text-slate-500 block">Transaksi Pemesanan</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">REVENUE BULAN INI</span>
                <span className="text-2xl font-black text-emerald-400 block">Rp {revenueMonth.toLocaleString('id-ID')}</span>
                <span className="text-[10px] text-slate-500 block">Laba Pemesanan Dikunci</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">TOTAL PENGGUNA TERPETA</span>
                <span className="text-2xl font-black text-white block">{usersList.length}</span>
                <span className="text-[10px] text-slate-500 block">Jumlah Akun Sistem</span>
              </div>
            </div>

            {/* Revenue breakout sub totals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-950/40 to-slate-900 p-4 border border-blue-900/35 rounded-xl">
                <span className="text-xs text-slate-400 block font-medium">Laba Pendapatan Hari Ini</span>
                <span className="text-lg font-black text-emerald-400 block mt-1">Rp {revenueToday.toLocaleString('id-ID')}</span>
              </div>
              <div className="bg-gradient-to-r from-blue-950/40 to-slate-900 p-4 border border-blue-900/35 rounded-xl">
                <span className="text-xs text-slate-400 block font-medium">Laba Pendapatan 1 Minggu Terakhir</span>
                <span className="text-lg font-black text-emerald-400 block mt-1">Rp {revenueWeek.toLocaleString('id-ID')}</span>
              </div>
              <div className="bg-gradient-to-r from-blue-950/40 to-slate-900 p-4 border border-blue-900/35 rounded-xl">
                <span className="text-xs text-slate-400 block font-medium">Laba Pendapatan Bulan Berjalan</span>
                <span className="text-lg font-black text-emerald-400 block mt-1">Rp {revenueMonth.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* CUSTOM RENDERING GORGEOUS SVG ANALYTICS CHARTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Chart 1: Booking Bulanan (Bar Chart) */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4">
                <div>
                  <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Grafik Reservasi Booking Bulanan 2026</h4>
                  <p className="text-[11px] text-slate-500">Jumlah transaksi reservasi berhasil teregistrasi bulanan.</p>
                </div>
                
                {/* SVG Bar chart */}
                <div className="h-44 w-full flex items-end justify-between pt-6 px-2 border-b border-l border-slate-850">
                  {[
                    { m: 'Jan', val: 4, height: 'h-1/5' },
                    { m: 'Feb', val: 8, height: 'h-2/5' },
                    { m: 'Mar', val: 12, height: 'h-3/5' },
                    { m: 'Apr', val: 16, height: 'h-4/5' },
                    { m: 'Mei', val: 10, height: 'h-2/4' },
                    { m: 'Jun', val: 20, height: 'h-full' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center flex-1 group">
                      <span className="text-[9px] text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-1">{item.val} bk</span>
                      <div className={`w-6 bg-emerald-500/80 group-hover:bg-emerald-400 rounded-t transition-all ${item.height}`}></div>
                      <span className="text-[10px] text-slate-400 mt-2">{item.m}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 2: Pendapatan Bulanan (Line Chart) */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4">
                <div>
                  <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Grafik Pendapatan Lapangan Bulanan (Rp)</h4>
                  <p className="text-[11px] text-slate-500">Omset pendapatan kotor lunas per bulan berjalan.</p>
                </div>

                {/* SVG Line chart simulation with beautiful customized coordinate lines */}
                <div className="pt-4">
                  <svg className="w-full h-36 overflow-visible" viewBox="0 0 300 100">
                    {/* Grid Lines */}
                    <line x1="0" y1="20" x2="300" y2="20" stroke="#1e293b" strokeWidth="0.5" />
                    <line x1="0" y1="50" x2="300" y2="50" stroke="#1e293b" strokeWidth="0.5" />
                    <line x1="0" y1="80" x2="300" y2="80" stroke="#1e293b" strokeWidth="0.5" />
                    
                    {/* Interpolated Graph Line Path */}
                    <path 
                      d="M 10 90 Q 60 70 110 55 T 210 35 T 290 15" 
                      fill="none" 
                      stroke="#10b981" 
                      strokeWidth="2.5" 
                      strokeLinecap="round"
                    />
                    
                    {/* Data circle points */}
                    <circle cx="10" cy="90" r="3.5" fill="#10b981" />
                    <circle cx="60" cy="70" r="3.5" fill="#10b981" />
                    <circle cx="110" cy="55" r="3.5" fill="#10b981" />
                    <circle cx="210" cy="35" r="3.5" fill="#10b981" />
                    <circle cx="290" cy="15" r="3.5" fill="#10b981" />

                    {/* Left vertical values labels */}
                    <text x="5" y="15" fill="#64748b" fontSize="7">Rp 5JT</text>
                    <text x="5" y="55" fill="#64748b" fontSize="7">Rp 2.5JT</text>
                    <text x="5" y="95" fill="#64748b" fontSize="7">Rp 0</text>
                  </svg>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-2">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>Mei</span>
                    <span>Juni</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== SCREEN 2: KELOLA PENGGUNA ==================== */}
        {activeMenu === 'pengguna' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5.5 h-5.5 text-emerald-400" /> Database Akun Pengguna
                </h2>
                <p className="text-xs text-slate-400 mt-1">Lakukan registrasi manual, sunting rincian profile, atau nonaktifkan status suspensi member.</p>
              </div>
              <button
                onClick={() => handleOpenUserModal(null)}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Plus className="w-4 h-4" /> Tambah Pengguna
              </button>
            </div>

            {/* List Table of Users */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="py-3.5 px-4">Pengguna</th>
                      <th className="py-3.5 px-4">Peran (Role)</th>
                      <th className="py-3.5 px-4">Kontak Telefon</th>
                      <th className="py-3.5 px-4">Alamat Rumah</th>
                      <th className="py-3.5 px-4">Status Akun</th>
                      <th className="py-3.5 px-4 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {usersList.map(u => (
                      <tr key={u.id} className="hover:bg-slate-950/25">
                        <td className="py-3 px-4 flex items-center gap-3">
                          <img referrerPolicy="no-referrer" src={u.photo} alt={u.name} className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 object-cover" />
                          <div>
                            <span className="font-bold text-white block">{u.name}</span>
                            <span className="text-slate-500 block text-[10px]">{u.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 uppercase font-bold tracking-wider text-[10px]">
                          {u.role === 'admin' ? (
                            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/15">Pemilik Arena</span>
                          ) : (
                            <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Pelanggan Aktif</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-300">{u.phone}</td>
                        <td className="py-3 px-4 text-slate-450 max-w-xs truncate">{u.address || '-'}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleUserStatus(u.id)}
                            disabled={u.id === 'user-admin'}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                              u.status === 'aktif' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                            }`}
                          >
                            {u.status === 'aktif' ? '✓ Aktif' : '⚡ Nonaktif / Blokir'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenUserModal(u)}
                              className="p-1 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-750 text-slate-300 rounded cursor-pointer"
                              title="Edit User"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1 px-2 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-800 text-rose-400 rounded cursor-pointer"
                              title="Hapus"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* USER FORM MODAL */}
            {showUserModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
                  <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
                    <h3 className="font-sans font-bold text-sm text-white">
                      {editingUserId ? 'Edit Akun Pengguna Futsal' : 'Tambah Pengguna Baru'}
                    </h3>
                    <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5 /" /></button>
                  </div>
                  
                  <form onSubmit={handleSaveUser} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Nama Lengkap</label>
                      <input
                        type="text"
                        value={userFormName}
                        onChange={(e) => setUserFormName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white outline-none"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Email Login</label>
                        <input
                          type="email"
                          value={userFormEmail}
                          onChange={(e) => setUserFormEmail(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Kata Sandi</label>
                        <input
                          type="text"
                          value={userFormPassword}
                          onChange={(e) => setUserFormPassword(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Nomor HP</label>
                        <input
                          type="text"
                          value={userFormPhone}
                          onChange={(e) => setUserFormPhone(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Wewenang / Hak</label>
                        <select
                          value={userFormRole}
                          onChange={(e) => setUserFormRole(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white outline-none cursor-pointer"
                        >
                          <option value="pelanggan">Pelanggan</option>
                          <option value="admin">Administrator / Pemilik</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Alamat Tinggal</label>
                      <input
                        type="text"
                        value={userFormAddress}
                        onChange={(e) => setUserFormAddress(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Status Akun</label>
                      <select
                        value={userFormStatus}
                        onChange={(e) => setUserFormStatus(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white outline-none cursor-pointer"
                      >
                        <option value="aktif">Aktif</option>
                        <option value="nonaktif">Nonaktif / Blokir</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 font-bold rounded text-xs text-slate-950 transition-colors cursor-pointer"
                    >
                      Simpan Data Pengguna
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== SCREEN 3: KELOLA LAPANGAN ==================== */}
        {activeMenu === 'lapangan' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Plus className="w-5.5 h-5.5 text-emerald-400" /> Manajemen Lapangan Futsal
                </h2>
                <p className="text-xs text-slate-400 mt-1">Entri data harga per jam sewa lapangan, lokasi hall, rincian fasilitas standar, dan gambar visual.</p>
              </div>
              <button
                onClick={() => handleOpenCourtModal(null)}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah Lapangan
              </button>
            </div>

            {/* List of Courts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courtsList.map(court => {
                return (
                  <div key={court.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="relative h-40 bg-slate-950">
                        <img referrerPolicy="no-referrer" src={court.photo} alt={court.name} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 bg-slate-900/90 border border-slate-800 text-emerald-400 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                          {court.type}
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm text-slate-100">{court.name}</h4>
                          <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-black ${
                            court.status === 'aktif' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : court.status === 'maintenance' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {court.status === 'aktif' ? 'aktif' : court.status === 'maintenance' ? 'maintenance' : 'tutup'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">{court.description}</p>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <MapPin className="w-3.5 h-3.5" /> <span>{court.location}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {court.facilities.map((fac, i) => (
                            <span key={i} className="bg-slate-950 border border-slate-800 text-[9px] px-1.5 py-0.5 rounded text-slate-300">{fac}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-t border-slate-850/60 bg-slate-950/20 flex items-center justify-between">
                      <span className="text-emerald-400 font-extrabold text-sm">
                        Rp {court.pricePerHour.toLocaleString('id-ID')} <span className="text-[10px] text-slate-500">/ jam</span>
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleOpenCourtModal(court)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs cursor-pointer"
                        >
                          Suntik Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCourt(court.id)}
                          className="p-1.5 bg-rose-9550 border border-rose-800 text-rose-400 rounded text-xs cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* COURT FORM MODAL */}
            {showCourtModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
                  <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
                    <h3 className="font-sans font-bold text-sm text-white">
                      {editingCourtId ? 'Edit Lapangan Futsal' : 'Tambah Lapangan Baru'}
                    </h3>
                    <button onClick={() => setShowCourtModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
                  </div>
                  
                  <form onSubmit={handleSaveCourt} className="space-y-3.5 max-h-[80vh] overflow-y-auto pr-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Nama Lapangan</label>
                      <input
                        type="text"
                        value={courtFormName}
                        onChange={(e) => setCourtFormName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Deskripsi Lapangan</label>
                      <textarea
                        value={courtFormDescription}
                        onChange={(e) => setCourtFormDescription(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white outline-none resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Harga per Jam (Rp)</label>
                        <input
                          type="number"
                          value={courtFormPrice}
                          onChange={(e) => setCourtFormPrice(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Lokasi Area Hall</label>
                        <input
                          type="text"
                          value={courtFormLocation}
                          onChange={(e) => setCourtFormLocation(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Jenis Lapangan</label>
                        <select
                          value={courtFormType}
                          onChange={(e) => setCourtFormType(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white outline-none cursor-pointer"
                        >
                          <option value="Vinyl">Vinyl</option>
                          <option value="Rumput Sintetis">Rumput Sintetis</option>
                          <option value="Semen">Semen</option>
                          <option value="Interlock">Interlock</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Status Lapangan</label>
                        <select
                          value={courtFormStatus}
                          onChange={(e) => setCourtFormStatus(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white outline-none cursor-pointer"
                        >
                          <option value="aktif">Aktif / Disewakan</option>
                          <option value="maintenance">Dalam Pemeliharaan (Maintenance)</option>
                          <option value="nonaktif">Ditutup / Nonaktif</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">URL Photo Lapangan</label>
                      <input
                        type="text"
                        value={courtFormPhoto}
                        onChange={(e) => setCourtFormPhoto(e.target.value)}
                        placeholder="Contoh: https://unsplash.com/..."
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white outline-none"
                      />
                    </div>
                    
                    {/* Checkboxes Facilities */}
                    <div className="space-y-1.5 pt-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Fasilitas Tersedia</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {['Parkir', 'Mushola', 'Toilet', 'Kantin', 'Ruang Ganti', 'Wifi'].map(fName => (
                          <label key={fName} className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={courtFormFacilities.includes(fName)}
                              onChange={(e) => handleFacilityCheckbox(fName, e.target.checked)}
                              className="rounded border-slate-800 bg-slate-950 text-emerald-500 w-4 h-4 cursor-pointer"
                            />
                            {fName}
                          </label>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 font-bold rounded text-xs text-slate-950 transition-colors cursor-pointer"
                    >
                      Simpan Data Lapangan
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== SCREEN 4: KELOLA JADWAL & OPERASIONAL ==================== */}
        {activeMenu === 'jadwal' && opConfig && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings className="w-5.5 h-5.5 text-emerald-400" /> Konfigurasi Operasional Lapangan
              </h2>
              <p className="text-xs text-slate-400 mt-1">Sesuaikan ketentuan jam operasional, status hari libur bersama, maupun penutupan lapangan untuk reparasi.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Operasional Settings Form */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                <form onSubmit={handleSaveOperasionalSettings} className="space-y-5">
                  <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2">1. Jam Dan Hari Operasional</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Jam Mulai Buka</label>
                      <select
                        value={opStartHour}
                        onChange={(e) => setOpStartHour(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white cursor-pointer"
                      >
                        {[0, 2, 4, 6, 7, 8, 9, 10, 11, 12].map(h => (
                          <option key={h} value={h}>{String(h).padStart(2,'0')}:00 WIB</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Jam Tutup Arena</label>
                      <select
                        value={opEndHour}
                        onChange={(e) => setOpEndHour(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white cursor-pointer"
                      >
                        {[18, 20, 21, 22, 23, 24].map(h => (
                          <option key={h} value={h}>{String(h).padStart(2,'0')}:00 WIB</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Operasional Active Days */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Hari Buka Arena</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => (
                        <label key={day} className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                          <input
                            type="checkbox"
                            checked={opDaysOpen.includes(day)}
                            onChange={(e) => {
                              if (e.target.checked) setOpDaysOpen([...opDaysOpen, day]);
                              else setOpDaysOpen(opDaysOpen.filter(d => d !== day));
                            }}
                            className="rounded border-slate-850 bg-slate-950 text-emerald-500 w-4 h-4 cursor-pointer"
                          />
                          {day}
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded cursor-pointer transition-colors"
                  >
                    Simpan Jam & Hari Buka
                  </button>
                </form>
              </div>

              {/* Holidays and maintenance closures lists */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
                <div>
                  <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2">2. Tutup Operasional & Pemeliharaan</h3>
                  <p className="text-[11px] text-slate-500 mt-1">Mengunci lapangan agar tidak bisa dipesan pelanggan pada tanggal-tanggal tertentu.</p>
                </div>

                <div className="space-y-4">
                  {/* Holidays config block */}
                  <div className="space-y-1.5 p-3.5 bg-slate-950 border border-slate-850 rounded">
                    <span className="text-[11px] font-bold text-slate-300 block">A. Kalender Libur Bersama Arena (Holiday)</span>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={newHoliday}
                        onChange={(e) => setNewHoliday(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-xs rounded p-1 text-slate-100 cursor-pointer"
                      />
                      <button
                        onClick={handleAddHoliday}
                        type="button"
                        className="px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-extrabold rounded cursor-pointer"
                      >
                        Tambah
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {opConfig.holidays.map(h => (
                        <span key={h} className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-1 rounded text-red-400 font-medium flex items-center gap-1">
                          {h} <X className="w-3 h-3 hover:text-white cursor-pointer" onClick={() => handleRemoveHoliday(h)} />
                        </span>
                      ))}
                      {opConfig.holidays.length === 0 && <span className="text-[10px] text-slate-500 italic">Belum disetting libur.</span>}
                    </div>
                  </div>

                  {/* Maintenance block */}
                  <div className="space-y-1.5 p-3.5 bg-slate-950 border border-slate-850 rounded">
                    <span className="text-[11px] font-bold text-slate-300 block">B. Jadwal Maintenance Rutin Lapangan</span>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={newMaintenance}
                        onChange={(e) => setNewMaintenance(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-xs rounded p-1 text-slate-100 cursor-pointer"
                      />
                      <button
                        onClick={handleAddMaintenance}
                        type="button"
                        className="px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-extrabold rounded cursor-pointer"
                      >
                        Lock
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {opConfig.maintenanceDates.map(m => (
                        <span key={m} className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-1 rounded text-amber-500 font-medium flex items-center gap-1">
                          {m} <X className="w-3 h-3 hover:text-white cursor-pointer" onClick={() => handleRemoveMaintenance(m)} />
                        </span>
                      ))}
                      {opConfig.maintenanceDates.length === 0 && <span className="text-[10px] text-slate-500 italic">Belum ada jadwal penutupan teknis.</span>}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SCREEN 5: BOOKING MASUK ==================== */}
        {activeMenu === 'booking' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-5.5 h-5.5 text-emerald-400" /> Daftar Booking Arena Masuk
              </h2>
              <p className="text-xs text-slate-400 mt-1">Verifikasi persetujuan reservasi tim pelanggan, batalkan status jadwal sewa, atau cetak lembar nota.</p>
            </div>

            {/* Bookings entry table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="py-3.5 px-4">KODE BOOKING</th>
                      <th className="py-3.5 px-4">PELANGGAN</th>
                      <th className="py-3.5 px-4">LAPANGAN SEWA</th>
                      <th className="py-3.5 px-4">TANGGAL MAIN</th>
                      <th className="py-3.5 px-4">WAKTU (DURASI)</th>
                      <th className="py-3.5 px-4">HARGA SEWA</th>
                      <th className="py-3.5 px-4">STATUS</th>
                      <th className="py-3.5 px-4 text-center">TINDAKAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {bookingsList.map(b => {
                      return (
                        <tr key={b.id} className="hover:bg-slate-950/25">
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">{b.id}</td>
                          <td className="py-3 px-4 font-medium text-white">{b.userName}</td>
                          <td className="py-3 px-4 text-slate-300">{b.courtName}</td>
                          <td className="py-3 px-4">{b.date}</td>
                          <td className="py-3 px-4">
                            {String(b.startTime).padStart(2,'0')}:00 - {String(b.endTime).padStart(2,'0')}:00 ({b.duration} j)
                          </td>
                          <td className="py-3 px-4 text-white font-semibold">Rp {b.totalPrice.toLocaleString('id-ID')}</td>
                          <td className="py-3 px-4">{getBookingBadge(b.status)}</td>
                          <td className="py-3 px-4 text-center">
                            {b.status === 'Menunggu Pembayaran' || b.status === 'Menunggu Verifikasi' ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleUpdateBookingStatus(b.id, 'Dikonfirmasi')}
                                  className="p-1 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded text-[10px] cursor-pointer"
                                  title="Approve / Konfirmasi Lapangan"
                                >
                                  Terima
                                </button>
                                <button
                                  onClick={() => handleUpdateBookingStatus(b.id, 'Ditolak')}
                                  className="p-1 px-2.5 bg-rose-9550 border border-rose-800 text-rose-400 hover:bg-rose-950/20 rounded text-[10px] cursor-pointer"
                                  title="Tolak Reservasi"
                                >
                                  Tolak
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id, 'Dibatalkan')}
                                disabled={b.status === 'Dibatalkan' || b.status === 'Ditolak'}
                                className="p-1 px-2 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded text-[10px] cursor-pointer disabled:opacity-30"
                              >
                                Batal
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SCREEN 6: KELOLA PEMBAYARAN ==================== */}
        {activeMenu === 'pembayaran' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5.5 h-5.5 text-emerald-400" /> Verifikasi Pembayaran Customer
              </h2>
              <p className="text-xs text-slate-400 mt-1">Inspeksi transfer dana rekening masuk, periksa file lampiran kuitansi, dan setujui pelunasan otomatis.</p>
            </div>

            {/* List Table of Payments */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="py-3.5 px-4">KODE PAY</th>
                      <th className="py-3.5 px-4">KODE BOOKING</th>
                      <th className="py-3.5 px-4">LAPANGAN SEWA</th>
                      <th className="py-3.5 px-4">METODE BAYAR</th>
                      <th className="py-3.5 px-4">JUMLAH TRANSFER</th>
                      <th className="py-3.5 px-4">BUKTI STRUK</th>
                      <th className="py-3.5 px-4">STATUS PAY</th>
                      <th className="py-3.5 px-4 text-center">TINDAKAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {paymentsList.map(p => (
                      <tr key={p.id} className="hover:bg-slate-950/25">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">{p.id}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{p.bookingId}</td>
                        <td className="py-3 px-4 text-slate-200 font-medium">{p.courtName}</td>
                        <td className="py-3 px-4">{p.method}</td>
                        <td className="py-3 px-4 text-white font-semibold">Rp {p.amount.toLocaleString('id-ID')}</td>
                        <td className="py-3 px-4">
                          {p.proofImage ? (
                            <button
                              onClick={() => setViewProofImage(p.proofImage || null)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold rounded text-[10px] hover:shadow flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> Lihat Struk
                            </button>
                          ) : (
                            <span className="text-slate-605 italic">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-[10px]">
                          {p.status === 'Menunggu Verifikasi' && <span className="text-amber-500 block uppercase">Menunggu Validasi</span>}
                          {p.status === 'Diterima' && <span className="text-emerald-500 block uppercase font-black">✓ Diterima Lunas</span>}
                          {p.status === 'Ditolak' && <span className="text-red-500 block uppercase">❌ Ditolak</span>}
                          {p.status === 'Belum Bayar' && <span className="text-slate-500 block uppercase">Belum Bayar</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {p.status === 'Menunggu Verifikasi' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleVerifyPayment(p.id, 'TERIMA')}
                                className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded text-[10px] cursor-pointer"
                              >
                                Terima Lunas
                              </button>
                              <button
                                onClick={() => handleVerifyPayment(p.id, 'TOLAK')}
                                className="px-2 py-1 bg-rose-9550 border border-rose-800 text-rose-400 rounded text-[10px] cursor-pointer"
                              >
                                Tolak Struk
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-[10px]">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* LIGHTBOX STRUCT PROOF VIEWER MODAL */}
            {viewProofImage && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/90 backdrop-blur-sm p-4" onClick={() => setViewProofImage(null)}>
                <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
                  <div className="border-b border-slate-800 pb-2.5 mb-4 flex justify-between items-center text-sm font-bold">
                    <span>Lampiran Gambar Kuitansi Pelanggan</span>
                    <button className="text-slate-400 hover:text-white font-black cursor-pointer" onClick={() => setViewProofImage(null)}>X</button>
                  </div>
                  <img referrerPolicy="no-referrer" src={viewProofImage} alt="Bukti Transfer Lumpsum" className="max-h-96 mx-auto rounded border border-slate-850 object-contain w-full" />
                  <p className="text-[10px] text-slate-500 mt-4 leading-normal">
                    Lakukan verifikasi silang terhadap mutasi perbankan virtual merchant arena Anda sebelum memberikan konfirmasi lunas final.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== SCREEN 7: LAPORAN ==================== */}
        {activeMenu === 'laporan' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5.5 h-5.5 text-emerald-400" /> Rekap Laporan & Keuangan
                </h2>
                <p className="text-xs text-slate-400 mt-1">Audit rincian pemesanan, ketersediaan kas pendapatan fungsional mingguan/bulanan.</p>
              </div>

              {/* Download / Print mock buttons */}
              <button
                onClick={() => alert('Laporan siap dicetak! Berkas XLS/PDF telah disimulasikan ekspor ke dokumen lokal.')}
                className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Download className="w-4 h-4" /> Ekspor XLS/PDF
              </button>
            </div>

            {/* Filters range dates */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-5 shadow space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide block">Tanggal Mulai</span>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide block">Tanggal Akhir</span>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide block">Saringan Hasil</span>
                  <select
                    value={reportFilterType}
                    onChange={(e) => setReportFilterType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white cursor-pointer"
                  >
                    <option value="semua">Semua Transaksi Reservasi</option>
                    <option value="selesai">Hanya Selesai & Dikonfirmasi (Lunas)</option>
                    <option value="batal">Pemesanan Batal & Ditolak</option>
                  </select>
                </div>
              </div>

              {/* Laporan Summary total counts */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-850">
                <div className="p-3 bg-slate-950 border border-slate-850 rounded text-center">
                  <span className="text-[10px] text-slate-500 uppercase block">Total Unit Reservasi Terfilter</span>
                  <span className="text-xl font-bold text-white block mt-0.5">{reportsFilteredBookings.length} Kali booking</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-850 rounded text-center">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold text-emerald-500/80">Total Omset Pendapatan</span>
                  <span className="text-xl font-black text-emerald-400 block mt-0.5">Rp {reportsTotalRevenue.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Reports list records table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="py-3.5 px-4 animate-pulse">KODE BOOKING</th>
                      <th className="py-3.5 px-4">NAMA PELANGGAN</th>
                      <th className="py-3.5 px-4">LAPANGAN AREA</th>
                      <th className="py-3.5 px-4">TANGGAL RESERVASI</th>
                      <th className="py-3.5 px-4">WAKTU SEWA</th>
                      <th className="py-3.5 px-4">BIAYA MASUK</th>
                      <th className="py-3.5 px-4">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {reportsFilteredBookings.map(b => (
                      <tr key={b.id} className="hover:bg-slate-950/25">
                        <td className="py-3 px-4 font-mono text-emerald-400 font-bold">{b.id}</td>
                        <td className="py-3 px-4 text-white font-medium">{b.userName}</td>
                        <td className="py-3 px-4 text-slate-400">{b.courtName}</td>
                        <td className="py-3 px-4">{b.date}</td>
                        <td className="py-3 px-4">Pkl {String(b.startTime).padStart(2,'0')}:00 ({b.duration} j)</td>
                        <td className="py-3 px-4 text-white">Rp {b.totalPrice.toLocaleString('id-ID')}</td>
                        <td className="py-3 px-4">{getBookingBadge(b.status)}</td>
                      </tr>
                    ))}
                    {reportsFilteredBookings.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500 italic">Tidak ditemukan riwayat saringan laporan pada rentang tanggal tersebut.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SCREEN 8: PROFIL USAHA ==================== */}
        {activeMenu === 'profil' && businessProfile && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings className="w-5.5 h-5.5 text-emerald-400" /> Identitas Profil Arena Usaha & Pemilik
              </h2>
              <p className="text-xs text-slate-400 mt-1">Lakukan penyuntingan identitas alamat, nama usaha, telepon penanggung jawab, ganti kata sandi keamanan admin.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Profile business edit form */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 shadow-xl space-y-4">
                <form onSubmit={handleSaveUsaha} className="space-y-4">
                  <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2">Rincian Informasi Kontak Usaha</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Nama Arena Usaha</label>
                      <input
                        type="text"
                        value={usName}
                        onChange={(e) => setUsName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Kontak Person Penanggung Jawab</label>
                      <input
                        type="text"
                        value={usPhone}
                        onChange={(e) => setUsPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Nama Pemilik Usaha</label>
                    <input
                      type="text"
                      value={usOwner}
                      onChange={(e) => setUsOwner(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Alamat Lengkap Stadium Arena</label>
                    <textarea
                      value={usAddress}
                      onChange={(e) => setUsAddress(e.target.value)}
                      rows={2.5}
                      className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white outline-none resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded cursor-pointer transition-colors"
                  >
                    Simpan Perubahan Data Usaha
                  </button>
                </form>
              </div>

              {/* Admin Reset Password Column */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 shadow-xl">
                <form onSubmit={handleAdminChangePassword} className="space-y-4">
                  <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2 flex items-center gap-1.5">
                    <Key className="w-4.5 h-4.5 text-amber-500" /> Sandi Akun Administrator
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Kata Sandi Admin Saat Ini</label>
                    <input
                      type="password"
                      value={adminPassOld}
                      onChange={(e) => setAdminPassOld(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Kata Sandi Baru</label>
                    <input
                      type="password"
                      value={adminPassNew}
                      onChange={(e) => setAdminPassNew(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded cursor-pointer transition-colors"
                  >
                    Ubah Sandi Akun Administrator
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

      </main>

    </div>
  );
}
