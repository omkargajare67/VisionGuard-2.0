import React, { useState, useEffect } from 'react';
import {
  calculateInspectionDecision,
  calculateInspectionDecisionFromSample,
} from '../../services/api';
import type { InspectionDecisionResult, InspectionResult } from '../../types';
import {
  Zap,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  Cpu,
} from 'lucide-react';

interface InspectionDecisionBridgeProps {
  latestInspectionResult?: InspectionResult | null;
}

const BENCHMARK_SAMPLES = [
  { id: 'VG-001', label: 'VG-001 (Nominal / PASS)' },
  { id: 'VG-002', label: 'VG-002 (Missing Label)' },
  { id: 'VG-003', label: 'VG-003 (Wrong Marking)' },
  { id: 'VG-004', label: 'VG-004 (Missing Component)' },
  { id: 'VG-005', label: 'VG-005 (Contour Cut)' },
  { id: 'VG-006', label: 'VG-006 (Surface Scratch)' },
];

export const InspectionDecisionBridge: React.FC<InspectionDecisionBridgeProps> = ({
  latestInspectionResult,
}) => {
  // 6 Binary flags
  const [flags, setFlags] = useState<{
    D: number;
    S: number;
    C: number;
    L: number;
    M: number;
    G: number;
  }>({
    D: 1,
    S: 0,
    C: 1,
    L: 1,
    M: 1,
    G: 1,
  });

  const [decisionResult, setDecisionResult] = useState<InspectionDecisionResult | null>(null);
  const [selectedSample, setSelectedSample] = useState<string>('VG-001');

  // Evaluate decision circuit
  const runCircuit = async (currentFlags = flags) => {
    try {
      const res = await calculateInspectionDecision(currentFlags);
      setDecisionResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    runCircuit(flags);
  }, []);

  // When user clicks toggle bit
  const handleToggleFlag = (key: keyof typeof flags) => {
    const updated = {
      ...flags,
      [key]: flags[key] === 1 ? 0 : 1,
    };
    setFlags(updated);
    runCircuit(updated);
  };

  // Load from latest real inspection in VisionInspector
  const handleLoadFromLatestInspection = () => {
    if (!latestInspectionResult) return;
    const { flags: vFlags } = latestInspectionResult;
    const newFlags = {
      D: vFlags.product_detected,
      S: vFlags.surface_defect_detected,
      C: vFlags.components_complete,
      L: vFlags.label_present,
      M: vFlags.marking_correct,
      G: vFlags.geometry_ok,
    };
    setFlags(newFlags);
    runCircuit(newFlags);
  };

  // Load from synthetic sample endpoint
  const handleLoadSample = async (sampleId: string) => {
    setSelectedSample(sampleId);
    try {
      const res = await calculateInspectionDecisionFromSample(sampleId);
      setDecisionResult(res);
      setFlags(res.inputs);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <span>Vision-to-Digital Logic Inspection Decision Bridge</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Novel DEAM Integration: Ingests 6 OpenCV computer vision feature extraction flags into combinational Boolean decision circuitry
            </p>
          </div>

          {/* Load from Active Inspection Button */}
          {latestInspectionResult && (
            <button
              onClick={handleLoadFromLatestInspection}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Import Active Inspection ({latestInspectionResult.sample_id_or_filename})</span>
            </button>
          )}
        </div>

        {/* Preset Sample Quick Load */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs">
          <span className="text-slate-500 font-semibold text-[11px]">Benchmark Presets:</span>
          {BENCHMARK_SAMPLES.map((s) => (
            <button
              key={s.id}
              onClick={() => handleLoadSample(s.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all ${
                selectedSample === s.id
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-800 font-bold'
                  : 'bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6 Binary Input Flags Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h4 className="text-sm font-bold text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>OpenCV Feature Extraction Binary Flags</span>
          </h4>
          <span className="text-xs text-slate-400">Click any bit switch to toggle logic level</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { key: 'D', label: 'D (Detected)', meaning: 'Product present in ROI' },
            { key: 'S', label: 'S (Scratch)', meaning: '1 = Scratch defect present' },
            { key: 'C', label: 'C (Component)', meaning: '1 = All 3 terminals present' },
            { key: 'L', label: 'L (Label)', meaning: '1 = ID Label present' },
            { key: 'M', label: 'M (Marking)', meaning: '1 = Blue marking correct' },
            { key: 'G', label: 'G (Geometry)', meaning: '1 = Contour solid & intact' },
          ].map((f) => {
            const val = flags[f.key as keyof typeof flags];
            const isAbnormal =
              f.key === 'D'
                ? val === 0
                : f.key === 'S'
                ? val === 1
                : val === 0;

            return (
              <button
                key={f.key}
                onClick={() => handleToggleFlag(f.key as keyof typeof flags)}
                className={`p-3.5 rounded-xl border flex flex-col items-center justify-between transition-all select-none ${
                  isAbnormal
                    ? 'border-rose-500/50 bg-rose-950/30 text-rose-300'
                    : 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono font-bold text-xs">{f.key}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isAbnormal ? 'bg-rose-500 shadow-sm shadow-rose-500' : 'bg-emerald-500'
                    }`}
                  />
                </div>

                <div className="text-3xl font-mono font-extrabold my-1">{val}</div>

                <div className="text-[10px] text-center text-slate-400 leading-tight">
                  {f.meaning}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Circuit Synthesis & Decision Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Circuit Block Equations and Decision Badge */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Combinational Logic Decision Circuit</span>
            </h4>
            <span className="text-xs font-mono text-cyan-400">Propagation: ~15ns</span>
          </div>

          {/* Decision Big Verdict Card */}
          <div
            className={`p-6 rounded-2xl border-2 flex items-center justify-between shadow-xl transition-all ${
              decisionResult?.decision === 'PASS'
                ? 'border-emerald-500/50 bg-emerald-950/30 shadow-emerald-500/10'
                : decisionResult?.decision === 'REJECT'
                ? 'border-rose-500/50 bg-rose-950/30 shadow-rose-500/10'
                : 'border-amber-500/50 bg-amber-950/30 shadow-amber-500/10'
            }`}
          >
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                Final Automated Gate Sorting Action
              </span>
              <div className="flex items-center space-x-3">
                {decisionResult?.decision === 'PASS' && (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                )}
                {decisionResult?.decision === 'REJECT' && (
                  <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
                )}
                {decisionResult?.decision === 'UNREADABLE' && (
                  <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0" />
                )}
                <span
                  className={`text-3xl font-extrabold font-mono tracking-tight ${
                    decisionResult?.decision === 'PASS'
                      ? 'text-emerald-400'
                      : decisionResult?.decision === 'REJECT'
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }`}
                >
                  {decisionResult?.decision}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium pt-1">
                {decisionResult?.verdict_summary}
              </p>
            </div>

            {/* Hardware Output Signals */}
            <div className="flex flex-col space-y-2 font-mono text-xs text-right">
              <div className="flex items-center justify-end space-x-2">
                <span className="text-slate-400">PASS Gate:</span>
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    decisionResult?.pass_output === 1
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {decisionResult?.pass_output ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-end space-x-2">
                <span className="text-slate-400">REJECT Gate:</span>
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    decisionResult?.reject_output === 1
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {decisionResult?.reject_output ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Synthesized Logic Equations */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-3">
            <div className="text-slate-400 font-sans font-bold uppercase text-[11px]">
              Logic Equations Synthesized in Hardware:
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-200">
              <div className="text-[10px] text-slate-500">1. Inverted Defects:</div>
              <div className="text-purple-300 font-semibold">
                C' = {decisionResult?.intermediate_signals.not_C}, L' = {decisionResult?.intermediate_signals.not_L}, M' = {decisionResult?.intermediate_signals.not_M}, G' = {decisionResult?.intermediate_signals.not_G}
              </div>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-200">
              <div className="text-[10px] text-slate-500">2. Defect OR-5 Gate:</div>
              <div className="text-cyan-300 font-bold">
                F = S + C' + L' + M' + G' = {decisionResult?.defect_signal}
              </div>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-200">
              <div className="text-[10px] text-slate-500">3. Sorting Decision AND Gates:</div>
              <div className="text-emerald-400">PASS = D · F' = {decisionResult?.pass_output}</div>
              <div className="text-rose-400">REJECT = D · F = {decisionResult?.reject_output}</div>
            </div>
          </div>
        </div>

        {/* Right: Gate Execution Trace */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Gate-by-Gate Hardware Execution Trace</span>
            </h4>
            <span className="text-xs text-slate-400 font-mono">
              Steps: {decisionResult?.gate_trace.length || 0}
            </span>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-xs text-left font-mono">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-2 px-2.5">Gate ID</th>
                  <th className="py-2 px-2.5">Gate Type</th>
                  <th className="py-2 px-2.5">Inputs</th>
                  <th className="py-2 px-2.5 text-cyan-400">Output</th>
                  <th className="py-2 px-2.5">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {decisionResult?.gate_trace.map((step, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2 px-2.5 font-bold text-slate-400">{step.gate_id}</td>
                    <td className="py-2 px-2.5 text-purple-300 font-bold">{step.type}</td>
                    <td className="py-2 px-2.5 text-slate-300">{step.inputs || step.input}</td>
                    <td className="py-2 px-2.5 text-cyan-300 font-bold">{step.output}</td>
                    <td className="py-2 px-2.5 text-slate-400 text-[11px] font-sans">
                      {step.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300">Why Hardware Boolean Logic?</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              In high-speed bottling and electronics manufacturing running at 1200 units/min, software evaluation introduces nondeterministic jitter. Combinational logic gates resolve sorting decisions in nanoseconds, triggering pneumatic diverters with microsecond repeatability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
