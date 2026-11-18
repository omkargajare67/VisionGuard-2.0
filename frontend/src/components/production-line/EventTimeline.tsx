import React from 'react';
import type { EventRecordDTO } from '../../types';
import { History, Filter } from 'lucide-react';

interface EventTimelineProps {
  events: EventRecordDTO[];
}

export const EventTimeline: React.FC<EventTimelineProps> = ({ events = [] }) => {
  const [filterType, setFilterType] = React.useState<string>('ALL');

  const safeEvents = events || [];
  const filteredEvents = safeEvents.filter((ev) => {
    if (filterType === 'ALL') return true;
    return ev.event_type === filterType;
  });

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
      {/* Header with Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Event Audit &amp; Traceability Trail</h3>
            <p className="text-[11px] text-slate-400">Deterministic Product Lifecycle History</p>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1 font-mono outline-none cursor-pointer"
          >
            <option value="ALL">All Events ({safeEvents.length})</option>
            <option value="PRODUCT_ENTERED">Product Entered</option>
            <option value="INSPECTION_COMPLETED">Inspection Completed</option>
            <option value="SORTING_DIVERTED">Sorting Diverted</option>
            <option value="PRODUCT_EXITED">Product Exited</option>
            <option value="EMERGENCY_STOP">Emergency Stop</option>
          </select>
        </div>
      </div>

      {/* Scrollable Event List */}
      <div className="mt-3 max-h-[280px] overflow-y-auto space-y-2 pr-1 font-mono text-xs">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No events recorded yet. Start conveyor or inject products to begin.
          </div>
        ) : (
          filteredEvents.map((ev: any, idx) => {
            const eventType = String(ev.event_type || '');
            const message = String(ev.message || ev.description || '');
            const isAlert = eventType.includes('EMERGENCY') || eventType.includes('FAULT');
            const isPass = message.includes('PASS');
            const isReject = message.includes('REJECT');
            const tick = ev.tick ?? ev.simulation_tick ?? 0;
            const eventKey = ev.id || ev.event_id || `ev-${idx}`;
            const timeStr = ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : '';

            return (
              <div
                key={eventKey}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  isAlert
                    ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                    : isPass
                    ? 'bg-emerald-950/15 border-emerald-500/30 text-emerald-200'
                    : isReject
                    ? 'bg-rose-950/15 border-rose-500/30 text-rose-200'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-400 font-bold font-mono">
                    T+{tick}
                  </span>

                  {ev.product_id && (
                    <span className="px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-500/30 text-[10px] text-indigo-300 font-bold font-mono">
                      {ev.product_id}
                    </span>
                  )}

                  <span className="text-slate-200">{message}</span>
                </div>

                <div className="flex items-center space-x-2 text-[10px] text-slate-500 shrink-0">
                  {ev.station && <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{ev.station}</span>}
                  {timeStr && <span>{timeStr}</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
