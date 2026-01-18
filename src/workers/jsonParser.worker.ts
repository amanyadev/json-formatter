import { parse as jsoncParse } from 'jsonc-parser';
import type { FormatResult, RepairAction, FormatterOptions } from '@/types/formatter';

const DEFAULT_OPTIONS: FormatterOptions = {
  indent: 2,
  enableSingleQuoteFix: true,
  enableTrailingCommaFix: true,
  enableCommentRemoval: true,
  enableSubstringExtraction: true,
};

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

// Main parsing function (same logic as jsonFormatter.ts)
function formatJSON(input: string, options: FormatterOptions = {}): FormatResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const repairs: RepairAction[] = [];
  let workingInput = input;
  const originalInput = input;

  // Send progress update
  self.postMessage({
    type: 'progress',
    progress: { step: 1, total: 8, message: 'Attempting direct parse' },
  } as WorkerResponse);

  // Step 1: Try direct parse
  try {
    const parsed = JSON.parse(workingInput);
    return {
      ok: true,
      parsed,
      pretty: JSON.stringify(parsed, null, opts.indent),
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
  if (trimmed.length !== workingInput.length) {
    repairs.push({ type: 'trim', chars: workingInput.length - trimmed.length });
    workingInput = trimmed;

    try {
      const parsed = JSON.parse(workingInput);
      return {
        ok: true,
        parsed,
        pretty: JSON.stringify(parsed, null, opts.indent),
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
        pretty: JSON.stringify(parsed, null, opts.indent),
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
      pretty: JSON.stringify(multipleObjects, null, opts.indent),
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
  const firstOpen = input.search(/[{\[]/);
  if (firstOpen === -1) return null;

  const openChar = input[firstOpen];
  const closeChar = openChar === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = firstOpen; i < input.length; i++) {
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
  return input.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, (match) => {
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
