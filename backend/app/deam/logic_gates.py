from typing import Dict, List, Tuple, Union


def validate_bit(val: Union[int, bool]) -> int:
    """Validate and normalize a binary bit to 0 or 1."""
    if isinstance(val, bool):
        return 1 if val else 0
    if val in (0, 1):
        return int(val)
    raise ValueError(f"Invalid binary bit: {val}. Must be 0 or 1.")


GATE_METADATA = {
    "AND": {
        "name": "AND Gate",
        "symbol": "·",
        "expression": "Y = A · B",
        "description": "Output is 1 (HIGH) if and only if all inputs are 1.",
        "inputs": ["A", "B"],
    },
    "OR": {
        "name": "OR Gate",
        "symbol": "+",
        "expression": "Y = A + B",
        "description": "Output is 1 (HIGH) if at least one input is 1.",
        "inputs": ["A", "B"],
    },
    "NOT": {
        "name": "NOT Gate (Inverter)",
        "symbol": "¬",
        "expression": "Y = ¬A",
        "description": "Inverts the input bit: 0 becomes 1, and 1 becomes 0.",
        "inputs": ["A"],
    },
    "NAND": {
        "name": "NAND Gate",
        "symbol": "⊼",
        "expression": "Y = ¬(A · B)",
        "description": "Universal gate. Output is 0 only when all inputs are 1.",
        "inputs": ["A", "B"],
    },
    "NOR": {
        "name": "NOR Gate",
        "symbol": "⊽",
        "expression": "Y = ¬(A + B)",
        "description": "Universal gate. Output is 1 only when all inputs are 0.",
        "inputs": ["A", "B"],
    },
    "XOR": {
        "name": "Exclusive-OR (XOR) Gate",
        "symbol": "⊕",
        "expression": "Y = A ⊕ B",
        "description": "Odd parity detector. Output is 1 when inputs differ.",
        "inputs": ["A", "B"],
    },
    "XNOR": {
        "name": "Exclusive-NOR (XNOR) Gate",
        "symbol": "⊙",
        "expression": "Y = ¬(A ⊕ B)",
        "description": "Equivalence gate. Output is 1 when inputs are identical.",
        "inputs": ["A", "B"],
    },
}


def evaluate_gate(gate: str, a: int, b: int = 0) -> int:
    """Evaluate logic gate output given binary inputs."""
    gate_upper = gate.upper()
    a_bit = validate_bit(a)

    if gate_upper == "NOT":
        return 1 - a_bit

    b_bit = validate_bit(b)

    if gate_upper == "AND":
        return a_bit & b_bit
    elif gate_upper == "OR":
        return a_bit | b_bit
    elif gate_upper == "NAND":
        return 1 - (a_bit & b_bit)
    elif gate_upper == "NOR":
        return 1 - (a_bit | b_bit)
    elif gate_upper == "XOR":
        return a_bit ^ b_bit
    elif gate_upper == "XNOR":
        return 1 - (a_bit ^ b_bit)
    else:
        raise ValueError(f"Unsupported gate type: '{gate}'. Supported: {list(GATE_METADATA.keys())}")


def generate_truth_table(gate: str) -> List[Dict[str, int]]:
    """Automatically generate complete truth table for the specified gate."""
    gate_upper = gate.upper()
    if gate_upper not in GATE_METADATA:
        raise ValueError(f"Unknown gate: '{gate}'")

    if gate_upper == "NOT":
        table = []
        for a in (0, 1):
            y = evaluate_gate("NOT", a)
            table.append({"A": a, "Y": y})
        return table

    table = []
    for a in (0, 1):
        for b in (0, 1):
            y = evaluate_gate(gate_upper, a, b)
            table.append({"A": a, "B": b, "Y": y})
    return table


def verify_demorgans_laws(a: int, b: int) -> Dict[str, Union[int, bool, str]]:
    """Demonstrate and verify De Morgan's Laws with actual input bits."""
    a_b = validate_bit(a)
    b_b = validate_bit(b)

    # First Law: ¬(A · B) == (¬A + ¬B)
    lhs_1 = 1 - (a_b & b_b)
    rhs_1 = (1 - a_b) | (1 - b_b)
    law_1_holds = (lhs_1 == rhs_1)

    # Second Law: ¬(A + B) == (¬A · ¬B)
    lhs_2 = 1 - (a_b | b_b)
    rhs_2 = (1 - a_b) & (1 - b_b)
    law_2_holds = (lhs_2 == rhs_2)

    return {
        "inputs": {"A": a_b, "B": b_b},
        "law_1": {
            "formula": "¬(A · B) ≡ ¬A + ¬B",
            "LHS_NAND": lhs_1,
            "RHS_OR_Inverted": rhs_1,
            "verified": law_1_holds,
        },
        "law_2": {
            "formula": "¬(A + B) ≡ ¬A · ¬B",
            "LHS_NOR": lhs_2,
            "RHS_AND_Inverted": rhs_2,
            "verified": law_2_holds,
        },
    }
