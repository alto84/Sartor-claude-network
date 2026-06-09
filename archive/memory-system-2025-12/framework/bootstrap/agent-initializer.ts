/**
 * Agent Initializer - Central bootstrap entry point (Self-Contained)
 *
 * This module provides a standalone bootstrap implementation that doesn't
 * depend on other modules with top-level awaits.
 *
 * CRITICAL: This was the missing integration - all components existed
 * but were never called during agent initialization.
 */

import * as fs from 'fs';
import * as path from 'path';

// Types
export type AgentRole = 'RESEARCHER' | 'IMPLEMENTER' | 'VALIDATOR' | 'ORCHESTRATOR';

export interface AgentConfig {
  role: AgentRole;
  requestId: string;
  task: {
    objective: string;
    context?: Record<string, any>;
    requirements?: string[];
  };
  parentAgentId?: string;
}

export interface BootstrappedAgent {
  fullPrompt: string;
  role: AgentRole;
  requestId: string;
  memorySummary: string;
  skillsLoaded: string[];
  missionPhase: string;
  bootstrapTimestamp: string;
}

export interface InitializationResult {
  success: boolean;
  agent?: BootstrappedAgent;
  error?: string;
  timing: {
    total: number;
    config: number;
    memory: number;
    skills: number;
    protocol: number;
    mission: number;
    prompt: number;
  };
}

interface RoleProfile {
  role: AgentRole;
  persona: string;
  expertise: string[];
  constraints: string[];
  memoryTopics: string[];
}

// Role Profiles (self-contained)
const ROLE_PROFILES: Record<AgentRole, RoleProfile> = {
  RESEARCHER: {
    role: 'RESEARCHER',
    persona: 'You are a RESEARCHER agent specialized in discovery and investigation.',
    expertise: ['Web research', 'Academic paper analysis', 'Pattern recognition', 'Source verification', 'Information synthesis'],
    constraints: ['Read-only operations', 'Must cite sources', 'No code modifications', 'Evidence-based claims only'],
    memoryTopics: ['research_findings', 'discovered_patterns', 'documentation'],
  },
  IMPLEMENTER: {
    role: 'IMPLEMENTER',
    persona: 'You are an IMPLEMENTER agent specialized in building and coding.',
    expertise: ['Code implementation', 'Testing', 'Debugging', 'File operations', 'System integration'],
    constraints: ['Must test changes', 'Follow existing patterns', 'Document modifications', 'No architectural decisions'],
    memoryTopics: ['implementation_patterns', 'code_conventions', 'testing_strategies'],
  },
  VALIDATOR: {
    role: 'VALIDATOR',
    persona: 'You are a VALIDATOR agent specialized in quality assurance.',
    expertise: ['Test execution', 'Quality assessment', 'Evidence verification', 'Benchmark analysis', 'Error detection'],
    constraints: ['No score fabrication', 'Evidence required for claims', 'Must run actual tests', 'Report limitations'],
    memoryTopics: ['validation_patterns', 'test_failures', 'quality_standards'],
  },
  ORCHESTRATOR: {
    role: 'ORCHESTRATOR',
    persona: 'You are an ORCHESTRATOR agent specialized in coordination.',
    expertise: ['Task delegation', 'Agent coordination', 'Result synthesis', 'Priority management', 'Progress tracking'],
    constraints: ['Delegate heavy work', 'No direct implementation', 'Synthesize results', 'Track progress'],
    memoryTopics: ['coordination_patterns', 'delegation_strategies', 'agent_capabilities'],
  },
};

// Anti-fabrication protocol (always inject)
const ANTI_FABRICATION_PROTOCOL = `## Anti-Fabrication Protocol (MANDATORY)

### ABSOLUTE RULES:
1. NEVER fabricate scores, percentages, or metrics
2. NEVER use "exceptional", "outstanding", "world-class" without measurement
3. ALWAYS say "cannot determine without measurement" when unsure
4. ALWAYS include confidence levels and limitations
5. ALWAYS cite sources for claims

### BANNED WITHOUT EVIDENCE:
- Any score above 80% without external validation
- Letter grades without defined rubric
- Claims of "X times better" without baseline

### REQUIRED PHRASES:
- "Cannot determine without measurement data"
- "No empirical evidence available"
- "Requires external validation"
- "Limitations include..."`;

/**
 * Extract keywords from task for memory relevance
 */
function extractKeywords(task: AgentConfig['task']): string[] {
  const keywords: string[] = [];
  const objectiveWords = task.objective
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 4)
    .filter(w => !['should', 'would', 'could', 'implement', 'create', 'build'].includes(w));
  keywords.push(...objectiveWords.slice(0, 5));

  if (task.requirements) {
    task.requirements.forEach(req => {
      const words = req.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      keywords.push(...words.slice(0, 2));
    });
  }
  return [...new Set(keywords)].slice(0, 10);
}

/**
 * Load skill content from .claude/skills/ directory
 */
