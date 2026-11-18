from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# -----------------------------------------------------------------------------
# STAGE 1 & 2 SCHEMAS
# -----------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str = Field(..., examples=["running"])
    project: str = Field(..., examples=["VisionGuard 2.0"])
    stage: int = Field(..., examples=[3])


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
    min_solidity_threshold: float = 0.985
    scratch_threshold_pixels: int = 40


# -----------------------------------------------------------------------------
# STAGE 3: DEAM DIGITAL ELECTRONICS SCHEMAS
# -----------------------------------------------------------------------------

# Unit 1: Logic Gates & Boolean
class GateEvaluateRequest(BaseModel):
    gate: str = Field(..., examples=["AND"])
    a: int = Field(..., ge=0, le=1, examples=[1])
    b: int = Field(0, ge=0, le=1, examples=[1])


class GateEvaluateResponse(BaseModel):
    gate: str
    inputs: Dict[str, int]
    output: int
    name: str
    symbol: str
    expression: str
    description: str


class GateTruthTableRequest(BaseModel):
    gate: str = Field(..., examples=["NAND"])


class GateTruthTableResponse(BaseModel):
    gate: str
    name: str
    expression: str
    table: List[Dict[str, int]]


class BooleanEvaluateRequest(BaseModel):
    expression: str = Field(..., examples=["(A AND B) OR NOT(C)"])
    variables: Dict[str, int] = Field(..., examples=[{"A": 1, "B": 0, "C": 1}])


class BooleanTruthTableRequest(BaseModel):
    expression: str = Field(..., examples=["A · B + ¬C"])


# Unit 1: K-Map
class KMapSimplifyRequest(BaseModel):
    num_vars: int = Field(..., ge=2, le=4, examples=[3])
    minterms: List[int] = Field(..., examples=[0, 1, 2, 5])
    dont_cares: Optional[List[int]] = Field(default=None, examples=[7])


# Unit 2: Combinational
class HalfAdderRequest(BaseModel):
    a: int = Field(..., ge=0, le=1, examples=[1])
    b: int = Field(..., ge=0, le=1, examples=[1])


class FullAdderRequest(BaseModel):
    a: int = Field(..., ge=0, le=1, examples=[1])
    b: int = Field(..., ge=0, le=1, examples=[0])
    cin: int = Field(..., ge=0, le=1, examples=[1])


class MultiplexerRequest(BaseModel):
    data_inputs: List[int] = Field(..., examples=[1, 0, 1, 0])
    select_inputs: List[int] = Field(..., examples=[1, 0])


class DecoderRequest(BaseModel):
    inputs: List[int] = Field(..., examples=[1, 0])
    enable: int = Field(1, ge=0, le=1, examples=[1])


class PriorityEncoderRequest(BaseModel):
    inputs: List[int] = Field(..., examples=[0, 1, 0, 0])


class ParityRequest(BaseModel):
    data_bits: List[int] = Field(..., examples=[1, 0, 1, 1])
    parity_type: str = Field("even", examples=["even", "odd"])
    received_parity: Optional[int] = Field(None, ge=0, le=1, examples=[1])


# Unit 3: Sequential
class FlipFlopTickRequest(BaseModel):
    ff_type: str = Field(..., examples=["JK"])  # "SR", "JK", "D", "T"
    inputs: Dict[str, int] = Field(..., examples=[{"J": 1, "K": 0}])
    q_current: int = Field(0, ge=0, le=1, examples=[0])
    clock: int = Field(1, ge=0, le=1, examples=[1])
    async_set: int = Field(0, ge=0, le=1)
    async_reset: int = Field(0, ge=0, le=1)


class RegisterShiftRequest(BaseModel):
    reg_type: str = Field(..., examples=["SIPO"])  # "SISO", "SIPO", "PISO", "PIPO"
    current_state: List[int] = Field(..., examples=[1, 0, 0, 1])
    serial_in: int = Field(0, ge=0, le=1, examples=[1])
    parallel_in: Optional[List[int]] = Field(None, examples=[0, 1, 1, 0])
    shift_dir: str = Field("right", examples=["right", "left"])
    load_parallel: bool = Field(False)


class CounterTickRequest(BaseModel):
    counter_type: str = Field("up", examples=["up", "down", "modulo"])
    current_value: int = Field(0, ge=0, examples=[5])
    bits: int = Field(4, ge=2, le=8, examples=[4])
    modulo: int = Field(16, ge=2, le=256, examples=[10])
    enable: int = Field(1, ge=0, le=1, examples=[1])
    reset: int = Field(0, ge=0, le=1, examples=[0])


# FSM
class FsmTransitionRequest(BaseModel):
    current_state: str = Field("IDLE", examples=["IDLE"])
    event: str = Field(..., examples=["PRODUCT_DETECTED"])


# Vision to Logic Bridge
class InspectionDecisionFromFlagsRequest(BaseModel):
    flags: Optional[InspectionFlags] = None
    d: Optional[int] = Field(None, ge=0, le=1)
    s: Optional[int] = Field(None, ge=0, le=1)
    c: Optional[int] = Field(None, ge=0, le=1)
    l: Optional[int] = Field(None, ge=0, le=1)
    m: Optional[int] = Field(None, ge=0, le=1)
    g: Optional[int] = Field(None, ge=0, le=1)
    D: Optional[int] = Field(None, ge=0, le=1)
    S: Optional[int] = Field(None, ge=0, le=1)
    C: Optional[int] = Field(None, ge=0, le=1)
    L: Optional[int] = Field(None, ge=0, le=1)
    M: Optional[int] = Field(None, ge=0, le=1)
    G: Optional[int] = Field(None, ge=0, le=1)
