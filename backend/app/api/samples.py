import io
from typing import List
import cv2
from fastapi import APIRouter, HTTPException, Response
from backend.app.models.schemas import SampleMetadata
from backend.app.vision.synthetic_samples import (
    SAMPLE_REGISTRY,
    generate_sample_image,
    get_all_samples_metadata,
)

router = APIRouter(prefix="/api/samples", tags=["samples"])


@router.get("", response_model=List[SampleMetadata])
def list_samples() -> List[SampleMetadata]:
    """Retrieve catalog of pre-configured synthetic industrial inspection samples."""
    return get_all_samples_metadata()


@router.get("/{sample_id}/image")
def get_sample_image(sample_id: str):
    """Retrieve raw benchmark JPEG image for a given synthetic sample ID."""
    if sample_id not in SAMPLE_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Sample '{sample_id}' not found.")

    try:
        img = generate_sample_image(sample_id)
        success, encoded = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 92])
        if not success:
            raise HTTPException(status_code=500, detail="Image encoding failed.")
        return Response(content=encoded.tobytes(), media_type="image/jpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate sample image: {str(e)}")
