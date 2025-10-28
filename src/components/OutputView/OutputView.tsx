import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JsonEditor } from '@/components/Editor/JsonEditor';
import { JsonTree } from '@/components/TreeView/JsonTree';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OutputViewProps {
  formatted: string;
  parsed: unknown;
  className?: string;
}

export function OutputView({ formatted, parsed, className }: OutputViewProps) {
  return (
    <Tabs defaultValue="tree" className={className}>
      <TabsList className="w-full justify-start rounded-none border-b">
        <TabsTrigger value="tree">Tree View</TabsTrigger>
        <TabsTrigger value="raw">Pretty JSON</TabsTrigger>
      </TabsList>

      <TabsContent value="tree" className="h-[calc(100%-3rem)] m-0">
        <ScrollArea className="h-full">
          <div className="p-4">
            <JsonTree data={parsed} />
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
