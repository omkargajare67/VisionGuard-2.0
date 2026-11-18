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

// -----------------------------------------------------------------------------
// STAGE 3: DEAM DIGITAL ELECTRONICS TYPES
// -----------------------------------------------------------------------------

export interface GateEvaluateResult {
  gate: string;
  inputs: Record<string, number>;
  output: number;
  name: string;
  symbol: string;
  expression: string;
  description: string;
}

export interface GateTruthTableResult {
  gate: string;
  name: string;
  expression: string;
  table: Array<Record<string, number>>;
}

export interface BooleanEvaluateResult {
  expression: string;
  normalized: string;
  variables: Record<string, number>;
  output: number;
}

export interface BooleanTruthTableResult {
  expression: string;
  variables: string[];
  table: Array<Record<string, number>>;
  minterms: number[];
  maxterms: number[];
}

export interface KMapGroup {
  cells: number[];
  term: string;
  size: number;
  implicant: string;
}

export interface KMapResult {
  num_vars: number;
  variables: string[];
  row_var: string;
  col_var: string;
  row_labels: string[];
  col_labels: string[];
  cell_matrix: number[][];
  grid_values: string[][];
  minterms: number[];
  dont_cares: number[];
  prime_implicants: string[];
  groups: KMapGroup[];
  simplified_expression: string;
  verified: boolean;
  verification_errors: string[];
}

export interface HalfAdderResult {
  inputs: { A: number; B: number };
  outputs: { Sum: number; Carry: number };
  equations: { Sum: string; Carry: string };
  intermediate: Record<string, string>;
  truth_table: Array<{ A: number; B: number; Sum: number; Carry: number }>;
}

export interface FullAdderResult {
  inputs: { A: number; B: number; Cin: number };
  outputs: { Sum: number; Cout: number };
  equations: { Sum: string; Cout: string };
  intermediate: Record<string, any>;
  truth_table: Array<{ A: number; B: number; Cin: number; Sum: number; Cout: number }>;
}

export interface MultiplexerResult {
  mux_type: string;
  data_inputs: Record<string, number>;
  select_inputs: Record<string, number>;
  selected_channel: number;
  output: number;
  equation: string;
}

export interface DecoderResult {
  decoder_type: string;
  enable: number;
  inputs: Record<string, number>;
  selected_channel: number | null;
  outputs: Record<string, number>;
  active_line: string;
}

export interface PriorityEncoderResult {
  encoder_type: string;
  inputs: Record<string, number>;
  highest_active_input: string;
  valid: number;
  outputs: Record<string, number>;
  priority_order: string;
}

export interface ParityResult {
  data_bits: number[];
  parity_type: string;
  xor_sum: number;
  generated_parity: number;
  transmitted_frame: number[];
  equation: string;
  checker: {
    received_parity: number;
    total_ones: number;
    error_detected: boolean;
    status: string;
  } | null;
}

export interface FlipFlopResult {
  type: string;
  inputs?: Record<string, number>;
  q_current: number;
  q_bar_current: number;
  q_next: number | null;
  q_bar_next: number | null;
  operation: string;
  details: string;
  characteristic_equation: string;
}

export interface RegisterResult {
  reg_type: string;
  size: number;
  operation: string;
  previous_state: number[];
  serial_in: number;
  parallel_in: number[] | null;
  current_state: number[];
  outputs: Record<string, any>;
  binary_representation: string;
  decimal_value: number;
}

export interface CounterResult {
  counter_type: string;
  bits: number;
  modulo: number;
  enable: number;
  reset: number;
  previous_value: number;
  next_value: number;
  binary_state: number[];
  binary_string: string;
  overflow: number;
  underflow: number;
  terminal_count: number;
  operation: string;
}

export interface FsmStateResult {
  current_state: string;
  all_states: string[];
  moore_outputs: {
    conveyor_motor: number;
    camera_trigger: number;
    inspection_active: number;
    servo_gate_actuate: number;
    status_code: number;
    description: string;
  };
  allowed_events: string[];
  history: Array<{
    from_state: string;
    event: string;
    to_state: string;
    valid: boolean;
    note: string;
  }>;
}

export interface FsmTransitionResult {
  previous_state: string;
  event: string;
  current_state: string;
  transition_valid: boolean;
  error?: string;
  moore_outputs: {
    conveyor_motor: number;
    camera_trigger: number;
    inspection_active: number;
    servo_gate_actuate: number;
    status_code: number;
    description: string;
  };
  allowed_events: string[];
  history: Array<{
    from_state: string;
    event: string;
    to_state: string;
    valid: boolean;
    note: string;
  }>;
}

export interface GateTraceStep {
  gate_id: string;
  type: string;
  input?: string;
  inputs?: string;
  output: string;
  description: string;
}

export interface InspectionDecisionResult {
  inputs: {
    D: number;
    S: number;
    C: number;
    L: number;
    M: number;
    G: number;
  };
  intermediate_signals: {
    not_C: number;
    not_L: number;
    not_M: number;
    not_G: number;
    not_F: number;
  };
  defect_signal: number;
  pass_output: number;
  reject_output: number;
  decision: 'PASS' | 'REJECT' | 'UNREADABLE';
  verdict_summary: string;
  boolean_expression: string;
  gate_trace: GateTraceStep[];
  fault_reasons: string[];
}
