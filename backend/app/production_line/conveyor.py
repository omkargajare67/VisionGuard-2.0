"""Virtual Conveyor Belt simulation model."""

from typing import Any, Dict, List, Optional


class VirtualConveyor:
    def __init__(self, speed: float = 5.0, length: float = 100.0, capacity: int = 5):
        self.speed: float = float(speed)
        self.length: float = float(length)
        self.capacity: int = capacity

        self.running: bool = False
        self.paused: bool = False
        self.emergency_stopped: bool = False
        self.direction: str = "FORWARD"

        self.total_distance: float = 0.0
        self.running_ticks: int = 0
        self.stopped_ticks: int = 0
        self.movement_history: List[Dict[str, Any]] = []

    def start(self) -> bool:
        if self.emergency_stopped:
            return False
        self.running = True
        self.paused = False
        return True

    def stop(self) -> None:
        self.running = False
        self.paused = False

    def pause(self) -> None:
        if self.running:
            self.paused = True

    def resume(self) -> bool:
        if self.emergency_stopped:
            return False
        if self.running and self.paused:
            self.paused = False
            return True
        return False

    def emergency_stop(self) -> None:
        self.running = False
        self.paused = False
        self.emergency_stopped = True

    def clear_emergency(self) -> None:
        self.emergency_stopped = False

    def set_speed(self, speed: float) -> float:
        self.speed = max(1.0, min(25.0, float(speed)))
        return self.speed

    def reset(self) -> None:
        self.running = False
        self.paused = False
        self.emergency_stopped = False
        self.total_distance = 0.0
        self.running_ticks = 0
        self.stopped_ticks = 0
        self.movement_history.clear()

    def advance_tick(self, tick_number: int) -> float:
        """Advance one simulation tick. Returns delta distance moved."""
        if self.running and not self.paused and not self.emergency_stopped:
            delta = self.speed
            self.total_distance += delta
            self.running_ticks += 1
            if len(self.movement_history) < 200:
                self.movement_history.append({
                    "tick": tick_number,
                    "delta": delta,
                    "total_distance": round(self.total_distance, 2),
                    "status": "RUNNING",
                })
            return delta
        else:
            self.stopped_ticks += 1
            return 0.0

    @property
    def is_running(self) -> bool:
        return self.running

    @property
    def is_paused(self) -> bool:
        return self.paused

    def to_dict(self) -> Dict[str, Any]:
        return {
            "speed": self.speed,
            "length": self.length,
            "capacity": self.capacity,
            "running": self.running,
            "is_running": self.running,
            "paused": self.paused,
            "is_paused": self.paused,
            "emergency_stopped": self.emergency_stopped,
            "direction": self.direction,
            "total_distance": round(self.total_distance, 2),
            "running_ticks": self.running_ticks,
            "stopped_ticks": self.stopped_ticks,
            "total_ticks": self.running_ticks + self.stopped_ticks,
        }
