import React from 'react';
import type { InspectionResult } from '../../types';
import { CheckCircle2, XCircle, Gauge, Activity } from 'lucide-react';

interface DefectMetricsProps {
  result: InspectionResult | null;
}

export const DefectMetrics: React.FC<DefectMetricsProps> = ({ result }) => {
  if (!result) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center text-slate-500 text-xs">
        <Gauge className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
        Execute optical inspection to view digital binary flags and metric analysis.
      </div>
    );
  }

  const flagsList = [
    {
      key: 'product_detected',
      label: 'Product Presence',
      flag: result.flags.product_detected,
      check: result.checks.product_detection,
    },
    {
      key: 'label_present',
      label: 'Identification Label',
      flag: result.flags.label_present,
      check: result.checks.label_inspection,
    },
    {
      key: 'marking_correct',
      label: 'Marking Colour (Blue)',
      flag: result.flags.marking_correct,
      check: result.checks.color_inspection,
    },
    {
      key: 'components_complete',
      label: 'Components Mounted (3x)',
      flag: result.flags.components_complete,
      check: result.checks.component_inspection,
    },
    {
      key: 'geometry_ok',
      label: 'Structural Outline',
      flag: result.flags.geometry_ok,
      check: result.checks.outline_inspection,
    },
    {
      key: 'surface_defect_detected',
      label: 'Surface Scratch Check',
      // Note: flag=0 means clean surface (satisfied), flag=1 means scratch defect
      flag: result.flags.surface_defect_detected === 0 ? 1 : 0,
      invertedDesc: result.flags.surface_defect_detected === 1,
      check: result.checks.surface_inspection,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">DEAM Binary Inspection Flags</h3>
            <p className="text-[11px] text-slate-400">
              Discrete digital logic inputs for Stage 3 Boolean engine
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 uppercase font-mono">CV Latency</span>
          <p className="text-xs font-mono font-bold text-cyan-300">
            {result.processing_time_ms} ms
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-mono">
              <th className="py-2 font-medium">CHECK ITEM</th>
              <th className="py-2 text-center font-medium">BINARY FLAG</th>
              <th className="py-2 font-medium">MEASURED VALUE</th>
              <th className="py-2 font-medium">THRESHOLD</th>
              <th className="py-2 text-right font-medium">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {flagsList.map((item) => {
              const isPass = item.flag === 1;

              return (
                <tr key={item.key} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-2.5 font-sans font-medium text-slate-200">
                    {item.label}
                  </td>
                  <td className="py-2.5 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                        isPass
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {item.flag}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-300 text-[11px]">
                    {item.check?.measured_value || 'N/A'}
                  </td>
                  <td className="py-2.5 text-slate-400 text-[11px]">
                    {item.check?.threshold || 'N/A'}
                  </td>
                  <td className="py-2.5 text-right font-sans">
                    <span className="inline-flex items-center space-x-1">
                      {isPass ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[11px] font-semibold text-emerald-400">PASS</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span className="text-[11px] font-semibold text-rose-400">FAIL</span>
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
