import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  language?: string;
}

export function JsonEditor({
  value,
  onChange,
  readOnly = false,
  placeholder = 'Paste your JSON here...',
  className,
  onKeyDown,
  language = 'json',
}: JsonEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lineNumbers, setLineNumbers] = useState<number[]>([]);

  useEffect(() => {
    const lines = value.split('\n').length;
    setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1));
  }, [value]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const lineNumbersEl = e.currentTarget.previousElementSibling;
    if (lineNumbersEl) {
      lineNumbersEl.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className={cn('relative flex h-full rounded-lg overflow-hidden', className)}>
      <div
        className="flex flex-col items-end pr-3 py-4 bg-editor-bg text-editor-lineNumber font-mono text-sm select-none overflow-hidden border-r border-editor-border"
        style={{ minWidth: '3rem' }}
      >
        {lineNumbers.map((num) => (
          <div key={num} className="leading-6">
            {num}
          </div>
        ))}
      </div>
      
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        onKeyDown={onKeyDown}
        readOnly={readOnly}
        placeholder={placeholder}
        spellCheck={false}
        aria-label="JSON input editor"
        className={cn(
          'flex-1 p-4 bg-editor-bg text-foreground font-mono text-sm',
          'resize-none outline-none',
          'leading-6',
          'placeholder:text-muted-foreground',
          readOnly && 'cursor-default'
        )}
      />
    </div>
  );
}
