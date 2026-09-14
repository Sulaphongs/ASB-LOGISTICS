import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';

export default function Layout({ title, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="lg:flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-800/90 backdrop-blur border-b border-slate-200 dark:border-slate-700 px-4 lg:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center"
              onClick={() => setSidebarOpen(true)}
              aria-label="ເປີດເມນູ"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
            <h1 className="font-bold text-slate-800 dark:text-slate-100">{title}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span className="hidden sm:inline">{user?.full_name || user?.username}</span>
            <button onClick={handleLogout} className="inline-flex items-center gap-1.5 text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 text-sm font-medium">
              <LogOut className="w-4 h-4" aria-hidden="true" /> ອອກຈາກລະບົບ
            </button>
          </div>
        </header>
        <main className="p-4 lg:p-6 max-w-6xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
