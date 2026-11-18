import React from 'react';
import { AlertOctagon, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface FaultInjectionPanelProps {
  faultState: {
    has_fault: boolean;
    description: string | null;
    fault_tick: number | null;
  };
  onInjectFault: (faultType: string) => void;
  onClearFault: () => void;
  isLoading: boolean;
}

export const FaultInjectionPanel: React.FC<FaultInjectionPanelProps> = ({
  faultState,
  onInjectFault,
  onClearFault,
  isLoading,
}) => {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Industrial Fault Injection &amp; Diagnostics</h3>
            <p className="text-[11px] text-slate-400">Simulate hardware anomalies and verify fail-safe interlocking</p>
          </div>
        </div>

        {faultState?.has_fault ? (
          <button
            onClick={onClearFault}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Clear Hardware Fault</span>
          </button>
        ) : (
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            SYSTEM NORMAL
          </span>
        )}
      </div>

      {faultState.has_fault && (
        <div className="mt-3 p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 font-mono text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
            <span>
              <strong>ACTIVE FAULT:</strong> {faultState.description} (Triggered at T+{faultState.fault_tick})
            </span>
          </div>
        </div>
      )}

      {/* Fault Injection Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 font-mono text-xs">
        <button
          onClick={() => onInjectFault('CONVEYOR_JAM')}
          disabled={isLoading || faultState.has_fault}
          className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-950/20 text-slate-300 hover:text-amber-200 transition-all text-left disabled:opacity-40"
        >
          <div className="font-bold text-amber-400">Conveyor Jam</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Motor stall / belt mechanical obstruction</div>
        </button>

        <button
          onClick={() => onInjectFault('SENSOR_BLINDING')}
          disabled={isLoading || faultState.has_fault}
          className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-950/20 text-slate-300 hover:text-amber-200 transition-all text-left disabled:opacity-40"
        >
          <div className="font-bold text-amber-400">Optical Sensor Failure</div>
          <div className="text-[10px] text-slate-500 mt-0.5">IR beam emitter occlusion / timeout</div>
        </button>

        <button
          onClick={() => onInjectFault('GATE_PNEUMATIC_FAIL')}
          disabled={isLoading || faultState.has_fault}
          className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-950/20 text-slate-300 hover:text-amber-200 transition-all text-left disabled:opacity-40"
        >
          <div className="font-bold text-amber-400">Gate Pneumatic Loss</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Diverter actuator pressure drop</div>
        </button>
      </div>
    </div>
  );
};
