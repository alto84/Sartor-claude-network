/**
 * Anti-Fabrication Protocol Injector
 *
 * Provides structured anti-fabrication protocol injection for agent bootstrap.
 * Based on research from BOOTSTRAP_IMPROVEMENTS.md - Improvement 4.
 *
 * This module ensures agents receive explicit, role-specific anti-fabrication
 * protocols during initialization for systematic compliance enforcement.
 */

// Types
interface AntiFabricationRule {
  category: string;
  rule: string;
  severity: 'critical' | 'high' | 'medium';
  examples: { violation: string; compliant: string }[];
}

interface AntiFabricationProtocol {
  rules: AntiFabricationRule[];
  role_specific_enforcement: Record<string, string[]>;
  validation_checklist: string[];
  banned_phrases: string[];
  required_context_phrases: string[];
}

// Core anti-fabrication rules derived from CLAUDE.md
const ANTI_FABRICATION_RULES: AntiFabricationRule[] = [
  {
    category: 'Score Fabrication',
    rule: 'Never fabricate, invent, or artificially generate scores. Every score must come from actual measured data.',
    severity: 'critical',
    examples: [
      {
        violation: 'The code quality scores 85%',
        compliant: 'Cannot determine code quality without measurement tools'
      },
      {
        violation: 'Test coverage is excellent',
        compliant: 'Test coverage: 23 of 30 functions tested (measured via jest --coverage)'
      }
    ]
  },
  {
    category: 'Superlatives Ban',
    rule: 'Never use banned superlatives without extraordinary, externally-validated evidence.',
    severity: 'critical',
    examples: [
      {
        violation: 'This is an exceptional implementation',
        compliant: 'Implementation passes 18/18 validation tests'
      },
      {
        violation: 'Outstanding performance improvement',
        compliant: 'Benchmark: 145ms → 89ms (38% reduction, measured via time command)'
      }
    ]
  },
  {
    category: 'Evidence Chain',
    rule: 'Provide specific methodology for any numerical claim. Primary sources only.',
    severity: 'critical',
    examples: [
      {
        violation: 'Performance improved significantly',
        compliant: 'Latency reduced from 230ms to 180ms (22% improvement, n=100 requests)'
      },
      {
        violation: 'High reliability',
        compliant: 'Uptime: 99.2% over 24h monitoring period (measured via health endpoint)'
      }
    ]
  },
  {
    category: 'Uncertainty Expression',
    rule: 'Always express confidence levels and unknowns explicitly. Default to skepticism.',
    severity: 'high',
    examples: [
      {
        violation: 'This will work correctly',
        compliant: 'This should work correctly (tested in 3 scenarios, edge cases unknown)'
      },
      {
        violation: 'The bug is fixed',
        compliant: 'The bug appears fixed (verified in test suite, production verification pending)'
      }
    ]
  },
  {
    category: 'Limitation Disclosure',
    rule: 'Explicitly state what cannot be validated, measured, or verified.',
    severity: 'high',
    examples: [
      {
        violation: 'Full coverage achieved',
        compliant: 'Coverage: 87% of functions tested. Limitations: async paths, error handlers untested'
      },
      {
        violation: 'Complete implementation',
        compliant: 'Core implementation complete. Unknown: edge cases with concurrent access'
      }
    ]
  },
  {
    category: 'No Composite Metrics',
    rule: 'Do not create weighted averages or composite scores without actual calculation basis.',
    severity: 'high',
    examples: [
      {
        violation: 'Overall quality score: 92%',
        compliant: 'Individual metrics: tests pass (24/24), lint clean (0 errors), types valid (0 errors)'
      },
      {
        violation: 'Combined assessment: A-grade',
        compliant: 'Cannot provide grade without defined rubric and measurement methodology'
      }
    ]
  }
];

