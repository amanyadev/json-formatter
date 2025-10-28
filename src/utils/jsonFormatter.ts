import { parse as jsoncParse, printParseErrorCode } from 'jsonc-parser';
import type { FormatResult, RepairAction, FormatterOptions } from '@/types/formatter';

const DEFAULT_OPTIONS: FormatterOptions = {
  indent: 2,
  enableSingleQuoteFix: true,
  enableTrailingCommaFix: true,
  enableCommentRemoval: true,
  enableSubstringExtraction: true,
};

export function formatJSON(input: string, options: FormatterOptions = {}): FormatResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const repairs: RepairAction[] = [];
  let workingInput = input;
  const originalInput = input;

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

export function validateJSON(input: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(input);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
