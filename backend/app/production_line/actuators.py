"""Actuator subsystem for conveyor motor, pneumatic diverter, LEDs, and acoustic buzzer."""

from typing import Any, Dict


class ActuatorSubsystem:
    def __init__(self):
        self.conveyor_motor: int = 0      # 1 = RUNNING, 0 = STOPPED
        self.reject_gate: int = 0         # 0 = IDLE, 1 = DIVERTING
        self.gate_angle_degrees: float = 0.0 # 0.0 deg (PASS lane open), 45.0 deg (REJECT diverter active)
        self.green_led: int = 0           # 1 = ON, 0 = OFF
        self.red_led: int = 0             # 1 = ON, 0 = OFF
        self.alarm_buzzer: int = 0        # 1 = SOUNDING, 0 = SILENT
        self.system_busy: int = 0         # 1 = BUSY, 0 = READY

        # Actuator lane tallies
        self.pass_count: int = 0
        self.reject_count: int = 0

    def update_conveyor_state(self, running: bool) -> None:
        self.conveyor_motor = 1 if running else 0

    def set_sorting_action(self, decision: str) -> None:
        """Actuate physical sorting mechanisms based on decision verdict."""
        if decision == "PASS":
            self.reject_gate = 0
            self.gate_angle_degrees = 0.0
            self.green_led = 1
            self.red_led = 0
            self.alarm_buzzer = 0
            self.pass_count += 1
        elif decision == "REJECT":
            self.reject_gate = 1
            self.gate_angle_degrees = 45.0
            self.green_led = 0
            self.red_led = 1
            self.alarm_buzzer = 1
            self.reject_count += 1
        else:
            self.reject_gate = 0
            self.gate_angle_degrees = 0.0
            self.green_led = 0
            self.red_led = 0
            self.alarm_buzzer = 0

    def clear_transient_signals(self) -> None:
        """Return diverter gate and indicators to neutral running state."""
        self.reject_gate = 0
        self.gate_angle_degrees = 0.0
        self.alarm_buzzer = 0
        self.green_led = 0
        self.red_led = 0

    def reset(self) -> None:
        self.conveyor_motor = 0
        self.reject_gate = 0
        self.gate_angle_degrees = 0.0
        self.green_led = 0
        self.red_led = 0
        self.alarm_buzzer = 0
        self.system_busy = 0
        self.pass_count = 0
        self.reject_count = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "conveyor_motor": self.conveyor_motor,
            "reject_gate": self.reject_gate,
            "gate_angle_degrees": round(self.gate_angle_degrees, 1),
            "green_led": self.green_led,
            "red_led": self.red_led,
            "alarm_buzzer": self.alarm_buzzer,
            "system_busy": self.system_busy,
            "pass_count": self.pass_count,
            "reject_count": self.reject_count,
            "total_sorted": self.pass_count + self.reject_count,
        }
