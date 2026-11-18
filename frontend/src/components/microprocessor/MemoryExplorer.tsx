import React, { useState, useEffect } from 'react';
import { Cpu, Database, ArrowRight, RefreshCw, Layers } from 'lucide-react';
import type { MemoryDumpRow, StackSlot } from '../../types';
import { microprocessorApi } from '../../services/api';

interface MemoryExplorerProps {
  sessionId: string;
  cs: string | number;
  ip: string | number;
  ds: string | number;
  ss: string | number;
  sp: string | number;
}

export const MemoryExplorer: React.FC<MemoryExplorerProps> = ({
  sessionId,
  cs,
  ip,
  ds,
  ss,
  sp,
}) => {
  const parseHex = (val: string | number): number => {
    if (typeof val === 'number') return val;
    return parseInt(val.replace('0x', ''), 16) || 0;
  };

  const csNum = parseHex(cs);
  const ipNum = parseHex(ip);
  const dsNum = parseHex(ds);
  const ssNum = parseHex(ss);
  const spNum = parseHex(sp);

  const [segmentHex, setSegmentHex] = useState<string>(csNum.toString(16).toUpperCase().padStart(4, '0'));
  const [offsetHex, setOffsetHex] = useState<string>('0000');
  const [numBytes, setNumBytes] = useState<number>(128);
  const [memoryRows, setMemoryRows] = useState<MemoryDumpRow[]>([]);
  const [stackSlots, setStackSlots] = useState<StackSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Quick write state
  const [writeSegHex, setWriteSegHex] = useState<string>(dsNum.toString(16).toUpperCase().padStart(4, '0'));
  const [writeOffHex, setWriteOffHex] = useState<string>('0000');
  const [writeValueHex, setWriteValueHex] = useState<string>('00');
  const [writeStatus, setWriteStatus] = useState<string | null>(null);

  const fetchDump = async (seg?: number, off?: number, length?: number) => {
    const s = seg !== undefined ? seg : parseInt(segmentHex, 16) || 0;
    const o = off !== undefined ? off : parseInt(offsetHex, 16) || 0;
    const len = length !== undefined ? length : numBytes;

    setLoading(true);
    setError(null);
    try {
      const dumpRes = await microprocessorApi.getMemoryDump(sessionId, s, o, len);
      setMemoryRows(dumpRes.rows || []);

      const stackRes = await microprocessorApi.getStack(sessionId, 8);
      setStackSlots(stackRes.stack || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch memory dump';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDump();
  }, [sessionId, cs, ds, ss, sp]);

  const handleSegmentPreset = (seg: number, off: number) => {
    const sHex = seg.toString(16).toUpperCase().padStart(4, '0');
    const oHex = off.toString(16).toUpperCase().padStart(4, '0');
    setSegmentHex(sHex);
    setOffsetHex(oHex);
    fetchDump(seg, off);
  };

  const handleWriteMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    setWriteStatus(null);
    try {
      const seg = parseInt(writeSegHex, 16) || 0;
      const off = parseInt(writeOffHex, 16) || 0;
      const val = parseInt(writeValueHex, 16) || 0;
      await microprocessorApi.writeMemory(sessionId, seg, off, val & 0xff);
      setWriteStatus(`Successfully wrote ${val.toString(16).toUpperCase().padStart(2, '0')}H to ${seg.toString(16).toUpperCase().padStart(4, '0')}:${off.toString(16).toUpperCase().padStart(4, '0')}`);
      fetchDump();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Write failed';
      setWriteStatus(`Error: ${msg}`);
    }
  };

  const currentSegment = parseInt(segmentHex, 16) || 0;
  const currentOffset = parseInt(offsetHex, 16) || 0;
  const physicalAddr = ((currentSegment << 4) + currentOffset) & 0xfffff;

  return (
    <div className="space-y-6">
      {/* 20-bit Addressing Formula Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-slate-100">8086 20-Bit Physical Address Generator</h3>
              <span className="px-2 py-0.5 rounded text-xs bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-mono">
                1 MB Address Space (00000H - FFFFFH)
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Intel 8086 generates physical addresses by shifting the segment register 4 bits left (x16) and adding the offset.
            </p>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSegmentPreset(csNum, ipNum)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-indigo-950/60 text-indigo-300 border border-indigo-700/60 hover:bg-indigo-900/50 transition-colors"
            >
              CS:IP ({csNum.toString(16).toUpperCase().padStart(4, '0')}:{ipNum.toString(16).toUpperCase().padStart(4, '0')})
            </button>
            <button
              onClick={() => handleSegmentPreset(dsNum, 0)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900/50 transition-colors"
            >
              DS:0000 ({dsNum.toString(16).toUpperCase().padStart(4, '0')}:0000)
            </button>
            <button
              onClick={() => handleSegmentPreset(ssNum, spNum)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-amber-950/60 text-amber-300 border border-amber-700/60 hover:bg-amber-900/50 transition-colors"
            >
              SS:SP ({ssNum.toString(16).toUpperCase().padStart(4, '0')}:{spNum.toString(16).toUpperCase().padStart(4, '0')})
            </button>
            <button
              onClick={() => handleSegmentPreset(0, 0)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-purple-950/60 text-purple-300 border border-purple-700/60 hover:bg-purple-900/50 transition-colors"
            >
              IVT (0000:0000)
            </button>
          </div>
        </div>

        {/* Math Calculation Card */}
        <div className="mt-4 p-4 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4 font-mono text-sm">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-400 font-sans">Segment</span>
              <span className="text-cyan-400 font-bold">{segmentHex.padStart(4, '0')}H</span>
              <span className="text-[10px] text-slate-400 font-mono">({currentSegment.toString(2).padStart(16, '0')})</span>
            </div>
            <span className="text-slate-400">× 16 +</span>
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-400 font-sans">Offset</span>
              <span className="text-indigo-400 font-bold">{offsetHex.padStart(4, '0')}H</span>
              <span className="text-[10px] text-slate-400 font-mono">({currentOffset.toString(2).padStart(16, '0')})</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <div className="flex flex-col items-center px-3 py-1 bg-cyan-950/40 rounded border border-cyan-800/60">
              <span className="text-xs text-cyan-300 font-sans font-semibold">20-Bit Physical Address</span>
              <span className="text-lg font-bold text-cyan-200">
                0x{physicalAddr.toString(16).toUpperCase().padStart(5, '0')}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">
                Dec: {physicalAddr.toLocaleString()} / 1,048,575
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              maxLength={4}
              value={segmentHex}
              onChange={(e) => setSegmentHex(e.target.value.toUpperCase())}
              placeholder="Seg"
              className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
            <span className="text-slate-400">:</span>
            <input
              type="text"
              maxLength={4}
              value={offsetHex}
              onChange={(e) => setOffsetHex(e.target.value.toUpperCase())}
              placeholder="Off"
              className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-indigo-300 font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => fetchDump()}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold rounded text-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Dump
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Main Grid: Hex Dump on Left, Stack & Direct Write on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hex Dump Table (2 columns wide) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <h4 className="font-semibold text-slate-200">Segment Memory Hex Dump</h4>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Length:</span>
              <select
                value={numBytes}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setNumBytes(val);
                  fetchDump(undefined, undefined, val);
                }}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value={64}>64 Bytes</option>
                <option value={128}>128 Bytes</option>
                <option value={256}>256 Bytes</option>
                <option value={512}>512 Bytes</option>
              </select>
            </div>
          </div>

          {/* Hex Table Container */}
          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/70 p-3 flex-1 font-mono text-xs">
            {memoryRows.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No memory dump data loaded.</div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-left">
                    <th className="py-1 px-2 font-semibold">Address</th>
                    <th className="py-1 px-2 font-semibold">Hex Dump</th>
                    <th className="py-1 px-3 font-semibold text-slate-400">ASCII</th>
                  </tr>
                </thead>
                <tbody>
                  {memoryRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-900/60 hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="py-1.5 px-2 text-cyan-400 font-bold whitespace-nowrap">
                        {row.physical_address || `${row.segment}:${row.offset}`}
                      </td>
                      <td className="py-1.5 px-2 text-slate-200 font-mono tracking-wider">
                        {row.hex_view || (row.bytes ? row.bytes.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ') : '')}
                      </td>
                      <td className="py-1.5 px-3 text-emerald-400 tracking-wider font-mono whitespace-pre">
                        {row.ascii_view}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Stack View & Direct Write */}
        <div className="space-y-6">
          {/* Stack Inspector */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h4 className="font-semibold text-slate-200">Stack Segment (SS:SP)</h4>
              </div>
              <span className="text-xs font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                Top: {ssNum.toString(16).toUpperCase().padStart(4, '0')}:{spNum.toString(16).toUpperCase().padStart(4, '0')}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              8086 stack grows downward (SP decrements on PUSH/CALL, increments on POP/RET).
            </p>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {stackSlots.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4">No stack entries loaded</div>
              ) : (
                stackSlots.map((slot, sIdx) => {
                  const isTop = sIdx === 0;
                  return (
                    <div
                      key={sIdx}
                      className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                        isTop
                          ? 'bg-amber-950/40 border-amber-600/70 text-amber-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isTop && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500 text-slate-950 font-bold">
                            SP
                          </span>
                        )}
                        <span className="text-slate-400">{slot.physical || slot.offset}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-cyan-400 font-bold">{slot.hex_word}</span>
                        <span className="text-slate-400 text-[11px]">(d: {slot.word_value})</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Direct Memory Write */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h4 className="font-semibold text-slate-200 text-sm mb-2">Direct Memory Write</h4>
            <p className="text-xs text-slate-400 mb-3">
              Inject a byte value into any segmented physical memory address.
            </p>

            <form onSubmit={handleWriteMemory} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Segment</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={writeSegHex}
                    onChange={(e) => setWriteSegHex(e.target.value.toUpperCase())}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-cyan-300 font-mono text-xs text-center focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Offset</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={writeOffHex}
                    onChange={(e) => setWriteOffHex(e.target.value.toUpperCase())}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-indigo-300 font-mono text-xs text-center focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Byte (Hex)</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={writeValueHex}
                    onChange={(e) => setWriteValueHex(e.target.value.toUpperCase())}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-emerald-300 font-mono text-xs text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-medium rounded-lg text-xs transition-colors"
              >
                Write Byte to Memory
              </button>

              {writeStatus && (
                <div
                  className={`p-2 rounded text-xs font-mono ${
                    writeStatus.startsWith('Error')
                      ? 'bg-rose-950/50 text-rose-300 border border-rose-800'
                      : 'bg-emerald-950/50 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {writeStatus}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
