/**
 * Subagent Module
 *
 * Provides subagent bootstrapping, registration, and messaging capabilities
 * for multi-agent coordination in the Sartor-Claude-Network.
 *
 * @module subagent
 */

// Bootstrap
export {
  SubagentBootstrap,
  createBootstrapService,
  quickBootstrap,
  fullBootstrap,
  OnboardingDepth,
  AgentRole,
  type AgentCapability,
  type BootstrapSkill,
  type BootstrapMemory,
  type BootstrapPlanItem,
  type ActivePlan,
  type MasterPlan,
  type BootstrapRelationship,
  type SessionContext,
  type SubagentContext,
  type BootstrapOptions,
  type OnboardingPayload,
} from './bootstrap';

// Registry
export {
  SubagentRegistry,
  createRegistry,
  getGlobalRegistry,
  resetGlobalRegistry,
  registerAgent,
  discoverPeers,
  sendHeartbeat,
  AgentStatus,
  type RegisteredAgent,
  type RegistrationOptions,
  type DiscoveryFilter,
  type HeartbeatResponse,
  type RegistryStats,
} from './registry';

// Messaging
export {
  AgentMessageBus,
  createMessageBus,
  getGlobalMessageBus,
  resetGlobalMessageBus,
  sendMessage,
  broadcast,
  publish,
  MessagePriority,
  MessageType,
  DeliveryStatus,
  type AgentMessage,
  type MessageEnvelope,
  type SendOptions,
  type TopicSubscription,
  type MessageHandler,
  type RequestHandler,
  type MessagingStats,
} from './messaging';
