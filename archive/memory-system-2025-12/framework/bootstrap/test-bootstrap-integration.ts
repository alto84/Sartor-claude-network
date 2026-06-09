/**
 * Test script for bootstrap-loader integration with role profiles
 */

import { buildBootstrapPrompt, type AgentRole } from './bootstrap-loader.js';

// Test data
const testRoles: AgentRole[] = ['RESEARCHER', 'IMPLEMENTER', 'VALIDATOR', 'ORCHESTRATOR'];

console.log('=== Bootstrap Integration Test ===\n');

for (const role of testRoles) {
  console.log(`\n### Testing ${role} Bootstrap`);
  console.log('---\n');

  const agentContext = {
    role: role.toLowerCase(),
    requestId: `test-${role.toLowerCase()}-001`,
    parentRequestId: 'orchestrator-main',
    task: {
      objective: `Test ${role} bootstrap prompt generation`,
      context: {
        testMode: true,
        role: role,
        features: ['role-profiles', 'memory-injection', 'skill-loading'],
      },
      requirements: [
        'Generate role-specific context',
        'Include appropriate skills',
        'Load relevant memory topics',
        'Provide role constraints',
      ],
    },
  };

  try {
    const prompt = buildBootstrapPrompt(agentContext);

    // Verify prompt contains role-specific sections
    const checks = {
      hasRoleSection: prompt.includes('## Your Role:'),
      hasExpertise: prompt.includes('### Your Expertise'),
      hasConstraints: prompt.includes('### Your Constraints'),
      hasOutputFormat: prompt.includes('### Expected Output Format'),
      hasMemoryTopics: prompt.includes('### Memory Topics Loaded'),
      hasSkills: prompt.includes('### Skills Available'),
      hasFollowFormat: prompt.includes('following your role\'s output format'),
    };

    console.log('Verification Checks:');
    for (const [check, passed] of Object.entries(checks)) {
      console.log(`  ${check}: ${passed ? '✓ PASS' : '✗ FAIL'}`);
    }

    // Count role-specific mentions
    const roleCount = (prompt.match(new RegExp(role, 'gi')) || []).length;
    console.log(`\nRole mentions in prompt: ${roleCount}`);

    // Check prompt length (should be substantial)
    const lines = prompt.split('\n').length;
    const chars = prompt.length;
    console.log(`Prompt size: ${lines} lines, ${chars} characters`);

    // Verify all checks passed
    const allPassed = Object.values(checks).every(v => v);
    console.log(`\nOverall: ${allPassed ? '✓ SUCCESS' : '✗ FAILURE'}`);

  } catch (error) {
    console.error(`✗ ERROR generating prompt for ${role}:`, error);
  }
}

console.log('\n\n=== Bootstrap Integration Test Complete ===');
