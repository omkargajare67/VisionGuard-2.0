import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.deam.logic_gates import evaluate_gate, generate_truth_table, verify_demorgans_laws
from backend.app.deam.boolean_logic import evaluate_expression, generate_expression_truth_table
from backend.app.deam.kmap import solve_kmap
from backend.app.deam.combinational import (
    simulate_decoder,
    simulate_full_adder,
    simulate_half_adder,
    simulate_multiplexer,
    simulate_parity,
    simulate_priority_encoder,
)
from backend.app.deam.flipflops import (
    simulate_d_flipflop,
    simulate_jk_flipflop,
    simulate_sr_flipflop,
    simulate_t_flipflop,
)
from backend.app.deam.registers import simulate_register_step
from backend.app.deam.counters import simulate_counter_tick
from backend.app.deam.fsm import ProductionFSM
from backend.app.deam.inspection_decision import evaluate_inspection_decision
from backend.app.vision.defect_detection import DefectDetector
from backend.app.vision.synthetic_samples import generate_sample_image

client = TestClient(app)
detector = DefectDetector()


# -----------------------------------------------------------------------------
# 1. UNIT 1: LOGIC GATES & BOOLEAN ALGEBRA
# -----------------------------------------------------------------------------

def test_all_seven_logic_gates():
    # AND
    assert evaluate_gate("AND", 0, 0) == 0
    assert evaluate_gate("AND", 0, 1) == 0
    assert evaluate_gate("AND", 1, 0) == 0
    assert evaluate_gate("AND", 1, 1) == 1

    # OR
    assert evaluate_gate("OR", 0, 0) == 0
    assert evaluate_gate("OR", 0, 1) == 1
    assert evaluate_gate("OR", 1, 0) == 1
    assert evaluate_gate("OR", 1, 1) == 1

    # NOT
    assert evaluate_gate("NOT", 0) == 1
    assert evaluate_gate("NOT", 1) == 0

    # NAND
    assert evaluate_gate("NAND", 0, 0) == 1
    assert evaluate_gate("NAND", 1, 1) == 0

    # NOR
    assert evaluate_gate("NOR", 0, 0) == 1
    assert evaluate_gate("NOR", 0, 1) == 0

    # XOR
    assert evaluate_gate("XOR", 0, 0) == 0
    assert evaluate_gate("XOR", 0, 1) == 1
    assert evaluate_gate("XOR", 1, 0) == 1
    assert evaluate_gate("XOR", 1, 1) == 0

    # XNOR
    assert evaluate_gate("XNOR", 0, 0) == 1
    assert evaluate_gate("XNOR", 0, 1) == 0
    assert evaluate_gate("XNOR", 1, 1) == 1


def test_gate_truth_tables():
    for g in ["AND", "OR", "NAND", "NOR", "XOR", "XNOR"]:
        tt = generate_truth_table(g)
        assert len(tt) == 4
    not_tt = generate_truth_table("NOT")
    assert len(not_tt) == 2


def test_demorgans_laws_verification():
    for a in (0, 1):
        for b in (0, 1):
            res = verify_demorgans_laws(a, b)
            assert res["law_1"]["verified"] is True
            assert res["law_2"]["verified"] is True


def test_boolean_expression_evaluation():
    expr = "(A AND B) OR NOT(C)"
    assert evaluate_expression(expr, {"A": 1, "B": 1, "C": 1}) == 1
    assert evaluate_expression(expr, {"A": 0, "B": 1, "C": 1}) == 0
    assert evaluate_expression(expr, {"A": 0, "B": 0, "C": 0}) == 1

    tt = generate_expression_truth_table(expr)
    assert len(tt["table"]) == 8  # 3 variables -> 2^3 = 8 rows


# -----------------------------------------------------------------------------
# 2. UNIT 1: KARNAUGH MAP (K-MAP) MINIMIZATION
# -----------------------------------------------------------------------------

def test_kmap_2_variable():
    # Minterms 1, 3: A'B + AB = B
    res = solve_kmap(2, [1, 3])
    assert res["verified"] is True
    assert "B" in res["simplified_expression"]


def test_kmap_3_variable():
    # Minterms 0, 1, 2, 3: A'B'C' + A'B'C + A'BC' + A'BC = A'
    res = solve_kmap(3, [0, 1, 2, 3])
    assert res["verified"] is True
    assert "¬A" in res["simplified_expression"] or "A'" in res["simplified_expression"] or res["simplified_expression"] == "¬A"


