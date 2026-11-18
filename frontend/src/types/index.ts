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

// -----------------------------------------------------------------------------
// STAGE 4: INTEL 8086 MICROPROCESSOR & INTEL 8255 PPI TYPES
// -----------------------------------------------------------------------------

export interface FlagsState {
  value: number;
  hex: string;
  binary: string;
  flags: {
    CF: number;
    PF: number;
    AF: number;
    ZF: number;
    SF: number;
    TF: number;
    IF: number;
    DF: number;
    OF: number;
  };
}

export interface GeneralRegister {
  hex: string;
  dec: number;
  bin: string;
  H: string;
  L: string;
}

export interface PointerRegister {
  hex: string;
  dec: number;
  bin: string;
}

export interface SegmentRegister {
  hex: string;
  dec: number;
  base_physical: string;
}

export interface Registers8086State {
  general: {
    AX: GeneralRegister;
    BX: GeneralRegister;
    CX: GeneralRegister;
    DX: GeneralRegister;
  };
  pointers: {
    SP: PointerRegister;
    BP: PointerRegister;
    SI: PointerRegister;
    DI: PointerRegister;
  };
  segments: {
    CS: SegmentRegister;
    DS: SegmentRegister;
    SS: SegmentRegister;
    ES: SegmentRegister;
  };
  special: {
    IP: { hex: string; dec: number; physical: string };
    FLAGS: FlagsState;
  };
}

export interface InstructionDTO {
  mnemonic: string;
  offset: string;
  size: number;
  bytecode: string[];
  bytecode_raw: number[];
  source: string;
  line_number: number;
  operands: Array<{
    type: string;
    value: any;
    is_16bit: boolean;
    raw: string;
  }>;
}

export interface MemoryDumpRow {
  segment: string;
  offset: string;
  physical_address: string;
  bytes: number[];
  hex_view: string;
  ascii_view: string;
}

export interface StackSlot {
  depth_index: number;
  offset: string;
  physical: string;
  word_value: number;
  hex_word: string;
  low_byte: string;
  high_byte: string;
}

export interface BusState {
  address_bus: string;
  data_bus: string;
  control_signals: Record<string, number>;
  last_transaction: string;
  cycle_count: number;
  recent_history: Array<{
    cycle: number;
    type: string;
    address: string;
    data: string;
    control_signals: Record<string, number>;
    description: string;
  }>;
}

export interface PPIState {
  base_address: string;
  ports_mapping: {
    PORT_A: string;
    PORT_B: string;
    PORT_C: string;
    CONTROL: string;
  };
  control_word: {
    hex: string;
    binary: string;
    last_bsr: string | null;
  };
  configuration: {
    port_a_direction: string;
    port_b_direction: string;
    port_c_upper_direction: string;
    port_c_lower_direction: string;
    group_a_mode: string;
    group_b_mode: string;
  };
  port_values: {
    PORT_A: { val: number; hex: string; bin: string };
    PORT_B: { val: number; hex: string; bin: string };
    PORT_C: { val: number; hex: string; bin: string };
  };
  handshake_signals: {
    STB_A: number;
    IBF_A: number;
    INTR_A: number;
    OBF_B: number;
    ACK_B: number;
    INTR_B: number;
  };
  actuators: {
    raw_byte: number;
    hex: string;
    binary: string;
    conveyor_motor: number;
    reject_gate: number;
    green_led: number;
    red_led: number;
    buzzer: number;
    busy: number;
    decision: 'PASS' | 'REJECT' | 'IDLE';
  };
}

export interface TimerState {
  total_ticks: number;
  channel0: {
    channel: number;
    mode: string;
    initial_count: number;
    current_count: number;
    out_pin: number;
    terminal_count: boolean;
    enabled: boolean;
  };
  ticks_advanced?: number;
  triggered_interrupts?: number;
}

export interface CPUFullState {
  session_id: string;
  step_count: number;
  halted: boolean;
  registers: Registers8086State;
  flags: FlagsState;
  biu: {
    prefetch_queue: string[];
    queue_capacity: number;
    queue_occupancy: number;
    ip_fetch: string;
    physical_fetch: string;
  };
  bus: BusState;
  ppi: PPIState;
  timers: TimerState;
  current_instruction: InstructionDTO | null;
  cycles?: number;
  prefetch_queue?: number[];
  execution_trace?: ExecutionTraceItem[];
}

export interface ExecutionTraceItem {
  step: number;
  address: string;
  instruction: string;
  bytecode: string;
  details: string;
  cycles: number;
}

