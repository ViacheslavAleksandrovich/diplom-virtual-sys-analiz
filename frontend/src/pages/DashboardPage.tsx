import React from "react";
import { useAuth } from "../store/authStore";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import apiService from "../services/api";

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
  status: "pending" | "correct" | "partial" | "incorrect";
  points_earned: number;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  bonus_points: number;
}

interface LearningRecommendation {
  module?: number;
  module_title?: string;
  message: string;
}

const RARITY_COLORS: Record<string, string> = {
  common: "text-slate-600 bg-slate-100 border-slate-200",
  rare: "text-blue-700 bg-blue-50 border-blue-200",
  epic: "text-purple-700 bg-purple-50 border-purple-200",
  legendary: "text-amber-700 bg-amber-50 border-amber-300",
};

const toList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && "results" in payload)
    return (payload as { results?: T[] }).results || [];
  return [];
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = React.useState<StudentStats | null>(null);
  const [ranking, setRanking] = React.useState<RankingRow | null>(null);
  const [results, setResults] = React.useState<ResultRow[]>([]);
  const [achievements, setAchievements] = React.useState<Achievement[]>([]);
  const [recommendations, setRecommendations] = React.useState<
    LearningRecommendation[]
  >([]);
  const [firstModuleId, setFirstModuleId] = React.useState<number | null>(null);
  const [firstTaskId, setFirstTaskId] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      if (!user) return;

      if (user.role !== "student") {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [statsResp, rankingResp, resultsResp, modulesResp] =
          await Promise.all([
            apiService.getMyStatistics(),
            apiService.getMyRanking(),
            apiService.getResults(),
            apiService.getModules(),
          ]);

        setStats(statsResp.data);
        setRanking(rankingResp.data);
        setResults(toList<ResultRow>(resultsResp.data));

        const modules = toList<{ id: number }>(modulesResp.data);
        const moduleId = modules[0]?.id || null;
        setFirstModuleId(moduleId);

        if (moduleId) {
          const tasksResp = await apiService.getTaskList({ module: moduleId });
          const tasks = toList<{ id: number }>(tasksResp.data);
          setFirstTaskId(tasks[0]?.id || null);
        }

        apiService
          .getMyAchievements()
          .then((resp) => {
            setAchievements(toList<Achievement>(resp.data));
          })
          .catch(() => undefined);

        apiService
          .getLearningPath()
          .then((resp) => {
            const data = resp.data;
            if (Array.isArray(data)) setRecommendations(data);
            else if (
              data &&
              typeof data === "object" &&
              "recommendations" in data
            )
              setRecommendations(
                toList<LearningRecommendation>(
                  (data as { recommendations?: unknown }).recommendations,
                ),
              );
          })
          .catch(() => undefined);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const derivedStats = React.useMemo(() => {
    const completedTasks = results.filter(
      (r) => r.status === "correct" || r.status === "partial",
    ).length;
    const totalPoints = results.reduce(
      (sum, r) => sum + (r.points_earned || 0),
      0,
    );
    const successRate = results.length
      ? Math.round((completedTasks / results.length) * 100)
      : 0;
    return {
      total_tasks_completed: stats?.total_tasks_completed ?? completedTasks,
      total_points_earned: stats?.total_points_earned ?? totalPoints,
      success_rate: stats?.success_rate ?? successRate,
      average_score: stats?.average_score ?? 0,
      total_learning_hours: stats?.total_learning_hours ?? 0,
    };
  }, [results, stats]);

  if (loading) {
    return <div className="text-slate-700">Loading dashboard…</div>;
  }

  if (user?.role === "teacher" || user?.role === "admin") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-slate-700">
          Use role-specific workspace:{" "}
          {user.role === "admin" ? (
            <Link
              to="/admin"
              className="text-indigo-700 font-medium hover:underline"
            >
              Admin panel
            </Link>
          ) : (
            <Link
              to="/teacher"
              className="text-indigo-700 font-medium hover:underline"
            >
              Teacher panel
            </Link>
          )}
        </p>
      </div>
    );
  }

  const chartData = [
    { name: "Completed", value: derivedStats.total_tasks_completed },
    { name: "Points", value: derivedStats.total_points_earned },
    { name: "Success %", value: Math.round(derivedStats.success_rate) },
    { name: "Avg score", value: Math.round(derivedStats.average_score) },
  ];

  const xpPercent = Math.min(100, (ranking?.experience_points ?? 0) % 100);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="app-card p-6 bg-gradient-to-r from-indigo-700 to-indigo-500 text-black border-0 shadow-lg">
        <h1 className="text-2xl font-semibold ">Student Dashboard</h1>
        <p className="mt-1 text-black">
          Welcome, <strong>{user?.full_name || user?.username}</strong>. Keep
          learning!
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to={firstModuleId ? `/modules/${firstModuleId}` : "/dashboard"}
            className="rounded-lg bg-white/20 px-3 py-2 text-sm hover:bg-white/30 text-black transition-colors"
          >
            Open theory
          </Link>
          <Link
            to={firstTaskId ? `/tasks/${firstTaskId}` : "/dashboard"}
            className="rounded-lg bg-white/20 px-3 py-2 text-sm hover:bg-white/30 text-black transition-colors"
          >
            Solve tasks
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="app-card p-5">
          <p className="text-xs text-slate-500">Completed tasks</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {derivedStats.total_tasks_completed}
          </p>
        </div>
        <div className="app-card p-5">
          <p className="text-xs text-slate-500">Total points</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {derivedStats.total_points_earned}
          </p>
        </div>
        <div className="app-card p-5">
          <p className="text-xs text-slate-500">Success rate</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {derivedStats.success_rate}%
          </p>
        </div>
        <div className="app-card p-5">
          <p className="text-xs text-slate-500">Learning hours</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {derivedStats.total_learning_hours}h
          </p>
        </div>
      </div>

      {/* Ranking + XP bar */}
      {ranking && (
        <div className="app-card p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs text-slate-500">Rank</p>
              <p className="text-2xl font-bold text-indigo-700">
                Level {ranking.level}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Total points</p>
              <p className="text-2xl font-bold text-slate-900">
                {ranking.total_points}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Achievements</p>
              <p className="text-2xl font-bold text-amber-600">
                {ranking.achievements_count} 🏆
              </p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>XP progress</span>
              <span>{ranking.experience_points % 100}/100 XP</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Progress chart */}
      <div className="app-card p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">
          Progress overview
        </h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="app-card p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">
            Achievements 🏆
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`rounded-lg border px-4 py-3 ${RARITY_COLORS[ach.rarity] || RARITY_COLORS.common}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm">{ach.title}</p>
                  <span className="text-xs capitalize px-1.5 py-0.5 rounded border border-current opacity-70 shrink-0">
                    {ach.rarity}
                  </span>
                </div>
                <p className="text-xs mt-1 opacity-80">{ach.description}</p>
                {ach.bonus_points > 0 && (
                  <p className="text-xs mt-1 font-medium">
                    +{ach.bonus_points} pts
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning path */}
      {recommendations.length > 0 && (
        <div className="app-card p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">
            Recommendations 💡
          </h2>
          <ul className="space-y-2">
            {recommendations.map((rec, idx) => (
              <li
                key={idx}
                className="flex gap-3 rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3"
              >
                <span className="mt-0.5 text-indigo-400">→</span>
                <div>
                  {rec.module_title && (
                    <p className="text-xs font-semibold text-indigo-700 mb-0.5">
                      {rec.module_title}
                    </p>
                  )}
                  <p className="text-sm text-slate-700">{rec.message}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