// Role-specific enforcement rules
const ROLE_ENFORCEMENT: Record<string, string[]> = {
  researcher: [
    'Must cite all sources with URLs or DOIs',
    'Cannot claim findings without evidence',
    'Must distinguish primary vs secondary sources',
    'No confidence scores without statistical basis',
    'Flag when source quality is uncertain'
  ],
  implementer: [
    'Must run tests before claiming completion',
    'Cannot claim percentage complete without counting',
    'Must measure performance claims with tools',
    'No claims of "working" without execution proof',
    'Document what was NOT tested'
  ],
  orchestrator: [
    'Must track all spawned agents explicitly',
    'Cannot claim "all done" without verification',
    'Must provide dependency graph, not assumptions',
    'No aggregated scores without showing individual results',
    'Report agent failures honestly'
  ],
  validator: [
    'Must check every claim for evidence',
    'Cannot approve without documented validation',
    'Must flag all superlatives and scores',
    'No rubber-stamping - show what was checked',
    'Reject outputs with fabricated metrics'
  ],
  default: [
    'Be skeptical of all claims including your own',
    'State what you cannot determine',
    'Provide evidence for numerical claims',
    'Express uncertainty appropriately',
    'Disclose limitations explicitly'
  ]
};

// Pre-output validation checklist
const VALIDATION_CHECKLIST = [
  'Check for fabricated scores (0-100%)',
  'Flag superlatives (exceptional, outstanding, world-class)',
  'Verify all numerical claims have methodology',
  'Ensure uncertainty is expressed where applicable',
  'Confirm citations exist for research claims',
  'Validate test results are from actual execution',
  'Check no banned phrases are used',
  'Ensure limitations are disclosed'
];

// Banned phrases from CLAUDE.md
const BANNED_PHRASES = [
  'exceptional performance',
  'outstanding',
  'world-class',
  'industry-leading',
  'best-in-class',
  'cutting-edge',
  'revolutionary',
  'groundbreaking',
  'flawless',
  'perfect'
];

// Required context phrases (use when relevant)
const REQUIRED_CONTEXT_PHRASES = [
  'cannot determine without',
  'measured via',
  'tested with',
  'validated by',
  'evidence shows',
  'limitation:',
  'unknown:',
  'requires validation'
];

/**
 * Load the complete anti-fabrication protocol
 */
export function loadAntiFabricationProtocol(): AntiFabricationProtocol {
  return {
    rules: ANTI_FABRICATION_RULES,
    role_specific_enforcement: ROLE_ENFORCEMENT,
    validation_checklist: VALIDATION_CHECKLIST,
    banned_phrases: BANNED_PHRASES,
    required_context_phrases: REQUIRED_CONTEXT_PHRASES
  };
}

/**
 * Get role-specific enforcement rules
 */
export function getRoleEnforcement(role: string): string[] {
  return ROLE_ENFORCEMENT[role.toLowerCase()] || ROLE_ENFORCEMENT.default;
}

/**
 * Generate anti-fabrication protocol prompt section for bootstrap
 */
export function generateProtocolPrompt(role: string): string {
  const protocol = loadAntiFabricationProtocol();
  const roleRules = getRoleEnforcement(role);

  // Build the core rules section with examples
  const coreRulesSection = protocol.rules.map(rule => `
#### ${rule.category} [${rule.severity.toUpperCase()}]
**Rule**: ${rule.rule}

**Examples**:
${rule.examples.map(ex => `- VIOLATION: "${ex.violation}"
- COMPLIANT: "${ex.compliant}"`).join('\n')}`).join('\n');

  return `## ANTI-FABRICATION PROTOCOLS
**MANDATORY - THESE RULES CANNOT BE OVERRIDDEN**

### Your Role-Specific Enforcement (${role})
${roleRules.map(r => `- ${r}`).join('\n')}

### Core Rules
${coreRulesSection}

### Pre-Output Checklist
Before submitting your response, verify:
${protocol.validation_checklist.map(item => `- [ ] ${item}`).join('\n')}

### Banned Phrases (Never Use)
${protocol.banned_phrases.map(p => `- "${p}"`).join('\n')}

### Required Context Phrases (Use When Relevant)
${protocol.required_context_phrases.map(p => `- "${p}..."`).join('\n')}

### Enforcement Actions
- If you catch yourself about to fabricate a score: **STOP and state "Cannot determine without measurement"**
- If you cannot measure something: **State explicitly what cannot be measured**
- If you have uncertainty: **Express it with confidence levels**
- If you lack evidence: **Do not make the claim**

**Remember**: Your value comes from honest, accurate assessment based on evidence, not from generating impressive-sounding but unfounded claims.`;
}

