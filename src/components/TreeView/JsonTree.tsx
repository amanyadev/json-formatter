import { useState } from 'react';
import { ChevronRight, ChevronDown, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface JsonTreeProps {
  data: unknown;
  path?: string;
  level?: number;
}

export function JsonTree({ data, path = '$', level = 0 }: JsonTreeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);

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
      <span className="text-code-string font-mono">"{data}"</span>
    );
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="text-muted-foreground font-mono">[]</span>;
    }

    return (
      <div className="font-mono">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 hover:bg-accent/50 rounded px-1 transition-colors"
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} array with ${data.length} items`}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <span className="text-muted-foreground">
            Array[{data.length}]
          </span>
        </button>

        {isExpanded && (
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
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 hover:bg-accent/50 rounded px-1 transition-colors"
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} object with ${entries.length} properties`}
          >
            {isExpanded ? (
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

        {isExpanded && (
          <div className="ml-6 border-l border-border/50 pl-4 mt-1 space-y-1">
            {entries.map(([key, value]) => (
              <div key={key} className="flex items-start gap-2">
                <span className="text-code-keyword">
                  "{key}":
                </span>
                <JsonTree
                  data={value}
                  path={`${path}.${key}`}
                  level={level + 1}
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
