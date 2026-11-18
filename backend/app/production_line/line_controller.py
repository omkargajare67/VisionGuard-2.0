"""Production Line FSM Controller and Dual-Mode Decision Orchestrator."""

from typing import Any, Dict, List, Optional
from backend.app.deam.inspection_decision import evaluate_inspection_decision
from backend.app.microprocessor.example_programs import EXAMPLE_PROGRAMS
from backend.app.production_line.models import ControllerMode, LineState, ProductStatus
from backend.app.production_line.product import Product
from backend.app.services.microprocessor_service import microprocessor_service


class LineController:
    # Valid FSM transition graph
    VALID_TRANSITIONS: Dict[str, List[str]] = {
        LineState.IDLE: [
            LineState.WAITING_FOR_PRODUCT,
            LineState.CONVEYOR_MOVEMENT,
            LineState.EMERGENCY_STOP,
            LineState.ERROR,
        ],
        LineState.WAITING_FOR_PRODUCT: [
            LineState.PRODUCT_DETECTED,
            LineState.IDLE,
            LineState.EMERGENCY_STOP,
            LineState.ERROR,
        ],
        LineState.PRODUCT_DETECTED: [
            LineState.POSITIONING,
            LineState.INSPECTION,
            LineState.EMERGENCY_STOP,
            LineState.ERROR,
        ],
        LineState.POSITIONING: [
            LineState.INSPECTION,
            LineState.EMERGENCY_STOP,
            LineState.ERROR,
        ],
        LineState.INSPECTION: [
            LineState.DECISION,
            LineState.EMERGENCY_STOP,
            LineState.ERROR,
        ],
        LineState.DECISION: [
            LineState.CONTROLLER_EXECUTION,
            LineState.CONVEYOR_MOVEMENT,
            LineState.EMERGENCY_STOP,
            LineState.ERROR,
        ],
        LineState.CONTROLLER_EXECUTION: [
            LineState.CONVEYOR_MOVEMENT,
            LineState.SORTING,
            LineState.EMERGENCY_STOP,
            LineState.ERROR,
        ],
        LineState.CONVEYOR_MOVEMENT: [
            LineState.POSITIONING,
            LineState.INSPECTION,
            LineState.SORTING,
            LineState.CYCLE_COMPLETE,
            LineState.IDLE,
            LineState.EMERGENCY_STOP,
            LineState.ERROR,
        ],
        LineState.SORTING: [
            LineState.CONVEYOR_MOVEMENT,
            LineState.CYCLE_COMPLETE,
            LineState.IDLE,
            LineState.EMERGENCY_STOP,
            LineState.ERROR,
        ],
        LineState.CYCLE_COMPLETE: [
            LineState.IDLE,
            LineState.WAITING_FOR_PRODUCT,
            LineState.CONVEYOR_MOVEMENT,
            LineState.EMERGENCY_STOP,
            LineState.ERROR,
        ],
        LineState.ERROR: [
            LineState.IDLE,
            LineState.EMERGENCY_STOP,
        ],
        LineState.EMERGENCY_STOP: [
            LineState.IDLE,
            LineState.ERROR,
        ],
    }

    def __init__(self, session_id: str = "default_line"):
        self.session_id: str = session_id
        self.state: str = LineState.IDLE
        self.controller_mode: str = ControllerMode.DEAM_LOGIC
        self.state_history: List[Dict[str, Any]] = []

        # Ensure dedicated 8086 session is pre-loaded with VisionGuard controller code
        self._init_8086_controller()

    def _init_8086_controller(self) -> None:
        try:
            cpu_session_id = f"prod_ctrl_{self.session_id}"
            cpu = microprocessor_service.get_or_create_session(cpu_session_id)
            cpu.reset()
            cpu.ppi.configure_for_visionguard()
            vg_prog = EXAMPLE_PROGRAMS.get("visionguard_controller", {})
            source = vg_prog.get("code", "")
            if source:
                cpu.load_assembly_program(source, base_offset=0x0000)
        except Exception:
            pass

    def set_controller_mode(self, mode: str) -> str:
        if mode in [ControllerMode.DEAM_LOGIC, ControllerMode.MICROPROCESSOR_8086]:
            self.controller_mode = mode
        return self.controller_mode

    def transition_to(
        self, new_state: str, trigger_event: str, tick: int
    ) -> bool:
        """Validate and execute state machine transition."""
        allowed = self.VALID_TRANSITIONS.get(self.state, [])
        is_valid = new_state in allowed or new_state in [LineState.EMERGENCY_STOP, LineState.ERROR]

        if is_valid:
            prev = self.state
            self.state = new_state
            if len(self.state_history) < 100:
                self.state_history.append({
                    "from_state": prev,
                    "to_state": new_state,
                    "event": trigger_event,
                    "tick": tick,
                })
            return True
        return False

    def process_decision(
        self, product: Product, features: Dict[str, int], tick: int
    ) -> Dict[str, Any]:
        """Compute sorting decision via DEAM Logic or 8086 CPU + 8255 PPI."""
        d = features.get("D", 1)
        s = features.get("S", 0)
        c = features.get("C", 1)
        l = features.get("L", 1)
        m = features.get("M", 1)
        g = features.get("G", 1)

        # 1. Always evaluate DEAM logic for ground-truth Boolean transparency
        deam_result = evaluate_inspection_decision(d=d, s=s, c=c, l=l, m=m, g=g)
        product.deam_decision = deam_result
        deam_decision_verdict = deam_result.get("decision", "REJECT")

        # 2. If controller mode is DEAM_LOGIC, verdict is directly from Boolean gates
        if self.controller_mode == ControllerMode.DEAM_LOGIC:
            product.sorting_result = deam_decision_verdict
            product.fault_reason = (
                ", ".join(deam_result.get("fault_reasons", []))
                if product.sorting_result == "REJECT"
                else None
            )
            return {
                "controller_mode": ControllerMode.DEAM_LOGIC,
                "verdict": product.sorting_result,
                "deam_decision": deam_result,
                "microprocessor_result": None,
            }

        # 3. If controller mode is MICROPROCESSOR_8086, run assembly program via PPI
        # Reset CPU state before run to ensure clean program execution in dedicated session
        cpu_session_id = f"prod_ctrl_{self.session_id}"
        cpu = microprocessor_service.get_or_create_session(cpu_session_id)
        cpu.reset()

        # Explicitly configure 8255 PPI for VisionGuard: Port A=IN, Port B=OUT (CW: 0x90)
        cpu.ppi.configure_for_visionguard()

        # Reload VisionGuard controller assembly code
        vg_code = EXAMPLE_PROGRAMS.get("visionguard_controller", {}).get("code", "")
        if vg_code:
            cpu.load_assembly_program(vg_code, base_offset=0x0000)

        # Import feature flags into 8255 PPI Port A (80H)
        port_a_val = cpu.ppi.import_vision_flags(d=d, s=s, c=c, l=l, m=m, g=g)

        # Run CPU assembly execution (executes IN AL, 80H -> TEST -> CMP -> OUT 81H, AL -> HLT)
        run_res = cpu.run(max_steps=200)

        # Confirm successful execution halt (do NOT silently fall back to DEAM result on failure)
        if not run_res.get("halted", False) or run_res.get("error"):
            err_msg = run_res.get("error") or "8086 CPU execution timed out without halting"
            product.sorting_result = None
            product.fault_reason = f"CPU_CONTROLLER_ERROR: {err_msg}"
            raise RuntimeError(f"Microprocessor controller execution failed for product {product.product_id}: {err_msg}")

        # Read sorting outputs from Port B (81H)
        port_b_val = cpu.ppi.port_b
        actuators = cpu.ppi.get_actuator_status()

        # Port B mapping:
        # PB0 = Conveyor Motor Run
        # PB1 = Reject Gate Diverter
        # PB2 = Green LED (PASS)
        # PB3 = Red LED (REJECT)
        # PB4 = Alarm Buzzer
        # PB5 = System Busy
        green_on = actuators.get("green_led", 0) == 1
        red_on = actuators.get("red_led", 0) == 1
        gate_divert = actuators.get("reject_gate", 0) == 1

        if green_on and not red_on and not gate_divert:
            verdict = "PASS"
        elif (red_on or gate_divert) and not green_on:
            verdict = "REJECT"
        else:
            product.sorting_result = None
            product.fault_reason = f"CPU_AMBIGUOUS_OUTPUT: Port B = 0x{port_b_val:02X}"
            raise RuntimeError(f"Microprocessor controller produced ambiguous Port B output (0x{port_b_val:02X}) for product {product.product_id}")

        product.sorting_result = verdict
        product.fault_reason = (
            ", ".join(deam_result.get("fault_reasons", []))
            if verdict == "REJECT"
            else None
        )

        mp_summary = {
            "session_id": self.session_id,
            "steps_executed": run_res.get("steps_executed", 0),
            "halted": run_res.get("halted", False),
            "port_a_input_hex": f"0x{port_a_val:02X}",
            "port_a_input_bin": f"{port_a_val:08b}",
            "port_b_output_hex": f"0x{port_b_val:02X}",
            "port_b_output_bin": f"{port_b_val:08b}",
            "actuators": actuators,
            "verdict": verdict,
        }
        product.microprocessor_result = mp_summary

        return {
            "controller_mode": ControllerMode.MICROPROCESSOR_8086,
            "verdict": verdict,
            "deam_decision": deam_result,
            "microprocessor_result": mp_summary,
        }

    def reset(self) -> None:
        self.state = LineState.IDLE
        self.state_history.clear()
        self._init_8086_controller()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "state": self.state,
            "controller_mode": self.controller_mode,
            "session_id": self.session_id,
        }
