/**
 * RGB Lighting Control API
 *
 * Types, mock data, and API helpers for controlling RGB lighting
 * via OpenRGB on gpuserver1. Supports ENE DRAM and ASUS motherboard.
 *
 * @module lib/rgb-api
 */

// ============================================================================
// TYPES
// ============================================================================

export interface RGBColor {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export type RGBMode =
  | 'Direct'
  | 'Off'
  | 'Static'
  | 'Breathing'
  | 'Flashing'
  | 'Spectrum Cycle'
  | 'Rainbow'
  | 'Chase Fade'
  | 'Chase'
  | 'Random Flicker';

export interface RGBZone {
  id: string;
  name: string;
  ledsCount: number;
  currentColor: RGBColor;
  enabled: boolean;
}

export interface RGBDevice {
  id: string;
  name: string;
  type: 'dram' | 'motherboard' | 'gpu' | 'fan' | 'other';
  vendor: string;
  zones: RGBZone[];
  currentMode: RGBMode;
  brightness: number; // 0-100
  connected: boolean;
}

export interface RGBPreset {
  id: string;
  name: string;
  color: RGBColor;
  mode: RGBMode;
  brightness: number;
  icon?: string;
  description?: string;
}

export interface RGBState {
  devices: RGBDevice[];
  activePreset: string | null;
  lastUpdated: Date;
  serverConnected: boolean;
}

// ============================================================================
// PRESETS
// ============================================================================

export const RGB_PRESETS: RGBPreset[] = [
  {
    id: 'solar-orange',
    name: 'Solar Orange',
    color: { r: 255, g: 140, b: 0 },
    mode: 'Static',
    brightness: 100,
    icon: 'sun',
    description: 'Solar Inference branding',
  },
  {
    id: 'solar-inference',
    name: 'Solar Inference',
    color: { r: 255, g: 165, b: 0 },
    mode: 'Breathing',
    brightness: 100,
    icon: 'sparkles',
    description: 'Animated orange/yellow glow',
  },
  {
    id: 'cool-blue',
    name: 'Cool Blue',
    color: { r: 0, g: 120, b: 255 },
    mode: 'Static',
    brightness: 80,
    icon: 'snowflake',
    description: 'Cool and calm',
  },
  {
    id: 'gaming-red',
    name: 'Gaming Red',
    color: { r: 255, g: 30, b: 30 },
    mode: 'Static',
    brightness: 100,
    icon: 'gamepad-2',
    description: 'High performance mode',
  },
  {
    id: 'matrix-green',
    name: 'Matrix Green',
    color: { r: 0, g: 255, b: 65 },
    mode: 'Static',
    brightness: 90,
    icon: 'terminal',
    description: 'Hacker vibes',
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    color: { r: 255, g: 0, b: 0 },
    mode: 'Rainbow',
    brightness: 100,
    icon: 'rainbow',
    description: 'Full spectrum cycling',
  },
  {
    id: 'off',
    name: 'Off',
    color: { r: 0, g: 0, b: 0 },
    mode: 'Off',
    brightness: 0,
    icon: 'power-off',
    description: 'Turn off all RGB',
  },
];

export const RGB_MODES: RGBMode[] = [
  'Direct',
  'Off',
  'Static',
  'Breathing',
  'Flashing',
  'Spectrum Cycle',
  'Rainbow',
  'Chase Fade',
  'Chase',
  'Random Flicker',
];

// ============================================================================
// MOCK DATA
// ============================================================================

const now = new Date();

export const mockRGBDevices: RGBDevice[] = [
  {
    id: 'ene-dram-1',
    name: 'RAM Slot 1',
    type: 'dram',
    vendor: 'ENE DRAM',
    currentMode: 'Static',
    brightness: 100,
    connected: true,
    zones: [
      {
        id: 'dram1-zone1',
        name: 'RAM 1',
        ledsCount: 8,
        currentColor: { r: 255, g: 140, b: 0 },
        enabled: true,
      },
    ],
  },
  {
    id: 'ene-dram-2',
    name: 'RAM Slot 2',
    type: 'dram',
    vendor: 'ENE DRAM',
    currentMode: 'Static',
    brightness: 100,
    connected: true,
    zones: [
      {
        id: 'dram2-zone1',
        name: 'RAM 2',
        ledsCount: 8,
        currentColor: { r: 255, g: 140, b: 0 },
        enabled: true,
      },
    ],
  },
  {
    id: 'asus-mb',
    name: 'ASUS Z790 GAMING WIFI7',
    type: 'motherboard',
    vendor: 'ASUS',
    currentMode: 'Breathing',
    brightness: 80,
    connected: true,
    zones: [
      {
        id: 'mb-zone1',
        name: 'Chipset',
        ledsCount: 12,
        currentColor: { r: 255, g: 165, b: 0 },
        enabled: true,
      },
      {
        id: 'mb-zone2',
        name: 'I/O Cover',
        ledsCount: 8,
        currentColor: { r: 255, g: 165, b: 0 },
        enabled: true,
      },
      {
        id: 'mb-zone3',
        name: 'PCIe Area',
        ledsCount: 10,
        currentColor: { r: 255, g: 165, b: 0 },
        enabled: true,
      },
      {
        id: 'mb-zone4',
        name: 'Audio',
        ledsCount: 6,
        currentColor: { r: 255, g: 165, b: 0 },
        enabled: true,
      },
    ],
  },
];

export const mockRGBState: RGBState = {
  devices: mockRGBDevices,
  activePreset: 'solar-inference',
  lastUpdated: new Date(now.getTime() - 60000),
  serverConnected: true,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * OpenRGB server configuration
 */
export const OPENRGB_CONFIG = {
  host: 'gpuserver1.local',
  port: 6742,
  name: 'Solar Inference Dashboard',
};

/**
 * Get all RGB devices
 */
export async function getDevices(): Promise<RGBDevice[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockRGBDevices;
}

/**
 * Get current RGB state
 */
export async function getRGBState(): Promise<RGBState> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return {
    ...mockRGBState,
    lastUpdated: new Date(),
  };
}

/**
 * Set color for a specific device or all devices
 */
export async function setColor(
  color: RGBColor,
  deviceId?: string
): Promise<{ success: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  // In production, this would call the OpenRGB API
  // const response = await fetch(`http://${OPENRGB_CONFIG.host}:${OPENRGB_CONFIG.port}/...`);

  return {
    success: true,
    message: deviceId
      ? `Color set on ${deviceId}`
      : 'Color set on all devices',
  };
}

/**
 * Set mode for a specific device or all devices
 */
export async function setMode(
  mode: RGBMode,
  deviceId?: string
): Promise<{ success: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    success: true,
    message: deviceId
      ? `Mode set to ${mode} on ${deviceId}`
      : `Mode set to ${mode} on all devices`,
  };
}

