import { User, Lapangan, Booking, Pembayaran, ProfilUsaha, OperasionalConfig } from './types';

// Helper function to format dates relative to current date (e.g. today, yesterday, tomorrow)
const getDateOffset = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Ilham Matuf Muzzaky',
    email: 'admin@futsal.com',
    passwordHash: 'admin123',
    phone: '081234567890',
    address: 'Jl. Kaliurang KM 10, Sleman, Yogyakarta',
    role: 'admin',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'aktif',
    createdAt: '2026-05-10T10:00:00.000Z',
  },
  {
    id: 'user-pelanggan-1',
    name: 'Zaky Maulana',
    email: 'pelanggan@futsal.com',
    passwordHash: 'user123',
    phone: '089876543210',
    address: 'Jl. Malioboro No. 42, Kota Yogyakarta',
    role: 'pelanggan',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'aktif',
    createdAt: '2026-06-01T08:30:00.000Z',
  },
  {
    id: 'user-pelanggan-2',
    name: 'Fauzan Ahmad',
    email: 'fauzan@gmail.com',
    passwordHash: 'pass123',
    phone: '087712345678',
    address: 'Depok, Sleman, Yogyakarta',
    role: 'pelanggan',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'aktif',
    createdAt: '2026-06-05T14:20:00.000Z',
  },
  {
    id: 'user-pelanggan-3',
    name: 'Budi Santoso',
    email: 'budi@yahoo.com',
    passwordHash: 'budi123',
    phone: '085233445566',
    address: 'Sleman, Yogyakarta',
    role: 'pelanggan',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    status: 'nonaktif', // Simulated suspended user
    createdAt: '2026-06-10T11:15:00.000Z',
  }
];

