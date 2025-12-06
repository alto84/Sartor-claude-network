/**
 * Tests for Evidence-Based Validation Skill
 *
 * Verifies that the validator correctly identifies anti-patterns
 * and follows the principles from UPLIFTED_SKILLS.md
 */

import {
  EvidenceBasedValidator,
  quickValidate,
  validateClaim,
} from './evidence-based-validation';

describe('EvidenceBasedValidator', () => {
  let validator: EvidenceBasedValidator;

  beforeEach(() => {
    validator = new EvidenceBasedValidator();
  });

  describe('validateMetrics', () => {
    it('should flag metrics without methodology', () => {
      const result = validator.validateMetrics('Test coverage is 95%');
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].category).toBe('metrics');
    });

    it('should accept metrics with methodology', () => {
      const result = validator.validateMetrics(
        'Coverage tool reported 87% line coverage on 2024-12-06'
      );
      expect(result.valid).toBe(true);
      expect(result.issues.length).toBe(0);
      expect(result.score).toBe(1.0);
    });

    it('should flag round percentages as suspicious', () => {
      const result = validator.validateMetrics('Quality score is 90%');
      expect(result.valid).toBe(false);
      expect(result.issues[0].type).toBe('error');
    });

    it('should accept enumerated metrics', () => {
      const result = validator.validateMetrics('Passed 42 out of 50 tests');
      expect(result.valid).toBe(true);
      expect(result.score).toBe(1.0);
    });
  });

  describe('validateLanguage', () => {
    it('should flag superlatives', () => {
      const result = validator.validateLanguage('The code is excellent');
      expect(result.valid).toBe(false);
      expect(result.issues[0].category).toBe('language');
      expect(result.issues[0].message).toContain('superlatives');
    });

    it('should flag vague language', () => {
      const result = validator.validateLanguage('This should work fine');
      expect(result.valid).toBe(false);
      expect(result.issues[0].category).toBe('language');
      expect(result.issues[0].message).toContain('vague');
    });

    it('should flag confidence inflation', () => {
      const result = validator.validateLanguage('This is guaranteed to work');
      expect(result.valid).toBe(false);
      expect(result.issues[0].message).toContain('confidenceInflation');
    });

    it('should accept precise language', () => {
      const result = validator.validateLanguage(
        'Follows standard patterns, no obvious defects observed'
      );
      expect(result.valid).toBe(true);
      expect(result.score).toBe(1.0);
    });
  });

  describe('validateEvidence', () => {
    it('should flag claims without sources', () => {
      const result = validator.validateEvidence(
        'Performance improved by 50%',
        []
      );
      expect(result.valid).toBe(false);
      expect(result.issues[0].category).toBe('evidence');
    });

    it('should flag placeholder sources', () => {
      const result = validator.validateEvidence('Test claim', [
        'TODO: add source',
      ]);
      expect(result.valid).toBe(false);
      expect(result.issues[0].message).toContain('placeholder');
    });

    it('should accept claims with valid sources', () => {
      const result = validator.validateEvidence('Test claim', [
        'https://example.com/study',
        'doi:10.1234/example',
      ]);
      expect(result.valid).toBe(true);
    });

    it('should require evidence for quantitative claims', () => {
      const result = validator.validateEvidence(
        'Improved performance by 75%',
        []
      );
      expect(result.valid).toBe(false);
      expect(result.issues[0].type).toBe('error');
    });
  });

  describe('validateCompleteness', () => {
    it('should flag "complete" without full evidence', () => {
      const result = validator.validateCompleteness('Feature is complete', [
        'Implemented',
      ]);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should flag "production ready" without deployment evidence', () => {
      const result = validator.validateCompleteness('Production ready', [
        'Code written',
      ]);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.message.includes('deployed'))).toBe(
        true
      );
    });

    it('should flag vague completion language', () => {
      const result = validator.validateCompleteness('Mostly done', [
        'Some work',
      ]);
      expect(result.issues.some((i) => i.message.includes('Vague'))).toBe(true);
    });

    it('should accept precise status with details', () => {
      const result = validator.validateCompleteness('Implemented', [
        'Implemented 5 out of 7 functions',
        'Not yet tested',
      ]);
      expect(result.valid).toBe(true);
    });

    it('should flag percentage claims without enumeration', () => {
      const result = validator.validateCompleteness('80% complete', [
        'Made progress',
      ]);
      expect(result.valid).toBe(false);
      expect(result.issues[0].message).toContain('enumeration');
    });
  });

  describe('validate (comprehensive)', () => {
    it('should combine all validation checks', () => {
      const result = validator.validate({
        text: 'Our excellent system provides 100% improvement',
        context: {
          claims: [
            {
              claim: 'System provides 100% improvement',
              sources: [],
            },
          ],
          status: 'Production ready',
          details: ['Implemented'],
        },
      });

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should return high score for valid input', () => {
      const result = validator.validate({
        text: 'Tested to work under specified conditions',
      });

      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThan(0.9);
    });
  });

  describe('convenience functions', () => {
    it('quickValidate should work on simple text', () => {
      const result = quickValidate('This is probably fine');
      expect(result.valid).toBe(false);
      expect(result.issues[0].category).toBe('language');
    });

    it('validateClaim should validate evidence', () => {
      const result = validateClaim('Test claim with 50% improvement', [
        'https://example.com',
      ]);
      expect(result.issues.length).toBeGreaterThan(-1);
    });
  });

  describe('anti-patterns from UPLIFTED_SKILLS.md', () => {
    it('should detect The Rounding Trap', () => {
      const result = validator.validateMetrics(
        '67% becomes roughly three-quarters'
      );
      expect(result.valid).toBe(false);
    });

    it('should detect Metric Fabrication', () => {
      const result = validator.validateMetrics('Quality score: 8.7/10');
      expect(result.valid).toBe(false);
      expect(result.issues[0].message).toContain('methodology');
    });

    it('should detect Confidence Inflation language', () => {
      const result = validator.validateLanguage(
        'This is proven to be reliable'
      );
      expect(result.valid).toBe(false);
      expect(result.issues[0].message).toContain('confidenceInflation');
    });

    it('should detect The Completion Illusion', () => {
      const result = validator.validateCompleteness('Complete', [
        'Code exists',
      ]);
      expect(result.valid).toBe(false);
      expect(
        result.issues.some(
          (i) =>
            i.message.includes('tested') ||
            i.message.includes('integrated') ||
            i.message.includes('validated')
        )
      ).toBe(true);
    });
  });
});
