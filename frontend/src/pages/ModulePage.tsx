import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiService from '../services/api';
import TheoryViewer, { TheoryMaterial } from '../components/TheoryViewer';

type Phase = 'learn' | 'practice' | 'assess';

const PHASES: { key: Phase; label: string; icon: string; desc: string }[] = [
  { key: 'learn',    label: 'Learn',    icon: '📖', desc: 'Theory materials' },
  { key: 'practice', label: 'Practice',    icon: '⚡', desc: 'Unlimited attempts, hints allowed' },
  { key: 'assess',   label: 'Assess', icon: '🎯', desc: 'Max 3 attempts, no hints' },
];

interface ModuleDetail {
  id: number;
  title: string;
  description: string;
  estimated_hours?: number;
  theory_materials: TheoryMaterial[];
}

interface ModuleTask {
  id: number;
  title: string;
  task_type: string;
  difficulty_level: number;
  points: number;
}

const DIFFICULTY: Record<number, { label: string; cls: string }> = {
  1: { label: 'Lvl 1',  cls: 'bg-emerald-100 text-emerald-800' },
  2: { label: 'Lvl 2',  cls: 'bg-amber-100   text-amber-800'   },
  3: { label: 'Lvl 3',  cls: 'bg-rose-100    text-rose-800'    },
};

const toList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && 'results' in payload)
    return ((payload as { results?: T[] }).results || []);
  return [];
};

