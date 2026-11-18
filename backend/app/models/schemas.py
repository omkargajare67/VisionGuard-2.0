from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., examples=["running"])
    project: str = Field(..., examples=["VisionGuard 2.0"])
    stage: int = Field(..., examples=[1])


class BoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int


class IndividualCheck(BaseModel):
    check_name: str
    passed: bool
    binary_flag: int  # 1 = passed/satisfied, 0 = failed/not satisfied
    measured_value: str
    threshold: str
    details: str
    bbox: Optional[BoundingBox] = None


class InspectionFlags(BaseModel):
    product_detected: int = Field(..., description="1 = Detected, 0 = Missing/Unreadable")
    label_present: int = Field(..., description="1 = Label present, 0 = Missing")
    marking_correct: int = Field(..., description="1 = Correct Blue, 0 = Incorrect colour")
    components_complete: int = Field(..., description="1 = All 3 present, 0 = Missing component")
    geometry_ok: int = Field(..., description="1 = Nominal contour/dimensions, 0 = Contour defect")
    surface_defect_detected: int = Field(..., description="1 = Scratch detected, 0 = Clean surface")


class SampleMetadata(BaseModel):
    sample_id: str
    name: str
    defect_category: str
    expected_condition: str
    expected_status: str  # "PASS" or "REJECT"
    description: str


class InspectionResult(BaseModel):
    sample_id_or_filename: str
    timestamp: str
    processing_time_ms: float
    status: str  # "PASS" | "REJECT" | "UNREADABLE"
    product_bounding_box: Optional[BoundingBox] = None
    flags: InspectionFlags
    checks: Dict[str, IndividualCheck]
    defect_descriptions: List[str]
    annotated_image: str  # Base64 data URL
    edge_image: str  # Base64 data URL
    processed_image: str  # Base64 data URL
    grayscale_image: Optional[str] = None  # Base64 data URL
    enhanced_image: Optional[str] = None  # Base64 data URL


class AnalyzeSampleRequest(BaseModel):
    sample_id: str = Field(..., examples=["VG-001"])


class InspectionConfig(BaseModel):
    image_resolution: List[int] = [640, 480]
    expected_product_roi: BoundingBox = BoundingBox(x=120, y=90, width=400, height=300)
    label_roi: BoundingBox = BoundingBox(x=160, y=130, width=150, height=80)
    marking_roi: BoundingBox = BoundingBox(x=380, y=130, width=80, height=80)
    component_rois: List[BoundingBox] = [
        BoundingBox(x=175, y=275, width=50, height=50),
        BoundingBox(x=295, y=275, width=50, height=50),
        BoundingBox(x=415, y=275, width=50, height=50),
    ]
    hsv_blue_range: Dict[str, List[int]] = {
        "lower": [95, 100, 80],
        "upper": [135, 255, 255],
    }
    min_label_brightness: float = 200.0
    min_component_edge_density: float = 0.04
    min_solidity_threshold: float = 0.96
    scratch_threshold_pixels: int = 40
