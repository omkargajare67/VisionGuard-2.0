from typing import Any, Dict, List, Optional
from backend.app.deam.logic_gates import validate_bit


def evaluate_inspection_decision(
    d: int,
    s: int,
    c: int,
    l: int,
    m: int,
    g: int,
) -> Dict[str, Any]:
    """Calculate DEAM combinational Boolean decision from optical inspection flags.

    Signals:
      D: Product Detected (1 = Yes, 0 = No/Unreadable)
      S: Surface Defect (1 = Scratch Detected, 0 = Clean)
      C: Components Complete (1 = All Present, 0 = Missing)
      L: Label Present (1 = Yes, 0 = Missing)
      M: Marking Correct (1 = Blue OK, 0 = Non-conforming)
      G: Geometry OK (1 = Nominal outline, 0 = Structural defect)

    Formulas:
      F (Defect Flag) = S OR NOT(C) OR NOT(L) OR NOT(M) OR NOT(G)
      PASS = D AND NOT(F)
      REJECT = D AND F
    """
    d_b = validate_bit(d)
    s_b = validate_bit(s)
    c_b = validate_bit(c)
    l_b = validate_bit(l)
    m_b = validate_bit(m)
    g_b = validate_bit(g)

    # Intermediate inverters
    not_c = 1 - c_b
    not_l = 1 - l_b
    not_m = 1 - m_b
    not_g = 1 - g_b

    # Gate 5: 5-input OR gate generating composite defect signal F
    f_defect = s_b | not_c | not_l | not_m | not_g

    # Gate 6: Inverter for defect signal
    not_f = 1 - f_defect

    # Gate 7 & 8: AND gates for sorting decisions
    pass_out = d_b & not_f
    reject_out = d_b & f_defect

    # Verification of mutual exclusivity
    assert not (pass_out == 1 and reject_out == 1), "Mutual exclusivity violation: PASS and REJECT cannot both be 1."

    # Determine descriptive decision
    if d_b == 0:
        decision = "UNREADABLE"
        verdict_summary = "Product not detected in inspection zone. Both PASS and REJECT lines held LOW."
    elif pass_out == 1:
        decision = "PASS"
        verdict_summary = "Nominal workpiece. Composite defect signal F = 0; PASS output line asserted HIGH."
    else:
        decision = "REJECT"
        verdict_summary = "Defective workpiece. Composite defect signal F = 1; REJECT output line asserted HIGH."

    # Detailed step-by-step gate execution trace
    gate_trace: List[Dict[str, Any]] = [
        {
            "gate_id": "U1_INV",
            "type": "NOT",
            "input": f"C={c_b}",
            "output": f"¬C={not_c}",
            "description": "Component presence inversion (0 = component missing -> 1 fault)",
        },
        {
            "gate_id": "U2_INV",
            "type": "NOT",
            "input": f"L={l_b}",
            "output": f"¬L={not_l}",
            "description": "Label presence inversion (0 = label absent -> 1 fault)",
        },
        {
            "gate_id": "U3_INV",
            "type": "NOT",
            "input": f"M={m_b}",
            "output": f"¬M={not_m}",
            "description": "Marking colour inversion (0 = incorrect colour -> 1 fault)",
        },
        {
            "gate_id": "U4_INV",
            "type": "NOT",
            "input": f"G={g_b}",
            "output": f"¬G={not_g}",
            "description": "Geometry inversion (0 = structural contour fault -> 1 fault)",
        },
        {
            "gate_id": "U5_OR5",
            "type": "5-input OR",
            "inputs": f"S={s_b}, ¬C={not_c}, ¬L={not_l}, ¬M={not_m}, ¬G={not_g}",
            "output": f"F={f_defect}",
            "description": f"Composite defect OR logic: {s_b} + {not_c} + {not_l} + {not_m} + {not_g} = {f_defect}",
        },
        {
            "gate_id": "U6_INV",
            "type": "NOT",
            "input": f"F={f_defect}",
            "output": f"¬F={not_f}",
            "description": f"Invert defect signal: ¬{f_defect} = {not_f}",
        },
        {
            "gate_id": "U7_AND2",
            "type": "2-input AND",
            "inputs": f"D={d_b}, ¬F={not_f}",
            "output": f"PASS={pass_out}",
            "description": f"PASS gate: D · ¬F = {d_b} · {not_f} = {pass_out}",
        },
        {
            "gate_id": "U8_AND2",
            "type": "2-input AND",
            "inputs": f"D={d_b}, F={f_defect}",
            "output": f"REJECT={reject_out}",
            "description": f"REJECT gate: D · F = {d_b} · {f_defect} = {reject_out}",
        },
    ]

    fault_reasons: List[str] = []
    if d_b == 1:
        if s_b == 1:
            fault_reasons.append("Surface scratch detected on casing (S=1).")
        if not_c == 1:
            fault_reasons.append("Electronic component(s) missing from PCB mount (C=0 -> ¬C=1).")
        if not_l == 1:
            fault_reasons.append("Identification label absent (L=0 -> ¬L=1).")
        if not_m == 1:
            fault_reasons.append("Identification marking colour non-conforming (M=0 -> ¬M=1).")
        if not_g == 1:
            fault_reasons.append("Structural contour outline damaged (G=0 -> ¬G=1).")

    return {
        "inputs": {
            "D": d_b,
            "S": s_b,
            "C": c_b,
            "L": l_b,
            "M": m_b,
            "G": g_b,
        },
        "intermediate_signals": {
            "not_C": not_c,
            "not_L": not_l,
            "not_M": not_m,
            "not_G": not_g,
            "not_F": not_f,
        },
        "defect_signal": f_defect,
        "pass_output": pass_out,
        "reject_output": reject_out,
        "decision": decision,
        "verdict_summary": verdict_summary,
        "boolean_expression": "PASS = D · ¬F,  REJECT = D · F,  where F = S + ¬C + ¬L + ¬M + ¬G",
        "gate_trace": gate_trace,
        "fault_reasons": fault_reasons,
    }


SAMPLE_FLAG_MAP: Dict[str, Dict[str, int]] = {
    "VG-001": {"d": 1, "s": 0, "c": 1, "l": 1, "m": 1, "g": 1},
    "VG-002": {"d": 1, "s": 0, "c": 1, "l": 0, "m": 1, "g": 1},
    "VG-003": {"d": 1, "s": 0, "c": 1, "l": 1, "m": 0, "g": 1},
    "VG-004": {"d": 1, "s": 0, "c": 0, "l": 1, "m": 1, "g": 1},
    "VG-005": {"d": 1, "s": 0, "c": 1, "l": 1, "m": 1, "g": 0},
    "VG-006": {"d": 1, "s": 1, "c": 1, "l": 1, "m": 1, "g": 1},
}


def evaluate_sample_decision(sample_id: str) -> Dict[str, Any]:
    """Retrieve benchmark flags for synthetic sample and evaluate combinational decision."""
    flags = SAMPLE_FLAG_MAP.get(sample_id.upper(), {"d": 1, "s": 0, "c": 1, "l": 1, "m": 1, "g": 1})
    res = evaluate_inspection_decision(
        d=flags["d"],
        s=flags["s"],
        c=flags["c"],
        l=flags["l"],
        m=flags["m"],
        g=flags["g"],
    )
    res["sample_id"] = sample_id
    return res

