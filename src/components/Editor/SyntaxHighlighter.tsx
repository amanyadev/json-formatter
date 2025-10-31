import { useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-sql';

interface SyntaxHighlighterProps {
  code: string;
  language: string;
}

export function SyntaxHighlighter({ code, language }: SyntaxHighlighterProps) {
  useEffect(() => {
    Prism.highlightAll();
  }, [code, language]);

  const getLanguageClass = () => {
    const langMap: Record<string, string> = {
      json: 'json',
      javascript: 'javascript',
      xml: 'markup',
      html: 'markup',
      css: 'css',
      yaml: 'yaml',
      sql: 'sql',
    };
    return langMap[language] || 'javascript';
  };

  return (
    <pre className="!bg-transparent !p-0 !m-0 h-full overflow-auto">
      <code className={`language-${getLanguageClass()} !bg-transparent block`}>
        {code}
      </code>
    </pre>
  );
}
