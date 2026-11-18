from typing import Any, Dict, List
from backend.app.deam.logic_gates import validate_bit


def simulate_half_adder(a: int, b: int) -> Dict[str, Any]:
    """Simulate Half Adder circuit."""
    a_b = validate_bit(a)
    b_b = validate_bit(b)

    sum_out = a_b ^ b_b
    carry_out = a_b & b_b

    truth_table = [
        {"A": 0, "B": 0, "Sum": 0, "Carry": 0},
        {"A": 0, "B": 1, "Sum": 1, "Carry": 0},
        {"A": 1, "B": 0, "Sum": 1, "Carry": 0},
        {"A": 1, "B": 1, "Sum": 0, "Carry": 1},
    ]

    return {
        "inputs": {"A": a_b, "B": b_b},
        "outputs": {"Sum": sum_out, "Carry": carry_out},
        "equations": {
            "Sum": "A ⊕ B",
            "Carry": "A · B",
        },
        "intermediate": {
            "xor_calc": f"{a_b} ⊕ {b_b} = {sum_out}",
            "and_calc": f"{a_b} · {b_b} = {carry_out}",
        },
        "truth_table": truth_table,
    }


def simulate_full_adder(a: int, b: int, cin: int) -> Dict[str, Any]:
    """Simulate Full Adder circuit."""
    a_b = validate_bit(a)
    b_b = validate_bit(b)
    cin_b = validate_bit(cin)

    # Half adder 1
    ha1_sum = a_b ^ b_b
    ha1_carry = a_b & b_b

    # Half adder 2
    sum_out = ha1_sum ^ cin_b
    ha2_carry = ha1_sum & cin_b

    # Final carry
    cout = ha1_carry | ha2_carry

    truth_table = []
    for ia in (0, 1):
        for ib in (0, 1):
            for ic in (0, 1):
                s = ia ^ ib ^ ic
                co = (ia & ib) | (ic & (ia ^ ib))
                truth_table.append({"A": ia, "B": ib, "Cin": ic, "Sum": s, "Cout": co})

    return {
        "inputs": {"A": a_b, "B": b_b, "Cin": cin_b},
        "outputs": {"Sum": sum_out, "Cout": cout},
        "equations": {
            "Sum": "A ⊕ B ⊕ Cin",
            "Cout": "(A · B) + Cin · (A ⊕ B)",
        },
        "intermediate": {
            "ha1_sum": ha1_sum,
            "ha1_carry": ha1_carry,
            "ha2_carry": ha2_carry,
            "cout_or": f"{ha1_carry} + {ha2_carry} = {cout}",
        },
        "truth_table": truth_table,
    }


def simulate_multiplexer(
    data_inputs: List[int], select_inputs: List[int]
) -> Dict[str, Any]:
    """Simulate Multiplexer (2:1, 4:1, or 8:1)."""
    num_inputs = len(data_inputs)
    if num_inputs not in (2, 4, 8):
        raise ValueError("Multiplexer data inputs must be 2 (2:1), 4 (4:1), or 8 (8:1).")

    req_select = {2: 1, 4: 2, 8: 3}[num_inputs]
    if len(select_inputs) != req_select:
        raise ValueError(f"{num_inputs}:1 MUX requires exactly {req_select} select line(s).")

    validated_data = [validate_bit(d) for d in data_inputs]
    validated_sel = [validate_bit(s) for s in select_inputs]

    # Convert select lines to channel index (big-endian: S_{n-1} ... S_0)
    selected_channel = 0
    for s in validated_sel:
        selected_channel = (selected_channel << 1) | s

    output_val = validated_data[selected_channel]

    # Equation generation
    sel_vars = [f"S{i}" for i in range(req_select - 1, -1, -1)]
    eq_parts = []
    for ch in range(num_inputs):
        term = []
        for i, svar in enumerate(sel_vars):
            bit = (ch >> (req_select - 1 - i)) & 1
            term.append(svar if bit == 1 else f"¬{svar}")
        term.append(f"D{ch}")
        eq_parts.append("·".join(term))
    equation = f"Y = {' + '.join(eq_parts)}"

    return {
        "mux_type": f"{num_inputs}:1",
        "data_inputs": {f"D{i}": validated_data[i] for i in range(num_inputs)},
        "select_inputs": {f"S{req_select - 1 - i}": validated_sel[i] for i in range(req_select)},
        "selected_channel": selected_channel,
        "output": output_val,
        "equation": equation,
    }


