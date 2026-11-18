import type {
  HealthResponse,
  InspectionConfig,
  InspectionResult,
  SampleMetadata,
  GateEvaluateResult,
  GateTruthTableResult,
  BooleanEvaluateResult,
  BooleanTruthTableResult,
  KMapResult,
  HalfAdderResult,
  FullAdderResult,
  MultiplexerResult,
  DecoderResult,
  PriorityEncoderResult,
  ParityResult,
  FlipFlopResult,
  RegisterResult,
  CounterResult,
  FsmStateResult,
  FsmTransitionResult,
  InspectionDecisionResult,
} from '../types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<{ data: HealthResponse; latencyMs: number }> {
  const startTime = performance.now();
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data: HealthResponse = await response.json();
    return { data, latencyMs };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - startTime);
    const errorMessage = err instanceof Error ? err.message : 'Failed to reach API server';
    throw { message: errorMessage, latencyMs };
  }
}

export async function fetchSamples(): Promise<SampleMetadata[]> {
  const response = await fetch(`${API_BASE}/samples`);
  if (!response.ok) {
    throw new Error(`Failed to load samples: ${response.statusText}`);
  }
  return response.json();
}

export function getSampleImageUrl(sampleId: string): string {
  return `${API_BASE}/samples/${sampleId}/image`;
}

export async function analyzeSample(sampleId: string): Promise<InspectionResult> {
  const response = await fetch(`${API_BASE}/inspection/analyze-sample`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ sample_id: sampleId }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.detail || `Analysis failed: ${response.statusText}`);
  }

  return response.json();
}

export async function analyzeUploadedImage(file: File | Blob, filename: string = 'capture.jpg'): Promise<InspectionResult> {
  const formData = new FormData();
  formData.append('file', file, filename);

  const response = await fetch(`${API_BASE}/inspection/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.detail || `Image inspection failed: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchInspectionConfig(): Promise<InspectionConfig> {
  const response = await fetch(`${API_BASE}/inspection/config`);
  if (!response.ok) {
    throw new Error(`Failed to load inspection config: ${response.statusText}`);
  }
  return response.json();
}

// -----------------------------------------------------------------------------
// STAGE 3: DEAM API CLIENT METHODS
// -----------------------------------------------------------------------------

export async function evaluateGate(gate: string, inputs: Record<string, number>): Promise<GateEvaluateResult> {
  const response = await fetch(`${API_BASE}/deam/gates/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gate, inputs }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to evaluate gate');
  }
  return response.json();
}

export async function fetchGateTruthTable(gate: string): Promise<GateTruthTableResult> {
  const response = await fetch(`${API_BASE}/deam/gates/${encodeURIComponent(gate)}/truth-table`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch gate truth table');
  }
  return response.json();
}

export async function evaluateBooleanExpression(expression: string, variables: Record<string, number>): Promise<BooleanEvaluateResult> {
  const response = await fetch(`${API_BASE}/deam/boolean/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expression, variables }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to evaluate expression');
  }
  return response.json();
}

export async function fetchBooleanTruthTable(expression: string, variables?: string[]): Promise<BooleanTruthTableResult> {
  const response = await fetch(`${API_BASE}/deam/boolean/truth-table`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expression, variables }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to compute truth table');
  }
  return response.json();
}

export async function fetchBooleanIdentities(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/deam/boolean/identities`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch boolean identities');
  }
  return response.json();
}

export async function simplifyKMap(numVars: number, minterms: number[], dontCares: number[] = []): Promise<KMapResult> {
  const response = await fetch(`${API_BASE}/deam/kmap/simplify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ num_vars: numVars, minterms, dont_cares: dontCares }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to simplify K-Map');
  }
  return response.json();
}

export async function simulateHalfAdder(a: number, b: number): Promise<HalfAdderResult> {
  const response = await fetch(`${API_BASE}/deam/combinational/half-adder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ a, b }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Half adder simulation failed');
  }
  return response.json();
}

export async function simulateFullAdder(a: number, b: number, cin: number): Promise<FullAdderResult> {
  const response = await fetch(`${API_BASE}/deam/combinational/full-adder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ a, b, cin }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Full adder simulation failed');
  }
  return response.json();
}

export async function simulateMultiplexer(
  muxType: string,
  dataInputs: Record<string, number>,
  selectInputs: Record<string, number>
): Promise<MultiplexerResult> {
  const response = await fetch(`${API_BASE}/deam/combinational/multiplexer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mux_type: muxType, data_inputs: dataInputs, select_inputs: selectInputs }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Multiplexer simulation failed');
  }
  return response.json();
}

export async function simulateDecoder(
  decoderType: string,
  inputs: Record<string, number>,
  enable: number = 1
): Promise<DecoderResult> {
  const response = await fetch(`${API_BASE}/deam/combinational/decoder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decoder_type: decoderType, inputs, enable }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Decoder simulation failed');
  }
  return response.json();
}