const ModulePage: React.FC = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [activePhase, setActivePhase] = useState<Phase>('learn');
  const [moduleData, setModuleData] = useState<ModuleDetail | null>(null);
  const [moduleTasks, setModuleTasks] = useState<ModuleTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewedMaterials, setViewedMaterials] = useState<Set<number>>(new Set());
  const sentProgressRef = useRef(0);

  useEffect(() => {
    if (!moduleId) { setError('Module ID not specified'); setLoading(false); return; }
    setLoading(true);
    setError('');
    Promise.all([
      apiService.getModuleDetail(Number(moduleId)),
      apiService.getTaskList({ module: Number(moduleId) }),
    ])
      .then(([modRes, tasksRes]) => {
        setModuleData(modRes.data);
        setModuleTasks(toList<ModuleTask>(tasksRes.data));
      })
      .catch(async () => {
        try {
          const mods = toList<{ id: number }>((await apiService.getModules()).data);
          const fallback = mods[0]?.id;
          if (fallback && String(fallback) !== moduleId) {
            navigate(`/modules/${fallback}`, { replace: true });
            return;
          }
        } catch { /* no-op */ }
        setError('Failed to load module');
      })
      .finally(() => setLoading(false));
  }, [moduleId, navigate]);

  const theoryProgress = useMemo(() => {
    const active = moduleData?.theory_materials?.filter(m => m.is_active) ?? [];
    if (!active.length) return 0;
    const viewed = active.filter(m => viewedMaterials.has(m.id)).length;
    return Math.round((viewed / active.length) * 100);
  }, [viewedMaterials, moduleData]);

  const handleMaterialViewed = useCallback((id: number) => {
    setViewedMaterials(prev => prev.has(id) ? prev : new Set(prev).add(id));
  }, []);

  useEffect(() => {
    if (!moduleId || theoryProgress === 0 || theoryProgress === sentProgressRef.current) return;
    sentProgressRef.current = theoryProgress;
    apiService.updateModuleProgress(Number(moduleId), { theory_viewed_percent: theoryProgress }).catch(() => undefined);
  }, [theoryProgress, moduleId]);

  const assessTasks = useMemo(() => moduleTasks.filter(t => t.difficulty_level >= 2), [moduleTasks]);

  if (loading) return <div className="text-slate-600 p-4">Loading module...</div>;
  if (error) return <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">{error}</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="app-card p-5">
        <h1 className="text-2xl font-semibold text-slate-900">{moduleData?.title ?? `Module ${moduleId}`}</h1>
        <p className="text-slate-600 mt-1">{moduleData?.description}</p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
          <span>⏱ {moduleData?.estimated_hours ?? 0} hrs</span>
          <span>📋 {moduleTasks.length} tasks</span>
          {theoryProgress > 0 && (
            <span className="flex items-center gap-2">
              📖 Theory {theoryProgress}%
              <span className="inline-block h-2 w-20 rounded-full bg-slate-200 overflow-hidden">
                <span className="h-full block rounded-full bg-indigo-500 transition-all" style={{ width: `${theoryProgress}%` }} />
              </span>
            </span>
          )}
        </div>
      </div>

      {/* 3-Phase tabs */}
      <div className="app-card overflow-hidden">
        <div className="flex border-b border-slate-200">
          {PHASES.map(p => (
            <button
              key={p.key}
              onClick={() => setActivePhase(p.key)}
              className={`flex-1 py-4 px-3 text-center text-sm font-medium transition-colors ${
                activePhase === p.key
                  ? 'border-b-2 border-indigo-600 text-indigo-700 bg-indigo-50/60'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="text-xl">{p.icon}</div>
              <div className="font-semibold mt-0.5">{p.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{p.desc}</div>
            </button>
          ))}
        </div>

        {/* ── LEARN ── */}
        {activePhase === 'learn' && (
          <div className="p-4">
            <TheoryViewer
              materials={moduleData?.theory_materials ?? []}
              onMaterialViewed={handleMaterialViewed}
            />
            {theoryProgress === 100 && (
              <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                ✅ You have reviewed all theory materials. Proceed to <strong>Practice</strong>!
              </div>
            )}
          </div>
        )}

        {/* ── PRACTICE ── */}
        {activePhase === 'practice' && (
          <div className="p-4 space-y-3">
            <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
              ⚡ <strong>Practice mode:</strong> unlimited attempts, hints allowed.
              After 3 failed attempts a demo solution is shown.
            </div>
            {moduleTasks.length === 0
              ? <p className="text-slate-500">Tasks are being prepared for this module.</p>
              : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {moduleTasks.map((t, i) => {
                    const badge = DIFFICULTY[t.difficulty_level] ?? DIFFICULTY[1];
                    return (
                      <Link key={t.id} to={`/tasks/${t.id}?phase=practice`}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs text-slate-400">Task {i + 1}</p>
                            <p className="text-slate-900 font-medium">{t.title}</p>
                          </div>
                          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">{t.points} pts · {t.task_type}</p>
                      </Link>
                    );
                  })}
                </div>
              )}
          </div>
        )}

        {/* ── ASSESS ── */}
        {activePhase === 'assess' && (
          <div className="p-4 space-y-3">
            <div className="rounded-lg bg-amber-50 border border-amber-300 px-4 py-3 text-sm text-amber-900">
              🎯 <strong>Assessment mode:</strong> max 3 attempts, no hints, 30-min timer.
              Shows difficulty level 2 (analytical) and level 3 (creative) tasks.
            </div>
            {assessTasks.length === 0
              ? <p className="text-slate-500">No level 2+ tasks found. See Practice tab.</p>
              : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assessTasks.map((t, i) => {
                    const badge = DIFFICULTY[t.difficulty_level] ?? DIFFICULTY[2];
                    return (
                      <Link key={t.id} to={`/tasks/${t.id}?phase=assess`}
                        className="rounded-lg border border-amber-200 bg-white px-4 py-3 hover:border-amber-400 hover:bg-amber-50/30 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs text-slate-400">Task {i + 1}</p>
                            <p className="text-slate-900 font-medium">{t.title}</p>
                          </div>
                          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">{t.points} pts · {t.task_type}</p>
                      </Link>
                    );
                  })}
                </div>
              )}
          </div>
        )}
      </div>

      {/* Completion requirements */}
      <div className="app-card p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Module completion requirements</h3>
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          {[
            { icon: '📖', value: '≥80%', label: 'Theory viewed' },
            { icon: '✅', value: '≥70%', label: 'Tasks completed' },
            { icon: '🎯', value: '≥60%', label: 'Assessment score' },
          ].map(r => (
            <div key={r.label} className="rounded-lg bg-slate-50 border border-slate-200 py-3 px-1">
              <div className="text-2xl">{r.icon}</div>
              <div className="font-bold text-slate-800 mt-1">{r.value}</div>
              <div className="text-slate-500 leading-tight mt-0.5">{r.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModulePage;
