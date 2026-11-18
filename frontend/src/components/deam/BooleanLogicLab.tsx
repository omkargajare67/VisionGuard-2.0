import React, { useState, useEffect } from 'react';
import {
  evaluateBooleanExpression,
  fetchBooleanTruthTable,
  fetchBooleanIdentities,
} from '../../services/api';
import type { BooleanEvaluateResult, BooleanTruthTableResult } from '../../types';
import { Calculator, BookOpen, RefreshCw } from 'lucide-react';

const PRESET_EXPRESSIONS = [
  { label: 'Defect Reduction', expr: 'S or (not C) or (not L)' },
  { label: 'Carry Generator', expr: '(A and B) or (B and Cin) or (A and Cin)' },
  { label: 'Sum (Full Adder)', expr: 'A xor B xor Cin' },
  { label: 'XOR Synthesized', expr: '(A and not B) or (not A and B)' },
  { label: 'Majority Voter', expr: '(A and B) or (B and C) or (A and C)' },
];

export const BooleanLogicLab: React.FC = () => {
  const [expression, setExpression] = useState<string>('S or (not C) or (not L)');
  const [variables, setVariables] = useState<Record<string, number>>({ S: 0, C: 1, L: 1 });
  const [evalResult, setEvalResult] = useState<BooleanEvaluateResult | null>(null);
  const [truthTable, setTruthTable] = useState<BooleanTruthTableResult | null>(null);
  const [identities, setIdentities] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'eval' | 'table' | 'identities'>('eval');

  // Load identities on mount
  useEffect(() => {
    fetchBooleanIdentities()
      .then((data) => setIdentities(data))
      .catch(() => {});
  }, []);

  // Run evaluation
  const handleEvaluate = async (exprToRun = expression, currentVars = variables) => {
    setLoading(true);
    setError(null);
    try {
      const resEval = await evaluateBooleanExpression(exprToRun, currentVars);
      setEvalResult(resEval);

      // Also compute truth table
      const resTable = await fetchBooleanTruthTable(exprToRun);
      setTruthTable(resTable);

      // Synchronize variable map if new variables detected
      if (resTable.variables) {
        setVariables((prev) => {
          const next: Record<string, number> = {};
          resTable.variables.forEach((v) => {
            next[v] = prev[v] !== undefined ? prev[v] : 0;
          });
          return next;
        });
      }
    } catch (err: any) {
      setError(err.message || 'Expression evaluation error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleEvaluate(expression, variables);
  }, []);

  const toggleVariable = (varName: string) => {
    const updated = {
      ...variables,
      [varName]: variables[varName] === 1 ? 0 : 1,
    };
    setVariables(updated);
    handleEvaluate(expression, updated);
  };

  const handleSelectPreset = (expr: string) => {
    setExpression(expr);
    // Find variables in expr
    const matches = Array.from(new Set(expr.match(/[A-Za-z][A-Za-z0-9_]*/g) || []))
      .filter((w) => !['and', 'or', 'not', 'xor', 'nand', 'nor', 'xnor', 'True', 'False'].includes(w.toLowerCase()));
    const newVars: Record<string, number> = {};
    matches.forEach((v) => (newVars[v] = 0));
    setVariables(newVars);
    handleEvaluate(expr, newVars);
  };

  return (
    <div className="space-y-6">
      {/* Expression Input Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-cyan-400" />
              <span>Boolean Algebra & Expression Evaluator</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Parse custom Boolean equations, evaluate variable states, and generate minterm canonical expansions
            </p>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('eval')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'eval'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Interactive Evaluation
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'table'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Full Truth Table ({truthTable?.table.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('identities')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'identities'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Boolean Laws & Theorems
            </button>
          </div>
        </div>

        {/* Input & Presets */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="e.g. (A and B) or (not C)"
              className="flex-1 w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => handleEvaluate(expression, variables)}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md shadow-cyan-600/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Evaluate</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-500 font-semibold text-[11px]">Presets:</span>
            {PRESET_EXPRESSIONS.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSelectPreset(p.expr)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700/60 transition-all"
              >
                {p.label}
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

      {/* Main Content Area based on Tab */}
      {activeTab === 'eval' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Variable Toggles */}
          <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white">Input Variable Assignments</h4>
              <span className="text-xs text-slate-400">Click to flip bit (0 ⇄ 1)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.keys(variables).map((varName) => {
                const val = variables[varName];
                return (
                  <button
                    key={varName}
                    onClick={() => toggleVariable(varName)}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      val === 1
                        ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-mono font-bold text-slate-300">{varName}</span>
                    <span
                      className={`text-2xl font-mono font-extrabold mt-1 ${
                        val === 1 ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {val}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase mt-0.5">
                      {val === 1 ? 'HIGH' : 'LOW'}
                    </span>
                  </button>
                );
              })}
            </div>

            {Object.keys(variables).length === 0 && (
              <div className="py-6 text-center text-xs text-slate-500">
                No variables detected in current expression.
              </div>
            )}
          </div>

          {/* Result Output Card */}
          <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white">Evaluated Output</h4>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                {evalResult?.output === 1 ? 'LOGIC HIGH' : 'LOGIC LOW'}
              </span>
            </div>

            <div className="h-44 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center p-4">
              <span className="text-xs text-slate-400 uppercase font-mono">Calculated Result (Y)</span>
              <div
                className={`text-6xl font-mono font-extrabold mt-2 ${
                  evalResult?.output === 1 ? 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'text-slate-600'
                }`}
              >
                {evalResult !== null ? evalResult.output : '-'}
              </div>
              <span className="text-xs font-semibold text-slate-400 mt-2 font-mono">
                Normalized: {evalResult?.normalized || expression}
              </span>
            </div>

            {/* Minterms / Maxterms quick pills */}
            {truthTable && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Canonical Minterms (Σm):</span>
                  <span className="font-mono text-cyan-300 font-bold">
                    Σ({truthTable.minterms.join(', ') || 'None'})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Canonical Maxterms (ΠM):</span>
                  <span className="font-mono text-purple-300 font-bold">
                    Π({truthTable.maxterms.join(', ') || 'None'})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Truth Table Tab */}
      {activeTab === 'table' && truthTable && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-white">Full Combinational Truth Table</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Contains 2<sup>{truthTable.variables.length}</sup> = {truthTable.table.length} rows for variables: {truthTable.variables.join(', ')}
              </p>
            </div>
            <div className="text-xs font-mono text-cyan-400">
              Σm({truthTable.minterms.join(', ') || '∅'})
            </div>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-xs text-left">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 font-mono">
                <tr>
                  <th className="py-2 px-3">Row (Index)</th>
                  {truthTable.variables.map((v) => (
                    <th key={v} className="py-2 px-3">
                      {v}
                    </th>
                  ))}
                  <th className="py-2 px-3 text-right">Result (Y)</th>
                  <th className="py-2 px-3 text-right">Term</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {truthTable.table.map((row, idx) => {
                  const isCurrentState = truthTable.variables.every(
                    (v) => variables[v] === row[v]
                  );
                  return (
                    <tr
                      key={idx}
                      className={
                        isCurrentState
                          ? 'bg-cyan-500/15 font-bold text-white border-l-2 border-cyan-400'
                          : 'text-slate-300 hover:bg-slate-800/40'
                      }
                    >
                      <td className="py-2 px-3 text-slate-500">m{idx}</td>
                      {truthTable.variables.map((v) => (
                        <td key={v} className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] ${
                              row[v] === 1 ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {row[v]}
                          </span>
                        </td>
                      ))}
                      <td className="py-2 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            row.Y === 1
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {row.Y}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-[11px] text-slate-400">
                        {row.Y === 1 ? `m${idx}` : `M${idx}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Identities Tab */}
      {activeTab === 'identities' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Fundamental Boolean Algebra Laws & Identities</span>
            </h4>
            <span className="text-xs text-slate-400">Standard DEAM Unit 1 Axioms</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {identities.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-1"
              >
                <div className="text-xs font-bold text-cyan-400">{item.law}</div>
                <div className="text-xs font-mono text-white font-semibold pt-0.5">{item.form_and}</div>
                {item.form_or && <div className="text-xs font-mono text-purple-300">{item.form_or}</div>}
                <div className="text-[11px] text-slate-400 pt-1">{item.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
