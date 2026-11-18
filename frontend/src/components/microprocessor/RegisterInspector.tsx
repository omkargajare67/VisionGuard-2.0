import React from 'react';
import type { Registers8086State } from '../../types';
import { Cpu, Binary, Layers, Flag } from 'lucide-react';

interface RegisterInspectorProps {
  registers: Registers8086State | null;
}

export const RegisterInspector: React.FC<RegisterInspectorProps> = ({ registers }) => {
  if (!registers) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        No active CPU register state loaded.
      </div>
    );
  }

  const { general, pointers, segments, special } = registers;
  const flags = special.FLAGS.flags;

  return (
    <div className="space-y-6">
      {/* 1. General Purpose Registers (AX, BX, CX, DX) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span>General-Purpose 16-Bit Registers & 8-Bit Aliases</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              AX (Accumulator), BX (Base), CX (Count), DX (Data) with High/Low byte partition
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-bold">16-Bit Architecture</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'AX', title: 'Accumulator', data: general.AX },
            { name: 'BX', title: 'Base Register', data: general.BX },
            { name: 'CX', title: 'Count Register', data: general.CX },
            { name: 'DX', title: 'Data Register', data: general.DX },
          ].map((r) => (
            <div
              key={r.name}
              className="p-4 rounded-xl border border-slate-800 bg-slate-950 font-mono space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-cyan-400">{r.name}</span>
                <span className="text-[10px] text-slate-500 font-sans">{r.title}</span>
              </div>

              {/* 16-Bit Hex and Decimal */}
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl font-extrabold text-white tracking-wider">
                  {r.data.hex}
                </span>
                <span className="text-xs text-slate-400">{r.data.dec}₁₀</span>
              </div>

              {/* High & Low Byte Aliases */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">{r.name[0]}H (High)</span>
                  <span className="font-bold text-purple-300">{r.data.H}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">{r.name[0]}L (Low)</span>
                  <span className="font-bold text-cyan-300">{r.data.L}</span>
                </div>
              </div>

              {/* Binary String */}
              <div className="text-[10px] text-slate-500 text-center tracking-widest pt-1">
                {r.data.bin.slice(0, 8)} {r.data.bin.slice(8)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. FLAGS Register Visualizer */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Flag className="w-5 h-5 text-amber-400" />
              <span>FLAGS Register (Status & Control Bits)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              16-bit status word reflecting ALU calculation results and system control flags
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-amber-300">
            {special.FLAGS.hex} ({special.FLAGS.binary})
          </span>
        </div>

        {/* Individual Flag Badges */}
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {[
            { key: 'CF', name: 'Carry', bit: flags.CF, desc: 'Carry or borrow out of MSB' },
            { key: 'PF', name: 'Parity', bit: flags.PF, desc: 'Even number of 1-bits in result' },
            { key: 'AF', name: 'Aux Carry', bit: flags.AF, desc: 'Carry out of bit 3 (BCD)' },
            { key: 'ZF', name: 'Zero', bit: flags.ZF, desc: 'Result equals zero' },
            { key: 'SF', name: 'Sign', bit: flags.SF, desc: 'Most significant bit is 1' },
            { key: 'TF', name: 'Trap', bit: flags.TF, desc: 'Single-step debug mode' },
            { key: 'IF', name: 'Interrupt', bit: flags.IF, desc: 'Maskable INTR enabled' },
            { key: 'DF', name: 'Direction', bit: flags.DF, desc: 'String auto-decrement' },
            { key: 'OF', name: 'Overflow', bit: flags.OF, desc: 'Signed arithmetic overflow' },
          ].map((f) => {
            const isSet = f.bit === 1;
            return (
              <div
                key={f.key}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center font-mono transition-all ${
                  isSet
                    ? 'border-amber-400 bg-amber-950/40 text-amber-300 shadow-md shadow-amber-500/20'
                    : 'border-slate-800 bg-slate-950 text-slate-500'
                }`}
              >
                <span className="text-xs font-bold">{f.key}</span>
                <span className="text-xl font-extrabold my-1">{f.bit}</span>
                <span className="text-[9px] uppercase tracking-wider">
                  {isSet ? 'SET' : 'CLR'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Pointer & Index Registers & Segment Registers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pointer & Index Registers */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <Binary className="w-4 h-4 text-cyan-400" />
              <span>Pointer & Index Registers</span>
            </h4>
            <span className="text-xs font-mono text-slate-400">Offset Addressing</span>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            {[
              { name: 'SP', role: 'Stack Pointer', data: pointers.SP },
              { name: 'BP', role: 'Base Pointer', data: pointers.BP },
              { name: 'SI', role: 'Source Index', data: pointers.SI },
              { name: 'DI', role: 'Destination Index', data: pointers.DI },
            ].map((p) => (
              <div key={p.name} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300">{p.name}</span>
                  <span className="text-[10px] text-slate-500 font-sans">{p.role}</span>
                </div>
                <div className="text-lg font-bold text-white">{p.data.hex}</div>
                <div className="text-[10px] text-slate-400">{p.data.dec}₁₀</div>
              </div>
            ))}
          </div>
        </div>

        {/* Segment Registers & IP */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Segment Registers & Instruction Pointer (IP)</span>
            </h4>
            <span className="text-xs font-mono text-slate-400">1 MB Physical Base</span>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            {[
              { name: 'CS', role: 'Code Segment', seg: segments.CS },
              { name: 'DS', role: 'Data Segment', seg: segments.DS },
              { name: 'SS', role: 'Stack Segment', seg: segments.SS },
              { name: 'ES', role: 'Extra Segment', seg: segments.ES },
            ].map((s) => (
              <div key={s.name} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300">{s.name}</span>
                  <span className="text-[10px] text-slate-500 font-sans">{s.role}</span>
                </div>
                <div className="text-lg font-bold text-white">{s.seg.hex}</div>
                <div className="text-[10px] text-slate-400">Base: {s.seg.base_physical}</div>
              </div>
            ))}
          </div>

          {/* Special IP Display */}
          <div className="p-3 rounded-xl bg-slate-950 border border-cyan-800/40 flex items-center justify-between font-mono text-xs">
            <div>
              <span className="font-bold text-cyan-400">IP (Instruction Pointer):</span>
              <span className="text-white ml-2 text-sm font-bold">{special.IP.hex}</span>
            </div>
            <div className="text-slate-400">
              Active CS:IP Physical: <strong className="text-cyan-300">{special.IP.physical}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
