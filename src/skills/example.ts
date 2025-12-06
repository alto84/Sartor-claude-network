/**
 * Skill Runtime Example
 *
 * Demonstrates how to use the SkillRuntime to load and execute skills.
 *
 * @version 1.0.0
 * @date 2025-12-06
 */

import { SkillRuntime } from './skill-runtime';
import {
  EVIDENCE_BASED_VALIDATION,
  EVIDENCE_BASED_ENGINEERING
} from './skill-manifest';

/**
 * Example: Initialize and use the skill runtime
 */
async function example() {
  // Create runtime instance
  const runtime = new SkillRuntime();

  // Initialize runtime
  await runtime.initialize();

  // Register skills
  await runtime.registerSkill(EVIDENCE_BASED_VALIDATION);
  await runtime.registerSkill(EVIDENCE_BASED_ENGINEERING);

  console.log('\n=== Skill Runtime Initialized ===');
  console.log('Available skills:', runtime.listSkills().map(s => s.id));

  // Example 1: Execute Evidence-Based Validation
  console.log('\n=== Example 1: Evidence-Based Validation ===');

  const validationInput = {
    claim: 'TypeScript reduces bugs by 15% compared to JavaScript',
    context: 'Considering TypeScript adoption for our project',
    evidenceLevel: 'high'
  };

  const validationResult = await runtime.executeSkill(
    'evidence-based-validation',
    validationInput
  );

  console.log('Validation Result:', {
    success: validationResult.success,
    confidence: validationResult.data?.confidence,
    duration: validationResult.metrics.durationMs + 'ms'
  });

  // Example 2: Execute Evidence-Based Engineering
  console.log('\n=== Example 2: Evidence-Based Engineering ===');

  const engineeringInput = {
    problem: 'Choose database for real-time collaborative editor',
    requirements: {
      realTime: true,
      scale: '10k concurrent users',
      consistency: 'eventual ok'
    },
    alternatives: ['Firebase RTDB', 'Firestore', 'MongoDB', 'PostgreSQL']
  };

  const engineeringResult = await runtime.executeSkill(
    'evidence-based-engineering',
    engineeringInput
  );

  console.log('Engineering Result:', {
    success: engineeringResult.success,
    recommendation: engineeringResult.data?.recommendation,
    duration: engineeringResult.metrics.durationMs + 'ms'
  });

  // Check runtime statistics
  console.log('\n=== Runtime Statistics ===');
  console.log(runtime.getStatistics());

  // Get skill status
  console.log('\n=== Skill Status ===');
  console.log('Validation:', runtime.getSkillStatus('evidence-based-validation'));
  console.log('Engineering:', runtime.getSkillStatus('evidence-based-engineering'));
}

// Run example if executed directly
if (require.main === module) {
  example()
    .then(() => {
      console.log('\n=== Example completed successfully ===');
      process.exit(0);
    })
    .catch(error => {
      console.error('Example failed:', error);
      process.exit(1);
    });
}

export { example };
