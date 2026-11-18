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
