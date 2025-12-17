/**
 * Demo script to showcase mission context injection
 */

import {
  getMissionContext,
  getPhaseRestrictions,
  formatMissionContextForPrompt,
  type MissionConfig,
} from './mission-state.js';

console.log('=== Mission Context Injection Demo ===\n');

// Demo 1: Bootstrap phase (early in mission)
console.log('--- Scenario 1: Bootstrap Phase (5% progress, 30h remaining) ---');
const bootstrapConfig: MissionConfig = {
  name: 'demo-bootstrap',
  start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  end_time: new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString(),
  final_report_time: new Date(Date.now() + 29 * 60 * 60 * 1000).toISOString(),
};
const bootstrapContext = getMissionContext(bootstrapConfig);
console.log(formatMissionContextForPrompt(bootstrapContext));
console.log('\n');

// Demo 2: Research phase (25% progress, 20h remaining)
console.log('--- Scenario 2: Research Phase (25% progress, 20h remaining) ---');
const researchConfig: MissionConfig = {
  name: 'demo-research',
  start_time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  end_time: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
  final_report_time: new Date(Date.now() + 19 * 60 * 60 * 1000).toISOString(),
};
const researchContext = getMissionContext(researchConfig);
console.log(formatMissionContextForPrompt(researchContext));
console.log('\n');

// Demo 3: Implementation phase (50% progress, 10h remaining)
console.log('--- Scenario 3: Implementation Phase (50% progress, 10h remaining) ---');
const implementationConfig: MissionConfig = {
  name: 'demo-implementation',
  start_time: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  end_time: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
  final_report_time: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(),
};
const implementationContext = getMissionContext(implementationConfig);
console.log(formatMissionContextForPrompt(implementationContext));
console.log('\n');

// Demo 4: Validation phase (80% progress, 3h remaining - HIGH urgency)
console.log('--- Scenario 4: Validation Phase (80% progress, 3h remaining - HIGH urgency) ---');
const validationConfig: MissionConfig = {
  name: 'demo-validation',
  start_time: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  end_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  final_report_time: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
};
const validationContext = getMissionContext(validationConfig);
console.log(formatMissionContextForPrompt(validationContext));
console.log('\n');

// Demo 5: Reporting phase (95% progress, 30min remaining - CRITICAL)
console.log('--- Scenario 5: Reporting Phase (95% progress, 30min remaining - CRITICAL) ---');
const reportingConfig: MissionConfig = {
  name: 'demo-reporting',
  start_time: new Date(Date.now() - 19 * 60 * 60 * 1000).toISOString(),
  end_time: new Date(Date.now() + 0.5 * 60 * 60 * 1000).toISOString(),
  final_report_time: new Date(Date.now() + 0.4 * 60 * 60 * 1000).toISOString(),
};
const reportingContext = getMissionContext(reportingConfig);
console.log(formatMissionContextForPrompt(reportingContext));
console.log('\n');

// Demo 6: Phase restrictions for all phases
console.log('--- Phase Restrictions Summary ---');
const phases = ['bootstrap', 'research', 'implementation', 'validation', 'reporting'];
phases.forEach((phase) => {
  console.log(`\n${phase.toUpperCase()}:`);
  const restrictions = getPhaseRestrictions(phase);
  restrictions.forEach((r) => console.log(`  - ${r}`));
});

console.log('\n=== Demo Complete ===');