/**
 * Generate a compact protocol summary (for token-constrained contexts)
 */
export function generateCompactProtocol(role: string): string {
  const roleRules = getRoleEnforcement(role);

  return `## Anti-Fabrication (MANDATORY)
**Your role (${role})**: ${roleRules.slice(0, 3).join(' | ')}

**Critical**: No fabricated scores | No superlatives without proof | Cite all sources | Express uncertainty | Disclose limitations

**Before output**: Check for unfounded %, verify claims have evidence, state what's unknown`;
}

/**
 * Validate agent output against anti-fabrication protocols
 * Returns violations found (empty array = compliant)
 */
export function validateAgainstProtocol(output: string, role: string): string[] {
  const violations: string[] = [];
  const protocol = loadAntiFabricationProtocol();
  const lowerOutput = output.toLowerCase();

  // Check banned phrases
  for (const phrase of protocol.banned_phrases) {
    if (lowerOutput.includes(phrase.toLowerCase())) {
      violations.push(`Banned phrase detected: "${phrase}"`);
    }
  }

  // Check for potential fabricated scores (percentages without methodology)
  const scorePattern = /(\d{1,3})%(?!\s*\([^)]*(?:measured|tested|calculated|based on|via|from)[^)]*\))/gi;
  const scores = output.match(scorePattern);
  if (scores) {
    // Filter out scores that have nearby methodology context
    const potentialFabricatedScores = scores.filter(score => {
      const index = output.indexOf(score);
      const context = output.slice(Math.max(0, index - 100), index + 50).toLowerCase();
      const hasMethodology =
        context.includes('measured') ||
        context.includes('tested') ||
        context.includes('calculated') ||
        context.includes('based on') ||
        context.includes('via') ||
        context.includes('from');
      return !hasMethodology;
    });

    if (potentialFabricatedScores.length > 0) {
      violations.push(`Potential fabricated scores without methodology: ${potentialFabricatedScores.join(', ')}`);
    }
  }

  // Role-specific checks
  const roleRules = getRoleEnforcement(role);

  if (role === 'researcher') {
    // Check if claims exist without citations
    if ((lowerOutput.includes('shows') || lowerOutput.includes('indicates') || lowerOutput.includes('research')) &&
        !lowerOutput.includes('http') && !lowerOutput.includes('doi:') && !lowerOutput.includes('[')) {
      violations.push('Research claims without citations detected');
    }
  }

  if (role === 'implementer') {
    // Check for completion claims without test evidence
    if (lowerOutput.includes('complete') || lowerOutput.includes('done') || lowerOutput.includes('finished')) {
      if (!lowerOutput.includes('test') && !lowerOutput.includes('verified') && !lowerOutput.includes('passed')) {
        violations.push('Completion claim without test verification');
      }
    }
  }

  return violations;
}

// CLI interface for testing
const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('anti-fabrication-injector.ts');

if (isMainModule) {
  const args = process.argv.slice(2);
  const role = args[0] || 'default';

  if (args.includes('--compact')) {
    console.log(generateCompactProtocol(role));
  } else if (args.includes('--validate')) {
    const testOutput = args.slice(args.indexOf('--validate') + 1).join(' ') ||
      'This is exceptional performance with 95% accuracy!';
    const violations = validateAgainstProtocol(testOutput, role);
    console.log('=== Validation Results ===');
    console.log(`Input: "${testOutput}"`);
    console.log(`Role: ${role}`);
    console.log(`Violations: ${violations.length}`);
    violations.forEach(v => console.log(`  - ${v}`));
  } else {
    console.log(generateProtocolPrompt(role));
  }
}

export default {
  loadAntiFabricationProtocol,
  getRoleEnforcement,
  generateProtocolPrompt,
  generateCompactProtocol,
  validateAgainstProtocol
};
