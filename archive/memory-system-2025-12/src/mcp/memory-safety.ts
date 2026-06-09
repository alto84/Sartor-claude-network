/**
 * Memory Safety Layer
 *
 * Provides security primitives for the Memory MCP Server:
 * - Prompt injection detection
 * - Trust level classification
 * - Full audit logging
 * - Human oversight hooks
 */

import * as crypto from 'crypto';

// ============================================================================
// ENUMS & TYPES
// ============================================================================

/**
 * Trust levels for memory content
 */
export enum MemoryTrustLevel {
  /** Verified by human review or trusted source */
  VERIFIED = 'verified',
  /** From authenticated agent, not yet verified */
  TRUSTED = 'trusted',
  /** From unknown or unverified source */
  UNTRUSTED = 'untrusted',
  /** Flagged as potentially malicious, awaiting review */
  QUARANTINED = 'quarantined',
}

/**
 * Types of detected threats
 */
export enum ThreatType {
  PROMPT_INJECTION = 'prompt_injection',
  JAILBREAK_ATTEMPT = 'jailbreak_attempt',
  DATA_EXFILTRATION = 'data_exfiltration',
  ROLE_MANIPULATION = 'role_manipulation',
  INSTRUCTION_OVERRIDE = 'instruction_override',
  ENCODING_ATTACK = 'encoding_attack',
  CONTEXT_OVERFLOW = 'context_overflow',
}

/**
 * Severity levels for threats
 */
export enum ThreatSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Result of a security scan
 */
export interface ScanResult {
  safe: boolean;
  threats: DetectedThreat[];
  trustLevel: MemoryTrustLevel;
  scanDurationMs: number;
  scanId: string;
}

/**
 * A detected threat
 */
export interface DetectedThreat {
  type: ThreatType;
  severity: ThreatSeverity;
  pattern: string;
  matchedContent: string;
  position: { start: number; end: number };
  confidence: number;
  recommendation: string;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  operation: MemoryOperation;
  memoryId: string;
  agentId: string;
  previousState?: unknown;
  newState?: unknown;
  trustLevel: MemoryTrustLevel;
  scanResult?: ScanResult;
  metadata: Record<string, unknown>;
}

/**
 * Memory operations that can be audited
 */
export enum MemoryOperation {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  SEARCH = 'search',
  SYNC = 'sync',
  QUARANTINE = 'quarantine',
  RELEASE = 'release',
}

/**
 * Oversight action for human review
 */
export interface OversightAction {
  id: string;
  timestamp: Date;
  memoryId: string;
  reason: string;
  threats: DetectedThreat[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  reviewedBy?: string;
  reviewedAt?: Date;
  notes?: string;
}

/**
 * Interface for human oversight hook implementations
 */
export interface HumanOversightHook {
  /** Called when suspicious content is detected */
  onSuspiciousContent(
    memoryId: string,
    content: string,
    threats: DetectedThreat[]
  ): Promise<OversightAction>;

  /** Called when content is quarantined */
  onQuarantine(memoryId: string, reason: string): Promise<void>;

  /** Called to check if content should be released from quarantine */
  checkRelease(memoryId: string): Promise<boolean>;

  /** Get all pending oversight actions */
  getPendingActions(): Promise<OversightAction[]>;

