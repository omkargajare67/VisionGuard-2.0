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
  Sparkles,
} from 'lucide-react';

interface DeamLaboratoryProps {
  latestInspectionResult?: InspectionResult | null;
}

export const DeamLaboratory: React.FC<DeamLaboratoryProps> = ({ latestInspectionResult }) => {
  const [activeModule, setActiveModule] = useState<
    'bridge' | 'gates' | 'boolean' | 'kmap' | 'combinational' | 'flipflops' | 'registers' | 'fsm'
  >('bridge');

  const LAB_MODULES = [
    {
      id: 'bridge',
      label: 'Vision-Logic Bridge',
      unit: 'Integration',
      badge: 'Novelty',
      icon: Zap,
      desc: 'OpenCV defect flags to combinational sorting decision',
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
      desc: 'Canonical expansions & laws',
    },
    {
      id: 'kmap',
      label: 'K-Map Minimizer',
      unit: 'Unit 1',
      icon: Grid,
      desc: 'Gray-code 2/3/4 variable SOP solver',
    },
    {
      id: 'combinational',
      label: 'Combinational Circuits',
      unit: 'Unit 2',
      icon: GitMerge,
      desc: 'Adders, MUX, Decoders, Encoders, Parity',
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
      desc: 'SISO/SIPO/PISO/PIPO & Mod-N Counters',
    },
    {
      id: 'fsm',
      label: 'Production Line FSM',
      unit: 'Unit 3',
      icon: GitBranch,
      desc: 'Moore sequential state trajectory',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Hero Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800">
                DEAM STAGE 3
              </span>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span>Digital Electronics Laboratory (DEAM Units 1, 2 & 3)</span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Interactive Boolean algebra, combinational circuitry, sequential state machines, and optical inspection decision integration
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            <span>Python Backend DEAM Engine Active</span>
          </div>
        </div>

        {/* Module Selection Pills Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {LAB_MODULES.map((mod) => {
            const Icon = mod.icon;
            const isActive = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id as any)}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-md shadow-cyan-500/20'
                    : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Icon className="w-4 h-4 text-cyan-400" />
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">
                      {mod.unit}
                    </span>
                  </div>
                  <div className="text-xs font-bold mt-2 text-white">{mod.label}</div>
                </div>

                {mod.badge && (
                  <span className="mt-2 text-[9px] font-bold uppercase text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800 w-fit">
                    {mod.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Lab Module */}
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
    </div>
  );
};
