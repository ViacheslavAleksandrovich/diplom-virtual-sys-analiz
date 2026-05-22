import React from 'react';
import { useAuth } from '../store/authStore';
import { Link } from 'react-router-dom';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import apiService from '../services/api';

interface StudentStats {
  total_tasks_completed: number;
  total_points_earned: number;
  average_score: number;
  total_learning_hours: number;
  average_attempts: number;
  success_rate: number;
}

interface RankingRow {
  total_points: number;
  level: number;
  achievements_count: number;
  experience_points: number;
}

interface ResultRow {
  status: 'pending' | 'correct' | 'partial' | 'incorrect';
  points_earned: number;
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

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = React.useState<StudentStats | null>(null);
  const [ranking, setRanking] = React.useState<RankingRow | null>(null);
  const [results, setResults] = React.useState<ResultRow[]>([]);
  const [firstModuleId, setFirstModuleId] = React.useState<number | null>(null);
  const [firstTaskId, setFirstTaskId] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      if (!user) {
        return;
      }

      if (user.role !== 'student') {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [statsResp, rankingResp] = await Promise.all([
          apiService.getMyStatistics(),
          apiService.getMyRanking(),
        ]);
        setStats(statsResp.data);
        setRanking(rankingResp.data);
        const resultsResp = await apiService.getResults();
        setResults(toList<ResultRow>(resultsResp.data));
        const modulesResponse = await apiService.getModules();
        const modules = toList<{ id: number }>(modulesResponse.data);
        const moduleId = modules[0]?.id || null;
        setFirstModuleId(moduleId);
        if (moduleId) {
          const tasksResponse = await apiService.getTaskList({ module: moduleId });
          const tasks = toList<{ id: number }>(tasksResponse.data);
          setFirstTaskId(tasks[0]?.id || null);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const derivedStats = React.useMemo(() => {
    const completedTasks = results.filter((item) => item.status === 'correct' || item.status === 'partial').length;
    const totalPoints = results.reduce((sum, item) => sum + (item.points_earned || 0), 0);
    const successRate = results.length ? Math.round((completedTasks / results.length) * 100) : 0;

    return {
      total_tasks_completed: stats?.total_tasks_completed ?? completedTasks,
      total_points_earned: stats?.total_points_earned ?? totalPoints,
      success_rate: stats?.success_rate ?? successRate,
    };
  }, [results, stats]);

  if (loading) {
    return <div className="text-slate-700">Loading dashboard...</div>;
  }

  if (user?.role === 'teacher' || user?.role === 'admin') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-slate-700">
          Use role-specific workspace:
          {' '}
          {user.role === 'admin' ? <Link to="/admin" className="text-indigo-700">Admin panel</Link> : <Link to="/teacher" className="text-indigo-700">Teacher panel</Link>}
        </p>
      </div>
    );
  }

  const chartData = [
    { name: 'Tasks', value: derivedStats.total_tasks_completed || 0 },
    { name: 'Points', value: derivedStats.total_points_earned || 0 },
    { name: 'Success', value: Math.round(derivedStats.success_rate || 0) },
  ];

  return (
    <div className="space-y-5">
      <div className="app-card p-6 bg-gradient-to-r from-indigo-700 to-indigo-600 text-white border-0 shadow-lg">
        <h1 className="text-2xl font-semibold text-black">Student Dashboard</h1>
        <p className="text-black mt-2">
          Welcome, <strong>{user?.full_name || user?.username}</strong>. Track your progress and continue practice.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={firstModuleId ? `/modules/${firstModuleId}` : '/dashboard'} className="rounded-lg bg-black/25 px-3 py-2 text-sm hover:bg-black/35 transition-colors">
            Open theory
          </Link>
          <Link to={firstTaskId ? `/tasks/${firstTaskId}` : '/dashboard'} className="rounded-lg bg-black/25 px-3 py-2 text-sm hover:bg-black/35 transition-colors">
            Solve tasks
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="app-card p-5">
          <p className="text-xs text-slate-500">Completed tasks</p>
          <p className="text-3xl font-semibold text-slate-900 mt-1">{derivedStats.total_tasks_completed}</p>
        </div>
        <div className="app-card p-5">
          <p className="text-xs text-slate-500">Total points</p>
          <p className="text-3xl font-semibold text-slate-900 mt-1">{derivedStats.total_points_earned}</p>
        </div>
        <div className="app-card p-5">
          <p className="text-xs text-slate-500">Ranking level</p>
          <p className="text-3xl font-semibold text-slate-900 mt-1">{ranking?.level ?? 1}</p>
        </div>
      </div>

      <div className="app-card p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Progress chart</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
