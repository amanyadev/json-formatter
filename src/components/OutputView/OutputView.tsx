import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JsonEditor } from '@/components/Editor/JsonEditor';
import { JsonTree } from '@/components/TreeView/JsonTree';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { SyntaxHighlighter } from '@/components/Editor/SyntaxHighlighter';

interface OutputViewProps {
  formatted: string;
  parsed: unknown;
  className?: string;
  language?: string;
}

export function OutputView({ formatted, parsed, className, language = 'json' }: OutputViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandAll, setExpandAll] = useState<boolean | undefined>(undefined);

  const showTreeView = language === 'json' && parsed !== undefined;

  return (
    <Tabs defaultValue={showTreeView ? "tree" : "pretty"} className={`h-full flex flex-col ${className || ''}`}>
      <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
        {showTreeView && (
          <TabsTrigger 
            value="tree" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Tree View
          </TabsTrigger>
        )}
        <TabsTrigger 
          value="pretty" 
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          Pretty {language.toUpperCase()}
        </TabsTrigger>
        <TabsTrigger 
          value="highlighted" 
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          Syntax Highlighted
        </TabsTrigger>
      </TabsList>

      {showTreeView && (
        <TabsContent value="tree" className="flex-1 overflow-auto p-4 mt-0">
          <div className="space-y-3 mb-4 sticky top-0 bg-card pb-2 z-10">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search in tree..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandAll(prev => prev === true ? false : true)}
                className="whitespace-nowrap"
              >
                {expandAll ? (
                  <>
                    <ChevronRight className="w-4 h-4 mr-1" />
                    Collapse All
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Expand All
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="font-mono text-sm">
            <JsonTree 
              data={parsed} 
              searchTerm={searchTerm}
              expandAll={expandAll}
            />
          </div>
        </TabsContent>
      )}

      <TabsContent value="pretty" className="flex-1 overflow-hidden mt-0">
        <JsonEditor value={formatted} onChange={() => {}} readOnly language={language} />
      </TabsContent>

      <TabsContent value="highlighted" className="flex-1 overflow-hidden mt-0 p-4">
        <div className="h-full overflow-auto bg-editor-bg rounded border border-border">
          <SyntaxHighlighter code={formatted} language={language} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
