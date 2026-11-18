from typing import Any, Dict
from fastapi import APIRouter, HTTPException
from backend.app.deam import boolean_logic, fsm
from backend.app.models.schemas import (
    BooleanEvaluateRequest,
    BooleanTruthTableRequest,
    CounterTickRequest,
    DecoderRequest,
    FlipFlopTickRequest,
    FsmTransitionRequest,
    FullAdderRequest,
    GateEvaluateRequest,
    GateEvaluateResponse,
    GateTruthTableRequest,
    GateTruthTableResponse,
    HalfAdderRequest,
    InspectionDecisionFromFlagsRequest,
    KMapSimplifyRequest,
    MultiplexerRequest,
    ParityRequest,
    PriorityEncoderRequest,
    RegisterShiftRequest,
)
from backend.app.services.deam_service import deam_service

router = APIRouter(prefix="/api/deam", tags=["deam"])


@router.get("/status")
def get_deam_status() -> Dict[str, Any]:
    """Return operational status and capabilities of the DEAM simulation engine."""
    return {
        "status": "operational",
        "stage": 3,
        "engine": "DEAM Interactive Digital Electronics Simulator",
        "units": {
            "unit_1": "Digital Fundamentals & Boolean Algebra (Gates, K-Map)",
            "unit_2": "Combinational Logic (Adders, MUX, Decoders, Encoders, Parity)",
            "unit_3": "Sequential Logic (Flip-Flops, Registers, Counters, FSM)",
        },
        "vision_bridge": "Active (Vision Flags -> Combinational Boolean Decision)",
    }


# -----------------------------------------------------------------------------
# UNIT 1: GATES & BOOLEAN LOGIC
# -----------------------------------------------------------------------------

@router.post("/gates/evaluate", response_model=GateEvaluateResponse)
def evaluate_gate(request: GateEvaluateRequest) -> GateEvaluateResponse:
    try:
        res = deam_service.evaluate_gate(request)
        return GateEvaluateResponse(**res)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/gates/truth-table", response_model=GateTruthTableResponse)
def get_gate_truth_table(request: GateTruthTableRequest) -> GateTruthTableResponse:
    try:
        res = deam_service.get_gate_truth_table(request)
        return GateTruthTableResponse(**res)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/gates/{gate_name}/truth-table", response_model=GateTruthTableResponse)
def get_gate_truth_table_by_path(gate_name: str) -> GateTruthTableResponse:
    try:
        res = deam_service.get_gate_truth_table(GateTruthTableRequest(gate=gate_name))
        return GateTruthTableResponse(**res)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/boolean/evaluate")
def evaluate_boolean(request: BooleanEvaluateRequest) -> Dict[str, Any]:
    try:
        return deam_service.evaluate_boolean(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/boolean/truth-table")
def generate_boolean_truth_table(request: BooleanTruthTableRequest) -> Dict[str, Any]:
    try:
        return deam_service.generate_boolean_truth_table(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/boolean/identities")
def get_boolean_identities() -> Dict[str, Any]:
    return {"identities": boolean_logic.get_boolean_identities()}


@router.post("/kmap/simplify")
def simplify_kmap(request: KMapSimplifyRequest) -> Dict[str, Any]:
    try:
        return deam_service.simplify_kmap(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# -----------------------------------------------------------------------------
# UNIT 2: COMBINATIONAL CIRCUITS
# -----------------------------------------------------------------------------

@router.post("/combinational/half-adder")
def simulate_half_adder(request: HalfAdderRequest) -> Dict[str, Any]:
    try:
        return deam_service.simulate_half_adder(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/combinational/full-adder")
def simulate_full_adder(request: FullAdderRequest) -> Dict[str, Any]:
    try:
        return deam_service.simulate_full_adder(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/combinational/multiplexer")
def simulate_multiplexer(request: MultiplexerRequest) -> Dict[str, Any]:
    try:
        return deam_service.simulate_multiplexer(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/combinational/decoder")
def simulate_decoder(request: DecoderRequest) -> Dict[str, Any]:
    try:
        return deam_service.simulate_decoder(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/combinational/priority-encoder")
def simulate_priority_encoder(request: PriorityEncoderRequest) -> Dict[str, Any]:
    try:
        return deam_service.simulate_priority_encoder(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/combinational/parity")
def simulate_parity(request: ParityRequest) -> Dict[str, Any]:
    try:
        return deam_service.simulate_parity(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# -----------------------------------------------------------------------------
# UNIT 3: SEQUENTIAL CIRCUITS
# -----------------------------------------------------------------------------

@router.post("/sequential/flip-flop/tick")
@router.post("/sequential/flipflop")
def simulate_flip_flop(request: FlipFlopTickRequest) -> Dict[str, Any]:
    try:
        return deam_service.simulate_flip_flop(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/sequential/register/shift")
@router.post("/sequential/register")
def simulate_register_shift(request: RegisterShiftRequest) -> Dict[str, Any]:
    try:
        return deam_service.simulate_register_shift(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/sequential/counter/tick")
@router.post("/sequential/counter")
def simulate_counter(request: CounterTickRequest) -> Dict[str, Any]:
    try:
        return deam_service.simulate_counter(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# -----------------------------------------------------------------------------
# FSM CONTROLLER
# -----------------------------------------------------------------------------

@router.get("/fsm/state")
def get_fsm_state(current_state: str = "IDLE") -> Dict[str, Any]:
    try:
        machine = fsm.ProductionFSM(current_state=current_state)
        return machine.get_state_info()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/fsm/transition")
def trigger_fsm_transition(request: FsmTransitionRequest) -> Dict[str, Any]:
    try:
        return deam_service.trigger_fsm_transition(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/fsm/reset")
def reset_fsm() -> Dict[str, Any]:
    try:
        machine = fsm.ProductionFSM(current_state="IDLE")
        machine.reset()
        return machine.get_state_info()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------------------------------------------------------
# VISION-TO-LOGIC DECISION BRIDGE
# -----------------------------------------------------------------------------

@router.post("/decision/from-flags")
@router.post("/inspection-decision")
def calculate_inspection_decision(request: InspectionDecisionFromFlagsRequest) -> Dict[str, Any]:
    try:
        return deam_service.calculate_inspection_decision(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/inspection-decision/from-sample")
def calculate_inspection_decision_for_sample(payload: Dict[str, str]) -> Dict[str, Any]:
    sample_id = payload.get("sample_id", "VG-001")
    try:
        return deam_service.calculate_inspection_decision_for_sample(sample_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
