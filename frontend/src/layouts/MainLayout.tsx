import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../store/authStore';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur z-10 flex items-center justify-between px-6">
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

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
