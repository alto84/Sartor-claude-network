/**
 * Tests for Evidence-Based Validation
 *
 * Ensures that validation functions correctly enforce intellectual honesty
 * by preventing fabricated metrics, exaggerated claims, and unsupported assertions.
 */

import {
  validateMetric,
  validateLanguage,
  validateEvidence,
  validateCompleteness,
  validateClaim,
  ValidationResult,
  MetricValidationResult,
} from '../evidence-based-validation';

describe('Evidence-Based Validation', () => {
  describe('validateMetric', () => {
    describe('FAIL cases - metrics without methodology', () => {
      it('should fail for percentage without methodology', () => {
        const result = validateMetric('Coverage is 95%');
        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Metric lacks methodology - how was it measured?');
        expect(result.metric?.value).toBe('95%');
      });

      it('should fail for number without methodology', () => {
        const result = validateMetric('Performance improved by 2.5x');
        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Metric lacks methodology - how was it measured?');
      });

      it('should fail for metric without date', () => {
        const result = validateMetric('Response time is 42ms (measured via benchmark)');
        expect(result.isValid).toBe(false);
        expect(result.violations.length).toBe(0);
        expect(result.warnings).toContain('Metric lacks timestamp - when was it measured?');
      });

      it('should fail for bare metric claim', () => {
        const result = validateMetric('Test coverage: 87.3%');
        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Metric lacks methodology - how was it measured?');
      });
    });

    describe('PASS cases - metrics with methodology', () => {
      it('should pass for metric with methodology and date', () => {
        const result = validateMetric('Coverage: 94.7% (jest --coverage, 2024-01-15)');
        expect(result.isValid).toBe(true);
        expect(result.violations.length).toBe(0);
        expect(result.metric?.value).toBe('94.7%');
        expect(result.metric?.methodology).toBe('present');
        expect(result.metric?.date).toBe('present');
      });

      it('should pass for metric with tool name and date', () => {
        const result = validateMetric('Performance: 142ms (measured with benchmark tool on 2024/12/06)');
        expect(result.isValid).toBe(true);
        expect(result.violations.length).toBe(0);
      });

      it('should pass for metric with command and timestamp', () => {
        const result = validateMetric('Bundle size: 42KB (webpack --analyze, 2024-01-15)');
        expect(result.isValid).toBe(true);
        expect(result.violations.length).toBe(0);
      });

      it('should pass for coverage tool output with date', () => {
        const result = validateMetric('Line coverage: 91.2% (jest coverage report, 2024-01-15)');
        expect(result.isValid).toBe(true);
        expect(result.violations.length).toBe(0);
      });
    });

    describe('Edge cases', () => {
      it('should handle text without metrics', () => {
        const result = validateMetric('The code is well written');
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('No metric found in claim');
      });

      it('should detect metrics in complex sentences', () => {
        const result = validateMetric('After optimization, we achieved 99.9% uptime');
        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Metric lacks methodology - how was it measured?');
      });
    });
  });

  describe('validateLanguage', () => {
    describe('FAIL cases - superlatives and uncertain language', () => {
      it('should fail for "should work"', () => {
        const result = validateLanguage('This should work');
        expect(result.isValid).toBe(false);
        expect(result.violations.some(v => v.includes('should work'))).toBe(true);
      });

      it('should fail for "excellent" superlative', () => {
        const result = validateLanguage('The code is excellent');
        expect(result.isValid).toBe(false);
        expect(result.violations.some(v => v.includes('excellent'))).toBe(true);
      });

      it('should fail for "perfect" superlative', () => {
        const result = validateLanguage('This implementation is perfect');
        expect(result.isValid).toBe(false);
        expect(result.violations.some(v => v.includes('perfect'))).toBe(true);
      });

      it('should fail for "probably works"', () => {
        const result = validateLanguage('The function probably works correctly');
        expect(result.isValid).toBe(false);
        expect(result.violations.some(v => v.includes('probably works'))).toBe(true);
      });

      it('should fail for "best" superlative', () => {
        const result = validateLanguage('This is the best approach');
        expect(result.isValid).toBe(false);
        expect(result.violations.some(v => v.includes('best'))).toBe(true);
      });

      it('should fail for "optimal" superlative', () => {
        const result = validateLanguage('The algorithm is optimal');
        expect(result.isValid).toBe(false);
        expect(result.violations.some(v => v.includes('optimal'))).toBe(true);
      });

      it('should fail for "might work"', () => {
        const result = validateLanguage('This approach might work for our use case');
        expect(result.isValid).toBe(false);
        expect(result.violations.some(v => v.includes('might work'))).toBe(true);
      });

      it('should fail for multiple violations', () => {
        const result = validateLanguage('This excellent code should work perfectly');
        expect(result.isValid).toBe(false);
        expect(result.violations.length).toBeGreaterThan(1);
      });
    });

    describe('PASS cases - specific and factual language', () => {
      it('should pass for "handles the specified cases"', () => {
        const result = validateLanguage('The code handles the specified cases');
        expect(result.isValid).toBe(true);
        expect(result.violations.length).toBe(0);
      });

      it('should pass for specific observations', () => {
        const result = validateLanguage('The function validates input and returns errors for invalid data');
        expect(result.isValid).toBe(true);
        expect(result.violations.length).toBe(0);
      });

      it('should pass for measured statements', () => {
        const result = validateLanguage('The code passes 42 test cases and handles null inputs');
        expect(result.isValid).toBe(true);
        expect(result.violations.length).toBe(0);
      });

      it('should pass for descriptive language', () => {
        const result = validateLanguage('Implementation follows the adapter pattern');
        expect(result.isValid).toBe(true);
        expect(result.violations.length).toBe(0);
      });
    });

    describe('Warning cases - vague qualifiers', () => {
      it('should warn for "very"', () => {
        const result = validateLanguage('The code is very clear');
        expect(result.isValid).toBe(true);
        expect(result.warnings.some(w => w.includes('very'))).toBe(true);
      });

      it('should warn for "mostly"', () => {
        const result = validateLanguage('The feature is mostly complete');
        expect(result.isValid).toBe(true);
        expect(result.warnings.some(w => w.includes('mostly'))).toBe(true);
      });

      it('should warn for "generally"', () => {
        const result = validateLanguage('The system generally works well');
        expect(result.isValid).toBe(true);
        expect(result.warnings.some(w => w.includes('generally'))).toBe(true);
      });
    });
  });

  describe('validateEvidence', () => {
    describe('FAIL cases - claims without sources', () => {
      it('should fail for research claim without sources', () => {
        const result = validateEvidence('Research shows that this approach is effective');
        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Claim requires evidence but no sources provided');
      });

      it('should fail for "studies indicate" without sources', () => {
        const result = validateEvidence('Studies indicate performance improvements of 3x');
        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Claim requires evidence but no sources provided');
      });

      it('should fail for "proven" claim without sources', () => {
        const result = validateEvidence('This has been proven to work in production');
        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Claim requires evidence but no sources provided');
      });

      it('should fail for sources in invalid format', () => {
        const result = validateEvidence(
          'Research shows this is effective',
          ['some reference', 'another source']
        );
        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Sources provided but none are in valid format (URL, DOI, PMID, etc.)');
      });

      it('should fail for "demonstrated" without evidence', () => {
        const result = validateEvidence('The study demonstrated significant improvements');
        expect(result.isValid).toBe(false);
      });
    });

    describe('PASS cases - claims with verifiable sources', () => {
      it('should pass for claim with URL source', () => {
        const result = validateEvidence(
          'Research shows this approach works',
          ['https://example.com/research-paper']
        );
        expect(result.isValid).toBe(true);
        expect(result.violations.length).toBe(0);
      });

      it('should pass for claim with DOI', () => {
        const result = validateEvidence(
          'Studies indicate this is effective',
          ['doi: 10.1234/example.2024']
        );
        expect(result.isValid).toBe(true);
        expect(result.violations.length).toBe(0);
      });

      it('should pass for claim with PMID', () => {
        const result = validateEvidence(
          'Data shows significant correlation',
          ['PMID: 12345678']
        );
        expect(result.isValid).toBe(true);
        expect(result.violations.length).toBe(0);
      });

      it('should pass for claim with ArXiv ID', () => {
        const result = validateEvidence(
          'According to recent findings',
          ['arxiv: 2024.12345']
        );
        expect(result.isValid).toBe(true);
        expect(result.violations.length).toBe(0);
      });

      it('should pass for claim with multiple valid sources', () => {
        const result = validateEvidence(
          'Research shows this is effective',
          [
            'https://example.com/paper1',
            'doi: 10.1234/example.2024',
            'PMID: 87654321'
          ]
        );
        expect(result.isValid).toBe(true);
        expect(result.violations.length).toBe(0);
      });
    });

    describe('Edge cases', () => {
      it('should pass for non-claim statements', () => {
        const result = validateEvidence('The function validates input parameters');
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('No claim indicators found - may not require evidence');
      });

      it('should warn about mixed valid and invalid sources', () => {
        const result = validateEvidence(
          'Research shows this works',
          [
            'https://example.com/paper',
            'some book reference'
          ]
        );
        expect(result.isValid).toBe(true);
        expect(result.warnings.some(w => w.includes('may not be in verifiable format'))).toBe(true);
      });
    });
  });

  describe('validateCompleteness', () => {
    describe('FAIL cases - no enumeration', () => {
      it('should fail for "feature is complete" without enumeration', () => {
        const result = validateCompleteness('Feature is complete');
        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Completeness claim lacks enumeration - list what is and is not complete');
      });

      it('should fail for "implementation is finished" without details', () => {
        const result = validateCompleteness('The implementation is finished');
        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Completeness claim lacks enumeration - list what is and is not complete');
      });

      it('should fail for "all features done" without listing', () => {
        const result = validateCompleteness('All features are done');
        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Completeness claim lacks enumeration - list what is and is not complete');
      });

      it('should fail for "ready for production" without specifics', () => {
        const result = validateCompleteness('The system is ready for deployment');
        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Completeness claim lacks enumeration - list what is and is not complete');
      });
    });

    describe('PASS cases - proper enumeration', () => {
      it('should pass for "Implemented: X, Y. Not implemented: Z"', () => {
        const result = validateCompleteness('Implemented: authentication, validation. Not implemented: caching');
        expect(result.isValid).toBe(true);
        expect(result.violations.length).toBe(0);
      });

      it('should pass for bullet list enumeration', () => {
        const result = validateCompleteness(`Feature is complete:
- User authentication
- Data validation
- Error handling`);
        expect(result.isValid).toBe(true);
        expect(result.violations.length).toBe(0);
      });

      it('should pass for numbered list', () => {
        const result = validateCompleteness(`Implementation complete:
1. Core functionality
2. Unit tests
3. Integration tests`);
        expect(result.isValid).toBe(true);
        expect(result.violations.length).toBe(0);
      });

      it('should pass for explicit sections', () => {
        const result = validateCompleteness('Completed: API endpoints, database schema. Remaining: documentation, deployment scripts');
        expect(result.isValid).toBe(true);
        expect(result.violations.length).toBe(0);
      });

      it('should pass for comma-separated list with capitals', () => {
        const result = validateCompleteness('Done: Login, Signup, Password Reset');
        expect(result.isValid).toBe(true);
        expect(result.violations.length).toBe(0);
      });
    });

    describe('Warning cases', () => {
      it('should warn when only positive items listed', () => {
        const result = validateCompleteness('Implemented: feature A, feature B, feature C');
        expect(result.isValid).toBe(true);
        expect(result.warnings.some(w => w.includes('not what remains'))).toBe(true);
      });

      it('should not warn when both positive and negative listed', () => {
        const result = validateCompleteness('Implemented: A, B. Not implemented: C, D');
        expect(result.isValid).toBe(true);
        expect(result.warnings.every(w => !w.includes('not what remains'))).toBe(true);
      });
    });

    describe('Edge cases', () => {
      it('should pass for non-completeness statements', () => {
        const result = validateCompleteness('The function validates user input');
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('No completeness claim detected');
      });
    });
  });

  describe('validateClaim - comprehensive validation', () => {
    it('should run all validations by default', () => {
      const result = validateClaim('Coverage is 95% and the code is excellent');
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should skip validations when requested', () => {
      const result = validateClaim(
        'Coverage is 95%',
        { skipLanguageValidation: true }
      );
      expect(result.violations.some(v => v.includes('methodology'))).toBe(true);
    });

    it('should validate evidence when sources provided', () => {
      const result = validateClaim(
        'Research shows this works',
        { sources: ['https://example.com/paper'] }
      );
      // Should not fail for missing sources
      expect(result.violations.every(v => !v.includes('no sources provided'))).toBe(true);
    });

    it('should aggregate violations from multiple validators', () => {
      const result = validateClaim('This excellent feature is complete with 95% coverage');
      expect(result.violations.length).toBeGreaterThan(1);
      expect(result.violations.some(v => v.includes('excellent'))).toBe(true);
      expect(result.violations.some(v => v.includes('methodology'))).toBe(true);
      expect(result.violations.some(v => v.includes('enumeration'))).toBe(true);
    });

    it('should pass for well-formed claims', () => {
      const result = validateClaim(
        'Implemented: auth, validation. Coverage: 94.7% (jest --coverage, 2024-01-15)',
        { skipEvidenceValidation: true }
      );
      expect(result.isValid).toBe(true);
      expect(result.violations.length).toBe(0);
    });
  });

  describe('Real-world examples', () => {
    describe('Code review scenarios', () => {
      it('should catch over-confident claims', () => {
        const result = validateClaim('This perfect implementation should work flawlessly');
        expect(result.isValid).toBe(false);
        expect(result.violations.length).toBeGreaterThan(1);
      });

      it('should validate proper status reports', () => {
        const result = validateClaim(
          'Completed: user login, password reset. Pending: email verification. Test coverage: 87.3% (jest, 2024-12-06)',
          { skipEvidenceValidation: true }
        );
        expect(result.isValid).toBe(true);
      });

      it('should catch vague progress reports', () => {
        const result = validateClaim('The feature is mostly done and should be ready soon');
        expect(result.isValid).toBe(false);
      });
    });

    describe('Documentation scenarios', () => {
      it('should validate research citations', () => {
        const result = validateEvidence(
          'According to the documentation, this pattern improves performance by 40%',
          ['https://docs.example.com/performance']
        );
        expect(result.isValid).toBe(true);
      });

      it('should catch unsupported claims', () => {
        const result = validateEvidence('Studies have shown that this is the best approach');
        expect(result.isValid).toBe(false);
      });
    });

    describe('Performance claims', () => {
      it('should require methodology for performance metrics', () => {
        const result = validateMetric('Improved performance by 3x');
        expect(result.isValid).toBe(false);
        expect(result.violations).toContain('Metric lacks methodology - how was it measured?');
      });

      it('should accept well-documented performance claims', () => {
        const result = validateMetric('Response time: 42ms baseline, 14ms optimized (Apache Bench, 2024-12-06)');
        expect(result.isValid).toBe(true);
      });
    });
  });
});
