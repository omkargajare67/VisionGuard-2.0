from fastapi import APIRouter
from backend.app.models.schemas import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Return system health status for VisionGuard 2.0 (Stage 4)."""
    return HealthResponse(
        status="running",
        project="VisionGuard 2.0",
        stage=4,
    )