def test_kmap_4_variable_with_dont_cares():
    # 4 variables with don't cares
    minterms = [0, 2, 8, 10]  # 4 corners of 4-variable K-map -> B'D'
    res = solve_kmap(4, minterms, dont_cares=[14])
    assert res["verified"] is True
    assert len(res["groups"]) > 0


# -----------------------------------------------------------------------------
# 3. UNIT 2: COMBINATIONAL LOGIC CIRCUITS
# -----------------------------------------------------------------------------

def test_half_adder_all_cases():
    ha00 = simulate_half_adder(0, 0)
    assert ha00["outputs"] == {"Sum": 0, "Carry": 0}

    ha01 = simulate_half_adder(0, 1)
    assert ha01["outputs"] == {"Sum": 1, "Carry": 0}

    ha10 = simulate_half_adder(1, 0)
    assert ha10["outputs"] == {"Sum": 1, "Carry": 0}

    ha11 = simulate_half_adder(1, 1)
    assert ha11["outputs"] == {"Sum": 0, "Carry": 1}


def test_full_adder_all_cases():
    cases = [
        (0, 0, 0, 0, 0),
        (0, 0, 1, 1, 0),
        (0, 1, 0, 1, 0),
        (0, 1, 1, 0, 1),
        (1, 0, 0, 1, 0),
        (1, 0, 1, 0, 1),
        (1, 1, 0, 0, 1),
        (1, 1, 1, 1, 1),
    ]
    for a, b, cin, exp_s, exp_co in cases:
        fa = simulate_full_adder(a, b, cin)
        assert fa["outputs"]["Sum"] == exp_s
        assert fa["outputs"]["Cout"] == exp_co


def test_multiplexers():
    # 2:1 MUX
    m2 = simulate_multiplexer([1, 0], [0])  # select D0=1
    assert m2["output"] == 1
    m2_sel1 = simulate_multiplexer([1, 0], [1])  # select D1=0
    assert m2_sel1["output"] == 0

    # 4:1 MUX
    m4 = simulate_multiplexer([0, 1, 0, 1], [1, 1])  # select D3=1
    assert m4["selected_channel"] == 3
    assert m4["output"] == 1

    # 8:1 MUX
    m8 = simulate_multiplexer([0, 0, 0, 0, 0, 1, 0, 0], [1, 0, 1])  # select D5=1
    assert m8["selected_channel"] == 5
    assert m8["output"] == 1


def test_decoders():
    # 2-to-4 decoder
    d24 = simulate_decoder([1, 0], enable=1)  # channel 2
    assert d24["outputs"]["Y2"] == 1
    assert d24["outputs"]["Y0"] == 0

    # Disabled decoder
    d_dis = simulate_decoder([1, 0], enable=0)
    assert all(v == 0 for v in d_dis["outputs"].values())

    # 3-to-8 decoder
    d38 = simulate_decoder([1, 1, 1], enable=1)  # channel 7
    assert d38["outputs"]["Y7"] == 1
    assert d38["outputs"]["Y6"] == 0


def test_priority_encoder():
    # D3 active (highest priority) even if D0, D1 active
    pe = simulate_priority_encoder([1, 1, 0, 1])
    assert pe["highest_active_input"] == "D3"
    assert pe["outputs"]["Y1"] == 1
    assert pe["outputs"]["Y0"] == 1
    assert pe["valid"] == 1

    # All 0s
    pe_zero = simulate_priority_encoder([0, 0, 0, 0])
    assert pe_zero["valid"] == 0


def test_parity_generator_and_checker():
    # Even parity generator for [1, 0, 1, 0] -> 2 ones, even -> P=0
    p_even = simulate_parity([1, 0, 1, 0], parity_type="even")
    assert p_even["generated_parity"] == 0

    # Odd parity generator for [1, 0, 1, 0] -> 2 ones, odd -> P=1
    p_odd = simulate_parity([1, 0, 1, 0], parity_type="odd")
    assert p_odd["generated_parity"] == 1

    # Parity checker: valid frame
    chk_valid = simulate_parity([1, 0, 1, 0], parity_type="even", received_parity=0)
    assert chk_valid["checker"]["status"] == "VALID"

    # Parity checker: corrupted frame
    chk_err = simulate_parity([1, 0, 1, 0], parity_type="even", received_parity=1)
    assert chk_err["checker"]["status"] == "PARITY_ERROR"


