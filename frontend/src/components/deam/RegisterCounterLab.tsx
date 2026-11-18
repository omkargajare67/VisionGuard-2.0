import React, { useState, useEffect } from 'react';
import { simulateRegister, simulateCounter } from '../../services/api';
import type { RegisterResult, CounterResult } from '../../types';
import { Layers, ArrowRight, ArrowLeft, RotateCcw, Clock } from 'lucide-react';

export const RegisterCounterLab: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'registers' | 'counters'>('registers');

  // Register States
  const [regType, setRegType] = useState<string>('SIPO');
  const [regState, setRegState] = useState<number[]>([1, 0, 1, 0]);
  const [serialIn, setSerialIn] = useState<number>(1);
  const [parallelIn, setParallelIn] = useState<number[]>([1, 1, 0, 0]);
  const [regResult, setRegResult] = useState<RegisterResult | null>(null);

  // Counter States
  const [counterType, setCounterType] = useState<string>('SYNCHRONOUS_UP');
  const counterBits = 4;
  const [counterVal, setCounterVal] = useState<number>(0);
  const [counterModulo, setCounterModulo] = useState<number>(10); // e.g. BCD decade counter
  const counterEnable = 1;
  const counterReset = 0;
  const [counterResult, setCounterResult] = useState<CounterResult | null>(null);

  // Initial simulation
  useEffect(() => {
    simulateRegister({
      regType,
      currentState: regState,
      operation: 'HOLD',
      serialIn,
      parallelIn,
    })
      .then(setRegResult)
      .catch(console.error);
  }, [regType]);

  useEffect(() => {
    simulateCounter({
      counterType,
      bits: counterBits,
      currentValue: counterVal,
      modulo: counterType === 'MODULO_N' ? counterModulo : undefined,
      enable: counterEnable,
      reset: counterReset,
    })
      .then(setCounterResult)
      .catch(console.error);
  }, [counterType, counterBits, counterModulo]);

  // Register Operations
  const handleRegShiftRight = async () => {
    try {
      const res = await simulateRegister({
        regType,
        currentState: regState,
        operation: 'SHIFT_RIGHT',
        serialIn,
      });
      setRegState(res.current_state);
      setRegResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegShiftLeft = async () => {
    try {
      const res = await simulateRegister({
        regType,
        currentState: regState,
        operation: 'SHIFT_LEFT',
        serialIn,
      });
      setRegState(res.current_state);
      setRegResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegParallelLoad = async () => {
    try {
      const res = await simulateRegister({
        regType,
        currentState: regState,
        operation: 'PARALLEL_LOAD',
        parallelIn,
      });
      setRegState(res.current_state);
      setRegResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegClear = async () => {
    try {
      const res = await simulateRegister({
        regType,
        currentState: regState,
        operation: 'CLEAR',
      });
      setRegState(res.current_state);
      setRegResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  // Counter Operations
  const handleCounterClockStep = async () => {
    try {
      const res = await simulateCounter({
        counterType,
        bits: counterBits,
        currentValue: counterVal,
        modulo: counterType === 'MODULO_N' ? counterModulo : undefined,
        enable: counterEnable,
        reset: 0,
      });
      setCounterVal(res.next_value);
      setCounterResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCounterReset = async () => {
    try {
      const res = await simulateCounter({
        counterType,
        bits: counterBits,
        currentValue: counterVal,
        modulo: counterType === 'MODULO_N' ? counterModulo : undefined,
        enable: counterEnable,
        reset: 1,
      });
      setCounterVal(res.next_value);
      setCounterResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>Shift Registers & Synchronous Counters</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Unit 3: Serial/Parallel data conversion registers and multi-bit synchronous state counting machines
          </p>
        </div>

        <div className="flex items-center space-x-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSection('registers')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              activeSection === 'registers'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Shift Registers (SISO/SIPO/PISO/PIPO)
          </button>
          <button
            onClick={() => setActiveSection('counters')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              activeSection === 'counters'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Synchronous Counters (Up / Down / Mod-N)
          </button>
        </div>
      </div>

      {/* ---------------- 1. SHIFT REGISTERS SECTION ---------------- */}
      {activeSection === 'registers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white">4-Bit Shift Register Architecture</h4>
                <p className="text-xs text-slate-400">
                  {regType === 'SISO' && 'Serial-In Serial-Out: Time-delayed serial buffer'}
                  {regType === 'SIPO' && 'Serial-In Parallel-Out: Serial to parallel word converter (UART Receiver)'}
                  {regType === 'PISO' && 'Parallel-In Serial-Out: Parallel to serial word converter (UART Transmitter)'}
                  {regType === 'PIPO' && 'Parallel-In Parallel-Out: Synchronous bus latch register'}
                </p>
              </div>

              {/* Type Switcher */}
              <div className="flex items-center space-x-1">
                {['SISO', 'SIPO', 'PISO', 'PIPO'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setRegType(t)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold ${
                      regType === t ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Register Flip-Flop Chain */}
            <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center space-y-6">
              {/* Serial In Bit Switch */}
              <div className="flex items-center space-x-3 text-xs">
                <span className="text-slate-400 font-mono font-bold">Serial Input (SIN):</span>
                <button
                  onClick={() => setSerialIn(serialIn === 1 ? 0 : 1)}
                  className={`w-10 h-7 rounded-md font-mono font-bold text-xs ${
                    serialIn === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {serialIn}
                </button>
                <span className="text-slate-500 text-[11px]">(Injected during Shift)</span>
              </div>

              {/* 4 Flip-Flop Register Bit Cells */}
              <div className="flex items-center space-x-3">
                {regState.map((bit, idx) => (
                  <React.Fragment key={idx}>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-mono text-slate-400 mb-1">
                        FF_{3 - idx} (Q{3 - idx})
                      </span>
                      <div
                        className={`w-16 h-20 rounded-xl border-2 flex flex-col items-center justify-center font-mono transition-all ${
                          bit === 1
                            ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-md shadow-cyan-500/20'
                            : 'border-slate-800 bg-slate-900 text-slate-500'
                        }`}
                      >
                        <span className="text-2xl font-extrabold">{bit}</span>
                        <span className="text-[9px] uppercase mt-1">
                          {bit === 1 ? 'HIGH' : 'LOW'}
                        </span>
                      </div>
                    </div>
                    {idx < regState.length - 1 && (
                      <div className="text-slate-600 font-bold text-sm">→</div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Control Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={handleRegShiftRight}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-cyan-600/20"
                >
                  <span>Shift Right (→)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleRegShiftLeft}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Shift Left (←)</span>
                </button>
                <button
                  onClick={handleRegParallelLoad}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all"
                >
                  <span>Parallel Load [{parallelIn.join('')}]</span>
                </button>
                <button
                  onClick={handleRegClear}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs flex items-center space-x-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear (0000)</span>
                </button>
              </div>
            </div>

            {/* Parallel Input Setup */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white">Parallel Input Bus (D3 D2 D1 D0)</span>
                <p className="text-[11px] text-slate-400">Preset word for Parallel Load operation</p>
              </div>
              <div className="flex items-center space-x-2">
                {parallelIn.map((pb, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => {
                      const updated = [...parallelIn];
                      updated[pIdx] = updated[pIdx] === 1 ? 0 : 1;
                      setParallelIn(updated);
                    }}
                    className={`w-9 h-7 rounded-md font-mono font-bold text-xs ${
                      pb === 1 ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {pb}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Register Telemetry Card */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
            <h4 className="text-sm font-bold text-white">Register Status & Decoding</h4>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Binary Word:</span>
                <span className="text-cyan-400 font-bold text-sm">
                  {regResult?.binary_representation || '0000'}₂
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Decimal Value:</span>
                <span className="text-purple-400 font-bold text-sm">
                  {regResult?.decimal_value ?? 0}₁₀
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Hexadecimal:</span>
                <span className="text-slate-200 font-bold">
                  0x{regResult?.decimal_value.toString(16).toUpperCase() ?? '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Last Operation:</span>
                <span className="text-emerald-400 font-sans text-xs font-semibold">
                  {regResult?.operation || 'INIT'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
              Industrial role: Converts optical line-sensor bitstreams into parallel byte packets for the 8086 microprocessor data bus (Stage 4).
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 2. SYNCHRONOUS COUNTERS SECTION ---------------- */}
      {activeSection === 'counters' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white">4-Bit Synchronous Counter Simulation</h4>
                <p className="text-xs text-slate-400">
                  Shared common clock line across all flip-flops eliminates ripple propagation delays
                </p>
              </div>

              {/* Counter Type Switcher */}
              <div className="flex items-center space-x-1">
                {[
                  { id: 'SYNCHRONOUS_UP', label: 'Up' },
                  { id: 'SYNCHRONOUS_DOWN', label: 'Down' },
                  { id: 'MODULO_N', label: `Mod-${counterModulo}` },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setCounterType(t.id)}
                    className={`px-3 py-1 rounded-md text-xs font-bold ${
                      counterType === t.id ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Counter State Block */}
            <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center space-y-6">
              {/* Decimal Value Display */}
              <div className="flex flex-col items-center">
                <span className="text-xs text-slate-400 uppercase font-mono">Count Value</span>
                <div className="text-6xl font-mono font-extrabold text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)] mt-1">
                  {counterVal}
                </div>
                <span className="text-xs text-slate-400 font-mono mt-1">
                  Range: 0 to {counterType === 'MODULO_N' ? counterModulo - 1 : Math.pow(2, counterBits) - 1}
                </span>
              </div>

              {/* 4-Bit Flip-Flop States (Q3 Q2 Q1 Q0) */}
              <div className="flex items-center space-x-3">
                {counterResult?.binary_state.map((bit, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <span className="text-[10px] font-mono text-slate-400 mb-1">
                      Q{counterBits - 1 - idx}
                    </span>
                    <div
                      className={`w-14 h-16 rounded-xl border-2 flex items-center justify-center font-mono text-xl font-bold transition-all ${
                        bit === 1
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-md shadow-cyan-500/20'
                          : 'border-slate-800 bg-slate-900 text-slate-500'
                      }`}
                    >
                      {bit}
                    </div>
                  </div>
                ))}
              </div>

              {/* Control Action Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={handleCounterClockStep}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-all shadow-md shadow-cyan-600/30"
                >
                  <Clock className="w-4 h-4" />
                  <span>Clock Pulse (Step Count)</span>
                </button>
                <button
                  onClick={handleCounterReset}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset (0)</span>
                </button>
              </div>
            </div>

            {/* Modulo-N Selector if active */}
            {counterType === 'MODULO_N' && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white">Select Modulo Radix (N)</span>
                  <p className="text-[11px] text-slate-400">Resets to 0 upon reaching N</p>
                </div>
                <div className="flex items-center space-x-2">
                  {[5, 6, 8, 10, 12, 16].map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setCounterModulo(m);
                        setCounterVal(0);
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold ${
                        counterModulo === m ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Mod-{m}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Counter Status Flags Card */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
            <h4 className="text-sm font-bold text-white">Counter Status & Flags</h4>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Binary Output:</span>
                <span className="text-cyan-400 font-bold text-sm">
                  {counterResult?.binary_string || '0000'}₂
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Terminal Count (TC):</span>
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    counterResult?.terminal_count === 1
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  TC = {counterResult?.terminal_count ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Overflow Flag:</span>
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    counterResult?.overflow === 1
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  OVF = {counterResult?.overflow ?? 0}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300">Industrial Production Tally:</div>
              <p>
                In the automated sorting line, Mod-10 counters tally inspected products per packaging carton; when terminal count (TC=1) is asserted, an interrupt signal triggers carton seal mechanisms.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
