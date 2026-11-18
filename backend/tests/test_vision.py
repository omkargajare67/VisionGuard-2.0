import io
import cv2
from fastapi.testclient import TestClient
import numpy as np
import pytest

from backend.app.main import app
from backend.app.vision.defect_detection import DefectDetector
from backend.app.vision.preprocessing import preprocess_image, validate_image
from backend.app.vision.synthetic_samples import (
    generate_sample_image,
    get_all_samples_metadata,
)

client = TestClient(app)
detector = DefectDetector()


# -----------------------------------------------------------------------------
# 1. SYNTHETIC SAMPLE GENERATION TESTS
# -----------------------------------------------------------------------------

def test_synthetic_samples_catalog():
    samples = get_all_samples_metadata()
    assert len(samples) == 6
    ids = [s.sample_id for s in samples]
    assert ids == ["VG-001", "VG-002", "VG-003", "VG-004", "VG-005", "VG-006"]


def test_synthetic_image_dimensions_and_channels():
    for sid in ["VG-001", "VG-002", "VG-003", "VG-004", "VG-005", "VG-006"]:
        img = generate_sample_image(sid)
        assert img is not None
        assert img.shape == (480, 640, 3)
        assert img.dtype == np.uint8


# -----------------------------------------------------------------------------
# 2. DEFECT DETECTION TESTS (ALL 6 SAMPLES THROUGH ACTUAL OPENCV PIPELINE)
# -----------------------------------------------------------------------------

def test_vg001_nominal_product_passes():
    img = generate_sample_image("VG-001")
    res = detector.analyze(img, "VG-001")
    assert res.status == "PASS"
    assert res.flags.product_detected == 1
    assert res.flags.label_present == 1
    assert res.flags.marking_correct == 1
    assert res.flags.components_complete == 1
    assert res.flags.geometry_ok == 1
    assert res.flags.surface_defect_detected == 0
    assert len(res.defect_descriptions) == 0


def test_vg002_missing_label_defect():
    img = generate_sample_image("VG-002")
    res = detector.analyze(img, "VG-002")
    assert res.status == "REJECT"
    assert res.flags.product_detected == 1
    assert res.flags.label_present == 0  # Missing label
    assert res.flags.marking_correct == 1
    assert res.flags.components_complete == 1
    assert res.flags.geometry_ok == 1
    assert res.flags.surface_defect_detected == 0
    assert any("label" in d.lower() for d in res.defect_descriptions)


def test_vg003_incorrect_color_defect():
    img = generate_sample_image("VG-003")
    res = detector.analyze(img, "VG-003")
    assert res.status == "REJECT"
    assert res.flags.product_detected == 1
    assert res.flags.label_present == 1
    assert res.flags.marking_correct == 0  # Non-blue marking
    assert res.flags.components_complete == 1
    assert res.flags.geometry_ok == 1
    assert res.flags.surface_defect_detected == 0
    assert any("colour" in d.lower() or "color" in d.lower() for d in res.defect_descriptions)


def test_vg004_missing_component_defect():
    img = generate_sample_image("VG-004")
    res = detector.analyze(img, "VG-004")
    assert res.status == "REJECT"
    assert res.flags.product_detected == 1
    assert res.flags.label_present == 1
    assert res.flags.marking_correct == 1
    assert res.flags.components_complete == 0  # Missing C2
    assert res.flags.geometry_ok == 1
    assert res.flags.surface_defect_detected == 0
    assert any("component" in d.lower() for d in res.defect_descriptions)


def test_vg005_structural_contour_defect():
    img = generate_sample_image("VG-005")
    res = detector.analyze(img, "VG-005")
    assert res.status == "REJECT"
    assert res.flags.product_detected == 1
    assert res.flags.label_present == 1
    assert res.flags.marking_correct == 1
    assert res.flags.components_complete == 1
    assert res.flags.geometry_ok == 0  # Broken contour/corner notch
    assert res.flags.surface_defect_detected == 0
    assert any("contour" in d.lower() or "structural" in d.lower() for d in res.defect_descriptions)


def test_vg006_surface_scratch_defect():
    img = generate_sample_image("VG-006")
    res = detector.analyze(img, "VG-006")
    assert res.status == "REJECT"
    assert res.flags.product_detected == 1
    assert res.flags.label_present == 1
    assert res.flags.marking_correct == 1
    assert res.flags.components_complete == 1
    assert res.flags.geometry_ok == 1
    assert res.flags.surface_defect_detected == 1  # Scratch detected
    assert any("scratch" in d.lower() for d in res.defect_descriptions)


