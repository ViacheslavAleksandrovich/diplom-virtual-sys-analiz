import React from 'react';
import apiService from '../services/api';

interface StudentAnalyticsRow {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  total_tasks_completed: number;
  total_points_earned: number;
  average_score: number;
  total_learning_hours: number;
  average_attempts: number;
  success_rate: number;
  completed_modules: number;
  average_module_completion: number;
  ranking_level: number;
  ranking_points: number;
  achievements_count: number;
}

interface StudentReportSummary {
  total_users: number;
  users_with_progress: number;
  users_completed_modules: number;
  total_completed_tasks: number;
  average_success_rate: number;
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

const AdminDashboardPage: React.FC = () => {
  const [summary, setSummary] = React.useState<StudentReportSummary | null>(null);
  const [rows, setRows] = React.useState<StudentAnalyticsRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await apiService.getStudentReport();
        const payload = response.data as { summary?: StudentReportSummary; results?: unknown };
        setSummary(payload.summary || null);
        setRows(toList<StudentAnalyticsRow>(payload.results));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredRows = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return rows;
    }
    return rows.filter((row) =>
      [row.username, row.full_name, row.email].some((value) => value.toLowerCase().includes(normalized))
    );
  }, [query, rows]);

  if (loading) {
    return <div className="text-slate-700">Loading student report...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">User report</h1>
        <p className="text-slate-700">Student statistics and progress overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="app-card p-5">
          <p className="text-xs text-slate-500">Users</p>
          <p className="text-3xl font-semibold text-slate-900 mt-1">{summary?.total_users ?? 0}</p>
        </div>
        <div className="app-card p-5">
          <p className="text-xs text-slate-500">With progress</p>
          <p className="text-3xl font-semibold text-slate-900 mt-1">{summary?.users_with_progress ?? 0}</p>
        </div>
        <div className="app-card p-5">
          <p className="text-xs text-slate-500">Users completed modules</p>
          <p className="text-3xl font-semibold text-slate-900 mt-1">{summary?.users_completed_modules ?? 0}</p>
        </div>
        <div className="app-card p-5">
          <p className="text-xs text-slate-500">Avg success rate</p>
          <p className="text-3xl font-semibold text-slate-900 mt-1">{(summary?.average_success_rate ?? 0).toFixed(1)}%</p>
        </div>
      </div>

      <div className="app-card p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Students report</h2>
            <p className="text-xs text-slate-500">Search by nickname, name, or email.</p>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full md:w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Search student"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-4 font-medium">Nickname</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Tasks</th>
                <th className="py-2 pr-4 font-medium">Points</th>
                <th className="py-2 pr-4 font-medium">Avg score</th>
                <th className="py-2 pr-4 font-medium">Attempts</th>
                <th className="py-2 pr-4 font-medium">Success</th>
                <th className="py-2 pr-4 font-medium">Modules</th>
                <th className="py-2 pr-4 font-medium">Rank</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pr-4 text-slate-900 font-medium">{row.username}</td>
                  <td className="py-3 pr-4 text-slate-700">{row.role}</td>
                  <td className="py-3 pr-4 text-slate-700">{row.full_name}</td>
                  <td className="py-3 pr-4 text-slate-700">{row.total_tasks_completed}</td>
                  <td className="py-3 pr-4 text-slate-700">{row.total_points_earned}</td>
                  <td className="py-3 pr-4 text-slate-700">{row.average_score.toFixed(1)}</td>
                  <td className="py-3 pr-4 text-slate-700">{row.average_attempts.toFixed(2)}</td>
                  <td className="py-3 pr-4 text-slate-700">{row.success_rate.toFixed(1)}%</td>
                  <td className="py-3 pr-4 text-slate-700">{row.completed_modules}</td>
                  <td className="py-3 pr-4 text-slate-700">L{row.ranking_level} / {row.ranking_points}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRows.length === 0 && (
            <p className="py-6 text-sm text-slate-500">No students match your search.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
