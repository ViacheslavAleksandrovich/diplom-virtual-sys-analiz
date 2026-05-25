import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import apiService from "../services/api";

// ──────────────── Types ────────────────

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
interface CourseModule {
  id: number;
  title: string;
}
interface TaskItem {
  id: number;
  module: number;
  module_title?: string;
  title: string;
  task_type: string;
  difficulty_level: number;
  points: number;
  condition_text: string;
  reference_answer?: unknown;
  explanation?: string;
  options?: unknown;
  tolerance?: number;
  order_number?: number;
  is_active?: boolean;
}

type Tab = "analytics" | "tasks";

const TASK_TYPES = [
  "text",
  "numeric",
  "multiple_choice",
  "classification",
  "matching",
];
const DIFFICULTY = [1, 2, 3, 4, 5];

const toList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && "results" in payload)
    return (payload as { results?: T[] }).results || [];
  return [];
};

const formatPercent = (v: number) => `${v.toFixed(1)}%`;

// ──────────────── Task form modal ────────────────

interface TaskFormProps {
  initial?: Partial<TaskItem>;
  modules: CourseModule[];
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}

const BLANK: Partial<TaskItem> = {
  title: "",
  task_type: "text",
  difficulty_level: 1,
  points: 10,
  condition_text: "",
  explanation: "",
  order_number: 1,
  tolerance: 0,
};

