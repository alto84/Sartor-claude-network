'use client';

/**
 * Earnings Widget
 *
 * Displays Vast.ai rental earnings with breakdowns by time period,
 * rental history, and uptime statistics.
 *
 * @module components/servers/earnings-widget
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Calendar,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { EarningsBreakdown, RentalHistoryItem, VastaiRentalInfo } from '@/lib/server-api';
import { formatCurrency } from '@/lib/server-api';
import { formatTimestamp } from '@/lib/utils';
import {
  staggerContainerVariants,
  staggerItemVariants,
} from '@/lib/animations';

// ============================================================================
// TYPES
// ============================================================================

interface EarningsWidgetProps {
  earnings: EarningsBreakdown;
  rentalHistory?: RentalHistoryItem[];
  vastai?: VastaiRentalInfo;
  className?: string;
  compact?: boolean;
}

interface EarningCardProps {
  label: string;
  amount: number;
  previousAmount?: number;
  icon?: React.ElementType;
  iconColor?: string;
  className?: string;
}

// ============================================================================
// EARNING CARD COMPONENT
// ============================================================================

function EarningCard({
  label,
  amount,
  previousAmount,
  icon: Icon = DollarSign,
  iconColor = 'text-green-600',
  className,
}: EarningCardProps) {
  const percentChange = previousAmount
    ? ((amount - previousAmount) / previousAmount) * 100
    : 0;
  const isPositive = percentChange >= 0;

  return (
    <motion.div
      variants={staggerItemVariants}
      className={cn(
        'p-4 rounded-lg border bg-card hover:shadow-md transition-shadow',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(amount)}
          </p>
        </div>
        <div className={cn('p-2 rounded-lg bg-muted/50', iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {previousAmount !== undefined && previousAmount > 0 && (
        <div className="mt-2 flex items-center gap-1 text-sm">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
          <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
            {isPositive ? '+' : ''}
            {percentChange.toFixed(1)}%
          </span>
          <span className="text-muted-foreground">vs last period</span>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// RENTAL HISTORY ITEM COMPONENT
// ============================================================================

interface RentalItemProps {
  rental: RentalHistoryItem;
}

function RentalItem({ rental }: RentalItemProps) {
  return (
    <motion.div
      variants={staggerItemVariants}
      className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <Users className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="font-medium text-sm">{rental.renterUsername}</p>
          <p className="text-xs text-muted-foreground">
            {formatTimestamp(rental.endedAt)} - {rental.duration}h
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-green-600">{formatCurrency(rental.earnings)}</p>
        <p className="text-xs text-muted-foreground">{rental.gpuModel}</p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// UPTIME INDICATOR COMPONENT
// ============================================================================

interface UptimeIndicatorProps {
  percentage: number;
  className?: string;
}

function UptimeIndicator({ percentage, className }: UptimeIndicatorProps) {
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative w-28 h-28', className)}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/20"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          className="text-green-500"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-green-600">{percentage.toFixed(1)}%</span>
        <span className="text-xs text-muted-foreground">Uptime</span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN EARNINGS WIDGET
// ============================================================================

export function EarningsWidget({
  earnings,
  rentalHistory = [],
  vastai,
  className,
  compact = false,
}: EarningsWidgetProps) {
  const [showAllHistory, setShowAllHistory] = React.useState(false);
  const displayedHistory = showAllHistory ? rentalHistory : rentalHistory.slice(0, 3);

  if (compact) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            Vast.ai Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(earnings.today)}
              </p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">
                {formatCurrency(earnings.thisMonth)}
              </p>
              <p className="text-xs text-muted-foreground">This Month</p>
            </div>
          </div>
          {vastai && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <Badge variant={vastai.isRented ? 'warning' : 'success'}>
                {vastai.isRented ? 'Rented' : 'Available'}
              </Badge>
              <span className="text-muted-foreground">
                ${vastai.hourlyRate.toFixed(2)}/hr
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          Vast.ai Earnings
        </CardTitle>
        <CardDescription>
          GPU rental earnings and statistics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Earnings Grid */}
        <motion.div
          variants={staggerContainerVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-3"
        >
          <EarningCard
            label="Today"
            amount={earnings.today}
            previousAmount={earnings.yesterday}
            icon={Sparkles}
            iconColor="text-amber-600"
          />
          <EarningCard
            label="This Week"
            amount={earnings.thisWeek}
            previousAmount={earnings.lastWeek}
            icon={Calendar}
            iconColor="text-blue-600"
          />
          <EarningCard
            label="This Month"
            amount={earnings.thisMonth}
            previousAmount={earnings.lastMonth}
            icon={TrendingUp}
            iconColor="text-green-600"
          />
          <EarningCard
            label="All Time"
            amount={earnings.allTime}
            icon={DollarSign}
            iconColor="text-purple-600"
          />
        </motion.div>

        {/* Stats Row */}
        {vastai && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <UptimeIndicator percentage={vastai.uptimePercentage} />
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{vastai.totalRentals}</p>
                <p className="text-xs text-muted-foreground">Total Rentals</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{vastai.averageRentalDuration.toFixed(1)}h</p>
                <p className="text-xs text-muted-foreground">Avg Duration</p>
              </div>
              <div className="col-span-2">
                <Badge
                  variant={vastai.isRented ? 'warning' : 'success'}
                  className="text-sm"
                >
                  {vastai.isRented ? 'Currently Rented' : 'Available for Rent'}
                </Badge>
                <p className="text-sm mt-1">
                  <span className="font-semibold">${vastai.hourlyRate.toFixed(2)}</span>
                  <span className="text-muted-foreground">/hour</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rental History */}
        {rentalHistory.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Recent Rentals
              </h4>
              {rentalHistory.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllHistory(!showAllHistory)}
                >
                  {showAllHistory ? 'Show Less' : 'View All'}
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 ml-1 transition-transform',
                      showAllHistory && 'rotate-90'
                    )}
                  />
                </Button>
              )}
            </div>
            <ScrollArea className={showAllHistory ? 'h-64' : undefined}>
              <motion.div
                variants={staggerContainerVariants}
                initial="initial"
                animate="animate"
              >
                {displayedHistory.map((rental) => (
                  <RentalItem key={rental.id} rental={rental} />
                ))}
              </motion.div>
            </ScrollArea>
          </div>
        )}

        {/* Quick Link to Vast.ai */}
        <Button variant="outline" className="w-full" asChild>
          <a
            href="https://vast.ai/console/instances"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Vast.ai Console
            <ArrowUpRight className="h-4 w-4 ml-2" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EARNINGS SUMMARY ROW (for inline display)
// ============================================================================

interface EarningsSummaryRowProps {
  earnings: EarningsBreakdown;
  className?: string;
}

export function EarningsSummaryRow({ earnings, className }: EarningsSummaryRowProps) {
  return (
    <div className={cn('flex items-center gap-4 flex-wrap', className)}>
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground">Today:</span>
        <span className="font-semibold text-green-600">
          {formatCurrency(earnings.today)}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground">Week:</span>
        <span className="font-semibold">{formatCurrency(earnings.thisWeek)}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground">Month:</span>
        <span className="font-semibold">{formatCurrency(earnings.thisMonth)}</span>
      </div>
    </div>
  );
}

export default EarningsWidget;
