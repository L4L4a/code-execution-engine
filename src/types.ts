export type Language = 'javascript' | 'python' | 'cpp';

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'error' | 'timeout';

export interface ExecutionRequest {
  id: string;
  language: Language;
  code: string;
  stdin?: string;
  createdAt: string;
}

export interface ExecutionResult {
  id: string;
  status: ExecutionStatus;
  stdout: string;
  stderr: string;
  executionTime: number;
  language: Language;
  completedAt: string;
}