from typing import Any, Dict, List, Optional
from backend.app.deam import (
    boolean_logic,
    combinational,
    counters,
    flipflops,
    fsm,
    inspection_decision,
    kmap,
    logic_gates,
)
from backend.app.models.schemas import (
    BooleanEvaluateRequest,
    BooleanTruthTableRequest,
    CounterTickRequest,
    DecoderRequest,
    FlipFlopTickRequest,
    FsmTransitionRequest,
    FullAdderRequest,
    GateEvaluateRequest,
    GateTruthTableRequest,
    HalfAdderRequest,
    InspectionDecisionFromFlagsRequest,
    KMapSimplifyRequest,
    MultiplexerRequest,
    ParityRequest,
    PriorityEncoderRequest,
    RegisterShiftRequest,
)


class DeamService:
    """Orchestration service for all DEAM simulation modules."""

    def evaluate_gate(self, req: GateEvaluateRequest) -> Dict[str, Any]:
        gate = req.gate.upper()
        if gate not in logic_gates.GATE_METADATA:
            raise ValueError(f"Unknown gate '{req.gate}'. Supported: {list(logic_gates.GATE_METADATA.keys())}")
        output = logic_gates.evaluate_gate(gate, req.a, req.b)
        meta = logic_gates.GATE_METADATA[gate]
        inputs = {"A": req.a}
        if gate != "NOT":
            inputs["B"] = req.b

        return {
            "gate": gate,
            "inputs": inputs,
            "output": output,
            "name": meta["name"],
            "symbol": meta["symbol"],
            "expression": meta["expression"],
            "description": meta["description"],
        }

    def get_gate_truth_table(self, req: GateTruthTableRequest) -> Dict[str, Any]:
        gate = req.gate.upper()
        meta = logic_gates.GATE_METADATA.get(gate)
        if not meta:
            raise ValueError(f"Unknown gate: '{req.gate}'")
        table = logic_gates.generate_truth_table(gate)
        return {
            "gate": gate,
            "name": meta["name"],
            "expression": meta["expression"],
            "table": table,
        }

    def evaluate_boolean(self, req: BooleanEvaluateRequest) -> Dict[str, Any]:
        out = boolean_logic.evaluate_expression(req.expression, req.variables)
        norm = boolean_logic.normalize_expression(req.expression)
        return {
            "expression": req.expression,
            "normalized": norm,
            "variables": req.variables,
            "output": out,
        }

    def generate_boolean_truth_table(self, req: BooleanTruthTableRequest) -> Dict[str, Any]:
        return boolean_logic.generate_expression_truth_table(req.expression)

    def simplify_kmap(self, req: KMapSimplifyRequest) -> Dict[str, Any]:
        return kmap.solve_kmap(req.num_vars, req.minterms, req.dont_cares)

    def simulate_half_adder(self, req: HalfAdderRequest) -> Dict[str, Any]:
        return combinational.simulate_half_adder(req.a, req.b)

    def simulate_full_adder(self, req: FullAdderRequest) -> Dict[str, Any]:
        return combinational.simulate_full_adder(req.a, req.b, req.cin)

    def simulate_multiplexer(self, req: MultiplexerRequest) -> Dict[str, Any]:
        return combinational.simulate_multiplexer(req.data_inputs, req.select_inputs)

    def simulate_decoder(self, req: DecoderRequest) -> Dict[str, Any]:
        return combinational.simulate_decoder(req.inputs, req.enable)

    def simulate_priority_encoder(self, req: PriorityEncoderRequest) -> Dict[str, Any]:
        return combinational.simulate_priority_encoder(req.inputs)

    def simulate_parity(self, req: ParityRequest) -> Dict[str, Any]:
        return combinational.simulate_parity(req.data_bits, req.parity_type, req.received_parity)

    def simulate_flip_flop(self, req: FlipFlopTickRequest) -> Dict[str, Any]:
        ff = req.ff_type.upper()
        if ff == "SR":
            return flipflops.simulate_sr_flipflop(
                s=req.inputs.get("S", 0),
                r=req.inputs.get("R", 0),
                q_current=req.q_current,
                clock=req.clock,
                async_set=req.async_set,
                async_reset=req.async_reset,
            )
        elif ff == "JK":
            return flipflops.simulate_jk_flipflop(
                j=req.inputs.get("J", 0),
                k=req.inputs.get("K", 0),
                q_current=req.q_current,
                clock=req.clock,
            )
        elif ff == "D":
            return flipflops.simulate_d_flipflop(
                d=req.inputs.get("D", 0),
                q_current=req.q_current,
                clock=req.clock,
            )
        elif ff == "T":
            return flipflops.simulate_t_flipflop(
                t=req.inputs.get("T", 0),
                q_current=req.q_current,
                clock=req.clock,
            )
        else:
            raise ValueError(f"Unsupported flip-flop type: '{req.ff_type}'. Supported: SR, JK, D, T.")

    def simulate_register_shift(self, req: RegisterShiftRequest) -> Dict[str, Any]:
        return registers.simulate_register_step(
            reg_type=req.reg_type,
            current_state=req.current_state,
            serial_in=req.serial_in,
            parallel_in=req.parallel_in,
            shift_dir=req.shift_dir,
            load_parallel=req.load_parallel,
        )

    def simulate_counter(self, req: CounterTickRequest) -> Dict[str, Any]:
        return counters.simulate_counter_tick(
            counter_type=req.counter_type,
            current_value=req.current_value,
            bits=req.bits,
            modulo=req.modulo,
            enable=req.enable,
            reset=req.reset,
        )

    def trigger_fsm_transition(self, req: FsmTransitionRequest) -> Dict[str, Any]:
        machine = fsm.ProductionFSM(current_state=req.current_state)
        return machine.trigger_event(req.event)

    def calculate_inspection_decision(self, req: InspectionDecisionFromFlagsRequest) -> Dict[str, Any]:
        # Handle either structured InspectionFlags or discrete parameters (upper or lower case)
        if req.flags:
            d = req.flags.product_detected
            s = req.flags.surface_defect_detected
            c = req.flags.components_complete
            l = req.flags.label_present
            m = req.flags.marking_correct
            g = req.flags.geometry_ok
        else:
            d = req.D if req.D is not None else (req.d if req.d is not None else 1)
            s = req.S if req.S is not None else (req.s if req.s is not None else 0)
            c = req.C if req.C is not None else (req.c if req.c is not None else 1)
            l = req.L if req.L is not None else (req.l if req.l is not None else 1)
            m = req.M if req.M is not None else (req.m if req.m is not None else 1)
            g = req.G if req.G is not None else (req.g if req.g is not None else 1)

        return inspection_decision.evaluate_inspection_decision(
            d=d, s=s, c=c, l=l, m=m, g=g
        )

    def calculate_inspection_decision_for_sample(self, sample_id: str) -> Dict[str, Any]:
        return inspection_decision.evaluate_sample_decision(sample_id)


deam_service = DeamService()
