import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JsonEditor } from '@/components/Editor/JsonEditor';
import { JsonTree } from '@/components/TreeView/JsonTree';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';

interface OutputViewProps {
  formatted: string;
  parsed: unknown;
  className?: string;
}

export function OutputView({ formatted, parsed, className }: OutputViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandAll, setExpandAll] = useState(false);

  return (
    <Tabs defaultValue="tree" className={className}>
      <TabsList className="w-full justify-start rounded-none border-b">
        <TabsTrigger value="tree">Tree View</TabsTrigger>
        <TabsTrigger value="raw">Pretty JSON</TabsTrigger>
      </TabsList>

      <TabsContent value="tree" className="h-[calc(100%-3rem)] m-0 flex flex-col">
        <div className="p-3 border-b border-border flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search in JSON..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandAll(!expandAll)}
            className="gap-2"
          >
            {expandAll ? (
              <>
                <ChevronRight className="h-4 w-4" />
                Collapse All
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Expand All
              </>
            )}
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4">
            <JsonTree data={parsed} searchTerm={searchTerm} expandAll={expandAll} />
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="raw" className="h-[calc(100%-3rem)] m-0">
        <JsonEditor
          value={formatted}
          onChange={() => {}}
          readOnly
          placeholder="Formatted JSON will appear here..."
        />
      </TabsContent>
    </Tabs>
  );
}
