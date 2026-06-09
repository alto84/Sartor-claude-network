/**
 * Test script for role-profiles implementation
 */

import {
  getRoleProfile,
  buildRoleContext,
  getRoleMemoryTopics,
  getRoleSkills,
  validateTaskForRole,
  type AgentRole,
} from './role-profiles.js';

// Test all four roles
const roles: AgentRole[] = ['RESEARCHER', 'IMPLEMENTER', 'VALIDATOR', 'ORCHESTRATOR'];

console.log('=== Role Profiles Test ===\n');

for (const role of roles) {
  console.log(`\n### Testing Role: ${role}`);
  console.log('---');

  const profile = getRoleProfile(role);
  console.log(`Persona: ${profile.persona.substring(0, 100)}...`);
  console.log(`Expertise Areas: ${profile.expertise.length}`);
  console.log(`Constraints: ${profile.constraints.length}`);
  console.log(`Memory Topics: ${profile.memoryTopics.join(', ')}`);
  console.log(`Skills: ${profile.skills.join(', ')}`);

  // Test task validation
  const testTasks = {
    RESEARCHER: 'Find all implementations of the Memory interface',
    IMPLEMENTER: 'Create a new validation function for role profiles',
    VALIDATOR: 'Run tests and verify the role-profiles implementation',
    ORCHESTRATOR: 'Coordinate multiple agents to complete the framework',
  };

  const validation = validateTaskForRole(role, testTasks[role]);
  console.log(`\nTask Validation: ${validation.appropriate ? 'PASS' : 'FAIL'}`);
  console.log(`Reasoning: ${validation.reasoning}`);
}

// Test role context building
console.log('\n\n=== Role Context Sample ===\n');
const implementerProfile = getRoleProfile('IMPLEMENTER');
const context = buildRoleContext(implementerProfile);
console.log(context.substring(0, 500) + '...\n');

// Test invalid role handling
console.log('\n=== Invalid Role Test ===');
const unknownProfile = getRoleProfile('UNKNOWN_ROLE');
console.log(`Unknown role defaults to: ${unknownProfile.role}`);

console.log('\n=== All Tests Complete ===');