/**
 * Set brightness for a specific device or all devices
 */
export async function setBrightness(
  brightness: number,
  deviceId?: string
): Promise<{ success: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const clampedBrightness = Math.max(0, Math.min(100, brightness));

  return {
    success: true,
    message: deviceId
      ? `Brightness set to ${clampedBrightness}% on ${deviceId}`
      : `Brightness set to ${clampedBrightness}% on all devices`,
  };
}

/**
 * Apply a preset to all devices
 */
export async function setPreset(
  presetId: string
): Promise<{ success: boolean; message: string; preset?: RGBPreset }> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const preset = RGB_PRESETS.find((p) => p.id === presetId);

  if (!preset) {
    return {
      success: false,
      message: `Preset "${presetId}" not found`,
    };
  }

  return {
    success: true,
    message: `Applied preset: ${preset.name}`,
    preset,
  };
}

/**
 * Toggle a specific zone on/off
 */
export async function toggleZone(
  deviceId: string,
  zoneId: string,
  enabled: boolean
): Promise<{ success: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    success: true,
    message: `Zone ${zoneId} ${enabled ? 'enabled' : 'disabled'}`,
  };
}

/**
 * Toggle all RGB on/off
 */
export async function toggleAllRGB(
  enabled: boolean
): Promise<{ success: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    success: true,
    message: enabled ? 'All RGB enabled' : 'All RGB disabled',
  };
}

/**
 * Check OpenRGB server connection
 */
export async function checkConnection(): Promise<{
  connected: boolean;
  serverVersion?: string;
  deviceCount?: number;
}> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  return {
    connected: true,
    serverVersion: '0.9',
    deviceCount: 3,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert RGB to hex color string
 */
export function rgbToHex(color: RGBColor): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

/**
 * Convert hex color string to RGB
 */
export function hexToRgb(hex: string): RGBColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Get a CSS gradient string for preview
 */
export function getPreviewGradient(color: RGBColor, mode: RGBMode): string {
  const hex = rgbToHex(color);

  switch (mode) {
    case 'Rainbow':
    case 'Spectrum Cycle':
      return 'linear-gradient(90deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff, #ff0088)';
    case 'Breathing':
      return `linear-gradient(90deg, ${hex}44, ${hex}, ${hex}44)`;
    case 'Chase':
    case 'Chase Fade':
      return `repeating-linear-gradient(90deg, ${hex}, ${hex} 20%, transparent 20%, transparent 40%)`;
    case 'Flashing':
      return `linear-gradient(90deg, ${hex}, transparent, ${hex})`;
    case 'Random Flicker':
      return `linear-gradient(90deg, ${hex}, #ff0088, #00ff88, ${hex})`;
    case 'Off':
      return 'linear-gradient(90deg, #333, #222)';
    default:
      return hex;
  }
}

/**
 * Get animation CSS for mode preview
 */
export function getModeAnimation(mode: RGBMode): string {
  switch (mode) {
    case 'Breathing':
      return 'pulse 2s ease-in-out infinite';
    case 'Rainbow':
    case 'Spectrum Cycle':
      return 'rainbow-shift 3s linear infinite';
    case 'Flashing':
      return 'flash 0.5s ease-in-out infinite';
    case 'Chase':
    case 'Chase Fade':
      return 'chase 1s linear infinite';
    case 'Random Flicker':
      return 'flicker 0.2s ease-in-out infinite';
    default:
      return 'none';
  }
}

/**
 * Calculate total LED count for a device
 */
export function getTotalLeds(device: RGBDevice): number {
  return device.zones.reduce((sum, zone) => sum + zone.ledsCount, 0);
}

/**
 * Get device icon based on type
 */
export function getDeviceIcon(type: RGBDevice['type']): string {
  switch (type) {
    case 'dram':
      return 'memory-stick';
    case 'motherboard':
      return 'circuit-board';
    case 'gpu':
      return 'cpu';
    case 'fan':
      return 'fan';
    default:
      return 'lightbulb';
  }
}
