"""Production analytics, defect distribution, and throughput metrics tracking."""

from typing import Any, Dict, List


class ProductionMetrics:
    def __init__(self):
        self.total_entered: int = 0
        self.total_inspected: int = 0
        self.total_passed: int = 0
        self.total_rejected: int = 0

        self.completed_cycles: int = 0
        self.fault_count: int = 0
        self.emergency_stop_count: int = 0

        self.conveyor_running_ticks: int = 0
        self.conveyor_stopped_ticks: int = 0

        self._total_inspection_time_ms: float = 0.0
        self._total_cycle_time_ticks: int = 0

        self.defect_distribution: Dict[str, int] = {
            "missing_label": 0,
            "marking_defect": 0,
            "missing_component": 0,
            "geometry_defect": 0,
            "surface_scratch": 0,
        }

        self.throughput_history: List[Dict[str, Any]] = []

    @property
    def total_sorted(self) -> int:
        return self.total_passed + self.total_rejected

    @property
    def pass_percentage(self) -> float:
        return round((self.total_passed / self.total_sorted * 100.0), 1) if self.total_sorted > 0 else 0.0

    @property
    def reject_percentage(self) -> float:
        return round((self.total_rejected / self.total_sorted * 100.0), 1) if self.total_sorted > 0 else 0.0

    def record_entry(self) -> None:
        self.total_entered += 1

    def record_inspection(self, duration_ms: float, features: Dict[str, int]) -> None:
        self.total_inspected += 1
        self._total_inspection_time_ms += duration_ms

        # Tally defect categories
        if features.get("L", 1) == 0:
            self.defect_distribution["missing_label"] += 1
        if features.get("M", 1) == 0:
            self.defect_distribution["marking_defect"] += 1
        if features.get("C", 1) == 0:
            self.defect_distribution["missing_component"] += 1
        if features.get("D", 1) == 0 or features.get("G", 1) == 0:
            self.defect_distribution["geometry_defect"] += 1
        if features.get("S", 0) == 1:
            self.defect_distribution["surface_scratch"] += 1

    def record_sorting(self, is_pass: bool, tick: int) -> None:
        if is_pass:
            self.total_passed += 1
        else:
            self.total_rejected += 1

        if len(self.throughput_history) < 100:
            self.throughput_history.append({
                "tick": tick,
                "passed": self.total_passed,
                "rejected": self.total_rejected,
                "total": self.total_passed + self.total_rejected,
            })

    def record_completion(self, cycle_ticks: int) -> None:
        self.completed_cycles += 1
        self._total_cycle_time_ticks += cycle_ticks

    def record_fault(self) -> None:
        self.fault_count += 1

    def record_emergency_stop(self) -> None:
        self.emergency_stop_count += 1

    def record_conveyor_tick(self, is_running: bool) -> None:
        if is_running:
            self.conveyor_running_ticks += 1
        else:
            self.conveyor_stopped_ticks += 1

    def reset(self) -> None:
        self.total_entered = 0
        self.total_inspected = 0
        self.total_passed = 0
        self.total_rejected = 0
        self.completed_cycles = 0
        self.fault_count = 0
        self.emergency_stop_count = 0
        self.conveyor_running_ticks = 0
        self.conveyor_stopped_ticks = 0
        self._total_inspection_time_ms = 0.0
        self._total_cycle_time_ticks = 0
        for k in self.defect_distribution:
            self.defect_distribution[k] = 0
        self.throughput_history.clear()

    def to_dict(self, active_count: int = 0, queued_count: int = 0) -> Dict[str, Any]:
        total_sorted = self.total_passed + self.total_rejected
        pass_rate = round((self.total_passed / total_sorted * 100.0), 1) if total_sorted > 0 else 0.0
        reject_rate = round((self.total_rejected / total_sorted * 100.0), 1) if total_sorted > 0 else 0.0

        avg_insp_time = (
            round(self._total_inspection_time_ms / self.total_inspected, 1)
            if self.total_inspected > 0
            else 0.0
        )
        avg_cycle_ticks = (
            round(self._total_cycle_time_ticks / self.completed_cycles, 1)
            if self.completed_cycles > 0
            else 0.0
        )

        return {
            "total_entered": self.total_entered,
            "total_inspected": self.total_inspected,
            "total_passed": self.total_passed,
            "total_rejected": self.total_rejected,
            "total_sorted": total_sorted,
            "pass_percentage": pass_rate,
            "reject_percentage": reject_rate,
            "active_products": active_count,
            "queued_products": queued_count,
            "completed_cycles": self.completed_cycles,
            "average_inspection_time_ms": avg_insp_time,
            "average_cycle_time_ticks": avg_cycle_ticks,
            "conveyor_running_ticks": self.conveyor_running_ticks,
            "conveyor_stopped_ticks": self.conveyor_stopped_ticks,
            "fault_count": self.fault_count,
            "emergency_stop_count": self.emergency_stop_count,
            "defect_distribution": dict(self.defect_distribution),
            "throughput_history": self.throughput_history[-30:],
        }
