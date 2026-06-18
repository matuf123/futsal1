import { useState, useEffect } from 'react';
import { User } from './types';
import { db } from './data';
import Auth from './components/Auth';
import PelangganDashboard from './components/PelangganDashboard';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for active session in localStorage on mounting
  useEffect(() => {
    try {
      const activeSessionUser = localStorage.getItem('futsal_active_session_user');
      if (activeSessionUser) {
        const parsed = JSON.parse(activeSessionUser) as User;
        // Verify user still exists in DB and is active
        const allUsers = db.getUsers();
        const found = allUsers.find(u => u.id === parsed.id && u.status === 'aktif');
        if (found) {
          setCurrentUser(found);
        } else {
          localStorage.removeItem('futsal_active_session_user');
        }
      }
    } catch (e) {
      console.error('Session matching error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    // Persist login session
    localStorage.setItem('futsal_active_session_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('futsal_active_session_user');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-slate-100">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs tracking-wider uppercase font-semibold text-slate-400">Memuat Sistem Futsal...</p>
        </div>
      </div>
    );
  }

  // Router based on logged in state and user role
  if (!currentUser) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentUser.role === 'admin') {
    return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
  }

  return <PelangganDashboard user={currentUser} onLogout={handleLogout} />;
}
