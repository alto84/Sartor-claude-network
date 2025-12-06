/**
 * Tests for Evidence-Based Engineering
 *
 * Ensures engineering validation correctly distinguishes implementation from completion,
 * validates testing practices, and enforces proper error handling.
 */

import {
  EvidenceBasedEngineering,
  createEvidenceBasedEngineering,
  assessEngineering,
} from '../evidence-based-engineering';

describe('Evidence-Based Engineering', () => {
  let validator: EvidenceBasedEngineering;

  beforeEach(() => {
    validator = createEvidenceBasedEngineering();
  });

  describe('validateErrorHandling', () => {
    describe('FAIL cases - async functions without error handling', () => {
      it('should fail for async function without try-catch', () => {
        const code = `
async function fetchData() {
  const response = await fetch('https://api.example.com/data');
  return response.json();
}`;
        const result = validator.validateErrorHandling(code);
        expect(result.hasErrorHandling).toBe(false);
        expect(result.severity).toBe('missing');
        expect(result.unhandledCases.length).toBeGreaterThan(0);
      });

      it('should fail for async arrow function without error handling', () => {
        const code = `
const getData = async () => {
  const result = await apiCall();
  return result;
};`;
        const result = validator.validateErrorHandling(code);
        expect(result.hasErrorHandling).toBe(false);
        expect(result.unhandledCases.length).toBeGreaterThan(0);
      });

      it('should fail for promise chain without .catch()', () => {
        const code = `
function loadUser() {
  return fetch('/api/user')
    .then(res => res.json())
    .then(data => processData(data));
}`;
        const result = validator.validateErrorHandling(code);
        expect(result.unhandledCases.some(c => c.includes('promise chains without .catch()'))).toBe(true);
      });

      it('should fail for network operations without error handling', () => {
        const code = `
async function callApi() {
  const response = await fetch('https://api.example.com');
  return response;
}`;
        const result = validator.validateErrorHandling(code);
        expect(result.hasErrorHandling).toBe(false);
        expect(result.unhandledCases.some(c => c.includes('network operations'))).toBe(true);
      });

      it('should identify multiple async functions without handling', () => {
        const code = `
async function fetchUser() {
  return await fetch('/user');
}

async function fetchPosts() {
  return await fetch('/posts');
}`;
        const result = validator.validateErrorHandling(code);
        expect(result.hasErrorHandling).toBe(false);
        expect(result.unhandledCases.length).toBeGreaterThan(0);
      });
    });

    describe('PASS cases - proper error handling', () => {
      it('should pass for async function with try-catch', () => {
        const code = `
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data');
    return response.json();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
}`;
        const result = validator.validateErrorHandling(code);
        expect(result.hasErrorHandling).toBe(true);
        expect(result.handledCases.some(c => c.includes('try/catch'))).toBe(true);
      });

      it('should pass for promise with .catch() handler', () => {
        const code = `
function loadData() {
  return fetch('/api/data')
    .then(res => res.json())
    .catch(error => {
      console.error('Error loading data:', error);
      return null;
    });
}`;
        const result = validator.validateErrorHandling(code);
        expect(result.hasErrorHandling).toBe(true);
        expect(result.handledCases.length).toBeGreaterThan(0);
      });

      it('should recognize adequate error handling', () => {
        const code = `
async function processData(input) {
  if (!input) {
    throw new Error('Input is required');
  }

  try {
    const result = await validateInput(input);
    return result;
  } catch (error) {
    console.error('Validation failed:', error);
    throw error;
  }
}`;
        const result = validator.validateErrorHandling(code);
        expect(result.hasErrorHandling).toBe(true);
        expect(result.severity).toBe('adequate');
        expect(result.handledCases.length).toBeGreaterThan(2);
      });

      it('should recognize input validation', () => {
        const code = `
function validateUser(user) {
  if (!user || !user.id) {
    throw new Error('Invalid user');
  }
  return user;
}`;
        const result = validator.validateErrorHandling(code);
        expect(result.hasErrorHandling).toBe(true);
        expect(result.handledCases.some(c => c.includes('input validation'))).toBe(true);
      });

      it('should handle multiple error handling patterns', () => {
        const code = `
async function complexOperation(data) {
  if (!data) {
    throw new Error('Data required');
  }

  try {
    const result = await fetch('/api/process')
      .then(res => res.json())
      .catch(err => {
        console.error('Fetch failed:', err);
        throw err;
      });
    return result;
  } catch (error) {
    console.error('Operation failed:', error);
    throw error;
  }
}`;
        const result = validator.validateErrorHandling(code);
        expect(result.hasErrorHandling).toBe(true);
        expect(result.severity).toBe('adequate');
      });
    });

    describe('Edge cases', () => {
      it('should handle code with no async functions', () => {
        const code = `
function syncFunction() {
  return 42;
}`;
        const result = validator.validateErrorHandling(code);
        expect(result.hasErrorHandling).toBe(false);
        expect(result.severity).toBe('missing');
      });

      it('should recognize minimal error handling', () => {
        const code = `
async function getData() {
  try {
    return await fetch('/api/data');
  } catch (error) {
    // Empty catch
  }
}`;
        const result = validator.validateErrorHandling(code);
        expect(result.hasErrorHandling).toBe(true);
        expect(result.severity).not.toBe('missing');
      });
    });
  });

  describe('validateTesting', () => {
    describe('Testing assessment - correctly identifies tested vs untested functions', () => {
      it('should identify tested functions', () => {
        const sourceCode = `
function add(a, b) { return a + b; }
function subtract(a, b) { return a - b; }
function multiply(a, b) { return a * b; }`;

        const testCode = `
describe('Math operations', () => {
  it('should add numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('should subtract numbers', () => {
    expect(subtract(5, 3)).toBe(2);
  });
});`;

        const result = validator.validateTesting(sourceCode, testCode);
        expect(result.hasCoverage).toBe(true);
        expect(result.testedFunctions).toContain('add');
        expect(result.testedFunctions).toContain('subtract');
        expect(result.untestedFunctions).toContain('multiply');
        expect(result.coverageType).toBe('measured');
      });

      it('should detect all functions as untested when no tests provided', () => {
        const sourceCode = `
function foo() { return 1; }
function bar() { return 2; }`;

        const result = validator.validateTesting(sourceCode, '');
        expect(result.hasCoverage).toBe(false);
        expect(result.untestedFunctions).toContain('foo');
        expect(result.untestedFunctions).toContain('bar');
        expect(result.coverageType).toBe('unknown');
        expect(result.coverageEvidence).toBe('No test file provided');
      });

      it('should match test cases to functions by name', () => {
        const sourceCode = `
const validateEmail = (email) => { /* ... */ };
const validatePassword = (password) => { /* ... */ };`;

        const testCode = `
test('validateEmail accepts valid emails', () => {
  expect(validateEmail('test@example.com')).toBe(true);
});`;

        const result = validator.validateTesting(sourceCode, testCode);
        expect(result.testedFunctions).toContain('validateEmail');
        expect(result.untestedFunctions).toContain('validatePassword');
      });

      it('should calculate test coverage percentage', () => {
        const sourceCode = `
function a() {}
function b() {}
function c() {}
function d() {}`;

        const testCode = `
it('tests a', () => { a(); });
it('tests b', () => { b(); });`;

        const result = validator.validateTesting(sourceCode, testCode);
        expect(result.testCoverage).toBe(50); // 2 out of 4 functions tested
      });

      it('should handle class methods', () => {
        const sourceCode = `
class Calculator {
  add(a, b) { return a + b; }
  subtract(a, b) { return a - b; }
}`;

        const testCode = `
describe('Calculator', () => {
  it('should add', () => {
    const calc = new Calculator();
    expect(calc.add(2, 3)).toBe(5);
  });
});`;

        const result = validator.validateTesting(sourceCode, testCode);
        expect(result.testedFunctions).toContain('add');
        expect(result.untestedFunctions).toContain('subtract');
      });
    });

    describe('Coverage evidence', () => {
      it('should provide measured coverage evidence', () => {
        const sourceCode = `
function test1() {}
function test2() {}`;

        const testCode = `
it('tests test1', () => { test1(); });
it('tests test2', () => { test2(); });`;

        const result = validator.validateTesting(sourceCode, testCode);
        expect(result.coverageType).toBe('measured');
        expect(result.coverageEvidence).toContain('2/2 functions');
      });

      it('should report unknown when test file has no test cases', () => {
        const sourceCode = `function foo() {}`;
        const testCode = `// Empty test file`;

        const result = validator.validateTesting(sourceCode, testCode);
        expect(result.coverageType).toBe('unknown');
        expect(result.coverageEvidence).toBe('Test file exists but no test cases found');
      });
    });

    describe('Edge cases', () => {
      it('should handle private functions (underscore prefix)', () => {
        const sourceCode = `
function publicFunc() {}
function _privateFunc() {}`;

        const testCode = `
it('tests publicFunc', () => { publicFunc(); });`;

        const result = validator.validateTesting(sourceCode, testCode);
        expect(result.totalFunctions).toBe(1); // _privateFunc excluded
      });

      it('should handle arrow functions', () => {
        const sourceCode = `
const handler = async (req, res) => { /* ... */ };
const validator = (data) => { /* ... */ };`;

        const testCode = `
test('handler works', () => { /* ... */ });`;

        const result = validator.validateTesting(sourceCode, testCode);
        expect(result.testedFunctions).toContain('handler');
        expect(result.untestedFunctions).toContain('validator');
      });
    });
  });

  describe('assessCompleteness', () => {
    describe('Completeness levels - distinguishes "implemented" from "complete"', () => {
      it('should recognize "implemented" stage', () => {
        const code = `
function processData(data) {
  return data.map(x => x * 2);
}`;

        const result = validator.assessCompleteness(code);
        expect(result.implemented).toBe(true);
        expect(result.tested).toBe(false);
        expect(result.complete).toBe(false);
      });

      it('should recognize "tested" stage', () => {
        const code = `
export function add(a, b) {
  return a + b;
}`;

        const tests = `
import { add } from './math';

test('add function', () => {
  expect(add(2, 3)).toBe(5);
});`;

        const result = validator.assessCompleteness(code, tests);
        expect(result.implemented).toBe(true);
        expect(result.tested).toBe(true);
        expect(result.integrated).toBe(true); // Has exports
        expect(result.complete).toBe(false); // Not validated (no error handling)
      });

      it('should recognize "integrated" stage', () => {
        const code = `
import { dependency } from './utils';

export function processData(data) {
  return dependency(data);
}`;

        const result = validator.assessCompleteness(code);
        expect(result.implemented).toBe(true);
        expect(result.integrated).toBe(true);
      });

      it('should recognize "validated" stage', () => {
        const code = `
/**
 * Processes user input with validation
 */
export async function processInput(input) {
  if (!input) {
    throw new Error('Input required');
  }

  try {
    const result = await validateInput(input);
    return result;
  } catch (error) {
    console.error('Validation failed:', error);
    throw error;
  }
}`;

        const tests = `
test('processInput validates correctly', () => {
  expect(processInput('valid')).resolves.toBeDefined();
});`;

        const result = validator.assessCompleteness(code, tests);
        expect(result.implemented).toBe(true);
        expect(result.tested).toBe(true);
        expect(result.integrated).toBe(true);
        expect(result.validated).toBe(true);
        expect(result.complete).toBe(false); // Not deployed
      });

      it('should not mark as complete without deployment', () => {
        const code = `
/**
 * Production-ready function with full error handling
 */
export async function fetchData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error('Fetch failed');
    }
    return response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}`;

        const tests = `
describe('fetchData', () => {
  it('fetches data successfully', async () => {
    const data = await fetchData();
    expect(data).toBeDefined();
  });
});`;

        const docs = `# API Documentation\n\n## fetchData()\n\nFetches data from the API.`;

        const result = validator.assessCompleteness(code, tests, docs);
        expect(result.validated).toBe(true);
        expect(result.documented).toBe(true);
        expect(result.deployed).toBe(false);
        expect(result.complete).toBe(false);
      });

      it('should fail validation if TODOs present', () => {
        const code = `
export function processData(data) {
  // TODO: Add validation
  return data.map(x => x * 2);
}`;

        const tests = `test('processData', () => { /* ... */ });`;

        const result = validator.assessCompleteness(code, tests);
        expect(result.validated).toBe(false);
        expect(result.complete).toBe(false);
      });

      it('should fail validation if FIXMEs present', () => {
        const code = `
export function calculate(x) {
  // FIXME: Handle edge case when x is 0
  return 100 / x;
}`;

        const result = validator.assessCompleteness(code);
        expect(result.validated).toBe(false);
      });
    });

    describe('Edge cases', () => {
      it('should handle code with no functions', () => {
        const code = `const x = 42;`;
        const result = validator.assessCompleteness(code);
        expect(result.implemented).toBe(false);
      });

      it('should require adequate test coverage', () => {
        const code = `
function a() {}
function b() {}
function c() {}
function d() {}`;

        const tests = `test('a', () => { a(); });`; // Only 25% coverage

        const result = validator.assessCompleteness(code, tests);
        expect(result.tested).toBe(false); // Below 70% threshold
      });
    });
  });

  describe('assess - comprehensive engineering assessment', () => {
    it('should identify implemented functions', () => {
      const code = `
function add(a, b) { return a + b; }
class Calculator {
  multiply(a, b) { return a * b; }
}`;

      const result = validator.assess(code);
      expect(result.implemented.some(i => i.includes('add'))).toBe(true);
      expect(result.implemented.some(i => i.includes('Calculator'))).toBe(true);
    });

    it('should track incomplete work via TODOs', () => {
      const code = `
function process() {
  // TODO: Implement error handling
  // TODO: Add input validation
  return null;
}`;

      const result = validator.assess(code);
      expect(result.notImplemented.length).toBe(2);
      expect(result.risks.some(r => r.category === 'completeness')).toBe(true);
    });

    it('should report critical risk for missing tests', () => {
      const code = `
function criticalOperation() {
  return performDatabaseUpdate();
}`;

      const result = validator.assess(code);
      expect(result.notTested).toContain('criticalOperation');
      expect(result.risks.some(r => r.severity === 'critical' && r.category === 'testing')).toBe(true);
    });

    it('should track tested and untested functions', () => {
      const code = `
function tested() {}
function untested() {}`;

      const tests = `
test('tested function', () => {
  tested();
});`;

      const result = validator.assess(code, tests);
      expect(result.tested).toContain('tested');
      expect(result.notTested).toContain('untested');
    });

    it('should identify error handling risks', () => {
      const code = `
async function fetchData() {
  const response = await fetch('/api');
  return response.json();
}`;

      const result = validator.assess(code);
      expect(result.risks.some(r => r.category === 'error-handling')).toBe(true);
      expect(result.risks.some(r => r.severity === 'critical')).toBe(true);
    });

    it('should provide specific recommendations', () => {
      const code = `
async function loadUser() {
  // TODO: Add error handling
  return await fetch('/user');
}`;

      const result = validator.assess(code);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.includes('TODO'))).toBe(true);
    });

    it('should validate documentation matches code', () => {
      const code = `
function actualFunction() {
  return true;
}`;

      const docs = `
## documentedFunction()
This function does something.
`;

      const result = validator.assess(code, undefined, docs);
      expect(result.risks.some(r => r.category === 'documentation')).toBe(true);
    });

    it('should include completion status in assessment', () => {
      const code = `
export async function process(data) {
  try {
    return await validate(data);
  } catch (error) {
    throw error;
  }
}`;

      const tests = `test('process', () => { /* ... */ });`;

      const result = validator.assess(code, tests);
      expect(result.completionStatus).toBeDefined();
      expect(result.completionStatus.implemented).toBe(true);
      expect(result.completionStatus.tested).toBe(true);
    });
  });

  describe('validateImplementation', () => {
    it('should extract functions', () => {
      const code = `
function regularFunc() {}
const arrowFunc = () => {};
const asyncFunc = async () => {};`;

      const result = validator.validateImplementation(code);
      expect(result.functions).toContain('regularFunc');
      expect(result.functions).toContain('arrowFunc');
      expect(result.functions).toContain('asyncFunc');
    });

    it('should extract classes', () => {
      const code = `
class MyClass {}
class AnotherClass extends BaseClass {}`;

      const result = validator.validateImplementation(code);
      expect(result.classes).toContain('MyClass');
      expect(result.classes).toContain('AnotherClass');
    });

    it('should detect TODOs and FIXMEs', () => {
      const code = `
// TODO: Implement feature X
function foo() {
  // FIXME: This is broken
  return null;
}`;

      const result = validator.validateImplementation(code);
      expect(result.todos.length).toBe(1);
      expect(result.fixmes.length).toBe(1);
      expect(result.issues.some(i => i.includes('TODO'))).toBe(true);
      expect(result.issues.some(i => i.includes('FIXME'))).toBe(true);
    });

    it('should detect console.log statements', () => {
      const code = `
function debug() {
  console.log('debug info');
  return true;
}`;

      const result = validator.validateImplementation(code);
      expect(result.issues.some(i => i.includes('console.log'))).toBe(true);
    });

    it('should detect empty catch blocks', () => {
      const code = `
try {
  riskyOperation();
} catch (error) {
}`;

      const result = validator.validateImplementation(code);
      expect(result.issues.some(i => i.includes('empty catch'))).toBe(true);
    });

    it('should warn about excessive "any" usage', () => {
      const code = `
function test(a: any, b: any, c: any, d: any, e: any, f: any) {
  const x: any = 1;
  const y: any = 2;
  return a;
}`;

      const result = validator.validateImplementation(code);
      expect(result.issues.some(i => i.includes("'any' type"))).toBe(true);
    });
  });

  describe('Real-world scenarios', () => {
    it('should properly assess a production-ready module', () => {
      const code = `
/**
 * User authentication module
 */
import { hash, compare } from './crypto';

export async function authenticate(username: string, password: string) {
  if (!username || !password) {
    throw new Error('Username and password required');
  }

  try {
    const user = await findUser(username);
    if (!user) {
      return null;
    }

    const isValid = await compare(password, user.passwordHash);
    return isValid ? user : null;
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}`;

      const tests = `
import { authenticate } from './auth';

describe('authenticate', () => {
  it('returns user on valid credentials', async () => {
    const user = await authenticate('test', 'password');
    expect(user).toBeDefined();
  });

  it('returns null on invalid credentials', async () => {
    const user = await authenticate('test', 'wrong');
    expect(user).toBeNull();
  });

  it('throws on missing username', async () => {
    await expect(authenticate('', 'password')).rejects.toThrow();
  });
});`;

      const docs = `# Authentication\n\n## authenticate(username, password)\n\nAuthenticates a user.`;

      const assessment = validator.assess(code, tests, docs);

      expect(assessment.completionStatus.implemented).toBe(true);
      expect(assessment.completionStatus.tested).toBe(true);
      expect(assessment.completionStatus.integrated).toBe(true);
      expect(assessment.completionStatus.validated).toBe(true);
      expect(assessment.completionStatus.documented).toBe(true);
      expect(assessment.risks.length).toBeLessThan(2); // Should have minimal risks
    });

    it('should catch incomplete implementation attempts', () => {
      const code = `
// TODO: Add proper error handling
// FIXME: Validate input
async function saveUser(user) {
  console.log('Saving user:', user);
  const result = await db.save(user);
  return result;
}`;

      const assessment = validator.assess(code);

      expect(assessment.completionStatus.implemented).toBe(true);
      expect(assessment.completionStatus.validated).toBe(false);
      expect(assessment.risks.some(r => r.severity === 'critical')).toBe(true);
      expect(assessment.notImplemented.length).toBeGreaterThan(0);
    });
  });

  describe('Factory and convenience functions', () => {
    it('should create validator via factory', () => {
      const validator = createEvidenceBasedEngineering();
      expect(validator).toBeInstanceOf(EvidenceBasedEngineering);
    });

    it('should provide convenience assessment function', () => {
      const code = `function test() { return true; }`;
      const result = assessEngineering(code);
      expect(result).toBeDefined();
      expect(result.implemented.length).toBeGreaterThan(0);
    });
  });
});
