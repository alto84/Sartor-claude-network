/**
 * Coordination Module
 *
 * Provides work distribution, plan synchronization, and progress tracking
 * for multi-agent coordination in the Sartor-Claude-Network.
 *
 * @module coordination
 */

// Work Distribution
export {
  WorkDistributor,
  createDistributor,
  getGlobalDistributor,
  resetGlobalDistributor,
  TaskStatus,
  TaskPriority,
  type Task,
  type ClaimResult,
  type TaskFilter,
  type WorkDistributionStats,
  type AssignmentRecommendation,
} from './work-distribution';

// Plan Synchronization
export {
  PlanSyncService,
  CRDTPlanItem,
  createPlanSyncService,
  getGlobalPlanSync,
  resetGlobalPlanSync,
  PlanItemStatus,
  PlanItemPriority,
  PlanOperationType,
  SyncStatus,
  type PlanItem,
  type Plan,
  type PlanOperation,
  type PlanSnapshot,
  type PlanSyncStats,
} from './plan-sync';

// Progress Reporting
export {
  ProgressTracker,
  createProgressTracker,
  getGlobalProgressTracker,
  resetGlobalProgressTracker,
  reportProgress,
  createMilestone,
  ProgressStatus,
  MilestoneStatus,
  type ProgressEntry,
  type Milestone,
  type ProgressSummary,
  type AgentProgressSummary,
  type ReportProgressOptions,
  type ProgressStats,
} from './progress';
