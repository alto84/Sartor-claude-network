/**
 * Mission State Tracker - Timeline awareness and progress tracking
 *
 * Provides agents with mission progress, phase detection, urgency levels,
 * and deadline warnings. Based on BOOTSTRAP_IMPROVEMENTS.md research.
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Types
export interface MissionState {
  mission_id: string;
  current_time: string;
  timeline: {
    start_time: string;
    end_time: string;
    final_report_time: string;
    elapsed_hours: number;
    remaining_hours: number;
    progress_percentage: number;
  };
  phase: {
    current: 'bootstrap' | 'research' | 'implementation' | 'validation' | 'reporting' | 'complete';
    allowed_operations: string[];
    restrictions: string[];
  };
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  should_spawn_agents: boolean;
  warnings: string[];
}

/**
 * Simplified mission context for agent bootstrap
 */
export interface MissionContext {
  phase: 'bootstrap' | 'research' | 'implementation' | 'validation' | 'reporting';
  deadline: string;
  progressPercent: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  restrictions: string[];
  checkpoints: string[];
  warnings: string[];
}

export interface MissionConfig {
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  final_report_time: string;
}

interface BootstrapConfigFile {
  mission?: MissionConfig;
  constraints?: {
    check_time_before_spawn?: boolean;
    final_report_cutoff?: string;
  };
}

const DEFAULT_CONFIG_PATH = join(__dirname, 'bootstrap-config.json');

/**
 * Load mission configuration from bootstrap-config.json
 */
export function loadMissionConfig(configPath?: string): MissionConfig | null {
  const path = configPath || DEFAULT_CONFIG_PATH;

  if (!existsSync(path)) {
    return null;
  }

  try {
    const config: BootstrapConfigFile = JSON.parse(readFileSync(path, 'utf-8'));
    return config.mission || null;
  } catch (e) {
    console.error('Failed to load mission config:', e);
    return null;
  }
}

/**
 * Determine current phase based on progress percentage
 */
function determinePhase(
  progressPercentage: number
): MissionState['phase'] {
  if (progressPercentage < 10) {
    return {
      current: 'bootstrap',
      allowed_operations: ['setup', 'validation', 'skill_loading', 'memory_init'],
      restrictions: ['No final reports', 'No premature conclusions', 'Focus on initialization'],
    };
  } else if (progressPercentage < 40) {
    return {
      current: 'research',
      allowed_operations: ['web_search', 'documentation', 'analysis', 'exploration'],
      restrictions: ['Limited implementation', 'Focus on evidence gathering'],
    };
  } else if (progressPercentage < 70) {
    return {
      current: 'implementation',
      allowed_operations: ['coding', 'testing', 'integration', 'bug_fixes'],
      restrictions: ['Must have tests', 'Must validate changes'],
    };
  } else if (progressPercentage < 90) {
    return {
      current: 'validation',
      allowed_operations: ['testing', 'validation', 'bug_fixing', 'cleanup'],
      restrictions: ['No new features', 'Focus on quality and stability'],
    };
  } else if (progressPercentage < 100) {
    return {
      current: 'reporting',
      allowed_operations: ['documentation', 'final_report', 'consolidation'],
      restrictions: ['No agent spawning', 'Consolidation only'],
    };
  } else {
    return {
      current: 'complete',
      allowed_operations: [],
      restrictions: ['Mission ended - no further actions'],
    };
  }
}

/**
 * Calculate urgency level based on remaining time and current phase
 */
function calculateUrgency(
  remainingHours: number,
  currentPhase: MissionState['phase']['current']
): MissionState['urgency_level'] {
  // Critical if less than 1 hour or in reporting phase with limited time
  if (remainingHours < 1) return 'critical';
  if (remainingHours < 2 && currentPhase === 'reporting') return 'critical';

  // High if less than 3 hours
  if (remainingHours < 3) return 'high';

  // Medium if less than 6 hours
  if (remainingHours < 6) return 'medium';

  return 'low';
}

/**
 * Calculate urgency based on time to deadline (simplified for MissionContext)
 * - >24h remaining: low
 * - 12-24h: medium
 * - 4-12h: high
 * - <4h: critical
 */
