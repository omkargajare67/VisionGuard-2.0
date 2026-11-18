export interface HealthResponse {
  status: string;
  project: string;
  stage: number;
}

export interface HealthCheckRecord {
  id: string;
  timestamp: string;
  latencyMs: number;
  success: boolean;
  data?: HealthResponse;
  error?: string;
}

export interface RoadmapStage {
  id: number;
  title: string;
  subtitle: string;
  status: 'active' | 'pending' | 'completed';
  topics: string[];
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IndividualCheck {
  check_name: string;
  passed: boolean;
  binary_flag: number;
  measured_value: string;
  threshold: string;
  details: string;
  bbox?: BoundingBox;
}

export interface InspectionFlags {
  product_detected: number;
  label_present: number;
  marking_correct: number;
  components_complete: number;
  geometry_ok: number;
  surface_defect_detected: number;
}

export interface SampleMetadata {
  sample_id: string;
  name: string;
  defect_category: string;
  expected_condition: string;
  expected_status: 'PASS' | 'REJECT';
  description: string;
}

export interface InspectionResult {
  sample_id_or_filename: string;
  timestamp: string;
  processing_time_ms: number;
  status: 'PASS' | 'REJECT' | 'UNREADABLE';
  product_bounding_box?: BoundingBox;
  flags: InspectionFlags;
  checks: Record<string, IndividualCheck>;
  defect_descriptions: string[];
  annotated_image: string;
  edge_image: string;
  processed_image: string;
  grayscale_image?: string;
  enhanced_image?: string;
}

export interface InspectionConfig {
  image_resolution: [number, number];
  expected_product_roi: BoundingBox;
  label_roi: BoundingBox;
  marking_roi: BoundingBox;
  component_rois: BoundingBox[];
  hsv_blue_range: { lower: number[]; upper: number[] };
  min_label_brightness: number;
  min_component_edge_density: number;
  min_solidity_threshold: number;
  scratch_threshold_pixels: number;
}
