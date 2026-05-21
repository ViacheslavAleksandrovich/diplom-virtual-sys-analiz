import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../store/authStore';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-10 flex items-center justify-between px-6">
          <div>
            <h1 className="text-sm text-slate-500">Role</h1>
            <span className="text-sm font-semibold text-slate-900 capitalize">{user?.role}</span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-sm rounded-lg bg-slate-900 text-white px-4 py-2 hover:bg-slate-800"
          >
            Logout
          </button>
        </header>

        <main className="p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