export const INITIAL_COURTS: Lapangan[] = [
  {
    id: 'court-wembley',
    name: 'Lapangan Wembley (Vinyl Premium)',
    description: 'Lapangan futsal indoor beralaskan vinyl standar internasional. Memiliki pantulan bola yang sangat konsisten, tidak licin, serta aman saat pemain terjatuh karena dilengkapi bantalan peredam benturan.',
    pricePerHour: 120000,
    location: 'Indoor Hall A',
    type: 'Vinyl',
    facilities: ['Parkir', 'Mushola', 'Toilet', 'Kantin', 'Ruang Ganti', 'Wifi'],
    photo: 'https://images.unsplash.com/photo-1518605072-1612e327a998?w=800&auto=format&fit=crop&q=80', // Beautiful futsal/indoor sports environment
    status: 'aktif',
  },
  {
    id: 'court-sansiro',
    name: 'Lapangan San Siro (Rumput Sintetis)',
    description: 'Kombinasi rumput sintetis lembut anti-abrasi setinggi 5cm dan serpihan karet empuk (rubber infill) berkualitas tinggi. Menawarkan pengalaman seru serasa bermain di lapangan sepak bola luar ruangan yang asli.',
    pricePerHour: 100000,
    location: 'Indoor Hall B',
    type: 'Rumput Sintetis',
    facilities: ['Parkir', 'Toilet', 'Kantin', 'Ruang Ganti', 'Wifi'],
    photo: 'https://images.unsplash.com/photo-1562074244-3e61612f0011?w=800&auto=format&fit=crop&q=80',
    status: 'aktif',
  },
  {
    id: 'court-maracana',
    name: 'Lapangan Maracana (Interlock Pro)',
    description: 'Menggunakan ubin interlock polypropylene premium yang tersusun kokoh. Sangat disukai tim profesional karena memungkinkan aliran bola yang sangat cepat dan manuver kaki tak terbendung.',
    pricePerHour: 110000,
    location: 'Indoor Hall C',
    type: 'Interlock',
    facilities: ['Parkir', 'Mushola', 'Toilet', 'Kantin', 'Ruang Ganti'],
    photo: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&auto=format&fit=crop&q=80',
    status: 'aktif',
  },
  {
    id: 'court-campnou',
    name: 'Lapangan Camp Nou (Semen Semi-Outdoor)',
    description: 'Lapangan futsal luar ruangan semi-terbuka dengan beton bertekstur khusus anti slip. Sangat ekonomis dan cocok untuk bermain santai di sore hari bersama teman kerja atau komunitas.',
    pricePerHour: 80000,
    location: 'Outdoor Area 1',
    type: 'Semen',
    facilities: ['Parkir', 'Toilet', 'Kantin'],
    photo: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&auto=format&fit=crop&q=80',
    status: 'aktif',
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  // Past Month (for monthly reports / analytics)
  {
    id: 'book-old-1',
    courtId: 'court-wembley',
    courtName: 'Lapangan Wembley (Vinyl Premium)',
    userId: 'user-pelanggan-1',
    userName: 'Zaky Maulana',
    date: getDateOffset(-20), // 20 days ago
    startTime: 16,
    duration: 2,
    endTime: 18,
    totalPrice: 240000,
    status: 'Selesai',
    createdAt: getDateOffset(-20) + 'T12:00:00.000Z',
  },
  {
    id: 'book-old-2',
    courtId: 'court-sansiro',
    courtName: 'Lapangan San Siro (Rumput Sintetis)',
    userId: 'user-pelanggan-2',
    userName: 'Fauzan Ahmad',
    date: getDateOffset(-10), // 10 days ago
    startTime: 19,
    duration: 2,
    endTime: 21,
    totalPrice: 200000,
    status: 'Selesai',
    createdAt: getDateOffset(-10) + 'T15:30:00.000Z',
  },
  {
    id: 'book-old-3',
    courtId: 'court-maracana',
    courtName: 'Lapangan Maracana (Interlock Pro)',
    userId: 'user-pelanggan-1',
    userName: 'Zaky Maulana',
    date: getDateOffset(-5), // 5 days ago
    startTime: 20,
    duration: 1,
    endTime: 21,
    totalPrice: 110000,
    status: 'Selesai',
    createdAt: getDateOffset(-5) + 'T10:00:00.000Z',
  },

  // Today (Hari Ini)
  {
    id: 'book-today-1',
    courtId: 'court-wembley',
    courtName: 'Lapangan Wembley (Vinyl Premium)',
    userId: 'user-pelanggan-1',
    userName: 'Zaky Maulana',
    date: getDateOffset(0), // Today
    startTime: 15,
    duration: 2,
    endTime: 17,
    totalPrice: 240000,
    status: 'Dikonfirmasi',
    createdAt: getDateOffset(0) + 'T07:15:00.000Z',
  },
  {
    id: 'book-today-2',
    courtId: 'court-sansiro',
    courtName: 'Lapangan San Siro (Rumput Sintetis)',
    userId: 'user-pelanggan-2',
    userName: 'Fauzan Ahmad',
    date: getDateOffset(0), // Today
    startTime: 19,
    duration: 2,
    endTime: 21,
    totalPrice: 200000,
    status: 'Dikonfirmasi',
    createdAt: getDateOffset(0) + 'T08:00:00.000Z',
  },
  {
    id: 'book-today-3',
    courtId: 'court-maracana',
    courtName: 'Lapangan Maracana (Interlock Pro)',
    userId: 'user-pelanggan-1',
    userName: 'Zaky Maulana',
    date: getDateOffset(0), // Today
    startTime: 18,
    duration: 1,
    endTime: 19,
    totalPrice: 110000,
    status: 'Menunggu Verifikasi',
    createdAt: getDateOffset(0) + 'T09:12:00.000Z',
  },

  // Tomorrow (Besok) & Next Days
  {
    id: 'book-tomorrow-1',
    courtId: 'court-wembley',
    courtName: 'Lapangan Wembley (Vinyl Premium)',
    userId: 'user-pelanggan-2',
    userName: 'Fauzan Ahmad',
    date: getDateOffset(1), // Tomorrow
    startTime: 19,
    duration: 2,
    endTime: 21,
    totalPrice: 240000,
    status: 'Menunggu Pembayaran',
    createdAt: getDateOffset(0) + 'T10:30:00.000Z',
  },
  {
    id: 'book-tomorrow-2',
    courtId: 'court-campnou',
    courtName: 'Lapangan Camp Nou (Semen Semi-Outdoor)',
    userId: 'user-pelanggan-1',
    userName: 'Zaky Maulana',
    date: getDateOffset(1), // Tomorrow
    startTime: 16,
    duration: 2,
    endTime: 18,
    totalPrice: 160000,
    status: 'Dikonfirmasi',
    createdAt: getDateOffset(0) + 'T11:00:00.000Z',
  }
];

export const INITIAL_PAYMENTS: Pembayaran[] = [
  {
    id: 'pay-old-1',
    bookingId: 'book-old-1',
    courtName: 'Lapangan Wembley (Vinyl Premium)',
    playDate: getDateOffset(-20),
    amount: 240000,
    method: 'Transfer Bank BCA',
    proofImage: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=150&auto=format&fit=crop&q=50',
    status: 'Diterima',
    createdAt: getDateOffset(-20) + 'T12:15:00.000Z',
  },
  {
    id: 'pay-old-2',
    bookingId: 'book-old-2',
    courtName: 'Lapangan San Siro (Rumput Sintetis)',
    playDate: getDateOffset(-10),
    amount: 200000,
    method: 'QRIS',
    proofImage: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=150&auto=format&fit=crop&q=50',
    status: 'Diterima',
    createdAt: getDateOffset(-10) + 'T15:45:00.000Z',
  },
  {
    id: 'pay-old-3',
    bookingId: 'book-old-3',
    courtName: 'Lapangan Maracana (Interlock Pro)',
    playDate: getDateOffset(-5),
    amount: 110000,
    method: 'GoPay',
    proofImage: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=150&auto=format&fit=crop&q=50',
    status: 'Diterima',
    createdAt: getDateOffset(-5) + 'T10:10:00.000Z',
  },
  // Today's Payment waiting verification
  {
    id: 'pay-today-3',
    bookingId: 'book-today-3',
    courtName: 'Lapangan Maracana (Interlock Pro)',
    playDate: getDateOffset(0),
    amount: 110000,
    method: 'QRIS',
    proofImage: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=15w&auto=format&fit=crop&q=50',
    status: 'Menunggu Verifikasi',
    createdAt: getDateOffset(0) + 'T09:20:00.000Z',
  },
  // Today's payout confirmed
  {
    id: 'pay-today-1',
    bookingId: 'book-today-1',
    courtName: 'Lapangan Wembley (Vinyl Premium)',
    playDate: getDateOffset(0),
    amount: 240000,
    method: 'Transfer Bank Mandiri',
    proofImage: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=150&auto=format&fit=crop&q=50',
    status: 'Diterima',
    createdAt: getDateOffset(0) + 'T07:30:00.000Z',
  },
  {
    id: 'pay-today-2',
    bookingId: 'book-today-2',
    courtName: 'Lapangan San Siro (Rumput Sintetis)',
    playDate: getDateOffset(0),
    amount: 200000,
    method: 'DANA',
    proofImage: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=150&auto=format&fit=crop&q=50',
    status: 'Diterima',
    createdAt: getDateOffset(0) + 'T08:15:00.000Z',
  }
];

export const INITIAL_PROFIL_USAHA: ProfilUsaha = {
  name: 'Champion Futsal Arena',
  owner: 'Ilham Matuf Muzzaky',
  address: 'Jl. Kaliurang Raya No. 128, Sleman, D.I. Yogyakarta',
  phone: '0812-3456-7890',
};

export const INITIAL_OPERASIONAL: OperasionalConfig = {
  startHour: 8, // 08:00
  endHour: 23, // 23:00
  daysOpen: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
  holidays: [getDateOffset(15)], // Holiday in 15 days
  maintenanceDates: [getDateOffset(7)], // Maintenance on 7 days
};

// Database class to handle localStorage reads and writes
class LocalStorageDB {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const val = localStorage.getItem(`futsal_booking_${key}`);
      return val ? JSON.parse(val) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`futsal_booking_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error("Error writing to localStorage", e);
    }
  }

  constructor() {
    // Seed initial data if they don't exist
    if (!localStorage.getItem('futsal_booking_users')) {
      this.set('users', INITIAL_USERS);
    }
    if (!localStorage.getItem('futsal_booking_courts')) {
      this.set('courts', INITIAL_COURTS);
    }
    if (!localStorage.getItem('futsal_booking_bookings')) {
      this.set('bookings', INITIAL_BOOKINGS);
    }
    if (!localStorage.getItem('futsal_booking_payments')) {
      this.set('payments', INITIAL_PAYMENTS);
    }
    if (!localStorage.getItem('futsal_booking_profile_usaha')) {
      this.set('profile_usaha', INITIAL_PROFIL_USAHA);
    }
    if (!localStorage.getItem('futsal_booking_operasional')) {
      this.set('operasional', INITIAL_OPERASIONAL);
    }
  }

  // USERS REST API/CRUD
  getUsers(): User[] {
    return this.get<User[]>('users', INITIAL_USERS);
  }
  saveUsers(users: User[]): void {
    this.set('users', users);
  }

  // COURTS CRUD
  getCourts(): Lapangan[] {
    return this.get<Lapangan[]>('courts', INITIAL_COURTS);
  }
  saveCourts(courts: Lapangan[]): void {
    this.set('courts', courts);
  }

  // BOOKINGS CRUD
  getBookings(): Booking[] {
    return this.get<Booking[]>('bookings', INITIAL_BOOKINGS);
  }
  saveBookings(bookings: Booking[]): void {
    this.set('bookings', bookings);
  }

  // PAYMENTS CRUD
  getPayments(): Pembayaran[] {
    return this.get<Pembayaran[]>('payments', INITIAL_PAYMENTS);
  }
  savePayments(payments: Pembayaran[]): void {
    this.set('payments', payments);
  }

  // BUSINESS PROFILE ACCESS
  getProfilUsaha(): ProfilUsaha {
    return this.get<ProfilUsaha>('profile_usaha', INITIAL_PROFIL_USAHA);
  }
  saveProfilUsaha(profile: ProfilUsaha): void {
    this.set('profile_usaha', profile);
  }

  // OPERATIONAL CONFIG ACCESS
  getOperasional(): OperasionalConfig {
    return this.get<OperasionalConfig>('operasional', INITIAL_OPERASIONAL);
  }
  saveOperasional(config: OperasionalConfig): void {
    this.set('operasional', config);
  }

  // Helper calculation to fetch reports
  getRevenueStats(): { today: number; week: number; month: number } {
    const bookings = this.getBookings();
    const now = new Date();

    const todayStr = now.toISOString().split('T')[0];

    // date parsing parameters
    const startOfWeek = new Date();
    startOfWeek.setDate(now.getDate() - now.getDay()); // start of week is Sunday
    startOfWeek.setHours(0,0,0,0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let today = 0;
    let week = 0;
    let month = 0;

    bookings.forEach(b => {
      // revenue comes only from 'Dikonfirmasi' or 'Selesai' or 'Menunggu Verifikasi' payment confirmed?
      // Typically, revenue is confirmed or completed booking. Let's include 'Dikonfirmasi' and 'Selesai' and 'Menunggu Verifikasi'.
      if (b.status === 'Dikonfirmasi' || b.status === 'Selesai') {
        const bookDate = new Date(b.date);

        if (b.date === todayStr) {
          today += b.totalPrice;
        }
        if (bookDate >= startOfWeek) {
          week += b.totalPrice;
        }
        if (bookDate >= startOfMonth) {
          month += b.totalPrice;
        }
      }
    });

    return { today, week, month };
  }
}

export const db = new LocalStorageDB();
