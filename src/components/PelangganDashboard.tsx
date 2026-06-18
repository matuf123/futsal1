import React, { useState, useEffect } from 'react';
import { User, Lapangan, Booking, Pembayaran, BookingStatus, OperasionalConfig } from '../types';
import { db } from '../data';
import { 
  Home, Calendar, BookOpen, ShoppingBag, CreditCard, User as UserIcon, LogOut,
  Search, SlidersHorizontal, ToggleLeft, MapPin, BadgePercent, CheckCircle, Info,
  Users, Layers, Award, ShieldAlert, Sparkles, AlertCircle, Clock, ChevronRight,
  FileText, ArrowRight, Check, X, Camera, RefreshCw, Upload, Smartphone, Landmark
} from 'lucide-react';

interface PelangganDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function PelangganDashboard({ user, onLogout }: PelangganDashboardProps) {
  const [activeTab, setActiveTab] = useState<'beranda' | 'booking' | 'jadwal' | 'saya' | 'pembayaran' | 'profil'>('beranda');
  
  // Database State
  const [courts, setCourts] = useState<Lapangan[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Pembayaran[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [opConfig, setOpConfig] = useState<OperasionalConfig | null>(null);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMaxPrice, setFilterMaxPrice] = useState<number>(150000);
  const [filterFacility, setFilterFacility] = useState<string>('all');

  // Booking Form State
  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [bookingDate, setBookingDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [bookingStartHour, setBookingStartHour] = useState<number>(16); // default 16:00
  const [bookingDuration, setBookingDuration] = useState<number>(2); // default 2 hours
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // Schedule Tab Filter
  const [schedCourtId, setSchedCourtId] = useState('all');
  const [schedDate, setSchedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Active Payment Process
  const [paymentBookingId, setPaymentBookingId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('QRIS');
  const [uploadedProof, setUploadedProof] = useState<string>(''); // base64 / mock url
  const [paymentStatusMsg, setPaymentStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile Form
  const [profName, setProfName] = useState(currentUser.name);
  const [profPhone, setProfPhone] = useState(currentUser.phone);
  const [profAddress, setProfAddress] = useState(currentUser.address);
  const [profPhoto, setProfPhoto] = useState(currentUser.photo);
  const [profPassOld, setProfPassOld] = useState('');
  const [profPassNew, setProfPassNew] = useState('');
  const [profPassConfirm, setProfPassConfirm] = useState('');
  const [profStatus, setProfStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick Action booking handler
  const triggerQuickBooking = (courtId: string) => {
    setSelectedCourtId(courtId);
    setActiveTab('booking');
    setBookingError(null);
  };

  // Synchronize from DB on mount
  useEffect(() => {
    setCourts(db.getCourts().filter(c => c.status === 'aktif'));
    setBookings(db.getBookings());
    setPayments(db.getPayments());
    setOpConfig(db.getOperasional());
  }, []);

  const refreshLocalState = () => {
    setBookings(db.getBookings());
    setPayments(db.getPayments());
    setCourts(db.getCourts().filter(c => c.status === 'aktif'));
  };

  // Profile Edit Submission
  const handleEditProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfStatus(null);

    if (!profName || !profPhone || !profAddress) {
      setProfStatus({ type: 'error', text: 'Semua kolom profil wajib diisi.' });
      return;
    }

    const users = db.getUsers();
    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        const updated = { ...u, name: profName, phone: profPhone, address: profAddress, photo: profPhoto };
        // Sync local app state user
        setCurrentUser(updated);
        return updated;
      }
      return u;
    });

    db.saveUsers(updatedUsers);
    setProfStatus({ type: 'success', text: 'Profil Anda berhasil diperbarui.' });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setProfStatus(null);

    if (!profPassOld || !profPassNew || !profPassConfirm) {
      setProfStatus({ type: 'error', text: 'Semua kolom ubah kata sandi wajib diisi.' });
      return;
    }

    if (currentUser.passwordHash !== profPassOld) {
      setProfStatus({ type: 'error', text: 'Kata sandi lama Anda salah.' });
      return;
    }

    if (profPassNew.length < 6) {
      setProfStatus({ type: 'error', text: 'Kata sandi baru minimal harus 6 karakter.' });
      return;
    }

    if (profPassNew !== profPassConfirm) {
      setProfStatus({ type: 'error', text: 'Konfirmasi kata sandi baru tidak cocok.' });
      return;
    }

    const users = db.getUsers();
    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, passwordHash: profPassNew };
      }
      return u;
    });

    db.saveUsers(updatedUsers);
    
    // reset fields
    setProfPassOld('');
    setProfPassNew('');
    setProfPassConfirm('');
    setProfStatus({ type: 'success', text: 'Kata sandi Anda berhasil diubah.' });
  };

  // Booking Overlap Validation System
  // Checks if requested range [startHour, startHour + duration] overlaps with pre-existing booking on the same court and date
  const checkBookingConflict = (courtId: string, date: string, start: number, duration: number): { conflict: boolean; conflictingBooking?: Booking } => {
    const end = start + duration;
    const allBookings = db.getBookings();
    
    const conflict = allBookings.find(b => {
      if (b.courtId === courtId && b.date === date && b.status !== 'Dibatalkan' && b.status !== 'Ditolak') {
        // b.startTime to b.endTime
        const bStart = b.startTime;
        const bEnd = b.startTime + b.duration;
        // overlap occurs if (start < bEnd && end > bStart)
        if (start < bEnd && end > bStart) {
          return true;
        }
      }
      return false;
    });

    return {
      conflict: !!conflict,
      conflictingBooking: conflict
    };
  };

  // Auto set first available court if none selected
  useEffect(() => {
    if (courts.length > 0 && !selectedCourtId) {
      setSelectedCourtId(courts[0].id);
    }
  }, [courts]);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    setBookingSuccess(null);

    const court = courts.find(c => c.id === selectedCourtId);
    if (!court) {
      setBookingError('Silakan pilih salah satu lapangan.');
      return;
    }

    if (!bookingDate) {
      setBookingError('Silakan pilih tanggal main.');
      return;
    }

    // validate date isn't past date
    const selectedDateObj = new Date(bookingDate);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayObj = new Date(todayStr);
    
    if (selectedDateObj < todayObj) {
      setBookingError('Tanggal booking futsal tidak boleh tanggal masa lalu.');
      return;
    }

    // validate open days
    const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const weekdayName = daysIndo[selectedDateObj.getDay()];
    if (opConfig && !opConfig.daysOpen.includes(weekdayName)) {
      setBookingError(`Maaf, arena kami tutup pada hari ${weekdayName} sesuai pengaturan operasional.`);
      return;
    }

    // check holiday
    if (opConfig && opConfig.holidays.includes(bookingDate)) {
      setBookingError('Maaf, tanggal tersebut telah ditetapkan sebagai Hari Libur Operasional Arena.');
      return;
    }

    // check maintenance
    if (opConfig && opConfig.maintenanceDates.includes(bookingDate)) {
      setBookingError('Maaf, lapangan sedang ditutup untuk pemeliharaan teknis rutin (Maintenance) pada tanggal pilihan.');
      return;
    }

    // check operational bounds
    const endHour = bookingStartHour + bookingDuration;
    if (opConfig) {
      if (bookingStartHour < opConfig.startHour || endHour > opConfig.endHour) {
        setBookingError(`Arena futsal hanya buka pukul ${String(opConfig.startHour).padStart(2, '0')}:00 s/d ${String(opConfig.endHour).padStart(2, '0')}:00 WIB.`);
        return;
      }
    }

    // Check overlaps
    const conflictResult = checkBookingConflict(selectedCourtId, bookingDate, bookingStartHour, bookingDuration);
    if (conflictResult.conflict) {
      const conf = conflictResult.conflictingBooking!;
      setBookingError(`Bentrok Jadwal! Lapangan ini telah dipesan pada pukul ${String(conf.startTime).padStart(2, '0')}:00 s/d ${String(conf.startTime + conf.duration).padStart(2, '0')}:00 oleh pengguna lain/grup lain.`);
      return;
    }

    // All checks pass - Create New Booking
    const calculatedPrice = court.pricePerHour * bookingDuration;
    const newBookingId = 'BKG-' + Math.floor(1000 + Math.random() * 9000);

    const newBooking: Booking = {
      id: newBookingId,
      courtId: court.id,
      courtName: court.name,
      userId: currentUser.id,
      userName: currentUser.name,
      date: bookingDate,
      startTime: bookingStartHour,
      duration: bookingDuration,
      endTime: endHour,
      totalPrice: calculatedPrice,
      status: 'Menunggu Pembayaran',
      createdAt: new Date().toISOString()
    };

    const currentBookings = db.getBookings();
    db.saveBookings([newBooking, ...currentBookings]);

    // Populate auto billing page
    setPaymentBookingId(newBookingId);
    setBookingSuccess(`Booking Lapangan Berhasil Dibuat! Silakan lakukan pelunasan di menu pembayaran.`);
    refreshLocalState();
    
    // Redirect after brief delay
    setTimeout(() => {
      setActiveTab('pembayaran');
      setBookingSuccess(null);
    }, 1500);
  };

  // Calculate specific price
  const courtSelectedInfo = courts.find(c => c.id === selectedCourtId);
  const calculatedTotalPrice = courtSelectedInfo ? courtSelectedInfo.pricePerHour * bookingDuration : 0;

  // Cancel Booking handler (only allowed for 'Menunggu Pembayaran' or 'Menunggu Verifikasi')
  const handleCancelBooking = (bookingId: string) => {
    if (confirm('Apakah Anda yakin ingin membatalkan jadwal booking futsal ini?')) {
      const allBookings = db.getBookings();
      const updated = allBookings.map(b => {
        if (b.id === bookingId && b.userId === currentUser.id) {
          return { ...b, status: 'Dibatalkan' as BookingStatus };
        }
        return b;
      });
      db.saveBookings(updated);

      // also cancel payment status
      const allPayments = db.getPayments();
      const payUpdated = allPayments.map(p => {
        if (p.bookingId === bookingId) {
          return { ...p, status: 'Ditolak' as const };
        }
        return p;
      });
      db.savePayments(payUpdated);

      refreshLocalState();
    }
  };

  // Pembayaran (Payment Process code)
  const myPendingBookings = bookings.filter(b => b.userId === currentUser.id && b.status === 'Menunggu Pembayaran');
  
  // Set default pending booking ID if available
  useEffect(() => {
    if (myPendingBookings.length > 0 && !paymentBookingId) {
      setPaymentBookingId(myPendingBookings[0].id);
    }
  }, [myPendingBookings, paymentBookingId]);

  const activePayBooking = bookings.find(b => b.id === paymentBookingId && b.userId === currentUser.id);

  const handleUploadPaymentProof = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStatusMsg(null);

    if (!paymentBookingId) {
      setPaymentStatusMsg({ type: 'error', text: 'Silakan pilih kode booking terlebih dahulu.' });
      return;
    }

    if (!uploadedProof) {
      setPaymentStatusMsg({ type: 'error', text: 'Harap lampirkan foto/gambar bukti transfer atau bayar Anda.' });
      return;
    }

    // 1. Update Booking status to "Menunggu Verifikasi"
    const allB = db.getBookings();
    const updatedB = allB.map(b => {
      if (b.id === paymentBookingId) {
        return { ...b, status: 'Menunggu Verifikasi' as BookingStatus };
      }
      return b;
    });
    db.saveBookings(updatedB);

    // 2. Add or Update Payment Entry
    const allPayments = db.getPayments();
    const existingIndex = allPayments.findIndex(p => p.bookingId === paymentBookingId);

    const targetBooking = allB.find(b => b.id === paymentBookingId)!;

    const newPayment: Pembayaran = {
      id: 'PAY-' + Math.floor(1000 + Math.random() * 9000),
      bookingId: paymentBookingId,
      courtName: targetBooking.courtName,
      playDate: targetBooking.date,
      amount: targetBooking.totalPrice,
      method: paymentMethod,
      proofImage: uploadedProof,
      status: 'Menunggu Verifikasi',
      createdAt: new Date().toISOString()
    };

    if (existingIndex > -1) {
      allPayments[existingIndex] = newPayment;
    } else {
      allPayments.unshift(newPayment);
    }
    
    db.savePayments(allPayments);
    setPaymentStatusMsg({ type: 'success', text: 'Konfirmasi bukti pembayaran telah terkirim! Admin akan memverifikasi dalam waktu singkat.' });
    setUploadedProof('');
    
    refreshLocalState();

    setTimeout(() => {
      setActiveTab('saya');
      setPaymentStatusMsg(null);
    }, 2000);
  };

  // Helper payment instruction details based on chosen channels
  const getPaymentDetails = (method: string, price: number) => {
    switch (method) {
      case 'QRIS':
        return {
          label: 'Scan QRIS Dinamis Terintegrasi',
          account: 'CHAMPION_FUTSAL_QRIS_GOPAY',
          image: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(`CHAMPION-FUTSAL-IDR-${price}`),
          note: 'Pindai kode QR di atas menggunakan aplikasi e-wallet apa saja (GoPay, OVO, DANA, LinkAja, ShopeePay).'
        };
      case 'Transfer Bank BCA':
        return {
          label: 'rekening transfer bank bca',
          account: '802-1928-301 a.n Champion Arena',
          note: 'Silakan transfer tepat sampai 3 digit terakhir untuk kemudahan validasi visual otomatis.'
        };
      case 'Transfer Bank Mandiri':
        return {
          label: 'rekening transfer bank mandiri',
          account: '137-0023-455-89 a.n Champion Arena',
          note: 'Gunakan mobile banking atau ATM Mandiri terdekat.'
        };
      case 'Transfer Bank BRI':
        return {
          label: 'rekening transfer bank bri',
          account: '0021-01-02931-50-2 a.n Champion Arena Business',
          note: 'Sertakan nomor booking pada berita acara transfer bank.'
        };
      case 'Transfer Bank BNI':
        return {
          label: 'rekening transfer bank bni',
          account: '081-324-5512 a.n Champion Arena',
          note: 'Transfer menggunakan BNI Virtual Account atau Transfer manual.'
        };
      default: // OVO, GoPay, DANA, ShopeePay
        return {
          label: `E-Wallet: ${method}`,
          account: `0812-3456-7890 a.n Champion Futsal`,
          note: `Buka aplikasi ${method} Anda, kirim ke nomor HP merchant di atas.`
        };
    }
  };

  // Mock File Upload Utility conversion to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedProof(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filtered court view
  const filteredCourts = courts.filter(court => {
    const matchSearch = court.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        court.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === 'all' || court.type === filterType;
    const matchPrice = court.pricePerHour <= filterMaxPrice;
    const matchFacility = filterFacility === 'all' || court.facilities.includes(filterFacility as any);
    
    return matchSearch && matchType && matchPrice && matchFacility;
  });

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'Menunggu Pembayaran':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">Menunggu Pembayaran</span>;
      case 'Menunggu Verifikasi':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">Menunggu Verifikasi</span>;
      case 'Dikonfirmasi':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Dikonfirmasi</span>;
      case 'Ditolak':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/10 text-red-500 border border-red-500/20">Ditolak</span>;
      case 'Selesai':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-300 border border-slate-700">Selesai</span>;
      case 'Dibatalkan':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">Dibatalkan</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      {/* Ambient Background Glows */}
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-emerald-500/10 blur-[130px] rounded-full animate-glow-1 z-0"></div>
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-blue-600/10 blur-[130px] rounded-full animate-glow-2 z-0"></div>
      
      {/* PROFESSIONAL FIXED NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#020617]/85 border-b border-slate-800/50 backdrop-blur-xl px-4 py-3 md:px-8 flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white block font-display">CHAMPION<span className="text-emerald-400">FUTSAL</span></span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider block -mt-1 uppercase">Pelanggan Area</span>
          </div>
        </div>

        {/* Desktop tab buttons */}
        <div className="hidden lg:flex items-center gap-1.5">
          <button 
            onClick={() => setActiveTab('beranda')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === 'beranda' ? 'bg-emerald-500/10 text-emerald-400 shadow-sm border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'}`}
          >
            Beranda
          </button>
          <button 
            onClick={() => setActiveTab('booking')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === 'booking' ? 'bg-emerald-500/10 text-emerald-400 shadow-sm border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'}`}
          >
            Booking Lapangan
          </button>
          <button 
            onClick={() => setActiveTab('jadwal')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === 'jadwal' ? 'bg-emerald-500/10 text-emerald-400 shadow-sm border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'}`}
          >
            Jadwal Kalender
          </button>
          <button 
            onClick={() => setActiveTab('saya')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === 'saya' ? 'bg-emerald-500/10 text-emerald-400 shadow-sm border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'}`}
          >
            Booking Saya
          </button>
          <button 
            onClick={() => setActiveTab('pembayaran')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer relative ${activeTab === 'pembayaran' ? 'bg-emerald-500/10 text-emerald-400 shadow-sm border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'}`}
          >
            Pembayaran
            {myPendingBookings.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                {myPendingBookings.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('profil')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === 'profil' ? 'bg-emerald-500/10 text-emerald-400 shadow-sm border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'}`}
          >
            Profil
          </button>
        </div>

        {/* Logout and avatar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img 
              referrerPolicy="no-referrer"
              src={currentUser.photo} 
              alt={currentUser.name} 
              className="w-8 h-8 rounded-full object-cover border border-slate-700" 
            />
            <div className="hidden md:block text-left text-xs">
              <span className="font-semibold block text-slate-200">{currentUser.name}</span>
              <span className="text-slate-400 block text-[10px]">{currentUser.email}</span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            title="Keluar Akun"
            className="p-2 text-slate-400 hover:text-rose-400 rounded-lg bg-slate-800/50 hover:bg-rose-950/20 border border-slate-800/80 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* DETAILED CONTENT CONTAINER */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 pb-24">
        
        {/* ==================== MENU 1: BERANDA ==================== */}
        {activeTab === 'beranda' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Promo Banner Card */}
            <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-br from-emerald-950/80 via-slate-950 to-blue-950/80 p-6 md:p-10 shadow-2xl border border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="absolute right-0 top-0 bottom-0 left-0 bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none"></div>
              <div className="space-y-4 max-w-xl text-center md:text-left relative z-10">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase bg-gradient-to-r from-emerald-400 to-blue-500 text-slate-950 inline-block font-mono">PROMO SENSASIONAL JUNI 2026</span>
                <h2 className="text-2xl md:text-4xl font-extrabold font-display leading-tight text-white tracking-tight">Main Malam Lebih Murah! Diskon s/d 15K</h2>
                <p className="text-sm text-slate-300 font-sans leading-relaxed">
                  Nikmati pengalaman seru bermain di Lapangan Wembley Vinyl Premium maupun San Siro Sintetis setiap hari Senin - Kamis malam di atas pukul 20:00 WIB. Diskon otomatis saat checkout!
                </p>
                <div className="pt-2">
                  <button 
                    onClick={() => setActiveTab('booking')}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-2xl text-sm transition-all duration-150 flex items-center gap-2 mx-auto md:mx-0 cursor-pointer shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Pesan Lapangan Sekarang <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="hidden md:flex w-48 h-48 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-full border border-slate-800 flex items-center justify-center p-4 relative z-10 backdrop-blur-md">
                <div className="w-36 h-36 bg-slate-950/90 border border-slate-800/80 rounded-full flex flex-col items-center justify-center shadow-2xl relative">
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400 font-display">12%</span>
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold font-mono">Kupon Cashback</span>
                </div>
              </div>
            </div>

            {/* STATISTICS AND INFO BADGES */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-950/40 backdrop-blur-md border border-slate-800/50 rounded-2xl p-4 flex items-center gap-3 transition-colors hover:border-slate-800">
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block font-mono">Teman Main</span>
                  <span className="text-base font-bold text-white block font-display">100+ Member</span>
                </div>
              </div>
              <div className="bg-slate-950/40 backdrop-blur-md border border-slate-800/50 rounded-2xl p-4 flex items-center gap-3 transition-colors hover:border-slate-800">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block font-mono">Tersertifikasi</span>
                  <span className="text-base font-bold text-white block font-display">Standard FIFA</span>
                </div>
              </div>
              <div className="bg-slate-950/40 backdrop-blur-md border border-slate-800/50 rounded-2xl p-4 flex items-center gap-3 transition-colors hover:border-slate-800">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block font-mono">Buka Setiap Hari</span>
                  <span className="text-base font-bold text-white block font-display">08:00 - 23:00</span>
                </div>
              </div>
              <div className="bg-slate-950/40 backdrop-blur-md border border-slate-800/50 rounded-2xl p-4 flex items-center gap-3 transition-colors hover:border-slate-800">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block font-mono">Fasilitas Area</span>
                  <span className="text-base font-bold text-white block font-display">Sangat Lengkap</span>
                </div>
              </div>
            </div>

            {/* POPULAR COURTS GRID */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" /> Lapangan Terpopuler & Pilihan Utama
                </h3>
                <button onClick={() => setActiveTab('booking')} className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer">
                  Lihat Semua Lapangan <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courts.slice(0, 3).map((court) => (
                  <div key={court.id} className="bg-slate-900 border border-slate-800/80 rounded-xl overflow-hidden shadow-lg group hover:border-slate-700/80 transition-all flex flex-col">
                    <div className="relative h-48 bg-slate-950 overflow-hidden">
                      <img 
                        referrerPolicy="no-referrer"
                        src={court.photo} 
                        alt={court.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3 bg-slate-900/90 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-bold border border-slate-800">
                        {court.type}
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h4 className="font-bold text-base text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-1">{court.name}</h4>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" /> 
                          <span>{court.location}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2">{court.description}</p>
                        
                        {/* Facilities tags */}
                        <div className="flex flex-wrap gap-1 mt-3">
                          {court.facilities.map((fac, i) => (
                            <span key={i} className="text-[10px] bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800/80">{fac}</span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-bold leading-none">Harga Sewa</span>
                          <span className="text-emerald-400 font-extrabold text-base block mt-0.5">
                            Rp {court.pricePerHour.toLocaleString('id-ID')} <span className="text-[11px] font-normal text-slate-400">/ jam</span>
                          </span>
                        </div>
                        <button 
                          onClick={() => triggerQuickBooking(court.id)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 font-bold rounded-lg text-xs text-slate-950 transition-colors cursor-pointer"
                        >
                          Booking Cepat
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== MENU 2: BOOKING LAPANGAN ==================== */}
        {activeTab === 'booking' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-left space-y-1">
              <h2 className="text-xl font-bold font-sans text-white">Booking Lapangan Anda Online</h2>
              <p className="text-sm text-slate-400">Cari, sesuaikan jadwal, cegah bentrok jadwal sisa slot, dapatkan nota resmi otomatis.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* LEFT COLUMN: FILTERS & COURTS LIST */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Search & Filter Component */}
                <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-4 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari lapangan wembley, sintetis, dll..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-0 rounded-lg p-2.5 pl-10 text-sm outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1 text-xs">
                      <span className="text-slate-400 block font-semibold mb-1">Jenis Lapangan</span>
                      <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2 text-xs outline-none"
                      >
                        <option value="all">Semua Jenis Lapangan</option>
                        <option value="Vinyl">Vinyl Premium</option>
                        <option value="Rumput Sintetis">Rumput Sintetis</option>
                        <option value="Interlock">Interlock</option>
                        <option value="Semen">Semen Beton</option>
                      </select>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="text-slate-400 block font-semibold mb-1">Fasilitas Utama</span>
                      <select 
                        value={filterFacility} 
                        onChange={(e) => setFilterFacility(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2 text-xs outline-none"
                      >
                        <option value="all">Semua Fasilitas</option>
                        <option value="Kantin">Kantin</option>
                        <option value="Wifi">Free Wifi</option>
                        <option value="Ruang Ganti">Ruang Ganti</option>
                        <option value="Mushola">Mushola</option>
                      </select>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="text-slate-400 block font-semibold mb-1">Harga Maksimum</span>
                      <select 
                        value={filterMaxPrice}
                        onChange={(e) => setFilterMaxPrice(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2 text-xs outline-none"
                      >
                        <option value={150000}>Rp 150.000 / jam</option>
                        <option value={115000}>Rp 115.000 / jam</option>
                        <option value={90000}>Rp 90.000 / jam</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Displaying Courts */}
                {filteredCourts.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl">
                    <SlidersHorizontal className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-400">Tidak ada lapangan futsal aktif yang sesuai kriteria pencarian Anda.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCourts.map(court => (
                      <div 
                        key={court.id} 
                        onClick={() => setSelectedCourtId(court.id)}
                        className={`bg-slate-900 border overflow-hidden p-3 rounded-xl shadow-sm transition-all duration-150 cursor-pointer flex flex-col md:flex-row gap-4 hover:border-slate-700/80 relative select-none ${
                          selectedCourtId === court.id ? 'border-emerald-500 bg-emerald-950/5 ring-1 ring-emerald-500/20' : 'border-slate-800/80'
                        }`}
                      >
                        {selectedCourtId === court.id && (
                          <div className="absolute top-2 right-2 bg-emerald-500 text-slate-950 rounded-full p-1 shadow-md z-10 animate-bounce">
                            <Check className="w-3.5 h-3.5 stroke-[4]" />
                          </div>
                        )}
                        <img 
                          referrerPolicy="no-referrer"
                          src={court.photo} 
                          alt={court.name} 
                          className="w-full md:w-36 h-28 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <span className="text-[10px] md:text-[11px] font-bold tracking-wider uppercase text-emerald-400 block">{court.type}</span>
                            <h4 className="font-bold text-sm text-white mt-0.5">{court.name}</h4>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{court.description}</p>
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex flex-wrap gap-1">
                              {court.facilities.slice(0, 3).map((f, i) => (
                                <span key={i} className="text-[9px] bg-slate-950 text-slate-300 px-1.5 py-0.5 rounded border border-slate-800/60">{f}</span>
                              ))}
                            </div>
                            <span className="text-xs font-bold text-emerald-400 block whitespace-nowrap bg-slate-950 border border-slate-800/80 px-2 py-1 rounded">
                              Rp {court.pricePerHour.toLocaleString('id-ID')} / j
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: BOOKING FORM */}
              <div className="lg:col-span-5">
                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 md:p-6 shadow-xl space-y-6 sticky top-24">
                  <div className="border-b border-slate-800/60 pb-3">
                    <h3 className="font-bold text-base text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-emerald-400" /> Formulir Jadwal Main
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Konfirmasi jadwal dan detail tagihan akan muncul secara real-time.</p>
                  </div>

                  {bookingError && (
                    <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs rounded-lg flex gap-2 items-start animate-shake">
                      <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>{bookingError}</div>
                    </div>
                  )}

                  {bookingSuccess && (
                    <div className="p-3.5 bg-emerald-950/40 border border-emerald-850/60 text-emerald-300 text-xs rounded-lg flex gap-2 items-start">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>{bookingSuccess}</div>
                    </div>
                  )}

                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    
                    {/* Active Court Info */}
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                      <span className="text-[9px] text-slate-500 uppercase font-black block tracking-wider">LAPANGAN PILIHAN</span>
                      <span className="font-bold text-xs text-slate-200 mt-0.5 block">{courtSelectedInfo ? courtSelectedInfo.name : 'Belum memilih lapangan'}</span>
                      <span className="text-xs font-semibold text-emerald-400 block mt-0.5">Rp {courtSelectedInfo ? courtSelectedInfo.pricePerHour.toLocaleString('id-ID') : '0'} / jam</span>
                    </div>

                    {/* Date Picker */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 block">Bagian Tanggal Main Futsal</label>
                      <input
                        type="date"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2.5 text-sm outline-none text-white cursor-pointer"
                      />
                    </div>

                    {/* Start Hour and Duration */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 block">Pukul Jam Mulai</label>
                        <select
                          value={bookingStartHour}
                          onChange={(e) => setBookingStartHour(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2.5 text-sm outline-none text-slate-100 cursor-pointer"
                        >
                          {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map((hour) => (
                            <option key={hour} value={hour}>
                              {String(hour).padStart(2, '0')}:00 WIB
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 block">Durasi Main</label>
                        <select
                          value={bookingDuration}
                          onChange={(e) => setBookingDuration(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2.5 text-sm outline-none text-slate-100 cursor-pointer"
                        >
                          {[1, 2, 3, 4].map((h) => (
                            <option key={h} value={h}>{h} Jam</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Real-time slot preview helper to show unavailable slots for chosen date & court */}
                    <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold block">Status Slot Terkunci Tanggal ({bookingDate}):</span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[8, 10, 12, 14, 16, 18, 20, 22].map(hour => {
                          // check conflict
                          const isBooked = bookings.some(b => 
                            b.courtId === selectedCourtId && 
                            b.date === bookingDate && 
                            b.status !== 'Dibatalkan' && 
                            b.status !== 'Ditolak' && 
                            (hour >= b.startTime && hour < b.startTime + b.duration)
                          );
                          return (
                            <span 
                              key={hour}
                              className={`text-[9px] px-2 py-1 rounded inline-block font-semibold ${
                                isBooked 
                                  ? 'bg-rose-9550 border border-rose-800/40 text-rose-400 font-bold' 
                                  : 'bg-emerald-950/20 border border-emerald-800/30 text-emerald-400'
                              }`}
                            >
                              {String(hour).padStart(2, '0')}:00 {isBooked ? '🚫 Penuh' : '👍 Tersedia'}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Order Summary Receipt Box */}
                    <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-lg space-y-2.5">
                      <span className="text-[10px] text-slate-400 uppercase font-black block tracking-wider">RINGKASAN PESANAN</span>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Layanan Biaya Lapangan</span>
                        <span>
                          {bookingDuration} jam x Rp {courtSelectedInfo ? courtSelectedInfo.pricePerHour.toLocaleString('id-ID') : '0'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Pajak & Administrasi Web</span>
                        <span className="text-emerald-400 font-medium">Free Admin</span>
                      </div>
                      <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-white">
                        <span>Total Bayar</span>
                        <span className="text-emerald-400 font-extrabold">
                          Rp {calculatedTotalPrice.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!selectedCourtId}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-sm transition-all duration-150 shadow-lg shadow-emerald-500/15 cursor-pointer"
                    >
                      Konfirmasi & Simpan Booking
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MENU 3: JADWAL LAPANGAN (KALENDER) ==================== */}
        {activeTab === 'jadwal' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-left">
                <h2 className="text-xl font-bold font-sans text-white">Kalender Booking Lapangan Futsal</h2>
                <p className="text-sm text-slate-400">Peta jadwal penggunaan seluruh lapangan arena untuk menghindari tabrakan jam main.</p>
              </div>

              {/* Quick Date and Court selectors */}
              <div className="flex items-center gap-3 bg-slate-900 p-2.5 border border-slate-800 rounded-lg flex-wrap">
                <div className="text-xs space-y-1">
                  <span className="text-slate-400 block font-semibold">Lapangan</span>
                  <select
                    value={schedCourtId}
                    onChange={(e) => setSchedCourtId(e.target.value)}
                    className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded p-1.5 text-xs text-white"
                  >
                    <option value="all">Semua Lapangan</option>
                    {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="text-xs space-y-1">
                  <span className="text-slate-400 block font-semibold">Tentukan Tanggal</span>
                  <input
                    type="date"
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded p-1 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Calendar View Box layout */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-sm">
                <span className="font-bold text-slate-200">Daftar Slot Tanggal Main: <span className="text-emerald-400">{schedDate}</span></span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-3 h-3 bg-emerald-500 rounded shadow"></span> Tersedia
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-3 h-3 bg-rose-500 rounded shadow"></span> Penuh/Sewa
                  </span>
                </div>
              </div>

              {/* Loop Courts calendar rows */}
              <div className="space-y-6">
                {courts.filter(c => schedCourtId === 'all' || c.id === schedCourtId).map(court => {
                  return (
                    <div key={court.id} className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-200 block">{court.name}</span>
                        <span className="text-xs bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded">{court.type}</span>
                      </div>

                      {/* Display Hours Slot Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map(hour => {
                          // check booking conflict
                          const activeBook = bookings.find(b => 
                            b.courtId === court.id && 
                            b.date === schedDate && 
                            b.status !== 'Dibatalkan' && 
                            b.status !== 'Ditolak' && 
                            (hour >= b.startTime && hour < b.startTime + b.duration)
                          );

                          return (
                            <div 
                              key={hour}
                              className={`p-2.5 rounded-lg border text-center transition-all ${
                                activeBook 
                                  ? 'bg-rose-950/20 border-rose-800/80 text-rose-300' 
                                  : 'bg-emerald-950/5 border-slate-800/80 hover:border-emerald-500/50 text-emerald-400 hover:shadow'
                              }`}
                            >
                              <span className="font-extrabold text-xs block">{String(hour).padStart(2, '0')}:00</span>
                              <span className="text-[9px] block uppercase tracking-wider font-semibold mt-1">
                                {activeBook ? (
                                  <span className="text-rose-400 font-extrabold">SEWA</span>
                                ) : (
                                  <span className="text-emerald-500">KOSONG</span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== MENU 4: BOOKING SAYA ==================== */}
        {activeTab === 'saya' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-left space-y-1">
              <h2 className="text-xl font-bold font-sans text-white">Daftar Booking Saya</h2>
              <p className="text-sm text-slate-400">Riwayat reservasi lapangan futsal secara temporal, cek verifikasi bayar, lampiran bukti transaksi.</p>
            </div>

            {bookings.filter(b => b.userId === currentUser.id).length === 0 ? (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400 font-medium">Anda belum pernah melakukan booking lapangan futsal.</p>
                <button 
                  onClick={() => setActiveTab('booking')}
                  className="px-4 py-2 bg-emerald-500 font-semibold text-slate-950 rounded-lg text-xs hover:bg-emerald-600 cursor-pointer"
                >
                  Pesan Lapangan Sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.filter(b => b.userId === currentUser.id).map(b => {
                  return (
                    <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-950 border border-slate-800 px-3 py-1 rounded">
                            {b.id}
                          </span>
                          <span className="text-[11px] text-slate-500">Pemesanan: {new Date(b.createdAt).toLocaleDateString('id-ID')}</span>
                        </div>
                        {getStatusBadge(b.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs md:text-sm">
                        <div>
                          <span className="text-slate-500 block uppercase text-[10px] font-bold">Nama Lapangan Arena</span>
                          <span className="font-bold text-slate-200 block mt-0.5">{b.courtName}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase text-[10px] font-bold">Tanggal Jadwal Main</span>
                          <span className="font-medium text-slate-200 block mt-0.5">
                            {new Date(b.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase text-[10px] font-bold">Waktu Mulai & Durasi</span>
                          <span className="font-semibold text-slate-200 block mt-0.5">
                            {String(b.startTime).padStart(2, '0')}:00 s/d {String(b.endTime).padStart(2, '0')}:00 WIB ({b.duration} Jam)
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase text-[10px] font-bold">Jumlah Tagihan</span>
                          <span className="font-extrabold text-emerald-400 block mt-0.5">Rp {b.totalPrice.toLocaleString('id-ID')}</span>
                        </div>
                      </div>

                      {/* Action controllers */}
                      <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2 justify-end">
                        {b.status === 'Menunggu Pembayaran' && (
                          <>
                            <button
                              onClick={() => handleCancelBooking(b.id)}
                              className="px-3 py-1.5 bg-rose-950/20 text-rose-400 hover:bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Batalkan Pesanan
                            </button>
                            <button
                              onClick={() => {
                                setPaymentBookingId(b.id);
                                setPaymentMethod('QRIS');
                                setUploadedProof('');
                                setActiveTab('pembayaran');
                              }}
                              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-sm"
                            >
                              Bayar Sekarang
                            </button>
                          </>
                        )}
                        {b.status === 'Menunggu Verifikasi' && (
                          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-blue-400" />
                            Bukti pembayaran sedang dalam proses verifikasi pihak admin kami.
                          </div>
                        )}
                        {b.status === 'Dikonfirmasi' && (
                          <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                            <Check className="w-4 h-4 stroke-[3]" />
                            Selamat bertanding! Silakan tunjukkan Kode Booking di atas saat tiba di arena.
                          </div>
                        )}
                        {b.status === 'Selesai' && (
                          <div className="text-xs text-slate-500 font-medium">
                            Pertandingan telah selesai dilaksanakan. Terima kasih atas kunjungan Anda!
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== MENU 5: PEMBAYARAN ONLINE ==================== */}
        {activeTab === 'pembayaran' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-left space-y-1">
              <h2 className="text-xl font-bold font-sans text-white">Menu Pembayaran & Konfirmasi Transfer</h2>
              <p className="text-sm text-slate-400">Selesaikan pembayaran tagihan futsal Anda secara instan menggunakan QRIS, E-Wallet, atau virtual rekening bank.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Select Payment Area */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 shadow-xl space-y-6">
                  
                  {paymentStatusMsg && (
                    <div className={`p-4 rounded-lg flex items-start gap-2.5 text-xs border ${
                      paymentStatusMsg.type === 'success' 
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80' 
                        : 'bg-rose-9550 border border-rose-800 text-rose-300'
                    }`}>
                      {paymentStatusMsg.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                      <div>{paymentStatusMsg.text}</div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-2">1. Pilih Booking & Metode</h3>
                    
                    {/* Choose Pending Booking */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-semibold">Pilih Kode Booking</label>
                      {myPendingBookings.length === 0 ? (
                        <div className="p-3 bg-slate-950 text-slate-500 border border-slate-800 rounded-lg text-xs">
                          Tidak ditemukan tagihan booking main futsal yang tertunda pembayarannya saat ini.
                        </div>
                      ) : (
                        <select
                          value={paymentBookingId}
                          onChange={(e) => setPaymentBookingId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2.5 text-xs outline-none text-white cursor-pointer"
                        >
                          {myPendingBookings.map(b => (
                            <option key={b.id} value={b.id}>
                              {b.id} - {b.courtName} ({b.date} pkl {String(b.startTime).padStart(2,'0')}:00 WIB) - Rp {b.totalPrice.toLocaleString('id-ID')}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Choose Payment Method */}
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-semibold">Pilih Saluran / Metode Pembayaran</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {[
                          { id: 'QRIS', type: 'wallet', label: 'QRIS Gopay/OVO' },
                          { id: 'DANA', type: 'wallet', label: 'DANA Wallet' },
                          { id: 'GoPay', type: 'wallet', label: 'GoPay Transfer' },
                          { id: 'OVO', type: 'wallet', label: 'OVO Cash' },
                          { id: 'Transfer Bank BCA', type: 'bank', label: 'Bank BCA' },
                          { id: 'Transfer Bank Mandiri', type: 'bank', label: 'Bank Mandiri' },
                          { id: 'Transfer Bank BRI', type: 'bank', label: 'Bank BRI' },
                          { id: 'Transfer Bank BNI', type: 'bank', label: 'Bank BNI' }
                        ].map(method => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setPaymentMethod(method.id)}
                            className={`p-3 rounded-lg border text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${
                              paymentMethod === method.id 
                                ? 'bg-emerald-950/15 border-emerald-500 text-emerald-400' 
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700/80'
                            }`}
                          >
                            <div className="flex justify-between items-center w-full">
                              {method.type === 'wallet' ? <Smartphone className="w-4 h-4 text-slate-500" /> : <Landmark className="w-4 h-4 text-slate-500" />}
                              {paymentMethod === method.id && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>}
                            </div>
                            <span className="text-[11px] font-bold leading-tight block uppercase mt-1">{method.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Summary Billing Payment Instruction & Upload */}
              <div className="lg:col-span-5 space-y-6">
                {activePayBooking ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5 sticky top-24">
                    <div className="border-b border-slate-800 pb-3">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase">INSTRUKSI TRANSFER BILLING</span>
                      <h4 className="font-bold text-sm text-white mt-1">Sisa Tagihan: <span className="text-emerald-400">Rp {activePayBooking.totalPrice.toLocaleString('id-ID')}</span></h4>
                      <p className="text-xs text-slate-400 mt-1">Harap bayar nominal pas untuk pemrosesan validasi cepat.</p>
                    </div>

                    {/* Active payment details view */}
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-lg text-center space-y-3">
                      <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 block">{getPaymentDetails(paymentMethod, activePayBooking.totalPrice).label}</span>
                      
                      {/* Check if QRIS code */}
                      {paymentMethod === 'QRIS' ? (
                        <div className="bg-white p-2 rounded inline-block shadow-md">
                          <img referrerPolicy="no-referrer" src={getPaymentDetails(paymentMethod, activePayBooking.totalPrice).image} alt="QRIS" className="w-32 h-32" />
                        </div>
                      ) : (
                        <div className="font-mono text-base md:text-lg font-black text-emerald-400 select-all p-2 bg-slate-900 border border-slate-800 rounded">
                          {getPaymentDetails(paymentMethod, activePayBooking.totalPrice).account}
                        </div>
                      )}

                      <p className="text-xs text-slate-400 leading-relaxed px-1">
                        {getPaymentDetails(paymentMethod, activePayBooking.totalPrice).note}
                      </p>
                    </div>

                    {/* Proof Image Upload Frame */}
                    <form onSubmit={handleUploadPaymentProof} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 block">2. Unggah/Upload Foto Bukti Pembayaran</label>
                        <div className="border-2 border-dashed border-slate-800/80 hover:border-emerald-500/50 rounded-lg p-3 text-center transition-all bg-slate-950 relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          {uploadedProof ? (
                            <div className="space-y-2">
                              <img referrerPolicy="no-referrer" src={uploadedProof} alt="Bukti Transfer" className="max-h-24 mx-auto rounded object-contain border border-slate-850" />
                              <span className="text-xs text-emerald-400 font-bold block">Bukti Siap Di-upload ✓ (Klik tombol di bawah)</span>
                            </div>
                          ) : (
                            <div className="py-2 text-slate-500">
                              <Upload className="w-6 h-6 mx-auto text-slate-600 mb-1" />
                              <span className="font-medium text-xs block text-slate-400">Pilih berkas JPG/PNG Bukti Transfer</span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">Maks. 3 MB</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow shadow-emerald-500/10 cursor-pointer"
                      >
                        Konfirmasi Pembayaran Saya
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 shadow-xl sticky top-24">
                    <CreditCard className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs">Silakan pilih salah satu kode booking aktif di kolom kiri terlebih dahulu untuk melihat petunjuk pembayaran.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* PAYMENT HISTORIES */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" /> Riwayat Transaksi Bayar
              </h3>
              
              {payments.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500">Belum ada struk pembayaran yang divalidasi oleh sistem.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                        <th className="py-3 px-2">KODE PAY</th>
                        <th className="py-3 px-2">KODE BOOKING</th>
                        <th className="py-3 px-2">LAPANGAN</th>
                        <th className="py-3 px-2">METODE</th>
                        <th className="py-3 px-2">NOMINAL</th>
                        <th className="py-3 px-2">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {payments.map(p => (
                        <tr key={p.id} className="hover:bg-slate-950/20">
                          <td className="py-3 px-2 font-mono text-emerald-400 font-bold">{p.id}</td>
                          <td className="py-3 px-2 font-mono text-slate-400">{p.bookingId}</td>
                          <td className="py-3 px-2 font-medium text-slate-200">{p.courtName}</td>
                          <td className="py-3 px-2">{p.method}</td>
                          <td className="py-3 px-2 text-white font-semibold">Rp {p.amount.toLocaleString('id-ID')}</td>
                          <td className="py-3 px-2">
                            {p.status === 'Menunggu Verifikasi' && <span className="text-amber-500 font-medium">Menunggu Verifikasi</span>}
                            {p.status === 'Belum Bayar' && <span className="text-slate-500 font-medium">Belum Bayar</span>}
                            {p.status === 'Diterima' && <span className="text-emerald-500 font-bold">✓ Berhasil Lunas</span>}
                            {p.status === 'Ditolak' && <span className="text-red-500 font-medium font-bold">❌ Ditolak</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
          </div>
        )}

        {/* ==================== MENU 6: PROFIL SAYA ==================== */}
        {activeTab === 'profil' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-left space-y-1">
              <h2 className="text-xl font-bold font-sans text-white">Profil Pelanggan</h2>
              <p className="text-sm text-slate-400">Kelola informasi diri, ganti kata sandi, unggah foto avatar permainan.</p>
            </div>

            {profStatus && (
              <div className={`p-4 rounded-lg flex items-start gap-2.5 text-xs border ${
                profStatus.type === 'success' 
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' 
                  : 'bg-rose-9550 border border-rose-800 text-rose-300'
              }`}>
                {profStatus.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <div>{profStatus.text}</div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Card Side */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-4">
                <div className="relative w-28 h-28 mx-auto group">
                  <img 
                    referrerPolicy="no-referrer"
                    src={profPhoto} 
                    alt={currentUser.name} 
                    className="w-full h-full rounded-full object-cover border-2 border-emerald-500 shadow-md"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 hover:bg-slate-950/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-base text-white">{currentUser.name}</h3>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold uppercase tracking-wider block w-max mx-auto">
                    Role: {currentUser.role}
                  </span>
                  <p className="text-xs text-slate-500">Terdaftar sejak: {new Date(currentUser.createdAt).toLocaleDateString('id-ID')}</p>
                </div>

                {/* Simulated quick avatar replacement seeds */}
                <div className="pt-4 border-t border-slate-850/60 space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold block">Ganti Gaya Avatar Kartun (Quick Switch):</span>
                  <div className="flex justify-center gap-1.5 flex-wrap">
                    {['Zaky', 'Matuf', 'Ahmad', 'Champion', 'Futsal'].map((seed, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const newAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
                          setProfPhoto(newAvatar);
                          // save to state directly
                          const users = db.getUsers();
                          const updated = users.map(u => u.id === currentUser.id ? { ...u, photo: newAvatar } : u);
                          db.saveUsers(updated);
                          setCurrentUser(prev => ({ ...prev, photo: newAvatar }));
                        }}
                        className="px-2.5 py-1 bg-slate-950 hover:bg-emerald-500 hover:text-slate-950 text-[10px] font-bold rounded border border-slate-800 transition-all cursor-pointer"
                      >
                        Style {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Profil Edit */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 shadow-xl space-y-6 lg:col-span-2">
                <form onSubmit={handleEditProfile} className="space-y-4">
                  <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2">Informasi Rincian Kontak</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-bold">Nama Lengkap</label>
                      <input
                        type="text"
                        value={profName}
                        onChange={(e) => setProfName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2.5 text-xs outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-bold">Nomor HP / WhatsApp</label>
                      <input
                        type="text"
                        value={profPhone}
                        onChange={(e) => setProfPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2.5 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-bold">Alamat Terdaftar Anda</label>
                    <textarea
                      value={profAddress}
                      onChange={(e) => setProfAddress(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2.5 text-xs outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Simpan Perubahan Profil
                  </button>
                </form>

                {/* Change Password Panel */}
                <form onSubmit={handleChangePassword} className="space-y-4 pt-6 border-t border-slate-800">
                  <h3 className="font-bold text-sm text-white">Ganti Kata Sandi Keamanan</h3>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-bold">Kata Sandi Lama</label>
                    <input
                      type="password"
                      value={profPassOld}
                      onChange={(e) => setProfPassOld(e.target.value)}
                      placeholder="******"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2.5 text-xs outline-none text-white pl-4"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-bold">Kata Sandi Baru</label>
                      <input
                        type="password"
                        value={profPassNew}
                        onChange={(e) => setProfPassNew(e.target.value)}
                        placeholder="Mín. 6 karakter"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2.5 text-xs outline-none text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-bold">Ulangi Kata Sandi Baru</label>
                      <input
                        type="password"
                        value={profPassConfirm}
                        onChange={(e) => setProfPassConfirm(e.target.value)}
                        placeholder="Cocokkan sandi baru"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2.5 text-xs outline-none text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Ubah Kata Sandi Akun
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MOBILE BAR NAVIGATION IN FOOTER */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d1527] border-t border-slate-800/80 px-2 py-2 flex items-center justify-around shadow-2xl">
        <button 
          onClick={() => setActiveTab('beranda')}
          className={`flex flex-col items-center gap-1 text-[10px] py-1 cursor-pointer transition-all ${
            activeTab === 'beranda' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Home className="w-4.5 h-4.5" />
          <span>Beranda</span>
        </button>
        <button 
          onClick={() => setActiveTab('booking')}
          className={`flex flex-col items-center gap-1 text-[10px] py-1 cursor-pointer transition-all ${
            activeTab === 'booking' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <BookOpen className="w-4.5 h-4.5" />
          <span>Booking</span>
        </button>
        <button 
          onClick={() => setActiveTab('jadwal')}
          className={`flex flex-col items-center gap-1 text-[10px] py-1 cursor-pointer transition-all ${
            activeTab === 'jadwal' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Calendar className="w-4.5 h-4.5" />
          <span>Kalender</span>
        </button>
        <button 
          onClick={() => setActiveTab('saya')}
          className={`flex flex-col items-center gap-1 text-[10px] py-1 cursor-pointer transition-all ${
            activeTab === 'saya' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <FileText className="w-4.5 h-4.5" />
          <span>Saya</span>
        </button>
        <button 
          onClick={() => setActiveTab('pembayaran')}
          className={`flex flex-col items-center gap-1 text-[10px] py-1 cursor-pointer relative transition-all ${
            activeTab === 'pembayaran' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <CreditCard className="w-4.5 h-4.5" />
          <span>Pembayaran</span>
          {myPendingBookings.length > 0 && (
            <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('profil')}
          className={`flex flex-col items-center gap-1 text-[10px] py-1 cursor-pointer transition-all ${
            activeTab === 'profil' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <UserIcon className="w-4.5 h-4.5" />
          <span>Profil</span>
        </button>
      </div>

    </div>
  );
}