export async function simulatePriorityEncoder(
  encoderType: string,
  inputs: Record<string, number>
): Promise<PriorityEncoderResult> {
  const response = await fetch(`${API_BASE}/deam/combinational/priority-encoder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ encoder_type: encoderType, inputs }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Priority encoder simulation failed');
  }
  return response.json();
}

export async function simulateParity(
  dataBits: number[],
  parityType: 'even' | 'odd',
  receivedParity?: number
): Promise<ParityResult> {
  const response = await fetch(`${API_BASE}/deam/combinational/parity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data_bits: dataBits, parity_type: parityType, received_parity: receivedParity }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Parity simulation failed');
  }
  return response.json();
}

export async function simulateFlipFlop(params: {
  ffType: string;
  inputs: Record<string, number>;
  qCurrent: number;
  clock?: number;
  asyncSet?: number;
  asyncReset?: number;
}): Promise<FlipFlopResult> {
  const response = await fetch(`${API_BASE}/deam/sequential/flipflop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ff_type: params.ffType,
      inputs: params.inputs,
      q_current: params.qCurrent,
      clock: params.clock ?? 1,
      async_set: params.asyncSet ?? 0,
      async_reset: params.asyncReset ?? 0,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Flip-flop simulation failed');
  }
  return response.json();
}

export async function simulateRegister(params: {
  regType: string;
  currentState: number[];
  operation: string;
  serialIn?: number;
  parallelIn?: number[];
}): Promise<RegisterResult> {
  const response = await fetch(`${API_BASE}/deam/sequential/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reg_type: params.regType,
      current_state: params.currentState,
      operation: params.operation,
      serial_in: params.serialIn ?? 0,
      parallel_in: params.parallelIn,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Register simulation failed');
  }
  return response.json();
}

export async function simulateCounter(params: {
  counterType: string;
  bits: number;
  currentValue: number;
  direction?: 'UP' | 'DOWN';
  modulo?: number;
  enable?: number;
  reset?: number;
}): Promise<CounterResult> {
  const response = await fetch(`${API_BASE}/deam/sequential/counter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      counter_type: params.counterType,
      bits: params.bits,
      current_value: params.currentValue,
      direction: params.direction ?? 'UP',
      modulo: params.modulo,
      enable: params.enable ?? 1,
      reset: params.reset ?? 0,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Counter simulation failed');
  }
  return response.json();
}

export async function fetchFsmState(): Promise<FsmStateResult> {
  const response = await fetch(`${API_BASE}/deam/fsm/state`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch FSM state');
  }
  return response.json();
}

export async function triggerFsmTransition(event: string): Promise<FsmTransitionResult> {
  const response = await fetch(`${API_BASE}/deam/fsm/transition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to execute FSM transition');
  }
  return response.json();
}

export async function resetFsm(): Promise<FsmStateResult> {
  const response = await fetch(`${API_BASE}/deam/fsm/reset`, {
    method: 'POST',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to reset FSM');
  }
  return response.json();
}

export async function calculateInspectionDecision(inputs: {
  D: number;
  S: number;
  C: number;
  L: number;
  M: number;
  G: number;
}): Promise<InspectionDecisionResult> {
  const response = await fetch(`${API_BASE}/deam/inspection-decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inputs),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to calculate inspection decision');
  }
  return response.json();
}

export async function calculateInspectionDecisionFromSample(sampleId: string): Promise<InspectionDecisionResult> {
  const response = await fetch(`${API_BASE}/deam/inspection-decision/from-sample`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sample_id: sampleId }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to calculate inspection decision from sample');
  }
  return response.json();
}

// -----------------------------------------------------------------------------
// STAGE 4: 8086 MICROPROCESSOR & 8255 PPI API CLIENT METHODS
// -----------------------------------------------------------------------------

export async function fetchMicroprocessorStatus(): Promise<any> {
  const response = await fetch(`${API_BASE}/microprocessor/status`);
  if (!response.ok) {
    throw new Error('Failed to load microprocessor status');
  }
  return response.json();
}

export async function fetchMicroprocessorExamples(): Promise<Record<string, { title: string; description: string; code: string }>> {
  const response = await fetch(`${API_BASE}/microprocessor/examples`);
  if (!response.ok) {
    throw new Error('Failed to load example programs');
  }
  return response.json();
}

export async function fetchSessionState(sessionId: string = 'default'): Promise<any> {
  const response = await fetch(`${API_BASE}/microprocessor/sessions/${sessionId}`);
  if (!response.ok) {
    // If not found, create it
    const createResp = await fetch(`${API_BASE}/microprocessor/sessions/${sessionId}`, { method: 'POST' });
    if (!createResp.ok) throw new Error('Failed to initialize CPU session');
    return createResp.json();
  }
  return response.json();
}

export async function resetSession(sessionId: string = 'default'): Promise<any> {
  const response = await fetch(`${API_BASE}/microprocessor/sessions/${sessionId}/reset`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to reset CPU session');
  }
  return response.json();
}

export async function loadAssemblyProgram(
  sessionId: string = 'default',
  code: string,
  baseOffset: number = 0
): Promise<any> {
  const response = await fetch(`${API_BASE}/microprocessor/sessions/${sessionId}/load`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, base_offset: baseOffset }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.detail?.errors ? err.detail.errors.join('; ') : (err.detail || 'Assembly failed');
    throw new Error(msg);
  }
  return response.json();
}

export async function stepInstruction(sessionId: string = 'default'): Promise<{ step: any; full_state: any }> {
  const response = await fetch(`${API_BASE}/microprocessor/sessions/${sessionId}/step`, {
    method: 'POST',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Step execution failed');
  }
  return response.json();
}

export async function runProgram(sessionId: string = 'default', maxSteps: number = 500): Promise<any> {
  const response = await fetch(`${API_BASE}/microprocessor/sessions/${sessionId}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ max_steps: maxSteps }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Program execution failed');
  }
  return response.json();
}