function calculateUrgencyFromDeadline(remainingHours: number): 'low' | 'medium' | 'high' | 'critical' {
  if (remainingHours < 4) return 'critical';
  if (remainingHours < 12) return 'high';
  if (remainingHours < 24) return 'medium';
  return 'low';
}

/**
 * Generate time-based warnings
 */
function generateTimeWarnings(
  now: Date,
  finalReportTime: Date,
  endTime: Date,
  shouldSpawn: boolean
): string[] {
  const warnings: string[] = [];

  const minutesUntilReport = (finalReportTime.getTime() - now.getTime()) / (1000 * 60);
  const minutesUntilEnd = (endTime.getTime() - now.getTime()) / (1000 * 60);

  // Check if past report deadline
  if (!shouldSpawn) {
    warnings.push('CRITICAL: Past final report deadline - DO NOT spawn new agents');
  } else if (minutesUntilReport < 15) {
    warnings.push('CRITICAL: Less than 15 minutes until final report deadline - wrap up immediately');
  } else if (minutesUntilReport < 30) {
    warnings.push('WARNING: Less than 30 minutes until final report deadline');
  } else if (minutesUntilReport < 60) {
    warnings.push('NOTICE: Less than 1 hour until final report deadline');
  }

  // Check mission end
  if (minutesUntilEnd < 30) {
    warnings.push('CRITICAL: Less than 30 minutes until mission end');
  } else if (minutesUntilEnd < 60) {
    warnings.push('WARNING: Less than 1 hour until mission end');
  }

  // Check if past mission end
  if (now > endTime) {
    warnings.push('CRITICAL: Mission deadline has passed');
  }

  return warnings;
}

/**
 * Get current mission state with timeline analysis
 */
export function getCurrentMissionState(
  missionConfig?: MissionConfig | null,
  currentTime?: Date
): MissionState {
  const now = currentTime || new Date();
  const config = missionConfig || loadMissionConfig();

  // Default state if no config
  if (!config) {
    return {
      mission_id: 'unknown',
      current_time: now.toISOString(),
      timeline: {
        start_time: now.toISOString(),
        end_time: now.toISOString(),
        final_report_time: now.toISOString(),
        elapsed_hours: 0,
        remaining_hours: 0,
        progress_percentage: 0,
      },
      phase: {
        current: 'bootstrap',
        allowed_operations: ['all'],
        restrictions: ['No mission config - operating in default mode'],
      },
      urgency_level: 'low',
      should_spawn_agents: true,
      warnings: ['No mission configuration found - using defaults'],
    };
  }

  const startTime = new Date(config.start_time);
  const endTime = new Date(config.end_time);
  const finalReportTime = new Date(config.final_report_time);

  const elapsedMs = now.getTime() - startTime.getTime();
  const totalMs = endTime.getTime() - startTime.getTime();
  const remainingMs = endTime.getTime() - now.getTime();

  const elapsedHours = Math.max(0, elapsedMs / (1000 * 60 * 60));
  const remainingHours = Math.max(0, remainingMs / (1000 * 60 * 60));
  const progressPercentage = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));

  // Determine current phase
  const phase = determinePhase(progressPercentage);

  // Check if we should still spawn agents
  const shouldSpawn = now < finalReportTime;

  // Calculate urgency
  const urgency = calculateUrgency(remainingHours, phase.current);

  // Generate warnings
  const warnings = generateTimeWarnings(now, finalReportTime, endTime, shouldSpawn);

  return {
    mission_id: config.name,
    current_time: now.toISOString(),
    timeline: {
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      final_report_time: finalReportTime.toISOString(),
      elapsed_hours: Math.round(elapsedHours * 10) / 10,
      remaining_hours: Math.round(remainingHours * 10) / 10,
      progress_percentage: Math.round(progressPercentage * 10) / 10,
    },
    phase,
    urgency_level: urgency,
    should_spawn_agents: shouldSpawn,
    warnings,
  };
}

/**
 * Format mission state for bootstrap prompt injection
 */
