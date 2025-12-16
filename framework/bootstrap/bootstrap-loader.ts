/**
 * Bootstrap Loader - Prepares context injection for spawned agents
 *
 * Combines memory, skills, and mission context into a bootstrap prompt.
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { queryMemory, summarizeMemories } from '../memory/memory-store.js';
import { generateProtocolPrompt, generateCompactProtocol } from './anti-fabrication-injector.js';
import {
  getCurrentMissionState,
  formatMissionStateForPrompt,
  canSpawnAgents,
  loadMissionConfig,
  type MissionState
} from './mission-state.js';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Types
interface BootstrapConfig {
  memory: {
    inject_relevant: boolean;
    max_context_tokens: number;
    topics: string[];
  };
  skills: {
    required: string[];
    optional: string[];
  };
  mission: {
    objective: string;
    constraints: string[];
    success_criteria: string[];
  };
}

interface AgentContext {
  role: string;
  requestId: string;
  parentRequestId?: string;
  task: {
    objective: string;
    context: Record<string, unknown>;
    requirements: string[];
  };
}

// Default paths
const SKILLS_PATH = process.env.SKILLS_PATH || '/home/alton/.claude/skills';
const SWARM_SKILLS_PATH = process.env.SWARM_SKILLS_PATH || '/home/alton/claude-swarm/framework/skills';
const DEFAULT_CONFIG_PATH = join(__dirname, 'bootstrap-config.json');

/**
 * Load bootstrap configuration
 */
export function loadConfig(configPath?: string): BootstrapConfig {
  const path = configPath || DEFAULT_CONFIG_PATH;

  // Default configuration
  const defaultConfig: BootstrapConfig = {
    memory: {
      inject_relevant: true,
      max_context_tokens: 2000,
      topics: ['mission', 'recent_findings', 'patterns'],
    },
    skills: {
      required: ['memory', 'validation'],
      optional: ['research'],
    },
    mission: {
      objective: 'Complete assigned task efficiently',
      constraints: ['Follow anti-fabrication protocols', 'Be evidence-based'],
      success_criteria: ['Task completed', 'No false claims made'],
    },
  };

  if (existsSync(path)) {
    try {
      const fileConfig = JSON.parse(readFileSync(path, 'utf-8'));

      // Map file config structure to expected structure
      return {
        memory: {
          inject_relevant: fileConfig.memory_injection?.enabled ?? defaultConfig.memory.inject_relevant,
          max_context_tokens: fileConfig.memory_injection?.max_tokens ?? defaultConfig.memory.max_context_tokens,
          topics: fileConfig.memory_injection?.topics ?? defaultConfig.memory.topics,
        },
        skills: {
          required: fileConfig.skills_injection?.always_load ?? defaultConfig.skills.required,
          optional: Object.values(fileConfig.skills_injection?.role_based ?? {}).flat() as string[],
        },
        mission: {
          objective: fileConfig.mission?.description ?? defaultConfig.mission.objective,
          constraints: fileConfig.constraints?.anti_fabrication
            ? ['Follow anti-fabrication protocols', 'Be evidence-based']
            : defaultConfig.mission.constraints,
          success_criteria: defaultConfig.mission.success_criteria,
        },
      };
    } catch (e) {
      console.error('Failed to load bootstrap config:', e);
    }
  }

  return defaultConfig;
}

/**
 * Discover available skills
 */
export function discoverSkills(): Map<string, string> {
  const skills = new Map<string, string>();

  // Check user skills directory
  if (existsSync(SKILLS_PATH)) {
    const dirs = readdirSync(SKILLS_PATH, { withFileTypes: true });
    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const skillPath = join(SKILLS_PATH, dir.name);
        const readmePath = join(skillPath, 'README.md');
        const skillMdPath = join(skillPath, 'SKILL.md');

        if (existsSync(readmePath)) {
          skills.set(dir.name, readFileSync(readmePath, 'utf-8').slice(0, 500));
        } else if (existsSync(skillMdPath)) {
          skills.set(dir.name, readFileSync(skillMdPath, 'utf-8').slice(0, 500));
        } else {
          skills.set(dir.name, `Skill: ${dir.name}`);
        }
      }
    }
  }

  // Check swarm skills directory
  if (existsSync(SWARM_SKILLS_PATH)) {
    const files = readdirSync(SWARM_SKILLS_PATH);
    for (const file of files) {
      if (file.endsWith('.md') && file !== 'README.md') {
        const name = basename(file, '.md').toLowerCase();
        const content = readFileSync(join(SWARM_SKILLS_PATH, file), 'utf-8');
        skills.set(name, content.slice(0, 500));
      }
    }
  }

  return skills;
}