const TaskForm: React.FC<TaskFormProps> = ({
  initial = BLANK,
  modules,
  onSave,
  onClose,
}) => {
  const [form, setForm] = useState<Partial<TaskItem>>({ ...BLANK, ...initial });
  const [refAnswerRaw, setRefAnswerRaw] = useState(
    initial.reference_answer
      ? JSON.stringify(initial.reference_answer, null, 2)
      : "",
  );
  const [optionsRaw, setOptionsRaw] = useState(
    initial.options ? JSON.stringify(initial.options, null, 2) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof TaskItem, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.module) {
      setError("Select a module");
      return;
    }
    if (!form.title?.trim()) {
      setError("Enter task title");
      return;
    }
    if (!form.condition_text?.trim()) {
      setError("Enter task condition");
      return;
    }

    let reference_answer: unknown = undefined;
    let options: unknown = undefined;
    try {
      if (refAnswerRaw.trim()) reference_answer = JSON.parse(refAnswerRaw);
    } catch {
      setError("Reference answer: invalid JSON");
      return;
    }
    try {
      if (optionsRaw.trim()) options = JSON.parse(optionsRaw);
    } catch {
      setError("Answer options: invalid JSON");
      return;
    }

    setSaving(true);
    try {
      await onSave({ ...form, reference_answer, options });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save error";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            {initial.id ? "Edit task" : "New task"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Module *
              </label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.module ?? ""}
                onChange={(e) => set("module", Number(e.target.value))}
              >
                <option value="">— Select —</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Task type *
              </label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.task_type ?? "text"}
                onChange={(e) => set("task_type", e.target.value)}
              >
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Title *
            </label>
            <input
              type="text"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.title ?? ""}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Task condition *
            </label>
            <textarea
              rows={4}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
              value={form.condition_text ?? ""}
              onChange={(e) => set("condition_text", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Difficulty
              </label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.difficulty_level ?? 1}
                onChange={(e) =>
                  set("difficulty_level", Number(e.target.value))
                }
              >
                {DIFFICULTY.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Points
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.points ?? 10}
                onChange={(e) => set("points", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Order #
              </label>
              <input
                type="number"
                min={1}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.order_number ?? 1}
                onChange={(e) => set("order_number", Number(e.target.value))}
              />
            </div>
          </div>

          {form.task_type === "numeric" && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Tolerance
              </label>
              <input
                type="number"
                min={0}
                step="any"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.tolerance ?? 0}
                onChange={(e) => set("tolerance", Number(e.target.value))}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Reference answer (JSON)
            </label>
            <textarea
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
              placeholder='Напр.: "текст відповіді" або {"key": "value"}'
              value={refAnswerRaw}
              onChange={(e) => setRefAnswerRaw(e.target.value)}
            />
          </div>

          {form.task_type === "multiple_choice" && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Answer options (JSON)
              </label>
              <textarea
                rows={4}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
                placeholder={
                  '[{"key":"A","text":"Option A"},{"key":"B","text":"Option B"}]'
                }
                value={optionsRaw}
                onChange={(e) => setOptionsRaw(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Explanation / demo solution
            </label>
            <textarea
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
              placeholder="Shown to student after 3 failed attempts (practice mode)"
              value={form.explanation ?? ""}
              onChange={(e) => set("explanation", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active !== false}
              onChange={(e) => set("is_active", e.target.checked)}
              className="rounded"
            />
            <label htmlFor="is_active" className="text-sm text-slate-700">
              Active (visible to students)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ──────────────── Main page ────────────────

const TeacherDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("analytics");

  // Analytics state
  const [taskStats, setTaskStats] = useState<TaskStat[]>([]);
  const [moduleStats, setModuleStats] = useState<ModuleStat[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Task management state
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | undefined>();
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Load analytics
  useEffect(() => {
    Promise.all([
      apiService.getTaskStatistics(),
      apiService.getModuleStatistics(),
    ])
      .then(([tr, mr]) => {
        setTaskStats(toList<TaskStat>(tr.data));
        setModuleStats(toList<ModuleStat>(mr.data));
      })
      .finally(() => setAnalyticsLoading(false));
  }, []);

  // Load task management data
  const loadTasks = useCallback(() => {
    setTasksLoading(true);
    Promise.all([
      apiService.get("/courses/tasks/"),
      apiService.get("/courses/modules/"),
    ])
      .then(([tr, mr]) => {
        setTasks(toList<TaskItem>(tr.data));
        setModules(toList<CourseModule>(mr.data));
      })
      .finally(() => setTasksLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === "tasks") loadTasks();
  }, [activeTab, loadTasks]);

  // Analytics summary
  const reportSummary = useMemo(() => {
    const totals = taskStats.reduce(
      (acc, item) => ({
        submissions: acc.submissions + item.total_submissions,
        successful: acc.successful + item.successful_submissions,
        partial: acc.partial + item.partial_submissions,
        failed: acc.failed + item.failed_submissions,
        attemptsWeight:
          acc.attemptsWeight + item.average_attempts * item.total_submissions,
        scoreWeight:
          acc.scoreWeight + item.average_score * item.total_submissions,
      }),
      {
        submissions: 0,
        successful: 0,
        partial: 0,
        failed: 0,
        attemptsWeight: 0,
        scoreWeight: 0,
      },
    );
    const s = totals.submissions || 1;
    return {
      submissions: totals.submissions,
      successRate: (totals.successful / s) * 100,
      partialRate: (totals.partial / s) * 100,
      failedRate: (totals.failed / s) * 100,
      averageAttempts: totals.attemptsWeight / s,
      averageScore: totals.scoreWeight / s,
    };
  }, [taskStats]);

  const taskChartData = useMemo(
    () =>
      taskStats.slice(0, 8).map((item) => ({
        name: item.task_title,
        success: item.success_rate,
        partial: item.partial_rate,
        failed: Math.max(0, 100 - item.success_rate - item.partial_rate),
      })),
    [taskStats],
  );

  // Task CRUD handlers
  const handleSaveTask = async (data: Record<string, unknown>) => {
    if (editingTask) {
      await apiService.updateTask(editingTask.id, data);
    } else {
      await apiService.createTask(data);
    }
    loadTasks();
  };

  const handleDelete = async (id: number) => {
    await apiService.deleteTask(id);
    setDeleteConfirmId(null);
    loadTasks();
  };

  const difficultyLabel = (d: number) =>
    ["", "⭐ Easy", "⭐⭐ Medium", "⭐⭐⭐ Hard", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"][
      d
    ] ?? d;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="app-card p-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Teacher Panel</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "analytics"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "tasks"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            📋 Tasks
          </button>
        </div>
      </div>

      {/* ── Analytics tab ── */}
      {activeTab === "analytics" &&
        (analyticsLoading ? (
          <div className="text-slate-600 p-4">Loading analytics...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                {
                  label: "Total submissions",
                  value: reportSummary.submissions,
                },
                {
                  label: "Success rate",
                  value: formatPercent(reportSummary.successRate),
                },
                {
                  label: "Avg attempts",
                  value: reportSummary.averageAttempts.toFixed(2),
                },
                {
                  label: "Average score",
                  value: reportSummary.averageScore.toFixed(1),
                },
              ].map(({ label, value }) => (
                <div key={label} className="app-card p-5">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-3xl font-semibold text-slate-900 mt-1">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="app-card p-5">
                <p className="text-xs text-slate-500">✅ Correct answers</p>
                <p className="text-2xl font-semibold text-emerald-700 mt-1">
                  {formatPercent(reportSummary.successRate)}
                </p>
              </div>
              <div className="app-card p-5">
                <p className="text-xs text-slate-500">⚠️ Partial answers</p>
                <p className="text-2xl font-semibold text-amber-600 mt-1">
                  {formatPercent(reportSummary.partialRate)}
                </p>
              </div>
              <div className="app-card p-5">
                <p className="text-xs text-slate-500">❌ Incorrect answers</p>
                <p className="text-2xl font-semibold text-rose-700 mt-1">
                  {formatPercent(reportSummary.failedRate)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="app-card p-5">
                <h2 className="text-sm font-semibold text-slate-800 mb-3">
                  Task results breakdown
                </h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={taskChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" hide />
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
                <h2 className="text-sm font-semibold text-slate-800 mb-3">
                  Module completion
                </h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moduleStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="module_title" hide />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="average_completion_percent"
                        fill="#2563eb"
                        name="% completion"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="app-card p-5">
              <h2 className="text-sm font-semibold text-slate-800 mb-4">
                Task statistics
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      {[
                         "Task",
                        "Submissions",
                        "✅ Correct",
                        "⚠️ Partial",
                        "❌ Incorrect",
                        "Avg attempts",
                        "Avg score",
                      ].map((h) => (
                        <th key={h} className="py-2 pr-4 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {taskStats.map((item) => (
                      <tr
                        key={item.task}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-3 pr-4 text-slate-900 font-medium">
                          {item.task_title}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {item.total_submissions}
                        </td>
                        <td className="py-3 pr-4 text-emerald-700">
                          {item.successful_submissions}
                        </td>
                        <td className="py-3 pr-4 text-amber-600">
                          {item.partial_submissions}
                        </td>
                        <td className="py-3 pr-4 text-rose-700">
                          {item.failed_submissions}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {item.average_attempts.toFixed(2)}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {item.average_score.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ))}

      {/* ── Tasks tab ── */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {tasks.length} tasks in database
            </p>
            <button
              onClick={() => {
                setEditingTask(undefined);
                setTaskFormOpen(true);
              }}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              + Create task
            </button>
          </div>

          {tasksLoading ? (
            <div className="text-slate-600 p-4">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="app-card p-8 text-center text-slate-500">
              <p className="text-4xl mb-2">📝</p>
              <p>No tasks yet. Create the first one!</p>
            </div>
          ) : (
            <div className="app-card overflow-hidden">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-slate-500">
                    <th className="py-3 px-5 font-medium">Title</th>
                    <th className="py-3 px-4 font-medium">Module</th>
                    <th className="py-3 px-4 font-medium">Type</th>
                    <th className="py-3 px-4 font-medium">Difficulty</th>
                    <th className="py-3 px-4 font-medium text-right">Points</th>
                    <th className="py-3 px-4 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-5">
                        <span className="text-slate-900 font-medium">
                          {task.title}
                        </span>
                        {!task.is_active && (
                          <span className="ml-2 text-xs bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {task.module_title ?? `#${task.module}`}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                          {task.task_type}
                        </code>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {difficultyLabel(task.difficulty_level)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-indigo-700">
                        {task.points}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setEditingTask(task);
                              setTaskFormOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(task.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium hover:bg-rose-100"
                          >
                            🗑️ Del.
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Task form modal */}
      {taskFormOpen && (
        <TaskForm
          initial={editingTask}
          modules={modules}
          onSave={handleSaveTask}
          onClose={() => {
            setTaskFormOpen(false);
            setEditingTask(undefined);
          }}
        />
      )}

      {/* Delete confirm dialog */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-semibold text-slate-900">
              Delete task?
            </h3>
            <p className="text-sm text-slate-600">
              This action is irreversible. Student results for this task will be
              preserved.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboardPage;
