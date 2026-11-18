import React, { useState, useEffect } from 'react';
import { Play, SkipForward, RotateCcw, FileCode, CheckCircle, AlertTriangle, Cpu } from 'lucide-react';
import type { InstructionDTO, ExampleProgram, CPUFullState } from '../../types';
import { microprocessorApi } from '../../services/api';

interface AssemblyEditorProps {
  sessionId: string;
  cpuState: CPUFullState | null;
  onStateUpdate: (state: CPUFullState) => void;
  onStepComplete?: () => void;
}

export const AssemblyEditor: React.FC<AssemblyEditorProps> = ({
  sessionId,
  cpuState,
  onStateUpdate,
  onStepComplete,
}) => {
  const [sourceCode, setSourceCode] = useState<string>('');
  const [examplePrograms, setExamplePrograms] = useState<ExampleProgram[]>([]);
  const [selectedExampleId, setSelectedExampleId] = useState<string>('visionguard_controller');
  const [assembledInstructions, setAssembledInstructions] = useState<InstructionDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [assembleError, setAssembleError] = useState<string | null>(null);
  const [assembleSuccess, setAssembleSuccess] = useState<string | null>(null);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  // Load example programs on mount
  useEffect(() => {
    const loadExamples = async () => {
      try {
        const res = await microprocessorApi.getExamplePrograms();
        setExamplePrograms(res.programs);
        if (res.programs.length > 0) {
          const vgProg = res.programs.find((p: ExampleProgram) => p.id === 'visionguard_controller') || res.programs[0];
          setSelectedExampleId(vgProg.id || 'default');
          setSourceCode(vgProg.code || vgProg.source || '');
        }
      } catch (err: unknown) {
        console.error('Failed to load example programs', err);
      }
    };
    loadExamples();
  }, []);

  const handleSelectExample = (id: string) => {
    setSelectedExampleId(id);
    const prog = examplePrograms.find((p: ExampleProgram) => (p.id || p.title) === id);
    if (prog) {
      setSourceCode(prog.code || prog.source || '');
      setAssembleError(null);
      setAssembleSuccess(null);
      setRunMessage(null);
    }
  };

  const handleAssembleAndLoad = async () => {
    if (!sourceCode.trim()) return;
    setLoading(true);
    setAssembleError(null);
    setAssembleSuccess(null);
    setRunMessage(null);
    try {
      const res = await microprocessorApi.assembleProgram(sessionId, sourceCode, 0x1000, 0x0000);
      setAssembledInstructions(res.instructions);
      setAssembleSuccess(`Assembled ${res.instruction_count} instructions (${res.total_bytes} bytes). Loaded at CS:0000`);

      // Refresh full CPU state
      const stateRes = await microprocessorApi.getCPUState(sessionId);
      onStateUpdate(stateRes);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Assembly error';
      setAssembleError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleStep = async () => {
    setLoading(true);
    setRunMessage(null);
    try {
      const stepRes = await microprocessorApi.stepInstruction(sessionId);
      onStateUpdate(stepRes.cpu_state);
      if (onStepComplete) onStepComplete();
      if (stepRes.cpu_state.halted) {
        setRunMessage(`CPU HALTED at step ${stepRes.cpu_state.step_count}. HLT instruction executed.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Step failed';
      setAssembleError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    setLoading(true);
    setRunMessage(null);
    try {
      const runRes = await microprocessorApi.runProgram(sessionId, 500);
      onStateUpdate(runRes.cpu_state);
      if (onStepComplete) onStepComplete();
      setRunMessage(runRes.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Run failed';
      setAssembleError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setRunMessage(null);
    setAssembleError(null);
    try {
      const res = await microprocessorApi.resetCPU(sessionId);
      onStateUpdate(res.cpu_state);
      if (onStepComplete) onStepComplete();
      setRunMessage('CPU registers, queue, and bus reset to initial power-on state.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reset failed';
      setAssembleError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isHalted = cpuState?.halted ?? false;
  const currentIp = cpuState?.registers?.special?.IP?.hex ?? '0x0000';
  const currentCs = cpuState?.registers?.segments?.CS?.hex ?? '0x1000';

  return (
    <div className="space-y-6">
      {/* Top Controls Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-indigo-400">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                8086 Assembly Language Editor & Two-Pass Assembler
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800 font-mono">
                  MASM / TASM Syntax
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Write native 8086 mnemonic code, assemble into binary machine instructions, and step through execution.
              </p>
            </div>
          </div>

          {/* Example Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Preloaded Demos:</span>
            <select
              value={selectedExampleId}
              onChange={(e) => handleSelectExample(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500 font-medium"
            >
              {examplePrograms.map((p: ExampleProgram) => (
                <option key={p.id || p.title} value={p.id || p.title}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAssembleAndLoad}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-medium rounded-lg text-xs transition-colors shadow"
            >
              <Cpu className="w-4 h-4" />
              Assemble & Load Code
            </button>
            <button
              onClick={handleStep}
              disabled={loading || isHalted}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-slate-950 font-semibold rounded-lg text-xs transition-colors shadow"
            >
              <SkipForward className="w-4 h-4" />
              Single Step (F7)
            </button>
            <button
              onClick={handleRun}
              disabled={loading || isHalted}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-slate-950 font-semibold rounded-lg text-xs transition-colors shadow"
            >
              <Play className="w-4 h-4" />
              Run Program (F5)
            </button>
            <button
              onClick={handleReset}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset CPU
            </button>
          </div>

          {/* CPU Status Badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">CS:IP:</span>
              <span className="text-cyan-400 font-bold">
                {currentCs}:{currentIp}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Steps:</span>
              <span className="text-indigo-400 font-bold">{cpuState?.step_count ?? 0}</span>
            </div>
            {isHalted ? (
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800 animate-pulse">
                HALTED
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                ACTIVE
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {assembleError && (
        <div className="p-3.5 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{assembleError}</span>
        </div>
      )}
      {assembleSuccess && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{assembleSuccess}</span>
        </div>
      )}
      {runMessage && (
        <div className="p-3 bg-cyan-950/60 border border-cyan-800 rounded-xl text-cyan-300 text-xs font-mono">
          {runMessage}
        </div>
      )}

      {/* Editor & Instruction Disassembly Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Code Textarea */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              Assembly Source Code
              <span className="text-xs text-slate-400 font-mono font-normal">
                ({sourceCode.split('\n').length} lines)
              </span>
            </h4>
            <span className="text-[11px] text-slate-400">Press Assemble & Load to compile</span>
          </div>

          <textarea
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            spellCheck={false}
            rows={18}
            className="w-full bg-slate-950 text-slate-200 font-mono text-xs p-4 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none selection:bg-indigo-600/40"
            placeholder="; Type Intel 8086 Assembly code here..."
          />
        </div>

        {/* Assembled Bytecode / Disassembly Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              Machine Code Disassembly
              <span className="text-xs text-slate-400 font-mono font-normal">
                ({assembledInstructions.length} instructions)
              </span>
            </h4>
            <span className="text-[11px] text-cyan-400 font-mono">Current IP Highlighted</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/80 p-2 flex-1 max-h-[430px] overflow-y-auto">
            {assembledInstructions.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                No program assembled yet. Click "Assemble & Load Code" to generate bytecode.
              </div>
            ) : (
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-1.5 px-2">Offset</th>
                    <th className="py-1.5 px-2">Bytes</th>
                    <th className="py-1.5 px-2">Mnemonic</th>
                    <th className="py-1.5 px-2">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {assembledInstructions.map((ins, idx) => {
                    const isCurrent = ins.offset === currentIp;
                    return (
                      <tr
                        key={idx}
                        className={`border-b border-slate-900/60 transition-colors ${
                          isCurrent
                            ? 'bg-cyan-950/60 text-cyan-200 font-bold border-cyan-800/80'
                            : 'hover:bg-slate-900/40 text-slate-300'
                        }`}
                      >
                        <td className="py-1.5 px-2 text-cyan-400 whitespace-nowrap">
                          {isCurrent && <span className="mr-1 text-cyan-300">▶</span>}
                          {ins.offset}
                        </td>
                        <td className="py-1.5 px-2 text-indigo-400 whitespace-nowrap">
                          {Array.isArray(ins.bytecode) ? ins.bytecode.join(' ') : ins.bytecode}
                        </td>
                        <td className="py-1.5 px-2 font-bold whitespace-nowrap">
                          {ins.source || ins.mnemonic}
                        </td>
                        <td className="py-1.5 px-2 text-amber-400 whitespace-nowrap">
                          {ins.size}B
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
