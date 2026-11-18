import React, { useState, useEffect } from 'react';
import { evaluateGate, fetchGateTruthTable } from '../../services/api';
import type { GateEvaluateResult, GateTruthTableResult } from '../../types';
import { Sparkles, Info, Zap } from 'lucide-react';

const GATE_LIST = [
  { id: 'AND', name: 'AND Gate', symbol: '&', expr: 'Y = A · B' },
  { id: 'OR', name: 'OR Gate', symbol: '≥1', expr: 'Y = A + B' },
  { id: 'NOT', name: 'NOT Gate (Inverter)', symbol: '1', expr: 'Y = A\'' },
  { id: 'NAND', name: 'NAND Gate', symbol: '&', expr: 'Y = (A · B)\'' },
  { id: 'NOR', name: 'NOR Gate', symbol: '≥1', expr: 'Y = (A + B)\'' },
  { id: 'XOR', name: 'XOR Gate', symbol: '=1', expr: 'Y = A ⊕ B' },
  { id: 'XNOR', name: 'XNOR Gate', symbol: '=', expr: 'Y = (A ⊕ B)\'' },
];

export const LogicGatesLab: React.FC = () => {
  const [selectedGate, setSelectedGate] = useState<string>('AND');
  const [inputA, setInputA] = useState<number>(0);
  const [inputB, setInputB] = useState<number>(0);
  const [evalResult, setEvalResult] = useState<GateEvaluateResult | null>(null);
  const [truthTable, setTruthTable] = useState<GateTruthTableResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeMorgan, setShowDeMorgan] = useState<boolean>(false);

  // Evaluate gate on input change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const inputs: Record<string, number> = selectedGate === 'NOT' ? { A: inputA } : { A: inputA, B: inputB };

    Promise.all([
      evaluateGate(selectedGate, inputs),
      fetchGateTruthTable(selectedGate),
    ])
      .then(([resEval, resTable]) => {
        if (isMounted) {
          setEvalResult(resEval);
          setTruthTable(resTable);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Evaluation failed');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedGate, inputA, inputB]);

  const isHigh = evalResult?.output === 1;

  return (
    <div className="space-y-6">
      {/* Gate Selector Bar */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
        {GATE_LIST.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGate(g.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedGate === g.id
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {g.id}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Main Interactive Circuit Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Circuit Schematic & Controls */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <span>{evalResult?.name || selectedGate}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{evalResult?.description}</p>
            </div>
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
              {evalResult?.expression}
            </span>
          </div>

          {/* Interactive Gate Diagram */}
          <div className="relative h-64 rounded-xl bg-slate-950/80 border border-slate-800 p-6 flex items-center justify-between overflow-hidden">
            {/* Input Controls */}
            <div className="flex flex-col space-y-8 z-10">
              {/* Input A */}
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono font-bold text-slate-300 w-6">A</span>
                <button
                  onClick={() => setInputA(inputA === 1 ? 0 : 1)}
                  className={`w-12 h-9 rounded-lg font-mono text-sm font-bold transition-all shadow-md flex items-center justify-center ${
                    inputA === 1
                      ? 'bg-emerald-600 text-white shadow-emerald-600/30 border border-emerald-400'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {inputA}
                </button>
                <div
                  className={`h-0.5 w-12 transition-colors ${
                    inputA === 1 ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-slate-700'
                  }`}
                />
              </div>

              {/* Input B (Hidden if NOT gate) */}
              {selectedGate !== 'NOT' ? (
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono font-bold text-slate-300 w-6">B</span>
                  <button
                    onClick={() => setInputB(inputB === 1 ? 0 : 1)}
                    className={`w-12 h-9 rounded-lg font-mono text-sm font-bold transition-all shadow-md flex items-center justify-center ${
                      inputB === 1
                        ? 'bg-emerald-600 text-white shadow-emerald-600/30 border border-emerald-400'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {inputB}
                  </button>
                  <div
                    className={`h-0.5 w-12 transition-colors ${
                      inputB === 1 ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-slate-700'
                    }`}
                  />
                </div>
              ) : (
                <div className="h-9 flex items-center text-xs text-slate-500 italic pl-6">
                  Single-input Inverter
                </div>
              )}
            </div>

            {/* Center Gate Symbol Symbol Box */}
            <div className="z-10 flex flex-col items-center">
              <div
                className={`w-28 h-28 rounded-2xl border-2 flex flex-col items-center justify-center shadow-xl transition-all ${
                  isHigh
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-cyan-500/20'
                    : 'border-slate-700 bg-slate-900/80 shadow-black'
                }`}
              >
                <span className="text-xs font-mono uppercase text-slate-400 font-bold mb-1">
                  {selectedGate}
                </span>
                <span className="text-3xl font-extrabold text-white">
                  {evalResult?.symbol || selectedGate}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 font-mono">
                  {selectedGate === 'NOT' ? '1-IN' : '2-IN'}
                </span>
              </div>
            </div>

            {/* Output Wire and Indicator */}
            <div className="flex items-center space-x-3 z-10">
              <div
                className={`h-0.5 w-12 transition-colors ${
                  isHigh ? 'bg-cyan-400 shadow-sm shadow-cyan-400' : 'bg-slate-700'
                }`}
              />
              <div className="flex flex-col items-center space-y-1">
                <span className="text-xs font-mono font-bold text-slate-300">OUT (Y)</span>
                <div
                  className={`w-14 h-12 rounded-xl flex items-center justify-center font-mono text-lg font-bold border-2 transition-all ${
                    isHigh
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-lg shadow-cyan-500/40 animate-pulse'
                      : 'bg-slate-900 text-slate-500 border-slate-700'
                  }`}
                >
                  {loading ? '...' : (evalResult ? evalResult.output : '-')}
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                    isHigh ? 'text-cyan-400' : 'text-slate-500'
                  }`}
                >
                  {isHigh ? 'HIGH (1)' : 'LOW (0)'}
                </span>
              </div>
            </div>

            {/* Background grid lines */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          </div>

          {/* Quick Click Hint */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Click input buttons (A / B) to toggle logic levels (0 ⇄ 1)</span>
            <button
              onClick={() => setShowDeMorgan(!showDeMorgan)}
              className="text-cyan-400 hover:text-cyan-300 underline font-medium"
            >
              {showDeMorgan ? 'Hide Theorem' : "View De Morgan's Law"}
            </button>
          </div>

          {/* De Morgan's Law Callout */}
          {showDeMorgan && (
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/60 text-xs space-y-2">
              <div className="flex items-center space-x-2 font-bold text-cyan-300">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>De Morgan's Duality Theorems</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300 font-mono pt-1">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase">First Theorem:</div>
                  <div className="text-cyan-400 font-bold">(A · B)' = A' + B'</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">NAND ≡ Inverted OR</div>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase">Second Theorem:</div>
                  <div className="text-cyan-400 font-bold">(A + B)' = A' · B'</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">NOR ≡ Inverted AND</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Truth Table Display */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Truth Table & Verification</span>
            </h4>
            <span className="text-xs text-slate-400 font-mono">
              {selectedGate === 'NOT' ? '2 Rows' : '4 Rows'}
            </span>
          </div>

          {truthTable ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="py-2 px-3">A</th>
                    {selectedGate !== 'NOT' && <th className="py-2 px-3">B</th>}
                    <th className="py-2 px-3 text-right">Output (Y)</th>
                    <th className="py-2 px-3 text-right">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {truthTable.table.map((row, idx) => {
                    const rowIsActive =
                      selectedGate === 'NOT'
                        ? row.A === inputA
                        : row.A === inputA && row.B === inputB;

                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          rowIsActive
                            ? 'bg-cyan-500/15 font-bold text-white border-l-2 border-cyan-400'
                            : 'text-slate-300 hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] ${
                              row.A === 1 ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {row.A}
                          </span>
                        </td>
                        {selectedGate !== 'NOT' && (
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] ${
                                row.B === 1 ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {row.B}
                            </span>
                          </td>
                        )}
                        <td className="py-2.5 px-3 text-right">
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
                        <td className="py-2.5 px-3 text-right text-[10px] uppercase">
                          {rowIsActive ? (
                            <span className="text-cyan-400 font-sans font-semibold">Active</span>
                          ) : (
                            <span className="text-slate-500 font-sans">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">Loading truth table...</div>
          )}

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300">Boolean Gate Properties:</div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-400">
              <li>Inputs 0: Logic LOW (0V - 0.8V TTL)</li>
              <li>Inputs 1: Logic HIGH (2.0V - 5.0V TTL)</li>
              <li>Universal gates: NAND and NOR can synthesize any logic function.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
