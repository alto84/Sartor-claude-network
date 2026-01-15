/**
 * Claude Components Index
 *
 * Re-exports all Claude-related components for easy importing.
 *
 * @module components/claude
 */

// Task Status
export {
  TaskStatus,
  CompactTaskStatus,
  TaskSummary,
} from './task-status';

// Ask Claude
export {
  AskClaude,
  InlineAskClaude,
} from './ask-claude';

// Suggestions
export {
  ClaudeSuggestions,
  InlineSuggestion,
  SuggestionBanner,
  sampleSuggestions,
  type Suggestion,
} from './claude-suggestions';
