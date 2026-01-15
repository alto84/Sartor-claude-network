/**
 * Solar Inference Server API
 *
 * Types, mock data, and API helpers for GPU server management.
 * This file provides the foundation for monitoring and controlling
 * home GPU servers rented on Vast.ai.
 *
 * @module lib/server-api
 */

// ============================================================================
// TYPES
// ============================================================================

export interface GPUInfo {
  model: string;
  vram: number; // in GB
  vramUsed: number; // in GB
  utilization: number; // percentage 0-100
  temperature: number; // Celsius
  power: number; // Watts
  maxPower: number; // Watts
  fanSpeed: number; // percentage 0-100
  driverVersion: string;
  cudaVersion: string;
}

export interface NetworkInfo {
  uploadSpeed: number; // Mbps
  downloadSpeed: number; // Mbps
  latency: number; // ms
  publicIp: string;
  vastaiVerified: boolean;
  lastSpeedTest: Date;
}

export interface DiskInfo {
  total: number; // GB
  used: number; // GB
  available: number; // GB
  readSpeed: number; // MB/s
  writeSpeed: number; // MB/s
}

export interface MemoryInfo {
  total: number; // GB
  used: number; // GB
  available: number; // GB
  swapTotal: number; // GB
  swapUsed: number; // GB
}

export interface VastaiRentalInfo {
  isRented: boolean;
  rentalId?: string;
  renterUsername?: string;
  startedAt?: Date;
  hourlyRate: number; // $/hr
  totalEarnings: number; // $ today
  weeklyEarnings: number;
  monthlyEarnings: number;
  uptimePercentage: number;
  totalRentals: number;
  averageRentalDuration: number; // hours
}

export interface OllamaStatus {
  running: boolean;
  version?: string;
  modelsLoaded: string[];
  activeRequests: number;
  totalRequests: number;
}

export interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error' | 'starting';
  port?: number;
  uptime?: string;
  memory?: number; // MB
  cpu?: number; // percentage
}

export type ServerStatus = 'online' | 'offline' | 'rented' | 'maintenance' | 'error';

export interface GPUServer {
  id: string;
  name: string;
  hostname: string;
  status: ServerStatus;
  os: string;
  uptime: string;
  lastSeen: Date;
  gpu: GPUInfo;
  network: NetworkInfo;
  disk: DiskInfo;
  memory: MemoryInfo;
  vastai: VastaiRentalInfo;
  ollama?: OllamaStatus;
  services: ServiceStatus[];
  tags: string[];
}

export interface EarningsBreakdown {
  today: number;
  yesterday: number;
  thisWeek: number;
  lastWeek: number;
  thisMonth: number;
  lastMonth: number;
  allTime: number;
}

export interface RentalHistoryItem {
  id: string;
  renterUsername: string;
  startedAt: Date;
  endedAt: Date;
  duration: number; // hours
  earnings: number;
  gpuModel: string;
}

