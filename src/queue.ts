import { ExecutionRequest, ExecutionResult } from './types';
import { executeCode } from './executor';

// simple in-memory queue — good enough for this scale
const pendingJobs: ExecutionRequest[] = [];
const results = new Map<string, ExecutionResult>();
let isProcessing = false;

export function enqueue(request: ExecutionRequest): void {
  pendingJobs.push(request);
  processNext();
}

export function getResult(id: string): ExecutionResult | undefined {
  return results.get(id);
}

// process one job at a time to avoid overloading the machine
async function processNext(): Promise<void> {
  if (isProcessing || pendingJobs.length === 0) return;

  isProcessing = true;
  const job = pendingJobs.shift()!;

  console.log(`executing ${job.language} job ${job.id}`);

  try {
    const result = await executeCode(job);
    results.set(job.id, result);
    console.log(`job ${job.id} finished in ${result.executionTime}ms — ${result.status}`);
  } catch (err) {
    console.error(`job ${job.id} crashed:`, err);
    results.set(job.id, {
      id: job.id,
      status: 'error',
      stdout: '',
      stderr: 'internal execution error',
      executionTime: 0,
      language: job.language,
      completedAt: new Date().toISOString(),
    });
  } finally {
    isProcessing = false;
    // check if more jobs are waiting
    processNext();
  }
}