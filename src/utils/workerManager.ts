import type { FormatResult, FormatterOptions } from '@/types/formatter';
import type { WorkerRequest, WorkerResponse } from '@/workers/jsonParser.worker';

export interface ParseProgress {
  step: number;
  total: number;
  message: string;
}

export interface WorkerParseOptions extends FormatterOptions {
  onProgress?: (progress: ParseProgress) => void;
}

// Singleton worker instance
let workerInstance: Worker | null = null;

// Size threshold for using worker (1MB)
export const WORKER_THRESHOLD_BYTES = 1024 * 1024;

function getWorker(): Worker {
  if (!workerInstance) {
    // Create worker from the worker file
    workerInstance = new Worker(
      new URL('../workers/jsonParser.worker.ts', import.meta.url),
      { type: 'module' }
    );
  }
  return workerInstance;
}

export function shouldUseWorker(input: string): boolean {
  // Use TextEncoder for accurate byte size
  const byteSize = new TextEncoder().encode(input).length;
  return byteSize >= WORKER_THRESHOLD_BYTES;
}

export function parseWithWorker(
  input: string,
  options?: WorkerParseOptions
): Promise<FormatResult> {
  return new Promise((resolve, reject) => {
    const worker = getWorker();
    const { onProgress, ...formatterOptions } = options || {};

    const handleMessage = (event: MessageEvent<WorkerResponse>) => {
      const { type, result, progress, error } = event.data;

      switch (type) {
        case 'result':
          worker.removeEventListener('message', handleMessage);
          worker.removeEventListener('error', handleError);
          if (result) {
            resolve(result);
          } else {
            reject(new Error('Worker returned no result'));
          }
          break;

        case 'progress':
          if (progress && onProgress) {
            onProgress(progress);
          }
          break;

        case 'error':
          worker.removeEventListener('message', handleMessage);
          worker.removeEventListener('error', handleError);
          reject(new Error(error || 'Worker error'));
          break;
      }
    };

    const handleError = (error: ErrorEvent) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      reject(new Error(`Worker error: ${error.message}`));
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);

    // Send parse request to worker
    const request: WorkerRequest = {
      type: 'parse',
      input,
      options: formatterOptions,
    };
    worker.postMessage(request);
  });
}

// Cleanup function to terminate worker
export function terminateWorker(): void {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
  }
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', terminateWorker);
}
