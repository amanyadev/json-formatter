import { useState, useEffect, useCallback } from 'react';
import { Toolbar } from '@/components/Toolbar/Toolbar';
import { JsonEditor } from '@/components/Editor/JsonEditor';
import { OutputView } from '@/components/OutputView/OutputView';
import { StatusBadge } from '@/components/Status/StatusBadge';
import { RepairLog } from '@/components/Status/RepairLog';
import { languageFormatters, languages } from '@/utils/languageFormatters';
import { downloadJSON, copyToClipboard } from '@/utils/download';
import { toast } from '@/hooks/use-toast';
import type { FormatResult } from '@/types/formatter';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

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
  const [input, setInput] = useState(() => {
    return localStorage.getItem('json-input') || '';
  });
  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem('selected-language') || 'json';
  });
  const [formatResult, setFormatResult] = useState<FormatResult | null>(null);
  const [autoFormat, setAutoFormat] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);

  // Persist input and language to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('json-input', input);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [input]);

  useEffect(() => {
    localStorage.setItem('selected-language', language);
  }, [language]);

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
      const formatter = languageFormatters[language];
      const result = formatter.format(input);
      setFormatResult(result);
      setIsFormatting(false);

      if (result.ok) {
        toast({
          title: result.repairs.length > 0 ? `${language.toUpperCase()} Recovered` : `Valid ${language.toUpperCase()}`,
          description: result.repairs.length > 0
            ? `Applied ${result.repairs.length} repair${result.repairs.length > 1 ? 's' : ''}`
            : `Your ${language.toUpperCase()} is valid`,
        });
      } else {
        toast({
          title: 'Unable to format',
          description: result.error || `Invalid ${language.toUpperCase()}`,
          variant: 'destructive',
        });
      }
    }, 100);
  }, [input, language]);

  const handleValidate = useCallback(() => {
    if (!input.trim()) {
      toast({
        title: 'Empty input',
        description: `Please enter some ${language.toUpperCase()} to validate`,
        variant: 'destructive',
      });
      return;
    }

    const formatter = languageFormatters[language];
    const validation = formatter.validate(input);
    
    if (validation.valid) {
      toast({
        title: `Valid ${language.toUpperCase()}`,
        description: `Your ${language.toUpperCase()} is syntactically correct`,
      });
    } else {
      toast({
        title: `Invalid ${language.toUpperCase()}`,
        description: validation.error,
        variant: 'destructive',
      });
    }
  }, [input, language]);

  const handleCopy = useCallback(() => {
    if (formatResult?.pretty) {
      copyToClipboard(formatResult.pretty)
        .then(() => {
          toast({
            title: 'Copied',
            description: `Formatted ${language.toUpperCase()} copied to clipboard`,
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
        description: `Format the ${language.toUpperCase()} first`,
        variant: 'destructive',
      });
    }
  }, [formatResult, language]);

  const handleDownload = useCallback(() => {
    if (formatResult?.pretty) {
      downloadJSON(formatResult.pretty, language);
      toast({
        title: 'Downloaded',
        description: `${language.toUpperCase()} file saved successfully`,
      });
    } else {
      toast({
        title: 'Nothing to download',
        description: `Format the ${language.toUpperCase()} first`,
        variant: 'destructive',
      });
    }
  }, [formatResult, language]);

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
        const formatter = languageFormatters[language];
        const result = formatter.format(input);
        setFormatResult(result);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [input, autoFormat, language]);

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

      {/* Desktop Layout - Horizontal Split */}
      <div className="hidden md:flex flex-1 p-2 sm:p-4 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="gap-2 sm:gap-4">
          {/* Input Panel */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex flex-col gap-2 sm:gap-3 h-full">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-sm font-medium text-muted-foreground">Input</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="text-xs bg-secondary text-secondary-foreground rounded px-2 py-1 outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Select language"
                  >
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  {language === 'json' && (
                    <select
                      className="text-xs bg-secondary text-secondary-foreground rounded px-2 py-1 outline-none focus:ring-2 focus:ring-ring max-w-[140px]"
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
                  )}
                </div>
              </div>

              <div className="flex-1 border border-border rounded-lg overflow-hidden bg-card shadow-sm min-h-0">
                <JsonEditor
                  value={input}
                  onChange={setInput}
                  onKeyDown={handleKeyDown}
                  language={language}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Output Panel */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex flex-col gap-2 sm:gap-3 h-full">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-sm font-medium text-muted-foreground">Output</h2>
                <StatusBadge result={formatResult} />
              </div>

              {formatResult?.repairs && formatResult.repairs.length > 0 && (
                <RepairLog repairs={formatResult.repairs} />
              )}

              <div className="flex-1 border border-border rounded-lg overflow-hidden bg-card shadow-sm min-h-0">
                {formatResult?.ok && formatResult.pretty ? (
                  <OutputView
                    formatted={formatResult.pretty}
                    parsed={formatResult.parsed}
                    language={language}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
                    <p>Formatted {language.toUpperCase()} will appear here...</p>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile Layout - Vertical Split */}
      <div className="md:hidden flex flex-1 p-2 overflow-hidden">
        <ResizablePanelGroup direction="vertical" className="gap-2">
          {/* Input Panel */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex flex-col gap-2 h-full">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-medium text-muted-foreground">Input</h2>
                <div className="flex items-center gap-1.5">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="text-xs bg-secondary text-secondary-foreground rounded px-2 py-1 outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Select language"
                  >
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  {language === 'json' && (
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
                        Example
                      </option>
                      {EXAMPLES.map((example, index) => (
                        <option key={index} value={index}>
                          {example.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="flex-1 border border-border rounded-lg overflow-hidden bg-card shadow-sm min-h-0">
                <JsonEditor
                  value={input}
                  onChange={setInput}
                  onKeyDown={handleKeyDown}
                  language={language}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Output Panel */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex flex-col gap-2 h-full">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-sm font-medium text-muted-foreground">Output</h2>
                <StatusBadge result={formatResult} />
              </div>

              {formatResult?.repairs && formatResult.repairs.length > 0 && (
                <RepairLog repairs={formatResult.repairs} />
              )}

              <div className="flex-1 border border-border rounded-lg overflow-hidden bg-card shadow-sm min-h-0">
                {formatResult?.ok && formatResult.pretty ? (
                  <OutputView
                    formatted={formatResult.pretty}
                    parsed={formatResult.parsed}
                    language={language}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center text-xs">
                    <p>Formatted {language.toUpperCase()} will appear here...</p>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Footer with keyboard shortcuts and privacy info */}
      <div className="px-2 sm:px-4 py-2 sm:py-3 border-t border-border bg-card/50">
        <div className="flex items-center justify-between gap-2 sm:gap-6 flex-wrap text-xs">
          {/* Privacy Message */}
          <div className="flex items-center gap-2 text-muted-foreground flex-1 min-w-0">
            <svg
              className="w-4 h-4 text-success flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span className="hidden sm:inline">
              This tool runs completely on your device. No data is uploaded or sent to any server. Your privacy is 100% protected.
            </span>
            <span className="sm:hidden">
              100% private - runs on your device
            </span>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="hidden lg:flex items-center gap-3 xl:gap-5 text-muted-foreground">
            <span className="whitespace-nowrap">
              <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">Ctrl</kbd> +{' '}
              <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">Enter</kbd> format
            </span>
            <span className="whitespace-nowrap">
              <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">Ctrl</kbd> +{' '}
              <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">S</kbd> download
            </span>
            <span className="whitespace-nowrap">
              <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">Esc</kbd> unfocus
            </span>
          </div>

          {/* GitHub Fork Link */}
          <a
            href="https://github.com/amanyadev/json-formatter"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground hover:text-primary transition-colors whitespace-nowrap flex-shrink-0"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span className="hidden sm:inline">Fork this project</span>
            <span className="sm:hidden">GitHub</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;
