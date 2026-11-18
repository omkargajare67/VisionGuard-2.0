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
