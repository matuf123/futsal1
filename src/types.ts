export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // For simulation, just text password
  phone: string;
  address: string;
  role: 'admin' | 'pelanggan';
  photo: string;
  status: 'aktif' | 'nonaktif';
  createdAt: string;
}

export interface Lapangan {
  id: string;
  name: string;
  description: string;
  pricePerHour: number;
  location: string;
  type: 'Vinyl' | 'Rumput Sintetis' | 'Semen' | 'Interlock';
  facilities: ('Parkir' | 'Mushola' | 'Toilet' | 'Kantin' | 'Ruang Ganti' | 'Wifi')[];
  photo: string; // URL or base64 or placeholder style
  status: 'aktif' | 'maintenance' | 'nonaktif';
}

export type BookingStatus =
  | 'Menunggu Pembayaran'
  | 'Menunggu Verifikasi'
  | 'Dikonfirmasi'
  | 'Ditolak'
  | 'Selesai'
  | 'Dibatalkan';

export interface Booking {
  id: string;
  courtId: string;
  courtName: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  startTime: number; // e.g., 8 means 08:00
  duration: number; // hours
  endTime: number; // startTime + duration
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
}

export type PaymentStatus = 'Belum Bayar' | 'Menunggu Verifikasi' | 'Diterima' | 'Ditolak';

export interface Pembayaran {
  id: string;
  bookingId: string;
  courtName: string;
  playDate: string;
  amount: number;
  method: string;
  proofImage?: string; // base64 representation
  status: PaymentStatus;
  createdAt: string;
}

export interface ProfilUsaha {
  name: string;
  owner: string;
  address: string;
  phone: string;
}

export interface OperasionalConfig {
  startHour: number; // e.g. 8 for 08:00
  endHour: number; // e.g. 22 for 22:00
  daysOpen: string[]; // ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
  holidays: string[]; // YYYY-MM-DD strings
  maintenanceDates: string[]; // YYYY-MM-DD strings
}
