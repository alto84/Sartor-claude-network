/**
 * Tests for Safety Research Workflow Skill
 *
 * Validates research quality and integrity for:
 * - Source verification and citation authenticity
 * - Evidence hierarchy enforcement
 * - Conflict preservation (not artificial consensus)
 * - Quality gates as circuit breakers
 * - Claim-to-source traceability
 * - Fabrication detection
 *
 * Based on: UPLIFTED_SKILLS.md - Safety Research Workflow
 * Core Principle: Truth Over Speed
 */

import {
  SafetyResearchWorkflow,
  createSafetyResearchWorkflow,
  validateResearch,
  ResearchClaim,
  CitationValidation,
  QualityGateResult,
  ConflictAnalysis,
  ResearchReport,
} from '../safety-research-workflow';

describe('Safety Research Workflow', () => {
  let validator: SafetyResearchWorkflow;

  beforeEach(() => {
    validator = createSafetyResearchWorkflow();
  });

  describe('Claim Evaluation', () => {
    describe('FAIL - Claim with no sources', () => {
      it('should fail when claim has no supporting sources', () => {
        const claim: ResearchClaim = {
          statement: 'AI systems improve productivity by 40%',
          sources: [],
        };

        const result = validator.evaluateClaim(claim);
        expect(result.isValid).toBe(false);
        expect(result.issues).toContain('Claim has no supporting sources');
        expect(result.severity).toBe('critical');
      });

      it('should fail when quantitative claim lacks source', () => {
        const claim: ResearchClaim = {
          statement: 'The model achieved 95% accuracy on the benchmark',
          sources: [],
        };

        const result = validator.evaluateClaim(claim);
        expect(result.isValid).toBe(false);
        expect(result.issues.some(i => i.includes('Quantitative claim'))).toBe(true);
      });

      it('should fail when claim references study without identifier', () => {
        const claim: ResearchClaim = {
          statement: 'Studies show that memory retention improves with spaced repetition',
          sources: [
            {
              description: 'A study on memory',
              // Missing: PMID, DOI, URL
            },
          ],
        };

        const result = validator.evaluateClaim(claim);
        expect(result.isValid).toBe(false);
        expect(result.issues).toContain('Source missing verifiable identifier (PMID/DOI/URL)');
      });

      it('should fail when multiple claims share one vague source', () => {
        const claims = [
          { statement: 'Claude is effective at coding', sources: [{ url: 'anthropic.com' }] },
          { statement: 'Claude handles long contexts', sources: [{ url: 'anthropic.com' }] },
          { statement: 'Claude excels at analysis', sources: [{ url: 'anthropic.com' }] },
        ];

        const result = validator.evaluateClaimGroup(claims);
        expect(result.issues).toContain('Multiple claims cite same generic source');
        expect(result.quality).toBe('poor');
      });

      it('should fail when claim specificity exceeds source specificity', () => {
        const claim: ResearchClaim = {
          statement: 'Exactly 73.4% of developers prefer TypeScript over JavaScript',
          sources: [
            {
              title: 'Developer Survey 2023',
              url: 'example.com/survey',
              quote: 'Most developers prefer TypeScript',
            },
          ],
        };

        const result = validator.evaluateClaim(claim);
        expect(result.isValid).toBe(false);
        expect(result.issues.some(i => i.includes('more specific than source'))).toBe(true);
      });
    });

    describe('FAIL - Fabricated citation', () => {
      it('should fail when PMID does not exist', async () => {
        const citation = {
          pmid: '99999999',
          title: 'Fake Study on AI Safety',
          authors: 'Smith et al.',
        };

        const result = await validator.validateCitation(citation);
        expect(result.isValid).toBe(false);
        expect(result.issues).toContain('PMID not found in PubMed database');
        expect(result.fabricationRisk).toBe('high');
      });

      it('should fail when DOI returns 404', async () => {
        const citation = {
          doi: '10.1234/fake.doi.12345',
          title: 'Nonexistent Paper',
        };

        const result = await validator.validateCitation(citation);
        expect(result.isValid).toBe(false);
        expect(result.issues.some(i => i.includes('DOI not found'))).toBe(true);
      });

      it('should fail when citation details do not match retrieved metadata', async () => {
        const citation = {
          pmid: '12345678', // Real PMID
          title: 'Wrong Title',
          authors: 'Wrong Authors',
        };

        const result = await validator.validateCitation(citation);
        expect(result.isValid).toBe(false);
        expect(result.issues).toContain('Citation metadata mismatch - possible fabrication');
      });

      it('should fail when placeholder citations detected', () => {
        const citations = [
          { title: 'Smith et al. (2023)' },
          { title: 'Example Study' },
          { title: 'TBD' },
          { title: '[Citation needed]' },
        ];

        const result = validator.detectPlaceholderCitations(citations);
        expect(result.hasPlaceholders).toBe(true);
        expect(result.placeholders.length).toBe(4);
        expect(result.severity).toBe('critical');
      });

      it('should fail when citation patterns suggest fabrication', () => {
        const citations = [
          {
            authors: 'Johnson et al.',
            year: '2023',
            title: 'Study on Topic A',
            journal: 'International Journal of Research',
          },
          {
            authors: 'Williams et al.',
            year: '2023',
            title: 'Study on Topic B',
            journal: 'International Journal of Research',
          },
          {
            authors: 'Brown et al.',
            year: '2023',
            title: 'Study on Topic C',
            journal: 'International Journal of Research',
          },
        ];

        const result = validator.analyzeCitationPatterns(citations);
        expect(result.suspiciousPatterns).toContain('All citations same year and journal');
        expect(result.fabricationRisk).toBe('medium');
      });

      it('should fail when arXiv ID is invalid', async () => {
        const citation = {
          arxivId: '9999.99999',
          title: 'Fake Preprint',
        };

        const result = await validator.validateCitation(citation);
        expect(result.isValid).toBe(false);
        expect(result.issues.some(i => i.includes('arXiv'))).toBe(true);
      });
    });

    describe('PASS - Claim with verifiable sources', () => {
      it('should pass for claim with PMID-verified source', () => {
        const claim: ResearchClaim = {
          statement: 'Spaced repetition improves long-term retention',
          sources: [
            {
              pmid: '17051426',
              title: 'Distributed practice in verbal recall tasks',
              authors: 'Cepeda et al.',
              year: '2006',
              quote: 'Spaced practice led to better retention than massed practice',
            },
          ],
        };

        const result = validator.evaluateClaim(claim);
        expect(result.isValid).toBe(true);
        expect(result.sourceQuality).toBe('high');
        expect(result.evidenceLevel).toBe('empirical');
      });

      it('should pass for claim with DOI-verified peer-reviewed source', () => {
        const claim: ResearchClaim = {
          statement: 'Transformer models scale efficiently to large datasets',
          sources: [
            {
              doi: '10.48550/arXiv.1706.03762',
              title: 'Attention is All You Need',
              authors: 'Vaswani et al.',
              year: '2017',
              journal: 'NeurIPS 2017',
            },
          ],
        };

        const result = validator.evaluateClaim(claim);
        expect(result.isValid).toBe(true);
        expect(result.hasVerifiableIdentifier).toBe(true);
      });

      it('should pass for claim with URL and archived snapshot', () => {
        const claim: ResearchClaim = {
          statement: 'The system processes 1000 requests per second',
          sources: [
            {
              url: 'https://example.com/benchmark-results',
              archiveUrl: 'https://web.archive.org/web/20231201/example.com/benchmark-results',
              accessDate: '2023-12-01',
              quote: 'Throughput: 1000 req/sec',
            },
          ],
        };

        const result = validator.evaluateClaim(claim);
        expect(result.isValid).toBe(true);
        expect(result.archivalStatus).toBe('archived');
      });

      it('should pass when claim matches source specificity', () => {
        const claim: ResearchClaim = {
          statement: 'In the survey, 67% of 1,200 respondents preferred option A',
          sources: [
            {
              url: 'https://example.com/survey-2023',
              title: 'Developer Survey 2023',
              quote: '803 of 1,200 respondents (67%) selected option A as their preference',
              methodology: 'Random sampling, n=1200, margin of error ±3%',
            },
          ],
        };

        const result = validator.evaluateClaim(claim);
        expect(result.isValid).toBe(true);
        expect(result.specificityMatch).toBe(true);
        expect(result.quality).toBe('excellent');
      });

      it('should pass for primary source reference', () => {
        const claim: ResearchClaim = {
          statement: 'The experiment measured a 23% improvement',
          sources: [
            {
              type: 'primary',
              doi: '10.1234/example.2023',
              title: 'Experimental Results',
              dataAvailable: true,
              quote: 'Treatment group showed 23% improvement (p < 0.01)',
            },
          ],
        };

        const result = validator.evaluateClaim(claim);
        expect(result.isValid).toBe(true);
        expect(result.sourceType).toBe('primary');
        expect(result.evidenceLevel).toBe('empirical');
      });

      it('should correctly rank evidence hierarchy', () => {
        const claims = [
          {
            statement: 'Claim A',
            sources: [{ type: 'empirical-measurement', pmid: '12345' }],
          },
          {
            statement: 'Claim B',
            sources: [{ type: 'peer-reviewed-study', doi: '10.1234/study' }],
          },
          {
            statement: 'Claim C',
            sources: [{ type: 'expert-opinion', url: 'expert.com/blog' }],
          },
        ];

        const rankings = validator.rankByEvidenceQuality(claims);
        expect(rankings[0].evidenceLevel).toBe('empirical');
        expect(rankings[1].evidenceLevel).toBe('peer-reviewed');
        expect(rankings[2].evidenceLevel).toBe('expert-opinion');
      });
    });
  });

  describe('Quality Gates', () => {
    describe('FAIL - Report with unverified claims', () => {
      it('should fail quality gate when claims lack sources', () => {
        const report: ResearchReport = {
          title: 'AI Safety Analysis',
          claims: [
            {
              statement: 'AI systems are becoming more capable',
              sources: [],
            },
            {
              statement: 'Safety research is important',
              sources: [],
            },
          ],
          limitations: 'Some limitations apply',
        };

        const result = validator.runQualityGate(report);
        expect(result.passed).toBe(false);
        expect(result.failedChecks).toContain('Claims without sources');
        expect(result.blocksPublication).toBe(true);
      });

      it('should fail quality gate when citations not validated', () => {
        const report: ResearchReport = {
          title: 'Research Report',
          claims: [
            {
              statement: 'Study shows X',
              sources: [{ title: 'Some Study', validated: false }],
            },
          ],
          citationsValidated: false,
        };

        const result = validator.runQualityGate(report);
        expect(result.passed).toBe(false);
        expect(result.failedChecks).toContain('Citations not validated');
      });

      it('should fail when limitations section too generic', () => {
        const report: ResearchReport = {
          title: 'Analysis',
          claims: [
            {
              statement: 'Finding X is true',
              sources: [{ pmid: '12345', validated: true }],
            },
          ],
          limitations: 'More research is needed',
        };

        const result = validator.runQualityGate(report);
        expect(result.warnings).toContain('Limitations too generic');
        expect(result.quality).toBe('needs-improvement');
      });

      it('should fail when conflicting evidence smoothed over', () => {
        const report: ResearchReport = {
          title: 'Consensus Report',
          claims: [
            {
              statement: 'All sources agree that X is true',
              sources: [
                { quote: 'X is definitely true' },
                { quote: 'X might be true' },
                { quote: 'X is possibly false' },
              ],
              conflictsResolved: 'artificial',
            },
          ],
        };

        const result = validator.runQualityGate(report);
        expect(result.passed).toBe(false);
        expect(result.failedChecks).toContain('Artificial conflict resolution detected');
      });

      it('should fail when confidence exceeds evidence', () => {
        const report: ResearchReport = {
          title: 'Definitive Analysis',
          claims: [
            {
              statement: 'X is definitely true',
              confidence: 'certain',
              sources: [
                {
                  type: 'blog-post',
                  url: 'example.com/opinion',
                },
              ],
            },
          ],
        };

        const result = validator.runQualityGate(report);
        expect(result.passed).toBe(false);
        expect(result.issues).toContain('Confidence level exceeds evidence strength');
      });

      it('should fail when methodology not documented', () => {
        const report: ResearchReport = {
          title: 'Research Findings',
          claims: [
            {
              statement: 'Average score is 7.5',
              sources: [{ data: [7, 8, 7, 8] }],
            },
          ],
          methodology: undefined,
        };

        const result = validator.runQualityGate(report);
        expect(result.warnings).toContain('Methodology not documented');
      });
    });

    describe('PASS - Report passing all gates', () => {
      it('should pass quality gate for rigorous report', () => {
        const report: ResearchReport = {
          title: 'Evidence-Based Analysis of AI Safety',
          methodology: 'Systematic literature review of peer-reviewed sources from 2020-2023',
          claims: [
            {
              statement: 'Alignment research has increased funding',
              confidence: 'high',
              sources: [
                {
                  pmid: '34567890',
                  validated: true,
                  quote: 'Funding for AI safety increased from $10M to $100M',
                },
              ],
            },
          ],
          limitations: [
            'Limited to English-language publications',
            'Data collection ended December 2023',
            'Industry funding may be underreported',
          ],
          conflicts: [
            {
              description: 'Source A reports $100M, Source B reports $80M',
              resolution: 'preserved',
              note: 'Different measurement methodologies',
            },
          ],
          citationsValidated: true,
        };

        const result = validator.runQualityGate(report);
        expect(result.passed).toBe(true);
        expect(result.quality).toBe('excellent');
        expect(result.readyForPublication).toBe(true);
      });

      it('should pass when all claims have verified sources', () => {
        const report: ResearchReport = {
          title: 'Technical Analysis',
          claims: [
            {
              statement: 'Finding 1',
              sources: [{ pmid: '11111', validated: true }],
            },
            {
              statement: 'Finding 2',
              sources: [{ doi: '10.1234/test', validated: true }],
            },
          ],
          citationsValidated: true,
        };

        const result = validator.runQualityGate(report);
        expect(result.passed).toBe(true);
        expect(result.verificationRate).toBe(1.0);
      });

      it('should pass when limitations are specific', () => {
        const report: ResearchReport = {
          title: 'Study Report',
          claims: [
            {
              statement: 'X correlates with Y',
              sources: [{ pmid: '12345', validated: true }],
            },
          ],
          limitations: [
            'Sample size limited to 100 participants',
            'Correlation does not imply causation',
            'Results may not generalize beyond study population',
            'Self-reported data subject to bias',
          ],
        };

        const result = validator.runQualityGate(report);
        expect(result.passed).toBe(true);
        expect(result.limitationsQuality).toBe('specific');
      });

      it('should pass when unknowns explicitly documented', () => {
        const report: ResearchReport = {
          title: 'Preliminary Analysis',
          claims: [
            {
              statement: 'Initial findings suggest X',
              confidence: 'low',
              sources: [{ url: 'example.com', validated: true }],
            },
          ],
          unknowns: [
            'Long-term effects not yet studied',
            'Mechanism of action unclear',
            'Optimal parameters not determined',
          ],
        };

        const result = validator.runQualityGate(report);
        expect(result.passed).toBe(true);
        expect(result.honestyScore).toBe('high');
      });
    });
  });

  describe('Conflict Preservation', () => {
    describe('PASS - Contradicting claims preserved', () => {
      it('should preserve conflicting evidence from different sources', () => {
        const claims = [
          {
            statement: 'Method A is more effective',
            sources: [
              { pmid: '11111', quote: 'Method A showed 80% success rate' },
            ],
          },
          {
            statement: 'Method B is more effective',
            sources: [
              { pmid: '22222', quote: 'Method B showed 85% success rate' },
            ],
          },
        ];

        const result = validator.analyzeConflicts(claims);
        expect(result.hasConflicts).toBe(true);
        expect(result.conflictsPreserved).toBe(true);
        expect(result.synthesis).toContain('Sources disagree');
      });

      it('should document disagreement between sources', () => {
        const claim: ResearchClaim = {
          statement: 'Results vary by study',
          sources: [
            {
              pmid: '11111',
              quote: 'Effect size: 0.8',
              finding: 'positive',
            },
            {
              pmid: '22222',
              quote: 'Effect size: 0.2',
              finding: 'minimal',
            },
            {
              pmid: '33333',
              quote: 'No significant effect detected',
              finding: 'negative',
            },
          ],
        };

        const result = validator.evaluateClaim(claim);
        expect(result.conflictDocumentation).toBeDefined();
        expect(result.conflictDocumentation.sources.length).toBe(3);
        expect(result.conflictDocumentation.synthesisApproach).toBe('preserved');
      });

      it('should accept minority viewpoints in synthesis', () => {
        const analysis: ConflictAnalysis = {
          majorityView: {
            statement: 'X is true',
            supportingSources: 7,
          },
          minorityViews: [
            {
              statement: 'X may not be true in all cases',
              supportingSources: 2,
            },
          ],
          synthesisApproach: 'inclusive',
        };

        const result = validator.validateConflictHandling(analysis);
        expect(result.isValid).toBe(true);
        expect(result.minorityViewsPreserved).toBe(true);
        expect(result.quality).toBe('excellent');
      });

      it('should flag when disagreement is signal of uncertainty', () => {
        const claims = [
          { statement: 'Estimate: 40%', source: 'Agent A' },
          { statement: 'Estimate: 65%', source: 'Agent B' },
          { statement: 'Estimate: 52%', source: 'Agent C' },
        ];

        const result = validator.analyzeMultiAgentDisagreement(claims);
        expect(result.disagreementLevel).toBe('high');
        expect(result.interpretation).toBe('uncertainty-signal');
        expect(result.recommendation).toContain('preserve range');
      });
    });

    describe('FAIL - Conflicts artificially resolved', () => {
      it('should fail when averaging without justification', () => {
        const synthesis = {
          claim: 'Average effectiveness is 50%',
          sources: [
            { value: 30, context: 'Small sample study' },
            { value: 70, context: 'Large RCT' },
          ],
          method: 'arithmetic-mean',
          justification: undefined,
        };

        const result = validator.validateSynthesis(synthesis);
        expect(result.isValid).toBe(false);
        expect(result.issues).toContain('Averaging without justification');
      });

      it('should fail when conflicts smoothed over for consensus', () => {
        const report = {
          originalFindings: [
            'Source A: X is true',
            'Source B: X is false',
            'Source C: X is unknown',
          ],
          synthesis: 'All sources generally agree that X',
        };

        const result = validator.validateConflictResolution(report);
        expect(result.isValid).toBe(false);
        expect(result.issues).toContain('Conflict artificially resolved');
        expect(result.severity).toBe('critical');
      });

      it('should fail when minority views dismissed', () => {
        const analysis = {
          majorityView: 'X is true (8/10 sources)',
          minorityView: 'X is questionable (2/10 sources)',
          treatment: 'dismissed',
          reasoning: 'Majority consensus achieved',
        };

        const result = validator.validateConflictHandling(analysis);
        expect(result.isValid).toBe(false);
        expect(result.issues).toContain('Minority view dismissed without analysis');
      });

      it('should fail when agent disagreement hidden', () => {
        const multiAgentResult = {
          agents: [
            { id: 'A', assessment: 7 },
            { id: 'B', assessment: 3 },
            { id: 'C', assessment: 8 },
          ],
          reported: 'Consensus score: 6',
          individualScoresReported: false,
        };

        const result = validator.validateMultiAgentReporting(multiAgentResult);
        expect(result.isValid).toBe(false);
        expect(result.issues).toContain('Individual agent scores not reported');
        expect(result.transparencyScore).toBe('low');
      });

      it('should fail when forced consensus from independent agents', () => {
        const coordination = {
          agents: ['A', 'B', 'C'],
          independence: 'isolated',
          results: [
            { agent: 'A', finding: 'X' },
            { agent: 'B', finding: 'X' },
            { agent: 'C', finding: 'X' },
          ],
          synthesis: 'Perfect consensus achieved',
        };

        const result = validator.analyzeConsensusAuthenticity(coordination);
        expect(result.suspiciouslyUniform).toBe(true);
        expect(result.warnings).toContain('Independent agents with identical conclusions');
      });
    });
  });

  describe('Real-world Research Scenarios', () => {
    it('should validate medical-grade research report', () => {
      const report: ResearchReport = {
        title: 'Systematic Review: AI in Medical Diagnosis',
        methodology: 'PRISMA guidelines, searched PubMed/Scopus/Web of Science',
        searchCriteria: {
          databases: ['PubMed', 'Scopus'],
          dateRange: '2020-01-01 to 2023-12-31',
          keywords: ['AI', 'diagnosis', 'accuracy'],
          included: 47,
          excluded: 213,
          exclusionReasons: 'Non-peer-reviewed, non-English, case reports',
        },
        claims: [
          {
            statement: 'AI diagnostic accuracy ranges from 72% to 94% across studies',
            confidence: 'high',
            sources: [
              { pmid: '11111', validated: true, accuracy: '94%' },
              { pmid: '22222', validated: true, accuracy: '72%' },
            ],
          },
        ],
        limitations: [
          'Heterogeneity in study designs prevents meta-analysis',
          'Publication bias likely (negative results underreported)',
          'Most studies from high-resource settings',
        ],
        conflicts: [
          {
            description: 'Accuracy varies widely between studies',
            resolution: 'preserved',
            analysis: 'Reflects differences in disease types and datasets',
          },
        ],
        citationsValidated: true,
      };

      const result = validator.runQualityGate(report);
      expect(result.passed).toBe(true);
      expect(result.quality).toBe('excellent');
      expect(result.meetsStandard).toContain('medical-grade');
    });

    it('should catch fabricated research report', () => {
      const report: ResearchReport = {
        title: 'Comprehensive AI Analysis',
        claims: [
          {
            statement: 'Study by Johnson et al. (2023) shows 87% improvement',
            sources: [
              {
                authors: 'Johnson et al.',
                year: '2023',
                title: 'AI Performance Study',
                // No PMID, DOI, or URL
              },
            ],
          },
          {
            statement: 'Another study by Williams et al. (2023) confirms this',
            sources: [
              {
                authors: 'Williams et al.',
                year: '2023',
                title: 'Confirmatory Study',
                // Also no identifier
              },
            ],
          },
        ],
        limitations: 'Further research would be beneficial',
        citationsValidated: false,
      };

      const result = validator.runQualityGate(report);
      expect(result.passed).toBe(false);
      expect(result.fabricationRisk).toBe('high');
      expect(result.failedChecks).toContain('Citations not validated');
      expect(result.failedChecks).toContain('Sources missing verifiable identifiers');
    });
  });

  describe('Factory and convenience functions', () => {
    it('should create validator via factory', () => {
      const validator = createSafetyResearchWorkflow();
      expect(validator).toBeInstanceOf(SafetyResearchWorkflow);
    });

    it('should provide convenience validation function', () => {
      const report: ResearchReport = {
        title: 'Test Report',
        claims: [],
      };
      const result = validateResearch(report);
      expect(result).toBeDefined();
      expect(result.qualityGate).toBeDefined();
    });
  });
});
