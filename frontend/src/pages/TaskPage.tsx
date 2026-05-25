import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import apiService from '../services/api';
import TaskRunner from '../components/TaskRunner';
import FeedbackPanel from '../components/FeedbackPanel';

type Phase = 'practice' | 'assess';

interface TaskDetail {
  id: number;
  module: number;
  module_title?: string;
  order_number?: number;
  difficulty_level?: number;
  points?: number;
  title: string;
  task_type: 'multiple_choice' | 'text_answer' | 'calculation' | 'matrix' | 'hierarchy';
  condition_text: string;
  options?: { key: string; text: string }[];
}

interface TaskListItem {
  id: number;
  module: number;
  title: string;
  order_number: number;
}

interface SubmitResult {
  status: string;
  score: number;
  points_earned: number;
  feedback: string;
  attempts_count: number;
  explanation?: string;
}

const toList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && 'results' in payload)
    return ((payload as { results?: T[] }).results || []);
  return [];
};

const ASSESS_DURATION_SEC = 30 * 60; // 30 minutes

const PHASE_META: Record<Phase, { label: string; icon: string; cls: string }> = {
  practice: { label: 'Practice',    icon: '⚡', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  assess:   { label: 'Assessment', icon: '🎯', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
};

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const TaskPage: React.FC = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const phase: Phase = (searchParams.get('phase') as Phase) === 'assess' ? 'assess' : 'practice';

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [moduleTasks, setModuleTasks] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [assessBlocked, setAssessBlocked] = useState(false);

  // Assess-mode timer (persisted per task in sessionStorage)
  const timerKey = `assess_timer_${taskId}`;
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (phase !== 'assess') return 0;
    const stored = sessionStorage.getItem(timerKey);
    return stored ? Number(stored) : ASSESS_DURATION_SEC;
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase !== 'assess') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = Math.max(0, prev - 1);
        sessionStorage.setItem(timerKey, String(next));
        return next;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, taskId]);

  // Load task
  useEffect(() => {
    if (!taskId) { setError('Task id is not provided'); setLoading(false); return; }
    setLoading(true);
    setError('');
    setResult(null);
    setAssessBlocked(false);

    apiService.getTaskDetail(Number(taskId))
      .then(res => {
        setTask(res.data as TaskDetail);
        return apiService.getTaskList({ module: (res.data as TaskDetail).module });
      })
      .then(res => {
        setModuleTasks(
          toList<TaskListItem>(res.data).sort((a, b) => a.order_number - b.order_number)
        );
      })
      .catch(async () => {
        try {
          const all = toList<{ id: number }>((await apiService.getTaskList()).data);
          const fallback = all[0]?.id;
          if (fallback && String(fallback) !== taskId) {
            navigate(`/tasks/${fallback}?phase=${phase}`, { replace: true });
            return;
          }
        } catch { /* no-op */ }
        setError('Failed to load task');
      })
      .finally(() => setLoading(false));
  }, [taskId, navigate, phase]);

  const submitAnswer = async (answer: Record<string, unknown>, usingHint: boolean) => {
    if (!taskId) return;
    setIsSubmitting(true);
    try {
      const res = await apiService.submitTask(Number(taskId), answer, usingHint, phase);
      const data = res.data as SubmitResult;
      setResult(data);
      if (phase === 'assess' && data.attempts_count >= 3 && data.status !== 'correct') {
        setAssessBlocked(true);
      }
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      if (detail) setError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="text-slate-600 p-4">Loading task...</div>;
  if (error || !task) return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">{error || 'Task not found'}</div>
  );

  const idx = moduleTasks.findIndex(t => t.id === task.id);
  const prevTask = idx > 0 ? moduleTasks[idx - 1] : null;
  const nextTask = idx >= 0 && idx < moduleTasks.length - 1 ? moduleTasks[idx + 1] : null;
  const pm = PHASE_META[phase];
  const moduleId = task.module;
  const timeExpired = phase === 'assess' && timeLeft === 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="app-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Phase badge */}
            <span className={`inline-flex items-center gap-1 text-xs font-medium border rounded-full px-2.5 py-0.5 mb-2 ${pm.cls}`}>
              {pm.icon} {pm.label}
            </span>
            <p className="text-sm text-slate-500">
              {task.module_title || 'Module'} · Task {idx + 1}/{Math.max(moduleTasks.length, 1)}
            </p>
            <h1 className="text-lg font-semibold text-slate-900 mt-1">{task.title}</h1>
            <p className="text-xs text-slate-500 mt-1">
              Difficulty {task.difficulty_level ?? 1} · {task.points ?? 0} pts · {task.task_type}
            </p>
          </div>

          {/* Assess timer */}
          {phase === 'assess' && (
            <div className={`rounded-lg border px-4 py-2 text-center ${timeLeft < 300 ? 'border-red-300 bg-red-50 text-red-700' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
              <div className="text-xs font-medium">⏱ Timer</div>
              <div className="text-2xl font-mono font-bold">{fmt(timeLeft)}</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-3 flex items-center gap-2">
          <Link to={`/modules/${moduleId}`} className="text-sm text-indigo-600 hover:underline mr-2">
            ← Module
          </Link>
          {prevTask
            ? <Link to={`/tasks/${prevTask.id}?phase=${phase}`} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">‹ Previous</Link>
            : <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-400">‹ Previous</span>
          }
          {nextTask
            ? <Link to={`/tasks/${nextTask.id}?phase=${phase}`} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700">Next ›</Link>
            : <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-400">Next ›</span>
          }
        </div>

        {/* Task number pills */}
        {moduleTasks.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {moduleTasks.map((t, i) => (
              <Link key={t.id} to={`/tasks/${t.id}?phase=${phase}`}
                className={`rounded-md px-2.5 py-1 text-xs transition-colors ${t.id === task.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                {i + 1}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Timer expired message */}
      {timeExpired && (
        <div className="rounded-lg bg-red-50 border border-red-300 p-4 text-red-800 font-medium">
          ⏰ Time is up. No more attempts accepted for this task in assessment mode.
        </div>
      )}

      {/* Assess blocked after 3 attempts */}
      {assessBlocked && !timeExpired && (
        <div className="rounded-lg bg-amber-50 border border-amber-300 p-4 text-amber-900">
          🎯 3 assessment attempts used. Please move to the next task.
        </div>
      )}

      {/* Task runner */}
      {!timeExpired && !assessBlocked && (
        <TaskRunner
          task={task}
          onSubmit={submitAnswer}
          isSubmitting={isSubmitting}
          phase={phase}
        />
      )}

      {/* Feedback */}
      <FeedbackPanel result={result} phase={phase} />
    </div>
  );
};

export default TaskPage;