def simulate_decoder(
    inputs: List[int], enable: int = 1
) -> Dict[str, Any]:
    """Simulate Decoder (2-to-4 or 3-to-8) with active-high Enable."""
    num_in = len(inputs)
    if num_in not in (2, 3):
        raise ValueError("Decoder only supports 2 inputs (2-to-4) or 3 inputs (3-to-8).")

    en_b = validate_bit(enable)
    val_in = [validate_bit(x) for x in inputs]

    num_outputs = 1 << num_in
    outputs = [0] * num_outputs

    selected_channel = 0
    for b in val_in:
        selected_channel = (selected_channel << 1) | b

    if en_b == 1:
        outputs[selected_channel] = 1

    return {
        "decoder_type": f"{num_in}-to-{num_outputs}",
        "enable": en_b,
        "inputs": {f"A{num_in - 1 - i}": val_in[i] for i in range(num_in)},
        "selected_channel": selected_channel if en_b == 1 else None,
        "outputs": {f"Y{i}": outputs[i] for i in range(num_outputs)},
        "active_line": f"Y{selected_channel}" if en_b == 1 else "None (Disabled)",
    }


def simulate_priority_encoder(inputs: List[int]) -> Dict[str, Any]:
    """Simulate Priority Encoder (4-to-2 or 8-to-3) where highest index has highest priority."""
    num_in = len(inputs)
    if num_in not in (4, 8):
        raise ValueError("Priority encoder supports 4 inputs (4-to-2) or 8 inputs (8-to-3).")

    num_out = 2 if num_in == 4 else 3
    val_in = [validate_bit(x) for x in inputs]

    highest_active = -1
    for i in range(num_in - 1, -1, -1):
        if val_in[i] == 1:
            highest_active = i
            break

    valid = 1 if highest_active != -1 else 0

    outputs: Dict[str, int] = {}
    if valid:
        for bit_idx in range(num_out):
            outputs[f"Y{bit_idx}"] = (highest_active >> bit_idx) & 1
    else:
        for bit_idx in range(num_out):
            outputs[f"Y{bit_idx}"] = 0

    return {
        "encoder_type": f"{num_in}-to-{num_out}",
        "inputs": {f"D{i}": val_in[i] for i in range(num_in)},
        "highest_active_input": f"D{highest_active}" if valid else "None",
        "valid": valid,
        "outputs": outputs,
        "priority_order": f"D{num_in - 1} (Highest) -> D0 (Lowest)",
    }


def simulate_parity(data_bits: List[int], parity_type: str = "even", received_parity: int = None) -> Dict[str, Any]:
    """Simulate Even/Odd Parity Generator and Checker."""
    val_bits = [validate_bit(b) for b in data_bits]
    if len(val_bits) == 0:
        raise ValueError("At least one data bit is required for parity calculation.")

    xor_sum = 0
    for b in val_bits:
        xor_sum ^= b

    is_even = parity_type.lower() == "even"
    # Even parity bit makes total 1s even (P = XOR)
    # Odd parity bit makes total 1s odd (P = NOT XOR)
    generated_parity = xor_sum if is_even else (1 - xor_sum)

    # Checker logic if received parity is provided
    checker_result = None
    if received_parity is not None:
        rec_p = validate_bit(received_parity)
        total_1s = sum(val_bits) + rec_p
        if is_even:
            parity_error = 0 if (total_1s % 2 == 0) else 1
        else:
            parity_error = 0 if (total_1s % 2 == 1) else 1

        checker_result = {
            "received_parity": rec_p,
            "total_ones": total_1s,
            "error_detected": bool(parity_error),
            "status": "VALID" if parity_error == 0 else "PARITY_ERROR",
        }

    return {
        "data_bits": val_bits,
        "parity_type": "Even" if is_even else "Odd",
        "xor_sum": xor_sum,
        "generated_parity": generated_parity,
        "transmitted_frame": val_bits + [generated_parity],
        "equation": "P = D0 ⊕ D1 ⊕ ... ⊕ Dn" if is_even else "P = ¬(D0 ⊕ D1 ⊕ ... ⊕ Dn)",
        "checker": checker_result,
    }
