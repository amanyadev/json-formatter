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
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs sm:text-sm px-2 sm:px-4"
          >
            <span className="hidden sm:inline">Tree View</span>
            <span className="sm:hidden">Tree</span>
          </TabsTrigger>
        )}
        <TabsTrigger
          value="pretty"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs sm:text-sm px-2 sm:px-4"
        >
          <span className="hidden sm:inline">Pretty {language.toUpperCase()}</span>
          <span className="sm:hidden">Pretty</span>
        </TabsTrigger>
        <TabsTrigger
          value="highlighted"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs sm:text-sm px-2 sm:px-4"
        >
          <span className="hidden sm:inline">Syntax Highlighted</span>
          <span className="sm:hidden">Syntax</span>
        </TabsTrigger>
      </TabsList>

      {showTreeView && (
        <TabsContent value="tree" className="flex-1 overflow-auto p-2 sm:p-4 mt-0">
          <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 sticky top-0 bg-card pb-2 z-10">
            <div className="flex gap-1.5 sm:gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-9 h-8 sm:h-10 text-xs sm:text-sm"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandAll(prev => prev === true ? false : true)}
                className="whitespace-nowrap h-8 sm:h-10 px-2 sm:px-3"
              >
                {expandAll ? (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Collapse All</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Expand All</span>
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="font-mono text-xs sm:text-sm">
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

      <TabsContent value="highlighted" className="flex-1 overflow-hidden mt-0 p-2 sm:p-4">
        <div className="h-full overflow-auto bg-editor-bg rounded border border-border">
          <SyntaxHighlighter code={formatted} language={language} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
