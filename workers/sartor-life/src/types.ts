/**
 * Sartor Life MCP Gateway - Type Definitions
 */

// Environment bindings
export interface Env {
  // KV Namespaces
  VAULT_KV: KVNamespace;
  MEMORY_KV: KVNamespace;
  CHAT_KV: KVNamespace;
  RATE_LIMIT_KV: KVNamespace;

  // Auth tokens (secrets)
  AUTH_TOKEN_ENZO: string;
  AUTH_TOKEN_ALESSIA: string;
  AUTH_TOKEN_NADIA: string;
  AUTH_TOKEN_ADMIN: string;
  ENCRYPTION_KEY?: string;

  // Environment variables
  ENVIRONMENT: string;
  MAX_REQUESTS_PER_MINUTE: string;
  MAX_VAULT_ITEMS: string;
  MAX_MEMORY_ITEMS: string;
}

// Family member types
export type FamilyMemberRole = 'parent' | 'child' | 'admin';

export interface FamilyMember {
  id: string;
  name: string;
  role: FamilyMemberRole;
  permissions: Permission[];
}

export type Permission =
  | 'vault:read'
  | 'vault:write'
  | 'vault:delete'
  | 'memory:read'
  | 'memory:write'
  | 'memory:delete'
  | 'chat:read'
  | 'chat:write'
  | 'dashboard:read'
  | 'dashboard:write'
  | 'family:read'
  | 'admin:all';

// Auth context
export interface AuthContext {
  member: FamilyMember;
  tokenType: 'bearer';
  isValid: boolean;
}

// Vault types
export interface VaultItem {
  id: string;
  category: VaultCategory;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPrivate: boolean;
  sharedWith?: string[];
}

export type VaultCategory =
  | 'recipe'
  | 'health'
  | 'education'
  | 'finance'
  | 'document'
  | 'tradition'
  | 'memory'
  | 'contact'
  | 'note'
  | 'other';

// Memory types
export interface MemoryItem {
  id: string;
  type: MemoryType;
  content: string;
  context?: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  relatedMemories?: string[];
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
}

export type MemoryType =
  | 'fact'
  | 'preference'
  | 'event'
  | 'reminder'
  | 'learning'
  | 'interaction'
  | 'system';

// Chat types
export interface ChatMessage {
  id: string;
  from: string;
  to: string | 'dashboard' | 'all';
  content: string;
  type: 'text' | 'alert' | 'reminder' | 'notification';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  readBy: string[];
  expiresAt?: string;
}

// Dashboard types
export interface DashboardSummary {
  date: string;
  familyMember: string;
  weather?: WeatherInfo;
  calendar: CalendarEvent[];
  tasks: Task[];
  reminders: Reminder[];
  recentVaultItems: VaultItem[];
  unreadMessages: number;
  highlights: string[];
}

export interface WeatherInfo {
  location: string;
  temperature: number;
  condition: string;
  forecast: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  duration?: number;
  location?: string;
  attendees?: string[];
}

export interface Task {
  id: string;
  title: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string;
}

export interface Reminder {
  id: string;
  message: string;
  triggerTime: string;
  recurring?: string;
}

// MCP Protocol types
export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    timestamp: string;
    requestId: string;
    member?: string;
  };
}

// Rate limiting
export interface RateLimitInfo {
  remaining: number;
  reset: number;
  limit: number;
}
