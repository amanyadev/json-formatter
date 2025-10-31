export function downloadJSON(content: string, language = 'json', filename?: string) {
  const extensions: Record<string, string> = {
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    sql: 'sql',
    html: 'html',
    css: 'css',
    javascript: 'js',
  };
  
  const ext = extensions[language] || 'txt';
  const defaultFilename = `formatted.${ext}`;
  
  const mimeTypes: Record<string, string> = {
    json: 'application/json',
    xml: 'application/xml',
    yaml: 'application/x-yaml',
    sql: 'application/sql',
    html: 'text/html',
    css: 'text/css',
    javascript: 'application/javascript',
  };
  
  const mimeType = mimeTypes[language] || 'text/plain';
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
