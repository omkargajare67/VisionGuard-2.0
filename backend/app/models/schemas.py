from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., examples=["running"])
    project: str = Field(..., examples=["VisionGuard 2.0"])
    stage: int = Field(..., examples=[1])
