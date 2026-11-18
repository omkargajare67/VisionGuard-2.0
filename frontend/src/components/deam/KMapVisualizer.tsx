import React, { useState, useEffect } from 'react';
import { simplifyKMap } from '../../services/api';
import type { KMapResult } from '../../types';
import { Grid, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';

export const KMapVisualizer: React.FC = () => {
  const [numVars, setNumVars] = useState<number>(3);
  // minterm states: key is minterm number (0..2^N - 1), value is '0' | '1' | 'X'
  const [cellStates, setCellStates] = useState<Record<number, '0' | '1' | 'X'>>({
    0: '0',
    1: '1',
    2: '0',
    3: '1',
    4: '0',
    5: '1',
    6: '1',
    7: '1',
  });
  const [kmapResult, setKmapResult] = useState<KMapResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Re-initialize cells on variable count change
  const handleNumVarsChange = (vars: number) => {
    setNumVars(vars);
    const totalCells = Math.pow(2, vars);
    const initial: Record<number, '0' | '1' | 'X'> = {};
    for (let i = 0; i < totalCells; i++) {
      initial[i] = '0';
    }
    // Set some defaults
    if (vars === 3) {
      initial[1] = '1';
      initial[3] = '1';
      initial[5] = '1';
      initial[7] = '1';
    } else if (vars === 4) {
      [2, 3, 6, 7, 10, 11, 14, 15].forEach((m) => (initial[m] = '1'));
    } else {
      initial[1] = '1';
      initial[3] = '1';
    }
    setCellStates(initial);
    setKmapResult(null);
  };

  const handleCellClick = (minterm: number) => {
    setCellStates((prev) => {
      const current = prev[minterm] || '0';
      const nextVal = current === '0' ? '1' : current === '1' ? 'X' : '0';
      return { ...prev, [minterm]: nextVal };
    });
  };

  const runSimplification = async () => {
    setLoading(true);
    setError(null);
    try {
      const minterms: number[] = [];
      const dontCares: number[] = [];
      const totalCells = Math.pow(2, numVars);

      for (let i = 0; i < totalCells; i++) {
        if (cellStates[i] === '1') minterms.push(i);
        else if (cellStates[i] === 'X') dontCares.push(i);
      }

      const res = await simplifyKMap(numVars, minterms, dontCares);
      setKmapResult(res);
    } catch (err: any) {
      setError(err.message || 'K-Map solver error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimplification();
  }, [numVars]);

  // Gray code matrices definition for layout
  const getMatrixLayout = () => {
    if (numVars === 2) {
      return {
        rowVars: 'A',
        colVars: 'B',
        rowLabels: ['0', '1'],
        colLabels: ['0', '1'],
        grid: [
          [0, 1],
          [2, 3],
        ],
      };
    }
    if (numVars === 3) {
      return {
        rowVars: 'A',
        colVars: 'BC',
        rowLabels: ['0', '1'],
        colLabels: ['00', '01', '11', '10'],
        grid: [
          [0, 1, 3, 2],
          [4, 5, 7, 6],
        ],
      };
    }
    // 4 vars
    return {
      rowVars: 'AB',
      colVars: 'CD',
      rowLabels: ['00', '01', '11', '10'],
      colLabels: ['00', '01', '11', '10'],
      grid: [
        [0, 1, 3, 2],
        [4, 5, 7, 6],
        [12, 13, 15, 14],
        [8, 9, 11, 10],
      ],
    };
  };

  const layout = getMatrixLayout();

  const handleClearAll = () => {
    const totalCells = Math.pow(2, numVars);
    const empty: Record<number, '0' | '1' | 'X'> = {};
    for (let i = 0; i < totalCells; i++) empty[i] = '0';
    setCellStates(empty);
    setKmapResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Grid className="w-5 h-5 text-cyan-400" />
              <span>Karnaugh Map (K-Map) Solver & Minimizer</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Unit 1: Gray-code ordered adjacency visualization, Quine-McCluskey prime implicants, and minimal SOP synthesis
            </p>
          </div>

          {/* Variable Selection */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Variables:</span>
            {[2, 3, 4].map((v) => (
              <button
                key={v}
                onClick={() => handleNumVarsChange(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  numVars === v
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {v} Vars ({Math.pow(2, v)} cells)
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Grid and Result Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Gray Code Map */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-white">Interactive Gray-Code Grid</h4>
              <p className="text-[11px] text-slate-400">Click cells: 0 → 1 → X (Don't Care) → 0</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleClearAll}
                className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700 transition-all flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
              <button
                onClick={runSimplification}
                disabled={loading}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md shadow-cyan-600/20 flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Solve Minimal SOP</span>
              </button>
            </div>
          </div>

          {/* The K-Map Table with Gray Code Ordering */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-950/80 rounded-xl border border-slate-800 overflow-x-auto">
            {/* Top Variable Label */}
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-400 mb-2">
              <span className="text-purple-400">{layout.rowVars}</span>
              <span className="text-slate-600">\</span>
              <span className="text-cyan-400">{layout.colVars}</span>
            </div>

            <table className="border-collapse text-xs font-mono">
              <thead>
                <tr>
                  <th className="p-2 border border-transparent text-slate-500"></th>
                  {layout.colLabels.map((colVal, idx) => (
                    <th
                      key={idx}
                      className="p-2 text-center text-cyan-300 font-bold border-b border-slate-800 bg-slate-900/60 min-w-14"
                    >
                      {colVal}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {layout.grid.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td className="p-2 text-right text-purple-300 font-bold border-r border-slate-800 bg-slate-900/60 pr-3">
                      {layout.rowLabels[rIdx]}
                    </td>
                    {row.map((minterm) => {
                      const state = cellStates[minterm] || '0';
                      return (
                        <td
                          key={minterm}
                          onClick={() => handleCellClick(minterm)}
                          className={`p-3 text-center cursor-pointer border border-slate-800/80 transition-all select-none relative group hover:scale-[1.02] ${
                            state === '1'
                              ? 'bg-cyan-600/20 text-cyan-300 font-extrabold shadow-inner shadow-cyan-500/20'
                              : state === 'X'
                              ? 'bg-purple-950/40 text-purple-300 font-bold'
                              : 'bg-slate-900/40 text-slate-600 hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="text-base font-mono">{state}</div>
                          <span className="absolute bottom-1 right-1 text-[9px] text-slate-500 font-mono">
                            m{minterm}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Notice: Columns/Rows follow Gray sequence (00 → 01 → 11 → 10) to ensure Hamming distance = 1.</span>
          </div>
        </div>

        {/* Right: Minimal Expression & Groupings */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Minimal SOP Equation</span>
            </h4>
            {kmapResult?.verified && (
              <span className="flex items-center space-x-1 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified</span>
              </span>
            )}
          </div>

          {/* Minimal Equation Highlight */}
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-800/50 space-y-1">
            <div className="text-xs uppercase text-slate-400 font-mono font-semibold">
              Simplified Function Y =
            </div>
            <div className="text-lg font-mono font-extrabold text-cyan-300 tracking-wide break-all">
              {kmapResult ? kmapResult.simplified_expression : '0'}
            </div>
          </div>

          {/* Prime Implicants List */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              Essential Prime Implicants ({kmapResult?.prime_implicants.length || 0})
            </div>
            <div className="flex flex-wrap gap-2">
              {kmapResult?.prime_implicants.map((pi, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-800 border border-slate-700 text-purple-300"
                >
                  {pi}
                </span>
              ))}
              {(!kmapResult || kmapResult.prime_implicants.length === 0) && (
                <span className="text-xs text-slate-500 italic">No active implicants</span>
              )}
            </div>
          </div>

          {/* Groups Summary */}
          {kmapResult?.groups && kmapResult.groups.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Implicant Groupings (Adjacency Groups)
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {kmapResult.groups.map((grp, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono font-bold text-cyan-400">{grp.implicant}</span>
                      <span className="text-slate-400 ml-2 text-[11px]">
                        cells: [{grp.cells.join(', ')}]
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      Size: {grp.size}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Academic explanation */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300">Quine-McCluskey Reduction:</span>
            <p>
              Groups of 2<sup>k</sup> adjacent cells eliminate k variables. Cells at outer edges wrap around due to toroidal Gray-code topology.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
