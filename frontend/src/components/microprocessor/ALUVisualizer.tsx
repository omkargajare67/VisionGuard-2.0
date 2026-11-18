import React, { useState } from 'react';
import { Calculator, Activity, Zap } from 'lucide-react';
import type { FlagsState } from '../../types';

interface ALUVisualizerProps {
  lastAluOp?: {
    operation: string;
    op1: number;
    op2: number;
    result: number;
    is_16bit: boolean;
    flags: FlagsState;
    summary: string;
  } | null;
}

export const ALUVisualizer: React.FC<ALUVisualizerProps> = ({ lastAluOp }) => {
  const [interactiveOp, setInteractiveOp] = useState<string>('ADD');
  const [is16Bit, setIs16Bit] = useState<boolean>(true);
  const [op1Hex, setOp1Hex] = useState<string>('1234');
  const [op2Hex, setOp2Hex] = useState<string>('0056');

  // Compute interactive result
  const val1 = parseInt(op1Hex, 16) || 0;
  const val2 = parseInt(op2Hex, 16) || 0;
  const mask = is16Bit ? 0xffff : 0xff;
  const v1 = val1 & mask;
  const v2 = val2 & mask;

  let computedResult = 0;
  let flagCf = 0;
  let flagZf = 0;
  let flagSf = 0;
  let flagPf = 0;
  let flagOf = 0;
  let flagAf = 0;

  switch (interactiveOp) {
    case 'ADD': {
      const sum = v1 + v2;
      computedResult = sum & mask;
      flagCf = sum > mask ? 1 : 0;
      flagAf = ((v1 & 0xf) + (v2 & 0xf)) > 0xf ? 1 : 0;
      if (is16Bit) {
        const s1 = (v1 & 0x8000) !== 0;
        const s2 = (v2 & 0x8000) !== 0;
        const sr = (computedResult & 0x8000) !== 0;
        flagOf = (s1 === s2 && s1 !== sr) ? 1 : 0;
      } else {
        const s1 = (v1 & 0x80) !== 0;
        const s2 = (v2 & 0x80) !== 0;
        const sr = (computedResult & 0x80) !== 0;
        flagOf = (s1 === s2 && s1 !== sr) ? 1 : 0;
      }
      break;
    }
    case 'SUB':
    case 'CMP': {
      const diff = v1 - v2;
      computedResult = diff & mask;
      flagCf = v1 < v2 ? 1 : 0;
      flagAf = (v1 & 0xf) < (v2 & 0xf) ? 1 : 0;
      if (is16Bit) {
        const s1 = (v1 & 0x8000) !== 0;
        const s2 = (v2 & 0x8000) !== 0;
        const sr = (computedResult & 0x8000) !== 0;
        flagOf = (s1 !== s2 && sr !== s1) ? 1 : 0;
      } else {
        const s1 = (v1 & 0x80) !== 0;
        const s2 = (v2 & 0x80) !== 0;
        const sr = (computedResult & 0x80) !== 0;
        flagOf = (s1 !== s2 && sr !== s1) ? 1 : 0;
      }
      break;
    }
    case 'AND':
    case 'TEST':
      computedResult = (v1 & v2) & mask;
      flagCf = 0;
      flagOf = 0;
      break;
    case 'OR':
      computedResult = (v1 | v2) & mask;
      flagCf = 0;
      flagOf = 0;
      break;
    case 'XOR':
      computedResult = (v1 ^ v2) & mask;
      flagCf = 0;
      flagOf = 0;
      break;
    case 'NOT':
      computedResult = (~v1) & mask;
      break;
    default:
      computedResult = 0;
  }

  // Common flags
  flagZf = computedResult === 0 ? 1 : 0;
  flagSf = is16Bit ? ((computedResult & 0x8000) ? 1 : 0) : ((computedResult & 0x80) ? 1 : 0);
  const lowByte = computedResult & 0xff;
  let countOnes = 0;
  for (let i = 0; i < 8; i++) {
    if ((lowByte >> i) & 1) countOnes++;
  }
  flagPf = countOnes % 2 === 0 ? 1 : 0;

  const binBits = is16Bit ? 16 : 8;
  const hexPad = is16Bit ? 4 : 2;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-400">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                8086 Arithmetic Logic Unit (ALU) & Flag Generator
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-mono">
                  16-bit / 8-bit Math Core
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Interactive ALU simulator demonstrating two's complement arithmetic, bitwise logic, and condition flag synthesis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIs16Bit(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                is16Bit
                  ? 'bg-cyan-600 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              16-Bit Word
            </button>
            <button
              onClick={() => setIs16Bit(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                !is16Bit
                  ? 'bg-cyan-600 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              8-Bit Byte
            </button>
          </div>
        </div>

        {/* Operation Selection Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2">
          {['ADD', 'SUB', 'CMP', 'AND', 'OR', 'XOR', 'TEST', 'NOT'].map((op) => (
            <button
              key={op}
              onClick={() => setInteractiveOp(op)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                interactiveOp === op
                  ? 'bg-indigo-600 text-slate-100 shadow'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      {/* Main ALU Calculation Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input & Computation Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              ALU Operands & Execution
            </h4>

            <div className="space-y-4">
              {/* Operand 1 */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Operand 1 (Destination / Accumulator)</span>
                  <span className="font-mono text-cyan-400">
                    Binary: {v1.toString(2).padStart(binBits, '0')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={hexPad}
                    value={op1Hex}
                    onChange={(e) => setOp1Hex(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-cyan-300 font-mono text-sm focus:outline-none focus:border-cyan-500"
                    placeholder="Hex value"
                  />
                  <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-2 rounded border border-slate-800">
                    Dec: {v1}
                  </span>
                </div>
              </div>

              {/* Operand 2 */}
              {interactiveOp !== 'NOT' && (
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Operand 2 (Source)</span>
                    <span className="font-mono text-indigo-400">
                      Binary: {v2.toString(2).padStart(binBits, '0')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={hexPad}
                      value={op2Hex}
                      onChange={(e) => setOp2Hex(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-indigo-300 font-mono text-sm focus:outline-none focus:border-indigo-500"
                      placeholder="Hex value"
                    />
                    <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-2 rounded border border-slate-800">
                      Dec: {v2}
                    </span>
                  </div>
                </div>
              )}

              {/* ALU Result Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-cyan-800/60 shadow-inner">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="text-cyan-300 font-semibold">
                    {interactiveOp} Result ({interactiveOp === 'CMP' || interactiveOp === 'TEST' ? 'Flags Only' : 'Written Back'})
                  </span>
                  <span className="font-mono text-emerald-400">
                    Binary: {computedResult.toString(2).padStart(binBits, '0')}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-cyan-200">
                      0x{computedResult.toString(16).toUpperCase().padStart(hexPad, '0')}
                    </span>
                    <span className="text-xs text-slate-400">({computedResult.toString(16).toUpperCase().padStart(hexPad, '0')}H)</span>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
                    Decimal: {computedResult}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4">
            Notice: CMP and TEST perform internal subtraction/AND without modifying the destination register, updating only the status flags.
          </p>
        </div>

        {/* Condition Flags Generated */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Generated 8086 Status Flags
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Carry Flag (CF) */}
              <div
                className={`p-3 rounded-lg border flex flex-col items-center text-center transition-all ${
                  flagCf
                    ? 'bg-amber-950/60 border-amber-500/80 text-amber-200 shadow-md shadow-amber-950/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold font-mono">CF</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${flagCf ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                    {flagCf}
                  </span>
                </div>
                <span className="text-[11px] text-slate-300">Carry / Borrow</span>
                <span className="text-[9px] text-slate-400 mt-1">Unsigned overflow</span>
              </div>

              {/* Zero Flag (ZF) */}
              <div
                className={`p-3 rounded-lg border flex flex-col items-center text-center transition-all ${
                  flagZf
                    ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200 shadow-md shadow-emerald-950/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold font-mono">ZF</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${flagZf ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                    {flagZf}
                  </span>
                </div>
                <span className="text-[11px] text-slate-300">Zero Flag</span>
                <span className="text-[9px] text-slate-400 mt-1">Result is 0</span>
              </div>

              {/* Sign Flag (SF) */}
              <div
                className={`p-3 rounded-lg border flex flex-col items-center text-center transition-all ${
                  flagSf
                    ? 'bg-indigo-950/60 border-indigo-500/80 text-indigo-200 shadow-md shadow-indigo-950/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold font-mono">SF</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${flagSf ? 'bg-indigo-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                    {flagSf}
                  </span>
                </div>
                <span className="text-[11px] text-slate-300">Sign Flag</span>
                <span className="text-[9px] text-slate-400 mt-1">MSB is 1 (negative)</span>
              </div>

              {/* Overflow Flag (OF) */}
              <div
                className={`p-3 rounded-lg border flex flex-col items-center text-center transition-all ${
                  flagOf
                    ? 'bg-rose-950/60 border-rose-500/80 text-rose-200 shadow-md shadow-rose-950/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold font-mono">OF</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${flagOf ? 'bg-rose-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                    {flagOf}
                  </span>
                </div>
                <span className="text-[11px] text-slate-300">Overflow Flag</span>
                <span className="text-[9px] text-slate-400 mt-1">Signed overflow</span>
              </div>

              {/* Parity Flag (PF) */}
              <div
                className={`p-3 rounded-lg border flex flex-col items-center text-center transition-all ${
                  flagPf
                    ? 'bg-purple-950/60 border-purple-500/80 text-purple-200 shadow-md shadow-purple-950/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold font-mono">PF</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${flagPf ? 'bg-purple-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                    {flagPf}
                  </span>
                </div>
                <span className="text-[11px] text-slate-300">Parity Flag</span>
                <span className="text-[9px] text-slate-400 mt-1">Even parity (low byte)</span>
              </div>

              {/* Auxiliary Flag (AF) */}
              <div
                className={`p-3 rounded-lg border flex flex-col items-center text-center transition-all ${
                  flagAf
                    ? 'bg-teal-950/60 border-teal-500/80 text-teal-200 shadow-md shadow-teal-950/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold font-mono">AF</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${flagAf ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                    {flagAf}
                  </span>
                </div>
                <span className="text-[11px] text-slate-300">Auxiliary Carry</span>
                <span className="text-[9px] text-slate-400 mt-1">Carry from bit 3 to 4</span>
              </div>
            </div>
          </div>

          {/* Last Step ALU Trace info (if provided by execution) */}
          {lastAluOp && (
            <div className="mt-4 p-3 rounded-lg bg-slate-950/90 border border-slate-800 text-xs font-mono">
              <span className="text-indigo-400 font-semibold">Last CPU Instruction ALU Trace:</span>
              <p className="text-slate-300 mt-1">{lastAluOp.summary}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