# -----------------------------------------------------------------------------
# 4. UNIT 3: SEQUENTIAL LOGIC (FLIP-FLOPS, REGISTERS, COUNTERS)
# -----------------------------------------------------------------------------

def test_flip_flops():
    # SR Flip-Flop Set/Reset/Hold/Invalid
    assert simulate_sr_flipflop(1, 0, q_current=0)["q_next"] == 1  # Set
    assert simulate_sr_flipflop(0, 1, q_current=1)["q_next"] == 0  # Reset
    assert simulate_sr_flipflop(0, 0, q_current=1)["q_next"] == 1  # Hold
    sr_inv = simulate_sr_flipflop(1, 1, q_current=0)
    assert sr_inv["q_next"] is None
    assert sr_inv["operation"] == "INVALID_STATE"

    # JK Flip-Flop
    assert simulate_jk_flipflop(1, 0, q_current=0)["q_next"] == 1  # Set
    assert simulate_jk_flipflop(0, 1, q_current=1)["q_next"] == 0  # Reset
    assert simulate_jk_flipflop(0, 0, q_current=1)["q_next"] == 1  # Hold
    assert simulate_jk_flipflop(1, 1, q_current=1)["q_next"] == 0  # Toggle 1->0
    assert simulate_jk_flipflop(1, 1, q_current=0)["q_next"] == 1  # Toggle 0->1

    # D Flip-Flop
    assert simulate_d_flipflop(1, q_current=0)["q_next"] == 1
    assert simulate_d_flipflop(0, q_current=1)["q_next"] == 0

    # T Flip-Flop
    assert simulate_t_flipflop(1, q_current=0)["q_next"] == 1
    assert simulate_t_flipflop(1, q_current=1)["q_next"] == 0
    assert simulate_t_flipflop(0, q_current=1)["q_next"] == 1  # Hold


def test_registers_modes():
    # SIPO Right Shift
    sipo = simulate_register_step("SIPO", current_state=[0, 0, 0, 0], serial_in=1, shift_dir="right")
    assert sipo["current_state"] == [1, 0, 0, 0]
    assert sipo["outputs"]["serial_out"] == 0

    # PIPO Parallel Load
    pipo = simulate_register_step("PIPO", current_state=[0, 0, 0, 0], parallel_in=[1, 1, 0, 1], load_parallel=True)
    assert pipo["current_state"] == [1, 1, 0, 1]


def test_counters():
    # Synchronous Up Counter rollover
    c_up = simulate_counter_tick("up", current_value=15, bits=4)
    assert c_up["next_value"] == 0
    assert c_up["overflow"] == 1

    # Synchronous Down Counter underflow
    c_down = simulate_counter_tick("down", current_value=0, bits=4)
    assert c_down["next_value"] == 15
    assert c_down["underflow"] == 1

    # Modulo-10 counter rollover
    c_mod = simulate_counter_tick("modulo", current_value=9, bits=4, modulo=10)
    assert c_mod["next_value"] == 0
    assert c_mod["overflow"] == 1


# -----------------------------------------------------------------------------
# 5. PRODUCTION FSM CONTROLLER
# -----------------------------------------------------------------------------

def test_fsm_full_lifecycle():
    machine = ProductionFSM()
    assert machine.state == "IDLE"

    # Valid step-by-step industrial sequence
    step1 = machine.trigger_event("PRODUCT_DETECTED")
    assert step1["current_state"] == "DETECT"

    step2 = machine.trigger_event("SENSOR_CONFIRMED")
    assert step2["current_state"] == "CAPTURE"
    assert step2["moore_outputs"]["camera_trigger"] == 1

    step3 = machine.trigger_event("IMAGE_READY")
    assert step3["current_state"] == "DECIDE"
    assert step3["moore_outputs"]["inspection_active"] == 1

    step4 = machine.trigger_event("DECISION_READY")
    assert step4["current_state"] == "SORT"
    assert step4["moore_outputs"]["servo_gate_actuate"] == 1

    step5 = machine.trigger_event("SORT_COMPLETE")
    assert step5["current_state"] == "RESET"
    assert step5["moore_outputs"]["conveyor_motor"] == 1

    step6 = machine.trigger_event("CYCLE_CLEARED")
    assert step6["current_state"] == "IDLE"


