import React from 'react';
import type { SampleMetadata } from '../../types';
import { getSampleImageUrl } from '../../services/api';
import { CheckCircle2, AlertOctagon, Cpu } from 'lucide-react';

interface SampleCatalogProps {
  samples: SampleMetadata[];
  selectedSampleId: string | null;
  onSelectSample: (sampleId: string) => void;
  isLoading: boolean;
}

export const SampleCatalog: React.FC<SampleCatalogProps> = ({
  samples,
  selectedSampleId,
  onSelectSample,
  isLoading,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Synthetic Industrial Workpieces</span>
          </h3>
          <p className="text-xs text-slate-400">
            Deterministic benchmark control modules (640x480 resolution)
          </p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
          {samples.length} Samples
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {samples.map((sample) => {
          const isSelected = selectedSampleId === sample.sample_id;
          const isPass = sample.expected_status === 'PASS';

          return (
            <button
              key={sample.sample_id}
              onClick={() => onSelectSample(sample.sample_id)}
              disabled={isLoading}
              className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between group ${
                isSelected
                  ? 'border-cyan-500 bg-cyan-950/40 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
              } disabled:opacity-60`}
            >
              <div className="w-full aspect-[4/3] rounded-lg bg-slate-950 overflow-hidden mb-2 relative border border-slate-850">
                <img
                  src={getSampleImageUrl(sample.sample_id)}
                  alt={sample.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <span
                  className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border shadow-sm ${
                    isPass
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                      : 'bg-rose-950/80 text-rose-400 border-rose-500/40'
                  }`}
                >
                  {sample.expected_status}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-cyan-300">
                    {sample.sample_id}
                  </span>
                  {isPass ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                  )}
                </div>
                <h4 className="text-xs font-semibold text-slate-200 line-clamp-1 mb-0.5">
                  {sample.name}
                </h4>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-snug">
                  {sample.defect_category}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