export function formatMissionStateForPrompt(state: MissionState): string {
  const urgencyEmoji = {
    low: '',
    medium: '',
    high: '! ',
    critical: '!! ',
  };

  let prompt = `## Mission State

**Mission**: ${state.mission_id}
**Current Time**: ${state.current_time}

### Timeline
- Started: ${state.timeline.start_time}
- Ends: ${state.timeline.end_time}
- Final Report Due: ${state.timeline.final_report_time}
- Elapsed: ${state.timeline.elapsed_hours}h
- Remaining: ${state.timeline.remaining_hours}h
- Progress: ${state.timeline.progress_percentage}%

### Current Phase: ${urgencyEmoji[state.urgency_level]}${state.phase.current.toUpperCase()}
**Allowed operations**:
${state.phase.allowed_operations.map(op => `- ${op}`).join('\n')}

**Restrictions**:
${state.phase.restrictions.map(r => `- ${r}`).join('\n')}

### Urgency Level: ${state.urgency_level.toUpperCase()}`;

  if (state.warnings.length > 0) {
    prompt += `

### WARNINGS
${state.warnings.map(w => `- ${w}`).join('\n')}`;
  }

  prompt += `

**Agent Spawning**: ${state.should_spawn_agents ? 'ALLOWED' : 'FORBIDDEN'}`;

  return prompt;
}

/**
 * Check if spawning new agents is allowed
 */
export function canSpawnAgents(missionConfig?: MissionConfig | null): boolean {
  const state = getCurrentMissionState(missionConfig);
  return state.should_spawn_agents;
}

/**
 * Get time until final report deadline in minutes
 */
export function getMinutesUntilReportDeadline(missionConfig?: MissionConfig | null): number {
  const config = missionConfig || loadMissionConfig();
  if (!config) return Infinity;

  const now = new Date();
  const finalReportTime = new Date(config.final_report_time);
  return (finalReportTime.getTime() - now.getTime()) / (1000 * 60);
}

/**
 * Get phase-specific restrictions
 *
 * Phase-based restrictions:
 * - bootstrap: Full access, learning mode
 * - research: Read-only, must cite sources
 * - implementation: Can edit, must test
 * - validation: Run tests, no fabrication
 * - reporting: No new changes, synthesis only
 */
export function getPhaseRestrictions(phase: string): string[] {
  switch (phase) {
    case 'bootstrap':
      return [
        'Full access granted - learning mode',
        'Focus on initialization and setup',
        'No premature conclusions',
      ];
    case 'research':
      return [
        'Read-only mode - no code changes',
        'Must cite sources for all claims',
        'Evidence gathering only',
        'No implementation during research phase',
      ];
    case 'implementation':
      return [
        'Can edit code and create files',
        'Must write tests for all changes',
        'Must validate changes work correctly',
        'No untested code allowed',
      ];
    case 'validation':
      return [
        'Run tests and verify correctness',
        'No fabrication of test results',
        'No new features - bug fixes only',
        'Focus on quality and stability',
      ];
    case 'reporting':
      return [
        'No new code changes allowed',
        'Synthesis and documentation only',
        'No agent spawning',
        'Consolidation mode',
      ];
    default:
      return ['Unknown phase - proceed with caution'];
  }
}

/**
 * Generate checkpoints based on current phase and progress
 */
function generateCheckpoints(
  phase: string,
  progressPercent: number,
  remainingHours: number
): string[] {
  const checkpoints: string[] = [];

  switch (phase) {
    case 'bootstrap':
      checkpoints.push('Load mission configuration');
      checkpoints.push('Initialize memory systems');
      checkpoints.push('Validate agent capabilities');
      break;
    case 'research':
      checkpoints.push('Gather all relevant sources');
      checkpoints.push('Document evidence and citations');
      checkpoints.push('Identify implementation requirements');
      break;
    case 'implementation':
      checkpoints.push('Write implementation code');
      checkpoints.push('Create test coverage');
      checkpoints.push('Verify all tests pass');
      break;
    case 'validation':
      checkpoints.push('Run full test suite');
      checkpoints.push('Fix any identified bugs');
      checkpoints.push('Verify performance metrics');
      break;
    case 'reporting':
      checkpoints.push('Consolidate all findings');
      checkpoints.push('Generate final report');
      checkpoints.push('Archive artifacts');
      break;
  }

  // Add time-based checkpoints
  if (remainingHours < 1) {
    checkpoints.push('URGENT: Wrap up immediately');
  } else if (remainingHours < 4) {
    checkpoints.push('Begin transition to reporting phase');
  }

  return checkpoints;
}

/**
 * Get simplified mission context for agent bootstrap
 */
