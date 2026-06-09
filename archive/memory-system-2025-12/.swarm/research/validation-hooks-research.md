# Real-Time Validation Hook Patterns Research

**Agent**: validation-researcher
**Request ID**: req-1765845357407-86wt31
**Date**: 2025-12-15

## Executive Summary

This research documents middleware/hook patterns applicable to real-time validation in the anti-fabrication framework. The findings are based on analysis of existing patterns in the codebase (gaxios interceptors, before-after-hook library, Node.js diagnostics_channel) and established software architecture patterns.

**Limitations**: This research provides architectural patterns and recommendations. Actual implementation effectiveness requires empirical testing and measurement.

---

## 1. Middleware/Hook Patterns for Real-Time Validation

### Pattern 1: Interceptor Pattern (Gaxios-style)

The gaxios library implements a clean interceptor pattern suitable for validation:

```typescript
interface ValidationInterceptor<T> {
  resolved?: (content: T) => Promise<T>;  // Transform/validate on success
  rejected?: (error: ValidationError) => void;  // Handle validation failures
}

class ValidationInterceptorManager<T> extends Set<ValidationInterceptor<T> | null> {
  async run(content: T): Promise<T> {
    let result = content;
    for (const interceptor of this) {
      if (interceptor?.resolved) {
        result = await interceptor.resolved(result);
      }
    }
    return result;
  }
}
```

**Applicability to validator.ts**:
- Add request/response interceptor chains for pre-validation and post-validation hooks
- Allow external modules to register custom validation rules dynamically

### Pattern 2: Before-After-Wrap Hooks (before-after-hook style)

This pattern provides lifecycle hooks around validation operations:

```typescript
interface ValidationHooks {
  before(hook: (content: string) => void | Promise<void>): void;
  after(hook: (result: ValidationReport, content: string) => void | Promise<void>): void;
  error(hook: (error: Error, content: string) => void | Promise<void>): void;
  wrap(hook: (validateFn: Function, content: string) => ValidationReport | Promise<ValidationReport>): void;
}
```

**Key Benefits**:
- `before`: Pre-process content (normalization, sanitization)
- `after`: Post-process results (logging, metrics collection)
- `error`: Centralized error handling
- `wrap`: AOP-style cross-cutting concerns (timing, caching)

### Pattern 3: Plugin Architecture

```typescript
interface ValidationPlugin {
  name: string;
  priority: number;  // Execution order

  // Lifecycle hooks
  onBeforeValidate?(content: string): string | Promise<string>;
  onValidate?(content: string, results: ValidationResult[]): ValidationResult[];
  onAfterValidate?(report: ValidationReport): ValidationReport | Promise<ValidationReport>;

  // Rule contributions
  rules?: Record<string, RuleFunction>;
}

class ValidationEngine {
  private plugins: ValidationPlugin[] = [];

  register(plugin: ValidationPlugin): void {
    this.plugins.push(plugin);
    this.plugins.sort((a, b) => a.priority - b.priority);
  }
}
```

---

## 2. Streaming Validation Approaches

### Approach A: Transform Stream Validator

For validating streaming content (e.g., LLM output streams):

```typescript
import { Transform, TransformCallback } from 'stream';

class ValidationTransform extends Transform {
  private buffer: string = '';
  private windowSize: number;

  constructor(options: { windowSize?: number } = {}) {
    super({ objectMode: true });
    this.windowSize = options.windowSize || 500;  // chars to validate at once
  }

  _transform(chunk: Buffer, encoding: string, callback: TransformCallback): void {
    this.buffer += chunk.toString();

    // Validate when buffer exceeds window size
    if (this.buffer.length >= this.windowSize) {
      const validationResult = validateChunk(this.buffer);
      if (!validationResult.passed) {
        this.emit('validation-warning', validationResult);
      }
      this.push(chunk);
      this.buffer = this.buffer.slice(-100);  // Keep overlap for context
    } else {
      this.push(chunk);
    }
    callback();
  }

  _flush(callback: TransformCallback): void {
    // Final validation on remaining buffer
    if (this.buffer.length > 0) {
      const validationResult = validateChunk(this.buffer);
      if (!validationResult.passed) {
        this.emit('validation-warning', validationResult);
      }
    }
    callback();
  }
}
```

### Approach B: Async Iterator Validation

```typescript
async function* validateStream(
  source: AsyncIterable<string>,
  validator: (chunk: string) => ValidationResult[]
): AsyncGenerator<{ chunk: string; warnings: ValidationResult[] }> {
  let buffer = '';

  for await (const chunk of source) {
    buffer += chunk;

    // Incremental validation with sentence boundary detection
    const sentences = buffer.split(/(?<=[.!?])\s+/);
    const complete = sentences.slice(0, -1);
    buffer = sentences[sentences.length - 1];

    for (const sentence of complete) {
      const warnings = validator(sentence);
      yield { chunk: sentence, warnings };
    }
  }

  // Emit final buffer
  if (buffer.length > 0) {
    const warnings = validator(buffer);
    yield { chunk: buffer, warnings };
  }
}
```