export async function fetchMemoryDump(
  sessionId: string = 'default',
  segment: number = 0x1000,
  offset: number = 0x0000,
  count: number = 64
): Promise<any[]> {
  const response = await fetch(`${API_BASE}/microprocessor/sessions/${sessionId}/memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ segment, offset, count }),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch memory dump');
  }
  return response.json();
}

export async function fetchStackView(sessionId: string = 'default', depth: number = 8): Promise<any[]> {
  const response = await fetch(`${API_BASE}/microprocessor/sessions/${sessionId}/stack?depth=${depth}`);
  if (!response.ok) {
    throw new Error('Failed to fetch stack view');
  }
  return response.json();
}

export async function fetchPPIState(sessionId: string = 'default'): Promise<any> {
  const response = await fetch(`${API_BASE}/microprocessor/sessions/${sessionId}/ppi`);
  if (!response.ok) {
    throw new Error('Failed to fetch PPI state');
  }
  return response.json();
}

export async function configurePPI(sessionId: string = 'default', controlWord: number): Promise<any> {
  const response = await fetch(`${API_BASE}/microprocessor/sessions/${sessionId}/ppi/configure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ control_word: controlWord }),
  });
  if (!response.ok) {
    throw new Error('Failed to configure PPI');
  }
  return response.json();
}

export async function writePPIPort(sessionId: string = 'default', port: string, value: number): Promise<any> {
  const response = await fetch(`${API_BASE}/microprocessor/sessions/${sessionId}/ppi/write`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ port, value }),
  });
  if (!response.ok) {
    throw new Error('Failed to write PPI port');
  }
  return response.json();
}

export async function importVisionFlagsToPPI(
  sessionId: string = 'default',
  flags: { D: number; S: number; C: number; L: number; M: number; G: number }
): Promise<any> {
  const response = await fetch(`${API_BASE}/microprocessor/sessions/${sessionId}/ppi/import-vision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(flags),
  });
  if (!response.ok) {
    throw new Error('Failed to import vision flags to PPI');
  }
  return response.json();
}

export async function importSampleFlagsToPPI(sessionId: string = 'default', sampleId: string): Promise<any> {
  const response = await fetch(`${API_BASE}/microprocessor/sessions/${sessionId}/ppi/import-sample`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sample_id: sampleId }),
  });
  if (!response.ok) {
    throw new Error('Failed to import benchmark sample flags');
  }
  return response.json();
}

export async function raiseInterrupt(
  sessionId: string = 'default',
  type: 'INTR' | 'NMI',
  vector: number = 8
): Promise<any> {
  const response = await fetch(`${API_BASE}/microprocessor/sessions/${sessionId}/interrupts/raise`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, vector }),
  });
  if (!response.ok) {
    throw new Error('Failed to trigger interrupt');
  }
  return response.json();
}

export async function configureTimer(sessionId: string = 'default', mode: number = 0, count: number = 10): Promise<any> {
  const response = await fetch(`${API_BASE}/microprocessor/sessions/${sessionId}/timer/configure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, count }),
  });
  if (!response.ok) {
    throw new Error('Failed to configure timer');
  }
  return response.json();
}

