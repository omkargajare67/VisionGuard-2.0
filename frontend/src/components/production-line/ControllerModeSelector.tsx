import React from 'react';
import { Binary, Terminal, Shield, CheckCircle, ArrowRight } from 'lucide-react';

interface ControllerModeSelectorProps {
  currentMode: 'DEAM_LOGIC' | 'MICROPROCESSOR_8086';
  onSelectMode: (mode: 'DEAM_LOGIC' | 'MICROPROCESSOR_8086') => void;
  isLoading: boolean;
}

export const ControllerModeSelector: React.FC<ControllerModeSelectorProps> = ({
  currentMode,
  onSelectMode,
  isLoading,
}) => {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Dual Controller Engine Architecture</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold">
              ACADEMIC DEAM DUAL-CORE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Choose whether sorting decisions are executed via pure combinational digital logic gates or an emulated Intel 8086 CPU &amp; 8255 PPI program.
          </p>
        </div>

        {/* Mode Toggle Pills */}
        <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <button
            onClick={() => onSelectMode('DEAM_LOGIC')}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
              currentMode === 'DEAM_LOGIC'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            <span>Mode A: DEAM Logic Gates</span>
          </button>

          <button
            onClick={() => onSelectMode('MICROPROCESSOR_8086')}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
              currentMode === 'MICROPROCESSOR_8086'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Mode B: Intel 8086 CPU &amp; 8255 PPI</span>
          </button>
        </div>
      </div>

      {/* Explanatory Architecture Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs font-mono">
        {/* Mode A Details */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            currentMode === 'DEAM_LOGIC'
              ? 'bg-blue-950/20 border-cyan-500/50 text-cyan-200'
              : 'bg-slate-950/40 border-slate-800 text-slate-500'
          }`}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="font-bold flex items-center gap-1.5">
              <Binary className="w-4 h-4 text-cyan-400" />
              MODE A: COMBINATIONAL BOOLEAN GATES
            </span>
            {currentMode === 'DEAM_LOGIC' && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                <CheckCircle className="w-3 h-3" /> ACTIVE
              </span>
            )}
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div>
              <span className="text-slate-400">Fault Function: </span>
              <span className="text-amber-400 font-bold">F = S + C' + L' + M' + G'</span>
            </div>
            <div>
              <span className="text-slate-400">De Morgan Dual: </span>
              <span className="text-cyan-400">F = (S' · C · L · M · G)'</span>
            </div>
            <div>
              <span className="text-slate-400">Decision Logic: </span>
              <span className="text-slate-300">If D=1 and F=0 → PASS (0°-Gate) | If F=1 → REJECT (45°-Gate)</span>
            </div>
          </div>
        </div>

        {/* Mode B Details */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            currentMode === 'MICROPROCESSOR_8086'
              ? 'bg-indigo-950/20 border-indigo-500/50 text-indigo-200'
              : 'bg-slate-950/40 border-slate-800 text-slate-500'
          }`}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="font-bold flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-indigo-400" />
              MODE B: INTEL 8086 + 8255 PPI I/O
            </span>
            {currentMode === 'MICROPROCESSOR_8086' && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                <CheckCircle className="w-3 h-3" /> ACTIVE
              </span>
            )}
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center gap-1">
              <span className="text-slate-400">IN AL, 80H</span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
              <span className="text-slate-300">Ingest PA0-PA5 Vision Flags</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400">CMP / TEST</span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
              <span className="text-amber-400">Evaluate Fault Bit Mask (3EH)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400">OUT 81H, AL</span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
              <span className="text-cyan-400">Drive PB1 (Gate Servo) &amp; PB2/3 (LEDs)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
