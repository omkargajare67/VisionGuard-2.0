"""Event log and audit traceability manager for the virtual production line."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid


class EventRecord:
    def __init__(
        self,
        event_id: str,
        event_type: str,
        description: str,
        simulation_tick: int,
        product_id: Optional[str] = None,
        station: Optional[str] = None,
        controller_mode: Optional[str] = None,
        state: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None,
    ):
        self.event_id = event_id
        self.event_type = event_type
        self.description = description
        self.simulation_tick = simulation_tick
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.product_id = product_id
        self.station = station
        self.controller_mode = controller_mode
        self.state = state
        self.data = data or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type,
            "description": self.description,
            "simulation_tick": self.simulation_tick,
            "timestamp": self.timestamp,
            "product_id": self.product_id,
            "station": self.station,
            "controller_mode": self.controller_mode,
            "state": self.state,
            "data": self.data,
        }


class EventManager:
    def __init__(self, max_history: int = 500):
        self.max_history = max_history
        self._events: List[EventRecord] = []
        self._counter: int = 0

    def record(
        self,
        event_type: str,
        description: str,
        simulation_tick: int,
        product_id: Optional[str] = None,
        station: Optional[str] = None,
        controller_mode: Optional[str] = None,
        state: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None,
    ) -> EventRecord:
        self._counter += 1
        event_id = f"EVT-{self._counter:05d}"
        record = EventRecord(
            event_id=event_id,
            event_type=event_type,
            description=description,
            simulation_tick=simulation_tick,
            product_id=product_id,
            station=station,
            controller_mode=controller_mode,
            state=state,
            data=data,
        )
        self._events.append(record)
        if len(self._events) > self.max_history:
            self._events.pop(0)
        return record

    def get_events(
        self,
        limit: int = 100,
        product_id: Optional[str] = None,
        event_type: Optional[str] = None,
        station: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        filtered = self._events
        if product_id:
            filtered = [e for e in filtered if e.product_id == product_id]
        if event_type:
            filtered = [e for e in filtered if e.event_type == event_type]
        if station:
            filtered = [e for e in filtered if e.station == station]
        # Return most recent first
        return [e.to_dict() for e in reversed(filtered[-limit:])]

    def clear(self) -> None:
        self._events.clear()
        self._counter = 0