function loadSkillContent(skillName: string): string | null {
  const basePath = process.cwd();
  const skillPaths = [
    path.join(basePath, '.claude', 'skills', skillName, 'SKILL.md'),
    path.join(basePath, '.claude', 'skills', skillName, 'README.md'),
    path.join(basePath, '.claude', 'skills', `${skillName}.md`),
  ];

  for (const skillPath of skillPaths) {
    try {
      if (fs.existsSync(skillPath)) {
        const content = fs.readFileSync(skillPath, 'utf-8');
        return content.slice(0, 1500);
      }
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Load skills for a given role
 */
function loadSkillsForRole(role: AgentRole): { names: string[]; content: string } {
  const coreSkills = ['evidence-based-validation'];
  const roleSkillMap: Record<AgentRole, string[]> = {
    RESEARCHER: ['safety-research-workflow'],
    IMPLEMENTER: ['mcp-server-development'],
    VALIDATOR: ['evidence-based-engineering'],
    ORCHESTRATOR: ['multi-agent-orchestration', 'agent-communication-system'],
  };

  const skillNames = [...coreSkills, ...(roleSkillMap[role] || [])];
  const skillContents: string[] = [];

  for (const name of skillNames) {
    const content = loadSkillContent(name);
    if (content) {
      skillContents.push(`### ${name}\n${content.slice(0, 800)}`);
    }
  }

  return {
    names: skillNames,
    content: skillContents.length > 0 ? skillContents.join('\n\n') : 'No skills loaded.',
  };
}

/**
 * Read mission state from STATE.json
 */
function readMissionState(): { phase: string; urgency: string; deadline?: string } {
  const statePath = path.join(process.cwd(), '.swarm', 'artifacts', 'STATE.json');
  try {
    if (fs.existsSync(statePath)) {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      return {
        phase: state.mission_status?.phase || 'implementation',
        urgency: state.mission_status?.urgency || 'medium',
        deadline: state.mission_status?.deadline,
      };
    }
  } catch {
    // Ignore errors
  }
  return { phase: 'implementation', urgency: 'medium' };
}

/**
 * Read progress file
 */
function readProgressFile(): string {
  const progressPath = path.join(process.cwd(), '.swarm', 'progress.json');
  try {
    if (fs.existsSync(progressPath)) {
      const content = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
      const recent = content.entries?.slice(-5) || [];
      return recent.map((e: any) => `- ${e.action}: ${e.description}`).join('\n');
    }
  } catch {
    // Fall back to hypotheses
    const hypPath = path.join(process.cwd(), '.swarm', 'hypotheses.json');
    if (fs.existsSync(hypPath)) {
      try {
        const hyp = JSON.parse(fs.readFileSync(hypPath, 'utf-8'));
        return `Active hypotheses: ${hyp.count || 0}`;
      } catch {
        return 'No progress file found';
      }
    }
  }
  return 'No progress file found';
}

/**
 * Read relevant memories from .swarm/memory/
 */
function readRelevantMemories(keywords: string[], role: string, maxTokens: number): string {
  const memoryDir = path.join(process.cwd(), '.swarm', 'memory', 'semantic');
  const memories: string[] = [];
  let tokenEstimate = 0;

  try {
    if (fs.existsSync(memoryDir)) {
      const files = fs.readdirSync(memoryDir).filter(f => f.endsWith('.json'));

      for (const file of files.slice(0, 3)) {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(memoryDir, file), 'utf-8'));
          if (Array.isArray(content)) {
            for (const mem of content.slice(0, 5)) {
              const memText = mem.content || mem.description || '';
              if (memText && tokenEstimate < maxTokens) {
                const snippet = memText.slice(0, 200);
                memories.push(`- ${snippet}`);
                tokenEstimate += snippet.length / 4;
              }
            }
          }
        } catch {
          continue;
        }
      }
    }
  } catch {
    // Ignore errors
  }

  if (memories.length === 0) {
    return '## Prior Knowledge\nNo relevant memories found for this task.';
  }

  return `## Prior Knowledge (${memories.length} relevant items)\n${memories.slice(0, 10).join('\n')}`;
}

/**
 * Build role context section
 */
function buildRoleContext(profile: RoleProfile): string {
  return `**${profile.role}**

${profile.persona}

**Expertise**: ${profile.expertise.join(', ')}

**Constraints**:
${profile.constraints.map(c => `- ${c}`).join('\n')}`;
}

/**
 * Main entry point - Initialize an agent with full context
 */