export interface StepResultDTO {
  step_number: number;
  type: string;
  instruction_text: string;
  mnemonic: string;
  address: string;
  physical_address: string;
  bytecode: string[];
  previous_registers: Registers8086State;
  current_registers: Registers8086State;
  previous_flags: Record<string, number>;
  current_flags: Record<string, number>;
  alu_trace: {
    operation: string;
    is_16bit: boolean;
    operand1: number;
    operand2: number | null;
    result: number;
    hex_op1: string;
    hex_op2: string | null;
    hex_result: string;
    bin_op1: string;
    bin_op2: string | null;
    bin_result: string;
    calculation_summary: string;
    previous_flags: Record<string, number>;
    current_flags: Record<string, number>;
  } | null;
  bus_transactions: Array<any>;
  queue_before: string[];
  queue_after: string[];
  jump_taken?: boolean;
  halted: boolean;
  status: string;
}

export interface ExampleProgram {
  id?: string;
  title: string;
  description: string;
  code: string;
  source?: string;
}

// -----------------------------------------------------------------------------
// STAGE 5: VIRTUAL PRODUCTION LINE & SYSTEM INTEGRATION TYPES
// -----------------------------------------------------------------------------

export interface ProductDTO {
  id: string;
  sample_id: string;
  status:
    | 'QUEUED'
    | 'ON_CONVEYOR'
    | 'AT_INSPECTION'
    | 'INSPECTED'
    | 'AT_SORTING'
    | 'SORTED_PASS'
    | 'SORTED_REJECT'
    | 'EXITED';
  position: number;
  speed: number;
  queue_time: string;
  entry_tick: number | null;
  inspection_tick: number | null;
  sorting_tick: number | null;
  exit_tick: number | null;
  inspection_flags: Record<string, number>;
  inspection_data: Record<string, any> | null;
  sorting_result: 'PASS' | 'REJECT' | 'UNREADABLE' | null;
  fault_reason: string | null;
  is_completed: boolean;
}

export interface ConveyorState {
  running: boolean;
  paused: boolean;
  emergency_stopped: boolean;
  speed: number;
  direction: string;
  total_distance: number;
  is_running?: boolean;
  is_paused?: boolean;
  running_ticks?: number;
  stopped_ticks?: number;
  total_ticks?: number;
}

export interface SensorItem {
  id: string;
  name: string;
  position: number;
  detection_window: number;
  active: boolean;
  detected_count: number;
  current_product_id: string | null;
}

export interface ActuatorState {
  conveyor_motor: boolean;
  diverter_gate: {
    angle_deg: number;
    state: string;
    target_angle: number;
  };
  green_led: boolean;
  red_led: boolean;
  buzzer: boolean;
  pass_lane_count: number;
  reject_lane_count: number;
  ppi_port_b_byte: number;
}

export interface StationPositionsDTO {
  ENTRY: number;
  SENSOR_IR1: number;
  INSPECTION: number;
  SENSOR_IR2: number;
  SENSOR_IR3: number;
  SORTING_GATE: number;
  EXIT_SENSOR: number;
  EXIT: number;
}

export interface ProductionMetricsDTO {
  total_entered: number;
  total_inspected: number;
  total_passed: number;
  total_rejected: number;
  total_sorted: number;
  pass_percentage: number;
  reject_percentage: number;
  active_products: number;
  queued_products: number;
  completed_cycles: number;
  average_inspection_time_ms: number;
  average_cycle_time_ticks: number;
  conveyor_running_ticks: number;
  conveyor_stopped_ticks: number;
  fault_count: number;
  emergency_stop_count: number;
  defect_distribution: Record<string, number>;
  throughput_history: Array<{
    tick: number;
    passed: number;
    rejected: number;
    total: number;
  }>;
}

export interface EventRecordDTO {
  id: string;
  timestamp: string;
  tick: number;
  event_type: string;
  product_id: string | null;
  station: string | null;
  message: string;
  data: Record<string, any>;
}

export interface ProductionLineFullState {
  session_id: string;
  simulation_tick: number;
  line_state: string;
  controller_mode: 'DEAM_LOGIC' | 'MICROPROCESSOR_8086';
  conveyor: ConveyorState;
  sensors: Record<string, SensorItem>;
  actuators: ActuatorState;
  station_positions: StationPositionsDTO;
  queue: ProductDTO[];
  active_products: ProductDTO[];
  completed_products: ProductDTO[];
  metrics: ProductionMetricsDTO;
  recent_events: EventRecordDTO[];
  fault_state: {
    has_fault: boolean;
    description: string | null;
    fault_tick: number | null;
  };
  active_fault?: string | null;
}