### Approach C: Observable-Based (RxJS-compatible)

```typescript
interface ValidationObserver {
  next(result: { content: string; validation: ValidationReport }): void;
  error(err: Error): void;
  complete(): void;
}

function createValidationObservable(
  source: AsyncIterable<string>
): { subscribe: (observer: ValidationObserver) => () => void } {
  return {
    subscribe(observer) {
      const run = async () => {
        try {
          for await (const { chunk, warnings } of validateStream(source, validate)) {
            observer.next({ content: chunk, validation: { /* ... */ } });
          }
          observer.complete();
        } catch (err) {
          observer.error(err as Error);
        }
      };
      run();
      return () => { /* cleanup */ };
    }
  };
}
```

---

## 3. Event-Driven Validation Architectures

### Architecture A: Diagnostics Channel Pattern

Using Node.js diagnostics_channel for zero-overhead publishing when no subscribers:

```typescript
import diagnostics_channel from 'node:diagnostics_channel';

// Define validation channels
const channels = {
  validationStart: diagnostics_channel.channel('validation:start'),
  validationEnd: diagnostics_channel.channel('validation:end'),
  ruleTriggered: diagnostics_channel.channel('validation:rule-triggered'),
  error: diagnostics_channel.channel('validation:error'),
};

// In validator.ts
export function validate(content: string): ValidationReport {
  if (channels.validationStart.hasSubscribers) {
    channels.validationStart.publish({ content, timestamp: Date.now() });
  }

  const results: ValidationResult[] = [];

  // Run rules, publishing events
  for (const [name, rule] of Object.entries(rules)) {
    const ruleResults = rule(content);
    if (ruleResults.length > 0 && channels.ruleTriggered.hasSubscribers) {
      channels.ruleTriggered.publish({ rule: name, results: ruleResults });
    }
    results.push(...ruleResults);
  }

  const report = buildReport(content, results);

  if (channels.validationEnd.hasSubscribers) {
    channels.validationEnd.publish({ report, duration: /* ... */ });
  }

  return report;
}

// External subscriber (e.g., metrics collector)
diagnostics_channel.subscribe('validation:rule-triggered', (message) => {
  const { rule, results } = message as { rule: string; results: ValidationResult[] };
  metricsCollector.increment(`validation.${rule}.triggered`, results.length);
});
```

### Architecture B: EventEmitter-Based Validator

```typescript
import { EventEmitter } from 'events';

interface ValidatorEvents {
  'before:validate': [content: string];
  'after:validate': [report: ValidationReport];
  'rule:triggered': [rule: string, results: ValidationResult[]];
  'rule:passed': [rule: string];
  'error': [error: Error, context: { content: string; rule?: string }];
}

class EventDrivenValidator extends EventEmitter {
  private rules: Map<string, RuleFunction> = new Map();

  // Type-safe event methods
  on<K extends keyof ValidatorEvents>(
    event: K,
    listener: (...args: ValidatorEvents[K]) => void
  ): this {
    return super.on(event, listener as any);
  }

  emit<K extends keyof ValidatorEvents>(event: K, ...args: ValidatorEvents[K]): boolean {
    return super.emit(event, ...args);
  }

  validate(content: string): ValidationReport {
    this.emit('before:validate', content);

    const results: ValidationResult[] = [];

    for (const [name, rule] of this.rules) {
      try {
        const ruleResults = rule(content);
        if (ruleResults.length > 0) {
          this.emit('rule:triggered', name, ruleResults);
          results.push(...ruleResults);
        } else {
          this.emit('rule:passed', name);
        }
      } catch (err) {
        this.emit('error', err as Error, { content, rule: name });
      }
    }

    const report = this.buildReport(content, results);
    this.emit('after:validate', report);

    return report;
  }
}
```

### Architecture C: Message Queue Integration

For distributed validation scenarios:

```typescript
interface ValidationMessage {
  id: string;
  content: string;
  source: string;
  timestamp: string;
  priority: 'high' | 'normal' | 'low';
}

interface ValidationResultMessage {
  requestId: string;
  report: ValidationReport;
  processingTimeMs: number;
}

// Producer side (agent output)
async function publishForValidation(content: string, source: string): Promise<string> {
  const message: ValidationMessage = {
    id: generateId(),
    content,
    source,
    timestamp: new Date().toISOString(),
    priority: 'normal',
  };

  await messageQueue.publish('validation.requests', message);
  return message.id;
}

// Consumer side (validation worker)
async function startValidationWorker(): Promise<void> {
  await messageQueue.subscribe('validation.requests', async (message: ValidationMessage) => {
    const startTime = Date.now();
    const report = validate(message.content);

    const result: ValidationResultMessage = {
      requestId: message.id,
      report,
      processingTimeMs: Date.now() - startTime,
    };

    await messageQueue.publish('validation.results', result);
  });
}
```

---

## 4. Implementation Recommendations for validator.ts

### Recommendation 1: Add Hook System (Priority: High)

Extend validator.ts with a before/after hook system:

```typescript
// Add to validator.ts

type BeforeHook = (content: string) => string | Promise<string>;
type AfterHook = (report: ValidationReport) => ValidationReport | Promise<ValidationReport>;

const hooks = {
  before: new Set<BeforeHook>(),
  after: new Set<AfterHook>(),
};

export function addBeforeHook(hook: BeforeHook): () => void {
  hooks.before.add(hook);
  return () => hooks.before.delete(hook);
}

export function addAfterHook(hook: AfterHook): () => void {
  hooks.after.add(hook);
  return () => hooks.after.delete(hook);
}

// Modify validate() to use hooks
export async function validateAsync(content: string): Promise<ValidationReport> {
  // Run before hooks
  let processedContent = content;
  for (const hook of hooks.before) {
    processedContent = await hook(processedContent);
  }

  // Existing validation logic
  const normalizedContent = normalizeInput(processedContent);
  const results: ValidationResult[] = [];
  // ... run rules ...

  let report = buildReport(content, results);

  // Run after hooks
  for (const hook of hooks.after) {
    report = await hook(report);
  }

  return report;
}
```

### Recommendation 2: Add Rule Registration API (Priority: High)

Allow dynamic rule registration:

```typescript
// Add to validator.ts

type RuleFunction = (content: string) => ValidationResult[];

const customRules = new Map<string, RuleFunction>();

export function registerRule(name: string, rule: RuleFunction): void {
  if (customRules.has(name)) {
    throw new Error(`Rule "${name}" already registered`);
  }
  customRules.set(name, rule);
}

export function unregisterRule(name: string): boolean {
  return customRules.delete(name);
}

// Modify validate() to include custom rules
// In the validation loop:
for (const [name, rule] of customRules) {
  results.push(...rule(normalizedContent));
}
```

### Recommendation 3: Add Streaming Support (Priority: Medium)

Export a streaming validator for real-time use:

```typescript
// Add to validator.ts or new file: validator-stream.ts

export function createValidationStream(options?: {
  windowSize?: number;
  emitWarningsOnly?: boolean;
}): Transform {
  return new ValidationTransform(options);
}

export async function* validateAsyncIterable(
  source: AsyncIterable<string>
): AsyncGenerator<{ chunk: string; report: ValidationReport }> {
  // Implementation as shown in Approach B above
}
```

### Recommendation 4: Add Event Channels (Priority: Medium)

For observability without coupling:

```typescript
// Add to validator.ts

import diagnostics_channel from 'node:diagnostics_channel';

export const validationChannels = {
  start: diagnostics_channel.channel('anti-fabrication:validation:start'),
  end: diagnostics_channel.channel('anti-fabrication:validation:end'),
  violation: diagnostics_channel.channel('anti-fabrication:validation:violation'),
};

// Usage in validate():
if (validationChannels.violation.hasSubscribers) {
  for (const result of results.filter(r => !r.valid)) {
    validationChannels.violation.publish({
      rule: result.rule,
      message: result.message,
      severity: result.severity,
    });
  }
}
```

### Recommendation 5: Add Validation Context (Priority: Low)

Support contextual validation for different scenarios:

```typescript
export interface ValidationContext {
  source: 'agent-output' | 'user-input' | 'file-content';
  agentId?: string;
  sessionId?: string;
  strictMode?: boolean;  // Treat warnings as errors
  skipRules?: string[];  // Allow rule exemptions with audit trail
}

export function validateWithContext(
  content: string,
  context: ValidationContext
): ValidationReport {
  // Filter rules based on context
  // Apply stricter thresholds in strictMode
  // Log exemptions when skipRules used
}
```

---

## 5. Current Rules Integration Points

The existing rules in validator.ts can be enhanced with hooks at these points:

| Rule | Before Hook Use | After Hook Use |
|------|-----------------|----------------|
| noSuperlatives | Content preprocessing | Alternative word suggestions |
| noFabricatedScores | Evidence extraction | Score context enrichment |
| requiresUncertainty | Claim detection | Uncertainty injection suggestions |
| evidenceRequired | Source link validation | Citation formatting |
| citationFormat | Citation normalization | Citation database lookup |
| consistencyCheck | Metric normalization | Conflict resolution suggestions |
| sourceVerification | URL/DOI validation | Source credibility scoring |
| hedgingBalance | Sentence segmentation | Hedge word replacement suggestions |

---

## 6. Testing Considerations

Any implementation should include:

1. **Unit tests** for hook registration/removal
2. **Integration tests** for hook execution order
3. **Performance benchmarks** comparing with/without hooks
4. **Memory tests** for streaming validation
5. **Concurrency tests** for async hook execution

**Note**: Performance impact of hook systems requires measurement. Initial estimates suggest <5% overhead for synchronous hooks, but this claim requires validation through benchmarking.

---

## References

- Analyzed: `node_modules/gaxios/build/src/interceptor.d.ts`
- Analyzed: `node_modules/before-after-hook/index.d.ts`
- Analyzed: `node_modules/@types/node/diagnostics_channel.d.ts`
- Analyzed: `node_modules/@types/node/stream.d.ts`
- Analyzed: `framework/validation/validator.ts`
