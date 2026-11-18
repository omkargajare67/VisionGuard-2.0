from typing import Any, Dict, List, Optional

FSM_STATES = ["IDLE", "DETECT", "CAPTURE", "DECIDE", "SORT", "RESET"]

FSM_EVENTS = [
    "PRODUCT_DETECTED",
    "SENSOR_CONFIRMED",
    "IMAGE_READY",
    "DECISION_READY",
    "SORT_COMPLETE",
    "CYCLE_CLEARED",
    "FORCE_RESET",
]

# Moore state outputs: Outputs are strictly functions of the current state
MOORE_STATE_OUTPUTS = {
    "IDLE": {
        "conveyor_motor": 1,
        "camera_trigger": 0,
        "inspection_active": 0,
        "servo_gate_actuate": 0,
        "status_code": 0b000,
        "description": "Belt moving, awaiting product arrival at optical inspection station.",
    },
    "DETECT": {
        "conveyor_motor": 0,  # Halt motor to stabilize product
        "camera_trigger": 0,
        "inspection_active": 0,
        "servo_gate_actuate": 0,
        "status_code": 0b001,
        "description": "IR photoelectric sensor tripped. Conveyor locked in stationary position.",
    },
    "CAPTURE": {
        "conveyor_motor": 0,
        "camera_trigger": 1,  # Optical strobe and shutter trigger
        "inspection_active": 0,
        "servo_gate_actuate": 0,
        "status_code": 0b010,
        "description": "Optical camera frame acquisition strobe asserted.",
    },
    "DECIDE": {
        "conveyor_motor": 0,
        "camera_trigger": 0,
        "inspection_active": 1,  # DEAM combinational Boolean logic evaluation
        "servo_gate_actuate": 0,
        "status_code": 0b011,
        "description": "OpenCV extraction & DEAM Boolean logic decision engine calculating pass/reject.",
    },
    "SORT": {
        "conveyor_motor": 0,
        "camera_trigger": 0,
        "inspection_active": 0,
        "servo_gate_actuate": 1,  # Divert flipper or allow passage
        "status_code": 0b100,
        "description": "Actuating servo deflection gate and updating bin accumulation registers.",
    },
    "RESET": {
        "conveyor_motor": 1,  # Resume belt to eject workpiece
        "camera_trigger": 0,
        "inspection_active": 0,
        "servo_gate_actuate": 0,
        "status_code": 0b101,
        "description": "Cycle cleared. Resetting transient latches and re-engaging conveyor.",
    },
}

VALID_TRANSITIONS = {
    "IDLE": {"PRODUCT_DETECTED": "DETECT"},
    "DETECT": {"SENSOR_CONFIRMED": "CAPTURE"},
    "CAPTURE": {"IMAGE_READY": "DECIDE"},
    "DECIDE": {"DECISION_READY": "SORT"},
    "SORT": {"SORT_COMPLETE": "RESET"},
    "RESET": {"CYCLE_CLEARED": "IDLE"},
}


class ProductionFSM:
    """Moore Finite State Machine orchestrating industrial inspection cycles."""

    def __init__(self, current_state: str = "IDLE", history: Optional[List[Dict[str, Any]]] = None):
        if current_state.upper() not in FSM_STATES:
            raise ValueError(f"Invalid state: '{current_state}'. Allowed: {FSM_STATES}")
        self.state = current_state.upper()
        self.history = history or []

    def trigger_event(self, event: str) -> Dict[str, Any]:
        """Process event, execute state transition if valid, or report invalid transition."""
        evt = event.upper()
        if evt not in FSM_EVENTS:
            raise ValueError(f"Unknown event: '{event}'. Allowed: {FSM_EVENTS}")

        prev_state = self.state

        # Global emergency / reset event
        if evt == "FORCE_RESET":
            self.state = "IDLE"
            record = {
                "from_state": prev_state,
                "event": evt,
                "to_state": "IDLE",
                "valid": True,
                "note": "Forced reset to initial IDLE state.",
            }
            self.history.append(record)
            return {
                "previous_state": prev_state,
                "event": evt,
                "current_state": "IDLE",
                "transition_valid": True,
                "moore_outputs": MOORE_STATE_OUTPUTS["IDLE"],
                "allowed_events": list(VALID_TRANSITIONS.get("IDLE", {}).keys()),
                "history": self.history[-10:],
            }

        # Check state transition table
        allowed_map = VALID_TRANSITIONS.get(prev_state, {})
        if evt in allowed_map:
            next_state = allowed_map[evt]
            self.state = next_state
            record = {
                "from_state": prev_state,
                "event": evt,
                "to_state": next_state,
                "valid": True,
                "note": f"Sequential step from {prev_state} to {next_state}.",
            }
            self.history.append(record)
            return {
                "previous_state": prev_state,
                "event": evt,
                "current_state": next_state,
                "transition_valid": True,
                "moore_outputs": MOORE_STATE_OUTPUTS[next_state],
                "allowed_events": list(VALID_TRANSITIONS.get(next_state, {}).keys()),
                "history": self.history[-10:],
            }
        else:
            record = {
                "from_state": prev_state,
                "event": evt,
                "to_state": prev_state,
                "valid": False,
                "note": f"Invalid transition: Event {evt} is not permitted in state {prev_state}.",
            }
            self.history.append(record)
            return {
                "previous_state": prev_state,
                "event": evt,
                "current_state": prev_state,
                "transition_valid": False,
                "error": f"Invalid transition: Event '{evt}' cannot be triggered from state '{prev_state}'. Expected: {list(allowed_map.keys())}",
                "moore_outputs": MOORE_STATE_OUTPUTS[prev_state],
                "allowed_events": list(allowed_map.keys()),
                "history": self.history[-10:],
            }

    def get_state_info(self) -> Dict[str, Any]:
        """Return full state diagnostics, outputs, and permitted transitions."""
        return {
            "current_state": self.state,
            "all_states": FSM_STATES,
            "moore_outputs": MOORE_STATE_OUTPUTS[self.state],
            "allowed_events": list(VALID_TRANSITIONS.get(self.state, {}).keys()) + ["FORCE_RESET"],
            "history": self.history[-10:],
        }
