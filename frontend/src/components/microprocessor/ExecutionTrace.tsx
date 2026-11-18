import React from 'react';
import { History, CheckCircle, Terminal } from 'lucide-react';
import type { ExecutionTraceItem } from '../../types';

interface ExecutionTraceProps {
  trace: ExecutionTraceItem[];
  onClearTrace?: () => void;
}

export const ExecutionTrace: React.FC<ExecutionTraceProps> = ({ trace, onClearTrace }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-cyan-400" />
          <h4 className="font-semibold text-slate-200 text-sm">Execution History & Pipeline Trace</h4>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
            {trace.length} steps logged
          </span>
        </div>
        {onClearTrace && trace.length > 0 && (
          <button
            onClick={onClearTrace}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Clear Log
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/80 p-3 flex-1 max-h-[380px] overflow-y-auto">
        {trace.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs">
            <Terminal className="w-8 h-8 text-slate-400 mb-2" />
            <p>No instructions executed yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">Execute Single Step (F7) or Run Program (F5) to log execution history.</p>
          </div>
        ) : (
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-1.5 px-2">#</th>
                <th className="py-1.5 px-2">Address</th>
                <th className="py-1.5 px-2">Instruction</th>
                <th className="py-1.5 px-2">Bytecode</th>
                <th className="py-1.5 px-2">Operation Details</th>
                <th className="py-1.5 px-2 text-right">Cycles</th>
              </tr>
            </thead>
            <tbody>
              {trace.map((item, idx) => (
                <tr
                  key={idx}
                  className="border-b border-slate-900/60 hover:bg-slate-900/40 transition-colors"
                >
                  <td className="py-1.5 px-2 text-slate-400">{item.step}</td>
                  <td className="py-1.5 px-2 text-cyan-400 font-semibold">{item.address}</td>
                  <td className="py-1.5 px-2 font-bold text-slate-200 flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    {item.instruction}
                  </td>
                  <td className="py-1.5 px-2 text-indigo-400">{item.bytecode}</td>
                  <td className="py-1.5 px-2 text-slate-400">{item.details}</td>
                  <td className="py-1.5 px-2 text-amber-400 text-right font-bold">+{item.cycles}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
