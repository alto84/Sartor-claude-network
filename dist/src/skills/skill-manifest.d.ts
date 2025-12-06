/**
 * Skill Manifests - Evidence-Based Skills & Agent Coordination
 *
 * Defines manifests for:
 * - Evidence-Based Validation
 * - Evidence-Based Engineering
 * - Agent Communication System
 * - Multi-Agent Orchestration
 *
 * @version 1.0.0
 * @date 2025-12-06
 */
import { SkillManifest, SkillTier } from '../../skill-types';
/**
 * Evidence-Based Validation Skill
 *
 * Validates claims and decisions using empirical evidence,
 * research data, and quantitative analysis.
 */
export declare const EVIDENCE_BASED_VALIDATION: SkillManifest;
/**
 * Evidence-Based Engineering Skill
 *
 * Applies evidence-based methodology to engineering decisions,
 * ensuring technical choices are grounded in data and research.
 */
export declare const EVIDENCE_BASED_ENGINEERING: SkillManifest;
/**
 * Agent Communication System Skill
 *
 * Handles inter-agent messaging with quality gates,
 * delivery confirmation, and failure recovery.
 */
export declare const AGENT_COMMUNICATION: SkillManifest;
/**
 * Multi-Agent Orchestration Skill
 *
 * Coordinates specialized workers using intent-based delegation
 * with result synthesis and failure recovery.
 */
export declare const MULTI_AGENT_ORCHESTRATION: SkillManifest;
/**
 * MCP Server Development Skill
 *
 * Builds MCP servers with proper patterns, error handling,
 * and protocol compliance.
 */
export declare const MCP_SERVER_DEVELOPMENT: SkillManifest;
/**
 * Distributed Systems Debugging Skill
 *
 * Systematically investigates distributed system failures through
 * evidence-based hypothesis testing and isolation.
 */
export declare const DISTRIBUTED_SYSTEMS_DEBUGGING: SkillManifest;
/**
 * Refinement Loop Skill
 *
 * Core refinement mechanism based on Poetiq's approach.
 * Iteratively refines outputs through generate-evaluate-refine cycles.
 */
export declare const REFINEMENT_LOOP: SkillManifest;
/**
 * Safety Research Workflow Skill (placeholder for export compatibility)
 */
export declare const SAFETY_RESEARCH_WORKFLOW: SkillManifest;
/**
 * Self-Improvement Feedback Mechanism
 *
 * Learns from execution outcomes to extract patterns, refine strategies,
 * and continuously improve performance through lifelong memory.
 */
export declare const SELF_IMPROVEMENT: SkillManifest;
/**
 * Roadmap Skill - Dynamic Implementation Plan Access
 *
 * Provides progressive access to the implementation roadmap,
 * allowing any agent to query "What should I work on?"
 */
export declare const ROADMAP_SKILL: SkillManifest;
/**
 * All skill manifests
 */
export declare const SKILL_MANIFESTS: SkillManifest[];
/**
 * Get manifest by ID
 */
export declare function getSkillManifest(skillId: string): SkillManifest | undefined;
/**
 * Get all skill summaries (Level 1)
 */
export declare function getAllSkillSummaries(): {
    id: string;
    version: string;
    summary: string;
    triggers: import("../../skill-types").TriggerDefinition[];
    tier: SkillTier;
    dependencies: string[];
    estimatedTokens: number;
}[];
//# sourceMappingURL=skill-manifest.d.ts.map