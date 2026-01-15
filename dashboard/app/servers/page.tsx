'use client';

/**
 * Solar Inference Server Management Page
 *
 * Main page for managing GPU servers, displaying real-time stats,
 * Vast.ai rental status, earnings, and network monitoring.
 *
 * @module app/servers/page
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sun,
  Cpu,
  Server,
  DollarSign,
  Wifi,
  RefreshCw,
  Plus,
  Settings,
  ExternalLink,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle2,
  Zap,
  BarChart3,
  Lightbulb,
} from 'lucide-react';
import { ServerCard } from '@/components/servers/server-card';
import { GPUMonitor } from '@/components/servers/gpu-monitor';
import { EarningsWidget } from '@/components/servers/earnings-widget';
import { NetworkStatus } from '@/components/servers/network-status';
import { RGBControl, QuickRGBToggle } from '@/components/servers/rgb-control';
import { RGB_PRESETS, setPreset, toggleAllRGB, type RGBColor } from '@/lib/rgb-api';
import {
  mockServers,
  mockEarnings,
  mockRentalHistory,
  plannedServers,
  fetchServers,
  fetchEarnings,
  fetchRentalHistory,
  formatCurrency,
  type GPUServer,
  type EarningsBreakdown,
  type RentalHistoryItem,
} from '@/lib/server-api';
import {
  staggerContainerVariants,
  staggerItemVariants,
  pageVariants,
} from '@/lib/animations';

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  iconColor,
  bgColor,
  trend,
  trendValue,
}: StatCardProps) {
  return (
    <motion.div variants={staggerItemVariants}>
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
              {subValue && (
                <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
              )}
              {trend && trendValue && (
                <div className="flex items-center gap-1 mt-1">
                  {trend === 'up' && (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  )}
                  {trend === 'down' && (
                    <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
                  )}
                  <span
                    className={cn(
                      'text-xs',
                      trend === 'up' ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {trendValue}
                  </span>
                </div>
              )}
            </div>
            <div className={cn('p-3 rounded-lg', bgColor)}>
              <Icon className={cn('h-6 w-6', iconColor)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// SOLAR INFERENCE HEADER
// ============================================================================

interface SolarInferenceHeaderProps {
  rgbEnabled: boolean;
  rgbColor: RGBColor;
  onRgbToggle: () => void;
  onRgbPreset: (presetId: string) => void;
}

function SolarInferenceHeader({
  rgbEnabled,
  rgbColor,
  onRgbToggle,
  onRgbPreset,
}: SolarInferenceHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-500 shadow-lg shadow-orange-500/30">
          <Sun className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Solar Inference
            <Cpu className="h-5 w-5 text-green-600" />
          </h1>
          <p className="text-muted-foreground">
            GPU Server Management & Vast.ai Rentals
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* Quick RGB Controls */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <QuickRGBToggle
            enabled={rgbEnabled}
            color={rgbColor}
            onToggle={onRgbToggle}
            onPreset={onRgbPreset}
          />
        </div>
        <Button variant="outline" size="sm" asChild>
          <a
            href="https://vast.ai/console/instances"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Vast.ai Console
          </a>
        </Button>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// QUICK ACTIONS
// ============================================================================

interface QuickAction {
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
}

