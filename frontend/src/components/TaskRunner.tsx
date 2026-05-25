import React, { useCallback, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import AHPMatrix from "./AHPMatrix";

interface TaskOption {
  key: string;
  text: string;
}

interface TaskRunnerProps {
  task: {
    id: number;
    title: string;
    task_type:
      | "multiple_choice"
      | "text_answer"
      | "calculation"
      | "matrix"
      | "hierarchy";
    condition_text: string;
    /** Optional structured options for multiple_choice tasks */
    options?: TaskOption[];
  };
  onSubmit: (
    answer: Record<string, unknown>,
    usingHint: boolean,
  ) => Promise<void>;
  isSubmitting: boolean;
  /** Learning phase — 'assess' disables hints */
  phase?: "practice" | "assess";
}

const safeHtml = (raw: string) =>
  DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });

const TaskRunner: React.FC<TaskRunnerProps> = ({
  task,
  onSubmit,
  isSubmitting,
  phase = "practice",
}) => {
  const [textAnswer, setTextAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [numericAnswer, setNumericAnswer] = useState("");
  const [matrixSize, setMatrixSize] = useState(3);
  const [matrixData, setMatrixData] = useState<number[][]>([]);
  const [nodesJson, setNodesJson] = useState(
    '[{"id":"goal"},{"id":"alt1"},{"id":"alt2"}]',
  );
  const [edgesJson, setEdgesJson] = useState(
    '[{"source":"goal","target":"alt1"},{"source":"goal","target":"alt2"}]',
  );
  const [isUsingHint, setIsUsingHint] = useState(false);
  const [error, setError] = useState("");

  // Use options from task data if available, otherwise fallback A/B/C/D
  const multipleChoiceOptions: TaskOption[] = useMemo(() => {
    if (task.options && task.options.length > 0) return task.options;
    return ["A", "B", "C", "D"].map((key) => ({ key, text: `Option ${key}` }));
  }, [task.options]);

  const handleMatrixChange = useCallback((m: number[][]) => {
    setMatrixData(m);
  }, []);

  const buildPayload = (): Record<string, unknown> => {
    switch (task.task_type) {
      case "multiple_choice":
        return { selected: selectedOption };
      case "text_answer":
        return { text: textAnswer.trim() };
      case "calculation": {
        const num = parseFloat(numericAnswer);
        if (isNaN(num)) throw new Error("Please enter a valid number.");
        return { value: num };
      }
      case "matrix":
        if (matrixData.length === 0)
          throw new Error("Matrix is not configured.");
        return { matrix: matrixData };
      case "hierarchy": {
        const nodes = JSON.parse(nodesJson);
        const edges = JSON.parse(edgesJson);
        return { nodes, edges };
      }
      default:
        return {};
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    // Basic validation per type
    if (task.task_type === "multiple_choice" && !selectedOption) {
      setError("Please select an answer option.");
      return;
    }
    if (task.task_type === "text_answer" && !textAnswer.trim()) {
      setError("Please enter your answer.");
      return;
    }
    if (task.task_type === "calculation" && !numericAnswer) {
      setError("Please enter a numeric value.");
      return;
    }

    try {
      const payload = buildPayload();
      await onSubmit(payload, isUsingHint);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : "Failed to submit. Check input and try again.";
      setError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="app-card p-6 space-y-5">
      <div
        className="prose max-w-none text-slate-800"
        dangerouslySetInnerHTML={{ __html: safeHtml(task.condition_text) }}
      />

      {/* Multiple choice */}
      {task.task_type === "multiple_choice" && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-slate-700 mb-2">
            Select one option:
          </legend>
          {multipleChoiceOptions.map((opt) => (
            <label
              key={opt.key}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                selectedOption === opt.key
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="option"
                value={opt.key}
                checked={selectedOption === opt.key}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="accent-indigo-600"
              />
              <span className="text-sm text-slate-800">{opt.text}</span>
            </label>
          ))}
        </fieldset>
      )}

      {/* Text answer */}
      {task.task_type === "text_answer" && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Your answer:
          </label>
          <textarea
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            className="w-full min-h-28 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            placeholder="Type your answer here…"
          />
        </div>
      )}

      {/* Calculation */}
      {task.task_type === "calculation" && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Calculated value:
          </label>
          <input
            type="number"
            step="0.0001"
            value={numericAnswer}
            onChange={(e) => setNumericAnswer(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400"
            placeholder="e.g. 3.14"
          />
          <p className="mt-1 text-xs text-slate-500">
            Allowed tolerance: ±0.01
          </p>
        </div>
      )}

      {/* AHP Matrix */}
      {task.task_type === "matrix" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-slate-700">
              Matrix size:
            </label>
            <select
              value={matrixSize}
              onChange={(e) => setMatrixSize(Number(e.target.value))}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-400"
            >
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}×{n}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500">
              alternatives (C1…C{matrixSize})
            </span>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/60">
            <p className="text-xs font-semibold text-indigo-700 mb-3 uppercase tracking-wider">
              Pairwise comparison matrix (AHP)
            </p>
            <AHPMatrix size={matrixSize} onMatrixChange={handleMatrixChange} />
          </div>
        </div>
      )}

      {/* Hierarchy builder */}
      {task.task_type === "hierarchy" && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">
            Hierarchy structure (JSON):
          </p>
          <div>
            <label className="block text-xs text-slate-600 mb-1">
              Nodes — list of objects with <code>id</code> and optional{" "}
              <code>label</code>:
            </label>
            <textarea
              value={nodesJson}
              onChange={(e) => setNodesJson(e.target.value)}
              className="w-full min-h-24 border border-slate-300 rounded-lg px-3 py-2 font-mono text-xs focus:ring-2 focus:ring-indigo-400"
              placeholder='[{"id":"goal","label":"Goal"},{"id":"alt1","label":"Alternative 1"}]'
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">
              Edges — list of objects with <code>source</code> and{" "}
              <code>target</code>:
            </label>
            <textarea
              value={edgesJson}
              onChange={(e) => setEdgesJson(e.target.value)}
              className="w-full min-h-24 border border-slate-300 rounded-lg px-3 py-2 font-mono text-xs focus:ring-2 focus:ring-indigo-400"
              placeholder='[{"source":"goal","target":"alt1"}]'
            />
          </div>
        </div>
      )}

      {/* Hint toggle — disabled in assess mode */}
      {phase === "assess" ? (
        <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
          🎯 Режим оцінювання: підказки заборонені.
        </div>
      ) : (
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isUsingHint}
            onChange={(e) => setIsUsingHint(e.target.checked)}
            className="accent-amber-500"
          />
          I used the hint.
          {isUsingHint && (
            <span className="text-xs text-amber-600">
              (score multiplier ×0.8)
            </span>
          )}
        </label>
      )}

      {error && (
        <div
          className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-indigo-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
      >
        {isSubmitting ? "Sending…" : "Send reply"}
      </button>
    </form>
  );
};

export default TaskRunner;
