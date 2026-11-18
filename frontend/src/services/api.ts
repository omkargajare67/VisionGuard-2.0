import type {
  HealthResponse,
  InspectionConfig,
  InspectionResult,
  SampleMetadata,
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
