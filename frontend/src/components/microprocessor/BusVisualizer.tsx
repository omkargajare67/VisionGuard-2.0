import React from 'react';
import { Cpu, Activity, Zap, RefreshCw } from 'lucide-react';
import type { BusState } from '../../types';

interface BusVisualizerProps {
  busState: BusState | null;
  prefetchQueue: string[] | number[];
  queueFlushed?: boolean;
}

export const BusVisualizer: React.FC<BusVisualizerProps> = ({
  busState,
  prefetchQueue,
  queueFlushed = false,
}) => {
  const address = busState?.address_bus ?? '0x00000';
  const data = busState?.data_bus ?? '0x0000';
  const ctrl = busState?.control_signals ?? {
    ale: 0,
    memr: 0,
    memw: 0,
    ior: 0,
    iow: 0,
    den: 0,
    dt_r: 0,
    intr: 0,
    nmi: 0,
  };
  const history = busState?.recent_history ?? [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-indigo-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                8086 Bus Architecture & BIU Prefetch Queue
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800 font-mono">
                  Hardware Bus Interface Unit
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Visualizing multiplexed address/data signals, bus control lines, and the 6-byte instruction prefetch FIFO queue.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Queue Occupancy:</span>
              <span className="text-cyan-400 font-bold">{prefetchQueue.length} / 6 Bytes</span>
            </div>
            {queueFlushed && (
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700 animate-pulse">
                FLUSHED
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Bus & Queue Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Address, Data, and Control Lines */}
        <div className="space-y-6">
          {/* 20-bit Address Bus Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <h4 className="font-semibold text-slate-200 text-sm">20-Bit Address Bus (A0 - A19)</h4>
              </div>
              <span className="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                {address}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Demultiplexed physical memory/IO address latched on ALE high.
            </p>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-center">
              <span className="text-xs text-cyan-400 tracking-widest break-all">
                {address}
              </span>
            </div>
          </div>

          {/* 16-bit Data Bus Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <h4 className="font-semibold text-slate-200 text-sm">16-Bit Bidirectional Data Bus (D0 - D15)</h4>
              </div>
              <span className="text-xs font-mono text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                {data}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Transfer word or byte between CPU and memory/peripherals.
            </p>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-center">
              <span className="text-xs text-indigo-400 tracking-widest break-all">
                {data}
              </span>
            </div>
          </div>

          {/* Control Bus Status Signals */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h4 className="font-semibold text-slate-200 text-sm mb-3">Control Bus Signal Lines</h4>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {[
                { name: 'ALE', active: Boolean(ctrl.ale), desc: 'Address Latch Enable' },
                { name: '/MEMR', active: Boolean(ctrl.memr), desc: 'Memory Read' },
                { name: '/MEMW', active: Boolean(ctrl.memw), desc: 'Memory Write' },
                { name: '/IOR', active: Boolean(ctrl.ior), desc: 'I/O Port Read' },
                { name: '/IOW', active: Boolean(ctrl.iow), desc: 'I/O Port Write' },
                { name: '/DEN', active: Boolean(ctrl.den), desc: 'Data Enable' },
                { name: 'DT//R', active: Boolean(ctrl.dt_r), desc: 'Data Transmit/Recv' },
                { name: 'INTR', active: Boolean(ctrl.intr), desc: 'Maskable Interrupt' },
                { name: 'NMI', active: Boolean(ctrl.nmi), desc: 'Non-Maskable Int' },
              ].map((sig) => (
                <div
                  key={sig.name}
                  className={`p-2.5 rounded-lg border flex flex-col items-center text-center transition-all ${
                    sig.active
                      ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-300 shadow-md shadow-emerald-950/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="font-bold text-xs">{sig.name}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{sig.desc}</span>
                  <span
                    className={`mt-1 text-[9px] px-1.5 rounded font-bold ${
                      sig.active ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {sig.active ? 'ACTIVE' : 'IDLE'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: BIU Prefetch Queue & Recent Transactions */}
        <div className="space-y-6">
          {/* BIU 6-Byte Prefetch Queue */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                BIU 6-Byte Instruction Prefetch Queue (FIFO)
              </h4>
              <span className="text-xs font-mono text-slate-400">Pipelined Fetch</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              The BIU prefetches instructions during spare bus cycles. When jumps occur, the queue is automatically flushed!
            </p>

            {/* 6 Queue Slots */}
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 6 }).map((_, slotIdx) => {
                const hasByte = slotIdx < prefetchQueue.length;
                const byteVal = hasByte ? prefetchQueue[slotIdx] : null;
                const isHead = slotIdx === 0 && hasByte;

                return (
                  <div
                    key={slotIdx}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center transition-all ${
                      hasByte
                        ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-200 shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 font-mono mb-1">
                      Slot {slotIdx}
                    </span>
                    <span className="text-sm font-bold font-mono">
                      {byteVal !== null
                        ? (typeof byteVal === 'number' ? `0x${byteVal.toString(16).toUpperCase().padStart(2, '0')}` : byteVal)
                        : '--'}
                    </span>
                    {isHead && (
                      <span className="mt-1 text-[9px] px-1 py-0.2 rounded bg-cyan-500 text-slate-950 font-bold">
                        HEAD
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bus Transactions Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-200 text-sm">Recent Bus Transactions</h4>
              <span className="text-xs text-slate-400 font-mono">Last {history.length} cycles</span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/80 p-2 max-h-[220px] overflow-y-auto">
              {history.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No bus transactions recorded yet.</div>
              ) : (
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-1 px-2">Cycle</th>
                      <th className="py-1 px-2">Type</th>
                      <th className="py-1 px-2">Address</th>
                      <th className="py-1 px-2">Data</th>
                      <th className="py-1 px-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice().reverse().map((tx: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-900/60 hover:bg-slate-900/40">
                        <td className="py-1 px-2 text-slate-400">{tx.cycle}</td>
                        <td className="py-1 px-2 text-cyan-400 font-semibold">{tx.type}</td>
                        <td className="py-1 px-2 text-slate-300">{tx.address}</td>
                        <td className="py-1 px-2 text-indigo-400 font-bold">{tx.data}</td>
                        <td className="py-1 px-2 text-slate-400">{tx.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
