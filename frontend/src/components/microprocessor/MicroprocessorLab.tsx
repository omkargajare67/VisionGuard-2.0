import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  Layers,
  Database,
  Calculator,
  Activity,
  AlertCircle,
  Timer,
  FileCode,
  Sparkles,
} from 'lucide-react';
import type { CPUFullState, InspectionResult } from '../../types';
import { microprocessorApi } from '../../services/api';
import { RegisterInspector } from './RegisterInspector';
import { MemoryExplorer } from './MemoryExplorer';
import { AssemblyEditor } from './AssemblyEditor';
import { ExecutionTrace } from './ExecutionTrace';
import { ALUVisualizer } from './ALUVisualizer';
import { BusVisualizer } from './BusVisualizer';
import { PPI8255Panel } from './PPI8255Panel';
import { InterruptPanel } from './InterruptPanel';
import { TimerPanel } from './TimerPanel';

interface MicroprocessorLabProps {
  latestInspectionResult?: InspectionResult | null;
}

type TabType =
  | 'assembly'
  | 'registers'
  | 'memory'
  | 'alu'
  | 'bus'
  | 'ppi'
  | 'interrupts'
  | 'timers';

export const MicroprocessorLab: React.FC<MicroprocessorLabProps> = ({
  latestInspectionResult,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('assembly');
  const [sessionId] = useState<string>(() => `session-8086-${Date.now().toString(36)}`);
  const [cpuState, setCpuState] = useState<CPUFullState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const initSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await microprocessorApi.createSession(sessionId);
      setCpuState(res.cpu_state);
    } catch (err: unknown) {
      console.error('Session init error:', err);
      try {
        const stateRes = await microprocessorApi.getCPUState(sessionId);
        setCpuState(stateRes);
      } catch (innerErr: unknown) {
        const msg = innerErr instanceof Error ? innerErr.message : 'Failed to connect to 8086 simulator';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    initSession();
  }, [initSession]);

  const refreshState = async () => {
    try {
      const stateRes = await microprocessorApi.getCPUState(sessionId);
      setCpuState(stateRes);
    } catch (err: unknown) {
      console.error('Failed to refresh state', err);
    }
  };

  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'assembly', label: '8086 Assembler & Debugger', icon: <FileCode className="w-4 h-4" /> },
    { id: 'registers', label: 'Registers & Flags', icon: <Cpu className="w-4 h-4" /> },
    { id: 'memory', label: '20-bit Memory & Stack', icon: <Database className="w-4 h-4" /> },
    { id: 'alu', label: 'ALU & Arithmetic Logic', icon: <Calculator className="w-4 h-4" /> },
    { id: 'bus', label: 'Bus & BIU Prefetch Queue', icon: <Activity className="w-4 h-4" /> },
    { id: 'ppi', label: '8255 PPI Sorting Interface', icon: <Layers className="w-4 h-4" />, badge: 'VisionGuard Core' },
    { id: 'interrupts', label: 'IVT & Interrupts', icon: <AlertCircle className="w-4 h-4" /> },
    { id: 'timers', label: '8253 PIT Timer', icon: <Timer className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-700 font-mono">
                DEAM UNIT 4: 8086 MICROPROCESSOR
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-700 font-mono">
                DEAM UNIT 5: 8255 PPI & PERIPHERALS
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1 font-mono">
                <Sparkles className="w-3 h-3" />
                STAGE 4 ACTIVE
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              Educational Intel 8086 & 8255 PPI Simulation Laboratory
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Simulating true 16-bit register architecture, 20-bit segmented physical memory, BIU 6-byte instruction prefetch queue, ALU flag generation, 256-entry IVT, and industrial automated sorting interface via Intel 8255 PPI.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-right font-mono">
              <div className="text-[10px] text-slate-400">SESSION ID</div>
              <div className="text-xs font-bold text-indigo-400">{sessionId}</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-slate-100 shadow-md shadow-indigo-600/30'
                    : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded text-[10px] uppercase tracking-wider font-bold ${
                      isActive ? 'bg-indigo-900 text-indigo-200' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={initSession}
            className="px-3 py-1 bg-rose-800 hover:bg-rose-700 text-slate-100 rounded text-xs transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Tab Panels */}
      {loading && !cpuState ? (
        <div className="p-16 text-center text-slate-400">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm font-mono">Initializing 8086 Virtual Microprocessor Session...</p>
        </div>
      ) : (
        <div>
          {/* TAB 1: Assembler & Trace */}
          {activeTab === 'assembly' && (
            <div className="space-y-6">
              <AssemblyEditor
                sessionId={sessionId}
                cpuState={cpuState}
                onStateUpdate={setCpuState}
                onStepComplete={refreshState}
              />
              <ExecutionTrace
                trace={cpuState?.execution_trace ?? []}
                onClearTrace={() => {
                  if (cpuState) {
                    setCpuState({ ...cpuState, execution_trace: [] });
                  }
                }}
              />
            </div>
          )}

          {/* TAB 2: Registers & Flags */}
          {activeTab === 'registers' && (
            <RegisterInspector
              registers={cpuState?.registers ?? null}
            />
          )}

          {/* TAB 3: Memory & Stack */}
          {activeTab === 'memory' && (
            <MemoryExplorer
              sessionId={sessionId}
              cs={cpuState?.registers?.segments?.CS?.hex ?? '0x1000'}
              ip={cpuState?.registers?.special?.IP?.hex ?? '0x0000'}
              ds={cpuState?.registers?.segments?.DS?.hex ?? '0x2000'}
              ss={cpuState?.registers?.segments?.SS?.hex ?? '0x3000'}
              sp={cpuState?.registers?.pointers?.SP?.hex ?? '0x0100'}
            />
          )}

          {/* TAB 4: ALU Visualizer */}
          {activeTab === 'alu' && <ALUVisualizer />}

          {/* TAB 5: Bus & BIU Prefetch Queue */}
          {activeTab === 'bus' && (
            <BusVisualizer
              busState={cpuState?.bus ?? null}
              prefetchQueue={cpuState?.biu?.prefetch_queue ?? []}
            />
          )}

          {/* TAB 6: 8255 PPI Interface */}
          {activeTab === 'ppi' && (
            <PPI8255Panel
              sessionId={sessionId}
              ppiState={cpuState?.ppi ?? null}
              onPPIUpdate={(newPPI) => {
                if (cpuState) setCpuState({ ...cpuState, ppi: newPPI });
              }}
              latestInspectionResult={latestInspectionResult}
            />
          )}

          {/* TAB 7: Interrupts & IVT */}
          {activeTab === 'interrupts' && (
            <InterruptPanel
              sessionId={sessionId}
              cpuState={cpuState}
              onStateUpdate={setCpuState}
            />
          )}

          {/* TAB 8: Timers */}
          {activeTab === 'timers' && (
            <TimerPanel
              sessionId={sessionId}
              timerState={cpuState?.timers ?? null}
              onStateUpdate={setCpuState}
            />
          )}
        </div>
      )}
    </div>
  );
};
