import React, { useMemo, useState } from 'react';

interface TaskRunnerProps {
  task: {
    id: number;
    title: string;
    task_type: 'multiple_choice' | 'text_answer' | 'calculation' | 'matrix' | 'hierarchy';
    condition_text: string;
  };
  onSubmit: (answer: Record<string, unknown>, usingHint: boolean) => Promise<void>;
  isSubmitting: boolean;
}

const TaskRunner: React.FC<TaskRunnerProps> = ({ task, onSubmit, isSubmitting }) => {
  const [textAnswer, setTextAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [numericAnswer, setNumericAnswer] = useState('');
  const [matrixJson, setMatrixJson] = useState('[[1,2],[0.5,1]]');
  const [nodesJson, setNodesJson] = useState('[{"id":"goal"},{"id":"alt1"}]');
  const [edgesJson, setEdgesJson] = useState('[{"source":"goal","target":"alt1"}]');
  const [isUsingHint, setIsUsingHint] = useState(false);
  const [error, setError] = useState('');

  const multipleChoiceOptions = useMemo(() => ['A', 'B', 'C', 'D'], []);

  const buildPayload = (): Record<string, unknown> => {
    switch (task.task_type) {
      case 'multiple_choice':
        return { selected: selectedOption };
      case 'text_answer':
        return { text: textAnswer };
      case 'calculation':
        return { value: Number(numericAnswer) };
      case 'matrix':
        return { matrix: JSON.parse(matrixJson) };
      case 'hierarchy':
        return { nodes: JSON.parse(nodesJson), edges: JSON.parse(edgesJson) };
      default:
        return {};
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      const payload = buildPayload();
      await onSubmit(payload, isUsingHint);
    } catch {
      setError('Failed to submit answer. Check input format and try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="app-card p-6 space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">{task.title}</h2>

      <div
        className="prose max-w-none text-slate-800"
        dangerouslySetInnerHTML={{ __html: task.condition_text }}
      />

      {task.task_type === 'multiple_choice' && (
        <div className="grid grid-cols-2 gap-2">
          {multipleChoiceOptions.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="option"
                value={option}
                checked={selectedOption === option}
                onChange={(e) => setSelectedOption(e.target.value)}
              />
              Option {option}
            </label>
          ))}
        </div>
      )}

      {task.task_type === 'text_answer' && (
        <textarea
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          className="w-full min-h-24 border border-slate-300 rounded-md px-3 py-2"
          placeholder="Type your answer"
        />
      )}

      {task.task_type === 'calculation' && (
        <input
          type="number"
          step="0.0001"
          value={numericAnswer}
          onChange={(e) => setNumericAnswer(e.target.value)}
          className="w-full border border-slate-300 rounded-md px-3 py-2"
          placeholder="Enter calculated value"
        />
      )}

      {task.task_type === 'matrix' && (
        <div>
          <label className="block text-sm text-slate-700 mb-1">Matrix JSON</label>
          <textarea
            value={matrixJson}
            onChange={(e) => setMatrixJson(e.target.value)}
            className="w-full min-h-28 border border-slate-300 rounded-md px-3 py-2 font-mono text-sm"
          />
        </div>
      )}

      {task.task_type === 'hierarchy' && (
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm text-slate-700 mb-1">Nodes JSON</label>
            <textarea
              value={nodesJson}
              onChange={(e) => setNodesJson(e.target.value)}
              className="w-full min-h-24 border border-slate-300 rounded-md px-3 py-2 font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">Edges JSON</label>
            <textarea
              value={edgesJson}
              onChange={(e) => setEdgesJson(e.target.value)}
              className="w-full min-h-24 border border-slate-300 rounded-md px-3 py-2 font-mono text-sm"
            />
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={isUsingHint}
          onChange={(e) => setIsUsingHint(e.target.checked)}
        />
        I used a hint
      </label>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-indigo-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
      >
        {isSubmitting ? 'Submitting...' : 'Submit answer'}
      </button>
    </form>
  );
};

export default TaskRunner;
