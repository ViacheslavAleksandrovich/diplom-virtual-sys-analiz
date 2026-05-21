import React from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import apiService from '../services/api';

interface TaskStat {
  task_title: string;
  success_rate: number;
  average_score: number;
}

interface ModuleStat {
  module_title: string;
  average_completion_percent: number;
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

const TeacherDashboardPage: React.FC = () => {
  const [taskStats, setTaskStats] = React.useState<TaskStat[]>([]);
  const [moduleStats, setModuleStats] = React.useState<ModuleStat[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [taskResp, moduleResp] = await Promise.all([
          apiService.getTaskStatistics(),
          apiService.getModuleStatistics(),
        ]);
        setTaskStats(toList<TaskStat>(taskResp.data).slice(0, 8));
        setModuleStats(toList<ModuleStat>(moduleResp.data).slice(0, 8));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <div className="text-slate-700">Loading teacher analytics...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Teacher Panel</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="app-card p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Task success rate</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskStats}>
                <XAxis dataKey="task_title" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="success_rate" fill="#059669" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="app-card p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Module completion</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleStats}>
                <XAxis dataKey="module_title" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="average_completion_percent" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardPage;
