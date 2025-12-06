"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoadmapManager = void 0;
exports.getRoadmapManager = getRoadmapManager;
exports.getCurrentPhase = getCurrentPhase;
exports.getNextTasks = getNextTasks;
exports.updateTaskStatus = updateTaskStatus;
exports.getRoadmapSummary = getRoadmapSummary;
exports.getRoadmapSummaryObject = getRoadmapSummaryObject;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// ============================================================================
// Roadmap Data - Parsed from IMPLEMENTATION_ORDER.md
// ============================================================================
const ROADMAP_PHASES = [
    {
        id: 'phase-0',
        name: 'Bootstrap Quality Infrastructure',
        status: 'completed',
        duration: '1-2 days',
        objective: 'Install quality enforcement before writing any production code',
        dependencies: [],
        entryConditions: [
            'Git repository initialized',
            'Claude Code CLI available',
            'Project structure defined',
            'Research documentation complete'
        ],
        exitConditions: [
            'All hooks executable and tested',
            'Hooks successfully block bad commits',
            'Test infrastructure runs successfully',
            'Quality standards documented and agreed upon',
            'Team can explain quality philosophy'
        ],
        tasks: []
    },
    {
        id: 'phase-1',
        name: 'Foundation Skills Implementation',
        status: 'completed',
        duration: '3-5 days',
        objective: 'Implement Level 0 + Level 1 skills that validate all future work',
        dependencies: ['phase-0'],
        entryConditions: [
            'Phase 0 complete (hooks active)',
            'Test infrastructure functional',
            'Quality standards defined'
        ],
        exitConditions: [
            'Evidence-Based Validation skill fully implemented and tested',
            'Evidence-Based Engineering skill fully implemented and tested',
            'Skills successfully validate each other',
            'All tests pass with 85%+ coverage',
            'Skills used to validate their own implementation',
            'Documentation complete with examples'
        ],
        tasks: []
    },
    {
        id: 'phase-2',
        name: 'Infrastructure Skills Implementation',
        status: 'completed',
        duration: '5-7 days',
        objective: 'Build communication and orchestration capabilities (Level 1-2 skills)',
        dependencies: ['phase-1'],
        entryConditions: [
            'Phase 1 complete (foundation skills active)',
            'Foundation skills successfully validate test cases',
            'Team confident in Evidence-Based Validation'
        ],
        exitConditions: [
            'Agent Communication System fully implemented and tested',
            'Multi-Agent Orchestration fully implemented and tested',
            'Integration tests demonstrate skills working together',
            'Documentation includes workflow diagrams',
            'Performance benchmarks established',
            'All tests pass with 85%+ coverage'
        ],
        tasks: []
    },
    {
        id: 'phase-3',
        name: 'Application Skills Implementation',
        status: 'completed',
        duration: '5-7 days',
        objective: 'Implement Level 3 specialized skills in parallel',
        dependencies: ['phase-2'],
        entryConditions: [
            'Phase 2 complete (infrastructure skills active)',
            'Orchestration successfully coordinates test agents',
            'Communication system proven reliable'
        ],
        exitConditions: [
            'All three tracks complete and tested',
            'Each skill passes foundation validation',
            'Integration test orchestrates all skills successfully',
            'Documentation complete for each skill',
            'Performance benchmarks recorded',
            'All tests pass with 85%+ coverage'
        ],
        tasks: []
    },
    {
        id: 'phase-4',
        name: 'Memory System Implementation',
        status: 'pending',
        duration: '2-3 weeks',
        objective: 'Implement tiered memory architecture validated by all skills',
        dependencies: ['phase-1', 'phase-2', 'phase-3'],
        entryConditions: [
            'Phases 1-3 complete (all skills operational)',
            'Skills successfully orchestrated in integration tests',
            'Firebase project created and configured',
            'Vector database selected and provisioned'
        ],
        exitConditions: [
            'All three tiers implemented and tested',
            'Data flows correctly between tiers',
            'Query interface works across all tiers',
            'Automatic archival working',
            'Performance meets requirements (<100ms hot, <500ms warm, <2s cold)',
            'All tests pass with 85%+ coverage',
            'Validated by all 7 skills'
        ],
        tasks: []
    },
    {
        id: 'phase-5',
        name: 'Integration and Self-Improvement',
        status: 'pending',
        duration: '1-2 weeks',
        objective: 'Integrate all components and activate self-improvement loops',
        dependencies: ['phase-4'],
        entryConditions: [
            'All skills operational (Phase 1-3)',
            'Memory system complete (Phase 4)',
            'System integration tests passing',
            'Performance benchmarks established'
        ],
        exitConditions: [
            'Skills integrated with memory system',
            'Executive Claude operational',
            'Self-improvement loop functional',
            'All end-to-end tests passing',
            'Performance meets requirements',
            'Self-improvement successfully improves system',
            'All components validated by foundation skills',
            'Documentation complete'
        ],
        tasks: []
    }
];
// Define specific tasks for each phase
const ROADMAP_TASKS = [
    // Phase 4 Tasks
    {
        id: 'task-4-1',
        phaseId: 'phase-4',
        description: 'Implement Hot Tier (Firebase Realtime Database) - Active agent state storage',
        status: 'pending',
        priority: 1,
        estimatedHours: 40
    },
    {
        id: 'task-4-2',
        phaseId: 'phase-4',
        description: 'Implement Warm Tier (Firestore + Vector Database) - Conversation history and semantic search',
        status: 'pending',
        priority: 2,
        estimatedHours: 60
    },
    {
        id: 'task-4-3',
        phaseId: 'phase-4',
        description: 'Implement Cold Tier (GitHub Storage) - Long-term knowledge storage',
        status: 'pending',
        priority: 3,
        estimatedHours: 40
    },
    {
        id: 'task-4-4',
        phaseId: 'phase-4',
        description: 'Create memory system integration tests - Test data flow Hot → Warm → Cold',
        status: 'pending',
        priority: 4,
        estimatedHours: 20
    },
    // Phase 5 Tasks
    {
        id: 'task-5-1',
        phaseId: 'phase-5',
        description: 'Integrate skills with memory system - Enable skills to query and store in memory',
        status: 'pending',
        priority: 1,
        estimatedHours: 30
    },
    {
        id: 'task-5-2',
        phaseId: 'phase-5',
        description: 'Implement Executive Claude orchestration - Task decomposition and skill selection',
        status: 'pending',
        priority: 2,
        estimatedHours: 40
    },
    {
        id: 'task-5-3',
        phaseId: 'phase-5',
        description: 'Activate self-improvement loop - Performance monitoring and pattern extraction',
        status: 'pending',
        priority: 3,
        estimatedHours: 50
    },
    {
        id: 'task-5-4',
        phaseId: 'phase-5',
        description: 'Create end-to-end system tests - Full workflow validation',
        status: 'pending',
        priority: 4,
        estimatedHours: 30
    }
];
// ============================================================================
// Roadmap Manager Class
// ============================================================================
class RoadmapManager {
    constructor(stateFilePath) {
        this.stateFilePath = stateFilePath || path.join(process.cwd(), '.claude', 'roadmap-state.json');
        this.state = this.loadState();
    }
    /**
     * Load roadmap state from file or initialize default state
     */
    loadState() {
        try {
            if (fs.existsSync(this.stateFilePath)) {
                const data = fs.readFileSync(this.stateFilePath, 'utf-8');
                const parsed = JSON.parse(data);
                // Convert arrays to Maps
                return {
                    currentPhase: parsed.currentPhase,
                    phases: new Map(Object.entries(parsed.phases || {})),
                    tasks: new Map(Object.entries(parsed.tasks || {})),
                    lastUpdated: parsed.lastUpdated
                };
            }
        }
        catch (error) {
            console.warn('Could not load roadmap state, initializing default state');
        }
        // Initialize default state
        return this.initializeDefaultState();
    }
    /**
     * Initialize default roadmap state from ROADMAP_PHASES and ROADMAP_TASKS
     */
    initializeDefaultState() {
        const phasesMap = new Map();
        const tasksMap = new Map();
        // Add phases
        for (const phase of ROADMAP_PHASES) {
            phasesMap.set(phase.id, { ...phase, tasks: [] });
        }
        // Add tasks and link to phases
        for (const task of ROADMAP_TASKS) {
            tasksMap.set(task.id, { ...task });
            const phase = phasesMap.get(task.phaseId);
            if (phase) {
                phase.tasks.push({ ...task });
            }
        }
        // Determine current phase (first non-completed phase)
        let currentPhase = 'phase-4';
        for (const phase of ROADMAP_PHASES) {
            if (phase.status !== 'completed') {
                currentPhase = phase.id;
                break;
            }
        }
        return {
            currentPhase,
            phases: phasesMap,
            tasks: tasksMap,
            lastUpdated: new Date().toISOString()
        };
    }
    /**
     * Save roadmap state to file
     */
    saveState() {
        try {
            const dir = path.dirname(this.stateFilePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const data = {
                currentPhase: this.state.currentPhase,
                phases: Object.fromEntries(this.state.phases),
                tasks: Object.fromEntries(this.state.tasks),
                lastUpdated: new Date().toISOString()
            };
            fs.writeFileSync(this.stateFilePath, JSON.stringify(data, null, 2), 'utf-8');
        }
        catch (error) {
            console.error('Failed to save roadmap state:', error);
        }
    }
    /**
     * Get the current phase
     */
    getCurrentPhase() {
        const phase = this.state.phases.get(this.state.currentPhase);
        return phase || null;
    }
    /**
     * Get all phases
     */
    getAllPhases() {
        return Array.from(this.state.phases.values());
    }
    /**
     * Get next tasks to work on (up to 5 highest priority pending tasks)
     */
    getNextTasks(limit = 5) {
        const currentPhase = this.getCurrentPhase();
        if (!currentPhase) {
            return [];
        }
        // Get pending tasks from current phase
        const pendingTasks = currentPhase.tasks
            .filter(task => task.status === 'pending')
            .sort((a, b) => (a.priority || 999) - (b.priority || 999))
            .slice(0, limit);
        return pendingTasks;
    }
    /**
     * Get tasks currently in progress
     */
    getInProgressTasks() {
        const tasks = [];
        for (const task of this.state.tasks.values()) {
            if (task.status === 'in_progress') {
                tasks.push(task);
            }
        }
        return tasks;
    }
    /**
     * Update task status
     */
    updateTaskStatus(taskId, status, assignedAgent) {
        const task = this.state.tasks.get(taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }
        task.status = status;
        if (assignedAgent !== undefined) {
            task.assignedAgent = assignedAgent;
        }
        // Update task in phase
        const phase = this.state.phases.get(task.phaseId);
        if (phase) {
            const phaseTask = phase.tasks.find(t => t.id === taskId);
            if (phaseTask) {
                phaseTask.status = status;
                if (assignedAgent !== undefined) {
                    phaseTask.assignedAgent = assignedAgent;
                }
            }
            // Check if phase is complete
            this.checkPhaseCompletion(task.phaseId);
        }
        this.state.lastUpdated = new Date().toISOString();
        this.saveState();
    }
    /**
     * Check if a phase is complete and update status
     */
    checkPhaseCompletion(phaseId) {
        const phase = this.state.phases.get(phaseId);
        if (!phase)
            return;
        const allTasksCompleted = phase.tasks.every(task => task.status === 'completed');
        if (allTasksCompleted && phase.status !== 'completed') {
            phase.status = 'completed';
            // Move to next phase if available
            const phaseIndex = ROADMAP_PHASES.findIndex(p => p.id === phaseId);
            if (phaseIndex >= 0 && phaseIndex < ROADMAP_PHASES.length - 1) {
                const nextPhase = ROADMAP_PHASES[phaseIndex + 1];
                this.state.currentPhase = nextPhase.id;
                const nextPhaseObj = this.state.phases.get(nextPhase.id);
                if (nextPhaseObj && nextPhaseObj.status === 'pending') {
                    nextPhaseObj.status = 'in_progress';
                }
            }
        }
    }
    /**
     * Get a quick roadmap summary (~100 tokens for agent context)
     */
    getRoadmapSummary() {
        const currentPhase = this.getCurrentPhase();
        if (!currentPhase) {
            return 'No active phase found.';
        }
        const totalTasks = Array.from(this.state.tasks.values()).length;
        const completedTasks = Array.from(this.state.tasks.values())
            .filter(t => t.status === 'completed').length;
        const progressPct = Math.round((completedTasks / totalTasks) * 100);
        const nextTasks = this.getNextTasks(3);
        const inProgressTasks = this.getInProgressTasks();
        let summary = `📍 Current: ${currentPhase.name} (${currentPhase.status})\n`;
        summary += `📊 Progress: ${completedTasks}/${totalTasks} tasks (${progressPct}%)\n`;
        summary += `🎯 Objective: ${currentPhase.objective}\n\n`;
        if (inProgressTasks.length > 0) {
            summary += `⚡ In Progress (${inProgressTasks.length}):\n`;
            inProgressTasks.forEach(task => {
                const agent = task.assignedAgent ? ` [${task.assignedAgent}]` : '';
                summary += `  • ${task.description}${agent}\n`;
            });
            summary += '\n';
        }
        if (nextTasks.length > 0) {
            summary += `🔜 Next Tasks:\n`;
            nextTasks.forEach((task, idx) => {
                summary += `  ${idx + 1}. ${task.description}\n`;
            });
        }
        else {
            summary += `✅ All tasks in current phase completed!\n`;
        }
        return summary;
    }
    /**
     * Get detailed roadmap summary object
     */
    getRoadmapSummaryObject() {
        const currentPhase = this.getCurrentPhase();
        const totalTasks = Array.from(this.state.tasks.values()).length;
        const completedTasks = Array.from(this.state.tasks.values())
            .filter(t => t.status === 'completed').length;
        const blockers = [];
        if (currentPhase) {
            // Check entry conditions
            const unmetConditions = currentPhase.entryConditions.filter(condition => !this.isConditionMet(condition));
            blockers.push(...unmetConditions);
        }
        return {
            currentPhase: this.state.currentPhase,
            currentPhaseName: currentPhase?.name || 'Unknown',
            nextTasks: this.getNextTasks(),
            completedTasks,
            totalTasks,
            progressPercentage: Math.round((completedTasks / totalTasks) * 100),
            blockers
        };
    }
    /**
     * Check if a condition is met (simplified - can be enhanced)
     */
    isConditionMet(_condition) {
        // For now, assume all conditions are met unless explicitly tracked
        // This can be enhanced to check actual system state
        return true;
    }
    /**
     * Get all tasks for a specific phase
     */
    getPhaseTasksTask(phaseId) {
        const phase = this.state.phases.get(phaseId);
        return phase ? phase.tasks : [];
    }
    /**
     * Add a new task to a phase
     */
    addTask(task) {
        this.state.tasks.set(task.id, task);
        const phase = this.state.phases.get(task.phaseId);
        if (phase) {
            phase.tasks.push(task);
        }
        this.state.lastUpdated = new Date().toISOString();
        this.saveState();
    }
    /**
     * Increment refinement loops for a task
     */
    incrementRefinementLoops(taskId) {
        const task = this.state.tasks.get(taskId);
        if (task) {
            task.refinementLoops = (task.refinementLoops || 0) + 1;
            this.state.lastUpdated = new Date().toISOString();
            this.saveState();
        }
    }
}
exports.RoadmapManager = RoadmapManager;
// ============================================================================
// Convenience Functions
// ============================================================================
let defaultManager = null;
/**
 * Get or create the default roadmap manager instance
 */
function getRoadmapManager() {
    if (!defaultManager) {
        defaultManager = new RoadmapManager();
    }
    return defaultManager;
}
/**
 * Get the current phase
 */
function getCurrentPhase() {
    return getRoadmapManager().getCurrentPhase();
}
/**
 * Get next tasks to work on
 */
function getNextTasks(limit) {
    return getRoadmapManager().getNextTasks(limit);
}
/**
 * Update task status
 */
function updateTaskStatus(taskId, status, assignedAgent) {
    getRoadmapManager().updateTaskStatus(taskId, status, assignedAgent);
}
/**
 * Get roadmap summary for agent context
 */
function getRoadmapSummary() {
    return getRoadmapManager().getRoadmapSummary();
}
/**
 * Get detailed roadmap summary object
 */
function getRoadmapSummaryObject() {
    return getRoadmapManager().getRoadmapSummaryObject();
}
// ============================================================================
// Default Export
// ============================================================================
exports.default = {
    RoadmapManager,
    getRoadmapManager,
    getCurrentPhase,
    getNextTasks,
    updateTaskStatus,
    getRoadmapSummary,
    getRoadmapSummaryObject
};
//# sourceMappingURL=roadmap-skill.js.map