export function getMissionContext(
  missionConfig?: MissionConfig | null,
  currentTime?: Date
): MissionContext {
  const state = getCurrentMissionState(missionConfig, currentTime);

  // Handle 'complete' phase by mapping to 'reporting'
  const contextPhase = state.phase.current === 'complete'
    ? 'reporting'
    : state.phase.current;

  // Calculate urgency based on deadline
  const urgency = calculateUrgencyFromDeadline(state.timeline.remaining_hours);

  // Get phase restrictions
  const restrictions = getPhaseRestrictions(contextPhase);

  // Generate checkpoints
  const checkpoints = generateCheckpoints(
    contextPhase,
    state.timeline.progress_percentage,
    state.timeline.remaining_hours
  );

  // Add phase transition warnings
  const warnings = [...state.warnings];
  if (state.timeline.progress_percentage >= 70 && contextPhase !== 'validation' && contextPhase !== 'reporting') {
    warnings.push('Approaching validation phase - prepare for testing');
  }
  if (state.timeline.progress_percentage >= 90 && contextPhase !== 'reporting') {
    warnings.push('Approaching reporting phase - begin wrapping up');
  }

  return {
    phase: contextPhase,
    deadline: state.timeline.end_time,
    progressPercent: state.timeline.progress_percentage,
    urgency,
    restrictions,
    checkpoints,
    warnings,
  };
}

/**
 * Format mission context for prompt injection
 */
export function formatMissionContextForPrompt(context: MissionContext): string {
  const urgencyIndicator = {
    low: '',
    medium: '[MODERATE URGENCY] ',
    high: '[HIGH URGENCY] ',
    critical: '[CRITICAL URGENCY] ',
  };

  let prompt = `## Mission Context

${urgencyIndicator[context.urgency]}**Phase**: ${context.phase.toUpperCase()}
**Deadline**: ${context.deadline}
**Progress**: ${context.progressPercent.toFixed(1)}%
**Urgency Level**: ${context.urgency.toUpperCase()}

### Phase Restrictions
${context.restrictions.map(r => `- ${r}`).join('\n')}

### Checkpoints
${context.checkpoints.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;

  if (context.warnings.length > 0) {
    prompt += `

### WARNINGS
${context.warnings.map(w => `- ${w}`).join('\n')}`;
  }

  return prompt;
}

// CLI interface
const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('mission-state.ts');

if (isMainModule) {
  const args = process.argv.slice(2);

  if (args[0] === 'status') {
    const state = getCurrentMissionState();
    console.log('=== Mission State ===\n');
    console.log(formatMissionStateForPrompt(state));
  } else if (args[0] === 'context') {
    const context = getMissionContext();
    console.log('=== Mission Context ===\n');
    console.log(formatMissionContextForPrompt(context));
  } else if (args[0] === 'can-spawn') {
    const canSpawn = canSpawnAgents();
    console.log(`Agent spawning allowed: ${canSpawn}`);
    process.exit(canSpawn ? 0 : 1);
  } else if (args[0] === 'time-left') {
    const minutes = getMinutesUntilReportDeadline();
    console.log(`Minutes until report deadline: ${Math.round(minutes)}`);
  } else if (args[0] === 'json') {
    const state = getCurrentMissionState();
    console.log(JSON.stringify(state, null, 2));
  } else if (args[0] === 'context-json') {
    const context = getMissionContext();
    console.log(JSON.stringify(context, null, 2));
  } else {
    console.log('Usage: mission-state.ts [status|context|can-spawn|time-left|json|context-json]');
    console.log('');
    console.log('Commands:');
    console.log('  status       - Show formatted mission state');
    console.log('  context      - Show formatted mission context (simplified)');
    console.log('  can-spawn    - Check if agent spawning is allowed (exit code 0=yes, 1=no)');
    console.log('  time-left    - Show minutes until report deadline');
    console.log('  json         - Output raw mission state as JSON');
    console.log('  context-json - Output mission context as JSON');
  }
}

export default {
  getCurrentMissionState,
  formatMissionStateForPrompt,
  getMissionContext,
  formatMissionContextForPrompt,
  getPhaseRestrictions,
  canSpawnAgents,
  getMinutesUntilReportDeadline,
  loadMissionConfig,
};
