import React, { useState, useEffect } from 'react';
import { simulateFlipFlop } from '../../services/api';
import type { FlipFlopResult } from '../../types';
import { Activity, Clock, AlertTriangle, Sparkles } from 'lucide-react';

export const FlipFlopLab: React.FC = () => {
  const [ffType, setFfType] = useState<string>('JK');
  const [qCurrent, setQCurrent] = useState<number>(0);
  const [ffInputs, setFfInputs] = useState<Record<string, number>>({ J: 1, K: 0 });
  const [clockPulse, setClockPulse] = useState<boolean>(false);
  const [ffResult, setFfResult] = useState<FlipFlopResult | null>(null);
  const [clockCount, setClockCount] = useState<number>(0);

  // Switch inputs when ffType changes
  const handleTypeChange = (type: string) => {
    setFfType(type);
    if (type === 'SR') setFfInputs({ S: 1, R: 0 });
    else if (type === 'JK') setFfInputs({ J: 1, K: 0 });
    else if (type === 'D') setFfInputs({ D: 1 });
    else if (type === 'T') setFfInputs({ T: 1 });
  };

  const evaluateFF = async (
    inputs = ffInputs,
    currentQ = qCurrent,
    asyncSet = 0,
    asyncReset = 0
  ) => {
    try {
      const res = await simulateFlipFlop({
        ffType,
        inputs,
        qCurrent: currentQ,
        clock: 1,
        asyncSet,
        asyncReset,
      });
      setFfResult(res);
      return res;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  useEffect(() => {
    evaluateFF();
  }, [ffType, ffInputs, qCurrent]);

  // Trigger clock pulse: latch next state into current state
  const handleClockPulse = async () => {
    setClockPulse(true);
    setTimeout(() => setClockPulse(false), 250);

    const res = await evaluateFF();
    if (res && res.q_next !== null) {
      setQCurrent(res.q_next);
      setClockCount((prev) => prev + 1);
    }
  };

  const handleAsyncPreset = async () => {
    const res = await evaluateFF(ffInputs, qCurrent, 1, 0);
    if (res && res.q_next !== null) setQCurrent(res.q_next);
  };

  const handleAsyncClear = async () => {
    const res = await evaluateFF(ffInputs, qCurrent, 0, 1);
    if (res && res.q_next !== null) setQCurrent(res.q_next);
  };

  const isInvalid = ffType === 'SR' && ffInputs.S === 1 && ffInputs.R === 1;

  return (
    <div className="space-y-6">
      {/* Top Selector Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Sequential Logic: Flip-Flop Laboratory</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Unit 3: Bistable multivibrator circuits, clock edge triggering, async set/clear, and excitation behavior
          </p>
        </div>

        {/* FF Type Tabs */}
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          {['SR', 'JK', 'D', 'T'].map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                ffType === t
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t} Flip-Flop
            </button>
          ))}
        </div>
      </div>

      {/* Main Simulation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Circuit Schematic with Live Controls */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-white">{ffType} Bistable Storage Cell</h4>
              <span className="text-xs font-mono text-cyan-400">
                Eq: {ffResult?.characteristic_equation}
              </span>
            </div>

            {/* Asynchronous Override Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleAsyncPreset}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition-all"
              >
                PRESET (Set 1)
              </button>
              <button
                onClick={handleAsyncClear}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 transition-all"
              >
                CLEAR (Reset 0)
              </button>
            </div>
          </div>

          {/* Circuit Interactive Block */}
          <div className="h-64 rounded-xl bg-slate-950/80 border border-slate-800 p-6 flex items-center justify-between relative overflow-hidden">
            {/* Synchronous Inputs */}
            <div className="flex flex-col space-y-4 z-10">
              {Object.keys(ffInputs).map((k) => (
                <div key={k} className="flex items-center space-x-3">
                  <span className="text-xs font-mono font-bold text-slate-300 w-4">{k}</span>
                  <button
                    onClick={() =>
                      setFfInputs({ ...ffInputs, [k]: ffInputs[k] === 1 ? 0 : 1 })
                    }
                    className={`w-12 h-9 rounded-lg font-mono font-bold text-sm ${
                      ffInputs[k] === 1
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {ffInputs[k]}
                  </button>
                </div>
              ))}

              {/* Clock Pulse Trigger */}
              <div className="pt-2">
                <button
                  onClick={handleClockPulse}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all ${
                    clockPulse
                      ? 'bg-amber-400 text-slate-950 scale-105 shadow-lg shadow-amber-400/50'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Clock Pulse (↑)</span>
                </button>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Pulses: {clockCount}
                </div>
              </div>
            </div>

            {/* Center FF Chip */}
            <div className="w-36 h-40 rounded-2xl border-2 border-cyan-500/50 bg-cyan-950/20 flex flex-col items-center justify-between p-3 text-center shadow-lg z-10">
              <span className="text-xs font-mono font-extrabold text-cyan-300">
                {ffType} FLIP-FLOP
              </span>
              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 uppercase">Operation:</div>
                <div className="text-xs font-mono font-bold text-amber-300">
                  {ffResult?.operation || '-'}
                </div>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">Edge-Triggered</span>
            </div>

            {/* Outputs Q and Q_bar */}
            <div className="flex flex-col space-y-4 z-10">
              {/* Q */}
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono font-bold text-slate-300 w-8">Q</span>
                <div
                  className={`w-12 h-10 rounded-xl font-mono text-xl font-extrabold flex items-center justify-center ${
                    qCurrent === 1
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/40'
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
                >
                  {qCurrent}
                </div>
              </div>

              {/* Q_BAR */}
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono font-bold text-slate-300 w-8">Q'</span>
                <div
                  className={`w-12 h-10 rounded-xl font-mono text-xl font-extrabold flex items-center justify-center ${
                    1 - qCurrent === 1
                      ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/40'
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
                >
                  {1 - qCurrent}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-mono">
                Next Q: {ffResult?.q_next !== null ? ffResult?.q_next : 'INV'}
              </div>
            </div>

            {/* Background grid */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          </div>

          {/* Invalid SR State Warning */}
          {isInvalid && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Prohibited Input Condition: S=1, R=1</strong>
                <p className="mt-0.5 text-rose-300/80">
                  In an SR flip-flop, setting both Set and Reset simultaneously leads to an indeterminate meta-stable race condition (Q = Q' = 0 or 1), violating the complementary outputs requirement. JK Flip-Flop resolves this by toggling instead.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Characteristic & Excitation Details */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Characteristic & Excitation Truth Table</span>
          </h4>

          {/* FF specific details */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
            <div className="text-slate-300 font-semibold">Active State Transition:</div>
            <div className="text-slate-400 font-mono text-[11px] leading-relaxed">
              {ffResult?.details}
            </div>
          </div>

          {/* Excitation Summary Table for this FF */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 px-3">Inputs</th>
                  <th className="py-2 px-3">Q(t)</th>
                  <th className="py-2 px-3 text-cyan-400">Q(t+1)</th>
                  <th className="py-2 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {ffType === 'SR' && (
                  <>
                    <tr><td className="py-2 px-3">S=0, R=0</td><td className="py-2 px-3">Q</td><td className="py-2 px-3 text-cyan-300">Q</td><td className="py-2 px-3 text-slate-400">No Change (Hold)</td></tr>
                    <tr><td className="py-2 px-3">S=0, R=1</td><td className="py-2 px-3">Q</td><td className="py-2 px-3 text-cyan-300">0</td><td className="py-2 px-3 text-slate-400">Reset</td></tr>
                    <tr><td className="py-2 px-3">S=1, R=0</td><td className="py-2 px-3">Q</td><td className="py-2 px-3 text-cyan-300">1</td><td className="py-2 px-3 text-slate-400">Set</td></tr>
                    <tr className="text-rose-400"><td className="py-2 px-3">S=1, R=1</td><td className="py-2 px-3">Q</td><td className="py-2 px-3 text-rose-400">X</td><td className="py-2 px-3">Forbidden / Invalid</td></tr>
                  </>
                )}
                {ffType === 'JK' && (
                  <>
                    <tr><td className="py-2 px-3">J=0, K=0</td><td className="py-2 px-3">Q</td><td className="py-2 px-3 text-cyan-300">Q</td><td className="py-2 px-3 text-slate-400">No Change (Hold)</td></tr>
                    <tr><td className="py-2 px-3">J=0, K=1</td><td className="py-2 px-3">Q</td><td className="py-2 px-3 text-cyan-300">0</td><td className="py-2 px-3 text-slate-400">Reset</td></tr>
                    <tr><td className="py-2 px-3">J=1, K=0</td><td className="py-2 px-3">Q</td><td className="py-2 px-3 text-cyan-300">1</td><td className="py-2 px-3 text-slate-400">Set</td></tr>
                    <tr className="text-amber-300 font-bold"><td className="py-2 px-3">J=1, K=1</td><td className="py-2 px-3">Q</td><td className="py-2 px-3 text-amber-300">Q'</td><td className="py-2 px-3">Toggle (Q inverts)</td></tr>
                  </>
                )}
                {ffType === 'D' && (
                  <>
                    <tr><td className="py-2 px-3">D=0</td><td className="py-2 px-3">Q</td><td className="py-2 px-3 text-cyan-300">0</td><td className="py-2 px-3 text-slate-400">Transparent Latch 0</td></tr>
                    <tr><td className="py-2 px-3">D=1</td><td className="py-2 px-3">Q</td><td className="py-2 px-3 text-cyan-300">1</td><td className="py-2 px-3 text-slate-400">Transparent Latch 1</td></tr>
                  </>
                )}
                {ffType === 'T' && (
                  <>
                    <tr><td className="py-2 px-3">T=0</td><td className="py-2 px-3">Q</td><td className="py-2 px-3 text-cyan-300">Q</td><td className="py-2 px-3 text-slate-400">No Change (Hold)</td></tr>
                    <tr className="text-amber-300 font-bold"><td className="py-2 px-3">T=1</td><td className="py-2 px-3">Q</td><td className="py-2 px-3 text-amber-300">Q'</td><td className="py-2 px-3">Toggle (Frequency Divider ÷2)</td></tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
            Industrial context: D flip-flops buffer camera inspection triggers; T flip-flops form the frequency divider chain for the conveyor belt tachometer encoder.
          </div>
        </div>
      </div>
    </div>
  );
};