def test_fsm_invalid_transition_rejection():
    machine = ProductionFSM(current_state="IDLE")
    # Trying to trigger SORT_COMPLETE while IDLE must fail cleanly
    res = machine.trigger_event("SORT_COMPLETE")
    assert res["transition_valid"] is False
    assert res["current_state"] == "IDLE"
    assert "Invalid transition" in res["error"]


def test_fsm_force_reset():
    machine = ProductionFSM(current_state="DECIDE")
    res = machine.trigger_event("FORCE_RESET")
    assert res["current_state"] == "IDLE"
    assert res["transition_valid"] is True


# -----------------------------------------------------------------------------
# 6. VISION-TO-LOGIC INTEGRATION (VG-001 THROUGH VG-006)
# -----------------------------------------------------------------------------

def test_vision_to_logic_decision_all_samples():
    """Verify that actual OpenCV flags for each synthetic sample feed into the Boolean decision engine."""
    sample_expected = {
        "VG-001": "PASS",
        "VG-002": "REJECT",
        "VG-003": "REJECT",
        "VG-004": "REJECT",
        "VG-005": "REJECT",
        "VG-006": "REJECT",
    }

    for sid, exp_decision in sample_expected.items():
        img = generate_sample_image(sid)
        cv_res = detector.analyze(img, sid)
        flags = cv_res.flags

        decision_res = evaluate_inspection_decision(
            d=flags.product_detected,
            s=flags.surface_defect_detected,
            c=flags.components_complete,
            l=flags.label_present,
            m=flags.marking_correct,
            g=flags.geometry_ok,
        )

        assert decision_res["decision"] == exp_decision, f"Mismatch on {sid}: {decision_res['decision']} != {exp_decision}"
        # Mutual exclusivity check
        assert not (decision_res["pass_output"] == 1 and decision_res["reject_output"] == 1), f"Mutual exclusivity violated on {sid}!"
        if exp_decision == "PASS":
            assert decision_res["pass_output"] == 1 and decision_res["reject_output"] == 0
            assert decision_res["defect_signal"] == 0
        else:
            assert decision_res["pass_output"] == 0 and decision_res["reject_output"] == 1
            assert decision_res["defect_signal"] == 1


def test_vision_to_logic_no_product():
    """When D = 0 (no product detected), both PASS and REJECT must be 0."""
    res = evaluate_inspection_decision(d=0, s=0, c=1, l=1, m=1, g=1)
    assert res["pass_output"] == 0
    assert res["reject_output"] == 0
    assert res["decision"] == "UNREADABLE"


# -----------------------------------------------------------------------------
# 7. DEAM API ENDPOINT TESTS
# -----------------------------------------------------------------------------

def test_api_deam_endpoints():
    # 1. Status
    r = client.get("/api/deam/status")
    assert r.status_code == 200
    assert r.json()["stage"] == 3

    # 2. Gate Evaluate
    r = client.post("/api/deam/gates/evaluate", json={"gate": "XOR", "a": 1, "b": 0})
    assert r.status_code == 200
    assert r.json()["output"] == 1

    # 3. K-Map Simplify
    r = client.post("/api/deam/kmap/simplify", json={"num_vars": 3, "minterms": [0, 1, 2, 3]})
    assert r.status_code == 200
    assert r.json()["verified"] is True

    # 4. Half Adder
    r = client.post("/api/deam/combinational/half-adder", json={"a": 1, "b": 1})
    assert r.status_code == 200
    assert r.json()["outputs"]["Carry"] == 1

    # 5. Flip-Flop
    r = client.post("/api/deam/sequential/flip-flop/tick", json={"ff_type": "JK", "inputs": {"J": 1, "K": 1}, "q_current": 0, "clock": 1})
    assert r.status_code == 200
    assert r.json()["q_next"] == 1

    # 6. FSM
    r = client.post("/api/deam/fsm/transition", json={"current_state": "IDLE", "event": "PRODUCT_DETECTED"})
    assert r.status_code == 200
    assert r.json()["current_state"] == "DETECT"

    # 7. Decision from Flags
    r = client.post("/api/deam/decision/from-flags", json={"d": 1, "s": 0, "c": 1, "l": 1, "m": 1, "g": 1})
    assert r.status_code == 200
    assert r.json()["decision"] == "PASS"
