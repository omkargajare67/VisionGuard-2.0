import React, { useState, useEffect } from 'react';
import {
  simulateHalfAdder,
  simulateFullAdder,
  simulateMultiplexer,
  simulateDecoder,
  simulatePriorityEncoder,
  simulateParity,
} from '../../services/api';
import type {
  HalfAdderResult,
  FullAdderResult,
  MultiplexerResult,
  DecoderResult,
  PriorityEncoderResult,
  ParityResult,
} from '../../types';
import { Cpu, Split, GitMerge, Binary, ShieldCheck, AlertCircle } from 'lucide-react';

export const CombinationalLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ha' | 'fa' | 'mux' | 'decoder' | 'encoder' | 'parity'>('ha');

  // Half Adder States
  const [haA, setHaA] = useState<number>(1);
  const [haB, setHaB] = useState<number>(1);
  const [haResult, setHaResult] = useState<HalfAdderResult | null>(null);

  // Full Adder States
  const [faA, setFaA] = useState<number>(1);
  const [faB, setFaB] = useState<number>(0);
  const [faCin, setFaCin] = useState<number>(1);
  const [faResult, setFaResult] = useState<FullAdderResult | null>(null);

  // Multiplexer States
  const [muxType, setMuxType] = useState<string>('4:1');
  const [muxData, setMuxData] = useState<Record<string, number>>({
    D0: 0,
    D1: 1,
    D2: 0,
    D3: 1,
  });
  const [muxSelect, setMuxSelect] = useState<Record<string, number>>({
    S0: 1,
    S1: 0,
  });
  const [muxResult, setMuxResult] = useState<MultiplexerResult | null>(null);

  // Decoder States
  const [decoderType, setDecoderType] = useState<string>('2:4');
  const [decoderInputs, setDecoderInputs] = useState<Record<string, number>>({
    A0: 1,
    A1: 0,
  });
  const [decoderEnable, setDecoderEnable] = useState<number>(1);
  const [decoderResult, setDecoderResult] = useState<DecoderResult | null>(null);

  // Priority Encoder States
  const [encoderType, setEncoderType] = useState<string>('4:2');
  const [encoderInputs, setEncoderInputs] = useState<Record<string, number>>({
    D0: 0,
    D1: 0,
    D2: 1,
    D3: 0,
  });
  const [encoderResult, setEncoderResult] = useState<PriorityEncoderResult | null>(null);

  // Parity Generator & Checker States
  const [parityBits, setParityBits] = useState<number[]>([1, 0, 1, 1]);
  const [parityType, setParityType] = useState<'even' | 'odd'>('even');
  const [rxParity, setRxParity] = useState<number | undefined>(undefined);
  const [parityResult, setParityResult] = useState<ParityResult | null>(null);

  // Effects to run simulations whenever inputs change
  useEffect(() => {
    if (activeTab === 'ha') {
      simulateHalfAdder(haA, haB).then(setHaResult).catch(console.error);
    }
  }, [activeTab, haA, haB]);

  useEffect(() => {
    if (activeTab === 'fa') {
      simulateFullAdder(faA, faB, faCin).then(setFaResult).catch(console.error);
    }
  }, [activeTab, faA, faB, faCin]);

  useEffect(() => {
    if (activeTab === 'mux') {
      simulateMultiplexer(muxType, muxData, muxSelect).then(setMuxResult).catch(console.error);
    }
  }, [activeTab, muxType, muxData, muxSelect]);

  useEffect(() => {
    if (activeTab === 'decoder') {
      simulateDecoder(decoderType, decoderInputs, decoderEnable)
        .then(setDecoderResult)
        .catch(console.error);
    }
  }, [activeTab, decoderType, decoderInputs, decoderEnable]);

  useEffect(() => {
    if (activeTab === 'encoder') {
      simulatePriorityEncoder(encoderType, encoderInputs)
        .then(setEncoderResult)
        .catch(console.error);
    }
  }, [activeTab, encoderType, encoderInputs]);

  useEffect(() => {
    if (activeTab === 'parity') {
      simulateParity(parityBits, parityType, rxParity)
        .then(setParityResult)
        .catch(console.error);
    }
  }, [activeTab, parityBits, parityType, rxParity]);

  return (
    <div className="space-y-6">
      {/* Subtab Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
        {[
          { id: 'ha', label: 'Half Adder', icon: Cpu },
          { id: 'fa', label: 'Full Adder', icon: Cpu },
          { id: 'mux', label: 'Multiplexer (MUX)', icon: GitMerge },
          { id: 'decoder', label: 'Decoder', icon: Split },
          { id: 'encoder', label: 'Priority Encoder', icon: Binary },
          { id: 'parity', label: 'Parity Gen & Check', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ---------------- 1. HALF ADDER ---------------- */}
      {activeTab === 'ha' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-base font-bold text-white">Half Adder Circuit (1-Bit)</h4>
                <p className="text-xs text-slate-400">Sum = A ⊕ B, Carry = A · B</p>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-bold">2 Inputs → 2 Outputs</span>
            </div>

            {/* Circuit Inputs and Outputs Visualizer */}
            <div className="h-56 rounded-xl bg-slate-950/80 border border-slate-800 p-6 flex items-center justify-between">
              {/* Inputs */}
              <div className="flex flex-col space-y-6">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono font-bold text-slate-300 w-4">A</span>
                  <button
                    onClick={() => setHaA(haA === 1 ? 0 : 1)}
                    className={`w-12 h-9 rounded-lg font-mono font-bold text-sm ${
                      haA === 1
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {haA}
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono font-bold text-slate-300 w-4">B</span>
                  <button
                    onClick={() => setHaB(haB === 1 ? 0 : 1)}
                    className={`w-12 h-9 rounded-lg font-mono font-bold text-sm ${
                      haB === 1
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {haB}
                  </button>
                </div>
              </div>

              {/* Center Box */}
              <div className="w-32 h-28 rounded-2xl border-2 border-cyan-500/50 bg-cyan-950/20 flex flex-col items-center justify-center p-2 text-center shadow-lg">
                <span className="text-xs font-mono font-bold text-cyan-300">HALF ADDER</span>
                <span className="text-[10px] text-slate-400 mt-1">XOR + AND</span>
              </div>

              {/* Outputs */}
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono font-bold text-slate-300 w-12">SUM (S)</span>
                  <div
                    className={`w-12 h-9 rounded-lg font-mono font-bold text-sm flex items-center justify-center ${
                      haResult?.outputs.Sum === 1
                        ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md shadow-cyan-500/40'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {haResult?.outputs.Sum ?? 0}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono font-bold text-slate-300 w-12">CARRY (C)</span>
                  <div
                    className={`w-12 h-9 rounded-lg font-mono font-bold text-sm flex items-center justify-center ${
                      haResult?.outputs.Carry === 1
                        ? 'bg-purple-500 text-slate-950 font-extrabold shadow-md shadow-purple-500/40'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {haResult?.outputs.Carry ?? 0}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Binary Addition Result: {haA} + {haB} ={' '}
              <span className="font-mono text-cyan-400 font-bold">
                {haResult ? `${haResult.outputs.Carry}${haResult.outputs.Sum}₂ (${haResult.outputs.Carry * 2 + haResult.outputs.Sum}₁₀)` : '-'}
              </span>
            </div>
          </div>

          {/* Truth Table */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
            <h4 className="text-sm font-bold text-white">Half Adder Truth Table</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-3">A</th>
                    <th className="py-2 px-3">B</th>
                    <th className="py-2 px-3 text-cyan-400">Sum</th>
                    <th className="py-2 px-3 text-purple-400">Carry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {haResult?.truth_table.map((row, idx) => {
                    const isActive = row.A === haA && row.B === haB;
                    return (
                      <tr
                        key={idx}
                        className={isActive ? 'bg-cyan-500/15 font-bold text-white' : 'text-slate-300'}
                      >
                        <td className="py-2 px-3">{row.A}</td>
                        <td className="py-2 px-3">{row.B}</td>
                        <td className="py-2 px-3 text-cyan-300">{row.Sum}</td>
                        <td className="py-2 px-3 text-purple-300">{row.Carry}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 2. FULL ADDER ---------------- */}
      {activeTab === 'fa' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-base font-bold text-white">Full Adder Circuit (Cascaded 1-Bit)</h4>
                <p className="text-xs text-slate-400">
                  Sum = A ⊕ B ⊕ Cin, Cout = (A·B) + (Cin·(A⊕B))
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-bold">3 Inputs → 2 Outputs</span>
            </div>

            {/* Controls & Diagram */}
            <div className="h-64 rounded-xl bg-slate-950/80 border border-slate-800 p-6 flex items-center justify-between">
              {/* Inputs */}
              <div className="flex flex-col space-y-4">
                {[
                  { name: 'A', val: faA, setVal: setFaA },
                  { name: 'B', val: faB, setVal: setFaB },
                  { name: 'Cin', val: faCin, setVal: setFaCin },
                ].map((inp) => (
                  <div key={inp.name} className="flex items-center space-x-3">
                    <span className="text-xs font-mono font-bold text-slate-300 w-8">{inp.name}</span>
                    <button
                      onClick={() => inp.setVal(inp.val === 1 ? 0 : 1)}
                      className={`w-12 h-8 rounded-lg font-mono font-bold text-xs ${
                        inp.val === 1
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {inp.val}
                    </button>
                  </div>
                ))}
              </div>

              {/* Center Full Adder Box */}
              <div className="w-36 h-36 rounded-2xl border-2 border-cyan-500/50 bg-cyan-950/20 flex flex-col items-center justify-center p-2 text-center shadow-lg space-y-1">
                <span className="text-xs font-mono font-bold text-cyan-300">FULL ADDER</span>
                <span className="text-[10px] text-slate-400">2x HA + OR Gate</span>
                <span className="text-[9px] text-slate-500 font-mono">
                  HA1 Sum: {faResult?.intermediate.HA1_Sum ?? '-'}
                </span>
              </div>

              {/* Outputs */}
              <div className="flex flex-col space-y-6">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono font-bold text-slate-300 w-14">SUM (S)</span>
                  <div
                    className={`w-12 h-9 rounded-lg font-mono font-bold text-sm flex items-center justify-center ${
                      faResult?.outputs.Sum === 1
                        ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md shadow-cyan-500/40'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {faResult?.outputs.Sum ?? 0}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono font-bold text-slate-300 w-14">COUT (C)</span>
                  <div
                    className={`w-12 h-9 rounded-lg font-mono font-bold text-sm flex items-center justify-center ${
                      faResult?.outputs.Cout === 1
                        ? 'bg-purple-500 text-slate-950 font-extrabold shadow-md shadow-purple-500/40'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {faResult?.outputs.Cout ?? 0}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Binary Addition: {faA} + {faB} + {faCin} ={' '}
              <span className="font-mono text-cyan-400 font-bold">
                {faResult ? `${faResult.outputs.Cout}${faResult.outputs.Sum}₂ (${faResult.outputs.Cout * 2 + faResult.outputs.Sum}₁₀)` : '-'}
              </span>
            </div>
          </div>

          {/* Full Adder Truth Table */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
            <h4 className="text-sm font-bold text-white">Full Adder Truth Table (8 Rows)</h4>
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-xs text-left font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-2">A</th>
                    <th className="py-2 px-2">B</th>
                    <th className="py-2 px-2">Cin</th>
                    <th className="py-2 px-2 text-cyan-400">Sum</th>
                    <th className="py-2 px-2 text-purple-400">Cout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {faResult?.truth_table.map((row, idx) => {
                    const isActive = row.A === faA && row.B === faB && row.Cin === faCin;
                    return (
                      <tr
                        key={idx}
                        className={isActive ? 'bg-cyan-500/15 font-bold text-white' : 'text-slate-300'}
                      >
                        <td className="py-1.5 px-2">{row.A}</td>
                        <td className="py-1.5 px-2">{row.B}</td>
                        <td className="py-1.5 px-2">{row.Cin}</td>
                        <td className="py-1.5 px-2 text-cyan-300">{row.Sum}</td>
                        <td className="py-1.5 px-2 text-purple-300">{row.Cout}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 3. MULTIPLEXER (MUX) ---------------- */}
      {activeTab === 'mux' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-base font-bold text-white">Digital Multiplexer (Data Selector)</h4>
              <p className="text-xs text-slate-400">
                Routes 1 of 2<sup>N</sup> input data lines to a single shared output line using N select lines
              </p>
            </div>
            {/* MUX Type Selector */}
            <div className="flex items-center space-x-2">
              {['2:1', '4:1', '8:1'].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setMuxType(t);
                    if (t === '2:1') {
                      setMuxData({ D0: 1, D1: 0 });
                      setMuxSelect({ S0: 0 });
                    } else if (t === '4:1') {
                      setMuxData({ D0: 0, D1: 1, D2: 0, D3: 1 });
                      setMuxSelect({ S0: 1, S1: 0 });
                    } else {
                      setMuxData({ D0: 0, D1: 1, D2: 0, D3: 1, D4: 0, D5: 1, D6: 0, D7: 1 });
                      setMuxSelect({ S0: 0, S1: 1, S2: 0 });
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    muxType === t ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Data Switches */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase">Data Inputs (D)</span>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(muxData).map((k) => {
                  const channelIdx = parseInt(k.replace('D', ''), 10);
                  const isSelected = muxResult?.selected_channel === channelIdx;
                  return (
                    <button
                      key={k}
                      onClick={() =>
                        setMuxData({ ...muxData, [k]: muxData[k] === 1 ? 0 : 1 })
                      }
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/40 shadow-sm shadow-cyan-400/20'
                          : 'border-slate-800 bg-slate-950'
                      }`}
                    >
                      <span className="font-bold text-slate-300">{k}</span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          muxData[k] === 1
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {muxData[k]}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] text-cyan-400 uppercase font-sans">Active</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Select Lines & Output */}
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold text-slate-300 uppercase">
                Select Address Lines (S)
              </span>
              <div className="flex items-center space-x-3">
                {Object.keys(muxSelect).map((s) => (
                  <div key={s} className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-purple-300">{s}:</span>
                    <button
                      onClick={() =>
                        setMuxSelect({ ...muxSelect, [s]: muxSelect[s] === 1 ? 0 : 1 })
                      }
                      className={`w-10 h-8 rounded-lg font-mono font-bold text-xs ${
                        muxSelect[s] === 1
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {muxSelect[s]}
                    </button>
                  </div>
                ))}
                <span className="text-xs text-slate-400 pl-2">
                  Address Decimal: Channel{' '}
                  <strong className="text-cyan-400 font-mono">D{muxResult?.selected_channel}</strong>
                </span>
              </div>

              {/* Output Display */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Selected MUX Output (Y)</div>
                  <div className="text-xs font-mono text-cyan-300 mt-1">
                    Y = D{muxResult?.selected_channel} = {muxResult?.output}
                  </div>
                </div>
                <div
                  className={`w-16 h-12 rounded-xl flex items-center justify-center font-mono text-2xl font-extrabold ${
                    muxResult?.output === 1
                      ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/40 animate-pulse'
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
                >
                  {muxResult?.output ?? 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 4. DECODER ---------------- */}
      {activeTab === 'decoder' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-base font-bold text-white">Binary Decoder / Demultiplexer</h4>
              <p className="text-xs text-slate-400">
                Converts N-bit binary address into 1 of 2<sup>N</sup> mutually exclusive active-HIGH output lines
              </p>
            </div>
            {/* Decoder Type Selector */}
            <div className="flex items-center space-x-2">
              {['2:4', '3:8'].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setDecoderType(t);
                    if (t === '2:4') {
                      setDecoderInputs({ A0: 0, A1: 0 });
                    } else {
                      setDecoderInputs({ A0: 0, A1: 0, A2: 0 });
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    decoderType === t ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Inputs & Enable */}
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-bold text-slate-300 uppercase">Input Address & Enable</span>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                {/* Enable Switch */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-mono font-bold text-purple-300">Enable (E):</span>
                  <button
                    onClick={() => setDecoderEnable(decoderEnable === 1 ? 0 : 1)}
                    className={`px-3 py-1 rounded-lg font-mono text-xs font-bold ${
                      decoderEnable === 1 ? 'bg-emerald-600 text-white' : 'bg-rose-900 text-rose-300'
                    }`}
                  >
                    {decoderEnable === 1 ? 'ENABLED (1)' : 'DISABLED (0)'}
                  </button>
                </div>

                {/* Address Bits */}
                {Object.keys(decoderInputs).map((a) => (
                  <div key={a} className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-300">{a}</span>
                    <button
                      onClick={() =>
                        setDecoderInputs({ ...decoderInputs, [a]: decoderInputs[a] === 1 ? 0 : 1 })
                      }
                      className={`w-12 h-8 rounded-lg font-mono font-bold text-xs ${
                        decoderInputs[a] === 1 ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {decoderInputs[a]}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Output Lines Display */}
            <div className="lg:col-span-7 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase">
                Decoded Output Lines ({decoderResult?.active_line || 'None'})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {decoderResult &&
                  Object.keys(decoderResult.outputs).map((y) => {
                    const isActive = decoderResult.outputs[y] === 1;
                    return (
                      <div
                        key={y}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center font-mono transition-all ${
                          isActive
                            ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-md shadow-cyan-500/20'
                            : 'border-slate-800 bg-slate-950 text-slate-600'
                        }`}
                      >
                        <span className="text-xs font-bold">{y}</span>
                        <span className="text-xl font-extrabold mt-1">
                          {decoderResult.outputs[y]}
                        </span>
                        <span className="text-[9px] uppercase mt-0.5">
                          {isActive ? 'ASSERTED' : 'INACTIVE'}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 5. PRIORITY ENCODER ---------------- */}
      {activeTab === 'encoder' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-base font-bold text-white">Priority Encoder (Hardware Arbitrator)</h4>
              <p className="text-xs text-slate-400">
                Encodes highest index active input line into binary code (used in interrupt controllers & fault alarms)
              </p>
            </div>
            {/* Encoder Type Selector */}
            <div className="flex items-center space-x-2">
              {['4:2', '8:3'].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setEncoderType(t);
                    if (t === '4:2') {
                      setEncoderInputs({ D0: 0, D1: 0, D2: 1, D3: 0 });
                    } else {
                      setEncoderInputs({
                        D0: 0,
                        D1: 0,
                        D2: 0,
                        D3: 0,
                        D4: 1,
                        D5: 0,
                        D6: 0,
                        D7: 0,
                      });
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    encoderType === t ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Switches */}
            <div className="lg:col-span-6 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase">Input Request Lines</span>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(encoderInputs).map((k) => (
                  <button
                    key={k}
                    onClick={() =>
                      setEncoderInputs({ ...encoderInputs, [k]: encoderInputs[k] === 1 ? 0 : 1 })
                    }
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
                      encoderResult?.highest_active_input === k
                        ? 'border-purple-400 bg-purple-950/40 text-purple-300 shadow-md'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <span>{k}</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        encoderInputs[k] === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {encoderInputs[k]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Encoded Binary Code Output */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold text-slate-300 uppercase">Arbitrated Binary Code</span>
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Highest Active Line:</span>
                  <span className="text-xs font-mono font-bold text-purple-400">
                    {encoderResult?.highest_active_input || 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Valid Indicator Bit (V):</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                      encoderResult?.valid === 1
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    V = {encoderResult?.valid ?? 0}
                  </span>
                </div>

                {/* Output Bits */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-center space-x-3">
                  {encoderResult &&
                    Object.keys(encoderResult.outputs).map((bit) => (
                      <div key={bit} className="flex flex-col items-center">
                        <span className="text-[10px] font-mono text-slate-400">{bit}</span>
                        <div className="w-12 h-10 rounded-lg bg-cyan-950/40 border border-cyan-800 flex items-center justify-center font-mono text-lg font-bold text-cyan-300 mt-1">
                          {encoderResult.outputs[bit]}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 6. PARITY GENERATOR & CHECKER ---------------- */}
      {activeTab === 'parity' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-base font-bold text-white">Parity Generator & Error Checker</h4>
              <p className="text-xs text-slate-400">
                XOR-based error detection code generator with interactive receiver noise corruption simulator
              </p>
            </div>
            {/* Parity Type */}
            <div className="flex items-center space-x-2">
              {(['even', 'odd'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setParityType(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                    parityType === t ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {t} Parity
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Transmitter Side */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold text-slate-300 uppercase">
                1. Transmitter (Data Bits + Parity Gen)
              </span>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="text-xs text-slate-400">Click to flip transmitter bits:</div>
                <div className="flex items-center space-x-2">
                  {parityBits.map((b, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const updated = [...parityBits];
                        updated[idx] = updated[idx] === 1 ? 0 : 1;
                        setParityBits(updated);
                      }}
                      className={`w-12 h-10 rounded-lg font-mono font-bold text-sm ${
                        b === 1 ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Generated Parity Bit (P):</span>
                  <span className="font-mono text-purple-400 font-extrabold text-sm">
                    P = {parityResult?.generated_parity ?? 0}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Transmitted Frame: [{parityResult?.transmitted_frame.join(', ')}]
                </div>
              </div>
            </div>

            {/* Receiver & Noise Injector */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold text-slate-300 uppercase">
                2. Receiver Checker & Error Detection
              </span>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="text-xs text-slate-400">Simulate Transmission Noise (Flip Received Parity Bit):</div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      const expectedP = parityResult?.generated_parity ?? 0;
                      setRxParity(expectedP === 1 ? 0 : 1);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-md"
                  >
                    Inject Bit Error
                  </button>
                  <button
                    onClick={() => setRxParity(undefined)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 bg-slate-800"
                  >
                    Restore Clean Channel
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Total 1s in Frame:</span>
                    <span className="font-mono text-slate-200">
                      {parityResult?.checker?.total_ones ?? 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Error Status:</span>
                    {parityResult?.checker?.error_detected ? (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800 flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>PARITY ERROR DETECTED</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center space-x-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>DATA FRAME VALID</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
