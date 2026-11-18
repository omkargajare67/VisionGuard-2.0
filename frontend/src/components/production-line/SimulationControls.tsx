import React from 'react';
import {
  Play,
  Pause,
  Square,
  StepForward,
  RotateCcw,
  PlusCircle,
  AlertOctagon,
  Zap,
} from 'lucide-react';

interface SimulationControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  speed: number;
  emergencyStopped: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onStep: () => void;
  onReset: () => void;
  onSetSpeed: (speed: number) => void;
  onEmergencyStop: () => void;
  onClearEmergencyStop: () => void;
  onAddProduct: (sampleId: string) => void;
  onAddBatchDemo: () => void;
  isLoading: boolean;
}

const SAMPLE_OPTIONS = [
  { id: 'VG-001', label: 'VG-001 (Nominal PASS)', color: 'text-emerald-400' },
  { id: 'VG-002', label: 'VG-002 (Missing Label)', color: 'text-rose-400' },
  { id: 'VG-003', label: 'VG-003 (Marking Defect)', color: 'text-rose-400' },
  { id: 'VG-004', label: 'VG-004 (Missing Component)', color: 'text-rose-400' },
  { id: 'VG-005', label: 'VG-005 (Geometry Defect)', color: 'text-rose-400' },
  { id: 'VG-006', label: 'VG-006 (Surface Scratch)', color: 'text-rose-400' },
];

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isRunning,
  isPaused,
  speed,
  emergencyStopped,
  onStart,
  onPause,
  onResume,
  onStop,
  onStep,
  onReset,
  onSetSpeed,
  onEmergencyStop,
  onClearEmergencyStop,
  onAddProduct,
  onAddBatchDemo,
  isLoading,
}) => {
  const [selectedSample, setSelectedSample] = React.useState('VG-001');

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
        {/* SECTION 1: CONVEYOR LINE EXECUTION CONTROLS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Start / Resume */}
          {!isRunning || isPaused ? (
            <button
              onClick={isPaused ? onResume : onStart}
              disabled={isLoading || emergencyStopped}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isPaused ? 'Resume Line' : 'Start Conveyor'}</span>
            </button>
          ) : (
            <button
              onClick={onPause}
              disabled={isLoading || emergencyStopped}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-xs shadow-lg shadow-amber-600/30 transition-all disabled:opacity-40"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause Line</span>
            </button>
          )}

          {/* Stop */}
          <button
            onClick={onStop}
            disabled={isLoading || (!isRunning && !isPaused)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all disabled:opacity-40"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Stop</span>
          </button>

          {/* Single Step (Tick) */}
          <button
            onClick={onStep}
            disabled={isLoading || emergencyStopped}
            title="Advance exactly 1 simulation step"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-cyan-900/40 text-cyan-300 border border-cyan-700/50 font-semibold text-xs transition-all disabled:opacity-40"
          >
            <StepForward className="w-3.5 h-3.5" />
            <span>Step (F7)</span>
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            disabled={isLoading}
            title="Reset conveyor, active products and clear lane state"
            className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Speed Presets */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 ml-2">
            <span className="text-[10px] text-slate-500 font-mono px-1">SPEED:</span>
            {[1.0, 2.0, 5.0].map((s) => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                  Math.abs(speed - s) < 0.1
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 2: PRODUCT INJECTION & BATCH RUN */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sample Select */}
          <div className="flex items-center space-x-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
            <select
              value={selectedSample}
              onChange={(e) => setSelectedSample(e.target.value)}
              className="bg-transparent text-xs font-mono text-slate-200 outline-none cursor-pointer"
            >
              {SAMPLE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-slate-900 text-slate-200">
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => onAddProduct(selectedSample)}
              disabled={isLoading || emergencyStopped}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-40"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Inject</span>
            </button>
          </div>

          {/* Batch Demo (All 6 Samples) */}
          <button
            onClick={onAddBatchDemo}
            disabled={isLoading || emergencyStopped}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-40"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Run 6-Sample Batch Demo</span>
          </button>

          {/* EMERGENCY STOP INDUSTRIAL BUTTON */}
          {!emergencyStopped ? (
            <button
              onClick={onEmergencyStop}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/40 border border-red-500/50 hover:scale-105 active:scale-95 transition-all"
            >
              <AlertOctagon className="w-4 h-4 animate-pulse" />
              <span>E-STOP</span>
            </button>
          ) : (
            <button
              onClick={onClearEmergencyStop}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-600/40 border border-amber-400 hover:scale-105 active:scale-95 transition-all animate-bounce"
            >
              <RotateCcw className="w-4 h-4" />
              <span>CLEAR E-STOP</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
