import React, { useCallback, useEffect, useState } from 'react';

interface AHPMatrixProps {
  size: number;
  onMatrixChange: (matrix: number[][]) => void;
}

const AHP_SCALE = [1 / 9, 1 / 8, 1 / 7, 1 / 6, 1 / 5, 1 / 4, 1 / 3, 1 / 2, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function formatCell(v: number): string {
  if (v === 1) return '1';
  if (v < 1) return `1/${Math.round(1 / v)}`;
  return String(Math.round(v));
}

function buildIdentityMatrix(n: number): number[][] {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
}

const AHPMatrix: React.FC<AHPMatrixProps> = ({ size, onMatrixChange }) => {
  const [matrix, setMatrix] = useState<number[][]>(() => buildIdentityMatrix(size));

  useEffect(() => {
    const m = buildIdentityMatrix(size);
    setMatrix(m);
    onMatrixChange(m);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  const updateCell = useCallback(
    (i: number, j: number, raw: string) => {
      const parts = raw.split('/');
      let val: number;
      if (parts.length === 2) {
        val = Number(parts[0]) / Number(parts[1]);
      } else {
        val = Number(raw);
      }
      if (!isFinite(val) || val <= 0) return;

      setMatrix((prev) => {
        const next = prev.map((row) => [...row]);
        next[i][j] = val;
        next[j][i] = 1 / val;
        onMatrixChange(next);
        return next;
      });
    },
    [onMatrixChange]
  );

  const scaleOptions = AHP_SCALE.map((v) => ({ value: v, label: formatCell(v) }));

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-sm mx-auto">
        <thead>
          <tr>
            <th className="w-8" />
            {Array.from({ length: size }, (_, j) => (
              <th key={j} className="px-2 py-1 text-center text-slate-500 font-medium w-20">
                C{j + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td className="px-2 py-1 text-slate-500 font-medium text-right">C{i + 1}</td>
              {row.map((cell, j) => (
                <td key={j} className="p-1">
                  {i === j ? (
                    <div className="w-20 h-9 flex items-center justify-center bg-slate-100 border border-slate-200 rounded text-slate-500 font-medium">
                      1
                    </div>
                  ) : i < j ? (
                    <select
                      value={formatCell(cell) === '0' ? '1' : formatCell(cell)}
                      onChange={(e) => updateCell(i, j, e.target.value)}
                      className="w-20 h-9 border border-indigo-300 rounded px-1 text-center text-indigo-800 bg-indigo-50 focus:ring-2 focus:ring-indigo-400"
                    >
                      {scaleOptions.map((opt) => (
                        <option key={opt.label} value={opt.label}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-20 h-9 flex items-center justify-center border border-slate-200 rounded bg-slate-50 text-slate-400 text-xs">
                      {formatCell(cell) === '0' ? '—' : formatCell(cell)}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-slate-500 text-center">
        Select values above the diagonal (1 = equal, 9 = extremely more important). Reciprocals fill automatically.
      </p>
    </div>
  );
};

export default AHPMatrix;
