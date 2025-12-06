"use strict";
/**
 * Type definitions for the Memory Importance Scoring and Decay System
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryEvent = exports.MemoryStatus = exports.MemoryType = void 0;
// ============================================================================
// Core Memory Types
// ============================================================================
var MemoryType;
(function (MemoryType) {
    MemoryType["EPISODIC"] = "episodic";
    MemoryType["SEMANTIC"] = "semantic";
    MemoryType["PROCEDURAL"] = "procedural";
    MemoryType["EMOTIONAL"] = "emotional";
    MemoryType["SYSTEM"] = "system"; // System configuration and metadata
})(MemoryType || (exports.MemoryType = MemoryType = {}));
var MemoryStatus;
(function (MemoryStatus) {
    MemoryStatus["ACTIVE"] = "active";
    MemoryStatus["ARCHIVED"] = "archived";
    MemoryStatus["DELETED"] = "deleted";
})(MemoryStatus || (exports.MemoryStatus = MemoryStatus = {}));
// ============================================================================
// Event Types
// ============================================================================
var MemoryEvent;
(function (MemoryEvent) {
    MemoryEvent["CREATED"] = "memory.created";
    MemoryEvent["UPDATED"] = "memory.updated";
    MemoryEvent["ACCESSED"] = "memory.accessed";
    MemoryEvent["CONSOLIDATED"] = "memory.consolidated";
    MemoryEvent["ARCHIVED"] = "memory.archived";
    MemoryEvent["DELETED"] = "memory.deleted";
    MemoryEvent["STRENGTHENED"] = "memory.strengthened";
    MemoryEvent["DECAYED"] = "memory.decayed";
})(MemoryEvent || (exports.MemoryEvent = MemoryEvent = {}));
//# sourceMappingURL=types.js.map