  /** Resolve an oversight action */
  resolveAction(
    actionId: string,
    decision: 'approve' | 'reject' | 'escalate',
    reviewerId: string,
    notes?: string
  ): Promise<void>;
}

// ============================================================================
// INJECTION SCANNER
// ============================================================================

/**
 * Patterns for detecting various injection attacks
 */
const INJECTION_PATTERNS: Array<{
  pattern: RegExp;
  type: ThreatType;
  severity: ThreatSeverity;
  description: string;
}> = [
  // Prompt injection patterns
  {
    pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|commands?)/gi,
    type: ThreatType.PROMPT_INJECTION,
    severity: ThreatSeverity.CRITICAL,
    description: 'Attempt to ignore previous instructions',
  },
  {
    pattern: /disregard\s+(all\s+)?(previous|prior|earlier)\s+(instructions?|rules?)/gi,
    type: ThreatType.PROMPT_INJECTION,
    severity: ThreatSeverity.CRITICAL,
    description: 'Attempt to disregard instructions',
  },
  {
    pattern: /forget\s+(everything|all)\s+(you|I)\s+(told|said|instructed)/gi,
    type: ThreatType.PROMPT_INJECTION,
    severity: ThreatSeverity.HIGH,
    description: 'Attempt to make model forget context',
  },
  {
    pattern: /new\s+(system\s+)?prompt[:\s]/gi,
    type: ThreatType.PROMPT_INJECTION,
    severity: ThreatSeverity.CRITICAL,
    description: 'Attempt to inject new system prompt',
  },
  {
    pattern: /\[\[?system\]?\]?[:\s]/gi,
    type: ThreatType.PROMPT_INJECTION,
    severity: ThreatSeverity.HIGH,
    description: 'Fake system message marker',
  },
  {
    pattern: /<\/?system>/gi,
    type: ThreatType.PROMPT_INJECTION,
    severity: ThreatSeverity.HIGH,
    description: 'XML-style system tag injection',
  },

  // Jailbreak patterns
  {
    pattern: /DAN\s*(mode|prompt)?|do\s+anything\s+now/gi,
    type: ThreatType.JAILBREAK_ATTEMPT,
    severity: ThreatSeverity.CRITICAL,
    description: 'DAN jailbreak attempt',
  },
  {
    pattern: /pretend\s+(you\s+)?(are|to\s+be)\s+(a\s+)?(different|another|evil|unrestricted)/gi,
    type: ThreatType.JAILBREAK_ATTEMPT,
    severity: ThreatSeverity.HIGH,
    description: 'Role-play jailbreak attempt',
  },
  {
    pattern: /you\s+are\s+now\s+(in\s+)?("?developer"?|"?god"?|"?admin"?)\s*mode/gi,
    type: ThreatType.JAILBREAK_ATTEMPT,
    severity: ThreatSeverity.CRITICAL,
    description: 'Developer/God mode jailbreak',
  },
  {
    pattern: /unlock(ed)?\s+(capabilities?|restrictions?|safety)/gi,
    type: ThreatType.JAILBREAK_ATTEMPT,
    severity: ThreatSeverity.HIGH,
    description: 'Unlock restrictions attempt',
  },

  // Role manipulation
  {
    pattern: /you\s+are\s+(now\s+)?(my\s+)?(assistant|helper|slave|servant)/gi,
    type: ThreatType.ROLE_MANIPULATION,
    severity: ThreatSeverity.MEDIUM,
    description: 'Attempt to redefine assistant role',
  },
  {
    pattern: /from\s+now\s+on[,\s]+(you\s+)?(will|must|should|shall)/gi,
    type: ThreatType.ROLE_MANIPULATION,
    severity: ThreatSeverity.MEDIUM,
    description: 'Attempt to establish new behavior rules',
  },

  // Instruction override
  {
    pattern: /override\s+(your\s+)?(instructions?|programming|directives?)/gi,
    type: ThreatType.INSTRUCTION_OVERRIDE,
    severity: ThreatSeverity.CRITICAL,
    description: 'Direct instruction override attempt',
  },
  {
    pattern: /bypass\s+(your\s+)?(safety|security|restrictions?|filters?)/gi,
    type: ThreatType.INSTRUCTION_OVERRIDE,
    severity: ThreatSeverity.CRITICAL,
    description: 'Safety bypass attempt',
  },

