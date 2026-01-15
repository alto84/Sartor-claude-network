'use client';

/**
 * GPU Monitor Widget
 *
 * Real-time GPU monitoring with utilization chart, VRAM usage,
 * temperature gauge, and power consumption display.
 *
 * @module components/servers/gpu-monitor
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Cpu,
  Thermometer,
  Zap,
  HardDrive,
  Activity,
  Fan,
} from 'lucide-react';
import type { GPUInfo, ServerMetrics } from '@/lib/server-api';
import {
  formatPercentage,
  getTemperatureColor,
  getUtilizationColor,
} from '@/lib/server-api';

// ============================================================================
// TYPES
// ============================================================================

interface GPUMonitorProps {
  gpu: GPUInfo;
  metrics?: ServerMetrics[];
  className?: string;
  compact?: boolean;
}

interface CircularGaugeProps {
  value: number;
  max: number;
  label?: string;
  unit: string;
  size?: 'sm' | 'md' | 'lg';
  colorFn?: (value: number) => string;
  icon?: React.ElementType;
}

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  showValue?: boolean;
  colorClass?: string;
  className?: string;
}

// ============================================================================
// CIRCULAR GAUGE COMPONENT
// ============================================================================

function CircularGauge({
  value,
  max,
  unit,
  size = 'md',
  colorFn,
  icon: Icon,
}: CircularGaugeProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = size === 'sm' ? 35 : size === 'md' ? 45 : 55;
  const strokeWidth = size === 'sm' ? 6 : size === 'md' ? 8 : 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const color = colorFn
    ? colorFn(value)
    : percentage < 50
    ? 'text-green-500'
    : percentage < 75
    ? 'text-amber-500'
    : 'text-red-500';

  const strokeColor = color.replace('text-', 'stroke-');

  return (
    <div className={cn('relative flex items-center justify-center', sizeClasses[size])}>
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 120 120">
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        {/* Progress circle */}
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={strokeColor}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {Icon && <Icon className={cn('h-4 w-4 mb-1', color)} />}
        <span className={cn('font-bold', textSizes[size], color)}>
          {Math.round(value)}
        </span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

// ============================================================================
// PROGRESS BAR COMPONENT
// ============================================================================

