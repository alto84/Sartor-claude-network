/**
 * Test Suite - Validation framework test cases
 *
 * Tests the anti-fabrication validation rules with known inputs and expected outputs.
 */

import { validate, validateAndSuggest } from './validator';

// Types
interface TestCase {
  id: string;
  name: string;
  description: string;
  input: string;
  expected: {
    passed: boolean;
    errorCount: number;
    warningCount: number;
    rulesTriggered: string[];
  };
}

interface TestResult {
  testId: string;
  name: string;
  passed: boolean;
  expected: TestCase['expected'];
  actual: {
    passed: boolean;
    errorCount: number;
    warningCount: number;
    rulesTriggered: string[];
  };
  details?: string;
}

export interface TestSuiteReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  results: TestResult[];
}

// Test Cases
export const testCases: TestCase[] = [
  // === SUPERLATIVE TESTS ===
  {
    id: 'SUP-001',
    name: 'Detect exceptional superlative',
    description: 'Should flag "exceptional" as banned superlative',
    input: 'This is an exceptional implementation.',
    expected: {
      passed: false,
      errorCount: 1,
      warningCount: 0,
      rulesTriggered: ['no-superlatives'],
    },
  },
  {
    id: 'SUP-002',
    name: 'Detect outstanding superlative',
    description: 'Should flag "outstanding" as banned superlative',
    input: 'The team did outstanding work on this project.',
    expected: {
      passed: false,
      errorCount: 1,
      warningCount: 0,
      rulesTriggered: ['no-superlatives'],
    },
  },
  {
    id: 'SUP-003',
    name: 'Detect world-class superlative',
    description: 'Should flag "world-class" as banned superlative',
    input: 'This is a world-class solution for enterprise needs.',
    expected: {
      passed: false,
      errorCount: 1,
      warningCount: 0,
      rulesTriggered: ['no-superlatives'],
    },
  },
  {
    id: 'SUP-004',
    name: 'Detect multiple superlatives',
    description: 'Should flag all superlatives in content',
    input: 'This exceptional, outstanding, world-class code is revolutionary.',
    expected: {
      passed: false,
      errorCount: 4,
      warningCount: 0,
      rulesTriggered: ['no-superlatives'],
    },
  },
  {
    id: 'SUP-005',
    name: 'Accept objective language',
    description: 'Should pass content with objective descriptions',
    input: 'The implementation meets the specified requirements and passes all tests.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0,
      rulesTriggered: [],
    },
  },

  // === SCORE FABRICATION TESTS ===
  {
    id: 'SCR-001',
    name: 'Detect unsupported percentage',
    description: 'Should flag percentage without evidence',
    input: 'This achieves 95% accuracy.',
    expected: {
      passed: true, // No error, just warning
      errorCount: 0,
      warningCount: 1,
      rulesTriggered: ['no-fabricated-scores'],
    },
  },
  {
    id: 'SCR-002',
    name: 'Accept percentage with evidence',
    description: 'Should pass percentage with measurement source',
    input: 'This achieves 95% accuracy based on test suite results.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0,
      rulesTriggered: [],
    },
  },
  {
    id: 'SCR-003',
    name: 'Detect unsupported rating',
    description: 'Should flag rating without evidence',
    input: 'The code quality rating is 8/10.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 1,
      rulesTriggered: ['no-fabricated-scores'],
    },
  },
  {
    id: 'SCR-004',
    name: 'Accept rating with methodology',
    description: 'Should pass rating with methodology reference (source-verification may flag "according to" without URL/DOI)',
    input: 'The code quality rating is 8/10 based on the linting score calculated by ESLint.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0,
      rulesTriggered: [],
    },
  },
  {
    id: 'SCR-005',
    name: 'Detect letter grade',
    description: 'Should flag letter grades without rubric',
    input: 'Overall assessment: Grade A.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 1,
      rulesTriggered: ['no-fabricated-scores'],
    },
  },

  // === UNCERTAINTY TESTS ===
  {
    id: 'UNC-001',
    name: 'Detect absolute claim - definitely',
    description: 'Should flag "will definitely" as absolute claim',
    input: 'This will definitely solve all your problems.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 1,
      rulesTriggered: ['requires-uncertainty'],
    },
  },
  {
    id: 'UNC-002',
    name: 'Detect absolute claim - never fails',
    description: 'Should flag "never fails" as absolute claim',
    input: 'This approach never fails in production.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 1,
      rulesTriggered: ['requires-uncertainty'],
    },
  },
  {
    id: 'UNC-003',
    name: 'Accept qualified claim',
    description: 'Should pass content with appropriate uncertainty',
    input: 'This approach is likely to work in most cases, though edge cases may require adjustment.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0,
      rulesTriggered: [],
    },
  },

  // === EVIDENCE TESTS ===
  {
    id: 'EVI-001',
    name: 'Detect uncited research claim',
    description: 'Should flag "studies show" without citation',
    input: 'Studies show that this approach is more effective.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 1,
      rulesTriggered: ['evidence-required'],
    },
  },
  {
    id: 'EVI-002',
    name: 'Accept cited research claim',
    description: 'Should pass "studies show" with citation',
    input: 'Studies show that this approach is more effective [Smith et al, 2023].',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0,
      rulesTriggered: [],
    },
  },
  {
    id: 'EVI-003',
    name: 'Accept URL citation',
    description: 'Should pass claim with URL reference (measured provides evidence context)',
    input: 'Research indicates measured improvements of 30% (https://example.com/study).',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0,
      rulesTriggered: [],
    },
  },

  // === CITATION FORMAT TESTS ===
  {
    id: 'CIT-001',
    name: 'Accept valid author-year citation',
    description: 'Should pass properly formatted [Author, Year] citation',
    input: 'This approach was validated by Smith, 2023 in their study.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0,
      rulesTriggered: [],
    },
  },
  {
    id: 'CIT-002',
    name: 'Accept valid et al citation',
    description: 'Should pass properly formatted [Author et al., Year] citation',
    input: 'Research by [Johnson et al., 2024] supports this methodology.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0,
      rulesTriggered: [],
    },
  },
  {
    id: 'CIT-003',
    name: 'Accept numbered citation',
    description: 'Should pass numbered reference style [1] - uses neutral language to avoid source-verification',
    input: 'This technique addresses requirement [1] and handles edge cases [2].',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0,
      rulesTriggered: [],
    },
  },
  {
    id: 'CIT-004',
    name: 'Detect malformed citation - incomplete format',
    description: 'Should flag citation that looks like a citation attempt but is malformed',
    input: 'See [Smith and Jones work from 2023 for details] for the methodology.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0, // citation-format is info severity, not warning
      rulesTriggered: ['citation-format'],
    },
  },
  {
    id: 'CIT-005',
    name: 'Accept code brackets',
    description: 'Should not flag array indices or code patterns',
    input: 'Access the element with array[0] or use dict[key] syntax.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0,
      rulesTriggered: [],
    },
  },
  {
    id: 'CIT-006',
    name: 'Accept multi-author citation',
    description: 'Should pass [Author & Author, Year] format',
    input: 'The study by [Brown & Davis, 2022] confirms these findings.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0,
      rulesTriggered: [],
    },
  },

  // === CONSISTENCY CHECK TESTS ===
  {
    id: 'CON-001',
    name: 'Detect inconsistent accuracy values',
    description: 'Should flag when same metric has different values without context',
    input: 'Measured accuracy is 85% based on tests. Measured accuracy is 92% based on tests.',
    expected: {
      passed: true, // warnings don't fail the validation
      errorCount: 0,
      warningCount: 1, // consistency-check
      rulesTriggered: ['consistency-check'],
    },
  },
  {
    id: 'CON-002',
    name: 'Accept consistent values',
    description: 'Should pass when same metric has same value',
    input: 'Measured accuracy is 94.5% based on test suite. The measured accuracy of 94.5% confirms this.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0,
      rulesTriggered: [],
    },
  },
  {
    id: 'CON-003',
    name: 'Accept different contexts',
    description: 'Should pass when values differ due to different contexts (training vs test)',
    input: 'Measured training accuracy is 98% based on data. Measured test accuracy is 92% based on data.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0,
      rulesTriggered: [],
    },
  },
  {
    id: 'CON-004',
    name: 'Accept different metrics',
    description: 'Should pass when different metrics have different values',
    input: 'Measured accuracy is 90% based on tests. Measured precision is 85% based on tests.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0,
      rulesTriggered: [],
    },
  },
  {
    id: 'CON-005',
    name: 'Detect performance inconsistency',
    description: 'Should flag inconsistent performance metrics',
    input: 'Measured performance is 75% based on tests. Measured performance is 82% based on tests.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 1,
      rulesTriggered: ['consistency-check'],
    },
  },
  {
    id: 'CON-006',
    name: 'Accept before/after comparison',
    description: 'Should pass when context shows comparison (before/after)',
    input: 'Measured latency: 100ms before optimization. Measured latency: 45ms after optimization.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0,
      rulesTriggered: [],
    },
  },

  // === SOURCE VERIFICATION TESTS ===
  {
    id: 'SRC-001',
    name: 'Accept valid URL source',
    description: 'Should pass claim with verifiable URL citation',
    input: 'According to https://example.com/study.pdf, improvements were observed.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0,
      rulesTriggered: [],
    },
  },
  {
    id: 'SRC-002',
    name: 'Accept valid DOI source',
    description: 'Should pass claim with DOI citation',
    input: 'Performance gains of 23% were observed (doi:10.1234/example.2024).',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0,
      rulesTriggered: [],
    },
  },
  {
    id: 'SRC-003',
    name: 'Accept valid author-year source',
    description: 'Should pass claim with proper author-year citation',
    input: 'This approach was validated in [Smith, 2023] with positive results.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0,
      rulesTriggered: [],
    },
  },
  {
    id: 'SRC-004',
    name: 'Detect vague source attribution',
    description: 'Should flag vague "according to" without proper citation (study/research trigger)',
    input: 'According to a study by researchers, this approach works.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 1,
      rulesTriggered: ['source-verification'],
    },
  },
  {
    id: 'SRC-005',
    name: 'Accept arXiv source',
    description: 'Should pass claim with arXiv reference',
    input: 'The methodology described in arXiv:2024.12345 demonstrates this technique.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0,
      rulesTriggered: [],
    },
  },
  {
    id: 'SRC-006',
    name: 'Accept content without source claims',
    description: 'Should pass content that makes no source-attributed claims',
    input: 'The implementation handles edge cases and includes error handling.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0,
      rulesTriggered: [],
    },
  },

  // === HEDGING BALANCE TESTS ===
  {
    id: 'HDG-001',
    name: 'Accept appropriate hedging',
    description: 'Should pass content with moderate uncertainty expression',
    input: 'The results suggest an accuracy of approximately 85%.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 1, // no-fabricated-scores (needs "measured/based on")
      rulesTriggered: ['no-fabricated-scores'],
    },
  },
  {
    id: 'HDG-002',
    name: 'Accept objective statement',
    description: 'Should pass objective statement with no hedging',
    input: 'The measured accuracy is 87.3% based on 1000 test cases.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0,
      rulesTriggered: [],
    },
  },
  {
    id: 'HDG-003',
    name: 'Detect excessive hedging',
    description: 'Should flag excessive hedge word density',
    input: 'It might possibly appear that perhaps under certain conditions the accuracy could potentially be around maybe 90%.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 1, // no-fabricated-scores for 90%
      rulesTriggered: ['hedging-balance', 'no-fabricated-scores'],
    },
  },
  {
    id: 'HDG-004',
    name: 'Detect hedge stacking',
    description: 'Should flag multiple hedge words in close proximity',
    input: 'This seems to possibly suggest that it might work.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0, // info severity, not warning
      rulesTriggered: ['hedging-balance'],
    },
  },
  {
    id: 'HDG-005',
    name: 'Accept single hedge appropriate for context',
    description: 'Should pass single hedge word used appropriately',
    input: 'This approach likely works for most use cases.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0,
      rulesTriggered: [],
    },
  },
  {
    id: 'HDG-006',
    name: 'Detect over-hedged claim',
    description: 'Should flag statement with too many uncertainty qualifiers',
    input: 'The preliminary tentative results possibly suggest that approximately maybe around 80% might be achievable under certain uncertain conditions.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 1, // no-fabricated-scores for 80%
      rulesTriggered: ['hedging-balance', 'no-fabricated-scores'],
    },
  },

  // === COMBINATION TESTS ===
  {
    id: 'CMB-001',
    name: 'Detect multiple violations',
    description: 'Should catch superlative, score, and absolute claim',
    input: 'This exceptional solution achieves 99% accuracy and will definitely work.',
    expected: {
      passed: false,
      errorCount: 1, // superlative
      warningCount: 2, // score + uncertainty
      rulesTriggered: ['no-superlatives', 'no-fabricated-scores', 'requires-uncertainty'],
    },
  },
  {
    id: 'CMB-002',
    name: 'Pass clean content',
    description: 'Should pass well-written objective content',
    input: 'The implementation handles the specified use cases. Testing revealed 3 edge cases that require additional handling. Limitations include memory usage under high load.',
    expected: {
      passed: true,
      errorCount: 0,
      warningCount: 0,
      rulesTriggered: [],
    },
  },
];