function QuickActions() {
  const actions: QuickAction[] = [
    {
      label: 'SSH Connect',
      description: 'Open terminal',
      icon: Server,
      color: 'text-blue-600',
    },
    {
      label: 'View Logs',
      description: 'System logs',
      icon: Activity,
      color: 'text-purple-600',
    },
    {
      label: 'Speed Test',
      description: 'Check network',
      icon: Wifi,
      color: 'text-cyan-600',
    },
    {
      label: 'Update Rate',
      description: 'Vast.ai pricing',
      icon: DollarSign,
      color: 'text-green-600',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-600" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto py-3 flex-col gap-1"
              onClick={action.onClick}
            >
              <action.icon className={cn('h-5 w-5', action.color)} />
              <span className="text-xs font-medium">{action.label}</span>
              <span className="text-xs text-muted-foreground">
                {action.description}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// PLANNED SERVERS SECTION
// ============================================================================

function PlannedServersSection() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Plus className="h-4 w-4 text-muted-foreground" />
          Planned Expansion
        </CardTitle>
        <CardDescription>
          Future GPU servers for Solar Inference
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {plannedServers.map((server) => (
            <div
              key={server.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-dashed"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Server className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">
                    {server.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {server.gpu?.model}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-muted-foreground">
                {server.gpu?.vram} GB VRAM
              </Badge>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Budget allocation: 3-5 RTX PRO 6000 Blackwell GPUs
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ServersPage() {
  const [servers, setServers] = React.useState<GPUServer[]>(mockServers);
  const [earnings, setEarnings] = React.useState<EarningsBreakdown>(mockEarnings);
  const [rentalHistory, setRentalHistory] = React.useState<RentalHistoryItem[]>(mockRentalHistory);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [selectedServer, setSelectedServer] = React.useState<GPUServer | null>(
    servers[0] || null
  );

  // RGB State
  const [rgbEnabled, setRgbEnabled] = React.useState(true);
  const [rgbColor, setRgbColor] = React.useState<RGBColor>({ r: 255, g: 140, b: 0 });

  // RGB handlers
  const handleRgbToggle = async () => {
    await toggleAllRGB(!rgbEnabled);
    setRgbEnabled(!rgbEnabled);
  };

  const handleRgbPreset = async (presetId: string) => {
    const result = await setPreset(presetId);
    if (result.success && result.preset) {
      setRgbColor(result.preset.color);
      setRgbEnabled(presetId !== 'off');
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const [newServers, newEarnings, newHistory] = await Promise.all([
        fetchServers(),
        fetchEarnings(),
        fetchRentalHistory(),
      ]);
      setServers(newServers);
      setEarnings(newEarnings);
      setRentalHistory(newHistory);
      if (newServers.length > 0) {
        setSelectedServer(newServers[0]);
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals
  const totalGPUs = servers.length;
  const onlineGPUs = servers.filter((s) => s.status === 'online' || s.status === 'rented').length;
  const todayEarnings = earnings.today;
  const monthlyEarnings = earnings.thisMonth;

  // Calculate average uptime
  const avgUptime = servers.reduce((acc, s) => acc + s.vastai.uptimePercentage, 0) / servers.length;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header */}
      <SolarInferenceHeader
        rgbEnabled={rgbEnabled}
        rgbColor={rgbColor}
        onRgbToggle={handleRgbToggle}
        onRgbPreset={handleRgbPreset}
      />

      {/* Stats Overview */}
      <motion.div
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <StatCard
          label="Total GPUs"
          value={totalGPUs}
          subValue={`${onlineGPUs} online`}
          icon={Cpu}
          iconColor="text-green-600"
          bgColor="bg-green-100 dark:bg-green-900/30"
        />
        <StatCard
          label="Today's Earnings"
          value={formatCurrency(todayEarnings)}
          subValue="from rentals"
          icon={DollarSign}
          iconColor="text-amber-600"
          bgColor="bg-amber-100 dark:bg-amber-900/30"
          trend="up"
          trendValue="+12.5%"
        />
        <StatCard
          label="Monthly Revenue"
          value={formatCurrency(monthlyEarnings)}
          subValue="this month"
          icon={BarChart3}
          iconColor="text-blue-600"
          bgColor="bg-blue-100 dark:bg-blue-900/30"
          trend="up"
          trendValue="+8.2%"
        />
        <StatCard
          label="Avg Uptime"
          value={`${avgUptime.toFixed(1)}%`}
          subValue="across all servers"
          icon={Clock}
          iconColor="text-purple-600"
          bgColor="bg-purple-100 dark:bg-purple-900/30"
        />
      </motion.div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="servers" className="gap-2">
              <Server className="h-4 w-4" />
              Servers
            </TabsTrigger>
            <TabsTrigger value="earnings" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Earnings
            </TabsTrigger>
            <TabsTrigger value="network" className="gap-2">
              <Wifi className="h-4 w-4" />
              Network
            </TabsTrigger>
            <TabsTrigger value="rgb" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              RGB
            </TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')}
            />
            Refresh
          </Button>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Server Cards */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Server className="h-4 w-4" />
                Active Servers
              </h3>
              {servers.map((server) => (
                <ServerCard
                  key={server.id}
                  server={server}
                  onViewDetails={(id) => console.log('View details:', id)}
                  onRestartService={(id, name) =>
                    console.log('Restart service:', id, name)
                  }
                  onOpenLogs={(id) => console.log('Open logs:', id)}
                  onOpenSSH={(id) => console.log('Open SSH:', id)}
                />
              ))}
            </div>

            {/* Side Widgets */}
            <div className="space-y-4">
              {selectedServer && (
                <>
                  <GPUMonitor gpu={selectedServer.gpu} compact />
                  <EarningsWidget
                    earnings={earnings}
                    rentalHistory={rentalHistory}
                    vastai={selectedServer.vastai}
                    compact
                  />
                  <NetworkStatus
                    network={selectedServer.network}
                    serverId={selectedServer.id}
                    compact
                  />
                  <RGBControl compact />
                </>
              )}
              <PlannedServersSection />
            </div>
          </div>
        </TabsContent>

        {/* Servers Tab */}
        <TabsContent value="servers" className="mt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {servers.map((server) => (
                  <ServerCard
                    key={server.id}
                    server={server}
                    expanded
                    onViewDetails={(id) => console.log('View details:', id)}
                    onRestartService={(id, name) =>
                      console.log('Restart service:', id, name)
                    }
                    onOpenLogs={(id) => console.log('Open logs:', id)}
                    onOpenSSH={(id) => console.log('Open SSH:', id)}
                  />
                ))}
              </div>
            </div>
            <div>
              <PlannedServersSection />
            </div>
          </div>
        </TabsContent>

        {/* Earnings Tab */}
        <TabsContent value="earnings" className="mt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <EarningsWidget
              earnings={earnings}
              rentalHistory={rentalHistory}
              vastai={selectedServer?.vastai}
            />
            <div className="space-y-4">
              {selectedServer && (
                <GPUMonitor gpu={selectedServer.gpu} />
              )}
            </div>
          </div>
        </TabsContent>

        {/* Network Tab */}
        <TabsContent value="network" className="mt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {selectedServer && (
              <NetworkStatus
                network={selectedServer.network}
                serverId={selectedServer.id}
                onSpeedTestComplete={(result) => {
                  // Update network info
                  setServers((prev) =>
                    prev.map((s) =>
                      s.id === selectedServer.id
                        ? { ...s, network: result }
                        : s
                    )
                  );
                }}
              />
            )}
            <div className="space-y-4">
              {selectedServer && (
                <>
                  <GPUMonitor gpu={selectedServer.gpu} compact />
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Network Requirements</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                      <div className="flex justify-between">
                        <span>Minimum Upload</span>
                        <span className="font-medium text-foreground">100 Mbps</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Minimum Download</span>
                        <span className="font-medium text-foreground">200 Mbps</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Maximum Latency</span>
                        <span className="font-medium text-foreground">50 ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vast.ai Verification</span>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* RGB Tab */}
        <TabsContent value="rgb" className="mt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <RGBControl serverId="gpuserver1" />
            <div className="space-y-4">
              {selectedServer && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        RGB Hardware
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-3">
                      <div className="flex justify-between items-center py-2 border-b">
                        <div>
                          <p className="font-medium">ENE DRAM</p>
                          <p className="text-muted-foreground">2x RAM Modules (8 LEDs each)</p>
                        </div>
                        <Badge variant="success">Connected</Badge>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <div>
                          <p className="font-medium">ASUS Z790 GAMING WIFI7</p>
                          <p className="text-muted-foreground">4 Zones (36 LEDs total)</p>
                        </div>
                        <Badge variant="success">Connected</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">OpenRGB Server</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                      <div className="flex justify-between">
                        <span>Host</span>
                        <span className="font-medium text-foreground">gpuserver1.local</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Port</span>
                        <span className="font-medium text-foreground">6742</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Version</span>
                        <span className="font-medium text-foreground">0.9</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status</span>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <GPUMonitor gpu={selectedServer.gpu} compact />
                </>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