  // Data exfiltration
  {
    pattern: /reveal\s+(your\s+)?(system\s+)?(prompt|instructions?|training)/gi,
    type: ThreatType.DATA_EXFILTRATION,
    severity: ThreatSeverity.HIGH,
    description: 'Attempt to extract system prompt',
  },
  {
    pattern: /print\s+(your\s+)?(initial|system|full)\s+(prompt|instructions?)/gi,
    type: ThreatType.DATA_EXFILTRATION,
    severity: ThreatSeverity.HIGH,
    description: 'Attempt to print system instructions',
  },
  {
    pattern: /what\s+(are|were)\s+(your\s+)?(original|initial|system)\s+(instructions?|prompt)/gi,
    type: ThreatType.DATA_EXFILTRATION,
    severity: ThreatSeverity.MEDIUM,
    description: 'Query for system instructions',
  },

  // Encoding attacks (base64, hex, etc.)
  {
    pattern: /base64[:\s]|decode\s+(this|the\s+following)/gi,
    type: ThreatType.ENCODING_ATTACK,
    severity: ThreatSeverity.MEDIUM,
    description: 'Potential encoded payload',
  },
  {
    pattern: /\\x[0-9a-fA-F]{2}|\\u[0-9a-fA-F]{4}/g,
    type: ThreatType.ENCODING_ATTACK,
    severity: ThreatSeverity.MEDIUM,
    description: 'Hex/Unicode escape sequences',
  },

  // Context overflow
  {
    pattern: /(.)\1{100,}/g,
    type: ThreatType.CONTEXT_OVERFLOW,
    severity: ThreatSeverity.LOW,
    description: 'Repeated character pattern (potential overflow)',
  },
];

/**
 * Scanner for detecting prompt injection and other attacks in memory content
 */
export class InjectionScanner {
  private patterns: typeof INJECTION_PATTERNS;
  private customPatterns: typeof INJECTION_PATTERNS = [];

  constructor() {
    this.patterns = [...INJECTION_PATTERNS];
  }

  /**
   * Add a custom detection pattern
   */
  addPattern(
    pattern: RegExp,
    type: ThreatType,
    severity: ThreatSeverity,
    description: string
  ): void {
    this.customPatterns.push({ pattern, type, severity, description });
  }

  /**
   * Scan content for potential threats
   */
  scan(content: string, sourceAgentId: string = 'unknown'): ScanResult {
    const startTime = Date.now();
    const scanId = crypto.randomUUID();
    const threats: DetectedThreat[] = [];
    const allPatterns = [...this.patterns, ...this.customPatterns];

    for (const { pattern, type, severity, description } of allPatterns) {
      // Reset regex state for global patterns
      pattern.lastIndex = 0;

      let match: RegExpExecArray | null;
      while ((match = pattern.exec(content)) !== null) {
        const confidence = this.calculateConfidence(match[0], type, content);

        threats.push({
          type,
          severity,
          pattern: pattern.source,
          matchedContent: match[0],
          position: {
            start: match.index,
            end: match.index + match[0].length,
          },
          confidence,
          recommendation: this.getRecommendation(type, severity),
        });

        // Prevent infinite loops for patterns that match empty strings
        if (match[0].length === 0) {
          pattern.lastIndex++;
        }
      }
    }

    // Deduplicate overlapping threats
    const uniqueThreats = this.deduplicateThreats(threats);

    // Determine trust level based on threats
    const trustLevel = this.determineTrustLevel(uniqueThreats, sourceAgentId);

    return {
      safe: uniqueThreats.length === 0,
      threats: uniqueThreats,
      trustLevel,
      scanDurationMs: Date.now() - startTime,
      scanId,
    };
  }

