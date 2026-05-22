import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import apiService from '../services/api';

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
    isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
  }`;

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const [firstModuleId, setFirstModuleId] = React.useState<number | null>(null);
  const [firstTaskId, setFirstTaskId] = React.useState<number | null>(null);

  React.useEffect(() => {
    const toList = <T,>(payload: unknown): T[] => {
      if (Array.isArray(payload)) {
        return payload as T[];
      }
      if (payload && typeof payload === 'object' && 'results' in payload) {
        return ((payload as { results?: T[] }).results || []);
      }
      return [];
    };

    const loadNavigationTargets = async () => {
      try {
        const modulesResponse = await apiService.getModules();
        const modules = toList<{ id: number }>(modulesResponse.data);
        const moduleId = modules[0]?.id ?? null;
        setFirstModuleId(moduleId);

        if (moduleId) {
          const tasksResponse = await apiService.getTaskList({ module: moduleId });
          const tasks = toList<{ id: number }>(tasksResponse.data);
          setFirstTaskId(tasks[0]?.id ?? null);
        }
      } catch {
        setFirstModuleId(null);
        setFirstTaskId(null);
      }
    };

    loadNavigationTargets();
  }, []);

  return (
    <aside className="w-72 border-r border-slate-200 bg-white/90 backdrop-blur p-5">
      <div className="mb-7">
        <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">Virtual Trainer</p>
        <h2 className="text-xl font-bold text-slate-900 mt-1">System Analysis</h2>
        <p className="text-xs text-slate-500 mt-1">{user?.full_name || user?.username}</p>
      </div>

      <nav className="space-y-2">
        <NavLink to="/dashboard" className={linkClassName}>
          Overview
        </NavLink>
        <NavLink to={firstModuleId ? `/modules/${firstModuleId}` : '/modules/1'} className={linkClassName}>
          Theory module
        </NavLink>
        <NavLink to={firstTaskId ? `/tasks/${firstTaskId}` : '/tasks/1'} className={linkClassName}>
          Practical tasks
        </NavLink>

        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <NavLink to="/teacher" className={linkClassName}>
            Teacher panel
          </NavLink>
        )}
        <NavLink to="/admin" className={linkClassName}>
          My report
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