export interface ServerMetrics {
  timestamp: Date;
  gpuUtilization: number;
  gpuTemperature: number;
  gpuMemoryUsed: number;
  systemMemoryUsed: number;
  networkUpload: number;
  networkDownload: number;
  power: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const now = new Date();

export const mockServers: GPUServer[] = [
  {
    id: 'gpuserver1',
    name: 'gpuserver1',
    hostname: 'gpuserver1.local',
    status: 'online',
    os: 'Ubuntu 22.04 LTS',
    uptime: '14d 6h 32m',
    lastSeen: new Date(now.getTime() - 30000), // 30 seconds ago
    gpu: {
      model: 'NVIDIA GeForce RTX 5090',
      vram: 32,
      vramUsed: 4.2,
      utilization: 12,
      temperature: 42,
      power: 85,
      maxPower: 575,
      fanSpeed: 30,
      driverVersion: '560.35.03',
      cudaVersion: '12.6',
    },
    network: {
      uploadSpeed: 940,
      downloadSpeed: 2400,
      latency: 8,
      publicIp: '74.125.xxx.xxx',
      vastaiVerified: true,
      lastSpeedTest: new Date(now.getTime() - 3600000), // 1 hour ago
    },
    disk: {
      total: 2000,
      used: 847,
      available: 1153,
      readSpeed: 550,
      writeSpeed: 520,
    },
    memory: {
      total: 64,
      used: 18.4,
      available: 45.6,
      swapTotal: 32,
      swapUsed: 0.2,
    },
    vastai: {
      isRented: false,
      hourlyRate: 1.85,
      totalEarnings: 14.80,
      weeklyEarnings: 89.42,
      monthlyEarnings: 342.65,
      uptimePercentage: 99.2,
      totalRentals: 47,
      averageRentalDuration: 6.4,
    },
    ollama: {
      running: true,
      version: '0.4.7',
      modelsLoaded: ['llama3.3:70b', 'qwen2.5:32b'],
      activeRequests: 0,
      totalRequests: 1247,
    },
    services: [
      { name: 'SSH', status: 'running', port: 22, uptime: '14d 6h 32m' },
      { name: 'Docker', status: 'running', uptime: '14d 6h 30m', memory: 245 },
      { name: 'Vast.ai Agent', status: 'running', uptime: '14d 6h 28m', memory: 48 },
      { name: 'Ollama', status: 'running', port: 11434, uptime: '3d 12h 15m', memory: 4200 },
      { name: 'Tailscale', status: 'running', uptime: '14d 6h 32m', memory: 32 },
    ],
    tags: ['primary', 'vast.ai', 'ollama'],
  },
];

// Mock data for future servers (planning)
export const plannedServers: Partial<GPUServer>[] = [
  {
    id: 'gpuserver2',
    name: 'gpuserver2 (Planned)',
    status: 'offline',
    gpu: {
      model: 'NVIDIA RTX PRO 6000 Blackwell',
      vram: 96,
      vramUsed: 0,
      utilization: 0,
      temperature: 0,
      power: 0,
      maxPower: 350,
      fanSpeed: 0,
      driverVersion: '-',
      cudaVersion: '-',
    },
    tags: ['planned', 'pro'],
  },
  {
    id: 'gpuserver3',
    name: 'gpuserver3 (Planned)',
    status: 'offline',
    gpu: {
      model: 'NVIDIA RTX PRO 6000 Blackwell',
      vram: 96,
      vramUsed: 0,
      utilization: 0,
      temperature: 0,
      power: 0,
      maxPower: 350,
      fanSpeed: 0,
      driverVersion: '-',
      cudaVersion: '-',
    },
    tags: ['planned', 'pro'],
  },
];

export const mockEarnings: EarningsBreakdown = {
  today: 14.80,
  yesterday: 22.45,
  thisWeek: 89.42,
  lastWeek: 112.38,
  thisMonth: 342.65,
  lastMonth: 478.92,
  allTime: 2847.63,
};

export const mockRentalHistory: RentalHistoryItem[] = [
  {
    id: 'rental-001',
    renterUsername: 'ml_researcher_42',
    startedAt: new Date(now.getTime() - 8 * 3600000),
    endedAt: new Date(now.getTime() - 2 * 3600000),
    duration: 6,
    earnings: 11.10,
    gpuModel: 'RTX 5090',
  },
  {
    id: 'rental-002',
    renterUsername: 'ai_trainer_pro',
    startedAt: new Date(now.getTime() - 26 * 3600000),
    endedAt: new Date(now.getTime() - 14 * 3600000),
    duration: 12,
    earnings: 22.20,
    gpuModel: 'RTX 5090',
  },
  {
    id: 'rental-003',
    renterUsername: 'deeplearn_studio',
    startedAt: new Date(now.getTime() - 50 * 3600000),
    endedAt: new Date(now.getTime() - 42 * 3600000),
    duration: 8,
    earnings: 14.80,
    gpuModel: 'RTX 5090',
  },
  {
    id: 'rental-004',
    renterUsername: 'neural_net_labs',
    startedAt: new Date(now.getTime() - 72 * 3600000),
    endedAt: new Date(now.getTime() - 60 * 3600000),
    duration: 12,
    earnings: 22.20,
    gpuModel: 'RTX 5090',
  },
  {
    id: 'rental-005',
    renterUsername: 'compute_cloud_dev',
    startedAt: new Date(now.getTime() - 96 * 3600000),
    endedAt: new Date(now.getTime() - 84 * 3600000),
    duration: 12,
    earnings: 22.20,
    gpuModel: 'RTX 5090',
  },
];

// Generate mock metrics for the last 24 hours
export function generateMockMetrics(hours: number = 24): ServerMetrics[] {
  const metrics: ServerMetrics[] = [];
  const interval = 5; // 5-minute intervals

  for (let i = hours * 12; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * interval * 60000);
    const isRented = Math.random() > 0.4; // 60% chance of being rented at any point

    metrics.push({
      timestamp,
      gpuUtilization: isRented ? 70 + Math.random() * 28 : 5 + Math.random() * 15,
      gpuTemperature: isRented ? 65 + Math.random() * 15 : 38 + Math.random() * 8,
      gpuMemoryUsed: isRented ? 20 + Math.random() * 10 : 2 + Math.random() * 4,
      systemMemoryUsed: 15 + Math.random() * 10,
      networkUpload: isRented ? 100 + Math.random() * 200 : 5 + Math.random() * 20,
      networkDownload: isRented ? 200 + Math.random() * 400 : 10 + Math.random() * 30,
      power: isRented ? 300 + Math.random() * 250 : 70 + Math.random() * 30,
    });
  }

