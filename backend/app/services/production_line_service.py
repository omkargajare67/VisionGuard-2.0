"""Session orchestration service for independent virtual production line simulation sessions."""

from typing import Any, Dict, List, Optional
from backend.app.production_line.models import ControllerMode
from backend.app.production_line.simulation_engine import SimulationEngine


class ProductionLineService:
    def __init__(self):
        self._sessions: Dict[str, SimulationEngine] = {}
        # Pre-seed default session
        self.get_or_create_session("default")

    def get_or_create_session(self, session_id: str = "default") -> SimulationEngine:
        if session_id not in self._sessions:
            self._sessions[session_id] = SimulationEngine(session_id=session_id)
        return self._sessions[session_id]

    def get_session(self, session_id: str = "default") -> SimulationEngine:
        if session_id not in self._sessions:
            raise KeyError(f"Production line session '{session_id}' not found.")
        return self._sessions[session_id]

    def reset_session(self, session_id: str = "default") -> Dict[str, Any]:
        engine = self.get_or_create_session(session_id)
        engine.reset()
        return engine.get_state()

    def get_status(self) -> Dict[str, Any]:
        return {
            "status": "operational",
            "stage": 5,
            "engine": "Virtual Production Line & Automated Sorting Simulation Engine",
            "active_sessions": list(self._sessions.keys()),
            "capabilities": {
                "conveyor_kinematics": "Deterministic tick-based virtual conveyor belt",
                "sensor_network": "Photoelectric arrival, inspection stop, sorting gate, and exit sensors",
                "vision_inspection": "Integrated OpenCV 6-point classical defect detector",
                "deam_decision": "Ground-truth Boolean combinational logic fault evaluator",
                "microprocessor_controller": "Intel 8086 CPU & Intel 8255 PPI automated sorting program execution",
                "actuator_subsystem": "Pneumatic diverter servo gate, PASS/REJECT LEDs, and acoustic alarm buzzer",
                "production_analytics": "Throughput, pass/reject tallies, cycle times, and defect category Pareto tracking",
                "traceability": "Product-by-product lifecycle event log and audit trail",
            },
        }

    # -------------------------------------------------------------------------
    # Delegated Operations
    # -------------------------------------------------------------------------

    def start_line(self, session_id: str = "default") -> Dict[str, Any]:
        engine = self.get_or_create_session(session_id)
        engine.start()
        return engine.get_state()

    def stop_line(self, session_id: str = "default") -> Dict[str, Any]:
        engine = self.get_or_create_session(session_id)
        engine.stop()
        return engine.get_state()

    def pause_line(self, session_id: str = "default") -> Dict[str, Any]:
        engine = self.get_or_create_session(session_id)
        engine.pause()
        return engine.get_state()

    def resume_line(self, session_id: str = "default") -> Dict[str, Any]:
        engine = self.get_or_create_session(session_id)
        engine.resume()
        return engine.get_state()

    def emergency_stop(self, session_id: str = "default") -> Dict[str, Any]:
        engine = self.get_or_create_session(session_id)
        engine.emergency_stop()
        return engine.get_state()

    def clear_emergency(self, session_id: str = "default") -> Dict[str, Any]:
        engine = self.get_or_create_session(session_id)
        engine.clear_emergency()
        return engine.get_state()

    def tick_simulation(
        self, session_id: str = "default", steps: int = 1
    ) -> Dict[str, Any]:
        engine = self.get_or_create_session(session_id)
        return engine.tick(steps=steps)

    def set_speed(
        self, session_id: str = "default", speed: float = 5.0
    ) -> Dict[str, Any]:
        engine = self.get_or_create_session(session_id)
        engine.set_speed(speed)
        return engine.get_state()

    def add_product(
        self,
        session_id: str = "default",
        name: str = "Electronic Control Module",
        sample_id: Optional[str] = "VG-001",
        custom_image_base64: Optional[str] = None,
    ) -> Dict[str, Any]:
        engine = self.get_or_create_session(session_id)
        product = engine.add_product(
            name=name,
            sample_id=sample_id,
            custom_image_base64=custom_image_base64,
        )
        return {
            "product": product.to_dict(),
            "simulation_state": engine.get_state(),
        }

    def add_batch_demo(self, session_id: str = "default") -> Dict[str, Any]:
        engine = self.get_or_create_session(session_id)
        products = engine.add_batch_demo()
        return {
            "queued_products": [p.to_dict() for p in products],
            "count": len(products),
            "simulation_state": engine.get_state(),
        }

    def remove_product(
        self, session_id: str = "default", product_id: str = ""
    ) -> Dict[str, Any]:
        engine = self.get_or_create_session(session_id)
        removed = engine.remove_queued_product(product_id)
        return {
            "removed": removed,
            "product_id": product_id,
            "simulation_state": engine.get_state(),
        }

    def set_controller_mode(
        self, session_id: str = "default", mode: str = ControllerMode.DEAM_LOGIC
    ) -> Dict[str, Any]:
        engine = self.get_or_create_session(session_id)
        engine.set_controller_mode(mode)
        return engine.get_state()

    def inject_fault(
        self, session_id: str = "default", fault_type: str = "CONVEYOR_JAM"
    ) -> Dict[str, Any]:
        engine = self.get_or_create_session(session_id)
        engine.inject_fault(fault_type)
        return engine.get_state()

    def clear_fault(self, session_id: str = "default") -> Dict[str, Any]:
        engine = self.get_or_create_session(session_id)
        engine.clear_fault()
        return engine.get_state()


production_line_service = ProductionLineService()
