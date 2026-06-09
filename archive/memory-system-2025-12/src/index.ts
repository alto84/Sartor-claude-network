/**
 * Claude Memory System - Main Entry Point
 *
 * Multi-tier episodic memory with refinement-powered executive orchestration.
 */

// Memory System
export { MemorySystem, type Memory } from './memory/memory-system';
export { MemoryService } from './memory/memory-service';
export { MemoryType, MemoryStatus } from './memory/memory-schema';

// Memory Tiers
export type { HotTier } from './memory/hot-tier';
export type { WarmTier } from './memory/warm-tier';
export type { ColdTier } from './memory/cold-tier';

// Executive System
export { ExecutiveClaude, createExecutive, AgentRole } from './executive';
export { SelfImprovingLoop, createSelfImprovingLoop } from './executive';
export { LearningPipeline, createLearningPipeline } from './executive';

// Integration
export { RefinementMemoryBridge, createBridge } from './integration';

// Subagent System
export * from './subagent';

// Coordination System
export * from './coordination';

// Experience Enhancement
export * from './experience';

// Version
export const VERSION = '1.0.0';
