import React, { useState } from 'react';
import { LogicGatesLab } from './LogicGatesLab';
import { BooleanLogicLab } from './BooleanLogicLab';
import { KMapVisualizer } from './KMapVisualizer';
import { CombinationalLab } from './CombinationalLab';
import { FlipFlopLab } from './FlipFlopLab';
import { RegisterCounterLab } from './RegisterCounterLab';
import { FSMVisualizer } from './FSMVisualizer';
import { InspectionDecisionBridge } from './InspectionDecisionBridge';
import type { InspectionResult } from '../../types';
import {
  Cpu,
  Calculator,
  Grid,
  GitMerge,
  Activity,
  Layers,
  GitBranch,
  Zap,
} from 'lucide-react';

interface DeamLaboratoryProps {
  latestInspectionResult?: InspectionResult | null;
}

type DeamModuleId =
  | 'bridge'
  | 'gates'
  | 'boolean'
  | 'kmap'
  | 'combinational'
  | 'flipflops'
  | 'registers'
  | 'fsm';

export const DeamLaboratory: React.FC<DeamLaboratoryProps> = ({ latestInspectionResult }) => {
  const [activeModule, setActiveModule] = useState<DeamModuleId>('bridge');

  const navItems: Array<{
    id: DeamModuleId;
    label: string;
    unit: string;
    icon: React.ComponentType<{ className?: string }>;
    desc: string;
    badge?: string;
  }> = [
    {
      id: 'bridge',
      label: 'Vision-to-Logic Bridge',
      unit: 'System Integration',
      icon: Zap,
      desc: 'OpenCV flags to Boolean decision',
      badge: 'Core',
    },
    {
      id: 'gates',
      label: 'Digital Gates',
      unit: 'Unit 1',
      icon: Cpu,
      desc: '7 standard logic gates & truth tables',
    },
    {
      id: 'boolean',
      label: 'Boolean Algebra',
      unit: 'Unit 1',
      icon: Calculator,
      desc: 'Laws, De Morgan & canonical forms',
    },
    {
      id: 'kmap',
      label: 'K-Map Minimizer',
      unit: 'Unit 1',
      icon: Grid,
      desc: '2, 3, 4 variable SOP solver',
    },
    {
      id: 'combinational',
      label: 'Combinational Circuits',
      unit: 'Unit 2',
      icon: GitMerge,
      desc: 'Adders, MUX, Decoders, Encoders',
    },
    {
      id: 'flipflops',
      label: 'Flip-Flops',
      unit: 'Unit 3',
      icon: Activity,
      desc: 'SR, JK, D, T bistable multivibrators',
    },
    {
      id: 'registers',
      label: 'Registers & Counters',
      unit: 'Unit 3',
      icon: Layers,
      desc: 'Shift registers & asynchronous counters',
    },
    {
      id: 'fsm',
      label: 'Finite State Machines',
      unit: 'Unit 3',
      icon: GitBranch,
      desc: 'Moore production line sequential FSM',
    },
  ];

  const currentItem = navItems.find((n) => n.id === activeModule) || navItems[0];

  return (
    <div className="space-y-8 font-sans">
      {/* ========================================================= */}
      {/* PAGE HEADER                                               */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="w-10 h-1 bg-[#F59A16] rounded-full mb-2" />
          <h1 className="text-3xl font-extrabold text-[#252B35] tracking-tight">
            Digital Electronics Laboratory
          </h1>
          <p className="text-sm text-[#667085] mt-1">
            Explore digital logic, Boolean algebra, combinational circuits and sequential systems.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-600">
            Active Module: <strong className="text-slate-900">{currentItem.label}</strong>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TWO-COLUMN LAB WORKSPACE                                  */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT SIDEBAR: Vertical Navigation Menu (3 cols) */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="px-3 py-2 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Laboratory Modules
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveModule(item.id)}
                    className={`w-full p-3 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer group ${
                      isActive
                        ? 'bg-[#F59A16]/10 text-[#F59A16] font-bold border-l-4 border-[#F59A16] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          isActive
                            ? 'bg-[#F59A16] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-500 group-hover:text-slate-900'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs truncate">{item.label}</div>
                        <div className="text-[10px] text-slate-400 font-mono -mt-0.5">
                          {item.unit}
                        </div>
                      </div>
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

          {/* Quick Context Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="text-xs font-bold text-[#252B35]">Academic DEAM Alignment</div>
            <p className="text-[11px] text-[#667085] leading-relaxed">
              Demonstrates Units 1, 2, and 3 syllabus standards with real Python logic simulation
              engines backing every gate, K-Map simplification, and flip-flop excitation.
            </p>
          </div>
        </aside>

        {/* RIGHT CONTENT AREA: Dedicated Module Workspace (9 cols) */}
        <main className="lg:col-span-9">
          {activeModule === 'bridge' && (
            <InspectionDecisionBridge latestInspectionResult={latestInspectionResult} />
          )}
          {activeModule === 'gates' && <LogicGatesLab />}
          {activeModule === 'boolean' && <BooleanLogicLab />}
          {activeModule === 'kmap' && <KMapVisualizer />}
          {activeModule === 'combinational' && <CombinationalLab />}
          {activeModule === 'flipflops' && <FlipFlopLab />}
          {activeModule === 'registers' && <RegisterCounterLab />}
          {activeModule === 'fsm' && <FSMVisualizer />}
        </main>
      </div>
    </div>
  );
};
