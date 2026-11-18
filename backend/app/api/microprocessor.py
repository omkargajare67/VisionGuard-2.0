from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException
from backend.app.models.schemas import (
    AssemblyLoadRequest,
    InterruptRaiseRequest,
    MemoryDumpRequest,
    PPIConfigureRequest,
    PPIImportSampleRequest,
    PPIImportVisionRequest,
    PPIWriteRequest,
    RunExecutionRequest,
    TimerConfigureRequest,
    TimerTickRequest,
)
from backend.app.services.microprocessor_service import microprocessor_service

router = APIRouter(prefix="/api/microprocessor", tags=["microprocessor"])


@router.get("/status")
def get_microprocessor_status() -> Dict[str, Any]:
    """Return operational capabilities of the Intel 8086 & 8255 PPI simulation engine."""
    return {
        "status": "operational",
        "stage": 4,
        "engine": "Intel 8086 Microprocessor & Intel 8255 PPI Simulator",
        "features": {
            "register_model": "16-bit registers (AX, BX, CX, DX, SP, BP, SI, DI, CS, DS, SS, ES, IP, FLAGS)",
            "aliasing": "8-bit high/low byte aliases (AH, AL, BH, BL, CH, CL, DH, DL)",
            "memory": "1 MB physical segmented memory (20-bit address bus)",
            "biu": "Bus Interface Unit with 6-byte instruction prefetch queue",
            "eu": "Execution Unit with ALU and conditional flags",
            "ppi": "Intel 8255 PPI (Mode 0, Mode 1, BSR mode, ports 80H-83H)",
            "interrupts": "256-vector IVT, NMI, INTR, software INT, and IRET",
            "timers": "8253-inspired programmable interval timer (Mode 0 & Mode 3)",
            "vision_integration": "Direct mapping of OpenCV feature flags into Port A (80H) and actuator outputs on Port B (81H)",
        },
    }


@router.get("/examples")
def get_example_programs() -> Dict[str, Any]:
    """Return catalog of preloaded educational 8086 assembly programs."""
    return microprocessor_service.get_example_programs()


# -----------------------------------------------------------------------------
# Session Lifecycle & Execution Endpoints
# -----------------------------------------------------------------------------

@router.post("/sessions/{session_id}")
def create_or_get_session(session_id: str) -> Dict[str, Any]:
    cpu = microprocessor_service.get_or_create_session(session_id)
    return cpu.get_full_state()


@router.get("/sessions/{session_id}")
def get_session_state(session_id: str) -> Dict[str, Any]:
    try:
        return microprocessor_service.get_state(session_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/sessions/{session_id}/reset")
def reset_session(session_id: str) -> Dict[str, Any]:
    return microprocessor_service.reset_session(session_id)


@router.post("/sessions/{session_id}/load")
def load_assembly_program(session_id: str, request: AssemblyLoadRequest) -> Dict[str, Any]:
    res = microprocessor_service.assemble_and_load(
        session_id=session_id,
        source_code=request.code,
        base_offset=request.base_offset,
    )
    if not res["success"]:
        raise HTTPException(status_code=400, detail={"errors": res["errors"]})
    return res


@router.post("/sessions/{session_id}/step")
def step_instruction(session_id: str) -> Dict[str, Any]:
    try:
        return microprocessor_service.step(session_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/sessions/{session_id}/run")
def run_program(session_id: str, request: RunExecutionRequest) -> Dict[str, Any]:
    try:
        return microprocessor_service.run(session_id, max_steps=request.max_steps)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


# -----------------------------------------------------------------------------
# Registers, Memory & Stack Inspection
# -----------------------------------------------------------------------------

@router.get("/sessions/{session_id}/registers")
def get_registers(session_id: str) -> Dict[str, Any]:
    try:
        cpu = microprocessor_service.get_session(session_id)
        return {
            "registers": cpu.registers.to_dict(),
            "flags": cpu.registers.flags.to_dict(),
        }
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/sessions/{session_id}/memory")
def get_memory_dump(session_id: str, request: MemoryDumpRequest) -> List[Dict[str, Any]]:
    try:
        return microprocessor_service.get_memory_dump(
            session_id=session_id,
            segment=request.segment,
            offset=request.offset,
            count=request.count,
        )
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/sessions/{session_id}/stack")
def get_stack_view(session_id: str, depth: int = 8) -> List[Dict[str, Any]]:
    try:
        return microprocessor_service.get_stack_view(session_id=session_id, depth=depth)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


# -----------------------------------------------------------------------------
# Intel 8255 PPI Endpoints
# -----------------------------------------------------------------------------

@router.get("/sessions/{session_id}/ppi")
def get_ppi_state(session_id: str) -> Dict[str, Any]:
    try:
        cpu = microprocessor_service.get_session(session_id)
        return cpu.ppi.to_dict()
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/sessions/{session_id}/ppi/configure")
def configure_ppi(session_id: str, request: PPIConfigureRequest) -> Dict[str, Any]:
    try:
        return microprocessor_service.configure_ppi(session_id, request.control_word)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/sessions/{session_id}/ppi/write")
def write_ppi_port(session_id: str, request: PPIWriteRequest) -> Dict[str, Any]:
    try:
        return microprocessor_service.write_ppi_port(session_id, request.port, request.value)
    except (KeyError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/sessions/{session_id}/ppi/import-vision")
def import_vision_flags(session_id: str, request: PPIImportVisionRequest) -> Dict[str, Any]:
    try:
        d = request.D if request.D is not None else (request.d if request.d is not None else 1)
        s = request.S if request.S is not None else (request.s if request.s is not None else 0)
        c = request.C if request.C is not None else (request.c if request.c is not None else 1)
        l = request.L if request.L is not None else (request.l if request.l is not None else 1)
        m = request.M if request.M is not None else (request.m if request.m is not None else 1)
        g = request.G if request.G is not None else (request.g if request.g is not None else 1)

        return microprocessor_service.import_vision_flags(
            session_id=session_id, d=d, s=s, c=c, l=l, m=m, g=g
        )
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/sessions/{session_id}/ppi/import-sample")
def import_sample_flags(session_id: str, request: PPIImportSampleRequest) -> Dict[str, Any]:
    try:
        return microprocessor_service.import_sample_flags(session_id, request.sample_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


# -----------------------------------------------------------------------------
# Interrupts & Timers
# -----------------------------------------------------------------------------

@router.post("/sessions/{session_id}/interrupts/raise")
def raise_interrupt(session_id: str, request: InterruptRaiseRequest) -> Dict[str, Any]:
    try:
        return microprocessor_service.raise_interrupt(
            session_id=session_id,
            int_type=request.type,
            vector=request.vector,
        )
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/sessions/{session_id}/timer/configure")
def configure_timer(session_id: str, request: TimerConfigureRequest) -> Dict[str, Any]:
    try:
        return microprocessor_service.configure_timer(
            session_id=session_id,
            mode=request.mode,
            count=request.count,
        )
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/sessions/{session_id}/timer/tick")
def tick_timer(session_id: str, request: TimerTickRequest) -> Dict[str, Any]:
    try:
        return microprocessor_service.tick_timer(
            session_id=session_id,
            ticks=request.ticks,
        )
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
