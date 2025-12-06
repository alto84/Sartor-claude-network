/**
 * Multi-Agent Orchestration Example
 *
 * Demonstrates the Orchestrator-Worker pattern with all delegation patterns.
 */
declare function exampleParallelFanOut(): Promise<import("./multi-agent-orchestration").SynthesizedOutput>;
declare function exampleSerialChain(): Promise<import("./multi-agent-orchestration").SynthesizedOutput>;
declare function exampleCompetitiveExploration(): Promise<import("./multi-agent-orchestration").SynthesizedOutput>;
declare function exampleWorkerAssignment(): import("./multi-agent-orchestration").WorkerAssignment | null;
declare function exampleConflictPreservation(): Promise<import("./multi-agent-orchestration").SynthesizedOutput>;
declare function exampleWorkerFailure(): Promise<import("./multi-agent-orchestration").RecoveryAction>;
declare function exampleOrchestratorStatus(): Promise<{
    orchestratorId: string;
    activeWorkers: number;
    queuedTasks: number;
    completedTasks: number;
    workers: import("./multi-agent-orchestration").WorkerStatus[];
}>;
declare function runAllExamples(): Promise<void>;
export { exampleParallelFanOut, exampleSerialChain, exampleCompetitiveExploration, exampleWorkerAssignment, exampleConflictPreservation, exampleWorkerFailure, exampleOrchestratorStatus, runAllExamples, };
//# sourceMappingURL=multi-agent-orchestration.example.d.ts.map