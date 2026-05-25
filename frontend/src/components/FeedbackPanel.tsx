import React from 'react';

interface FeedbackResult {
  status: string;
  score: number;
  points_earned: number;
  feedback: string;
  attempts_count: number;
  is_using_hint?: boolean;
  explanation?: string;
}

interface FeedbackPanelProps {
  result: FeedbackResult | null;
  phase?: 'practice' | 'assess';
}

const STATUS_MAP: Record<string, { label: string; cls: string; icon: string }> = {
  correct:   { label: 'Correct',        cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: '✅' },
  partial:   { label: 'Partially correct',   cls: 'text-amber-700 bg-amber-50 border-amber-200',       icon: '⚠️' },
  incorrect: { label: 'Incorrect',      cls: 'text-red-700 bg-red-50 border-red-200',             icon: '❌' },
  pending:   { label: 'Pending check', cls: 'text-slate-700 bg-slate-50 border-slate-200',       icon: '⏳' },
};

const SCORE_RULES = [
  { attempts: '1st attempt', multiplier: '×1.0 (100%)' },
  { attempts: '2nd attempt', multiplier: '×0.7 (70%)' },
  { attempts: '3rd+',       multiplier: '×0.5 (50%)' },
];

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ result, phase }) => {
  if (!result) {
    return (
      <div className="app-card p-5">
        <p className="text-slate-500 text-sm">Submit your answer to get automatic feedback.</p>
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold text-slate-500 mb-2">Scoring system:</p>
          <div className="flex flex-wrap gap-3">
            {SCORE_RULES.map(r => (
              <span key={r.attempts} className="text-xs bg-slate-100 rounded-md px-2 py-1">
                {r.attempts} — <strong>{r.multiplier}</strong>
              </span>
            ))}
            <span className="text-xs bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
              Hint — <strong>×0.8</strong>
            </span>
          </div>
        </div>
      </div>
    );
  }

  const s = STATUS_MAP[result.status] ?? STATUS_MAP.pending;
  const showDemoSolution =
    phase !== 'assess' &&
    result.attempts_count >= 3 &&
    result.status !== 'correct' &&
    result.explanation;

  return (
    <div className={`app-card border p-5 space-y-3 ${s.cls}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <span>{s.icon}</span>
          <span>{s.label}</span>
        </h3>
        <span className="text-sm font-medium">{result.score}%</span>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <span>Points: <strong>{result.points_earned}</strong></span>
        <span>Attempt: <strong>#{result.attempts_count}</strong></span>
        {result.is_using_hint && <span className="text-amber-700">Hint used (×0.8)</span>}
      </div>

      {result.feedback && (
        <p className="text-sm whitespace-pre-wrap border-t border-current/20 pt-3">{result.feedback}</p>
      )}

      {/* Demo solution after 3+ incorrect attempts (practice mode only) */}
      {showDemoSolution && (
        <div className="mt-3 rounded-lg bg-indigo-50 border border-indigo-200 p-4">
          <h4 className="text-sm font-semibold text-indigo-800 mb-2">📚 Demo solution</h4>
          <p className="text-sm text-indigo-900 whitespace-pre-wrap">{result.explanation}</p>
        </div>
      )}

      {/* Hint for next attempt */}
      {result.status !== 'correct' && result.attempts_count < 3 && phase !== 'assess' && (
        <p className="text-xs opacity-70">
          Attempts left before demo solution: {3 - result.attempts_count}
        </p>
      )}
    </div>
  );
};

export default FeedbackPanel;
