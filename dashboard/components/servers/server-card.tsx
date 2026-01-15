'use client';

/**
 * Server Card Component
 *
 * Individual server card displaying status, GPU info, memory,
 * disk usage, network speeds, Vast.ai status, and Ollama status.
 *
 * @module components/servers/server-card
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Server,
  Cpu,
  HardDrive,
  MemoryStick,
  Wifi,
  DollarSign,
  MoreVertical,
  Terminal,
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Activity,
  Thermometer,
  Zap,
  Brain,
  Square,
} from 'lucide-react';
import type { GPUServer, ServiceStatus } from '@/lib/server-api';
import {
  formatCurrency,
  getTemperatureColor,
  getUtilizationColor,
} from '@/lib/server-api';
import { RGBIndicator } from './rgb-control';
import { toggleAllRGB, type RGBColor } from '@/lib/rgb-api';
import { formatTimestamp } from '@/lib/utils';
import { GPUStatsRow } from './gpu-monitor';
import { EarningsSummaryRow } from './earnings-widget';
import { NetworkStatsRow } from './network-status';

// ============================================================================
// TYPES
// ============================================================================

interface ServerCardProps {
  server: GPUServer;
  onViewDetails?: (serverId: string) => void;
  onRestartService?: (serverId: string, serviceName: string) => void;
  onOpenLogs?: (serverId: string) => void;
  onOpenSSH?: (serverId: string) => void;
  className?: string;
  expanded?: boolean;
  rgbEnabled?: boolean;
  rgbColor?: RGBColor;
  onRgbToggle?: () => void;
}

// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================

interface StatusBadgeProps {
  status: GPUServer['status'];
  className?: string;
}

function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    online: { label: 'Online', icon: CheckCircle2, variant: 'success' as const },
    offline: { label: 'Offline', icon: XCircle, variant: 'secondary' as const },
    rented: { label: 'Rented', icon: DollarSign, variant: 'warning' as const },
    maintenance: { label: 'Maintenance', icon: AlertCircle, variant: 'info' as const },
    error: { label: 'Error', icon: XCircle, variant: 'destructive' as const },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn('gap-1', className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// ============================================================================
// SERVICE STATUS ITEM
// ============================================================================

interface ServiceItemProps {
  service: ServiceStatus;
  onRestart?: () => void;
}

function ServiceItem({ service, onRestart }: ServiceItemProps) {
  const statusColors = {
    running: 'text-green-600',
    stopped: 'text-gray-400',
    error: 'text-red-600',
    starting: 'text-amber-600',
  };

  const statusIcons = {
    running: CheckCircle2,
    stopped: Square,
    error: XCircle,
    starting: Loader2,
  };

  const Icon = statusIcons[service.status];

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            'h-4 w-4',
            statusColors[service.status],
            service.status === 'starting' && 'animate-spin'
          )}
        />
        <span className="text-sm font-medium">{service.name}</span>
        {service.port && (
          <span className="text-xs text-muted-foreground">:{service.port}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {service.memory && (
          <span className="text-xs text-muted-foreground">
            {service.memory}MB
          </span>
        )}
        {onRestart && (
          <Button variant="ghost" size="icon-sm" onClick={onRestart}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PROGRESS BAR
// ============================================================================

interface UsageBarProps {
  used: number;
  total: number;
  label: string;
  icon: React.ElementType;
  iconColor: string;
  unit?: string;
}

function UsageBar({ used, total, label, icon: Icon, iconColor, unit = 'GB' }: UsageBarProps) {
  const percentage = Math.min((used / total) * 100, 100);
  const getBarColor = () => {
    if (percentage < 60) return 'bg-green-500';
    if (percentage < 80) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', iconColor)} />
          <span className="text-muted-foreground">{label}</span>
        </div>
        <span className="font-medium">
          {used.toFixed(1)} / {total} {unit}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', getBarColor())}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// OLLAMA STATUS
// ============================================================================

interface OllamaStatusProps {
  ollama?: GPUServer['ollama'];
  className?: string;
}

function OllamaStatus({ ollama, className }: OllamaStatusProps) {
  if (!ollama) return null;

  return (
    <div className={cn('p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800', className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-600" />
          <span className="font-medium text-purple-700 dark:text-purple-300">Ollama</span>
        </div>
        <Badge variant={ollama.running ? 'success' : 'secondary'}>
          {ollama.running ? 'Running' : 'Stopped'}
        </Badge>
      </div>
      {ollama.running && (
        <>
          <div className="flex flex-wrap gap-1 mb-2">
            {ollama.modelsLoaded.map((model) => (
              <Badge key={model} variant="outline" className="text-xs">
                {model}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>v{ollama.version}</span>
            <span>{ollama.totalRequests.toLocaleString()} requests</span>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// MAIN SERVER CARD
// ============================================================================

export function ServerCard({
  server,
  onViewDetails,
  onRestartService,
  onOpenLogs,
  onOpenSSH,
  className,
  expanded = false,
  rgbEnabled = true,
  rgbColor = { r: 255, g: 140, b: 0 },
  onRgbToggle,
}: ServerCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(expanded);
  const [localRgbEnabled, setLocalRgbEnabled] = React.useState(rgbEnabled);

  const handleRgbToggle = async () => {
    if (onRgbToggle) {
      onRgbToggle();
    } else {
      await toggleAllRGB(!localRgbEnabled);
      setLocalRgbEnabled(!localRgbEnabled);
    }
  };

  const isRgbOn = onRgbToggle ? rgbEnabled : localRgbEnabled;

  const mockEarnings = {
    today: server.vastai.totalEarnings,
    yesterday: server.vastai.totalEarnings * 1.1,
    thisWeek: server.vastai.weeklyEarnings,
    lastWeek: server.vastai.weeklyEarnings * 0.9,
    thisMonth: server.vastai.monthlyEarnings,
    lastMonth: server.vastai.monthlyEarnings * 1.05,
    allTime: server.vastai.monthlyEarnings * 8,
  };

  return (
    <Card className={cn('overflow-hidden transition-all', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
              <Server className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{server.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span>{server.hostname}</span>
                <span className="text-muted-foreground/50">|</span>
                <span>{server.os}</span>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RGBIndicator
              color={rgbColor}
              enabled={isRgbOn}
              mode="Breathing"
              onClick={handleRgbToggle}
            />
            <StatusBadge status={server.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onOpenSSH?.(server.id)}>
                  <Terminal className="h-4 w-4 mr-2" />
                  Open SSH
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onOpenLogs?.(server.id)}>
                  <Activity className="h-4 w-4 mr-2" />
                  View Logs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewDetails?.(server.id)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a
                    href="https://vast.ai/console/instances"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Vast.ai Console
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Stats Row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Uptime:</span>
            <span className="font-medium">{server.uptime}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Last seen {formatTimestamp(server.lastSeen)}
          </span>
        </div>

        {/* GPU Quick Stats */}
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="h-4 w-4 text-green-600" />
            <span className="font-medium">{server.gpu.model}</span>
            <Badge variant="outline" className="ml-auto">
              {server.gpu.vram} GB VRAM
            </Badge>
          </div>
          <GPUStatsRow gpu={server.gpu} />
        </div>

        {/* Usage Bars */}
        <div className="space-y-3">
          <UsageBar
            used={server.memory.used}
            total={server.memory.total}
            label="Memory"
            icon={MemoryStick}
            iconColor="text-blue-600"
          />
          <UsageBar
            used={server.disk.used}
            total={server.disk.total}
            label="Disk"
            icon={HardDrive}
            iconColor="text-purple-600"
          />
        </div>

        {/* Network */}
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Network</span>
          </div>
          <NetworkStatsRow network={server.network} />
        </div>

        {/* Vast.ai Earnings */}
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-medium">Vast.ai</span>
            </div>
            <Badge variant={server.vastai.isRented ? 'warning' : 'success'}>
              {server.vastai.isRented ? 'Rented' : 'Available'}
            </Badge>
          </div>
          <EarningsSummaryRow earnings={mockEarnings} />
          <div className="mt-2 text-sm text-muted-foreground">
            Rate: <span className="font-medium text-foreground">${server.vastai.hourlyRate.toFixed(2)}/hr</span>
            <span className="mx-2">|</span>
            Uptime: <span className="font-medium text-foreground">{server.vastai.uptimePercentage.toFixed(1)}%</span>
          </div>
        </div>

        {/* Ollama Status */}
        <OllamaStatus ollama={server.ollama} />

        {/* Expandable Services Section */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Services ({server.services.length})
            </span>
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </motion.span>
          </Button>
          <motion.div
            initial={false}
            animate={{ height: isExpanded ? 'auto' : 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-2 space-y-1 divide-y divide-border/50">
              {server.services.map((service) => (
                <ServiceItem
                  key={service.name}
                  service={service}
                  onRestart={() => onRestartService?.(server.id, service.name)}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Tags */}
        {server.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {server.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPACT SERVER CARD (for list views)
// ============================================================================

interface CompactServerCardProps {
  server: GPUServer;
  onClick?: () => void;
  className?: string;
  rgbEnabled?: boolean;
  rgbColor?: RGBColor;
}

export function CompactServerCard({
  server,
  onClick,
  className,
  rgbEnabled = true,
  rgbColor = { r: 255, g: 140, b: 0 },
}: CompactServerCardProps) {
  return (
    <Card
      interactive
      className={cn('cursor-pointer', className)}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
              <Server className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-medium">{server.name}</p>
              <p className="text-sm text-muted-foreground">{server.gpu.model}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RGBIndicator
              color={rgbColor}
              enabled={rgbEnabled}
              mode="Breathing"
              size="sm"
            />
            <div className="text-right">
              <p className="font-semibold text-green-600">
                {formatCurrency(server.vastai.totalEarnings)}
              </p>
              <p className="text-xs text-muted-foreground">today</p>
            </div>
            <StatusBadge status={server.status} />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Activity className={cn('h-4 w-4', getUtilizationColor(server.gpu.utilization))} />
            <span>{server.gpu.utilization}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Thermometer className={cn('h-4 w-4', getTemperatureColor(server.gpu.temperature))} />
            <span>{server.gpu.temperature}C</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4 text-amber-500" />
            <span>{server.gpu.power}W</span>
          </div>
          {server.ollama?.running && (
            <div className="flex items-center gap-1">
              <Brain className="h-4 w-4 text-purple-500" />
              <span>{server.ollama.modelsLoaded.length} models</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ServerCard;
