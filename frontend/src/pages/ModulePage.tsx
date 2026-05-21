import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../services/api';
import TheoryViewer, { TheoryMaterial } from '../components/TheoryViewer';

interface ModuleDetail {
  id: number;
  title: string;
  description: string;
  estimated_hours?: number;
  theory_materials: TheoryMaterial[];
}

interface ModuleTaskListItem {
  id: number;
  title: string;
  task_type: string;
  difficulty_level: number;
  points: number;
}

const toList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }
  if (payload && typeof payload === 'object' && 'results' in payload) {
    return ((payload as { results?: T[] }).results || []);
  }
  return [];
};

const ModulePage: React.FC = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [moduleData, setModuleData] = useState<ModuleDetail | null>(null);
  const [moduleTasks, setModuleTasks] = useState<ModuleTaskListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadModule = async () => {
      if (!moduleId) {
        setError('Module id is not provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const response = await apiService.getModuleDetail(Number(moduleId));
        setModuleData(response.data);
        const tasksResponse = await apiService.getTaskList({ module: Number(moduleId) });
        setModuleTasks(toList<ModuleTaskListItem>(tasksResponse.data));
      } catch {
        try {
          const modulesResponse = await apiService.getModules();
          const modules = toList<{ id: number }>(modulesResponse.data);
          const fallbackId = modules[0]?.id;
          if (fallbackId && String(fallbackId) !== moduleId) {
            navigate(`/modules/${fallbackId}`, { replace: true });
            return;
          }
        } catch {
          // no-op: show base error below
        }
        setError('Failed to load module details');
      } finally {
        setLoading(false);
      }
    };

    loadModule();
  }, [moduleId, navigate]);

  const theoryProgress = useMemo(() => {
    if (!moduleData?.theory_materials?.length) {
      return 0;
    }
    return 100;
  }, [moduleData]);

  if (loading) {
    return <div className="text-slate-700">Loading module...</div>;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="app-card p-5">
        <h1 className="text-2xl font-semibold text-slate-900">{moduleData?.title || `Module ${moduleId}`}</h1>
        <p className="text-slate-700 mt-2">{moduleData?.description || 'No description provided.'}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span>Theory progress: {theoryProgress}%</span>
          <span>Estimated time: {moduleData?.estimated_hours || 0}h</span>
          <span>Tasks in module: {moduleTasks.length}</span>
        </div>
      </div>

      <div className="app-card p-5">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Practical tasks</h2>
        {moduleTasks.length === 0 ? (
          <p className="text-slate-600">Tasks are being prepared for this module.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {moduleTasks.map((item, index) => (
              <Link
                key={item.id}
                to={`/tasks/${item.id}`}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
              >
                <p className="text-sm text-slate-500">Task {index + 1}</p>
                <p className="text-slate-900 font-medium mt-1">{item.title}</p>
                <p className="text-xs text-slate-500 mt-1">Level {item.difficulty_level} • {item.points} pts</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <TheoryViewer materials={moduleData?.theory_materials || []} />
    </div>
  );
};

export default ModulePage;