def test_blind_inspection_sample_name_independence():
    """Verify inspection algorithms work purely on image pixels without relying on sample names."""
    expected_flags = {
        "VG-001": (1, 1, 1, 1, 1, 0),
        "VG-002": (1, 0, 1, 1, 1, 0),
        "VG-003": (1, 1, 0, 1, 1, 0),
        "VG-004": (1, 1, 1, 0, 1, 0),
        "VG-005": (1, 1, 1, 1, 0, 0),
        "VG-006": (1, 1, 1, 1, 1, 1),
    }
    for sid, flags in expected_flags.items():
        img = generate_sample_image(sid)
        # Pass anonymous filename to guarantee zero ID-based cheating
        res = detector.analyze(img, sample_id_or_filename="anonymous_stream_frame.jpg")
        actual_tuple = (
            res.flags.product_detected,
            res.flags.label_present,
            res.flags.marking_correct,
            res.flags.components_complete,
            res.flags.geometry_ok,
            res.flags.surface_defect_detected,
        )
        assert actual_tuple == flags, f"Flag mismatch on anonymous inspection of {sid}: {actual_tuple} != {flags}"


# -----------------------------------------------------------------------------
# 3. PREPROCESSING & INVALID IMAGE TESTS
# -----------------------------------------------------------------------------

def test_preprocessing_pipeline_outputs():
    img = generate_sample_image("VG-001")
    prep = preprocess_image(img, 640, 480)
    assert prep.original.shape == (480, 640, 3)
    assert prep.grayscale.shape == (480, 640)
    assert prep.edges.shape == (480, 640)
    assert prep.clahe.shape == (480, 640)


def test_invalid_image_detection():
    # Empty image
    empty_img = np.zeros((0, 0), dtype=np.uint8)
    valid, msg = validate_image(empty_img)
    assert not valid

    # Too small image
    tiny_img = np.zeros((10, 10, 3), dtype=np.uint8)
    valid, msg = validate_image(tiny_img)
    assert not valid

    # Running detector on blank canvas (no product) -> UNREADABLE
    blank = np.full((480, 640, 3), 240, dtype=np.uint8)
    res = detector.analyze(blank, "blank_canvas")
    assert res.status == "UNREADABLE"
    assert res.flags.product_detected == 0


# -----------------------------------------------------------------------------
# 4. API ENDPOINT TESTS
# -----------------------------------------------------------------------------

def test_api_get_samples_catalog():
    resp = client.get("/api/samples")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 6
    assert data[0]["sample_id"] == "VG-001"
    assert data[0]["expected_status"] == "PASS"


def test_api_get_sample_image():
    resp = client.get("/api/samples/VG-001/image")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "image/jpeg"
    assert len(resp.content) > 1000

    # Non-existent sample
    resp404 = client.get("/api/samples/VG-999/image")
    assert resp404.status_code == 404


def test_api_analyze_sample():
    resp = client.post("/api/inspection/analyze-sample", json={"sample_id": "VG-001"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "PASS"
    assert data["flags"]["product_detected"] == 1
    assert "data:image/" in data["annotated_image"]

    # Test reject sample through API
    resp_reject = client.post("/api/inspection/analyze-sample", json={"sample_id": "VG-002"})
    assert resp_reject.status_code == 200
    data_reject = resp_reject.json()
    assert data_reject["status"] == "REJECT"
    assert data_reject["flags"]["label_present"] == 0

    # Test 404 on invalid sample ID
    resp_invalid = client.post("/api/inspection/analyze-sample", json={"sample_id": "VG-INVALID-ID"})
    assert resp_invalid.status_code == 404


def test_api_analyze_uploaded_image():
    img = generate_sample_image("VG-001")
    _, buffer = cv2.imencode(".jpg", img)
    file_bytes = io.BytesIO(buffer.tobytes())

    resp = client.post(
        "/api/inspection/analyze",
        files={"file": ("test_nominal.jpg", file_bytes, "image/jpeg")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "PASS"
    assert data["flags"]["product_detected"] == 1


def test_api_analyze_upload_error_cases():
    # Empty file
    r_empty = client.post(
        "/api/inspection/analyze",
        files={"file": ("empty.jpg", io.BytesIO(b""), "image/jpeg")},
    )
    assert r_empty.status_code == 400

    # Unsupported MIME format
    r_txt = client.post(
        "/api/inspection/analyze",
        files={"file": ("notes.txt", io.BytesIO(b"not an image"), "text/plain")},
    )
    assert r_txt.status_code == 400

    # Corrupt image bytes
    r_corrupt = client.post(
        "/api/inspection/analyze",
        files={"file": ("corrupt.jpg", io.BytesIO(b"INVALID_HEADER_GARBAGE"), "image/jpeg")},
    )
    assert r_corrupt.status_code == 400


def test_api_inspection_config():
    resp = client.get("/api/inspection/config")
    assert resp.status_code == 200
    data = resp.json()
    assert "expected_product_roi" in data
    assert "hsv_blue_range" in data
