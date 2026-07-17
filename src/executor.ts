import { exec } from 'child_process';
import { promisify } from 'util';
import { ExecutionRequest, ExecutionResult, Language } from './types';

const execAsync = promisify(exec);

const TIMEOUT = parseInt(process.env.EXECUTION_TIMEOUT || '10') * 1000;
const MAX_MEMORY = process.env.MAX_MEMORY || '128m';

// docker image for each language
const DOCKER_IMAGES: Record<Language, string> = {
  javascript: 'node:18-alpine',
  python: 'python:3.11-alpine',
  cpp: 'gcc:latest',
};

// how to run code for each language inside the container
function buildCommand(language: Language, code: string, stdin?: string): string {
  const encoded = Buffer.from(code).toString('base64');
  const stdinPart = stdin ? `echo '${stdin}' |` : '';

  switch (language) {
    case 'javascript':
      return `echo '${encoded}' | base64 -d | ${stdinPart} node`;
    case 'python':
      return `echo '${encoded}' | base64 -d | ${stdinPart} python3`;
    case 'cpp':
      return `echo '${encoded}' | base64 -d > /tmp/main.cpp && g++ /tmp/main.cpp -o /tmp/main && ${stdinPart} /tmp/main`;
    default:
      throw new Error(`unsupported language: ${language}`);
  }
}

export async function executeCode(request: ExecutionRequest): Promise<ExecutionResult> {
  const start = Date.now();
  const image = DOCKER_IMAGES[request.language];
  const command = buildCommand(request.language, request.code, request.stdin);

  // run code in a docker container with strict limits
  const dockerCmd = [
    'docker run',
    '--rm',                          // remove container after it exits
    '--network none',                // no internet access
    `--memory ${MAX_MEMORY}`,        // memory limit
    '--memory-swap -1',              // disable swap
    '--cpus 0.5',                    // half a CPU core max
    `--name exec-${request.id}`,     // named so we can kill it if needed
    image,
    `sh -c "${command}"`,
  ].join(' ');

  try {
    const { stdout, stderr } = await execAsync(dockerCmd, {
      timeout: TIMEOUT,
    });

    return {
      id: request.id,
      status: 'completed',
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      executionTime: Date.now() - start,
      language: request.language,
      completedAt: new Date().toISOString(),
    };

  } catch (err: any) {
    const isTimeout = err.killed || err.signal === 'SIGTERM';

    // make sure container is cleaned up if it timed out
    if (isTimeout) {
      execAsync(`docker rm -f exec-${request.id}`).catch(() => {});
    }

    return {
      id: request.id,
      status: isTimeout ? 'timeout' : 'error',
      stdout: err.stdout?.trim() || '',
      stderr: err.stderr?.trim() || err.message || 'execution failed',
      executionTime: Date.now() - start,
      language: request.language,
      completedAt: new Date().toISOString(),
    };
  }
}