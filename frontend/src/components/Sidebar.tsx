import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import apiService from '../services/api';

interface ModuleNavItem {
  id: number;
  title: string;
}

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
    isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
  }`;

const toList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && 'results' in payload)
    return ((payload as { results?: T[] }).results || []);
  return [];
};

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const [modules, setModules] = React.useState<ModuleNavItem[]>([]);
  const [firstTaskId, setFirstTaskId] = React.useState<number | null>(null);
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    const loadNav = async () => {
      try {
        const modulesResponse = await apiService.getModules();
        const moduleList = toList<ModuleNavItem>(modulesResponse.data);
        setModules(moduleList);

        const firstId = moduleList[0]?.id;
        if (firstId) {
          const tasksResponse = await apiService.getTaskList({ module: firstId });
          const tasks = toList<{ id: number }>(tasksResponse.data);
          setFirstTaskId(tasks[0]?.id ?? null);
        }
      } catch {
        // silently fail – user will see empty nav
      }
    };

    loadNav();
  }, []);

  const visibleModules = expanded ? modules : modules.slice(0, 3);

  return (
    <aside className="w-72 shrink-0 h-full border-r border-slate-200 bg-white/90 backdrop-blur p-5 flex flex-col gap-6 overflow-y-auto">
      <div>
        <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">Virtual Trainer</p>
        <h2 className="text-xl font-bold text-slate-900 mt-1">System Analysis</h2>
        <p className="text-xs text-slate-500 mt-1">{user?.full_name || user?.username}</p>
      </div>

      <nav className="space-y-1">
        <NavLink to="/dashboard" className={linkClassName}>
          🏠 Overview
        </NavLink>

        <NavLink to="/leaderboard" className={linkClassName}>
          🏆 Leaderboard
        </NavLink>

        {/* Modules section */}
        <div className="pt-2">
          <p className="px-3 text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Course modules</p>
          {modules.length === 0 ? (
            <p className="px-3 text-xs text-slate-400 py-1">No modules available</p>
          ) : (
            <>
              {visibleModules.map((mod) => (
                <NavLink key={mod.id} to={`/modules/${mod.id}`} className={linkClassName}>
                  {mod.title}
                </NavLink>
              ))}
              {modules.length > 3 && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="w-full text-left px-3 py-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {expanded ? 'Show less ↑' : `+${modules.length - 3} more ↓`}
                </button>
              )}
            </>
          )}
        </div>

        {/* Practical tasks */}
        <div className="pt-2">
          <p className="px-3 text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Practice</p>
          <NavLink to={firstTaskId ? `/tasks/${firstTaskId}` : '/tasks/1'} className={linkClassName}>
            📝 Practical tasks
          </NavLink>
        </div>

        {/* Role-specific links */}
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <div className="pt-2">
            <p className="px-3 text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Management</p>
            <NavLink to="/teacher" className={linkClassName}>
              👩‍🏫 Teacher panel
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={linkClassName}>
                ⚙️ Admin report
              </NavLink>
            )}
          </div>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