  /**
   * Quick check if content contains obvious threats
   */
  quickScan(content: string): boolean {
    const criticalPatterns = this.patterns.filter((p) => p.severity === ThreatSeverity.CRITICAL);

    for (const { pattern } of criticalPatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) {
        return false; // Not safe
      }
    }
    return true; // Likely safe
  }

  /**
   * Calculate confidence score for a threat detection
   */
  private calculateConfidence(
    matchedContent: string,
    type: ThreatType,
    fullContent: string
  ): number {
    let confidence = 0.5;

    // Increase confidence for longer matches
    if (matchedContent.length > 20) confidence += 0.1;
    if (matchedContent.length > 50) confidence += 0.1;

    // Increase confidence for certain threat types
    if (type === ThreatType.PROMPT_INJECTION) confidence += 0.2;
    if (type === ThreatType.JAILBREAK_ATTEMPT) confidence += 0.2;

    // Decrease confidence if content looks like a discussion about security
    const securityDiscussionPatterns = [
      /example\s+of/gi,
      /how\s+to\s+detect/gi,
      /what\s+is\s+a/gi,
      /security\s+research/gi,
      /testing\s+for/gi,
    ];

    for (const pattern of securityDiscussionPatterns) {
      if (pattern.test(fullContent)) {
        confidence -= 0.15;
      }
    }

    // Clamp confidence between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Get recommendation for handling a threat
   */
  private getRecommendation(type: ThreatType, severity: ThreatSeverity): string {
    const recommendations: Record<ThreatType, string> = {
      [ThreatType.PROMPT_INJECTION]: 'Quarantine content and flag for human review',
      [ThreatType.JAILBREAK_ATTEMPT]: 'Block content and log incident',
      [ThreatType.DATA_EXFILTRATION]: 'Sanitize content and monitor for patterns',
      [ThreatType.ROLE_MANIPULATION]: 'Review content context before allowing',
      [ThreatType.INSTRUCTION_OVERRIDE]: 'Reject content immediately',
      [ThreatType.ENCODING_ATTACK]: 'Decode and re-scan before allowing',
      [ThreatType.CONTEXT_OVERFLOW]: 'Truncate or reject oversized content',
    };

    return severity === ThreatSeverity.CRITICAL
      ? `CRITICAL: ${recommendations[type]}. Immediate attention required.`
      : recommendations[type];
  }

  /**
   * Remove duplicate/overlapping threat detections
   */
  private deduplicateThreats(threats: DetectedThreat[]): DetectedThreat[] {
    if (threats.length <= 1) return threats;

    // Sort by position
    const sorted = [...threats].sort((a, b) => a.position.start - b.position.start);

    const unique: DetectedThreat[] = [];
    let lastEnd = -1;

    for (const threat of sorted) {
      // Keep if non-overlapping or higher severity
      if (threat.position.start >= lastEnd) {
        unique.push(threat);
        lastEnd = threat.position.end;
      } else {
        // Overlapping - keep higher severity
        const lastThreat = unique[unique.length - 1];
        if (this.severityToNumber(threat.severity) > this.severityToNumber(lastThreat.severity)) {
          unique[unique.length - 1] = threat;
          lastEnd = threat.position.end;
        }
      }
    }

    return unique;
  }

  /**
   * Convert severity to number for comparison
   */
  private severityToNumber(severity: ThreatSeverity): number {
    const map: Record<ThreatSeverity, number> = {
      [ThreatSeverity.LOW]: 1,
      [ThreatSeverity.MEDIUM]: 2,
      [ThreatSeverity.HIGH]: 3,
      [ThreatSeverity.CRITICAL]: 4,
    };
    return map[severity];
  }

  /**
   * Determine trust level based on detected threats
   */
  private determineTrustLevel(threats: DetectedThreat[], sourceAgentId: string): MemoryTrustLevel {
    if (threats.length === 0) {
      // No threats - trust based on source
      return sourceAgentId === 'system' || sourceAgentId === 'human'
        ? MemoryTrustLevel.VERIFIED
        : MemoryTrustLevel.TRUSTED;
    }

    const maxSeverity = Math.max(...threats.map((t) => this.severityToNumber(t.severity)));

    if (maxSeverity >= this.severityToNumber(ThreatSeverity.HIGH)) {
      return MemoryTrustLevel.QUARANTINED;
    }

    return MemoryTrustLevel.UNTRUSTED;
  }
}

// ============================================================================
// AUDIT LOGGER
// ============================================================================

/**
 * Configuration for the audit logger
 */
export interface AuditLoggerConfig {
  /** Enable console logging */
  consoleOutput: boolean;
  /** Enable file logging */
  fileOutput: boolean;
  /** Log file path */
  filePath?: string;
  /** Maximum log entries to keep in memory */
  maxMemoryEntries: number;
  /** Operations to log (empty = all) */
  operations?: MemoryOperation[];
  /** Minimum trust level to log */
  minTrustLevel?: MemoryTrustLevel;
}

