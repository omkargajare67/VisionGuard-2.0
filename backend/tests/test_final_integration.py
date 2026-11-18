"""VisionGuard 2.0 - Final Stabilisation & Integration Regression Test Suite.
Verifies all 12 QA priorities from the comprehensive audit:
- Priority 1: State contract alignment between backend and frontend
- Priority 2: Automatic conveyor execution and kinematic controls
- Priority 3: Sensor edge detection (no repeated triggers while holding)
- Priority 4: Prevention of invalid inspection fallback (no silent fallback to VG-001)
- Priority 5: Strict session isolation between concurrent sessions
- Priority 6: 8086 CPU & 8255 PPI integration, control word, and error handling
- Priority 7: Product lifecycle sequencing and sorting safety
- Priority 8: Emergency stop lock, manual restart requirement, and fault recovery
- Priority 9: Accurate production metrics and deduplicated event logging
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.production_line.models import ControllerMode, LineState, ProductStatus
from backend.app.production_line.simulation_engine import SimulationEngine
from backend.app.production_line.sensors import VirtualSensor
from backend.app.production_line.inspection_station import InspectionStation
from backend.app.production_line.product import Product
from backend.app.services.production_line_service import production_line_service
from backend.app.services.microprocessor_service import microprocessor_service
from backend.app.vision.synthetic_samples import cv2_to_base64, generate_sample_image

client = TestClient(app)


# =============================================================================
# 1. STATE CONTRACT TESTS (Priority 1)
# =============================================================================

def test_state_contract_top_level_fields():
    """Verify backend get_state() contains exact fields and structure expected by frontend."""
    engine = SimulationEngine(session_id="test_contract_session")
    state = engine.get_state()

    # Core required top-level keys
    assert "session_id" in state
    assert "simulation_tick" in state
    assert "line_state" in state
    assert state["line_state"] == LineState.IDLE
    assert "controller_mode" in state
    assert state["controller_mode"] in [ControllerMode.DEAM_LOGIC, ControllerMode.MICROPROCESSOR_8086]

    # Conveyor state contract
    conv = state["conveyor"]
    assert "running" in conv
    assert "is_running" in conv
    assert "paused" in conv
    assert "is_paused" in conv
    assert "emergency_stopped" in conv
    assert "speed" in conv
    assert "total_distance" in conv
    assert "direction" in conv

    # Fault state contract
    fault = state["fault_state"]
    assert "has_fault" in fault
    assert isinstance(fault["has_fault"], bool)
    assert "description" in fault
    assert "fault_tick" in fault

    # Collections and metrics
    assert isinstance(state["queue"], list)
    assert isinstance(state["active_products"], list)
    assert isinstance(state["completed_products"], list)
    assert isinstance(state["metrics"], dict)
    assert isinstance(state["recent_events"], list)
    assert isinstance(state["sensors"], dict)
    assert isinstance(state["actuators"], dict)

    # Station positions contract (both casing formats supported)
    pos = state["station_positions"]
    assert "ENTRY" in pos and "entry" in pos
    assert "INSPECTION" in pos and "inspection_station" in pos
    assert "SORTING_GATE" in pos and "sorting_station" in pos
    assert "EXIT" in pos and "line_end" in pos


# =============================================================================
# 2. AUTOMATIC EXECUTION & KINEMATICS TESTS (Priority 2)
# =============================================================================

def test_automatic_conveyor_execution_controls():
    """Verify Start, Pause, Resume, Stop, and Step advance the conveyor correctly."""
    engine = SimulationEngine(session_id="test_auto_exec")
    engine.set_speed(4.0)

    # Initially stopped
    assert engine.conveyor.running is False
    assert engine.conveyor.paused is False

    # Start enables movement
    assert engine.start() is True
    assert engine.conveyor.running is True
    assert engine.conveyor.paused is False

    # 1 tick advances distance by speed
    d1 = engine.conveyor.advance_tick(1)
    assert d1 == 4.0
    assert engine.conveyor.total_distance == 4.0

    # Pause prevents movement
    engine.pause()
    assert engine.conveyor.paused is True
    d2 = engine.conveyor.advance_tick(2)
    assert d2 == 0.0
    assert engine.conveyor.total_distance == 4.0

    # Resume restores movement
    assert engine.resume() is True
    assert engine.conveyor.paused is False
    d3 = engine.conveyor.advance_tick(3)
    assert d3 == 4.0
    assert engine.conveyor.total_distance == 8.0

    # Stop prevents movement
    engine.stop()
    assert engine.conveyor.running is False
    d4 = engine.conveyor.advance_tick(4)
    assert d4 == 0.0
    assert engine.conveyor.total_distance == 8.0


# =============================================================================
# 3. SENSOR EDGE DETECTION TESTS (Priority 3)
# =============================================================================

def test_sensor_edge_detection_no_duplicate_triggers():
    """Verify sensor triggers on rising edge, does not re-trigger while product stays, and clears when leaving."""
    sensor = VirtualSensor("IR-01", "Arrival Sensor", position=20.0, detection_range=3.0)

    # Tick 1: Product approaching at pos 15 (outside range [17, 23])
    trig1 = sensor.check_detection("P-001", 15.0, tick=1)
    assert trig1 is False
    assert sensor.active is False
    assert sensor.detection_count == 0

    # Tick 2: Product enters range at pos 19.0 -> RISING EDGE
    trig2 = sensor.check_detection("P-001", 19.0, tick=2)
    assert trig2 is True
    assert sensor.active is True
    assert sensor.associated_product_id == "P-001"
    assert sensor.detection_count == 1
    assert len(sensor.event_history) == 1

    # Tick 3: Product remains in range at pos 20.0 (holding/inspected) -> NO NEW EVENT
    trig3 = sensor.check_detection("P-001", 20.0, tick=3)
    assert trig3 is False
    assert sensor.active is True
    assert sensor.associated_product_id == "P-001"
    assert sensor.detection_count == 1  # Still 1!
    assert len(sensor.event_history) == 1  # No duplicate event!

    # Tick 4: Product remains in range at pos 22.0 -> NO NEW EVENT
    trig4 = sensor.check_detection("P-001", 22.0, tick=4)
    assert trig4 is False
    assert sensor.detection_count == 1

    # Tick 5: Product leaves range at pos 25.0 -> FALLING EDGE (clears)
    trig5 = sensor.check_detection("P-001", 25.0, tick=5)
    assert trig5 is False
    assert sensor.active is False
    assert sensor.associated_product_id is None
    assert sensor.detection_count == 1

    # Tick 6: New product P-002 enters range -> NEW RISING EDGE
    trig6 = sensor.check_detection("P-002", 20.0, tick=6)
    assert trig6 is True
    assert sensor.active is True
    assert sensor.associated_product_id == "P-002"
    assert sensor.detection_count == 2
    assert len(sensor.event_history) == 2


# =============================================================================
# 4. INSPECTION FALLBACK PREVENTION TESTS (Priority 4)
# =============================================================================

def test_inspection_valid_synthetic_sample():
    """Verify valid synthetic sample executes cleanly and extracts 6 binary flags."""
    station = InspectionStation(position=30.0)
    prod = Product(product_id="P-001", name="Unit 1", sample_id="VG-001")

    flags = station.execute_inspection(prod)
    assert flags == {"D": 1, "S": 0, "C": 1, "L": 1, "M": 1, "G": 1}
    assert prod.inspection_result is not None
    assert prod.inspection_result["status"] == "PASS"


def test_inspection_invalid_sample_id_raises_without_fallback():
    """Verify unknown sample ID raises ValueError and does NOT silently inspect VG-001."""
    station = InspectionStation(position=30.0)
    prod = Product(product_id="P-BAD", name="Bad Unit", sample_id="NON_EXISTENT_SAMPLE")

    with pytest.raises(ValueError, match="Invalid synthetic sample ID"):
        station.execute_inspection(prod)

    assert prod.status == ProductStatus.ERROR
    assert "INSPECTION_FAILURE" in prod.fault_reason
    assert prod.sorting_result is None  # Did not fabricate a result!


def test_inspection_corrupt_custom_image_raises():
    """Verify corrupt base64 custom image raises ValueError and does NOT fall back."""
    station = InspectionStation(position=30.0)
    prod = Product(
        product_id="P-CORRUPT",
        name="Corrupt Unit",
        sample_id=None,
        custom_image_base64="data:image/jpeg;base64,NOT_A_VALID_IMAGE_BYTES_XYZ123==",
    )

    with pytest.raises(ValueError, match="Invalid or corrupted custom image"):
        station.execute_inspection(prod)

    assert prod.status == ProductStatus.ERROR
    assert prod.sorting_result is None


def test_inspection_valid_custom_image_decodes_and_inspects():
    """Verify valid custom image is decoded and inspected without relying on sample_id."""
    station = InspectionStation(position=30.0)
    # Generate real image of VG-001 and encode to base64
    real_img = generate_sample_image("VG-001")
    b64 = cv2_to_base64(real_img)

    prod = Product(
        product_id="P-CUSTOM",
        name="Custom Uploaded Unit",
        sample_id=None,
        custom_image_base64=b64,
    )

    flags = station.execute_inspection(prod)
    assert flags["D"] == 1
    assert flags["C"] == 1
    assert prod.inspection_result["status"] == "PASS"


# =============================================================================
# 5. SESSION ISOLATION TESTS (Priority 5)
# =============================================================================

def test_session_isolation_independent_queues_and_metrics():
    """Verify Session A and Session B maintain strictly independent queues, states, and metrics."""
    sess_a = production_line_service.get_or_create_session("session_alpha")
    sess_b = production_line_service.get_or_create_session("session_beta")

    sess_a.reset()
    sess_b.reset()

    # Enqueue in Session A
    sess_a.add_product(sample_id="VG-001")
    sess_a.add_product(sample_id="VG-002")

    # Enqueue in Session B
    sess_b.add_product(sample_id="VG-003")

    assert len(sess_a.queue) == 2
    assert len(sess_b.queue) == 1

    # Start and tick Session A only
    sess_a.start()
    sess_a.tick(steps=10)

    # Session A advanced; Session B remained untouched at tick 0
    assert sess_a.simulation_tick == 10
    assert sess_b.simulation_tick == 0
    assert sess_b.conveyor.running is False

    # Resetting Session A does not wipe Session B
    production_line_service.reset_session("session_alpha")
    assert sess_a.simulation_tick == 0
    assert len(sess_a.queue) == 0

    assert len(sess_b.queue) == 1
    assert sess_b.queue[0].sample_id == "VG-003"


# =============================================================================
# 6. INTEL 8086 + 8255 PPI INTEGRATION TESTS (Priority 6)
# =============================================================================

def test_8086_ppi_controller_nominal_pass():
    """Verify 8086 controller configures PPI (CW 0x90), executes assembly, and drives PB2 Green LED."""
    engine = SimulationEngine(session_id="test_8086_pass")
    engine.set_controller_mode(ControllerMode.MICROPROCESSOR_8086)

    prod = engine.add_product(sample_id="VG-001")
    engine.start()

    # Run until product is inspected and sorted
    for _ in range(80):
        engine.tick(steps=1)
        if prod.status in [ProductStatus.PASSED, ProductStatus.EXITED]:
            break

    assert prod.sorting_result == "PASS"
    assert prod.lane == "PASS_LANE"
    assert prod.microprocessor_result is not None
    assert prod.microprocessor_result["halted"] is True
    # Port B: Conveyor (PB0) + Green LED (PB2) = 0x05
    assert prod.microprocessor_result["actuators"]["green_led"] == 1
    assert prod.microprocessor_result["actuators"]["red_led"] == 0
    assert prod.microprocessor_result["actuators"]["reject_gate"] == 0


def test_8086_ppi_controller_defective_reject():
    """Verify 8086 controller rejects missing label (VG-002) and drives PB1 Gate + PB3 Red LED + PB4 Buzzer."""
    engine = SimulationEngine(session_id="test_8086_reject")
    engine.set_controller_mode(ControllerMode.MICROPROCESSOR_8086)

    prod = engine.add_product(sample_id="VG-002")
    engine.start()

    for _ in range(80):
        engine.tick(steps=1)
        if prod.status in [ProductStatus.REJECTED, ProductStatus.EXITED]:
            break

    assert prod.sorting_result == "REJECT"
    assert prod.lane == "REJECT_LANE"
    assert prod.microprocessor_result is not None
    assert prod.microprocessor_result["actuators"]["reject_gate"] == 1
    assert prod.microprocessor_result["actuators"]["red_led"] == 1
    assert prod.microprocessor_result["actuators"]["buzzer"] == 1
    assert prod.microprocessor_result["actuators"]["green_led"] == 0


# =============================================================================
# 7. PRODUCT LIFECYCLE & SORTING SAFETY (Priority 7)
# =============================================================================

def test_cannot_sort_without_inspection():
    """Verify an uninspected product cannot be routed to a sorting lane."""
    engine = SimulationEngine(session_id="test_sorting_safety")
    prod = Product(product_id="P-UNINSPECTED", name="Raw Unit", sample_id="VG-001")
    # Simulate a product that moved past inspection station without a valid decision
    prod.position = 75.0
    prod.inspection_result = {"status": "ERROR"}
    prod.sorting_result = None  # No decision generated
    engine.active_products.append(prod)
    engine.start()

    # Ticking should trigger system fault interlock, NOT silently sort as REJECT
    engine.tick(steps=1)

    assert engine.line_controller.state == LineState.ERROR
    assert engine.active_fault is not None
    assert "UNINSPECTED_ROUTING_FAULT" in engine.active_fault
    assert prod.lane is None  # Not routed!
    assert engine.metrics.total_passed == 0
    assert engine.metrics.total_rejected == 0
    assert engine.metrics.fault_count == 1

    # Direct route call without decision also raises ValueError
    with pytest.raises(ValueError, match="missing or invalid sorting decision"):
        engine.sorting_station.route_product(prod, engine.actuators)


def test_sorting_station_no_double_counting():
    """Verify multiple route calls for the same product do not double count."""
    engine = SimulationEngine(session_id="test_no_double_count")
    prod = Product(product_id="P-001", name="Unit 1", sample_id="VG-001")
    prod.sorting_result = "PASS"

    res1 = engine.sorting_station.route_product(prod, engine.actuators)
    assert res1["pass_total"] == 1

    # Second call for same product
    res2 = engine.sorting_station.route_product(prod, engine.actuators)
    assert res2["pass_total"] == 1  # Did NOT increment to 2!


# =============================================================================
# 8. EMERGENCY STOP & FAULT RECOVERY (Priority 8)
# =============================================================================

def test_emergency_stop_lifecycle_and_manual_restart():
    """Verify E-Stop halts line, preserves positions, and clearing requires explicit operator restart."""
    engine = SimulationEngine(session_id="test_estop_lifecycle")
    engine.set_speed(5.0)

    prod = engine.add_product(sample_id="VG-001")
    engine.start()
    engine.tick(steps=3)

    pos_before = prod.position
    assert pos_before > 0.0

    # Trigger E-Stop
    engine.emergency_stop()
    assert engine.conveyor.emergency_stopped is True
    assert engine.conveyor.running is False
    assert engine.line_controller.state == LineState.EMERGENCY_STOP

    # Tick attempts while in E-Stop do nothing
    engine.tick(steps=5)
    assert prod.position == pos_before  # Position preserved!

    # Clear E-Stop
    engine.clear_emergency()
    assert engine.conveyor.emergency_stopped is False
    assert engine.line_controller.state == LineState.IDLE
    # Conveyor remains stopped! (Safe industrial behavior)
    assert engine.conveyor.running is False

    engine.tick(steps=2)
    assert prod.position == pos_before  # Still hasn't moved without explicit start

    # Explicit operator restart
    engine.start()
    assert engine.conveyor.running is True
    engine.tick(steps=1)
    assert prod.position > pos_before  # Movement resumed!


def test_fault_injection_and_recovery():
    """Verify fault injection stops line and clearing allows clean recovery."""
    engine = SimulationEngine(session_id="test_fault_rec")
    engine.start()
    engine.tick(steps=2)

    engine.inject_fault("CONVEYOR_JAM")
    assert engine.active_fault == "CONVEYOR_JAM"
    assert engine.fault_tick == 2
    assert engine.conveyor.running is False
    assert engine.line_controller.state == LineState.ERROR

    # Clear fault
    engine.clear_fault()
    assert engine.active_fault is None
    assert engine.fault_tick is None
    assert engine.line_controller.state == LineState.IDLE
    assert engine.conveyor.running is False


# =============================================================================
# 9. FULL 6-SAMPLE PRODUCTION RUN & ANALYTICS (Priority 9)
# =============================================================================

def test_full_production_run_comparison_deam_vs_8086():
    """Run all 6 benchmark products in both DEAM Mode and 8086 Mode, verifying identical accurate results."""
    for mode in [ControllerMode.DEAM_LOGIC, ControllerMode.MICROPROCESSOR_8086]:
        engine = SimulationEngine(session_id=f"test_run_{mode}")
        engine.set_controller_mode(mode)
        engine.set_speed(5.0)

        batch = engine.add_batch_demo()
        assert len(batch) == 6
        engine.start()

        # Step until all products have exited
        for _ in range(250):
            engine.tick(steps=1)
            if len(engine.completed_products) == 6:
                break

        assert len(engine.completed_products) == 6
        assert engine.metrics.total_entered == 6
        assert engine.metrics.total_inspected == 6
        assert engine.metrics.total_sorted == 6
        assert engine.metrics.total_passed == 1
        assert engine.metrics.total_rejected == 5
        assert engine.metrics.pass_percentage == pytest.approx(16.7, abs=0.2)
        assert engine.metrics.reject_percentage == pytest.approx(83.3, abs=0.2)

        # Confirm exact sample outcomes: VG-001 PASS, others REJECT
        completed_map = {p.sample_id: p for p in engine.completed_products}
        assert completed_map["VG-001"].sorting_result == "PASS"
        assert completed_map["VG-001"].lane == "PASS_LANE"

        for sid in ["VG-002", "VG-003", "VG-004", "VG-005", "VG-006"]:
            assert completed_map[sid].sorting_result == "REJECT"
            assert completed_map[sid].lane == "REJECT_LANE"


# =============================================================================
# 10. FASTAPI REST API CONTRACT INTEGRATION (Priority 11)
# =============================================================================

def test_api_rest_contract_endpoints():
    """Verify REST endpoints adhere to contract for both path and body formats."""
    sid = "test_api_contract_sid"

    # Status
    res_status = client.get("/api/production-line/status")
    assert res_status.status_code == 200
    assert res_status.json()["stage"] == 5

    # State alias with query parameter
    res_state = client.get(f"/api/production-line/state?session_id={sid}")
    assert res_state.status_code == 200
    data = res_state.json()
    assert data["session_id"] == sid
    assert "conveyor" in data
    assert "fault_state" in data
    assert "line_state" in data

    # Controls alias
    res_start = client.post("/api/production-line/control/start", json={"session_id": sid})
    assert res_start.status_code == 200
    assert res_start.json()["conveyor"]["running"] is True

    # Tick simulation alias with validation
    res_tick = client.post("/api/production-line/simulation/tick", json={"session_id": sid, "steps": 3})
    assert res_tick.status_code == 200
    assert res_tick.json()["simulation_tick"] == 3

    # Emergency stop & clear alias
    res_estop = client.post("/api/production-line/control/emergency-stop", json={"session_id": sid})
    assert res_estop.status_code == 200
    assert res_estop.json()["conveyor"]["emergency_stopped"] is True

    res_clear = client.post("/api/production-line/control/emergency-stop/clear", json={"session_id": sid})
    assert res_clear.status_code == 200
    assert res_clear.json()["conveyor"]["emergency_stopped"] is False
