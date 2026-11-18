import React from 'react';
import { Cpu, ShieldCheck, Eye, Activity, Binary, Terminal, Factory } from 'lucide-react';

interface NavbarProps {
  backendOnline: boolean | null;
  stage: number;
  activeTab: 'production' | '8086' | 'deam' | 'vision' | 'monitor';
  onSelectTab: (tab: 'production' | '8086' | 'deam' | 'vision' | 'monitor') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  backendOnline,
  stage,
  activeTab,
  onSelectTab,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-lg shadow-cyan-500/20 text-white">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">VISIONGUARD 2.0</h1>
              <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Stage {stage}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              DEAM-Integrated Intelligent Product Quality Inspection & Automated Sorting System
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => onSelectTab('production')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'production'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Factory className="w-3.5 h-3.5" />
            <span>Production Line (Stage 5)</span>
          </button>

          <button
            onClick={() => onSelectTab('8086')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === '8086'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>8086 & PPI (Stage 4)</span>
          </button>

          <button
            onClick={() => onSelectTab('deam')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'deam'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            <span>DEAM Lab (Stage 3)</span>
          </button>

          <button
            onClick={() => onSelectTab('vision')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'vision'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Vision Inspector (Stage 2)</span>
          </button>

          <button
            onClick={() => onSelectTab('monitor')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'monitor'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>System Monitor (Stage 1)</span>
          </button>
        </div>

        {/* Right Status */}
        <div className="flex items-center space-x-4 self-end md:self-auto">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/60 text-xs">
            <span className="text-slate-400">Backend:</span>
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
                {backendOnline === true ? 'Online' : backendOnline === false ? 'Offline' : 'Connecting...'}
              </span>
            </span>
          </div>

          <div className="flex items-center space-x-1 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Intel 8086 & 8255</span>
          </div>
        </div>
      </div>
    </header>
  );
};