function ProgressBar({
  value,
  max,
  label,
  showValue = true,
  colorClass = 'bg-primary',
  className,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        {showValue && (
          <span className="font-medium">
            {value.toFixed(1)} / {max} GB
          </span>
        )}
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', colorClass)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// MINI UTILIZATION CHART
// ============================================================================

interface MiniChartProps {
  data: number[];
  className?: string;
  height?: number;
}

function MiniUtilizationChart({ data, className, height = 60 }: MiniChartProps) {
  const maxValue = Math.max(...data, 100);
  const width = 200;
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - (value / maxValue) * height;
    return `${x},${y}`;
  });

  const areaPath = `M0,${height} L${points.join(' L')} L${width},${height} Z`;
  const linePath = `M${points.join(' L')}`;

  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        {/* Area fill */}
        <motion.path
          d={areaPath}
          className="fill-green-500/20 dark:fill-green-400/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        {/* Line */}
        <motion.path
          d={linePath}
          fill="none"
          className="stroke-green-500 dark:stroke-green-400"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      {/* Grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="border-t border-dashed border-muted/30"
            style={{ height: 0 }}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// STAT ITEM COMPONENT
// ============================================================================

interface StatItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  colorClass?: string;
}

function StatItem({ icon: Icon, label, value, subValue, colorClass }: StatItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className={cn('p-2 rounded-lg bg-background', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="font-semibold truncate">{value}</p>
        {subValue && (
          <p className="text-xs text-muted-foreground">{subValue}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN GPU MONITOR COMPONENT
// ============================================================================

export function GPUMonitor({ gpu, metrics, className, compact = false }: GPUMonitorProps) {
  // Generate sample utilization data if no metrics provided
  const utilizationData = React.useMemo(() => {
    if (metrics && metrics.length > 0) {
      return metrics.slice(-30).map((m) => m.gpuUtilization);
    }
    // Generate mock data that trends toward current utilization
    // Using a deterministic seeded pattern based on utilization for stability
    return Array.from({ length: 30 }, (_, i) => {
      const base = gpu.utilization;
      // Use deterministic variation based on index instead of Math.random
      const variation = Math.sin(i * 0.5) * 10 + Math.cos(i * 0.3) * 5;
      return Math.max(0, Math.min(100, base + variation + (i - 15) * 0.3));
    });
  }, [metrics, gpu.utilization]);

  if (compact) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Cpu className="h-4 w-4 text-green-600" />
            {gpu.model}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className={cn('text-xl font-bold', getUtilizationColor(gpu.utilization))}>
                {gpu.utilization}%
              </p>
              <p className="text-xs text-muted-foreground">GPU</p>
            </div>
            <div>
              <p className={cn('text-xl font-bold', getTemperatureColor(gpu.temperature))}>
                {gpu.temperature}C
              </p>
              <p className="text-xs text-muted-foreground">Temp</p>
            </div>
            <div>
              <p className="text-xl font-bold text-amber-600">
                {gpu.power}W
              </p>
              <p className="text-xs text-muted-foreground">Power</p>
            </div>
          </div>
          <ProgressBar
            value={gpu.vramUsed}
            max={gpu.vram}
            label="VRAM"
            colorClass="bg-gradient-to-r from-green-500 to-emerald-500"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          GPU Monitor
        </CardTitle>
        <CardDescription>{gpu.model}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main gauges */}
        <div className="flex justify-around items-center">
          <CircularGauge
            value={gpu.utilization}
            max={100}
            label="Utilization"
            unit="%"
            size="md"
            colorFn={(v) => getUtilizationColor(v)}
            icon={Activity}
          />
          <CircularGauge
            value={gpu.temperature}
            max={100}
            label="Temperature"
            unit="C"
            size="md"
            colorFn={(v) => getTemperatureColor(v)}
            icon={Thermometer}
          />
          <CircularGauge
            value={gpu.power}
            max={gpu.maxPower}
            label="Power"
            unit="W"
            size="md"
            colorFn={(v) => {
              const pct = (v / gpu.maxPower) * 100;
              if (pct < 30) return 'text-green-500';
              if (pct < 60) return 'text-amber-500';
              return 'text-red-500';
            }}
            icon={Zap}
          />
        </div>

        {/* VRAM Progress */}
        <div className="space-y-2">
          <ProgressBar
            value={gpu.vramUsed}
            max={gpu.vram}
            label="VRAM Usage"
            colorClass="bg-gradient-to-r from-green-500 to-emerald-500"
          />
        </div>

        {/* Utilization Chart */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">GPU Utilization (Last 30 min)</span>
            <span className="text-sm text-muted-foreground">
              {formatPercentage(gpu.utilization)}
            </span>
          </div>
          <MiniUtilizationChart data={utilizationData} height={80} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatItem
            icon={Fan}
            label="Fan Speed"
            value={`${gpu.fanSpeed}%`}
            colorClass="text-blue-600"
          />
          <StatItem
            icon={HardDrive}
            label="Driver"
            value={gpu.driverVersion}
            subValue={`CUDA ${gpu.cudaVersion}`}
            colorClass="text-purple-600"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPACT GPU STATS ROW
// ============================================================================

interface GPUStatsRowProps {
  gpu: GPUInfo;
  className?: string;
}

export function GPUStatsRow({ gpu, className }: GPUStatsRowProps) {
  return (
    <div className={cn('flex items-center gap-4 flex-wrap', className)}>
      <div className="flex items-center gap-2">
        <Activity className={cn('h-4 w-4', getUtilizationColor(gpu.utilization))} />
        <span className="text-sm font-medium">{gpu.utilization}%</span>
      </div>
      <div className="flex items-center gap-2">
        <Thermometer className={cn('h-4 w-4', getTemperatureColor(gpu.temperature))} />
        <span className="text-sm font-medium">{gpu.temperature}C</span>
      </div>
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-medium">{gpu.power}W</span>
      </div>
      <div className="flex items-center gap-2">
        <HardDrive className="h-4 w-4 text-purple-500" />
        <span className="text-sm font-medium">
          {gpu.vramUsed.toFixed(1)}/{gpu.vram}GB
        </span>
      </div>
    </div>
  );
}

export default GPUMonitor;
