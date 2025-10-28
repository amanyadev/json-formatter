export type RepairAction =
  | { type: 'trim'; chars: number }
  | { type: 'substring'; start: number; end: number }
  | { type: 'remove_trailing_commas'; count: number }
  | { type: 'single_quote_to_double'; count: number }
  | { type: 'removed_comments'; count: number }
  | { type: 'removed_leading_garbage'; chars: number }
  | { type: 'bracket_matching'; original: number; extracted: number };

export type FormatResult = {
  ok: boolean;
  parsed?: unknown;
  pretty?: string;
  repairs: RepairAction[];
  error?: string;
  confidence: 'high' | 'medium' | 'low';
  originalInput?: string;
};

export type FormatterOptions = {
  indent?: number;
  enableSingleQuoteFix?: boolean;
  enableTrailingCommaFix?: boolean;
  enableCommentRemoval?: boolean;
  enableSubstringExtraction?: boolean;
};
