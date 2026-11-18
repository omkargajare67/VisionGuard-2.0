import React, { useState, useEffect, useCallback } from 'react';
import {
  FileCode,
  BookOpen,
  Binary,
  Cpu,
  Calculator,
  Database,
  Activity,
  Layers,
  ListOrdered,
  Timer,
  AlertCircle,
  RefreshCw,
  Terminal,
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

type WorkspaceId =
  | 'assembly'
  | 'examples'
  | 'machine_code'
  | 'registers'
  | 'alu'
  | 'memory'
  | 'bus'
  | 'ppi'
  | 'trace'
  | 'timers'
  | 'interrupts';

interface NavGroup {
  groupName: string;
  items: Array<{
    id: WorkspaceId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }>;
}

export const MicroprocessorLab: React.FC<MicroprocessorLabProps> = ({
  latestInspectionResult,
}) => {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>('assembly');
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
        const msg =
          innerErr instanceof Error ? innerErr.message : 'Failed to connect to 8086 simulator';
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

  const navGroups: NavGroup[] = [
    {
      groupName: 'PROGRAMMING',
      items: [
        { id: 'assembly', label: 'Assembly Editor', icon: FileCode },
        { id: 'examples', label: 'Example Programs', icon: BookOpen },
        { id: 'machine_code', label: 'Machine Code', icon: Binary },
      ],
    },
    {
      groupName: 'PROCESSOR',
      items: [
        { id: 'registers', label: 'Registers & Flags', icon: Cpu },
        { id: 'alu', label: 'ALU & Logic', icon: Calculator },
        { id: 'memory', label: 'Memory & Stack', icon: Database },
      ],
    },
    {
      groupName: 'ARCHITECTURE',
      items: [
        { id: 'bus', label: 'Bus & BIU Queue', icon: Activity },
      ],
    },
    {
      groupName: 'PERIPHERALS',
      items: [
        { id: 'ppi', label: '8255 PPI Interface', icon: Layers, badge: 'Core' },
      ],
    },
    {
      groupName: 'EXECUTION',
      items: [
        { id: 'trace', label: 'Execution Trace', icon: ListOrdered },
        { id: 'timers', label: '8253 PIT Timer', icon: Timer },
        { id: 'interrupts', label: 'Interrupts & IVT', icon: AlertCircle },
      ],
    },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* ========================================================= */}
      {/* PAGE HEADER                                               */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="w-10 h-1 bg-[#F59A16] rounded-full mb-2" />
          <h1 className="text-3xl font-extrabold text-[#252B35] tracking-tight">
            Intel 8086 &amp; 8255 PPI Laboratory
          </h1>
          <p className="text-sm text-[#667085] mt-1">
            Explore processor registers, assembly execution, memory, peripheral interfacing and actuator control.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-600">
            Session: <strong className="text-slate-900">{sessionId}</strong>
          </div>

          <button
            onClick={refreshState}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition-all cursor-pointer"
            title="Refresh CPU State"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={initSession}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* TWO-COLUMN LAB WORKSPACE (Sidebar + Dedicated Content)     */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT SIDEBAR: Grouped Vertical Navigation (3 Cols) */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            {navGroups.map((group) => (
              <div key={group.groupName} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  {group.groupName}
                </div>

                <nav className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeWorkspace === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveWorkspace(item.id)}
                        className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer group ${
                          isActive
                            ? 'bg-[#F59A16]/10 text-[#F59A16] font-bold border-l-4 border-[#F59A16] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-[#F59A16]' : 'text-slate-400 group-hover:text-slate-700'
                            }`}
                          />
                          <span className="text-xs truncate">{item.label}</span>
                        </div>

                        {item.badge && (
                          <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-[#F59A16]/20 text-[#F59A16] shrink-0 ml-1">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {/* Microprocessor Status Pill */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#252B35]">
              <Terminal className="w-4 h-4 text-[#F59A16]" />
              <span>CPU Execution State</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono pt-1 text-slate-600">
              <span>Halted:</span>
              <span className="font-bold text-slate-900">
                {cpuState?.halted ? 'TRUE (HLT)' : 'FALSE (READY)'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-600">
              <span>Instruction Ptr (IP):</span>
              <span className="font-bold text-[#F59A16]">
                {cpuState?.registers?.special?.IP?.hex ?? '0x0000'}
              </span>
            </div>
          </div>
        </aside>

        {/* RIGHT CONTENT AREA: Only One Active Workspace Displayed (9 Cols) */}
        <main className="lg:col-span-9">
          {loading && !cpuState ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-[#F59A16]" />
              <p className="text-xs font-mono">Connecting to 8086 Virtual Microprocessor Engine...</p>
            </div>
          ) : (
            <>
              {/* WORKSPACE: Assembly Editor & Debugger (Default) */}
              {(activeWorkspace === 'assembly' ||
                activeWorkspace === 'examples' ||
                activeWorkspace === 'machine_code') && (
                <div className="space-y-6">
                  <AssemblyEditor
                    sessionId={sessionId}
                    cpuState={cpuState}
                    onStateUpdate={setCpuState}
                    onStepComplete={refreshState}
                  />
                </div>
              )}

              {/* WORKSPACE: Registers & Flags */}
              {activeWorkspace === 'registers' && (
                <div className="space-y-6">
                  <RegisterInspector registers={cpuState?.registers ?? null} />
                </div>
              )}

              {/* WORKSPACE: ALU Visualizer */}
              {activeWorkspace === 'alu' && (
                <div className="space-y-6">
                  <ALUVisualizer />
                </div>
              )}

              {/* WORKSPACE: Memory & Stack Explorer */}
              {activeWorkspace === 'memory' && (
                <div className="space-y-6">
                  <MemoryExplorer
                    sessionId={sessionId}
                    cs={cpuState?.registers?.segments?.CS?.hex ?? '0x1000'}
                    ip={cpuState?.registers?.special?.IP?.hex ?? '0x0000'}
                    ds={cpuState?.registers?.segments?.DS?.hex ?? '0x2000'}
                    ss={cpuState?.registers?.segments?.SS?.hex ?? '0x3000'}
                    sp={cpuState?.registers?.pointers?.SP?.hex ?? '0x0100'}
                  />
                </div>
              )}

              {/* WORKSPACE: Bus & BIU Prefetch Queue */}
              {activeWorkspace === 'bus' && (
                <div className="space-y-6">
                  <BusVisualizer
                    busState={cpuState?.bus ?? null}
                    prefetchQueue={cpuState?.biu?.prefetch_queue ?? []}
                  />
                </div>
              )}

              {/* WORKSPACE: 8255 PPI Actuator Interface */}
              {activeWorkspace === 'ppi' && (
                <div className="space-y-6">
                  <PPI8255Panel
                    sessionId={sessionId}
                    ppiState={cpuState?.ppi ?? null}
                    onPPIUpdate={(newPPI) => {
                      if (cpuState) setCpuState({ ...cpuState, ppi: newPPI });
                    }}
                    latestInspectionResult={latestInspectionResult}
                  />
                </div>
              )}

              {/* WORKSPACE: Execution Trace Log */}
              {activeWorkspace === 'trace' && (
                <div className="space-y-6">
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

              {/* WORKSPACE: 8253 PIT Timers */}
              {activeWorkspace === 'timers' && (
                <div className="space-y-6">
                  <TimerPanel
                    sessionId={sessionId}
                    timerState={cpuState?.timers ?? null}
                    onStateUpdate={setCpuState}
                  />
                </div>
              )}

              {/* WORKSPACE: Interrupts & IVT */}
              {activeWorkspace === 'interrupts' && (
                <div className="space-y-6">
                  <InterruptPanel
                    sessionId={sessionId}
                    cpuState={cpuState}
                    onStateUpdate={setCpuState}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
