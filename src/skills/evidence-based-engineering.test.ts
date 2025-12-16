/**
 * Evidence-Based Engineering Skill - Tests
 *
 * Unit tests to verify the Evidence-Based Engineering skill works correctly.
 */

import {
  EvidenceBasedEngineering,
  assessEngineering,
  createEvidenceBasedEngineering,
} from './evidence-based-engineering';

describe('EvidenceBasedEngineering', () => {
  let validator: EvidenceBasedEngineering;

  beforeEach(() => {
    validator = new EvidenceBasedEngineering();
  });

  describe('validateImplementation', () => {
    it('should identify functions in code', () => {
      const code = `
        function calculateTotal(items: Item[]): number {
          return items.reduce((sum, item) => sum + item.price, 0);
        }

        const processOrder = async (orderId: string) => {
          // Process order
        };
      `;

      const result = validator.validateImplementation(code);

      expect(result.functions).toContain('calculateTotal');
      expect(result.functions).toContain('processOrder');
      expect(result.functions.length).toBeGreaterThan(0);
    });

    it('should detect TODOs as incomplete work', () => {
      const code = `
        function doSomething() {
          // TODO: Implement this function
          return null;
        }
      `;

      const result = validator.validateImplementation(code);

      expect(result.todos.length).toBe(1);
      expect(result.issues).toContain(expect.stringContaining('TODO'));
    });

    it('should detect FIXMEs as known issues', () => {
      const code = `
        function buggyFunction() {
          // FIXME: This crashes with null values
          return process(data);
        }
      `;

      const result = validator.validateImplementation(code);

      expect(result.fixmes.length).toBe(1);
      expect(result.issues).toContain(expect.stringContaining('FIXME'));
    });

    it('should flag empty catch blocks', () => {
      const code = `
        async function riskyOperation() {
          try {
            await doSomething();
          } catch (e) {}
        }
      `;

      const result = validator.validateImplementation(code);

      expect(result.issues).toContain(expect.stringContaining('empty catch'));
    });
  });

  describe('validateTesting', () => {
    it('should identify tested functions', () => {
      const code = `
        function add(a: number, b: number): number {
          return a + b;
        }

        function subtract(a: number, b: number): number {
          return a - b;
        }
      `;

      const tests = `
        describe('Math operations', () => {
          it('should add two numbers', () => {
            expect(add(2, 3)).toBe(5);
          });

          it('should handle subtract edge cases', () => {
            expect(subtract(5, 3)).toBe(2);
          });
        });
      `;

      const result = validator.validateTesting(code, tests);

      expect(result.hasCoverage).toBe(true);
      expect(result.testedFunctions).toContain('add');
      expect(result.testedFunctions).toContain('subtract');
      expect(result.untestedFunctions.length).toBe(0);
      expect(result.coverageType).toBe('measured');
    });

    it('should identify untested functions', () => {
      const code = `
        function tested() { return 1; }
        function untested() { return 2; }
      `;

      const tests = `
        it('should test tested function', () => {
          expect(tested()).toBe(1);
        });
      `;

      const result = validator.validateTesting(code, tests);

      expect(result.testedFunctions).toContain('tested');
      expect(result.untestedFunctions).toContain('untested');
    });

    it('should report unknown coverage when no tests provided', () => {
      const code = `function foo() { return 1; }`;
      const tests = '';

      const result = validator.validateTesting(code, tests);

      expect(result.hasCoverage).toBe(false);
      expect(result.coverageType).toBe('unknown');
    });
  });

  describe('validateErrorHandling', () => {
    it('should detect try/catch blocks', () => {
      const code = `
        async function handleRequest() {
          try {
            await fetch('/api/data');
          } catch (error) {
            console.error(error);
          }
        }
      `;

      const result = validator.validateErrorHandling(code);

      expect(result.hasErrorHandling).toBe(true);
      expect(result.handledCases).toContain(expect.stringContaining('try/catch'));
    });

    it('should detect input validation', () => {
      const code = `
        function process(data: any) {
          if (!data) {
            throw new Error('Data required');
          }
          if (data === null || data === undefined) {
            return null;
          }
          return data;
        }
      `;

      const result = validator.validateErrorHandling(code);

      expect(result.hasErrorHandling).toBe(true);
      expect(result.handledCases.length).toBeGreaterThan(0);
    });

    it('should flag async functions without error handling', () => {
      const code = `
        async function riskyOperation() {
          await fetch('/api/data');
          await processData();
        }
      `;

      const result = validator.validateErrorHandling(code);

      expect(result.unhandledCases.length).toBeGreaterThan(0);
      expect(result.severity).not.toBe('adequate');
    });

    it('should detect missing promise catch handlers', () => {
      const code = `
        function getData() {
          fetch('/api/data')
            .then(response => response.json())
            .then(data => console.log(data));
        }
      `;

      const result = validator.validateErrorHandling(code);

      expect(result.unhandledCases).toContain(expect.stringContaining('without .catch()'));
    });
  });

  describe('validateDocumentation', () => {
    it('should detect missing JSDoc comments', () => {
      const code = `
        function undocumented() {
          return 42;
        }

        /**
         * This function is documented
         */
        function documented() {
          return 42;
        }
      `;

      const result = validator.validateDocumentation(code, '');

      expect(result.matchesImplementation).toBe(false);
      expect(result.missingDocs.length).toBeGreaterThan(0);
    });

    it('should detect discrepancies between docs and code', () => {
      const code = `
        function actualFunction() {
          return 1;
        }
      `;

      const docs = `
        ## nonExistentFunction()
        This function doesn't exist in the code.
      `;

      const result = validator.validateDocumentation(code, docs);

      expect(result.matchesImplementation).toBe(false);
      expect(result.discrepancies.length).toBeGreaterThan(0);
    });
  });

  describe('assessCompleteness', () => {
    it('should mark code as implemented when functions exist', () => {
      const code = `
        export function doWork() {
          return true;
        }
      `;

      const result = validator.assessCompleteness(code);

      expect(result.implemented).toBe(true);
    });

    it('should mark code as NOT implemented when TODOs exist', () => {
      const code = `
        export function doWork() {
          // TODO: Implement this
          return null;
        }
      `;

      const result = validator.assessCompleteness(code);

      expect(result.validated).toBe(false);
    });

    it('should mark code as tested when sufficient tests exist', () => {
      const code = `
        export function add(a: number, b: number) { return a + b; }
        export function sub(a: number, b: number) { return a - b; }
      `;

      const tests = `
        it('should add', () => expect(add(1,2)).toBe(3));
        it('should sub', () => expect(sub(2,1)).toBe(1));
      `;

      const result = validator.assessCompleteness(code, tests);

      expect(result.tested).toBe(true);
    });

    it('should detect integration (exports/imports)', () => {
      const code = `
        import { helper } from './helper';
        export function doWork() {
          return helper();
        }
      `;

      const result = validator.assessCompleteness(code);

      expect(result.integrated).toBe(true);
    });

    it('should require all stages for complete status', () => {
      const incompleteCode = `
        function notComplete() {
          // TODO: finish this
          return null;
        }
      `;

      const result = validator.assessCompleteness(incompleteCode);

      expect(result.complete).toBe(false);
    });
  });

  describe('assess (comprehensive)', () => {
    it('should provide comprehensive assessment', () => {
      const code = `
        export class Calculator {
          add(a: number, b: number): number {
            return a + b;
          }

          // TODO: Implement division
          divide(a: number, b: number): number {
            return 0;
          }
        }
      `;

      const tests = `
        it('should add numbers', () => {
          const calc = new Calculator();
          expect(calc.add(2, 3)).toBe(5);
        });
      `;

      const result = validator.assess(code, tests);

      expect(result.implemented.length).toBeGreaterThan(0);
      expect(result.notImplemented.length).toBeGreaterThan(0);
      expect(result.tested.length).toBeGreaterThan(0);
      expect(result.notTested.length).toBeGreaterThan(0);
      expect(result.risks.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.completionStatus).toBeDefined();
    });

    it('should identify critical risk when no tests provided', () => {
      const code = `export function doWork() { return 1; }`;

      const result = validator.assess(code);

      const criticalRisks = result.risks.filter((r) => r.severity === 'critical');
      expect(criticalRisks.length).toBeGreaterThan(0);
      expect(criticalRisks.some((r) => r.category === 'testing')).toBe(true);
    });
  });

  describe('factory function', () => {
    it('should create validator instance', () => {
      const validator = createEvidenceBasedEngineering();
      expect(validator).toBeInstanceOf(EvidenceBasedEngineering);
    });
  });

  describe('convenience function', () => {
    it('should assess engineering quality', () => {
      const code = `export function test() { return 1; }`;
      const result = assessEngineering(code);

      expect(result).toBeDefined();
      expect(result.completionStatus).toBeDefined();
      expect(result.risks).toBeDefined();
    });
  });
});
