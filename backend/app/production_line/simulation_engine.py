"""Production Line Simulation Engine orchestrating conveyor, sensors, inspection, sorting, and controller."""

from typing import Any, Dict, List, Optional
import uuid

from backend.app.production_line.actuators import ActuatorSubsystem
from backend.app.production_line.conveyor import VirtualConveyor
from backend.app.production_line.event_manager import EventManager
from backend.app.production_line.inspection_station import InspectionStation
from backend.app.production_line.line_controller import LineController
from backend.app.production_line.models import (
    ControllerMode,
    EventType,
    LineState,
    ProductStatus,
    StationPositions,
)
from backend.app.production_line.product import Product
from backend.app.production_line.production_metrics import ProductionMetrics
from backend.app.production_line.sensors import SensorNetwork
from backend.app.production_line.sorting_station import SortingStation


class SimulationEngine:
    def __init__(self, session_id: str = "default_line"):
        self.session_id: str = session_id
        self.simulation_tick: int = 0
        self.positions = StationPositions()

        # Core subsystems
        self.conveyor = VirtualConveyor(speed=5.0, length=self.positions.LINE_END)
        self.sensors = SensorNetwork(positions=self.positions)
        self.inspection_station = InspectionStation(position=self.positions.INSPECTION_STATION)
        self.sorting_station = SortingStation(position=self.positions.SORTING_STATION)
        self.actuators = ActuatorSubsystem()
        self.line_controller = LineController(session_id=f"{session_id}_8086")
        self.event_manager = EventManager(max_history=500)
        self.metrics = ProductionMetrics()

        # Product queues
        self.queue: List[Product] = []
        self.active_products: List[Product] = []
        self.completed_products: List[Product] = []

        # Fault management
        self.active_fault: Optional[str] = None
        self.fault_tick: Optional[int] = None
        self._product_counter: int = 0

    def add_product(
        self,
        name: str = "Electronic Control Module",
        sample_id: Optional[str] = "VG-001",
        custom_image_base64: Optional[str] = None,
    ) -> Product:
        """Enqueue a new product for processing."""
        self._product_counter += 1
        product_id = f"P-{self._product_counter:03d}"
        display_name = f"{name} ({sample_id})" if sample_id else name

        product = Product(
            product_id=product_id,
            name=display_name,
            sample_id=sample_id,
            custom_image_base64=custom_image_base64,
            created_tick=self.simulation_tick,
        )
        self.queue.append(product)

        self.event_manager.record(
            event_type=EventType.PRODUCT_QUEUED,
            description=f"Product {product_id} ({display_name}) added to entry queue.",
            simulation_tick=self.simulation_tick,
            product_id=product_id,
            station="ENTRY_QUEUE",
            state=self.line_controller.state,
        )

        return product

    def add_batch_demo(self) -> List[Product]:
        """Enqueue all 6 standardized synthetic sample products (VG-001 to VG-006)."""
        demo_samples = [
            ("VG-001", "Nominal Product (PASS)"),
            ("VG-002", "Missing Label Defect (REJECT)"),
            ("VG-003", "Incorrect Marking Colour (REJECT)"),
            ("VG-004", "Missing Component Defect (REJECT)"),
            ("VG-005", "Contour Geometry Defect (REJECT)"),
            ("VG-006", "Surface Scratch Defect (REJECT)"),
        ]
        created = []
        for sid, label in demo_samples:
            p = self.add_product(name=label, sample_id=sid)
            created.append(p)
        return created

    def remove_queued_product(self, product_id: str) -> bool:
        """Remove a product from the entry queue if not yet on the conveyor."""
        for i, prod in enumerate(self.queue):
            if prod.product_id == product_id:
                self.queue.pop(i)
                return True
        return False

    def start(self) -> bool:
        if self.active_fault or self.conveyor.emergency_stopped:
            return False
        started = self.conveyor.start()
        if started:
            self.actuators.update_conveyor_state(True)
            self.line_controller.transition_to(
                LineState.CONVEYOR_MOVEMENT,
                "CONVEYOR_START",
                self.simulation_tick,
            )
            self.event_manager.record(
                event_type=EventType.CONVEYOR_STARTED,
                description="Conveyor motor started.",
                simulation_tick=self.simulation_tick,
                state=self.line_controller.state,
            )
        return started

    def stop(self) -> None:
        self.conveyor.stop()
        self.actuators.update_conveyor_state(False)
        self.line_controller.transition_to(
            LineState.IDLE,
            "CONVEYOR_STOP",
            self.simulation_tick,
        )
        self.event_manager.record(
            event_type=EventType.CONVEYOR_STOPPED,
            description="Conveyor motor stopped.",
            simulation_tick=self.simulation_tick,
            state=self.line_controller.state,
        )

    def pause(self) -> None:
        self.conveyor.pause()
        self.actuators.update_conveyor_state(False)
        self.event_manager.record(
            event_type=EventType.CONVEYOR_PAUSED,
            description="Conveyor paused.",
            simulation_tick=self.simulation_tick,
            state=self.line_controller.state,
        )

    def resume(self) -> bool:
        if self.active_fault or self.conveyor.emergency_stopped:
            return False
        res = self.conveyor.resume()
        if res:
            self.actuators.update_conveyor_state(True)
            self.event_manager.record(
                event_type=EventType.CONVEYOR_RESUMED,
                description="Conveyor resumed.",
                simulation_tick=self.simulation_tick,
                state=self.line_controller.state,
            )
        return res

    def set_speed(self, speed: float) -> float:
        return self.conveyor.set_speed(speed)

    def emergency_stop(self) -> None:
        self.conveyor.emergency_stop()
        self.actuators.update_conveyor_state(False)
        self.line_controller.transition_to(
            LineState.EMERGENCY_STOP,
            "EMERGENCY_STOP_BUTTON_PRESSED",
            self.simulation_tick,
        )
        self.metrics.record_emergency_stop()
        self.event_manager.record(
            event_type=EventType.EMERGENCY_STOP,
            description="EMERGENCY STOP ACTIVATED! All motor lines de-energized.",
            simulation_tick=self.simulation_tick,
            state=LineState.EMERGENCY_STOP,
        )

    def clear_emergency(self) -> None:
        self.conveyor.clear_emergency()
        self.line_controller.transition_to(
            LineState.IDLE,
            "EMERGENCY_STOP_CLEARED",
            self.simulation_tick,
        )
        self.event_manager.record(
            event_type=EventType.EMERGENCY_RESET,
            description="Emergency stop cleared. System returned to IDLE (operator must restart conveyor).",
            simulation_tick=self.simulation_tick,
            state=LineState.IDLE,
        )

    def inject_fault(self, fault_type: str) -> None:
        self.active_fault = fault_type
        self.fault_tick = self.simulation_tick
        self.conveyor.stop()
        self.actuators.update_conveyor_state(False)
        self.line_controller.transition_to(
            LineState.ERROR,
            f"FAULT_INJECTED_{fault_type}",
            self.simulation_tick,
        )
        self.metrics.record_fault()
        self.event_manager.record(
            event_type=EventType.FAULT_INJECTED,
            description=f"System Fault injected: {fault_type}",
            simulation_tick=self.simulation_tick,
            state=LineState.ERROR,
            data={"fault": fault_type},
        )

    def clear_fault(self) -> None:
        old_fault = self.active_fault
        self.active_fault = None
        self.fault_tick = None
        self.line_controller.transition_to(
            LineState.IDLE,
            "FAULT_CLEARED",
            self.simulation_tick,
        )
        self.event_manager.record(
            event_type=EventType.FAULT_CLEARED,
            description=f"Fault {old_fault} cleared. Conveyor remains stopped until explicitly started.",
            simulation_tick=self.simulation_tick,
            state=LineState.IDLE,
        )

    def set_controller_mode(self, mode: str) -> str:
        return self.line_controller.set_controller_mode(mode)

    # -------------------------------------------------------------------------
    # Core Deterministic Simulation Tick
    # -------------------------------------------------------------------------

    def tick(self, steps: int = 1) -> Dict[str, Any]:
        """Advance the simulation by 'steps' deterministic ticks."""
        for _ in range(max(1, steps)):
            self._single_tick()
        return self.get_state()

    def _single_tick(self) -> None:
        self.simulation_tick += 1

        # Record motor run/stop metrics
        is_moving = self.conveyor.running and not self.conveyor.paused and not self.conveyor.emergency_stopped
        self.metrics.record_conveyor_tick(is_moving)

        if self.conveyor.emergency_stopped or self.active_fault:
            return

        # 1. Spawn queued product if conveyor is running and entry zone is clear
        if self.queue and len(self.active_products) < self.conveyor.capacity:
            # Check collision: no product within [0, 18] on conveyor
            entry_blocked = any(p.position < 18.0 for p in self.active_products)
            if not entry_blocked:
                prod = self.queue.pop(0)
                prod.position = 0.0
                prod.entry_tick = self.simulation_tick
                prod.transition_to(ProductStatus.ON_CONVEYOR)
                self.active_products.append(prod)
                self.metrics.record_entry()

                self.event_manager.record(
                    event_type=EventType.PRODUCT_ENTERED,
                    description=f"Product {prod.product_id} entered the conveyor belt.",
                    simulation_tick=self.simulation_tick,
                    product_id=prod.product_id,
                    station="ENTRY",
                    state=self.line_controller.state,
                )

        # 2. Advance conveyor movement with collision prevention and station interlocking
        delta = self.conveyor.advance_tick(self.simulation_tick)
        if delta > 0.0:
            # Sort products descending by position so lead products move first
            sorted_products = sorted(self.active_products, key=lambda p: p.position, reverse=True)
            min_spacing = 10.0

            # Identify if inspection station is occupied
            station_occupied = any(
                p.status in [ProductStatus.INSPECTING, ProductStatus.WAITING_FOR_INSPECTION]
                for p in self.active_products
            )

            for i, prod in enumerate(sorted_products):
                # Workpieces being actively inspected do not advance
                if prod.status in [ProductStatus.INSPECTING, ProductStatus.WAITING_FOR_INSPECTION]:
                    continue

                new_pos = prod.position + delta

                # Collision prevention with lead product ahead
                if i > 0:
                    lead_prod = sorted_products[i - 1]
                    new_pos = min(new_pos, lead_prod.position - min_spacing)

                # Prevent trailing products from entering an occupied inspection station
                if station_occupied and prod.position < self.positions.INSPECTION_STATION:
                    new_pos = min(new_pos, self.positions.INSPECTION_STATION - min_spacing)

                prod.position = max(prod.position, min(self.positions.LINE_END, new_pos))

        # 3. Sensor evaluations
        sensor_events = self.sensors.update_all(self.active_products, self.simulation_tick)
        for sev in sensor_events:
            self.event_manager.record(
                event_type=EventType.SENSOR_TRIPPED,
                description=f"Sensor {sev['name']} activated by {sev['product_id']} at pos {sev['position']}",
                simulation_tick=self.simulation_tick,
                product_id=sev["product_id"],
                station=sev["name"],
                state=self.line_controller.state,
            )

        # 4. Product State Updates along the line
        for prod in list(self.active_products):
            # Station A: IR Sensor 1 (Product Arrival)
            if 9.0 <= prod.position <= 20.0 and prod.status == ProductStatus.ON_CONVEYOR:
                prod.transition_to(ProductStatus.DETECTED)
                self.line_controller.transition_to(
                    LineState.PRODUCT_DETECTED,
                    "IR1_PRODUCT_DETECTED",
                    self.simulation_tick,
                )

            # Station B: Inspection Station (Position 30)
            # When product reaches ~30 and hasn't been inspected:
            if prod.position >= self.positions.INSPECTION_STATION and prod.inspection_result is None:
                # Snap exactly to inspection position and hold
                prod.position = self.positions.INSPECTION_STATION
                prod.transition_to(ProductStatus.INSPECTING)
                prod.inspection_tick = self.simulation_tick

                # FSM -> INSPECTION
                self.line_controller.transition_to(
                    LineState.INSPECTION,
                    "REACHED_INSPECTION_STATION",
                    self.simulation_tick,
                )

                self.event_manager.record(
                    event_type=EventType.INSPECTION_STARTED,
                    description=f"Product {prod.product_id} aligned at Inspection Station. Triggering camera capture.",
                    simulation_tick=self.simulation_tick,
                    product_id=prod.product_id,
                    station="INSPECTION_STATION",
                    state=LineState.INSPECTION,
                )

                try:
                    # Execute actual OpenCV inspection!
                    features = self.inspection_station.execute_inspection(prod)
                    self.metrics.record_inspection(
                        self.inspection_station.last_inspection_time_ms, features
                    )

                    self.event_manager.record(
                        event_type=EventType.INSPECTION_COMPLETED,
                        description=f"Inspection complete for {prod.product_id}. Flags: D={features['D']}, S={features['S']}, C={features['C']}, L={features['L']}, M={features['M']}, G={features['G']}",
                        simulation_tick=self.simulation_tick,
                        product_id=prod.product_id,
                        station="INSPECTION_STATION",
                        state=LineState.INSPECTION,
                        data={"features": features},
                    )

                    # Process decision via DEAM Logic or 8086 + 8255 PPI
                    self.line_controller.transition_to(
                        LineState.DECISION,
                        "EVALUATING_QUALITY_DECISION",
                        self.simulation_tick,
                    )
                    decision_info = self.line_controller.process_decision(
                        prod, features, self.simulation_tick
                    )

                    prod.transition_to(ProductStatus.READY_FOR_SORTING)
                    self.line_controller.transition_to(
                        LineState.CONVEYOR_MOVEMENT,
                        "DECISION_COMPLETE_RESUME_MOVEMENT",
                        self.simulation_tick,
                    )

                    self.event_manager.record(
                        event_type=EventType.DEAM_DECISION_GENERATED,
                        description=f"Controller verdict for {prod.product_id}: {decision_info['verdict']} (via {decision_info['controller_mode']})",
                        simulation_tick=self.simulation_tick,
                        product_id=prod.product_id,
                        station="CONTROLLER",
                        controller_mode=decision_info["controller_mode"],
                        state=LineState.CONVEYOR_MOVEMENT,
                        data=decision_info,
                    )
                except Exception as e:
                    # Inspection or Controller failure must be treated as a production fault, NOT a quality rejection!
                    self.active_fault = f"INSPECTION_FAILURE: {str(e)}"
                    self.fault_tick = self.simulation_tick
                    self.conveyor.stop()
                    self.actuators.update_conveyor_state(False)
                    self.line_controller.transition_to(
                        LineState.ERROR,
                        f"FAULT_{prod.product_id}",
                        self.simulation_tick,
                    )
                    self.metrics.record_fault()
                    self.event_manager.record(
                        event_type=EventType.FAULT_INJECTED,
                        description=f"Inspection/Controller failure on product {prod.product_id}: {str(e)}",
                        simulation_tick=self.simulation_tick,
                        product_id=prod.product_id,
                        station="INSPECTION_STATION",
                        state=LineState.ERROR,
                        data={"error": str(e)},
                    )
                    return

            # Station C: Sorting Station (Position 70)
            if prod.position >= self.positions.SORTING_STATION and prod.lane is None:
                if prod.sorting_result not in ["PASS", "REJECT"]:
                    # Cannot sort without valid decision!
                    self.active_fault = f"UNINSPECTED_ROUTING_FAULT: Product {prod.product_id} reached sorting without verified decision"
                    self.fault_tick = self.simulation_tick
                    self.conveyor.stop()
                    self.actuators.update_conveyor_state(False)
                    self.line_controller.transition_to(
                        LineState.ERROR,
                        "INVALID_SORTING_STATE",
                        self.simulation_tick,
                    )
                    self.metrics.record_fault()
                    self.event_manager.record(
                        event_type=EventType.FAULT_INJECTED,
                        description=f"System interlock: Product {prod.product_id} reached sorting without verified decision.",
                        simulation_tick=self.simulation_tick,
                        product_id=prod.product_id,
                        station="SORTING_STATION",
                        state=LineState.ERROR,
                    )
                    return

                self.line_controller.transition_to(
                    LineState.SORTING,
                    "REACHED_SORTING_STATION",
                    self.simulation_tick,
                )

                # Route product and actuate diverter/LEDs/buzzer
                sort_result = self.sorting_station.route_product(prod, self.actuators)
                is_pass = prod.sorting_result == "PASS"
                self.metrics.record_sorting(is_pass, self.simulation_tick)

                self.event_manager.record(
                    event_type=EventType.PRODUCT_SORTED,
                    description=f"Product {prod.product_id} sorted into {prod.lane} (Gate: {'DIVERTING' if sort_result['diverter_active'] else 'IDLE'}).",
                    simulation_tick=self.simulation_tick,
                    product_id=prod.product_id,
                    station="SORTING_STATION",
                    state=LineState.SORTING,
                    data=sort_result,
                )

            # Station D: Exit Station (Position 90+)
            if prod.position >= self.positions.EXIT_SENSOR and not prod.is_completed:
                cycle_ticks = (
                    (self.simulation_tick - prod.entry_tick)
                    if prod.entry_tick is not None
                    else 1
                )
                prod.mark_completed(self.simulation_tick)
                self.metrics.record_completion(cycle_ticks)

                # Move from active to completed list
                self.active_products.remove(prod)
                self.completed_products.append(prod)

                # Reset sorting actuators if no other product is at the sorting gate
                if not any(
                    abs(p.position - self.positions.SORTING_STATION) <= 5.0
                    for p in self.active_products
                ):
                    self.actuators.clear_transient_signals()

                self.line_controller.transition_to(
                    LineState.CYCLE_COMPLETE,
                    "PRODUCT_EXITED_LINE",
                    self.simulation_tick,
                )

                self.event_manager.record(
                    event_type=EventType.PRODUCT_EXITED,
                    description=f"Product {prod.product_id} successfully exited the line. Cycle complete in {cycle_ticks} ticks.",
                    simulation_tick=self.simulation_tick,
                    product_id=prod.product_id,
                    station="EXIT",
                    state=LineState.CYCLE_COMPLETE,
                )

        # 5. Return to IDLE or WAITING if no active products remain
        if not self.active_products and self.line_controller.state in [
            LineState.CYCLE_COMPLETE,
            LineState.CONVEYOR_MOVEMENT,
        ]:
            next_state = (
                LineState.WAITING_FOR_PRODUCT if self.queue else LineState.IDLE
            )
            self.line_controller.transition_to(
                next_state, "NO_ACTIVE_PRODUCTS", self.simulation_tick
            )

    # -------------------------------------------------------------------------
    # State Serializer & Reset
    # -------------------------------------------------------------------------

    def reset(self) -> None:
        """Reset all simulation subsystems to power-on defaults."""
        self.simulation_tick = 0
        self.active_fault = None
        self.fault_tick = None
        self._product_counter = 0

        self.conveyor.reset()
        self.sensors.reset()
        self.inspection_station.reset()
        self.sorting_station.reset()
        self.actuators.reset()
        self.line_controller.reset()
        self.event_manager.clear()
        self.metrics.reset()

        self.queue.clear()
        self.active_products.clear()
        self.completed_products.clear()

    def get_state(self) -> Dict[str, Any]:
        """Return rich, complete state snapshot of the virtual production line conforming to contract."""
        fault_state = {
            "has_fault": self.active_fault is not None or self.line_controller.state == LineState.ERROR,
            "description": self.active_fault,
            "fault_tick": self.fault_tick,
        }

        return {
            "session_id": self.session_id,
            "simulation_tick": self.simulation_tick,
            "line_state": self.line_controller.state,
            "controller_mode": self.line_controller.controller_mode,
            "conveyor": self.conveyor.to_dict(),
            "fault_state": fault_state,
            "active_fault": self.active_fault,
            "sensors": self.sensors.to_dict(),
            "inspection_station": self.inspection_station.to_dict(),
            "sorting_station": self.sorting_station.to_dict(),
            "actuators": self.actuators.to_dict(),
            "line_controller": self.line_controller.to_dict(),
            "metrics": self.metrics.to_dict(
                active_count=len(self.active_products),
                queued_count=len(self.queue),
            ),
            "station_positions": {
                "ENTRY": self.positions.PRODUCT_ENTRY,
                "SENSOR_IR1": self.positions.IR_SENSOR_1,
                "INSPECTION": self.positions.INSPECTION_STATION,
                "SENSOR_IR2": self.positions.INSPECTION_STATION,
                "SENSOR_IR3": self.positions.SORTING_STATION,
                "SORTING_GATE": self.positions.SORTING_STATION,
                "EXIT_SENSOR": self.positions.EXIT_SENSOR,
                "EXIT": self.positions.LINE_END,
                "entry": self.positions.PRODUCT_ENTRY,
                "ir_sensor_1": self.positions.IR_SENSOR_1,
                "inspection_station": self.positions.INSPECTION_STATION,
                "sorting_station": self.positions.SORTING_STATION,
                "exit_sensor": self.positions.EXIT_SENSOR,
                "line_end": self.positions.LINE_END,
            },
            "queue": [p.to_dict() for p in self.queue],
            "active_products": [p.to_dict() for p in self.active_products],
            "completed_products": [p.to_dict() for p in reversed(self.completed_products[-50:])],
            "recent_events": self.event_manager.get_events(limit=40),
        }
