import React from 'react';
import type { ActuatorState } from '../../types';
import { GitFork, Cpu, Volume2, ArrowDownRight, ArrowRight } from 'lucide-react';

interface SortingStationPanelProps {
  actuators: ActuatorState;
}

export const SortingStationPanel: React.FC<SortingStationPanelProps> = ({ actuators }) => {
  const gateAngle = actuators.diverter_gate.angle_deg || 0;
  const isDiverting = gateAngle > 0;
  const portBByte = actuators.ppi_port_b_byte ?? 0;
  const portBHex = `0x${portBByte.toString(16).toUpperCase().padStart(2, '0')}`;
  const portBBin = portBByte.toString(2).padStart(8, '0');

  const totalSorted = actuators.pass_lane_count + actuators.reject_lane_count;
  const passRate = totalSorted > 0 ? ((actuators.pass_lane_count / totalSorted) * 100).toFixed(1) : '0.0';
  const rejectRate = totalSorted > 0 ? ((actuators.reject_lane_count / totalSorted) * 100).toFixed(1) : '0.0';

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Station 2: Automated Pneumatic Sorting</h3>
              <p className="text-[11px] text-slate-400">Position: 70.0% • 8255 Port B Actuator Subsystem</p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
              isDiverting
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 animate-pulse'
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
            }`}
          >
            {isDiverting ? 'GATE ACTUATED (45°)' : 'GATE IDLE (0°)'}
          </span>
        </div>

        {/* Lane Throughput Counters */}
        <div className="grid grid-cols-2 gap-3 mt-4 font-mono">
          {/* PASS Lane Card */}
          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
            <div className="flex items-center justify-between text-xs text-emerald-400 pb-1">
              <span className="flex items-center gap-1 font-bold">
                <ArrowRight className="w-3.5 h-3.5" /> PASS LANE
              </span>
              <span>{passRate}%</span>
            </div>
            <div className="text-2xl font-bold text-emerald-200 mt-1">
              {actuators.pass_lane_count}
              <span className="text-xs text-emerald-500/80 font-normal ml-1">units</span>
            </div>
          </div>

          {/* REJECT Lane Card */}
          <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30">
            <div className="flex items-center justify-between text-xs text-rose-400 pb-1">
              <span className="flex items-center gap-1 font-bold">
                <ArrowDownRight className="w-3.5 h-3.5" /> REJECT CHUTE
              </span>
              <span>{rejectRate}%</span>
            </div>
            <div className="text-2xl font-bold text-rose-200 mt-1">
              {actuators.reject_lane_count}
              <span className="text-xs text-rose-500/80 font-normal ml-1">units</span>
            </div>
          </div>
        </div>

        {/* Physical Actuator Signal Indicators */}
        <div className="mt-4 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
            Actuator Drive Lines
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            {/* Diverter Servo */}
            <div className={`p-2 rounded-lg border text-center ${
              isDiverting
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}>
              <div className="text-[9px] text-slate-500">GATE SERVO (PB1)</div>
              <div>{gateAngle}°</div>
            </div>

            {/* PASS LED */}
            <div className={`p-2 rounded-lg border text-center ${
              actuators.green_led
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold shadow-sm shadow-emerald-500/40'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}>
              <div className="text-[9px] text-slate-500">PASS LED (PB2)</div>
              <div>{actuators.green_led ? 'ON (HIGH)' : 'OFF'}</div>
            </div>

            {/* REJECT LED */}
            <div className={`p-2 rounded-lg border text-center ${
              actuators.red_led
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold shadow-sm shadow-rose-500/40'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}>
              <div className="text-[9px] text-slate-500">REJECT LED (PB3)</div>
              <div>{actuators.red_led ? 'ON (HIGH)' : 'OFF'}</div>
            </div>

            {/* Buzzer */}
            <div className={`p-2 rounded-lg border text-center ${
              actuators.buzzer
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold shadow-sm shadow-amber-500/40 animate-pulse'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}>
              <div className="text-[9px] text-slate-500">ALARM BUZZER (PB4)</div>
              <div className="flex items-center justify-center gap-1">
                {actuators.buzzer && <Volume2 className="w-3 h-3" />}
                {actuators.buzzer ? 'SOUNDING' : 'OFF'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Intel 8255 PPI Port B Bus State */}
      <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
        <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800/80">
          <span className="flex items-center gap-1 text-cyan-400 font-semibold">
            <Cpu className="w-3.5 h-3.5" /> 8255 PPI PORT B [81H]
          </span>
          <span className="text-white font-bold">{portBHex}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] pt-2 text-slate-400">
          <span>Binary Bus:</span>
          <span className="text-cyan-300 tracking-widest">{portBBin}b</span>
        </div>
      </div>
    </div>
  );
};