  return metrics;
}

// ============================================================================
// API HELPERS
// ============================================================================

/**
 * Fetch all servers (mock for now)
 */
export async function fetchServers(): Promise<GPUServer[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockServers;
}

/**
 * Fetch a single server by ID
 */
export async function fetchServer(id: string): Promise<GPUServer | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockServers.find((s) => s.id === id) || null;
}

/**
 * Fetch earnings data
 */
export async function fetchEarnings(): Promise<EarningsBreakdown> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return mockEarnings;
}

/**
 * Fetch rental history
 */
export async function fetchRentalHistory(): Promise<RentalHistoryItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return mockRentalHistory;
}

/**
 * Fetch server metrics
 */
export async function fetchServerMetrics(
  serverId: string,
  hours: number = 24
): Promise<ServerMetrics[]> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return generateMockMetrics(hours);
}

/**
 * Run a speed test
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function runSpeedTest(serverId: string): Promise<NetworkInfo> {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  return {
    uploadSpeed: 920 + Math.random() * 40,
    downloadSpeed: 2350 + Math.random() * 100,
    latency: 6 + Math.random() * 4,
    publicIp: '74.125.xxx.xxx',
    vastaiVerified: true,
    lastSpeedTest: new Date(),
  };
}

/**
 * Control a service (start/stop/restart)
 */
export async function controlService(
  serverId: string,
  serviceName: string,
  action: 'start' | 'stop' | 'restart'
): Promise<{ success: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return {
    success: true,
    message: `Service ${serviceName} ${action}ed successfully`,
  };
}

/**
 * Get server logs
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function fetchServerLogs(serverId: string, lines = 100): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [
    `[${new Date().toISOString()}] Vast.ai agent: Health check passed`,
    `[${new Date().toISOString()}] Docker: Container ollama healthy`,
    `[${new Date().toISOString()}] System: GPU temperature normal (42C)`,
    `[${new Date().toISOString()}] Network: Speed test completed - 940 Mbps up, 2.4 Gbps down`,
    `[${new Date().toISOString()}] Vast.ai agent: Instance available for rental`,
  ];
}

// ============================================================================
// SSH COMMAND HELPERS (for future implementation)
// ============================================================================

export interface SSHCommand {
  command: string;
  description: string;
  category: 'gpu' | 'system' | 'network' | 'vastai' | 'docker';
}

export const sshCommands: SSHCommand[] = [
  { command: 'nvidia-smi', description: 'GPU status', category: 'gpu' },
  { command: 'nvidia-smi -q -d MEMORY', description: 'Detailed GPU memory', category: 'gpu' },
  { command: 'nvtop', description: 'GPU monitor (interactive)', category: 'gpu' },
  { command: 'htop', description: 'System monitor', category: 'system' },
  { command: 'df -h', description: 'Disk usage', category: 'system' },
  { command: 'free -h', description: 'Memory usage', category: 'system' },
  { command: 'uptime', description: 'System uptime', category: 'system' },
  { command: 'speedtest-cli', description: 'Run speed test', category: 'network' },
  { command: 'curl ifconfig.me', description: 'Get public IP', category: 'network' },
  { command: 'vastai show instances', description: 'Show Vast.ai instances', category: 'vastai' },
  { command: 'docker ps', description: 'List running containers', category: 'docker' },
  { command: 'docker stats --no-stream', description: 'Container resource usage', category: 'docker' },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format bytes to human readable string
 */
export function formatBytes(gb: number): string {
  if (gb >= 1000) {
    return `${(gb / 1000).toFixed(1)} TB`;
  }
  return `${gb.toFixed(1)} GB`;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Get status color
 */
export function getStatusColor(status: ServerStatus): string {
  switch (status) {
    case 'online':
      return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    case 'rented':
      return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400';
    case 'offline':
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    case 'maintenance':
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
    case 'error':
      return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

/**
 * Get temperature color
 */
export function getTemperatureColor(temp: number): string {
  if (temp < 50) return 'text-green-600';
  if (temp < 70) return 'text-yellow-600';
  if (temp < 85) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get utilization color
 */
export function getUtilizationColor(util: number): string {
  if (util < 25) return 'text-green-600';
  if (util < 50) return 'text-yellow-600';
  if (util < 75) return 'text-orange-600';
  return 'text-red-600';
}
