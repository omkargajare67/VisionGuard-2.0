"""Automated test suite for Stage 5: Virtual Production Line and Automated Sorting Simulation."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.production_line.conveyor import VirtualConveyor
from backend.app.production_line.models import (
    ControllerMode,
    LineState,
    ProductStatus,
    StationPositions,
)
from backend.app.production_line.simulation_engine import SimulationEngine
from backend.app.services.production_line_service import production_line_service

client = TestClient(app)


# -----------------------------------------------------------------------------
# 1. Conveyor Kinematics & Controls Tests
# -----------------------------------------------------------------------------

def test_conveyor_basic_controls():
    conveyor = VirtualConveyor(speed=5.0, length=100.0)
    assert not conveyor.running
    assert not conveyor.paused

    # Start
    assert conveyor.start()
    assert conveyor.running

    # Pause & Resume
    conveyor.pause()
    assert conveyor.paused
    assert conveyor.resume()
    assert not conveyor.paused

    # Speed update
    conveyor.set_speed(12.5)
    assert conveyor.speed == 12.5

    # Advance tick
    delta = conveyor.advance_tick(1)
    assert delta == 12.5
    assert conveyor.total_distance == 12.5

    # Stop
    conveyor.stop()
    assert not conveyor.running
    delta2 = conveyor.advance_tick(2)
    assert delta2 == 0.0


def test_conveyor_emergency_stop_lock():
    conveyor = VirtualConveyor(speed=5.0)
    conveyor.start()
    conveyor.emergency_stop()

    assert conveyor.emergency_stopped
    assert not conveyor.running
    assert not conveyor.start()  # Cannot start while emergency stopped
    assert not conveyor.resume()

    conveyor.clear_emergency()
    assert not conveyor.emergency_stopped
    assert conveyor.start()


# -----------------------------------------------------------------------------
# 2. Sensors & Positions Tests
# -----------------------------------------------------------------------------

def test_sensor_activation_and_reset():
    engine = SimulationEngine(session_id="test_sensors")
    pos = StationPositions()

    prod = engine.add_product("Test Sensor Item", sample_id="VG-001")
    engine.start()

    # Move product to IR Sensor 1 (pos 10)
    prod.position = pos.IR_SENSOR_1
    engine.sensors.update_all([prod], tick=1)
    assert engine.sensors.ir_sensor_1.active
    assert engine.sensors.ir_sensor_1.associated_product_id == prod.product_id

    # Move product past IR Sensor 1 to Inspection station (pos 30)
    prod.position = pos.INSPECTION_STATION
    engine.sensors.update_all([prod], tick=2)
    assert not engine.sensors.ir_sensor_1.active
    assert engine.sensors.ir_sensor_2.active

    # Reset
    engine.sensors.reset()
    assert not engine.sensors.ir_sensor_2.active
    assert engine.sensors.ir_sensor_2.detection_count == 0


# -----------------------------------------------------------------------------
# 3. Product Lifecycle & Movement Tests
# -----------------------------------------------------------------------------

def test_product_queue_and_entry():
    engine = SimulationEngine(session_id="test_queue")
    engine.set_speed(5.0)

    p1 = engine.add_product("Item 1", sample_id="VG-001")
    p2 = engine.add_product("Item 2", sample_id="VG-002")
    assert len(engine.queue) == 2
    assert len(engine.active_products) == 0

    # Start and tick
    engine.start()
    engine.tick(steps=1)

    # p1 should now be ON_CONVEYOR at position 0.0 or 5.0
    assert len(engine.queue) == 1
    assert len(engine.active_products) == 1
    active_p = engine.active_products[0]
    assert active_p.product_id == p1.product_id
    assert active_p.status in [ProductStatus.ON_CONVEYOR, ProductStatus.DETECTED]


def test_remove_queued_product():
    engine = SimulationEngine(session_id="test_remove")
    p = engine.add_product("To Remove", sample_id="VG-001")
    assert len(engine.queue) == 1

    removed = engine.remove_queued_product(p.product_id)
    assert removed
    assert len(engine.queue) == 0

    # Removing non-existent returns False
    assert not engine.remove_queued_product("NONEXISTENT")


# -----------------------------------------------------------------------------
# 4. End-to-End Inspection & Sorting: Nominal PASS (VG-001)
# -----------------------------------------------------------------------------

def test_nominal_pass_workflow_deam_mode():
    engine = SimulationEngine(session_id="test_vg001_deam")
    engine.set_controller_mode(ControllerMode.DEAM_LOGIC)
    engine.set_speed(5.0)

    prod = engine.add_product("Nominal Product", sample_id="VG-001")
    engine.start()

    # Step through simulation until product completes cycle
    max_ticks = 40
    for _ in range(max_ticks):
        engine.tick(steps=1)
        if prod.is_completed:
            break

    assert prod.is_completed
    assert prod.inspection_result is not None
    assert prod.inspection_result["status"] == "PASS"
    assert prod.sorting_result == "PASS"
    assert prod.lane == "PASS_LANE"
    assert engine.metrics.total_passed >= 1
    assert engine.metrics.total_rejected == 0


def test_nominal_pass_workflow_8086_mode():
    engine = SimulationEngine(session_id="test_vg001_8086")
    engine.set_controller_mode(ControllerMode.MICROPROCESSOR_8086)
    engine.set_speed(5.0)

    prod = engine.add_product("Nominal Product", sample_id="VG-001")
    engine.start()

    max_ticks = 40
    for _ in range(max_ticks):
        engine.tick(steps=1)
        if prod.is_completed:
            break

    assert prod.is_completed
    assert prod.sorting_result == "PASS"
    assert prod.lane == "PASS_LANE"
    assert prod.microprocessor_result is not None
    assert prod.microprocessor_result["steps_executed"] > 0
    assert prod.microprocessor_result["actuators"]["green_led"] == 1
    assert prod.microprocessor_result["actuators"]["reject_gate"] == 0


# -----------------------------------------------------------------------------
# 5. End-to-End Inspection & Sorting: Defective REJECTs (VG-002 to VG-006)
# -----------------------------------------------------------------------------

@pytest.mark.parametrize("sample_id,expected_defect_key", [
    ("VG-002", "missing_label"),
    ("VG-003", "marking_defect"),
    ("VG-004", "missing_component"),
    ("VG-005", "geometry_defect"),
    ("VG-006", "surface_scratch"),
])
def test_defective_reject_workflows(sample_id, expected_defect_key):
    engine = SimulationEngine(session_id=f"test_{sample_id.lower()}")
    engine.set_controller_mode(ControllerMode.DEAM_LOGIC)
    engine.set_speed(5.0)

    prod = engine.add_product(f"Defect {sample_id}", sample_id=sample_id)
    engine.start()

    max_ticks = 40
    for _ in range(max_ticks):
        engine.tick(steps=1)
        if prod.is_completed:
            break

    assert prod.is_completed
    assert prod.inspection_result is not None
    assert prod.inspection_result["status"] == "REJECT"
    assert prod.sorting_result == "REJECT"
    assert prod.lane == "REJECT_LANE"
    assert engine.metrics.total_rejected >= 1
    assert engine.metrics.defect_distribution[expected_defect_key] >= 1


# -----------------------------------------------------------------------------
# 6. Batch Demo Execution (All 6 Samples Sequentially)
# -----------------------------------------------------------------------------

def test_full_batch_demo_six_samples():
    engine = SimulationEngine(session_id="test_batch_demo")
    engine.set_speed(5.0)

    batch = engine.add_batch_demo()
    assert len(batch) == 6
    assert len(engine.queue) == 6

    engine.start()

    # Step through entire batch processing
    max_ticks = 250
    for _ in range(max_ticks):
        engine.tick(steps=1)
        if len(engine.completed_products) == 6:
            break

    assert len(engine.completed_products) == 6
    # 1 PASS (VG-001) and 5 REJECTs (VG-002 through VG-006)
    assert engine.metrics.total_passed == 1
    assert engine.metrics.total_rejected == 5
    assert engine.metrics.total_sorted == 6
    assert engine.metrics.pass_percentage == pytest.approx(16.7, abs=0.2)
    assert engine.metrics.reject_percentage == pytest.approx(83.3, abs=0.2)


# -----------------------------------------------------------------------------
# 7. Line FSM Transitions & Emergency Stop
# -----------------------------------------------------------------------------

def test_line_fsm_emergency_stop_and_reset():
    engine = SimulationEngine(session_id="test_fsm_emergency")
    engine.start()
    assert engine.line_controller.state == LineState.CONVEYOR_MOVEMENT

    # Trigger emergency stop
    engine.emergency_stop()
    assert engine.line_controller.state == LineState.EMERGENCY_STOP
    assert not engine.conveyor.running
    assert engine.metrics.emergency_stop_count == 1

    # Cannot advance tick while emergency stopped
    dist_before = engine.conveyor.total_distance
    engine.tick(steps=3)
    assert engine.conveyor.total_distance == dist_before

    # Clear emergency
    engine.clear_emergency()
    assert engine.line_controller.state == LineState.IDLE


def test_fault_injection_and_clear():
    engine = SimulationEngine(session_id="test_faults")
    engine.start()

    # Inject fault
    engine.inject_fault("IR_SENSOR_FAULT")
    assert engine.active_fault == "IR_SENSOR_FAULT"
    assert engine.line_controller.state == LineState.ERROR
    assert not engine.conveyor.running
    assert engine.metrics.fault_count == 1

    # Clear fault
    engine.clear_fault()
    assert engine.active_fault is None
    assert engine.line_controller.state == LineState.IDLE


# -----------------------------------------------------------------------------
# 8. REST API Endpoints Verification
# -----------------------------------------------------------------------------

def test_api_production_line_status():
    resp = client.get("/api/production-line/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "operational"
    assert data["stage"] == 5
    assert "capabilities" in data


def test_api_session_lifecycle_and_batch_demo():
    session_id = "test_api_session_run"

    # 1. Create session
    resp = client.post(f"/api/production-line/sessions/{session_id}")
    assert resp.status_code == 200
    state = resp.json()
    assert state["session_id"] == session_id

    # 2. Add product
    resp = client.post(
        f"/api/production-line/sessions/{session_id}/products",
        json={"name": "API Test Item", "sample_id": "VG-001"},
    )
    assert resp.status_code == 200
    assert resp.json()["product"]["sample_id"] == "VG-001"

    # 3. Start line
    resp = client.post(f"/api/production-line/sessions/{session_id}/start")
    assert resp.status_code == 200
    assert resp.json()["conveyor"]["running"] is True

    # 4. Tick simulation
    resp = client.post(
        f"/api/production-line/sessions/{session_id}/tick",
        json={"steps": 5},
    )
    assert resp.status_code == 200
    assert resp.json()["simulation_tick"] == 5

    # 5. Switch controller mode to 8086
    resp = client.post(
        f"/api/production-line/sessions/{session_id}/controller-mode",
        json={"mode": "MICROPROCESSOR_8086"},
    )
    assert resp.status_code == 200
    assert resp.json()["line_controller"]["controller_mode"] == "MICROPROCESSOR_8086"

    # 6. Fetch sensors & actuators
    resp = client.get(f"/api/production-line/sessions/{session_id}/sensors")
    assert resp.status_code == 200
    assert "ir_sensor_1" in resp.json()

    resp = client.get(f"/api/production-line/sessions/{session_id}/actuators")
    assert resp.status_code == 200
    assert "conveyor_motor" in resp.json()

    # 7. Fetch metrics & events
    resp = client.get(f"/api/production-line/sessions/{session_id}/metrics")
    assert resp.status_code == 200

    resp = client.get(f"/api/production-line/sessions/{session_id}/events?limit=10")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

    # 8. Reset session
    resp = client.post(f"/api/production-line/sessions/{session_id}/reset")
    assert resp.status_code == 200
    assert resp.json()["simulation_tick"] == 0