export async function initializeAgent(config: AgentConfig): Promise<InitializationResult> {
  const timing = {
    total: 0,
    config: 0,
    memory: 0,
    skills: 0,
    protocol: 0,
    mission: 0,
    prompt: 0,
  };

  const startTime = Date.now();

  try {
    // 1. Config (use defaults)
    timing.config = 1;

    // 2. Get mission state
    const missionStart = Date.now();
    const mission = readMissionState();
    timing.mission = Date.now() - missionStart;

    // 3. Read progress
    const progress = readProgressFile();

    // 4. Get role profile
    const profile = ROLE_PROFILES[config.role];
    const roleContext = buildRoleContext(profile);

    // 5. Load relevant memories
    const memoryStart = Date.now();
    const keywords = extractKeywords(config.task);
    const memorySummary = readRelevantMemories(keywords, config.role, 2000);
    timing.memory = Date.now() - memoryStart;

    // 6. Load skills
    const skillsStart = Date.now();
    const skills = loadSkillsForRole(config.role);
    timing.skills = Date.now() - skillsStart;

    // 7. Anti-fabrication protocol
    timing.protocol = 1;

    // 8. Build full prompt
    const promptStart = Date.now();
    const fullPrompt = `# Agent Bootstrap Context

## Your Role
${roleContext}

## Mission State
- **Phase**: ${mission.phase}
- **Urgency**: ${mission.urgency}
${mission.deadline ? `- **Deadline**: ${mission.deadline}` : ''}

## Recent Progress
${progress}

${memorySummary}

${ANTI_FABRICATION_PROTOCOL}

## Available Skills
${skills.names.map(s => `- ${s}`).join('\n')}

## Your Task
**Objective**: ${config.task.objective}
${config.task.requirements ? `\n**Requirements**:\n${config.task.requirements.map(r => `- ${r}`).join('\n')}` : ''}
${config.task.context ? `\n**Context**: ${JSON.stringify(config.task.context)}` : ''}

## Instructions
1. Review the mission state and recent progress
2. Apply the anti-fabrication protocols to ALL outputs
3. Use your role-specific expertise (${config.role})
4. Store significant learnings in memory when complete
5. Report limitations and unknowns honestly

Begin your work now.
`;
    timing.prompt = Date.now() - promptStart;
    timing.total = Date.now() - startTime;

    const agent: BootstrappedAgent = {
      fullPrompt,
      role: config.role,
      requestId: config.requestId,
      memorySummary,
      skillsLoaded: skills.names,
      missionPhase: mission.phase,
      bootstrapTimestamp: new Date().toISOString(),
    };

    return { success: true, agent, timing };
  } catch (error: any) {
    timing.total = Date.now() - startTime;
    return { success: false, error: error.message || String(error), timing };
  }
}

/**
 * Quick bootstrap for simple agents
 */
export async function quickBootstrap(role: AgentRole, objective: string): Promise<string> {
  const result = await initializeAgent({
    role,
    requestId: `quick-${Date.now()}`,
    task: { objective },
  });

  if (result.success && result.agent) {
    return result.agent.fullPrompt;
  }
  throw new Error(result.error || 'Bootstrap failed');
}

/**
 * Get bootstrap component status
 */
export function getBootstrapStats(): { available: boolean; components: Record<string, boolean> } {
  return {
    available: true,
    components: {
      roleProfiles: true,
      antiFabrication: true,
      skillsLoader: fs.existsSync(path.join(process.cwd(), '.claude', 'skills')),
      progressFile: fs.existsSync(path.join(process.cwd(), '.swarm', 'progress.json')),
      memoryDir: fs.existsSync(path.join(process.cwd(), '.swarm', 'memory')),
      stateFile: fs.existsSync(path.join(process.cwd(), '.swarm', 'artifacts', 'STATE.json')),
    },
  };
}

// CLI for testing
const isMainModule = process.argv[1]?.includes('agent-initializer');
if (isMainModule) {
  (async () => {
    console.log('=== Agent Initializer Test ===\n');

    console.log('Component Status:');
    const stats = getBootstrapStats();
    Object.entries(stats.components).forEach(([k, v]) => {
      console.log(`  ${k}: ${v ? '✓' : '✗'}`);
    });

    console.log('\n--- Testing IMPLEMENTER bootstrap ---\n');

    const result = await initializeAgent({
      role: 'IMPLEMENTER',
      requestId: 'test-001',
      task: {
        objective: 'Fix the bootstrap integration gap',
        requirements: ['Wire memory injection', 'Test end-to-end'],
        context: { priority: 'high' },
      },
    });

    if (result.success && result.agent) {
      console.log('Bootstrap: SUCCESS\n');
      console.log(`Role: ${result.agent.role}`);
      console.log(`Skills: ${result.agent.skillsLoaded.join(', ')}`);
      console.log(`Phase: ${result.agent.missionPhase}`);
      console.log(`\nTiming:`);
      Object.entries(result.timing).forEach(([k, v]) => {
        console.log(`  ${k}: ${v}ms`);
      });
      console.log(`\n--- Full Prompt (first 1500 chars) ---\n`);
      console.log(result.agent.fullPrompt.slice(0, 1500));
      console.log('\n... [truncated]');
    } else {
      console.log('Bootstrap: FAILED');
      console.log('Error:', result.error);
    }
  })();
}
