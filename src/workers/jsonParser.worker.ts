import { parse as jsoncParse } from 'jsonc-parser';
import type { FormatResult, RepairAction, FormatterOptions } from '@/types/formatter';

const DEFAULT_OPTIONS: FormatterOptions = {
  indent: 2,
  enableSingleQuoteFix: true,
  enableTrailingCommaFix: true,
  enableCommentRemoval: true,
  enableSubstringExtraction: true,
};

// Optimize stringify for large objects
function optimizedStringify(obj: unknown, indent: number = 2): string {
  const cache = new WeakSet();
  let depth = 0;
  const maxDepth = 100; // Prevent stack overflow on deeply nested objects

  function stringify(value: unknown, currentIndent: number = 0): string {
    // Handle primitives
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') return isFinite(value) ? value.toString() : 'null';
    if (typeof value === 'string') return JSON.stringify(value);

    // Prevent circular references
    if (typeof value === 'object') {
      if (cache.has(value)) return '"[Circular Reference]"';
      cache.add(value);
    }

    // Limit depth to prevent stack overflow
    if (depth >= maxDepth) return '"[Max Depth Reached]"';

    depth++;

    try {
      // Handle arrays
      if (Array.isArray(value)) {
        if (value.length === 0) return '[]';

        const spaces = ' '.repeat(currentIndent + indent);
        const endSpaces = ' '.repeat(currentIndent);

        // For very large arrays, process in chunks
        const items = value.map(item => `${spaces}${stringify(item, currentIndent + indent)}`);
        return `[\n${items.join(',\n')}\n${endSpaces}]`;
      }

      // Handle objects
      const spaces = ' '.repeat(currentIndent + indent);
      const endSpaces = ' '.repeat(currentIndent);
      const entries = Object.entries(value as Record<string, unknown>);

      if (entries.length === 0) return '{}';

      const items = entries.map(([key, val]) => {
        const keyStr = JSON.stringify(key);
        return `${spaces}${keyStr}: ${stringify(val, currentIndent + indent)}`;
      });

      return `{\n${items.join(',\n')}\n${endSpaces}}`;
    } finally {
      depth--;
    }
  }

  return stringify(obj);
}

// Message types for worker communication
export interface WorkerRequest {
  type: 'parse';
  input: string;
  options?: FormatterOptions;
}

export interface WorkerResponse {
  type: 'result' | 'progress' | 'error';
  result?: FormatResult;
  progress?: { step: number; total: number; message: string };
  error?: string;
}

// Optimized regex for large strings - use early exit and limit backtracking
function safeRegexReplace(
  input: string,
  pattern: RegExp,
  replacement: string | ((substring: string, ...args: any[]) => string)
): string {
  // For very large strings, limit processing to avoid hanging
  const MAX_LENGTH = 10 * 1024 * 1024; // 10MB limit for regex operations
  if (input.length > MAX_LENGTH) {
    return input; // Skip regex for extremely large strings
  }
  return input.replace(pattern, replacement as any);
}

