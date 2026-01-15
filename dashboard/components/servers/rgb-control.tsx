'use client';

/**
 * RGB Lighting Control Panel
 *
 * Provides comprehensive RGB lighting control for gpuserver1,
 * including color picker, mode selector, presets, and zone toggles.
 *
 * @module components/servers/rgb-control
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Lightbulb,
  Sun,
  Snowflake,
  Gamepad2,
  Terminal,
  Power,
  PowerOff,
  Palette,
  Sparkles,
  MemoryStick,
  CircuitBoard,
  Rainbow,
  RefreshCw,
  Check,
  Zap,
  Settings2,
  Eye,
} from 'lucide-react';
import {
  type RGBColor,
  type RGBMode,
  type RGBDevice,
  type RGBPreset,
  type RGBState,
  RGB_PRESETS,
  RGB_MODES,
  mockRGBState,
  setColor,
  setMode,
  setBrightness,
  setPreset,
  toggleZone,
  toggleAllRGB,
  getRGBState,
  rgbToHex,
  hexToRgb,
  getPreviewGradient,
} from '@/lib/rgb-api';
import { staggerContainerVariants, staggerItemVariants } from '@/lib/animations';

// ============================================================================
// PRESET ICONS MAPPING
// ============================================================================

const presetIcons: Record<string, React.ElementType> = {
  sun: Sun,
  sparkles: Sparkles,
  snowflake: Snowflake,
  'gamepad-2': Gamepad2,
  terminal: Terminal,
  rainbow: Rainbow,
  'power-off': PowerOff,
};

// ============================================================================
// COLOR SWATCH COMPONENT
// ============================================================================

interface ColorSwatchProps {
  color: RGBColor;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

function ColorSwatch({
  color,
  selected,
  onClick,
  size = 'md',
  animated = false,
}: ColorSwatchProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <motion.button
      className={cn(
        'rounded-full border-2 transition-all shadow-sm',
        sizeClasses[size],
        selected
          ? 'border-white ring-2 ring-primary ring-offset-2 ring-offset-background'
          : 'border-transparent hover:border-white/50',
        onClick && 'cursor-pointer'
      )}
      style={{
        backgroundColor: rgbToHex(color),
        boxShadow: animated
          ? `0 0 20px ${rgbToHex(color)}80, 0 0 40px ${rgbToHex(color)}40`
          : `0 2px 4px ${rgbToHex(color)}40`,
      }}
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      animate={
        animated
          ? {
              boxShadow: [
                `0 0 20px ${rgbToHex(color)}80, 0 0 40px ${rgbToHex(color)}40`,
                `0 0 30px ${rgbToHex(color)}a0, 0 0 60px ${rgbToHex(color)}60`,
                `0 0 20px ${rgbToHex(color)}80, 0 0 40px ${rgbToHex(color)}40`,
              ],
            }
          : {}
      }
      transition={animated ? { duration: 2, repeat: Infinity } : {}}
    />
  );
}

// ============================================================================
// PRESET BUTTON COMPONENT
// ============================================================================

interface PresetButtonProps {
  preset: RGBPreset;
  active: boolean;
  onClick: () => void;
  compact?: boolean;
}

function PresetButton({ preset, active, onClick, compact }: PresetButtonProps) {
  const Icon = presetIcons[preset.icon || 'lightbulb'] || Lightbulb;

  if (compact) {
    return (
      <motion.button
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
          active
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border bg-background hover:bg-muted'
        )}
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div
          className="h-4 w-4 rounded-full"
          style={{
            background:
              preset.mode === 'Rainbow'
                ? 'linear-gradient(90deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff)'
                : rgbToHex(preset.color),
          }}
        />
        <span className="text-sm font-medium">{preset.name}</span>
        {active && <Check className="h-3 w-3 ml-auto" />}
      </motion.button>
    );
  }

  return (
    <motion.button
      className={cn(
        'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all min-w-[100px]',
        active
          ? 'border-primary bg-primary/5 shadow-lg'
          : 'border-border bg-background hover:bg-muted hover:border-primary/50'
      )}
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className={cn(
          'p-3 rounded-full transition-all',
          active ? 'shadow-lg' : ''
        )}
        style={{
          background:
            preset.mode === 'Rainbow'
              ? 'linear-gradient(135deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff, #ff0088)'
              : rgbToHex(preset.color),
          boxShadow: active ? `0 0 20px ${rgbToHex(preset.color)}60` : 'none',
        }}
      >
        <Icon
          className={cn(
            'h-5 w-5',
            preset.id === 'off' ? 'text-muted-foreground' : 'text-white'
          )}
        />
      </div>
      <span className="text-sm font-medium">{preset.name}</span>
      {active && (
        <motion.div
          className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <Check className="h-3 w-3" />
        </motion.div>
      )}
    </motion.button>
  );
}

// ============================================================================
// DEVICE ZONE TOGGLE COMPONENT
// ============================================================================

interface ZoneToggleProps {
  device: RGBDevice;
  onToggleZone: (deviceId: string, zoneId: string, enabled: boolean) => void;
}

function ZoneToggle({ device, onToggleZone }: ZoneToggleProps) {
  const Icon = device.type === 'dram' ? MemoryStick : CircuitBoard;

  return (
    <div className="p-3 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{device.name}</span>
        </div>
        <Badge variant={device.connected ? 'success' : 'secondary'}>
          {device.connected ? 'Connected' : 'Offline'}
        </Badge>
      </div>
      <div className="space-y-2">
        {device.zones.map((zone) => (
          <div
            key={zone.id}
            className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full transition-all"
                style={{
                  backgroundColor: zone.enabled
                    ? rgbToHex(zone.currentColor)
                    : '#333',
                  boxShadow: zone.enabled
                    ? `0 0 8px ${rgbToHex(zone.currentColor)}80`
                    : 'none',
                }}
              />
              <span className="text-sm">{zone.name}</span>
              <span className="text-xs text-muted-foreground">
                ({zone.ledsCount} LEDs)
              </span>
            </div>
            <Button
              variant={zone.enabled ? 'default' : 'outline'}
              size="sm"
              className="h-7 px-2"
              onClick={() => onToggleZone(device.id, zone.id, !zone.enabled)}
            >
              <Power className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MODE PREVIEW COMPONENT
// ============================================================================

interface ModePreviewProps {
  color: RGBColor;
  mode: RGBMode;
  brightness: number;
}

function ModePreview({ color, mode, brightness }: ModePreviewProps) {
  const gradient = getPreviewGradient(color, mode);
  const isAnimated = ['Breathing', 'Rainbow', 'Spectrum Cycle', 'Chase', 'Chase Fade', 'Flashing', 'Random Flicker'].includes(mode);

  return (
    <div className="relative overflow-hidden rounded-xl p-1">
      <motion.div
        className="h-24 rounded-lg relative overflow-hidden"
        style={{
          background: gradient,
          opacity: brightness / 100,
        }}
        animate={
          isAnimated
            ? mode === 'Breathing'
              ? { opacity: [brightness / 100, (brightness / 100) * 0.3, brightness / 100] }
              : mode === 'Rainbow' || mode === 'Spectrum Cycle'
              ? { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }
              : mode === 'Flashing'
              ? { opacity: [brightness / 100, 0, brightness / 100] }
              : {}
            : {}
        }
        transition={
          isAnimated
            ? {
                duration: mode === 'Flashing' ? 0.5 : mode === 'Breathing' ? 2 : 3,
                repeat: Infinity,
                ease: mode === 'Flashing' ? 'easeInOut' : 'linear',
              }
            : {}
        }
      >
        {/* LED dots overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="h-4 w-4 rounded-full bg-white/30 backdrop-blur-sm"
              animate={
                mode === 'Chase' || mode === 'Chase Fade'
                  ? {
                      opacity: [0.2, 1, 0.2],
                      scale: [0.8, 1.1, 0.8],
                    }
                  : mode === 'Random Flicker'
                  ? {
                      opacity: [0.3, 1, 0.5, 0.8, 0.3],
                    }
                  : {}
              }
              transition={{
                duration: mode === 'Random Flicker' ? 0.3 : 1,
                repeat: Infinity,
                delay: (mode === 'Chase' || mode === 'Chase Fade') ? i * 0.1 : Math.random() * 0.5,
              }}
            />
          ))}
        </div>
      </motion.div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Badge variant="secondary" className="bg-black/50 text-white border-0">
          <Eye className="h-3 w-3 mr-1" />
          Preview: {mode}
        </Badge>
      </div>
    </div>
  );
}

// ============================================================================
// COLOR PICKER COMPONENT
// ============================================================================

interface ColorPickerProps {
  color: RGBColor;
  onChange: (color: RGBColor) => void;
}

function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [hexValue, setHexValue] = React.useState(rgbToHex(color));

  const quickColors: RGBColor[] = [
    { r: 255, g: 0, b: 0 },
    { r: 255, g: 128, b: 0 },
    { r: 255, g: 255, b: 0 },
    { r: 0, g: 255, b: 0 },
    { r: 0, g: 255, b: 255 },
    { r: 0, g: 128, b: 255 },
    { r: 0, g: 0, b: 255 },
    { r: 128, g: 0, b: 255 },
    { r: 255, g: 0, b: 255 },
    { r: 255, g: 0, b: 128 },
    { r: 255, g: 255, b: 255 },
    { r: 255, g: 140, b: 0 }, // Solar Orange
  ];

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHexValue(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      onChange(hexToRgb(value));
    }
  };

  React.useEffect(() => {
    setHexValue(rgbToHex(color));
  }, [color]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={rgbToHex(color)}
          onChange={(e) => onChange(hexToRgb(e.target.value))}
          className="h-10 w-20 rounded-lg border border-border cursor-pointer"
        />
        <input
          type="text"
          value={hexValue}
          onChange={handleHexChange}
          className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm font-mono uppercase"
          placeholder="#FF8C00"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {quickColors.map((c, i) => (
          <ColorSwatch
            key={i}
            color={c}
            selected={c.r === color.r && c.g === color.g && c.b === color.b}
            onClick={() => onChange(c)}
            size="sm"
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">R</label>
          <Slider
            value={[color.r]}
            max={255}
            step={1}
            onValueChange={([r]) => onChange({ ...color, r })}
            className="mt-1"
          />
          <span className="text-xs font-mono">{color.r}</span>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">G</label>
          <Slider
            value={[color.g]}
            max={255}
            step={1}
            onValueChange={([g]) => onChange({ ...color, g })}
            className="mt-1"
          />
          <span className="text-xs font-mono">{color.g}</span>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">B</label>
          <Slider
            value={[color.b]}
            max={255}
            step={1}
            onValueChange={([b]) => onChange({ ...color, b })}
            className="mt-1"
          />
          <span className="text-xs font-mono">{color.b}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN RGB CONTROL COMPONENT
// ============================================================================

interface RGBControlProps {
  serverId?: string;
  compact?: boolean;
  className?: string;
}

export function RGBControl({ serverId = 'gpuserver1', compact = false, className }: RGBControlProps) {
  const [state, setState] = React.useState<RGBState>(mockRGBState);
  const [selectedColor, setSelectedColor] = React.useState<RGBColor>({ r: 255, g: 140, b: 0 });
  const [selectedMode, setSelectedMode] = React.useState<RGBMode>('Static');
  const [brightness, setBrightnessValue] = React.useState(100);
  const [activePreset, setActivePreset] = React.useState<string | null>('solar-inference');
  const [isLoading, setIsLoading] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  // Refresh state
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const newState = await getRGBState();
      setState(newState);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply preset
  const handlePreset = async (presetId: string) => {
    setIsLoading(true);
    try {
      const result = await setPreset(presetId);
      if (result.success && result.preset) {
        setSelectedColor(result.preset.color);
        setSelectedMode(result.preset.mode);
        setBrightnessValue(result.preset.brightness);
        setActivePreset(presetId);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Apply color
  const handleColorChange = async (color: RGBColor) => {
    setSelectedColor(color);
    setActivePreset(null);
    await setColor(color);
  };

  // Apply mode
  const handleModeChange = async (mode: RGBMode) => {
    setSelectedMode(mode);
    setActivePreset(null);
    await setMode(mode);
  };

  // Apply brightness
  const handleBrightnessChange = async (value: number[]) => {
    const newBrightness = value[0];
    setBrightnessValue(newBrightness);
    await setBrightness(newBrightness);
  };

  // Toggle zone
  const handleToggleZone = async (deviceId: string, zoneId: string, enabled: boolean) => {
    await toggleZone(deviceId, zoneId, enabled);
    // Update local state
    setState((prev) => ({
      ...prev,
      devices: prev.devices.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              zones: d.zones.map((z) =>
                z.id === zoneId ? { ...z, enabled } : z
              ),
            }
          : d
      ),
    }));
  };

  // Toggle all RGB
  const handleToggleAll = async () => {
    const allEnabled = state.devices.every((d) =>
      d.zones.every((z) => z.enabled)
    );
    setIsLoading(true);
    try {
      await toggleAllRGB(!allEnabled);
      setState((prev) => ({
        ...prev,
        devices: prev.devices.map((d) => ({
          ...d,
          zones: d.zones.map((z) => ({ ...z, enabled: !allEnabled })),
        })),
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Check if all zones are enabled
  const allEnabled = state.devices.every((d) =>
    d.zones.every((z) => z.enabled)
  );

  if (compact) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              RGB Control
            </CardTitle>
            <div className="flex items-center gap-1">
              <ColorSwatch color={selectedColor} size="sm" animated={selectedMode === 'Breathing'} />
              <Button
                variant={allEnabled ? 'default' : 'outline'}
                size="icon-sm"
                onClick={handleToggleAll}
              >
                <Power className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {RGB_PRESETS.slice(0, 4).map((preset) => (
              <PresetButton
                key={preset.id}
                preset={preset}
                active={activePreset === preset.id}
                onClick={() => handlePreset(preset.id)}
                compact
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-500">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                RGB Lighting Control
                <Badge variant={state.serverConnected ? 'success' : 'destructive'}>
                  {state.serverConnected ? 'Connected' : 'Disconnected'}
                </Badge>
              </CardTitle>
              <CardDescription>
                OpenRGB on {serverId} - Port 6742
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={allEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={handleToggleAll}
              disabled={isLoading}
            >
              <Power className="h-4 w-4 mr-2" />
              {allEnabled ? 'All On' : 'All Off'}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Preview */}
        <ModePreview color={selectedColor} mode={selectedMode} brightness={brightness} />

        {/* Presets */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Quick Presets
          </h4>
          <motion.div
            className="flex flex-wrap gap-3"
            variants={staggerContainerVariants}
            initial="initial"
            animate="animate"
          >
            {RGB_PRESETS.map((preset) => (
              <motion.div key={preset.id} variants={staggerItemVariants}>
                <PresetButton
                  preset={preset}
                  active={activePreset === preset.id}
                  onClick={() => handlePreset(preset.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Brightness Slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Brightness
            </h4>
            <span className="text-sm font-mono">{brightness}%</span>
          </div>
          <Slider
            value={[brightness]}
            max={100}
            step={5}
            onValueChange={handleBrightnessChange}
          />
        </div>

        {/* Mode Selector */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Effect Mode
          </h4>
          <Select value={selectedMode} onValueChange={(v) => handleModeChange(v as RGBMode)}>
            <SelectTrigger>
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              {RGB_MODES.map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {mode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Color Picker */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Custom Color
          </h4>
          <ColorPicker color={selectedColor} onChange={handleColorChange} />
        </div>

        {/* Advanced Settings Toggle */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Settings2 className="h-4 w-4 mr-2" />
          {showAdvanced ? 'Hide' : 'Show'} Zone Controls
        </Button>

        {/* Zone Controls */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              {state.devices.map((device) => (
                <ZoneToggle
                  key={device.id}
                  device={device}
                  onToggleZone={handleToggleZone}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// RGB INDICATOR COMPONENT (for server cards)
// ============================================================================

interface RGBIndicatorProps {
  color: RGBColor;
  enabled: boolean;
  mode?: RGBMode;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function RGBIndicator({
  color,
  enabled,
  mode = 'Static',
  onClick,
  size = 'sm',
}: RGBIndicatorProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
  };

  const isAnimated = mode === 'Breathing' || mode === 'Rainbow';

  return (
    <motion.button
      className={cn(
        'rounded-full border border-border/50 transition-all',
        sizeClasses[size],
        onClick && 'cursor-pointer hover:scale-110'
      )}
      style={{
        backgroundColor: enabled ? rgbToHex(color) : '#333',
        boxShadow: enabled ? `0 0 8px ${rgbToHex(color)}60` : 'none',
      }}
      onClick={onClick}
      animate={
        enabled && isAnimated
          ? {
              boxShadow: [
                `0 0 8px ${rgbToHex(color)}60`,
                `0 0 16px ${rgbToHex(color)}a0`,
                `0 0 8px ${rgbToHex(color)}60`,
              ],
            }
          : {}
      }
      transition={isAnimated ? { duration: 2, repeat: Infinity } : {}}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      title={enabled ? `RGB: ${mode}` : 'RGB Off'}
    />
  );
}

// ============================================================================
// QUICK RGB TOGGLE COMPONENT
// ============================================================================

interface QuickRGBToggleProps {
  enabled: boolean;
  color: RGBColor;
  onToggle: () => void;
  onPreset?: (presetId: string) => void;
}

export function QuickRGBToggle({ enabled, color, onToggle, onPreset }: QuickRGBToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <RGBIndicator
        color={color}
        enabled={enabled}
        mode="Breathing"
        onClick={onToggle}
        size="md"
      />
      {onPreset && (
        <div className="flex gap-1">
          {RGB_PRESETS.slice(0, 3).map((preset) => (
            <button
              key={preset.id}
              className="h-4 w-4 rounded-full border border-border/50 transition-transform hover:scale-110"
              style={{
                background:
                  preset.mode === 'Rainbow'
                    ? 'linear-gradient(90deg, #ff0000, #00ff00, #0000ff)'
                    : rgbToHex(preset.color),
              }}
              onClick={() => onPreset(preset.id)}
              title={preset.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default RGBControl;
