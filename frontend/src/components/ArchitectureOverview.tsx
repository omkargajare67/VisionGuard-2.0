import React from 'react';
import { Layers, CheckCircle2, CircleDashed, Cpu, Binary, CircuitBoard, Gauge, Sparkles } from 'lucide-react';

export const ArchitectureOverview: React.FC = () => {
  const stages = [
    {
      id: 1,
      title: 'Stage 1: Foundation & Architecture Baseline',
      status: 'active',
      desc: 'Environment verification, modular FastAPI backend, Vite+React+TS frontend, health check API, and architecture documentation.',
    },
    {
      id: 2,
      title: 'Stage 2: OpenCV Vision Inspection & Synthetic Generator',
      status: 'planned',
      desc: 'Procedural sample creation with surface defects, Canny/contour algorithms, dimensional verification, and camera ingestion.',
    },
    {
      id: 3,
      title: 'Stage 3: DEAM Digital Electronics Simulation Engine',
      status: 'planned',
      desc: 'Gate-level models, K-Map minimizer, Adders, MUX/DEMUX, Flip-Flops, Registers, Counters, and production line FSM.',
    },
    {
      id: 4,
      title: 'Stage 4: Educational 8086 CPU & 8255 PPI Simulator',
      status: 'planned',
      desc: '16-bit register file, 1 MB segmented memory, instruction subset decoder, 8255 PPI modes, and hardware interrupts/timers.',
    },
    {
      id: 5,
      title: 'Stage 5: Virtual Production Line & System Integration',
      status: 'planned',
      desc: 'Conveyor kinematics, IR sensor beam tripping, servo sorting deflector, LED/buzzer alarms, and live WebSocket telemetry.',
    },
  ];

  const deamUnits = [
    {
      unit: 'Unit 1',
      title: 'Logic & Boolean Algebra',
      icon: Binary,
      items: 'Gates (AND/OR/NOT), Truth tables, K-map reduction',
    },
    {
      unit: 'Unit 2',
      title: 'Combinational Logic',
      icon: CircuitBoard,
      items: 'Adders, Multiplexers, Decoders, Priority Encoders',
    },
    {
      unit: 'Unit 3',
      title: 'Sequential Logic & FSM',
      icon: Layers,
      items: 'Flip-Flops (SR/JK/D/T), Shift Registers, Counters, FSM',
    },
    {
      unit: 'Unit 4',
      title: '8086 Microprocessor',
      icon: Cpu,
      items: 'Registers, 1MB Segmented Memory, Addressing, 8255 PPI',
    },
    {
      unit: 'Unit 5',
      title: 'Pipelining Visualization',
      icon: Gauge,
      items: 'BIU/EU concurrency, Instruction queue, Pipeline stages',
    },
    {
      unit: 'Unit 6',
      title: 'Interrupts & Timers',
      icon: Sparkles,
      items: 'INTR, NMI, IVT, ISR routine execution, 8253 timer logic',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 5-Stage Roadmap Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm shadow-xl">
        <div className="flex items-center space-x-3 mb-5 pb-4 border-b border-slate-800/80">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">5-Stage Implementation Roadmap</h2>
            <p className="text-xs text-slate-400">Strict incremental delivery pipeline for VisionGuard 2.0</p>
          </div>
        </div>

        <div className="space-y-3">
          {stages.map((st) => (
            <div
              key={st.id}
              className={`p-4 rounded-xl border transition-all ${
                st.status === 'active'
                  ? 'border-cyan-500/50 bg-gradient-to-r from-cyan-950/30 to-blue-950/20 shadow-md shadow-cyan-500/10'
                  : 'border-slate-800/80 bg-slate-950/30 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    {st.status === 'active' ? (
                      <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <CircleDashed className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <h3 className={`text-sm font-semibold ${st.status === 'active' ? 'text-cyan-200' : 'text-slate-300'}`}>
                      {st.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{st.desc}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full shrink-0 ml-2 ${
                    st.status === 'active'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {st.status === 'active' ? 'Current Stage' : 'Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DEAM Curriculum Mapping */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm shadow-xl">
        <div className="flex items-center space-x-3 mb-5 pb-4 border-b border-slate-800/80">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <CircuitBoard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">DEAM Syllabus Concept Integration</h2>
            <p className="text-xs text-slate-400">Curriculum units to be concretely realized throughout development</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {deamUnits.map((u) => {
            const Icon = u.icon;
            return (
              <div
                key={u.unit}
                className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:border-slate-700/80 transition-colors"
              >
                <div className="flex items-center space-x-2.5 mb-2">
                  <div className="p-1.5 rounded-lg bg-slate-800 text-cyan-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">{u.unit}</span>
                    <h4 className="text-xs font-semibold text-slate-200">{u.title}</h4>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{u.items}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
