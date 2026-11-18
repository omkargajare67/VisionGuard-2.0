import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { microprocessorApi } from '../../services/api';
import type { CPUFullState } from '../../types';

interface InterruptPanelProps {
  sessionId: string;
  cpuState: CPUFullState | null;
  onStateUpdate: (state: CPUFullState) => void;
}

export const InterruptPanel: React.FC<InterruptPanelProps> = ({
  sessionId,
  cpuState,
  onStateUpdate,
}) => {
  const [selectedVector, setSelectedVector] = useState<number>(2);
  const [softIntType, setSoftIntType] = useState<number>(0x80);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const ifFlag = cpuState?.flags?.flags?.IF ?? cpuState?.registers?.special?.FLAGS?.flags?.IF ?? 1;

  const handleTriggerNMI = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await microprocessorApi.triggerNMI(sessionId);
      onStateUpdate(res.cpu_state);
      setStatusMessage('Triggered NMI (Type 2). Pushed FLAGS, CS, IP to stack and branched to ISR.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'NMI failed';
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerINTR = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await microprocessorApi.triggerINTR(sessionId, 8);
      onStateUpdate(res.cpu_state);
      if (ifFlag === 0) {
        setStatusMessage('INTR raised but ignored: Interrupt Flag (IF) is 0 (CLI). Enable interrupts with STI.');
      } else {
        setStatusMessage('Triggered INTR (Type 8 IRQ0 Timer). Pushed FLAGS, CS, IP to stack and branched to ISR.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'INTR failed';
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSoftInt = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await microprocessorApi.triggerSoftwareInt(sessionId, softIntType);
      onStateUpdate(res.cpu_state);
      setStatusMessage(`Triggered Software Interrupt INT ${softIntType.toString(16).toUpperCase()}H. Branched to ISR.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'INT failed';
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const ivtEntries = [
    { type: 0, name: 'Divide by Zero', addr: '0000:0000', defaultCsIp: '0000:0000', note: 'Hardware fault on DIV/IDIV quotient overflow' },
    { type: 1, name: 'Single Step / Trace', addr: '0000:0004', defaultCsIp: '0000:0000', note: 'Debug interrupt when TF = 1' },
    { type: 2, name: 'Non-Maskable Interrupt (NMI)', addr: '0000:0008', defaultCsIp: '0000:0000', note: 'Critical hardware event (ignores IF)' },
    { type: 3, name: 'Breakpoint', addr: '0000:000C', defaultCsIp: '0000:0000', note: '1-byte instruction 0xCC (INT 3)' },
    { type: 4, name: 'Overflow (INTO)', addr: '0000:0010', defaultCsIp: '0000:0000', note: 'Triggers if OF = 1' },
    { type: 8, name: 'IRQ0 Timer Tick', addr: '0000:0020', defaultCsIp: '0000:0000', note: '8253 Programmable Interval Timer tick' },
    { type: 0x80, name: 'VisionGuard System Call', addr: '0000:0200', defaultCsIp: '0000:0000', note: 'Quality inspection dispatch handler' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-950/80 border border-purple-700/60 text-purple-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                8086 Interrupt Subsystem & Interrupt Vector Table (IVT)
                <span className="text-xs px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800 font-mono">
                  256 Vectors (00000H - 003FFH)
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Hardware & software interrupts, vector lookup table, stack frame preservation, and IRET restoration.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">IF Flag:</span>
              <span className={`font-bold ${ifFlag ? 'text-emerald-400' : 'text-rose-400'}`}>
                {ifFlag ? 'ENABLED (STI)' : 'DISABLED (CLI)'}
              </span>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="mt-4 p-3 bg-purple-950/50 border border-purple-800 rounded-lg text-xs text-purple-300 font-mono">
            {statusMessage}
          </div>
        )}
      </div>

      {/* Main Grid: IVT Explorer on Left, Trigger Actions & Stack on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* IVT Explorer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-200 text-sm">Interrupt Vector Table (IVT)</h4>
            <span className="text-xs text-slate-400 font-mono">4 Bytes per Entry (IP, then CS)</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/80 p-2 flex-1">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-1.5 px-2">Type</th>
                  <th className="py-1.5 px-2">IVT Address</th>
                  <th className="py-1.5 px-2">Name</th>
                  <th className="py-1.5 px-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {ivtEntries.map((entry) => (
                  <tr
                    key={entry.type}
                    onClick={() => setSelectedVector(entry.type)}
                    className={`border-b border-slate-900/60 cursor-pointer transition-colors ${
                      selectedVector === entry.type
                        ? 'bg-purple-950/50 text-purple-200 font-semibold'
                        : 'hover:bg-slate-900/40 text-slate-300'
                    }`}
                  >
                    <td className="py-1.5 px-2 text-cyan-400">
                      0x{entry.type.toString(16).toUpperCase().padStart(2, '0')}
                    </td>
                    <td className="py-1.5 px-2 text-slate-400">{entry.addr}</td>
                    <td className="py-1.5 px-2 font-bold text-slate-200">{entry.name}</td>
                    <td className="py-1.5 px-2 text-slate-400 text-[11px]">{entry.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trigger Controls & Stack Sequence */}
        <div className="space-y-6">
          {/* Hardware & Software Interrupt Trigger Buttons */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h4 className="font-semibold text-slate-200 text-sm mb-3">Interrupt Signal Injection</h4>

            <div className="space-y-3">
              {/* NMI Button */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-200">Non-Maskable Interrupt (NMI)</span>
                  <p className="text-[11px] text-slate-400">Edge-triggered, highest priority, bypasses IF flag</p>
                </div>
                <button
                  onClick={handleTriggerNMI}
                  disabled={loading}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-slate-100 font-medium rounded-lg text-xs transition-colors shadow"
                >
                  Fire NMI
                </button>
              </div>

              {/* INTR Button */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-200">Maskable Interrupt (INTR Type 8)</span>
                  <p className="text-[11px] text-slate-400">Gated by Interrupt Flag (IF). Enabled with STI, disabled with CLI</p>
                </div>
                <button
                  onClick={handleTriggerINTR}
                  disabled={loading}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow"
                >
                  Fire INTR (Type 8)
                </button>
              </div>

              {/* Software INT n */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 gap-3">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-200">Software Interrupt (INT n)</span>
                  <p className="text-[11px] text-slate-400">Instruction-driven interrupt (e.g. INT 80H)</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={softIntType}
                    onChange={(e) => setSoftIntType(parseInt(e.target.value, 10) || 0)}
                    className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-purple-300 font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleTriggerSoftInt}
                    disabled={loading}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-slate-100 font-medium rounded-lg text-xs transition-colors shadow"
                  >
                    Execute INT
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stack Preservation Sequence Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h4 className="font-semibold text-slate-200 text-sm mb-3">Interrupt Service Routine (ISR) Flow</h4>
            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-cyan-400 font-bold">1.</span>
                <span>PUSH FLAGS register onto Stack (SP = SP - 2)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-cyan-400 font-bold">2.</span>
                <span>Clear IF (CLI) and TF to disable nested interrupts</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-cyan-400 font-bold">3.</span>
                <span>PUSH CS, then PUSH IP (return address)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-cyan-400 font-bold">4.</span>
                <span>Load IP & CS from IVT: IP = [Type * 4], CS = [Type * 4 + 2]</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-purple-950/60 border border-purple-800 text-purple-200">
                <span className="text-purple-400 font-bold">5.</span>
                <span>IRET Instruction: POP IP, POP CS, POP FLAGS (restores original execution state)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
