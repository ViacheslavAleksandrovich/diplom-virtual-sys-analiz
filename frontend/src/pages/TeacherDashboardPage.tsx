import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import apiService from '../services/api';

interface TaskStat {
  task: number;
  task_title: string;
  total_submissions: number;
  successful_submissions: number;
  partial_submissions: number;
  failed_submissions: number;
  success_rate: number;
  partial_rate: number;
  average_attempts: number;
  average_score: number;
}

interface ModuleStat {
  module: number;
  module_title: string;
  total_students_started: number;
  students_completed: number;
  average_completion_percent: number;
  average_module_score: number;
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

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

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
        setTaskStats(toList<TaskStat>(taskResp.data));
        setModuleStats(toList<ModuleStat>(moduleResp.data));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const reportSummary = React.useMemo(() => {
    const totals = taskStats.reduce(
      (acc, item) => ({
        submissions: acc.submissions + item.total_submissions,
        successful: acc.successful + item.successful_submissions,
        partial: acc.partial + item.partial_submissions,
        failed: acc.failed + item.failed_submissions,
        attemptsWeight: acc.attemptsWeight + item.average_attempts * item.total_submissions,
        scoreWeight: acc.scoreWeight + item.average_score * item.total_submissions,
      }),
      {
        submissions: 0,
        successful: 0,
        partial: 0,
        failed: 0,
        attemptsWeight: 0,
        scoreWeight: 0,
      }
    );

    const successRate = totals.submissions ? (totals.successful / totals.submissions) * 100 : 0;
    const partialRate = totals.submissions ? (totals.partial / totals.submissions) * 100 : 0;
    const failedRate = totals.submissions ? (totals.failed / totals.submissions) * 100 : 0;
    const averageAttempts = totals.submissions ? totals.attemptsWeight / totals.submissions : 0;
    const averageScore = totals.submissions ? totals.scoreWeight / totals.submissions : 0;

    return {
      submissions: totals.submissions,
      successRate,
      partialRate,
      failedRate,
      averageAttempts,
      averageScore,
    };
  }, [taskStats]);

  const taskChartData = React.useMemo(
    () =>
      taskStats.slice(0, 8).map((item) => ({
        name: item.task_title,
        success: item.success_rate,
        partial: item.partial_rate,
        failed: Math.max(0, 100 - item.success_rate - item.partial_rate),
      })),
    [taskStats]
  );

  if (loading) {
    return <div className="text-slate-700">Loading teacher analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Teacher Panel</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="app-card p-5">
          <p className="text-xs text-slate-500">Total submissions</p>
          <p className="text-3xl font-semibold text-slate-900 mt-1">{reportSummary.submissions}</p>
        </div>
        <div className="app-card p-5">
          <p className="text-xs text-slate-500">Success rate</p>
          <p className="text-3xl font-semibold text-slate-900 mt-1">{formatPercent(reportSummary.successRate)}</p>
        </div>
        <div className="app-card p-5">
          <p className="text-xs text-slate-500">Average attempts</p>
          <p className="text-3xl font-semibold text-slate-900 mt-1">{reportSummary.averageAttempts.toFixed(2)}</p>
        </div>
        <div className="app-card p-5">
          <p className="text-xs text-slate-500">Average score</p>
          <p className="text-3xl font-semibold text-slate-900 mt-1">{reportSummary.averageScore.toFixed(1)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="app-card p-5">
          <p className="text-xs text-slate-500">Successful answers</p>
          <p className="text-2xl font-semibold text-emerald-700 mt-1">
            {formatPercent(reportSummary.successRate)}
          </p>
        </div>
        <div className="app-card p-5">
          <p className="text-xs text-slate-500">Partial answers</p>
          <p className="text-2xl font-semibold text-amber-600 mt-1">
            {formatPercent(reportSummary.partialRate)}
          </p>
        </div>
        <div className="app-card p-5">
          <p className="text-xs text-slate-500">Failed answers</p>
          <p className="text-2xl font-semibold text-rose-700 mt-1">
            {formatPercent(reportSummary.failedRate)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="app-card p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Task success breakdown</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="task_title" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="success" fill="#059669" name="Correct" />
                <Bar dataKey="partial" fill="#d97706" name="Partial" />
                <Bar dataKey="failed" fill="#e11d48" name="Incorrect" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="app-card p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Module completion</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="module_title" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="average_completion_percent" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="app-card p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Test statistics table</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-4 font-medium">Task</th>
                <th className="py-2 pr-4 font-medium">Submissions</th>
                <th className="py-2 pr-4 font-medium">Correct</th>
                <th className="py-2 pr-4 font-medium">Partial</th>
                <th className="py-2 pr-4 font-medium">Incorrect</th>
                <th className="py-2 pr-4 font-medium">Avg attempts</th>
                <th className="py-2 pr-4 font-medium">Avg score</th>
              </tr>
            </thead>
            <tbody>
              {taskStats.map((item) => (
                <tr key={item.task} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pr-4 text-slate-900 font-medium">{item.task_title}</td>
                  <td className="py-3 pr-4 text-slate-700">{item.total_submissions}</td>
                  <td className="py-3 pr-4 text-emerald-700">{item.successful_submissions}</td>
                  <td className="py-3 pr-4 text-amber-600">{item.partial_submissions}</td>
                  <td className="py-3 pr-4 text-rose-700">{item.failed_submissions}</td>
                  <td className="py-3 pr-4 text-slate-700">{item.average_attempts.toFixed(2)}</td>
                  <td className="py-3 pr-4 text-slate-700">{item.average_score.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardPage;
