import React, { useState, useEffect } from 'react';
import {
  calculateInspectionDecision,
  calculateInspectionDecisionFromSample,
} from '../../services/api';
import type { InspectionDecisionResult, InspectionResult } from '../../types';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Cpu,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface InspectionDecisionBridgeProps {
  latestInspectionResult?: InspectionResult | null;
}

const BENCHMARK_SAMPLES = [
  { id: 'VG-001', label: 'VG-001 (PASS)', desc: 'Nominal reference' },
  { id: 'VG-002', label: 'VG-002 (REJECT)', desc: 'Missing Label (L=0)' },
  { id: 'VG-003', label: 'VG-003 (REJECT)', desc: 'Wrong Marking (M=0)' },
  { id: 'VG-004', label: 'VG-004 (REJECT)', desc: 'Missing Component (C=0)' },
  { id: 'VG-005', label: 'VG-005 (REJECT)', desc: 'Contour Cut (G=0)' },
  { id: 'VG-006', label: 'VG-006 (REJECT)', desc: 'Surface Scratch (S=1)' },
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
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  // Evaluate decision circuit
  const runCircuit = async (currentFlags = flags) => {
    try {
      const res = await calculateInspectionDecision(currentFlags);
      setDecisionResult(res);
    } catch (err) {
      console.error('Circuit evaluation error:', err);
    }
  };

  useEffect(() => {
    runCircuit(flags);
  }, []);

  const handleToggleFlag = (key: keyof typeof flags) => {
    const updated = {
      ...flags,
      [key]: flags[key] === 1 ? 0 : 1,
    };
    setFlags(updated);
    runCircuit(updated);
  };

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
    <div className="space-y-6 font-sans">
      {/* ========================================================= */}
      {/* SECTION 1: BENCHMARK SAMPLE SELECTION                    */}
      {/* ========================================================= */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-[#F59A16] text-white flex items-center justify-center text-[10px] font-bold font-mono">
                1
              </span>
              <h3 className="text-sm font-bold text-[#252B35]">
                Benchmark Workpiece Sample Selection
              </h3>
            </div>
            <p className="text-xs text-[#667085] mt-0.5">
              Load predetermined optical inspection flags or import from live camera analysis
            </p>
          </div>

          {latestInspectionResult && (
            <button
              onClick={handleLoadFromLatestInspection}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-[#F59A16] text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F59A16]" />
              <span>Import Active Inspection</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {BENCHMARK_SAMPLES.map((s) => {
            const isSelected = selectedSample === s.id;
            return (
              <button
                key={s.id}
                onClick={() => handleLoadSample(s.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#F59A16] bg-[#F59A16]/5 ring-1 ring-[#F59A16]'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="font-mono font-bold text-xs text-slate-900">{s.id}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">{s.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 2: OPENCV FEATURE EXTRACTION (6 BINARY FLAGS)     */}
      {/* ========================================================= */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-[#F59A16] text-white flex items-center justify-center text-[10px] font-bold font-mono">
              2
            </span>
            <h3 className="text-sm font-bold text-[#252B35]">
              OpenCV Feature Extraction (6 Binary Logic Signals)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Click any bit switch to toggle logic level
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { key: 'D', label: 'D (Detected)', meaning: '1 = Product Present' },
            { key: 'S', label: 'S (Scratch)', meaning: '1 = Surface Scratch' },
            { key: 'C', label: 'C (Component)', meaning: '1 = Chips Complete' },
            { key: 'L', label: 'L (Label)', meaning: '1 = Label Present' },
            { key: 'M', label: 'M (Marking)', meaning: '1 = Color Valid' },
            { key: 'G', label: 'G (Geometry)', meaning: '1 = Boundary Intact' },
          ].map((f) => {
            const val = flags[f.key as keyof typeof flags];
            const isAbnormal =
              f.key === 'D' ? val === 0 : f.key === 'S' ? val === 1 : val === 0;

            return (
              <button
                key={f.key}
                onClick={() => handleToggleFlag(f.key as keyof typeof flags)}
                className={`p-4 rounded-xl border flex flex-col items-center justify-between transition-all select-none cursor-pointer ${
                  isAbnormal
                    ? 'border-rose-300 bg-rose-50 text-rose-700 shadow-xs'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono font-bold text-xs">{f.key}</span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isAbnormal ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                  />
                </div>

                <div className="text-3xl font-mono font-extrabold my-1">{val}</div>

                <div className="text-[10px] text-center font-medium leading-tight">
                  {f.meaning}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 3: BOOLEAN DECISION OUTPUT & SYNTHESIS           */}
      {/* ========================================================= */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-[#F59A16] text-white flex items-center justify-center text-[10px] font-bold font-mono">
              3
            </span>
            <h3 className="text-sm font-bold text-[#252B35]">
              Boolean Decision Output &amp; Actuator Gating
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">Propagation Delay: ~15ns</span>
        </div>

        {/* Verdict Banner Card */}
        <div
          className={`p-6 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
            decisionResult?.decision === 'PASS'
              ? 'border-emerald-300 bg-emerald-50/70'
              : decisionResult?.decision === 'REJECT'
              ? 'border-rose-300 bg-rose-50/70'
              : 'border-amber-300 bg-amber-50/70'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono">
              Hardware Decision Gate Output
            </span>
            <div className="flex items-center space-x-3">
              {decisionResult?.decision === 'PASS' ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
              ) : decisionResult?.decision === 'REJECT' ? (
                <XCircle className="w-8 h-8 text-rose-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0" />
              )}
              <span
                className={`text-3xl font-extrabold font-mono tracking-tight ${
                  decisionResult?.decision === 'PASS'
                    ? 'text-emerald-700'
                    : decisionResult?.decision === 'REJECT'
                    ? 'text-rose-700'
                    : 'text-amber-700'
                }`}
              >
                {decisionResult?.decision || 'EVALUATING'}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium pt-1">
              {decisionResult?.verdict_summary}
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-white border border-slate-200 text-center min-w-[90px]">
              <span className="text-slate-400 block text-[10px]">PASS LANE</span>
              <span
                className={`text-base font-bold ${
                  decisionResult?.pass_output === 1 ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {decisionResult?.pass_output ?? 0}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 text-center min-w-[90px]">
              <span className="text-slate-400 block text-[10px]">REJECT GATE</span>
              <span
                className={`text-base font-bold ${
                  decisionResult?.reject_output === 1 ? 'text-rose-600' : 'text-slate-400'
                }`}
              >
                {decisionResult?.reject_output ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Synthesized Logic Equations Bar */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs space-y-2">
          <div className="text-slate-700 font-sans font-bold text-xs">
            Synthesized Hardware Boolean Functions:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="text-slate-400 block text-[10px]">DEFECT FUNCTION (OR-5)</span>
              <span className="text-slate-800 font-bold">
                F = S + C' + L' + M' + G' = {decisionResult?.defect_signal ?? 0}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="text-slate-400 block text-[10px]">PASS / REJECT GATES</span>
              <span className="text-emerald-700 font-bold">PASS = D · F' = {decisionResult?.pass_output ?? 0}</span>
              <span className="text-slate-300 mx-2">|</span>
              <span className="text-rose-700 font-bold">REJECT = D · F = {decisionResult?.reject_output ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Expandable Technical Trace & Truth Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-2 text-xs font-bold text-[#252B35]">
              <Cpu className="w-4 h-4 text-[#F59A16]" />
              <span>Gate-Level Hardware Propagation Trace ({decisionResult?.gate_trace.length ?? 0} steps)</span>
            </div>
            {showTechnicalDetails ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showTechnicalDetails && (
            <div className="p-4 border-t border-slate-100 bg-white">
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-xs text-left font-mono">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Gate ID</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Inputs</th>
                      <th className="py-2 px-3 text-[#F59A16]">Output</th>
                      <th className="py-2 px-3">Logical Function</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {decisionResult?.gate_trace.map((step, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-slate-500">{step.gate_id}</td>
                        <td className="py-2 px-3 text-slate-900 font-bold">{step.type}</td>
                        <td className="py-2 px-3 text-slate-600">{step.inputs || step.input}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{step.output}</td>
                        <td className="py-2 px-3 text-slate-500 font-sans text-[11px]">
                          {step.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
