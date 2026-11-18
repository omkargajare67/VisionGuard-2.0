import React, { useState, useEffect } from 'react';
import { fetchFsmState, triggerFsmTransition, resetFsm } from '../../services/api';
import type { FsmStateResult } from '../../types';
import { GitBranch, Play, RotateCcw, AlertOctagon, ShieldAlert, Cpu } from 'lucide-react';

const STATE_DETAILS: Record<string, { label: string; desc: string; icon: string }> = {
  IDLE: {
    label: 'IDLE',
    desc: 'Conveyor running, waiting for optical proximity sensor trigger.',
    icon: '⏳',
  },
  DETECT: {
    label: 'DETECT',
    desc: 'Product detected under inspection fixture, conveyor stopped.',
    icon: '📍',
  },
  CAPTURE: {
    label: 'CAPTURE',
    desc: 'Camera strobe illuminated, frame buffer acquired by OpenCV.',
    icon: '📸',
  },
  DECIDE: {
    label: 'DECIDE',
    desc: 'Combinational defect logic evaluating boolean flags.',
    icon: '⚖️',
  },
  SORT: {
    label: 'SORT',
    desc: 'Servo pneumatic gate actuating or bypassing product.',
    icon: '🔀',
  },
  RESET: {
    label: 'RESET',
    desc: 'Sensors cleared, cycle counters incremented, return to IDLE.',
    icon: '🔄',
  },
};

export const FSMVisualizer: React.FC = () => {
  const [fsmState, setFsmState] = useState<FsmStateResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadState = async () => {
    try {
      const res = await fetchFsmState();
      setFsmState(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch FSM state');
    }
  };

  useEffect(() => {
    loadState();
  }, []);

  const handleTransition = async (event: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await triggerFsmTransition(event);
      setFsmState({
        current_state: res.current_state,
        all_states: fsmState?.all_states || ['IDLE', 'DETECT', 'CAPTURE', 'DECIDE', 'SORT', 'RESET'],
        moore_outputs: res.moore_outputs,
        allowed_events: res.allowed_events,
        history: res.history,
      });
      if (!res.transition_valid && res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || 'Transition failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await resetFsm();
      setFsmState(res);
    } catch (err: any) {
      setError(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const states = fsmState?.all_states || ['IDLE', 'DETECT', 'CAPTURE', 'DECIDE', 'SORT', 'RESET'];
  const currentState = fsmState?.current_state || 'IDLE';

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <GitBranch className="w-5 h-5 text-cyan-400" />
              <span>Production Line Moore Finite State Machine (FSM)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Unit 3 Sequential FSM: Deterministic state sequence controlling conveyor, strobe camera, vision decision, and servo sorting gate
            </p>
          </div>

          <button
            onClick={handleReset}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset FSM to IDLE</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Interactive State Flow Graph */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h4 className="text-sm font-bold text-white">Sequential State Trajectory</h4>
          <span className="text-xs font-mono text-cyan-400">
            Active: <strong className="text-white">{currentState}</strong>
          </span>
        </div>

        {/* State Node Graph Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {states.map((st, idx) => {
            const isActive = st === currentState;
            const details = STATE_DETAILS[st] || { label: st, desc: '', icon: '⚙️' };
            return (
              <div
                key={st}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all relative overflow-hidden ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{details.icon}</span>
                    <span className="text-[10px] font-mono text-slate-500">S_{idx}</span>
                  </div>
                  <div className="font-bold font-mono text-sm mt-2 text-white">{st}</div>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{details.desc}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 mt-2 flex items-center justify-between text-[9px] uppercase font-bold">
                  <span className={isActive ? 'text-cyan-400 font-sans' : 'text-slate-600'}>
                    {isActive ? 'CURRENT' : 'STANDBY'}
                  </span>
                  {idx < states.length - 1 && <span className="text-slate-600">→</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Event Trigger Action Bar */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase">
              Trigger Event for Current State ({currentState})
            </span>
            <span className="text-[11px] text-slate-500">
              Only valid deterministic transitions succeed
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {fsmState?.allowed_events.map((ev) => (
              <button
                key={ev}
                onClick={() => handleTransition(ev)}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-md shadow-cyan-600/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{ev.replace(/_/g, ' ')}</span>
              </button>
            ))}

            {/* Emergency Stop / Fault Always Available */}
            <button
              onClick={() => handleTransition('EMERGENCY_STOP')}
              disabled={loading}
              className="px-3 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs uppercase flex items-center space-x-1.5 transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Emergency Stop</span>
            </button>
          </div>
        </div>
      </div>

      {/* Moore Outputs & Transition History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Moore Output Vector */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Moore Outputs in State: {currentState}</span>
            </h4>
            <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
              Output = f(State)
            </span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            {/* Conveyor Motor */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">Conveyor Motor:</span>
              <span
                className={`px-2.5 py-0.5 rounded font-bold ${
                  fsmState?.moore_outputs.conveyor_motor === 1
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {fsmState?.moore_outputs.conveyor_motor === 1 ? 'RUNNING (1)' : 'STOPPED (0)'}
              </span>
            </div>

            {/* Camera Trigger */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">Camera Strobe Trigger:</span>
              <span
                className={`px-2.5 py-0.5 rounded font-bold ${
                  fsmState?.moore_outputs.camera_trigger === 1
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {fsmState?.moore_outputs.camera_trigger === 1 ? 'STROBE PULSE (1)' : 'IDLE (0)'}
              </span>
            </div>

            {/* Inspection Active */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">Inspection Engine Active:</span>
              <span
                className={`px-2.5 py-0.5 rounded font-bold ${
                  fsmState?.moore_outputs.inspection_active === 1
                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {fsmState?.moore_outputs.inspection_active === 1 ? 'ACTIVE (1)' : 'IDLE (0)'}
              </span>
            </div>

            {/* Servo Gate */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">Servo Sorting Gate:</span>
              <span
                className={`px-2.5 py-0.5 rounded font-bold ${
                  fsmState?.moore_outputs.servo_gate_actuate === 1
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {fsmState?.moore_outputs.servo_gate_actuate === 1 ? 'ACTUATE DIVERTER (1)' : 'PASS THROUGH (0)'}
              </span>
            </div>

            {/* Status Code */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">Hardware Status Code:</span>
              <span className="text-cyan-400 font-bold">
                0x{fsmState?.moore_outputs.status_code.toString(16).toUpperCase() || '0'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: State Transition History Log */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-white">Transition Event Audit Log</h4>
            <span className="text-xs text-slate-400 font-mono">
              Events: {fsmState?.history.length || 0}
            </span>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-xs text-left font-mono">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-2 px-3">From State</th>
                  <th className="py-2 px-3">Event</th>
                  <th className="py-2 px-3 text-cyan-400">To State</th>
                  <th className="py-2 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {fsmState?.history.map((h, idx) => (
                  <tr key={idx} className="text-slate-300 hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-slate-400">{h.from_state}</td>
                    <td className="py-2 px-3 text-purple-300 font-bold">{h.event}</td>
                    <td className="py-2 px-3 text-cyan-300 font-bold">{h.to_state}</td>
                    <td className="py-2 px-3 text-right">
                      {h.valid ? (
                        <span className="text-emerald-400 text-[10px] uppercase font-bold">Valid</span>
                      ) : (
                        <span className="text-rose-400 text-[10px] uppercase font-bold">Invalid</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(!fsmState || fsmState.history.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500 italic">
                      No transitions logged yet. Trigger an event above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
