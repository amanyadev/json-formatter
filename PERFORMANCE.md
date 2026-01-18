# Performance Optimizations for Large JSON Files

This JSON formatter is optimized to handle large JSON files (5MB+) efficiently using several key techniques:

## Web Worker Architecture
- **Threshold**: Files >= 1MB are automatically processed in a Web Worker
- **Non-blocking**: Parsing happens off the main thread, keeping UI responsive
- **Progress feedback**: Real-time progress updates during parsing

## Large File Optimizations (5MB+)

### 1. Fast-path for Large Files
For files > 5MB, the parser:
- Skips expensive recovery steps (quote fixing, bracket matching, etc.)
- Only attempts direct parse and basic trimming
- Fails fast if JSON is malformed, with clear error messages

### 2. Optimized String Operations
- **Regex limits**: Regex operations capped at 10MB to prevent hanging
- **Scan limits**: Substring extraction limited to 10MB scan depth
- **Early exit**: Character-by-character iteration stops early when possible

### 3. Custom Stringify Implementation
- **Circular reference detection**: Prevents infinite loops
- **Depth limiting**: Max depth of 100 to prevent stack overflow
- **Incremental processing**: Processes objects and arrays incrementally
- **Memory efficient**: Uses WeakSet for tracking visited objects

## Performance Characteristics

| File Size | Parse Time | Uses Worker | Recovery Steps |
|-----------|------------|-------------|----------------|
| < 1MB     | < 100ms    | No          | All 8 steps    |
| 1-5MB     | 100-500ms  | Yes         | All 8 steps    |
| > 5MB     | 500ms-2s   | Yes         | 2 steps only   |

## Best Practices

### For Best Performance:
1. ✅ Use valid JSON when possible (avoids recovery steps)
2. ✅ Trim whitespace before pasting (reduces file size)
3. ✅ For very large files, ensure JSON is already valid

### What to Avoid:
1. ❌ Malformed JSON > 5MB (will fail fast)
2. ❌ Deeply nested objects > 100 levels (will truncate)
3. ❌ JSON with circular references (will be detected and marked)

## Memory Management
- Worker is reused across parsing operations (singleton pattern)
- Automatic cleanup on page unload
- No memory leaks from circular references

## Technical Details

### Optimized Stringify
- Custom implementation replaces JSON.stringify()
- Handles circular references gracefully
- Depth-first traversal with depth limiting
- Space-efficient string concatenation

### Safe Regex Operations
- All regex operations have size limits
- Pattern matching limited to 10MB chunks
- Early exit on extremely large strings

### Progressive Enhancement
- Small files use synchronous parsing (fastest)
- Medium files use worker with all recovery
- Large files use worker with minimal recovery
