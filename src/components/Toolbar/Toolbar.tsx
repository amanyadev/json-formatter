import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Code2,
  Check,
  Copy,
  Download,
  Trash2,
  Play,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ToolbarProps {
  onFormat: () => void;
  onValidate: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onClear: () => void;
  autoFormat: boolean;
  onAutoFormatChange: (enabled: boolean) => void;
  isFormatting?: boolean;
}

export function Toolbar({
  onFormat,
  onValidate,
  onCopy,
  onDownload,
  onClear,
  autoFormat,
  onAutoFormatChange,
  isFormatting = false,
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-card border-b border-border">
      <div className="flex items-center gap-2">
        <Code2 className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-semibold">JSON Formatter</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch
            id="auto-format"
            checked={autoFormat}
            onCheckedChange={onAutoFormatChange}
            aria-label="Toggle auto-format"
          />
          <Label htmlFor="auto-format" className="text-sm cursor-pointer">
            Auto-format
          </Label>
        </div>

        <div className="h-6 w-px bg-border" />

        <Button
          variant="default"
          size="sm"
          onClick={onFormat}
          disabled={isFormatting}
          aria-label="Format JSON"
        >
          <Play className="w-4 h-4 mr-2" />
          Format
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onValidate}
          aria-label="Validate JSON"
        >
          <Check className="w-4 h-4 mr-2" />
          Validate
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onCopy}
          aria-label="Copy formatted JSON"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          aria-label="Download JSON file"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          aria-label="Clear all content"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear
        </Button>
      </div>
    </div>
  );
}
