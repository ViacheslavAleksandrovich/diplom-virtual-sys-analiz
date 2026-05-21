import React from 'react';

interface FeedbackPanelProps {
  result: {
    status: string;
    score: number;
    points_earned: number;
    feedback: string;
    attempts_count: number;
  } | null;
}

const statusColorMap: Record<string, string> = {
  correct: 'text-green-700 bg-green-50 border-green-200',
  partial: 'text-amber-700 bg-amber-50 border-amber-200',
  incorrect: 'text-red-700 bg-red-50 border-red-200',
  pending: 'text-gray-700 bg-gray-50 border-gray-200',
};

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ result }) => {
  if (!result) {
    return (
      <div className="app-card p-4 text-slate-600">
        Submit an answer to get automatic feedback.
      </div>
    );
  }

  const styleClass = statusColorMap[result.status] || statusColorMap.pending;

  return (
    <div className={`app-card border p-4 ${styleClass}`}>
      <h3 className="font-semibold mb-2">Feedback</h3>
      <div className="text-sm space-y-1">
        <p>Status: {result.status}</p>
        <p>Score: {result.score}%</p>
        <p>Points earned: {result.points_earned}</p>
        <p>Attempts: {result.attempts_count}</p>
      </div>
      <p className="mt-3 text-sm whitespace-pre-wrap">{result.feedback}</p>
    </div>
  );
};

export default FeedbackPanel;
