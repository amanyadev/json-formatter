import { formatJSON, validateJSON } from './jsonFormatter';
import type { FormatResult, LanguageFormatter } from '@/types/formatter';
import yaml from 'js-yaml';
import xmlFormatter from 'xml-formatter';

// JSON Formatter
const jsonFormatter: LanguageFormatter = {
  name: 'JSON',
  format: formatJSON,
  validate: validateJSON,
};

// XML Formatter
const xmlFormatterImpl: LanguageFormatter = {
  name: 'XML',
  format: (input: string): FormatResult => {
    try {
      const formatted = xmlFormatter(input, {
        indentation: '  ',
        collapseContent: true,
        lineSeparator: '\n',
      });
      return {
        ok: true,
        pretty: formatted,
        parsed: formatted,
        repairs: [],
        confidence: 'high',
      };
    } catch (error) {
      return {
        ok: false,
        repairs: [],
        error: error instanceof Error ? error.message : 'Invalid XML',
        confidence: 'low',
      };
    }
  },
  validate: (input: string) => {
    try {
      xmlFormatter(input);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid XML',
      };
    }
  },
};

// YAML Formatter
const yamlFormatter: LanguageFormatter = {
  name: 'YAML',
  format: (input: string): FormatResult => {
    try {
      const parsed = yaml.load(input);
      const formatted = yaml.dump(parsed, {
        indent: 2,
        lineWidth: 120,
        noRefs: true,
      });
      return {
        ok: true,
        pretty: formatted,
        parsed,
        repairs: [],
        confidence: 'high',
      };
    } catch (error) {
      return {
        ok: false,
        repairs: [],
        error: error instanceof Error ? error.message : 'Invalid YAML',
        confidence: 'low',
      };
    }
  },
  validate: (input: string) => {
    try {
      yaml.load(input);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid YAML',
      };
    }
  },
};

// SQL Formatter (basic)
const sqlFormatter: LanguageFormatter = {
  name: 'SQL',
  format: (input: string): FormatResult => {
    try {
      // Basic SQL formatting
      let formatted = input
        .replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|ON|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|INSERT INTO|UPDATE|DELETE|CREATE|ALTER|DROP|VALUES|SET)\b/gi, '\n$1')
        .replace(/,/g, ',\n  ')
        .replace(/\s+/g, ' ')
        .trim()
        .split('\n')
        .map(line => line.trim())
        .join('\n');
      
      return {
        ok: true,
        pretty: formatted,
        parsed: formatted,
        repairs: [],
        confidence: 'medium',
      };
    } catch (error) {
      return {
        ok: false,
        repairs: [],
        error: 'Could not format SQL',
        confidence: 'low',
      };
    }
  },
  validate: (input: string) => {
    // Basic SQL validation - just check if it contains SQL keywords
    const hasSQL = /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(input);
    return {
      valid: hasSQL,
      error: hasSQL ? undefined : 'Does not appear to be valid SQL',
    };
  },
};

// HTML Formatter (basic)
const htmlFormatter: LanguageFormatter = {
  name: 'HTML',
  format: (input: string): FormatResult => {
    try {
      // Basic HTML formatting
      let formatted = input
        .replace(/>\s+</g, '><')
        .replace(/(<[^/][^>]*>)/g, '\n$1')
        .replace(/(<\/[^>]+>)/g, '$1\n')
        .split('\n')
        .filter(line => line.trim())
        .map((line, index, arr) => {
          let indent = 0;
          const prevLine = arr[index - 1] || '';
          const isClosing = line.trim().startsWith('</');
          const prevIsOpening = /<[^/][^>]*>/.test(prevLine) && !/<[^>]+\/>/.test(prevLine);
          
          if (isClosing) indent = Math.max(0, index - 1);
          else if (prevIsOpening) indent = index;
          
          return '  '.repeat(Math.min(indent, 10)) + line.trim();
        })
        .join('\n');
      
      return {
        ok: true,
        pretty: formatted,
        parsed: formatted,
        repairs: [],
        confidence: 'medium',
      };
    } catch (error) {
      return {
        ok: false,
        repairs: [],
        error: 'Could not format HTML',
        confidence: 'low',
      };
    }
  },
  validate: (input: string) => {
    const hasHTML = /<\/?[a-z][\s\S]*>/i.test(input);
    return {
      valid: hasHTML,
      error: hasHTML ? undefined : 'Does not appear to be valid HTML',
    };
  },
};

// CSS Formatter (basic)
const cssFormatter: LanguageFormatter = {
  name: 'CSS',
  format: (input: string): FormatResult => {
    try {
      let formatted = input
        .replace(/\s*{\s*/g, ' {\n  ')
        .replace(/\s*}\s*/g, '\n}\n')
        .replace(/\s*;\s*/g, ';\n  ')
        .replace(/,/g, ',\n')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line)
        .join('\n');
      
      return {
        ok: true,
        pretty: formatted,
        parsed: formatted,
        repairs: [],
        confidence: 'medium',
      };
    } catch (error) {
      return {
        ok: false,
        repairs: [],
        error: 'Could not format CSS',
        confidence: 'low',
      };
    }
  },
  validate: (input: string) => {
    const hasCSS = /[{};:]/.test(input);
    return {
      valid: hasCSS,
      error: hasCSS ? undefined : 'Does not appear to be valid CSS',
    };
  },
};

// JavaScript Formatter (basic)
const javascriptFormatter: LanguageFormatter = {
  name: 'JavaScript',
  format: (input: string): FormatResult => {
    try {
      // Very basic JS formatting
      let formatted = input
        .replace(/\s*{\s*/g, ' {\n  ')
        .replace(/\s*}\s*/g, '\n}\n')
        .replace(/\s*;\s*/g, ';\n')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line)
        .join('\n');
      
      return {
        ok: true,
        pretty: formatted,
        parsed: formatted,
        repairs: [],
        confidence: 'low',
      };
    } catch (error) {
      return {
        ok: false,
        repairs: [],
        error: 'Could not format JavaScript',
        confidence: 'low',
      };
    }
  },
  validate: (input: string) => {
    try {
      new Function(input);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid JavaScript',
      };
    }
  },
};

export const languageFormatters: Record<string, LanguageFormatter> = {
  json: jsonFormatter,
  xml: xmlFormatterImpl,
  yaml: yamlFormatter,
  sql: sqlFormatter,
  html: htmlFormatter,
  css: cssFormatter,
  javascript: javascriptFormatter,
};

export const languages = Object.keys(languageFormatters);
