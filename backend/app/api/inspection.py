import cv2
import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile
from backend.app.models.schemas import AnalyzeSampleRequest, InspectionConfig, InspectionResult
from backend.app.vision.defect_detection import DefectDetector
from backend.app.vision.synthetic_samples import (
    SAMPLE_REGISTRY,
    generate_sample_image,
)

router = APIRouter(prefix="/api/inspection", tags=["inspection"])
detector = DefectDetector()

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/bmp",
}


@router.get("/config", response_model=InspectionConfig)
def get_inspection_config() -> InspectionConfig:
    """Return active inspection thresholds and region-of-interest configurations."""
    return detector.config


@router.post("/analyze-sample", response_model=InspectionResult)
def analyze_sample(request: AnalyzeSampleRequest) -> InspectionResult:
    """Run full optical inspection on a registered synthetic sample."""
    sample_id = request.sample_id
    if sample_id not in SAMPLE_REGISTRY:
        raise HTTPException(
            status_code=404,
            detail=f"Sample '{sample_id}' not found. Available samples: {list(SAMPLE_REGISTRY.keys())}",
        )

    try:
        img = generate_sample_image(sample_id)
        result = detector.analyze(img, sample_id_or_filename=sample_id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Inspection pipeline failure on sample '{sample_id}': {str(e)}",
        )


@router.post("/analyze", response_model=InspectionResult)
async def analyze_uploaded_image(file: UploadFile = File(...)) -> InspectionResult:
    """Accept multipart image upload (local file or webcam frame) and perform actual OpenCV inspection."""
    if file.content_type not in ALLOWED_MIME_TYPES and not file.filename.lower().endswith(
        (".jpg", ".jpeg", ".png", ".webp", ".bmp")
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image file format '{file.content_type}'. Supported: JPEG, PNG, WEBP, BMP.",
        )

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Uploaded file exceeds 10 MB limit.")

    try:
        nparr = np.frombuffer(content, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image file bytes.")

        result = detector.analyze(img, sample_id_or_filename=file.filename or "uploaded_image.jpg")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inspection failed during image processing: {str(e)}")