// Test Runner
export function runTests(cases: TestCase[] = testCases): TestSuiteReport {
  const results: TestResult[] = [];

  for (const testCase of cases) {
    const report = validate(testCase.input);

    const actual = {
      passed: report.passed,
      errorCount: report.summary.errors,
      warningCount: report.summary.warnings,
      rulesTriggered: [...new Set(report.results.map(r => r.rule))],
    };

    const testPassed =
      actual.passed === testCase.expected.passed &&
      actual.errorCount === testCase.expected.errorCount &&
      actual.warningCount === testCase.expected.warningCount &&
      arraysMatch(actual.rulesTriggered, testCase.expected.rulesTriggered);

    results.push({
      testId: testCase.id,
      name: testCase.name,
      passed: testPassed,
      expected: testCase.expected,
      actual,
      details: testPassed ? undefined : generateDiffDetails(testCase.expected, actual),
    });
  }

  const passed = results.filter(r => r.passed).length;

  return {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passed,
    failed: results.length - passed,
    results,
  };
}

// Helper functions
function arraysMatch(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

function generateDiffDetails(
  expected: TestCase['expected'],
  actual: TestResult['actual']
): string {
  const diffs: string[] = [];

  if (expected.passed !== actual.passed) {
    diffs.push(`passed: expected ${expected.passed}, got ${actual.passed}`);
  }
  if (expected.errorCount !== actual.errorCount) {
    diffs.push(`errors: expected ${expected.errorCount}, got ${actual.errorCount}`);
  }
  if (expected.warningCount !== actual.warningCount) {
    diffs.push(`warnings: expected ${expected.warningCount}, got ${actual.warningCount}`);
  }
  if (!arraysMatch(expected.rulesTriggered, actual.rulesTriggered)) {
    diffs.push(
      `rules: expected [${expected.rulesTriggered.join(', ')}], got [${actual.rulesTriggered.join(', ')}]`
    );
  }

  return diffs.join('; ');
}

// Print report
function printReport(report: TestSuiteReport): void {
  console.log('='.repeat(60));
  console.log('VALIDATION FRAMEWORK TEST SUITE');
  console.log('='.repeat(60));
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Total Tests: ${report.totalTests}`);
  console.log(`Passed: ${report.passed}`);
  console.log(`Failed: ${report.failed}`);
  console.log('-'.repeat(60));

  for (const result of report.results) {
    const status = result.passed ? '[PASS]' : '[FAIL]';
    console.log(`${status} ${result.testId}: ${result.name}`);
    if (!result.passed && result.details) {
      console.log(`       ${result.details}`);
    }
  }

  console.log('='.repeat(60));
  const passRate = ((report.passed / report.totalTests) * 100).toFixed(1);
  console.log(`Pass Rate: ${passRate}% (${report.passed}/${report.totalTests})`);
  console.log('='.repeat(60));
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('test-suite.ts');

if (isMainModule && process.argv[1]?.endsWith('test-suite.ts')) {
  const report = runTests();
  printReport(report);
  process.exit(report.failed > 0 ? 1 : 0);
}

export { printReport };
