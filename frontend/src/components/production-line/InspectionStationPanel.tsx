import React from 'react';
import type { ProductDTO } from '../../types';
import { Camera, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface InspectionStationPanelProps {
  currentProduct: ProductDTO | null;
  lastInspectedProduct: ProductDTO | null;
}

export const InspectionStationPanel: React.FC<InspectionStationPanelProps> = ({
  currentProduct,
  lastInspectedProduct,
}) => {
  const activeProduct = currentProduct || lastInspectedProduct;
  const isCurrentlyInspecting = currentProduct?.status === 'AT_INSPECTION';

  const flags = activeProduct?.inspection_flags || {};
  const d = flags.D ?? 1;
  const s = flags.S ?? 0;
  const c = flags.C ?? 1;
  const l = flags.L ?? 1;
  const m = flags.M ?? 1;
  const g = flags.G ?? 1;

  const verdict = activeProduct?.sorting_result;
  const inspectionTime = activeProduct?.inspection_data?.processing_time_ms;

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Station 1: OpenCV Vision Inspection</h3>
              <p className="text-[11px] text-slate-400">Position: 30.0% • 6-Point Optical Verification</p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
              isCurrentlyInspecting
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                : activeProduct
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            {isCurrentlyInspecting ? 'ANALYZING FRAME' : activeProduct ? 'STANDBY / LOGGED' : 'WAITING FOR FEED'}
          </span>
        </div>

        {/* Product Snapshot & Viewfinder */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Simulated Camera Viewfinder */}
          <div className="relative aspect-[4/3] rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
            {activeProduct ? (
              <img
                src={`/api/vision/samples/${activeProduct.sample_id}/image`}
                alt={activeProduct.sample_id}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image endpoint fails
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : null}

            {/* Viewfinder crosshairs & reticle overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3">
              <div className="flex justify-between text-[10px] font-mono text-cyan-400/80">
                <span>[CAM-01: 640x480]</span>
                <span>{activeProduct ? activeProduct.sample_id : 'NO TARGET'}</span>
              </div>
              <div className="flex justify-center items-center">
                <div className={`w-16 h-16 border rounded-lg border-dashed ${
                  isCurrentlyInspecting ? 'border-amber-400 animate-spin' : 'border-cyan-400/50'
                }`} />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-cyan-400/80">
                <span>ZOOM: 1.0X</span>
                <span>ROI: ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Inspection Flags and DEAM Signal Decodes */}
          <div className="space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono pb-1 border-b border-slate-800">
                <span className="text-slate-400">Target Product:</span>
                <span className="text-white font-bold">{activeProduct?.sample_id || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono py-1 border-b border-slate-800">
                <span className="text-slate-400">Inspection Time:</span>
                <span className="text-cyan-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {inspectionTime ? `${inspectionTime.toFixed(1)} ms` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono py-1 border-b border-slate-800">
                <span className="text-slate-400">Decision Verdict:</span>
                <span
                  className={`font-bold flex items-center gap-1 ${
                    verdict === 'PASS'
                      ? 'text-emerald-400'
                      : verdict === 'REJECT'
                      ? 'text-rose-400'
                      : 'text-slate-500'
                  }`}
                >
                  {verdict === 'PASS' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {verdict === 'REJECT' && <XCircle className="w-3.5 h-3.5" />}
                  {verdict || 'PENDING'}
                </span>
              </div>
            </div>

            {/* 6 Binary DEAM Flags Grid */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5 block">
                Extracted DEAM Features (PPI Port A [80H])
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                {/* D Flag */}
                <div className={`p-1.5 rounded-lg border text-center ${
                  d === 1 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="text-[9px] text-slate-400">D (Detect)</div>
                  <div className="font-bold">{d}</div>
                </div>

                {/* S Flag */}
                <div className={`p-1.5 rounded-lg border text-center ${
                  s === 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="text-[9px] text-slate-400">S (Scratch)</div>
                  <div className="font-bold">{s}</div>
                </div>

                {/* C Flag */}
                <div className={`p-1.5 rounded-lg border text-center ${
                  c === 1 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="text-[9px] text-slate-400">C (Comps)</div>
                  <div className="font-bold">{c}</div>
                </div>

                {/* L Flag */}
                <div className={`p-1.5 rounded-lg border text-center ${
                  l === 1 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="text-[9px] text-slate-400">L (Label)</div>
                  <div className="font-bold">{l}</div>
                </div>

                {/* M Flag */}
                <div className={`p-1.5 rounded-lg border text-center ${
                  m === 1 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="text-[9px] text-slate-400">M (Marking)</div>
                  <div className="font-bold">{m}</div>
                </div>

                {/* G Flag */}
                <div className={`p-1.5 rounded-lg border text-center ${
                  g === 1 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="text-[9px] text-slate-400">G (Geom)</div>
                  <div className="font-bold">{g}</div>
                </div>
              </div>
            </div>

            {/* Fault reason string if rejected */}
            {activeProduct?.fault_reason && (
              <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-[11px] font-mono">
                <span className="font-bold">Fault: </span>
                {activeProduct.fault_reason}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