/**
 * Get skill descriptions for prompt
 */
export function getSkillDescriptions(skillNames: string[]): string {
  const allSkills = discoverSkills();
  const descriptions: string[] = [];

  for (const name of skillNames) {
    if (allSkills.has(name)) {
      descriptions.push(`### ${name}\n${allSkills.get(name)}`);
    }
  }

  if (descriptions.length === 0) {
    return 'No specific skills loaded.';
  }

  return descriptions.join('\n\n');
}

/**
 * Get relevant memory context
 */
export function getMemoryContext(config: BootstrapConfig): string {
  if (!config.memory.inject_relevant) {
    return '';
  }

  try {
    const summaries: string[] = [];

    for (const topic of config.memory.topics) {
      const summary = summarizeMemories(
        { topic, limit: 10 },
        Math.floor(config.memory.max_context_tokens / config.memory.topics.length)
      );
      if (summary && summary !== 'No relevant memories found.') {
        summaries.push(summary);
      }
    }

    if (summaries.length === 0) {
      return 'No relevant prior memories found.';
    }

    return summaries.join('\n\n');
  } catch (e) {
    return 'Memory system not available.';
  }
}

/**
 * Build full bootstrap prompt
 */
export function buildBootstrapPrompt(
  agentContext: AgentContext,
  config?: BootstrapConfig
): string {
  const cfg = config || loadConfig();

  // Get components
  const memoryContext = getMemoryContext(cfg);
  const skillDescriptions = getSkillDescriptions([
    ...cfg.skills.required,
    ...cfg.skills.optional,
  ]);

  // Get mission state for time-awareness
  const missionConfig = loadMissionConfig();
  const missionState = getCurrentMissionState(missionConfig);
  const missionStateSection = formatMissionStateForPrompt(missionState);

  // Get anti-fabrication protocol for the role
  const antiFabricationSection = generateCompactProtocol(agentContext.role);

  // Build prompt
  return `# Agent Bootstrap

${missionStateSection}

${antiFabricationSection}

## Mission Context
**Objective**: ${cfg.mission.objective}

**Constraints**:
${cfg.mission.constraints.map((c) => `- ${c}`).join('\n')}

**Success Criteria**:
${cfg.mission.success_criteria.map((c) => `- ${c}`).join('\n')}

## Your Role
You are agent "${agentContext.role}" with request ID ${agentContext.requestId}.
${agentContext.parentRequestId ? `Your parent agent is ${agentContext.parentRequestId}.` : 'You are a root-level agent.'}

## Assigned Task
**Objective**: ${agentContext.task.objective}

**Context**:
\`\`\`json
${JSON.stringify(agentContext.task.context, null, 2)}
\`\`\`

**Requirements**:
${agentContext.task.requirements.map((r) => `- ${r}`).join('\n')}

## Prior Knowledge
${memoryContext}

## Available Skills
${skillDescriptions}

## Memory System
You have access to the swarm memory system at \`.swarm/memory/\`:
- **Episodic**: \`.swarm/memory/episodic/{date}.jsonl\` - Event logs
- **Semantic**: \`.swarm/memory/semantic/{topic}.jsonl\` - Knowledge
- **Working**: \`.swarm/memory/working/{agent_id}.jsonl\` - Session state
- **Coordination**: \`.swarm/memory/coordination/messages.jsonl\` - Inter-agent messages

Store important findings in semantic memory for future agents to learn from.

## Environment
- AGENT_ID: ${agentContext.requestId}
- AGENT_TYPE: ${agentContext.role}
- SWARM_MEMORY_PATH: .swarm/memory

---

Now complete your assigned task. Be concise and evidence-based.`;
}

/**
 * CLI interface
 */
// ESM-compatible entry point detection
const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('bootstrap-loader.ts');

if (isMainModule) {
  const args = process.argv.slice(2);

  if (args[0] === 'discover') {
    const skills = discoverSkills();
    console.log('Discovered Skills:');
    for (const [name, desc] of skills) {
      console.log(`\n## ${name}`);
      console.log(desc.slice(0, 200) + '...');
    }
  } else if (args[0] === 'test') {
    const prompt = buildBootstrapPrompt({
      role: 'test-agent',
      requestId: 'req-test-123',
      task: {
        objective: 'Test the bootstrap system',
        context: { test: true },
        requirements: ['Verify bootstrap works'],
      },
    });
    console.log(prompt);
  } else {
    console.log('Usage: bootstrap-loader.ts [discover|test]');
  }
}

export default { loadConfig, discoverSkills, buildBootstrapPrompt };