/**
 * Full audit trail logger for all memory operations
 */
export class AuditLogger {
  private config: AuditLoggerConfig;
  private entries: AuditLogEntry[] = [];
  private listeners: Array<(entry: AuditLogEntry) => void> = [];

  constructor(config: Partial<AuditLoggerConfig> = {}) {
    this.config = {
      consoleOutput: config.consoleOutput ?? false,
      fileOutput: config.fileOutput ?? false,
      filePath: config.filePath ?? './audit.log',
      maxMemoryEntries: config.maxMemoryEntries ?? 10000,
      operations: config.operations,
      minTrustLevel: config.minTrustLevel,
    };
  }

  /**
   * Log a memory operation
   */
  log(
    operation: MemoryOperation,
    memoryId: string,
    agentId: string,
    trustLevel: MemoryTrustLevel,
    options: {
      previousState?: unknown;
      newState?: unknown;
      scanResult?: ScanResult;
      metadata?: Record<string, unknown>;
    } = {}
  ): AuditLogEntry {
    // Check if we should log this operation
    if (this.config.operations && !this.config.operations.includes(operation)) {
      return this.createEntry(operation, memoryId, agentId, trustLevel, options);
    }

    const entry = this.createEntry(operation, memoryId, agentId, trustLevel, options);

    // Store in memory
    this.entries.push(entry);
    if (this.entries.length > this.config.maxMemoryEntries) {
      this.entries.shift();
    }

    // Output to console
    if (this.config.consoleOutput) {
      this.logToConsole(entry);
    }

    // Notify listeners
    for (const listener of this.listeners) {
      try {
        listener(entry);
      } catch (error) {
        console.error('Audit listener error:', error);
      }
    }

    return entry;
  }

