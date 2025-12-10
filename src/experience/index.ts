/**
 * Experience Enhancement Module
 *
 * Provides intelligent context discovery, relevance filtering, and
 * adaptive learning capabilities for the subagent system.
 */

// Auto-Discovery
export {
  ContextDiscoverer,
  createContextDiscoverer,
  getGlobalDiscoverer,
  resetGlobalDiscoverer,
  discoverContext,
  DiscoverySource,
  ConfidenceLevel,
  ContextType,
  type DiscoveredContext,
  type DiscoveryQuery,
  type DiscoveryOptions,
} from './auto-discover';

// Relevance Filtering
export {
  RelevanceFilter,
  createRelevanceFilter,
  getGlobalFilter,
  resetGlobalFilter,
  createKeywordFilter,
  createRecencyFilter,
  createPreferenceFilter,
  calculateKeywordMatch,
  calculateSemanticSimilarity,
  calculateProximity,
  calculateAuthority,
  RelevanceSignal,
  type ScoredItem,
  type SignalScore,
  type RelevanceConfig,
  type SignalWeight,
  type BoostFactor,
  type PenaltyFactor,
  type RelevanceContext,
} from './relevance';

// Adaptive Intelligence
export {
  AdaptiveIntelligence,
  createIntelligence,
  getGlobalIntelligence,
  resetGlobalIntelligence,
  predictTaskSuccess,
  recordTaskOutcome,
  LearningEvent,
  PatternType,
  type TaskOutcome,
  type TaskContext,
  type LearnedPattern,
  type PatternTrigger,
  type PatternOutcome,
  type Strategy,
  type StrategyAction,
  type Prediction,
  type PredictionFactor,
  type IntelligenceConfig,
} from './intelligence';
