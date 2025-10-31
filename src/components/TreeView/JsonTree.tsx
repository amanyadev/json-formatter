import { useState } from 'react';
import { ChevronRight, ChevronDown, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface JsonTreeProps {
  data: unknown;
  path?: string;
  level?: number;
  searchTerm?: string;
  expandAll?: boolean;
}

export function JsonTree({ data, path = '$', level = 0, searchTerm = '', expandAll }: JsonTreeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  
  // Use expandAll if explicitly set, otherwise use local state
  const expanded = expandAll !== undefined ? expandAll : isExpanded;
  
  // Highlight search matches
  const highlightMatch = (text: string) => {
    if (!searchTerm || !text.toLowerCase().includes(searchTerm.toLowerCase())) {
      return text;
    }
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-warning/30 text-foreground rounded px-1">{part}</mark>
      ) : (
        part
      )
    );
  };

  const copyPath = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    toast({
      title: 'Path copied',
      description: path,
    });
  };

  if (data === null) {
    return (
      <span className="text-code-null font-mono">null</span>
    );
  }

  if (typeof data === 'boolean') {
    return (
      <span className="text-code-boolean font-mono">{String(data)}</span>
    );
  }

  if (typeof data === 'number') {
    return (
      <span className="text-code-number font-mono">{data}</span>
    );
  }

  if (typeof data === 'string') {
    return (
      <span className="text-code-string font-mono">"{highlightMatch(data)}"</span>
    );
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="text-muted-foreground font-mono">[]</span>;
    }

    return (
      <div className="font-mono">
        <button
          onClick={() => setIsExpanded(prev => !prev)}
          className="inline-flex items-center gap-1 hover:bg-accent/50 rounded px-1 transition-colors"
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} array with ${data.length} items`}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <span className="text-muted-foreground">
            Array[{data.length}]
          </span>
        </button>

        {expanded && (
          <div className="ml-6 border-l border-border/50 pl-4 mt-1 space-y-1">
            {data.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-muted-foreground min-w-[2rem]">
                  {index}:
                </span>
                <JsonTree
                  data={item}
                  path={`${path}[${index}]`}
                  level={level + 1}
                  searchTerm={searchTerm}
                  expandAll={expandAll}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data);
    
    if (entries.length === 0) {
      return <span className="text-muted-foreground font-mono">{'{}'}</span>;
    }

    return (
      <div className="font-mono">
        <div className="inline-flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className="inline-flex items-center gap-1 hover:bg-accent/50 rounded px-1 transition-colors"
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} object with ${entries.length} properties`}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <span className="text-muted-foreground">
              Object{'{' + entries.length + '}'}
            </span>
          </button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={copyPath}
            className="h-6 px-2"
            aria-label={`Copy path: ${path}`}
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>

        {expanded && (
          <div className="ml-6 border-l border-border/50 pl-4 mt-1 space-y-1">
            {entries.map(([key, value]) => (
              <div key={key} className="flex items-start gap-2">
                <span className="text-code-keyword">
                  "{highlightMatch(key)}":
                </span>
                <JsonTree
                  data={value}
                  path={`${path}.${key}`}
                  level={level + 1}
                  searchTerm={searchTerm}
                  expandAll={expandAll}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <span className="text-muted-foreground font-mono">{String(data)}</span>;
}