// Main parsing function (optimized for large files)
function formatJSON(input: string, options: FormatterOptions = {}): FormatResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const repairs: RepairAction[] = [];
  let workingInput = input;
  const originalInput = input;

  // For very large files (>5MB), skip expensive recovery steps
  const inputSize = new TextEncoder().encode(input).length;
  const isVeryLarge = inputSize > 5 * 1024 * 1024; // 5MB

  // Send progress update
  self.postMessage({
    type: 'progress',
    progress: { step: 1, total: 8, message: 'Attempting direct parse' },
  } as WorkerResponse);

  // Step 1: Try direct parse
  try {
    const parsed = JSON.parse(workingInput);

    // Send progress for stringify
    self.postMessage({
      type: 'progress',
      progress: { step: 1, total: 8, message: 'Formatting output' },
    } as WorkerResponse);

    return {
      ok: true,
      parsed,
      pretty: optimizedStringify(parsed, opts.indent),
      repairs,
      confidence: 'high',
      originalInput,
    };
  } catch (e) {
    // Continue to recovery
  }

  // Step 2: Trim whitespace and invisible characters
  self.postMessage({
    type: 'progress',
    progress: { step: 2, total: 8, message: 'Trimming whitespace' },
  } as WorkerResponse);

  const trimmed = workingInput.trim().replace(/^[\uFEFF\u200B-\u200D\uFFFE\uFFFF]/g, '');

  // For very large files, only try trim and direct parse
  if (isVeryLarge) {
    if (trimmed.length !== workingInput.length) {
      repairs.push({ type: 'trim', chars: workingInput.length - trimmed.length });
      workingInput = trimmed;
    }

    try {
      const parsed = JSON.parse(workingInput);
      return {
        ok: true,
        parsed,
        pretty: optimizedStringify(parsed, opts.indent),
        repairs,
        confidence: 'high',
        originalInput,
      };
    } catch (e) {
      // For very large files, fail fast if basic parse doesn't work
      return {
        ok: false,
        repairs,
        error: 'Unable to parse large JSON. Please ensure it is valid JSON.',
        confidence: 'low',
        originalInput,
      };
    }
  }
  if (trimmed.length !== workingInput.length) {
    repairs.push({ type: 'trim', chars: workingInput.length - trimmed.length });
    workingInput = trimmed;

    try {
      const parsed = JSON.parse(workingInput);
      return {
        ok: true,
        parsed,
        pretty: optimizedStringify(parsed, opts.indent),
        repairs,
        confidence: 'high',
        originalInput,
      };
    } catch (e) {
      // Continue
    }
  }

  // Step 3: Remove leading garbage (logs, markers)
  self.postMessage({
    type: 'progress',
    progress: { step: 3, total: 8, message: 'Removing leading garbage' },
  } as WorkerResponse);

  const jsonStartMatch = workingInput.match(/[{\[]/);
  if (jsonStartMatch && jsonStartMatch.index! > 0) {
    const charsRemoved = jsonStartMatch.index!;
    repairs.push({ type: 'removed_leading_garbage', chars: charsRemoved });
    workingInput = workingInput.substring(jsonStartMatch.index!);

    try {
      const parsed = JSON.parse(workingInput);
      return {
        ok: true,
        parsed,
        pretty: optimizedStringify(parsed, opts.indent),
        repairs,
        confidence: 'medium',
        originalInput,
      };
    } catch (e) {
      // Continue
    }
  }

  // Step 4: Extract JSON substring using bracket matching
  self.postMessage({
    type: 'progress',
    progress: { step: 4, total: 8, message: 'Extracting JSON substring' },
  } as WorkerResponse);

  if (opts.enableSubstringExtraction) {
    const extracted = extractJSONSubstring(workingInput);
    if (extracted && extracted !== workingInput) {
      repairs.push({
        type: 'bracket_matching',
        original: workingInput.length,
        extracted: extracted.length,
      });
      workingInput = extracted;

      try {
        const parsed = JSON.parse(workingInput);
        return {
          ok: true,
          parsed,
          pretty: JSON.stringify(parsed, null, opts.indent),
          repairs,
          confidence: 'medium',
          originalInput,
        };
      } catch (e) {
        // Continue
      }
    }
  }

  // Step 5: Remove trailing commas
  self.postMessage({
    type: 'progress',
    progress: { step: 5, total: 8, message: 'Removing trailing commas' },
  } as WorkerResponse);

  if (opts.enableTrailingCommaFix) {
    const commaFixed = workingInput.replace(/,(\s*[}\]])/g, '$1');
    const commaCount = (workingInput.match(/,(\s*[}\]])/g) || []).length;
    if (commaCount > 0) {
      repairs.push({ type: 'remove_trailing_commas', count: commaCount });
      workingInput = commaFixed;

      try {
        const parsed = JSON.parse(workingInput);
        return {
          ok: true,
          parsed,
          pretty: JSON.stringify(parsed, null, opts.indent),
          repairs,
          confidence: 'medium',
          originalInput,
        };
      } catch (e) {
        // Continue
      }
    }
  }

  // Step 6: Fix single quotes (conservative)
  self.postMessage({
    type: 'progress',
    progress: { step: 6, total: 8, message: 'Fixing single quotes' },
  } as WorkerResponse);

  if (opts.enableSingleQuoteFix) {
    const quoteFixed = fixSingleQuotes(workingInput);
    const quoteCount = countSingleQuoteReplacements(workingInput, quoteFixed);
    if (quoteCount > 0) {
      repairs.push({ type: 'single_quote_to_double', count: quoteCount });
      workingInput = quoteFixed;

      try {
        const parsed = JSON.parse(workingInput);
        return {
          ok: true,
          parsed,
          pretty: JSON.stringify(parsed, null, opts.indent),
          repairs,
          confidence: 'medium',
          originalInput,
        };
      } catch (e) {
        // Continue
      }
    }
  }

  // Step 7: Try JSONC parser (handles comments and trailing commas)
  self.postMessage({
    type: 'progress',
    progress: { step: 7, total: 8, message: 'Trying JSONC parser' },
  } as WorkerResponse);

  if (opts.enableCommentRemoval) {
    try {
      const errors: any[] = [];
      const parsed = jsoncParse(workingInput, errors, { allowTrailingComma: true });

      if (errors.length === 0 && parsed !== undefined) {
        const commentCount = (workingInput.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || []).length;
        if (commentCount > 0) {
          repairs.push({ type: 'removed_comments', count: commentCount });
        }

        return {
          ok: true,
          parsed,
          pretty: JSON.stringify(parsed, null, opts.indent),
          repairs,
          confidence: 'medium',
          originalInput,
        };
      }
    } catch (e) {
      // Continue
    }
  }

  // Step 8: Handle multiple concatenated JSON objects
  self.postMessage({
    type: 'progress',
    progress: { step: 8, total: 8, message: 'Handling multiple objects' },
  } as WorkerResponse);

  const multipleObjects = extractMultipleJSON(workingInput);
  if (multipleObjects.length > 1) {
    return {
      ok: true,
      parsed: multipleObjects,
      pretty: optimizedStringify(multipleObjects, opts.indent),
      repairs: [...repairs, { type: 'substring', start: 0, end: workingInput.length }],
      confidence: 'low',
      originalInput,
    };
  }

  // Failed all recovery attempts
  return {
    ok: false,
    repairs,
    error: 'Unable to recover valid JSON from input',
    confidence: 'low',
    originalInput,
  };
}

