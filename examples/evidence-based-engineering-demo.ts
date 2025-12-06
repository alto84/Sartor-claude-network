/**
 * Evidence-Based Engineering Skill - Demonstration
 *
 * This file demonstrates how to use the Evidence-Based Engineering skill
 * to validate code quality, test coverage, and completeness.
 */

import { assessEngineering, EvidenceBasedEngineering } from '../src/skills/evidence-based-engineering';

// Example 1: Assessing incomplete code
const incompleteCode = `
export class UserManager {
  // TODO: Add user validation
  createUser(name: string, email: string) {
    return { name, email };
  }

  // FIXME: This doesn't handle errors
  async fetchUser(id: string) {
    const response = await fetch(\`/api/users/\${id}\`);
    return response.json();
  }
}
`;

const noTests = '';

console.log('=== Example 1: Incomplete Implementation ===');
const assessment1 = assessEngineering(incompleteCode, noTests);
console.log('Implemented:', assessment1.implemented);
console.log('Not Implemented:', assessment1.notImplemented);
console.log('Tested:', assessment1.tested);
console.log('Not Tested:', assessment1.notTested);
console.log('Risks:', assessment1.risks);
console.log('Recommendations:', assessment1.recommendations);
console.log('Completion Status:', assessment1.completionStatus);
console.log('\n');

// Example 2: Better implementation with error handling
const betterCode = `
export class UserManager {
  /**
   * Create a new user with validation
   */
  createUser(name: string, email: string): User | null {
    if (!name || !email) {
      throw new Error('Name and email are required');
    }

    if (!email.includes('@')) {
      throw new Error('Invalid email format');
    }

    return { name, email, id: crypto.randomUUID() };
  }

  /**
   * Fetch user by ID with error handling
   */
  async fetchUser(id: string): Promise<User | null> {
    if (!id) {
      throw new Error('User ID is required');
    }

    try {
      const response = await fetch(\`/api/users/\${id}\`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw new Error(\`Failed to fetch user: \${error.message}\`);
    }
  }
}

interface User {
  id: string;
  name: string;
  email: string;
}
`;

const testsForBetterCode = `
import { UserManager } from './user-manager';

describe('UserManager', () => {
  let userManager: UserManager;

  beforeEach(() => {
    userManager = new UserManager();
  });

  describe('createUser', () => {
    it('should create a user with valid inputs', () => {
      const user = userManager.createUser('John Doe', 'john@example.com');
      expect(user).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
    });

    it('should throw error for missing name', () => {
      expect(() => userManager.createUser('', 'john@example.com')).toThrow('Name and email are required');
    });

    it('should throw error for invalid email', () => {
      expect(() => userManager.createUser('John', 'invalid-email')).toThrow('Invalid email format');
    });
  });

  describe('fetchUser', () => {
    it('should fetch user successfully', async () => {
      // Test implementation
    });

    it('should handle network errors', async () => {
      // Test implementation
    });
  });
});
`;

console.log('=== Example 2: Better Implementation with Tests ===');
const assessment2 = assessEngineering(betterCode, testsForBetterCode);
console.log('Implemented:', assessment2.implemented);
console.log('Tested:', assessment2.tested);
console.log('Not Tested:', assessment2.notTested);
console.log('Risks:', assessment2.risks);
console.log('Completion Status:', assessment2.completionStatus);
console.log('\n');

// Example 3: Using the class directly for detailed analysis
const validator = new EvidenceBasedEngineering();

console.log('=== Example 3: Detailed Analysis ===');
const implValidation = validator.validateImplementation(betterCode);
console.log('Implementation Validation:', {
  isValid: implValidation.isValid,
  functionsFound: implValidation.functions,
  issuesFound: implValidation.issues
});

const testAnalysis = validator.validateTesting(betterCode, testsForBetterCode);
console.log('\nTest Analysis:', {
  hasCoverage: testAnalysis.hasCoverage,
  testedFunctions: testAnalysis.testedFunctions,
  untestedFunctions: testAnalysis.untestedFunctions,
  coverageType: testAnalysis.coverageType,
  evidence: testAnalysis.coverageEvidence
});

const errorAnalysis = validator.validateErrorHandling(betterCode);
console.log('\nError Handling Analysis:', {
  hasErrorHandling: errorAnalysis.hasErrorHandling,
  handledCases: errorAnalysis.handledCases,
  unhandledCases: errorAnalysis.unhandledCases,
  severity: errorAnalysis.severity
});

// Example 4: Documentation validation
const docs = `
# UserManager API

## createUser(name, email)
Creates a new user with the provided name and email.

## fetchUser(id)
Fetches a user by their ID.
`;

const docAnalysis = validator.validateDocumentation(betterCode, docs);
console.log('\nDocumentation Analysis:', {
  matchesImplementation: docAnalysis.matchesImplementation,
  discrepancies: docAnalysis.discrepancies,
  missingDocs: docAnalysis.missingDocs
});

// Example 5: Completeness assessment
console.log('\n=== Example 5: Completeness Assessment ===');
const completionStatus = validator.assessCompleteness(betterCode, testsForBetterCode, docs);
console.log('Completion Status:', completionStatus);
console.log('\nKey Insights:');
console.log('- Implemented:', completionStatus.implemented ? 'YES' : 'NO');
console.log('- Tested:', completionStatus.tested ? 'YES' : 'NO');
console.log('- Integrated:', completionStatus.integrated ? 'YES' : 'NO');
console.log('- Validated:', completionStatus.validated ? 'YES' : 'NO');
console.log('- Documented:', completionStatus.documented ? 'YES' : 'NO');
console.log('- Deployed:', completionStatus.deployed ? 'YES (cannot determine from code)' : 'NO');
console.log('- COMPLETE:', completionStatus.complete ? 'YES' : 'NO');

/**
 * Key Principles Demonstrated:
 *
 * 1. Implementation ≠ Complete
 *    - Code can be implemented but not tested
 *    - Tested but not validated
 *    - Validated but not documented
 *
 * 2. Binary Test Coverage
 *    - Each function either has tests or doesn't
 *    - No percentage claims without measurement
 *
 * 3. Evidence-Based Assessment
 *    - Measured: Actual test coverage from test file analysis
 *    - Estimated: Approximations clearly labeled
 *    - Assumed: Assumptions explicitly stated
 *    - Unknown: Gaps acknowledged
 *
 * 4. Risk Identification
 *    - Missing error handling
 *    - Incomplete tests
 *    - TODOs and FIXMEs
 *    - Documentation gaps
 *
 * 5. Actionable Recommendations
 *    - Specific fixes, not vague suggestions
 *    - Prioritized by risk severity
 */
