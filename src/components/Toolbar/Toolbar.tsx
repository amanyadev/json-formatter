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
  Menu,
  MoreVertical,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    <div className="flex items-center justify-between gap-2 sm:gap-4 p-2 sm:p-4 bg-card border-b border-border">
      {/* Left side - Logo and Title */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Code2 className="w-5 h-5 text-primary" />
        <h1 className="text-base sm:text-lg font-semibold">
          <span className="hidden sm:inline">JSON Formatter</span>
          <span className="sm:hidden">JSON</span>
        </h1>
        <ThemeToggle />
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Auto-format toggle - hidden on mobile */}
        <div className="hidden md:flex items-center gap-2">
          <Switch
            id="auto-format"
            checked={autoFormat}
            onCheckedChange={onAutoFormatChange}
            aria-label="Toggle auto-format"
          />
          <Label htmlFor="auto-format" className="text-sm cursor-pointer whitespace-nowrap">
            Auto-format
          </Label>
        </div>

        <div className="hidden md:block h-6 w-px bg-border" />

        {/* Primary Format Button - Always visible */}
        <Button
          variant="default"
          size="sm"
          onClick={onFormat}
          disabled={isFormatting}
          aria-label="Format JSON"
          className="px-2 sm:px-3"
        >
          <Play className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Format</span>
        </Button>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-2">
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

        {/* Tablet Actions - Icon only */}
        <div className="hidden md:flex lg:hidden items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onValidate}
            aria-label="Validate JSON"
            className="px-2"
          >
            <Check className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onCopy}
            aria-label="Copy formatted JSON"
            className="px-2"
          >
            <Copy className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            aria-label="Download JSON file"
            className="px-2"
          >
            <Download className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            aria-label="Clear all content"
            className="px-2"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Mobile Menu - Dropdown */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" aria-label="More actions" className="px-2">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onValidate}>
                <Check className="w-4 h-4 mr-2" />
                Validate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCopy}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onClear}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onAutoFormatChange(!autoFormat)}
                className="flex items-center justify-between"
              >
                <span>Auto-format</span>
                <Switch
                  checked={autoFormat}
                  onCheckedChange={onAutoFormatChange}
                  onClick={(e) => e.stopPropagation()}
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
