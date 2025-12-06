/**
 * Roadmap Skill - Dynamic Implementation Plan Access
 *
 * Enables any agent to query "What should I work on?" by providing
 * progressive access to the implementation roadmap with automatic
 * progress tracking.
 *
 * @version 1.0.0
 * @date 2025-12-06
 */
export interface RoadmapPhase {
    id: string;
    name: string;
    status: 'pending' | 'in_progress' | 'completed';
    tasks: RoadmapTask[];
    dependencies: string[];
    entryConditions: string[];
    exitConditions: string[];
    duration?: string;
    objective?: string;
}
export interface RoadmapTask {
    id: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    assignedAgent?: string;
    refinementLoops?: number;
    phaseId: string;
    priority?: number;
    estimatedHours?: number;
}
export interface RoadmapState {
    currentPhase: string;
    phases: Map<string, RoadmapPhase>;
    tasks: Map<string, RoadmapTask>;
    lastUpdated: string;
}
export interface RoadmapSummary {
    currentPhase: string;
    currentPhaseName: string;
    nextTasks: RoadmapTask[];
    completedTasks: number;
    totalTasks: number;
    progressPercentage: number;
    blockers: string[];
}
export declare class RoadmapManager {
    private state;
    private stateFilePath;
    constructor(stateFilePath?: string);
    /**
     * Load roadmap state from file or initialize default state
     */
    private loadState;
    /**
     * Initialize default roadmap state from ROADMAP_PHASES and ROADMAP_TASKS
     */
    private initializeDefaultState;
    /**
     * Save roadmap state to file
     */
    private saveState;
    /**
     * Get the current phase
     */
    getCurrentPhase(): RoadmapPhase | null;
    /**
     * Get all phases
     */
    getAllPhases(): RoadmapPhase[];
    /**
     * Get next tasks to work on (up to 5 highest priority pending tasks)
     */
    getNextTasks(limit?: number): RoadmapTask[];
    /**
     * Get tasks currently in progress
     */
    getInProgressTasks(): RoadmapTask[];
    /**
     * Update task status
     */
    updateTaskStatus(taskId: string, status: 'pending' | 'in_progress' | 'completed', assignedAgent?: string): void;
    /**
     * Check if a phase is complete and update status
     */
    private checkPhaseCompletion;
    /**
     * Get a quick roadmap summary (~100 tokens for agent context)
     */
    getRoadmapSummary(): string;
    /**
     * Get detailed roadmap summary object
     */
    getRoadmapSummaryObject(): RoadmapSummary;
    /**
     * Check if a condition is met (simplified - can be enhanced)
     */
    private isConditionMet;
    /**
     * Get all tasks for a specific phase
     */
    getPhaseTasksTask(phaseId: string): RoadmapTask[];
    /**
     * Add a new task to a phase
     */
    addTask(task: RoadmapTask): void;
    /**
     * Increment refinement loops for a task
     */
    incrementRefinementLoops(taskId: string): void;
}
/**
 * Get or create the default roadmap manager instance
 */
export declare function getRoadmapManager(): RoadmapManager;
/**
 * Get the current phase
 */
export declare function getCurrentPhase(): RoadmapPhase | null;
/**
 * Get next tasks to work on
 */
export declare function getNextTasks(limit?: number): RoadmapTask[];
/**
 * Update task status
 */
export declare function updateTaskStatus(taskId: string, status: 'pending' | 'in_progress' | 'completed', assignedAgent?: string): void;
/**
 * Get roadmap summary for agent context
 */
export declare function getRoadmapSummary(): string;
/**
 * Get detailed roadmap summary object
 */
export declare function getRoadmapSummaryObject(): RoadmapSummary;
declare const _default: {
    RoadmapManager: typeof RoadmapManager;
    getRoadmapManager: typeof getRoadmapManager;
    getCurrentPhase: typeof getCurrentPhase;
    getNextTasks: typeof getNextTasks;
    updateTaskStatus: typeof updateTaskStatus;
    getRoadmapSummary: typeof getRoadmapSummary;
    getRoadmapSummaryObject: typeof getRoadmapSummaryObject;
};
export default _default;
//# sourceMappingURL=roadmap-skill.d.ts.map