import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiService from '../services/api';
import TaskRunner from '../components/TaskRunner';
import FeedbackPanel from '../components/FeedbackPanel';

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
}

interface TaskListItem {
  id: number;
  module: number;
  title: string;
  order_number: number;
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

const TaskPage: React.FC = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [moduleTasks, setModuleTasks] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    status: string;
    score: number;
    points_earned: number;
    feedback: string;
    attempts_count: number;
  } | null>(null);

  useEffect(() => {
    const loadTask = async () => {
      if (!taskId) {
        setError('Task id is not provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const response = await apiService.getTaskDetail(Number(taskId));
        const taskData = response.data as TaskDetail;
        setTask(taskData);
        const tasksResponse = await apiService.getTaskList({ module: taskData.module });
        setModuleTasks(toList<TaskListItem>(tasksResponse.data).sort((a, b) => a.order_number - b.order_number));
      } catch {
        try {
          const tasksResponse = await apiService.getTaskList();
          const tasks = toList<{ id: number }>(tasksResponse.data);
          const fallbackId = tasks[0]?.id;
          if (fallbackId && String(fallbackId) !== taskId) {
            navigate(`/tasks/${fallbackId}`, { replace: true });
            return;
          }
        } catch {
          // no-op: show base error below
        }
        setError('Failed to load task details');
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [taskId, navigate]);

  const submitAnswer = async (answer: Record<string, unknown>, usingHint: boolean) => {
    if (!taskId) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiService.submitTask(Number(taskId), answer, usingHint);
      setResult(response.data);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-slate-700">Loading task...</div>;
  }

  if (error || !task) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
        {error || 'Task not found'}
      </div>
    );
  }

  const currentTaskIndex = moduleTasks.findIndex((item) => item.id === task.id);
  const prevTask = currentTaskIndex > 0 ? moduleTasks[currentTaskIndex - 1] : null;
  const nextTask = currentTaskIndex >= 0 && currentTaskIndex < moduleTasks.length - 1 ? moduleTasks[currentTaskIndex + 1] : null;

  return (
    <div className="space-y-4">
      <div className="app-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">{task.module_title || 'Module'} • Task {currentTaskIndex + 1}/{Math.max(moduleTasks.length, 1)}</p>
            <h1 className="text-lg font-semibold text-slate-900 mt-1">{task.title}</h1>
            <p className="text-xs text-slate-500 mt-1">Difficulty {task.difficulty_level || 1} • {task.points || 0} points • Type: {task.task_type}</p>
          </div>
          <div className="flex items-center gap-2">
            {prevTask ? (
              <Link to={`/tasks/${prevTask.id}`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                Previous
              </Link>
            ) : (
              <span className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400">Previous</span>
            )}
            {nextTask ? (
              <Link to={`/tasks/${nextTask.id}`} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700">
                Next
              </Link>
            ) : (
              <span className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400">Next</span>
            )}
          </div>
        </div>

        {moduleTasks.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {moduleTasks.map((item, index) => (
              <Link
                key={item.id}
                to={`/tasks/${item.id}`}
                className={`rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                  item.id === task.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {index + 1}
              </Link>
            ))}
          </div>
        )}
      </div>
      <TaskRunner task={task} onSubmit={submitAnswer} isSubmitting={isSubmitting} />
      <FeedbackPanel result={result} />
    </div>
  );
};

export default TaskPage;
