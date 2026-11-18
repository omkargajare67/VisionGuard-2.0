import React, { useState } from 'react';
import type { InspectionResult } from '../../types';
import { Columns, SplitSquareVertical } from 'lucide-react';

interface ImageComparisonProps {
  originalUrl: string | null;
  result: InspectionResult | null;
}

export const ImageComparison: React.FC<ImageComparisonProps> = ({ originalUrl, result }) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'split' | 'sideBySide'>('sideBySide');

  const annotatedUrl = result?.annotated_image || null;

  if (!originalUrl && !annotatedUrl) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-white">Input vs. Inspection Overlay</h3>
          <p className="text-[11px] text-slate-400">
            Compare pristine input frame against computer vision defect annotations
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('sideBySide')}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              viewMode === 'sideBySide'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
            title="Side by Side"
          >
            <Columns className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              viewMode === 'split'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
            title="Split Comparison Slider"
          >
            <SplitSquareVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewMode === 'sideBySide' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative aspect-[4/3]">
            {originalUrl ? (
              <img src={originalUrl} alt="Original Ingestion" className="w-full h-full object-contain" />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-600">
                Original Frame
              </div>
            )}
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono text-slate-300 border border-slate-800">
              Raw Input
            </span>
          </div>

          <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative aspect-[4/3]">
            {annotatedUrl ? (
              <img src={annotatedUrl} alt="Annotated Result" className="w-full h-full object-contain" />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-600">
                Annotated Result
              </div>
            )}
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono text-cyan-300 border border-slate-800">
              CV Overlay
            </span>
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-[4/3] select-none">
          {/* Base Layer: Original */}
          {originalUrl && (
            <img
              src={originalUrl}
              alt="Raw Ingestion"
              className="absolute inset-0 w-full h-full object-contain"
            />
          )}

          {/* Reveal Layer: Annotated */}
          {annotatedUrl && (
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
            >
              <img
                src={annotatedUrl}
                alt="Annotated Result"
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
          )}

          {/* Slider Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 cursor-ew-resize shadow-[0_0_8px_rgba(34,211,238,0.8)]"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-[10px] font-bold shadow-md">
              &harr;
            </div>
          </div>

          {/* Slider Range Input */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
          />
        </div>
      )}
    </div>
  );
};
