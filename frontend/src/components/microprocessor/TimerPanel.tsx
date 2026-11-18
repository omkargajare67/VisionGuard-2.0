import React, { useState } from 'react';
import { Timer, Clock } from 'lucide-react';
import type { TimerState, CPUFullState } from '../../types';
import { microprocessorApi } from '../../services/api';

interface TimerPanelProps {
  sessionId: string;
  timerState: TimerState | null;
  onStateUpdate: (state: CPUFullState) => void;
}

export const TimerPanel: React.FC<TimerPanelProps> = ({
  sessionId,
  timerState,
  onStateUpdate,
}) => {
  const [mode, setMode] = useState<number>(0);
  const [initialCount, setInitialCount] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const count = timerState?.channel0?.current_count ?? 10;
  const initCount = timerState?.channel0?.initial_count ?? 10;
  const outPin = Boolean(timerState?.channel0?.out_pin ?? 0);
  const terminalCountReached = timerState?.channel0?.terminal_count ?? false;
  const irqRaised = terminalCountReached;

  const progressPercent =
    initCount > 0
      ? Math.max(0, Math.min(100, Math.round(((initCount - count) / initCount) * 100)))
      : 0;

  const handleConfigureTimer = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await microprocessorApi.configureTimer(sessionId, mode, initialCount);
      onStateUpdate(res.cpu_state);
      setStatusMessage(`Configured 8253 Timer: Mode ${mode}, Initial Count = ${initialCount}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Configure failed';
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTick = async (ticks: number = 1) => {
    setLoading(true);
    try {
      const res = await microprocessorApi.tickTimer(sessionId, ticks);
      onStateUpdate(res.cpu_state);
      if (res.timer?.channel0?.terminal_count) {
        setStatusMessage(`Terminal count reached! IRQ0 raised (Type 8 hardware interrupt to 8086).`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tick failed';
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-950/80 border border-teal-700/60 text-teal-400">
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                Intel 8253 Programmable Interval Timer (PIT)
                <span className="text-xs px-2 py-0.5 rounded bg-teal-950/80 text-teal-300 border border-teal-800 font-mono">
                  Channel 0 $\to$ IRQ0 (Vector 8)
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Generates periodic clock ticks and hardware interrupt pulses for industrial conveyor timing and inspection timeouts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Timer State:</span>
              <span className="text-teal-400 font-bold">
                {count} / {initCount} Ticks
              </span>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="mt-4 p-3 bg-teal-950/50 border border-teal-800 rounded-lg text-xs text-teal-300 font-mono">
            {statusMessage}
          </div>
        )}
      </div>

      {/* Main Timer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Configuration Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-4">8253 Timer Configuration</h4>

            <div className="space-y-4">
              {/* Mode Selection */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Operating Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMode(0)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      mode === 0
                        ? 'bg-teal-950/70 border-teal-500/80 text-teal-100 shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-mono text-xs font-bold text-slate-200">Mode 0</div>
                    <div className="text-[11px] text-slate-400 mt-1">Interrupt on Terminal Count</div>
                  </button>
                  <button
                    onClick={() => setMode(3)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      mode === 3
                        ? 'bg-teal-950/70 border-teal-500/80 text-teal-100 shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-mono text-xs font-bold text-slate-200">Mode 3</div>
                    <div className="text-[11px] text-slate-400 mt-1">Square Wave Rate Generator</div>
                  </button>
                </div>
              </div>

              {/* Initial Count */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                  Initial Down-Counter Value (Decimal)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={65535}
                    value={initialCount}
                    onChange={(e) => setInitialCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-teal-300 font-mono text-sm focus:outline-none focus:border-teal-500"
                  />
                  <button
                    onClick={handleConfigureTimer}
                    disabled={loading}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow whitespace-nowrap"
                  >
                    Load Counter
                  </button>
                </div>
              </div>

              {/* Clock Tick Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => handleTick(1)}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-medium rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow"
                >
                  <Clock className="w-4 h-4" />
                  Clock Tick (1 Cycle)
                </button>
                <button
                  onClick={() => handleTick(5)}
                  disabled={loading}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-xs transition-colors"
                >
                  +5 Ticks
                </button>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4">
            Industrial use case: Timing conveyor movement between photo-electric sensor gate trigger and reject actuator firing.
          </p>
        </div>

        {/* Right: Live Meter & Output Signals */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-4">Down-Counter Live Meter</h4>

            {/* Progress Bar */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Countdown Progress</span>
                <span className="text-teal-400 font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Pin Signals Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* OUT Pin */}
              <div
                className={`p-3.5 rounded-lg border text-center transition-all ${
                  outPin
                    ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-xs font-mono font-bold">OUT Pin (Pin 10)</span>
                <div className="mt-2 text-sm font-bold font-mono">
                  {outPin ? 'LOGIC HIGH (1)' : 'LOGIC LOW (0)'}
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">Output pulse level</span>
              </div>

              {/* IRQ0 Triggered */}
              <div
                className={`p-3.5 rounded-lg border text-center transition-all ${
                  irqRaised
                    ? 'bg-amber-950/60 border-amber-500/80 text-amber-200 animate-pulse'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-xs font-mono font-bold">IRQ0 Line</span>
                <div className="mt-2 text-sm font-bold font-mono">
                  {irqRaised ? 'INTERRUPT ACTIVE' : 'QUIET'}
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">Sent to 8086 INTR pin</span>
              </div>
            </div>
          </div>

          {/* Terminal Count Banner */}
          {terminalCountReached && (
            <div className="mt-4 p-3 rounded-lg bg-teal-950 border border-teal-700 text-xs font-mono text-teal-200 flex items-center justify-between">
              <span>Terminal count reached (Count = 0)</span>
              <span className="px-2 py-0.5 rounded bg-teal-500 text-slate-950 font-bold">TC = 1</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
