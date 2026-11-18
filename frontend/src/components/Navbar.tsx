import React from 'react';
import { Cpu, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  backendOnline: boolean | null;
  stage: number;
}

export const Navbar: React.FC<NavbarProps> = ({ backendOnline, stage }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-lg shadow-cyan-500/20 text-white">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">VISIONGUARD 2.0</h1>
              <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Stage {stage}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              DEAM-Integrated Intelligent Product Quality Inspection & Automated Sorting System
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 self-end md:self-auto">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/60 text-xs">
            <span className="text-slate-400">Backend Status:</span>
            <span className="flex items-center space-x-1.5 font-medium">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendOnline === true
                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                    : backendOnline === false
                    ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                    : 'bg-amber-500 animate-pulse'
                }`}
              />
              <span
                className={
                  backendOnline === true
                    ? 'text-emerald-400'
                    : backendOnline === false
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }
              >
                {backendOnline === true ? 'Online (200 OK)' : backendOnline === false ? 'Offline' : 'Connecting...'}
              </span>
            </span>
          </div>

          <div className="flex items-center space-x-1 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Local DEAM Simulator</span>
          </div>
        </div>
      </div>
    </header>
  );
};