  /**
   * Create an audit entry
   */
  private createEntry(
    operation: MemoryOperation,
    memoryId: string,
    agentId: string,
    trustLevel: MemoryTrustLevel,
    options: {
      previousState?: unknown;
      newState?: unknown;
      scanResult?: ScanResult;
      metadata?: Record<string, unknown>;
    }
  ): AuditLogEntry {
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      operation,
      memoryId,
      agentId,
      previousState: options.previousState,
      newState: options.newState,
      trustLevel,
      scanResult: options.scanResult,
      metadata: options.metadata ?? {},
    };
  }

  /**
   * Log entry to console
   */
  private logToConsole(entry: AuditLogEntry): void {
    const threatCount = entry.scanResult?.threats?.length ?? 0;
    const status = entry.trustLevel === MemoryTrustLevel.QUARANTINED ? '[QUARANTINED]' : '';

    console.log(
      `[AUDIT] ${entry.timestamp.toISOString()} | ` +
        `${entry.operation.toUpperCase()} | ` +
        `Memory: ${entry.memoryId} | ` +
        `Agent: ${entry.agentId} | ` +
        `Trust: ${entry.trustLevel} | ` +
        `Threats: ${threatCount} ${status}`
    );
  }

  /**
   * Add a listener for audit events
   */
  addListener(listener: (entry: AuditLogEntry) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a listener
   */
  removeListener(listener: (entry: AuditLogEntry) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Get audit entries for a specific memory
   */
  getEntriesForMemory(memoryId: string): AuditLogEntry[] {
    return this.entries.filter((e) => e.memoryId === memoryId);
  }

  /**
   * Get audit entries for a specific agent
   */
  getEntriesForAgent(agentId: string): AuditLogEntry[] {
    return this.entries.filter((e) => e.agentId === agentId);
  }

  /**
   * Get entries by operation type
   */
  getEntriesByOperation(operation: MemoryOperation): AuditLogEntry[] {
    return this.entries.filter((e) => e.operation === operation);
  }

  /**
   * Get quarantined entries
   */
  getQuarantinedEntries(): AuditLogEntry[] {
    return this.entries.filter((e) => e.trustLevel === MemoryTrustLevel.QUARANTINED);
  }

  /**
   * Get entries with threats
   */
  getEntriesWithThreats(): AuditLogEntry[] {
    return this.entries.filter((e) => e.scanResult && e.scanResult.threats.length > 0);
  }

  /**
   * Get all entries
   */
  getAllEntries(): AuditLogEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries within a time range
   */
  getEntriesInRange(start: Date, end: Date): AuditLogEntry[] {
    return this.entries.filter((e) => e.timestamp >= start && e.timestamp <= end);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Export entries as JSON
   */
  exportJSON(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalEntries: number;
    byOperation: Record<string, number>;
    byTrustLevel: Record<string, number>;
    threatsDetected: number;
    quarantinedCount: number;
  } {
    const byOperation: Record<string, number> = {};
    const byTrustLevel: Record<string, number> = {};
    let threatsDetected = 0;
    let quarantinedCount = 0;

    for (const entry of this.entries) {
      byOperation[entry.operation] = (byOperation[entry.operation] || 0) + 1;
      byTrustLevel[entry.trustLevel] = (byTrustLevel[entry.trustLevel] || 0) + 1;

      if (entry.scanResult?.threats.length) {
        threatsDetected += entry.scanResult.threats.length;
      }

      if (entry.trustLevel === MemoryTrustLevel.QUARANTINED) {
        quarantinedCount++;
      }
    }

    return {
      totalEntries: this.entries.length,
      byOperation,
      byTrustLevel,
      threatsDetected,
      quarantinedCount,
    };
  }
}

// ============================================================================
// DEFAULT HUMAN OVERSIGHT HOOK
// ============================================================================

/**
 * Default implementation of human oversight hook
 * Stores actions in memory for later review
 */
export class DefaultOversightHook implements HumanOversightHook {
  private actions: Map<string, OversightAction> = new Map();
  private onActionCallback?: (action: OversightAction) => void;

  constructor(onAction?: (action: OversightAction) => void) {
    this.onActionCallback = onAction;
  }

  async onSuspiciousContent(
    memoryId: string,
    content: string,
    threats: DetectedThreat[]
  ): Promise<OversightAction> {
    const maxSeverity = Math.max(
      ...threats.map((t) => {
        const severityMap: Record<ThreatSeverity, number> = {
          [ThreatSeverity.LOW]: 1,
          [ThreatSeverity.MEDIUM]: 2,
          [ThreatSeverity.HIGH]: 3,
          [ThreatSeverity.CRITICAL]: 4,
        };
        return severityMap[t.severity];
      })
    );

    const priorityMap: Record<number, 'low' | 'medium' | 'high' | 'urgent'> = {
      1: 'low',
      2: 'medium',
      3: 'high',
      4: 'urgent',
    };

    const action: OversightAction = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      memoryId,
      reason: `Detected ${threats.length} potential threat(s): ${threats.map((t) => t.type).join(', ')}`,
      threats,
      priority: priorityMap[maxSeverity] || 'medium',
      status: 'pending',
    };

    this.actions.set(action.id, action);

    if (this.onActionCallback) {
      this.onActionCallback(action);
    }

    return action;
  }

  async onQuarantine(memoryId: string, reason: string): Promise<void> {
    console.log(`[OVERSIGHT] Memory ${memoryId} quarantined: ${reason}`);
  }

  async checkRelease(memoryId: string): Promise<boolean> {
    // Check if there's an approved action for this memory
    let found = false;
    this.actions.forEach((action) => {
      if (action.memoryId === memoryId && action.status === 'approved') {
        found = true;
      }
    });
    return found;
  }

  async getPendingActions(): Promise<OversightAction[]> {
    const allActions: OversightAction[] = [];
    this.actions.forEach((action) => allActions.push(action));
    return allActions.filter((a) => a.status === 'pending');
  }

  async resolveAction(
    actionId: string,
    decision: 'approve' | 'reject' | 'escalate',
    reviewerId: string,
    notes?: string
  ): Promise<void> {
    const action = this.actions.get(actionId);
    if (!action) {
      throw new Error(`Action ${actionId} not found`);
    }

    action.status = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'escalated';
    action.reviewedBy = reviewerId;
    action.reviewedAt = new Date();
    action.notes = notes;

    console.log(`[OVERSIGHT] Action ${actionId} resolved: ${decision} by ${reviewerId}`);
  }
}

// ============================================================================
// MEMORY SAFETY MANAGER
// ============================================================================

/**
 * Unified interface for all safety operations
 */
export class MemorySafetyManager {
  private scanner: InjectionScanner;
  private auditLogger: AuditLogger;
  private oversightHook: HumanOversightHook;
  private quarantinedMemories: Set<string> = new Set();

  constructor(
    auditConfig?: Partial<AuditLoggerConfig>,
    oversightHook?: HumanOversightHook
  ) {
    this.scanner = new InjectionScanner();
    this.auditLogger = new AuditLogger(auditConfig);
    this.oversightHook = oversightHook ?? new DefaultOversightHook();
  }

  /**
   * Validate and scan memory content before storage
   */
  async validateMemory(
    memoryId: string,
    content: string,
    agentId: string
  ): Promise<{ allowed: boolean; scanResult: ScanResult; trustLevel: MemoryTrustLevel }> {
    const scanResult = this.scanner.scan(content, agentId);

    // Log the validation
    this.auditLogger.log(MemoryOperation.CREATE, memoryId, agentId, scanResult.trustLevel, {
      newState: { content: content.substring(0, 200) + '...' },
      scanResult,
    });

    // Handle threats
    if (!scanResult.safe) {
      // Flag for human oversight
      await this.oversightHook.onSuspiciousContent(memoryId, content, scanResult.threats);

      if (scanResult.trustLevel === MemoryTrustLevel.QUARANTINED) {
        this.quarantinedMemories.add(memoryId);
        await this.oversightHook.onQuarantine(
          memoryId,
          `Detected threats: ${scanResult.threats.map((t) => t.type).join(', ')}`
        );

        return { allowed: false, scanResult, trustLevel: scanResult.trustLevel };
      }
    }

    return { allowed: true, scanResult, trustLevel: scanResult.trustLevel };
  }

  /**
   * Quick safety check for content
   */
  quickCheck(content: string): boolean {
    return this.scanner.quickScan(content);
  }

  /**
   * Check if a memory is quarantined
   */
  isQuarantined(memoryId: string): boolean {
    return this.quarantinedMemories.has(memoryId);
  }

  /**
   * Attempt to release a memory from quarantine
   */
  async releaseFromQuarantine(memoryId: string, reviewerId: string): Promise<boolean> {
    if (!this.quarantinedMemories.has(memoryId)) {
      return false;
    }

    const canRelease = await this.oversightHook.checkRelease(memoryId);
    if (canRelease) {
      this.quarantinedMemories.delete(memoryId);
      this.auditLogger.log(MemoryOperation.RELEASE, memoryId, reviewerId, MemoryTrustLevel.TRUSTED, {
        metadata: { releasedBy: reviewerId },
      });
      return true;
    }

    return false;
  }

  /**
   * Get the audit logger
   */
  getAuditLogger(): AuditLogger {
    return this.auditLogger;
  }

  /**
   * Get the injection scanner
   */
  getScanner(): InjectionScanner {
    return this.scanner;
  }

  /**
   * Get the oversight hook
   */
  getOversightHook(): HumanOversightHook {
    return this.oversightHook;
  }

  /**
   * Get safety statistics
   */
  getStats(): {
    auditStats: ReturnType<AuditLogger['getStats']>;
    quarantinedCount: number;
    pendingOversightActions: number;
  } {
    return {
      auditStats: this.auditLogger.getStats(),
      quarantinedCount: this.quarantinedMemories.size,
      pendingOversightActions: 0, // Will be populated async
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default MemorySafetyManager;
