import React from 'react';
import type { InspectionResult } from '../../types';
import { CheckCircle2, AlertOctagon, HelpCircle, ShieldAlert, Clock, FileText } from 'lucide-react';

interface InspectionResultsProps {
  result: InspectionResult | null;
}

export const InspectionResults: React.FC<InspectionResultsProps> = ({ result }) => {
  if (!result) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm shadow-xl text-center py-12 text-slate-500">
        <FileText className="w-10 h-10 mx-auto text-slate-600 mb-3 opacity-40" />
        <h3 className="text-sm font-semibold text-slate-400">No Inspection Performed Yet</h3>
        <p className="text-xs text-slate-500 mt-1">
          Select a sample or upload an image and click "Run Vision Inspection".
        </p>
      </div>
    );
  }

  const isPass = result.status === 'PASS';
  const isReject = result.status === 'REJECT';

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm shadow-xl space-y-5">
      {/* Verdict Header */}
      <div
        className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isPass
            ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 to-slate-950/40'
            : isReject
            ? 'border-rose-500/40 bg-gradient-to-r from-rose-950/40 to-slate-950/40'
            : 'border-amber-500/40 bg-gradient-to-r from-amber-950/40 to-slate-950/40'
        }`}
      >
        <div className="flex items-center space-x-4">
          <div
            className={`p-3 rounded-xl border shadow-lg ${
              isPass
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/20'
                : isReject
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-rose-500/20'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-amber-500/20'
            }`}
          >
            {isPass ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : isReject ? (
              <AlertOctagon className="w-8 h-8" />
            ) : (
              <HelpCircle className="w-8 h-8" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Preliminary Classification
              </span>
            </div>
            <h2
              className={`text-2xl font-black tracking-tight ${
                isPass ? 'text-emerald-300' : isReject ? 'text-rose-300' : 'text-amber-300'
              }`}
            >
              {result.status}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isPass
                ? 'Nominal product. All quality inspection tolerances satisfied.'
                : isReject
                ? `${result.defect_descriptions.length} critical defect(s) identified.`
                : 'Item could not be reliably located or segmented.'}
            </p>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800 text-xs text-slate-400 font-mono">
          <span className="text-cyan-400 font-semibold">{result.sample_id_or_filename}</span>
          <span className="flex items-center space-x-1 text-[11px] text-slate-500 mt-0.5">
            <Clock className="w-3 h-3" />
            <span>{result.processing_time_ms} ms</span>
          </span>
        </div>
      </div>

      {/* Fault / Defect Descriptions List */}
      {result.defect_descriptions.length > 0 && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-rose-300">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Identified Production Line Defects:</span>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc text-xs text-rose-200/90 leading-relaxed">
            {result.defect_descriptions.map((desc, idx) => (
              <li key={idx} className="font-sans">
                {desc}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
