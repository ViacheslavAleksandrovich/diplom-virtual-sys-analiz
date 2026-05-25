import React, { useEffect, useState } from "react";
import apiService from "../services/api";

interface RankEntry {
  id: number;
  student: number;
  student_name: string;
  student_email?: string;
  total_points: number;
  rank?: number;
  achievements_count?: number;
}

const toList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && "results" in payload)
    return (payload as { results?: T[] }).results || [];
  return [];
};

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

const LeaderboardPage: React.FC = () => {
  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [myRank, setMyRank] = useState<RankEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiService.getRanking(), apiService.getMyRanking()])
      .then(([rankRes, myRes]) => {
        setRanking(toList<RankEntry>(rankRes.data));
        setMyRank((myRes.data as RankEntry) ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="text-slate-600 p-4">Loading leaderboard...</div>;

  const top3 = ranking.slice(0, 3);

  // Enrich entries with positional rank (API doesn't provide it)
  const ranked = ranking.map((entry, idx) => ({
    ...entry,
    rank: entry.rank ?? idx + 1,
  }));
  const top3Ranked = ranked.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="app-card p-5">
        <h1 className="text-2xl font-semibold text-slate-900">
          🏆 Student Leaderboard
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Overall ranking by earned points
        </p>
      </div>

      {/* Top-3 podium */}
      {top3Ranked.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[top3Ranked[1], top3Ranked[0], top3Ranked[2]]
            .filter(Boolean)
            .map((entry) => {
              const isFirst = entry.rank === 1;
              return (
                <div
                  key={entry.id}
                  className={`app-card p-5 text-center flex flex-col items-center gap-2 ${
                    isFirst ? "ring-2 ring-amber-400 bg-amber-50" : ""
                  }`}
                >
                  <span className="text-4xl">{MEDAL[entry.rank] ?? "🏅"}</span>
                  <span
                    className={`text-sm font-semibold ${isFirst ? "text-amber-800" : "text-slate-800"}`}
                  >
                    {entry.student_name || `Student #${entry.student}`}
                  </span>
                  <span
                    className={`text-2xl font-bold ${isFirst ? "text-amber-700" : "text-indigo-700"}`}
                  >
                    {entry.total_points}
                  </span>
                  <span className="text-xs text-slate-500">pts</span>
                  {entry.achievements_count != null && (
                    <span className="text-xs text-slate-500">
                      🏅 {entry.achievements_count} achievements
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* My rank card */}
      {myRank && (
        <div className="rounded-xl border-2 border-indigo-300 bg-indigo-50 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-indigo-600 font-medium uppercase tracking-wider">
              Your rank
            </p>
            <p className="text-slate-900 font-semibold mt-0.5">
              {myRank.student_name || `Student #${myRank.student}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-indigo-600">{myRank.total_points} pts</p>
          </div>
        </div>
      )}

      {/* Full table */}
      <div className="app-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">
            Full leaderboard
          </h2>
        </div>
        {ranking.length === 0 ? (
          <p className="text-slate-500 p-5">No rankings yet.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="py-3 px-5 font-medium">Rank</th>
                <th className="py-3 px-4 font-medium">Student</th>
                <th className="py-3 px-4 font-medium text-right">Points</th>
                <th className="py-3 px-4 font-medium text-right">
                  Achievements
                </th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((entry) => (
                <tr
                  key={entry.id}
                  className={`border-b border-slate-50 last:border-0 transition-colors ${
                    myRank?.student === entry.student
                      ? "bg-indigo-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <td className="py-3 px-5 font-semibold">
                    {MEDAL[entry.rank] ? (
                      <span>
                        {MEDAL[entry.rank]} {entry.rank}
                      </span>
                    ) : (
                      <span className="text-slate-600">{entry.rank}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-900">
                    {entry.student_name || `Student #${entry.student}`}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-indigo-700">
                    {entry.total_points}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500">
                    {entry.achievements_count ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