function extractJSONSubstring(input: string): string | null {
  // For very large inputs, limit search depth
  const MAX_SCAN_LENGTH = 10 * 1024 * 1024; // 10MB max scan
  const scanLength = Math.min(input.length, MAX_SCAN_LENGTH);

  const firstOpen = input.substring(0, scanLength).search(/[{\[]/);
  if (firstOpen === -1) return null;

  const openChar = input[firstOpen];
  const closeChar = openChar === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  // Limit iteration for performance
  const endPos = Math.min(input.length, firstOpen + MAX_SCAN_LENGTH);

  for (let i = firstOpen; i < endPos; i++) {
    const char = input[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !inString) {
      inString = true;
      continue;
    }

    if (char === '"' && inString) {
      inString = false;
      continue;
    }

    if (!inString) {
      if (char === openChar || (openChar === '{' && char === '[') || (openChar === '[' && char === '{')) {
        depth++;
      } else if (char === closeChar || (closeChar === '}' && char === ']') || (closeChar === ']' && char === '}')) {
        depth--;
        if (depth === 0) {
          return input.substring(firstOpen, i + 1);
        }
      }
    }
  }

  return null;
}

function fixSingleQuotes(input: string): string {
  // Conservative approach: only replace single quotes that look like JSON keys/strings
  // Match patterns like: 'key': or 'value'
  // Use safeRegexReplace to avoid hanging on very large strings
  return safeRegexReplace(input, /'([^'\\]*(\\.[^'\\]*)*)'/g, (match) => {
    // Convert single quotes to double quotes
    return '"' + match.slice(1, -1).replace(/"/g, '\\"') + '"';
  });
}

function countSingleQuoteReplacements(original: string, fixed: string): number {
  const originalQuotes = (original.match(/'/g) || []).length;
  const fixedQuotes = (fixed.match(/'/g) || []).length;
  return Math.floor((originalQuotes - fixedQuotes) / 2);
}

function extractMultipleJSON(input: string): any[] {
  const objects: any[] = [];
  let remaining = input.trim();

  while (remaining.length > 0) {
    try {
      const firstOpen = remaining.search(/[{\[]/);
      if (firstOpen === -1) break;

      remaining = remaining.substring(firstOpen);
      const extracted = extractJSONSubstring(remaining);

      if (!extracted) break;

      const parsed = JSON.parse(extracted);
      objects.push(parsed);
      remaining = remaining.substring(extracted.length).trim();
    } catch (e) {
      break;
    }
  }

  return objects;
}

// Worker message handler
self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const { type, input, options } = event.data;

  if (type === 'parse') {
    try {
      const result = formatJSON(input, options);
      self.postMessage({
        type: 'result',
        result,
      } as WorkerResponse);
    } catch (error) {
      self.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      } as WorkerResponse);
    }
  }
});

// Export empty object to make this a module
export {};
