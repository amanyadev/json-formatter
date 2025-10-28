import { useState, useEffect, useCallback } from 'react';
import { Toolbar } from '@/components/Toolbar/Toolbar';
import { JsonEditor } from '@/components/Editor/JsonEditor';
import { OutputView } from '@/components/OutputView/OutputView';
import { StatusBadge } from '@/components/Status/StatusBadge';
import { RepairLog } from '@/components/Status/RepairLog';
import { formatJSON, validateJSON } from '@/utils/jsonFormatter';
import { downloadJSON, copyToClipboard } from '@/utils/download';
import { toast } from '@/hooks/use-toast';
import type { FormatResult } from '@/types/formatter';

// Example malformed inputs for demo
const EXAMPLES = [
  {
    name: 'Leading log text',
    content: `INFO 2025-10-27: Received payload: ***START*** {"a":1,"b":2}***END***`,
  },
  {
    name: 'Trailing commas',
    content: `{"a":1,"b":2,}`,
  },
  {
    name: 'Single quotes',
    content: `{'a': 'hello', 'b': 123}`,
  },
  {
    name: 'Multiple concatenated',
    content: `{"id":1}{"id":2}`,
  },
  {
    name: 'With comments',
    content: `{
  // This is a comment
  "name": "John",
  "age": 30, // trailing comma
}`,
  },
];

const Index = () => {
  const [input, setInput] = useState('');
  const [formatResult, setFormatResult] = useState<FormatResult | null>(null);
  const [autoFormat, setAutoFormat] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);

  const handleFormat = useCallback(() => {
    if (!input.trim()) {
      toast({
        title: 'Empty input',
        description: 'Please enter some JSON to format',
        variant: 'destructive',
      });
      return;
    }

    setIsFormatting(true);
    
    // Simulate async processing for better UX
    setTimeout(() => {
      const result = formatJSON(input);
      setFormatResult(result);
      setIsFormatting(false);

      if (result.ok) {
        toast({
          title: result.repairs.length > 0 ? 'JSON Recovered' : 'Valid JSON',
          description: result.repairs.length > 0
            ? `Applied ${result.repairs.length} repair${result.repairs.length > 1 ? 's' : ''}`
            : 'Your JSON is valid',
        });
      } else {
        toast({
          title: 'Unable to format',
          description: result.error || 'Invalid JSON',
          variant: 'destructive',
        });
      }
    }, 100);
  }, [input]);

  const handleValidate = useCallback(() => {
    if (!input.trim()) {
      toast({
        title: 'Empty input',
        description: 'Please enter some JSON to validate',
        variant: 'destructive',
      });
      return;
    }

    const validation = validateJSON(input);
    
    if (validation.valid) {
      toast({
        title: 'Valid JSON',
        description: 'Your JSON is syntactically correct',
      });
    } else {
      toast({
        title: 'Invalid JSON',
        description: validation.error,
        variant: 'destructive',
      });
    }
  }, [input]);

  const handleCopy = useCallback(() => {
    if (formatResult?.pretty) {
      copyToClipboard(formatResult.pretty)
        .then(() => {
          toast({
            title: 'Copied',
            description: 'Formatted JSON copied to clipboard',
          });
        })
        .catch(() => {
          toast({
            title: 'Failed to copy',
            description: 'Could not copy to clipboard',
            variant: 'destructive',
          });
        });
    } else {
      toast({
        title: 'Nothing to copy',
        description: 'Format the JSON first',
        variant: 'destructive',
      });
    }
  }, [formatResult]);

  const handleDownload = useCallback(() => {
    if (formatResult?.pretty) {
      downloadJSON(formatResult.pretty);
      toast({
        title: 'Downloaded',
        description: 'JSON file saved successfully',
      });
    } else {
      toast({
        title: 'Nothing to download',
        description: 'Format the JSON first',
        variant: 'destructive',
      });
    }
  }, [formatResult]);

  const handleClear = useCallback(() => {
    setInput('');
    setFormatResult(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleFormat();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleDownload();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        (e.target as HTMLTextAreaElement).blur();
      }
    },
    [handleFormat, handleDownload]
  );

  // Auto-format on input change
  useEffect(() => {
    if (autoFormat && input.trim()) {
      const timeoutId = setTimeout(() => {
        const result = formatJSON(input);
        setFormatResult(result);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [input, autoFormat]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <Toolbar
        onFormat={handleFormat}
        onValidate={handleValidate}
        onCopy={handleCopy}
        onDownload={handleDownload}
        onClear={handleClear}
        autoFormat={autoFormat}
        onAutoFormatChange={setAutoFormat}
        isFormatting={isFormatting}
      />

      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
        {/* Input Panel */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Input</h2>
            <select
              className="text-xs bg-secondary text-secondary-foreground rounded px-2 py-1 outline-none focus:ring-2 focus:ring-ring"
              onChange={(e) => {
                const example = EXAMPLES[parseInt(e.target.value)];
                if (example) setInput(example.content);
              }}
              defaultValue=""
              aria-label="Load example"
            >
              <option value="" disabled>
                Load example...
              </option>
              {EXAMPLES.map((example, index) => (
                <option key={index} value={index}>
                  {example.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 border border-border rounded-lg overflow-hidden bg-card shadow-sm">
            <JsonEditor
              value={input}
              onChange={setInput}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        {/* Output Panel */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Output</h2>
            <StatusBadge result={formatResult} />
          </div>

          {formatResult?.repairs && formatResult.repairs.length > 0 && (
            <RepairLog repairs={formatResult.repairs} />
          )}

          <div className="flex-1 border border-border rounded-lg overflow-hidden bg-card shadow-sm">
            {formatResult?.ok && formatResult.pretty && formatResult.parsed ? (
              <OutputView
                formatted={formatResult.pretty}
                parsed={formatResult.parsed}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Formatted JSON will appear here...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer with keyboard shortcuts */}
      <div className="px-4 py-2 border-t border-border bg-card/50 text-xs text-muted-foreground flex items-center justify-center gap-6">
        <span>
          <kbd className="px-2 py-1 bg-secondary rounded">Ctrl</kbd> +{' '}
          <kbd className="px-2 py-1 bg-secondary rounded">Enter</kbd> to format
        </span>
        <span>
          <kbd className="px-2 py-1 bg-secondary rounded">Ctrl</kbd> +{' '}
          <kbd className="px-2 py-1 bg-secondary rounded">S</kbd> to download
        </span>
        <span>
          <kbd className="px-2 py-1 bg-secondary rounded">Esc</kbd> to unfocus
        </span>
      </div>
    </div>
  );
};

export default Index;
