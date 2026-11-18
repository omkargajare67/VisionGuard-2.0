"""FastAPI REST router for the Virtual Production Line and Automated Sorting System."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.models.schemas import (
    ProductionLineControllerModeRequest,
    ProductionLineFaultRequest,
    ProductionLineProductCreateRequest,
    ProductionLineSpeedRequest,
    ProductionLineTickRequest,
)
from backend.app.services.production_line_service import production_line_service

router = APIRouter(prefix="/api/production-line", tags=["production-line"])


@router.get("/status")
def get_production_line_status() -> Dict[str, Any]:
    """Operational status and feature matrix of the Stage 5 Virtual Production Line."""
    return production_line_service.get_status()


# -----------------------------------------------------------------------------
# Session Lifecycle & Controls
# -----------------------------------------------------------------------------

@router.post("/sessions/{session_id}")
def create_or_get_session(session_id: str) -> Dict[str, Any]:
    engine = production_line_service.get_or_create_session(session_id)
    return engine.get_state()


@router.get("/sessions/{session_id}")
def get_session_state(session_id: str) -> Dict[str, Any]:
    try:
        engine = production_line_service.get_session(session_id)
        return engine.get_state()
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/sessions/{session_id}/reset")
def reset_session(session_id: str) -> Dict[str, Any]:
    return production_line_service.reset_session(session_id)


@router.post("/sessions/{session_id}/start")
def start_line(session_id: str) -> Dict[str, Any]:
    return production_line_service.start_line(session_id)


@router.post("/sessions/{session_id}/stop")
def stop_line(session_id: str) -> Dict[str, Any]:
    return production_line_service.stop_line(session_id)


@router.post("/sessions/{session_id}/pause")
def pause_line(session_id: str) -> Dict[str, Any]:
    return production_line_service.pause_line(session_id)


@router.post("/sessions/{session_id}/resume")
def resume_line(session_id: str) -> Dict[str, Any]:
    return production_line_service.resume_line(session_id)


@router.post("/sessions/{session_id}/emergency-stop")
def emergency_stop(session_id: str) -> Dict[str, Any]:
    return production_line_service.emergency_stop(session_id)


@router.post("/sessions/{session_id}/clear-emergency")
def clear_emergency(session_id: str) -> Dict[str, Any]:
    return production_line_service.clear_emergency(session_id)


@router.post("/sessions/{session_id}/tick")
def tick_simulation(
    session_id: str, request: ProductionLineTickRequest
) -> Dict[str, Any]:
    return production_line_service.tick_simulation(session_id, steps=request.steps)


@router.post("/sessions/{session_id}/speed")
def set_speed(
    session_id: str, request: ProductionLineSpeedRequest
) -> Dict[str, Any]:
    return production_line_service.set_speed(session_id, speed=request.speed)


# -----------------------------------------------------------------------------
# Product Queue & Batch Ingestion
# -----------------------------------------------------------------------------

@router.post("/sessions/{session_id}/products")
def add_product(
    session_id: str, request: ProductionLineProductCreateRequest
) -> Dict[str, Any]:
    return production_line_service.add_product(
        session_id=session_id,
        name=request.name,
        sample_id=request.sample_id,
        custom_image_base64=request.custom_image_base64,
    )


@router.post("/sessions/{session_id}/batch-demo")
def add_batch_demo(session_id: str) -> Dict[str, Any]:
    """Enqueue all 6 standardized synthetic sample products (VG-001 through VG-006)."""
    return production_line_service.add_batch_demo(session_id)


@router.get("/sessions/{session_id}/products")
def get_products(session_id: str) -> Dict[str, Any]:
    try:
        engine = production_line_service.get_session(session_id)
        return {
            "queue": [p.to_dict() for p in engine.queue],
            "active": [p.to_dict() for p in engine.active_products],
            "completed": [p.to_dict() for p in reversed(engine.completed_products[-50:])],
        }
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/sessions/{session_id}/products/{product_id}")
def remove_product(session_id: str, product_id: str) -> Dict[str, Any]:
    return production_line_service.remove_product(session_id, product_id)


# -----------------------------------------------------------------------------
# Controller Mode & Subsystems
# -----------------------------------------------------------------------------

@router.post("/sessions/{session_id}/controller-mode")
def set_controller_mode(
    session_id: str, request: ProductionLineControllerModeRequest
) -> Dict[str, Any]:
    return production_line_service.set_controller_mode(session_id, request.mode)


@router.get("/sessions/{session_id}/sensors")
def get_sensors(session_id: str) -> Dict[str, Any]:
    try:
        engine = production_line_service.get_session(session_id)
        return engine.sensors.to_dict()
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/sessions/{session_id}/actuators")
def get_actuators(session_id: str) -> Dict[str, Any]:
    try:
        engine = production_line_service.get_session(session_id)
        return engine.actuators.to_dict()
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/sessions/{session_id}/metrics")
def get_metrics(session_id: str) -> Dict[str, Any]:
    try:
        engine = production_line_service.get_session(session_id)
        return engine.metrics.to_dict(
            active_count=len(engine.active_products),
            queued_count=len(engine.queue),
        )
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/sessions/{session_id}/metrics/reset")
def reset_metrics(session_id: str) -> Dict[str, Any]:
    try:
        engine = production_line_service.get_session(session_id)
        engine.metrics.reset()
        return engine.metrics.to_dict(
            active_count=len(engine.active_products),
            queued_count=len(engine.queue),
        )
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/sessions/{session_id}/events")
def get_events(
    session_id: str,
    limit: int = Query(50, ge=1, le=200),
    product_id: Optional[str] = None,
    event_type: Optional[str] = None,
) -> List[Dict[str, Any]]:
    try:
        engine = production_line_service.get_session(session_id)
        return engine.event_manager.get_events(
            limit=limit, product_id=product_id, event_type=event_type
        )
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


# -----------------------------------------------------------------------------
# Fault Injection & Handling
# -----------------------------------------------------------------------------

@router.post("/sessions/{session_id}/faults/inject")
def inject_fault(
    session_id: str, request: ProductionLineFaultRequest
) -> Dict[str, Any]:
    return production_line_service.inject_fault(session_id, request.fault_type)


@router.post("/sessions/{session_id}/faults/clear")
def clear_fault(session_id: str) -> Dict[str, Any]:
    return production_line_service.clear_fault(session_id)