export async function tickTimer(sessionId: string = 'default', ticks: number = 1): Promise<any> {
  const response = await fetch(`${API_BASE}/microprocessor/sessions/${sessionId}/timer/tick`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticks }),
  });
  if (!response.ok) {
    throw new Error('Failed to advance timer');
  }
  return response.json();
}

export const microprocessorApi = {
  getStatus: fetchMicroprocessorStatus,
  getExamples: fetchMicroprocessorExamples,
  getExamplePrograms: async () => {
    const data = await fetchMicroprocessorExamples();
    const programs = Object.entries(data).map(([id, p]) => ({
      id,
      title: p.title,
      description: p.description,
      source: p.code,
      code: p.code,
    }));
    return { programs };
  },
  createSession: async (id: string = 'default') => {
    const res = await fetch(`${API_BASE}/microprocessor/sessions/${id}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to create session');
    const fullState = await res.json();
    return { cpu_state: fullState };
  },
  getSessionState: fetchSessionState,
  getCPUState: fetchSessionState,
  resetSession: resetSession,
  resetCPU: async (sessionId: string = 'default') => {
    const fullState = await resetSession(sessionId);
    return { cpu_state: fullState };
  },
  assembleProgram: async (sessionId: string, code: string, _cs: number = 0x1000, baseOffset: number = 0) => {
    const res = await loadAssemblyProgram(sessionId, code, baseOffset);
    return {
      success: true,
      instruction_count: res.instructions ? res.instructions.length : 0,
      total_bytes: res.total_bytes || 0,
      instructions: res.instructions || [],
    };
  },
  loadProgram: loadAssemblyProgram,
  stepInstruction: async (sessionId: string = 'default') => {
    const res = await stepInstruction(sessionId);
    return {
      cpu_state: res.full_state,
      step: res.step,
    };
  },
  runProgram: async (sessionId: string = 'default', maxSteps: number = 500) => {
    const res = await runProgram(sessionId, maxSteps);
    const fullState = await fetchSessionState(sessionId);
    return {
      cpu_state: fullState,
      message: `Executed ${res.steps_executed} steps. Halted: ${res.halted}`,
      run_data: res,
    };
  },
  getMemoryDump: async (sessionId: string, segment: number = 0x1000, offset: number = 0x0000, count: number = 64) => {
    const rows = await fetchMemoryDump(sessionId, segment, offset, count);
    return { rows };
  },
  getStack: async (sessionId: string, depth: number = 8) => {
    const stack = await fetchStackView(sessionId, depth);
    return { stack };
  },
  getStackView: fetchStackView,
  writeMemory: async (_sessionId: string, _segment: number, _offset: number, _value: number) => {
    return { success: true };
  },
  getPPI: fetchPPIState,
  configurePPI: configurePPI,
  writePPIPort: async (sessionId: string, port: string, value: number) => {
    const ppi = await writePPIPort(sessionId, port, value);
    return { ppi_state: ppi };
  },
  loadVisionFlagsToPPI: async (sessionId: string, flags: {
    d_dimension?: number;
    s_scratch?: number;
    c_components?: number;
    l_label?: number;
    m_marking?: number;
    g_gate_trigger?: number;
    D?: number;
    S?: number;
    C?: number;
    L?: number;
    M?: number;
    G?: number;
  }) => {
    const d = flags.D ?? flags.d_dimension ?? 1;
    const s = flags.S ?? flags.s_scratch ?? 0;
    const c = flags.C ?? flags.c_components ?? 1;
    const l = flags.L ?? flags.l_label ?? 1;
    const m = flags.M ?? flags.m_marking ?? 1;
    const g = flags.G ?? flags.g_gate_trigger ?? 1;
    const ppi = await importVisionFlagsToPPI(sessionId, { D: d, S: s, C: c, L: l, M: m, G: g });
    return { ppi_state: ppi };
  },
  importSampleFlags: importSampleFlagsToPPI,
  triggerNMI: async (sessionId: string) => {
    const res = await raiseInterrupt(sessionId, 'NMI', 2);
    return { cpu_state: res.full_state };
  },
  triggerINTR: async (sessionId: string, vector: number = 8) => {
    const res = await raiseInterrupt(sessionId, 'INTR', vector);
    return { cpu_state: res.full_state };
  },
  triggerSoftwareInt: async (sessionId: string, vector: number = 0x80) => {
    const res = await raiseInterrupt(sessionId, 'INTR', vector);
    return { cpu_state: res.full_state };
  },
  configureTimer: async (sessionId: string, mode: number = 0, count: number = 10) => {
    const res = await configureTimer(sessionId, mode, count);
    return { cpu_state: res.full_state };
  },
  tickTimer: async (sessionId: string, ticks: number = 1) => {
    const res = await tickTimer(sessionId, ticks);
    return {
      cpu_state: res.full_state,
      timer: res.timer,
    };
  },
};


