'use client';

/**
 * Network Status Widget
 *
 * Displays network monitoring information including upload/download speeds,
 * latency, Vast.ai verification status, and speed test functionality.
 *
 * @module components/servers/network-status
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Wifi,
  ArrowUp,
  ArrowDown,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Gauge,
  Globe,
  Shield,
} from 'lucide-react';
import type { NetworkInfo } from '@/lib/server-api';
import { runSpeedTest } from '@/lib/server-api';
import { formatTimestamp } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface NetworkStatusProps {
  network: NetworkInfo;
  serverId: string;
  onSpeedTestComplete?: (result: NetworkInfo) => void;
  className?: string;
  compact?: boolean;
}

interface SpeedGaugeProps {
  speed: number;
  maxSpeed: number;
  label: string;
  icon: React.ElementType;
  iconColor: string;
  unit?: string;
}

// ============================================================================
// SPEED GAUGE COMPONENT
// ============================================================================

function SpeedGauge({
  speed,
  maxSpeed,
  label,
  icon: Icon,
  iconColor,
  unit = 'Mbps',
}: SpeedGaugeProps) {
  const percentage = Math.min((speed / maxSpeed) * 100, 100);

  return (
    <div className="flex-1 p-4 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('h-4 w-4', iconColor)} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold">{speed.toFixed(0)}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full',
            iconColor === 'text-green-600'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// LATENCY INDICATOR
// ============================================================================

interface LatencyIndicatorProps {
  latency: number;
  className?: string;
}

function LatencyIndicator({ latency, className }: LatencyIndicatorProps) {
  const getLatencyColor = (ms: number) => {
    if (ms < 20) return 'text-green-600';
    if (ms < 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getLatencyLabel = (ms: number) => {
    if (ms < 20) return 'Excellent';
    if (ms < 50) return 'Good';
    if (ms < 100) return 'Fair';
    return 'Poor';
  };

  return (
    <div className={cn('flex items-center gap-3 p-4 rounded-lg bg-muted/50', className)}>
      <div className="p-2 rounded-lg bg-background">
        <Activity className={cn('h-5 w-5', getLatencyColor(latency))} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Latency</p>
        <div className="flex items-baseline gap-2">
          <span className={cn('text-xl font-bold', getLatencyColor(latency))}>
            {latency.toFixed(0)}
          </span>
          <span className="text-sm text-muted-foreground">ms</span>
          <Badge
            variant="outline"
            className={cn('ml-2', getLatencyColor(latency))}
          >
            {getLatencyLabel(latency)}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VERIFICATION STATUS
// ============================================================================

interface VerificationStatusProps {
  verified: boolean;
  publicIp: string;
  className?: string;
}

function VerificationStatus({ verified, publicIp, className }: VerificationStatusProps) {
  return (
    <div className={cn('p-4 rounded-lg border', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-2 rounded-lg',
              verified ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
            )}
          >
            {verified ? (
              <Shield className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
          </div>
          <div>
            <p className="font-medium">Vast.ai Verification</p>
            <p className="text-sm text-muted-foreground">
              {verified ? 'Network verified and ready' : 'Verification pending'}
            </p>
          </div>
        </div>
        <Badge variant={verified ? 'success' : 'destructive'}>
          {verified ? 'Verified' : 'Unverified'}
        </Badge>
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Globe className="h-4 w-4" />
        <span>Public IP: {publicIp}</span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN NETWORK STATUS COMPONENT
// ============================================================================

export function NetworkStatus({
  network,
  serverId,
  onSpeedTestComplete,
  className,
  compact = false,
}: NetworkStatusProps) {
  const [isRunningSpeedTest, setIsRunningSpeedTest] = React.useState(false);
  const [currentNetwork, setCurrentNetwork] = React.useState(network);

  const handleSpeedTest = async () => {
    setIsRunningSpeedTest(true);
    try {
      const result = await runSpeedTest(serverId);
      setCurrentNetwork(result);
      onSpeedTestComplete?.(result);
    } catch (error) {
      console.error('Speed test failed:', error);
    } finally {
      setIsRunningSpeedTest(false);
    }
  };

  if (compact) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wifi className="h-4 w-4 text-blue-600" />
            Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <ArrowUp className="h-4 w-4 text-green-600" />
                <span className="font-semibold">{currentNetwork.uploadSpeed.toFixed(0)}</span>
                <span className="text-xs text-muted-foreground">Mbps</span>
              </div>
              <div className="flex items-center gap-1">
                <ArrowDown className="h-4 w-4 text-blue-600" />
                <span className="font-semibold">{currentNetwork.downloadSpeed.toFixed(0)}</span>
                <span className="text-xs text-muted-foreground">Mbps</span>
              </div>
            </div>
            <Badge variant={currentNetwork.vastaiVerified ? 'success' : 'warning'}>
              {currentNetwork.latency.toFixed(0)}ms
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
              <Wifi className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Network Status</CardTitle>
              <CardDescription>Connection speeds and verification</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSpeedTest}
            disabled={isRunningSpeedTest}
          >
            {isRunningSpeedTest ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Gauge className="h-4 w-4 mr-2" />
                Speed Test
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Speed Gauges */}
        <div className="flex gap-3">
          <SpeedGauge
            speed={currentNetwork.uploadSpeed}
            maxSpeed={1000}
            label="Upload"
            icon={ArrowUp}
            iconColor="text-green-600"
          />
          <SpeedGauge
            speed={currentNetwork.downloadSpeed}
            maxSpeed={3000}
            label="Download"
            icon={ArrowDown}
            iconColor="text-blue-600"
          />
        </div>

        {/* Latency */}
        <LatencyIndicator latency={currentNetwork.latency} />

        {/* Verification Status */}
        <VerificationStatus
          verified={currentNetwork.vastaiVerified}
          publicIp={currentNetwork.publicIp}
        />

        {/* Last Speed Test */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Last speed test</span>
          </div>
          <span>{formatTimestamp(currentNetwork.lastSpeedTest)}</span>
        </div>

        {/* Speed Test Animation */}
        <AnimatePresence>
          {isRunningSpeedTest && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <motion.div
                    className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
                <div>
                  <p className="font-medium text-blue-700 dark:text-blue-300">
                    Running Speed Test
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Testing connection to Vast.ai servers...
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// NETWORK STATS ROW (for inline display)
// ============================================================================

interface NetworkStatsRowProps {
  network: NetworkInfo;
  className?: string;
}

export function NetworkStatsRow({ network, className }: NetworkStatsRowProps) {
  return (
    <div className={cn('flex items-center gap-4 flex-wrap', className)}>
      <div className="flex items-center gap-1">
        <ArrowUp className="h-4 w-4 text-green-600" />
        <span className="text-sm font-medium">{network.uploadSpeed.toFixed(0)} Mbps</span>
      </div>
      <div className="flex items-center gap-1">
        <ArrowDown className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium">{network.downloadSpeed.toFixed(0)} Mbps</span>
      </div>
      <div className="flex items-center gap-1">
        <Activity className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-medium">{network.latency.toFixed(0)} ms</span>
      </div>
      {network.vastaiVerified ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600" />
      )}
    </div>
  );
}

export default NetworkStatus;
