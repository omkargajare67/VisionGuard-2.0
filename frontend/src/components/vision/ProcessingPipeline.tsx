import React, { useState } from 'react';
import type { InspectionResult } from '../../types';
import { Layers, Eye, ZoomIn } from 'lucide-react';

interface ProcessingPipelineProps {
  result: InspectionResult | null;
  rawPreviewUrl: string | null;
}

export const ProcessingPipeline: React.FC<ProcessingPipelineProps> = ({
  result,
  rawPreviewUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'annotated' | 'edge' | 'enhanced' | 'grayscale' | 'original'>('annotated');
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  const stages = [
    {
      id: 'annotated' as const,
      label: '5. Annotated Inspection',
      subtitle: 'Defect bounding boxes, verdict & status overlays',
      src: result?.annotated_image || rawPreviewUrl,
    },
    {
      id: 'edge' as const,
      label: '4. Canny Edge Map',
      subtitle: '50-150 hysteresis gradient boundaries',
      src: result?.edge_image,
    },
    {
      id: 'enhanced' as const,
      label: '3. CLAHE Enhanced',
      subtitle: 'Bilateral filter + Adaptive histogram equalization',
      src: result?.enhanced_image || result?.processed_image,
    },
    {
      id: 'grayscale' as const,
      label: '2. Grayscale Matrix',
      subtitle: 'Single-channel luminance intensity map',
      src: result?.grayscale_image,
    },
    {
      id: 'original' as const,
      label: '1. Original Acquisition',
      subtitle: '640x480 RGB workpiece input frame',
      src: rawPreviewUrl || result?.annotated_image,
    },
  ];

  const currentStage = stages.find((s) => s.id === activeTab) || stages[0];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">OpenCV Preprocessing Pipeline</h3>
            <p className="text-[11px] text-slate-400">
              Interactive visualization of sequential computer vision filters
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <button
          onClick={() => setIsZoomed((prev) => !prev)}
          className="self-end sm:self-auto flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-850 border border-slate-750 hover:bg-slate-800 transition-colors"
          title="Toggle Large Zoom View"
        >
          <ZoomIn className="w-3.5 h-3.5" />
          <span>{isZoomed ? 'Standard View' : 'Enlarge Canvas'}</span>
        </button>
      </div>

      {/* Stage Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80">
        {stages.map((stage) => {
          const isActive = activeTab === stage.id;
          const hasImage = Boolean(stage.src);

          return (
            <button
              key={stage.id}
              onClick={() => setActiveTab(stage.id)}
              disabled={!hasImage}
              className={`px-2.5 py-2 rounded-lg text-left transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : hasImage
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  : 'text-slate-600 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="text-[11px] font-semibold truncate">{stage.label}</div>
              <div className="text-[9px] text-slate-500 truncate hidden sm:block">
                {stage.subtitle}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Stage Display Canvas */}
      <div
        className={`relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center transition-all ${
          isZoomed ? 'aspect-[4/3] max-h-[560px]' : 'aspect-[4/3] max-h-[420px]'
        }`}
      >
        {currentStage.src ? (
          <img
            src={currentStage.src}
            alt={currentStage.label}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-center p-8 text-slate-500 text-xs">
            <Eye className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-40" />
            Stage output will populate when inspection is executed.
          </div>
        )}

        <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-mono text-slate-300">
          <span className="text-cyan-400 font-semibold">{currentStage.label}</span>
          <span className="text-slate-500 ml-2">640 &times; 480</span>
        </div>
      </div>
    </div>
  );
};
