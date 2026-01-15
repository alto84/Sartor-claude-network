"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Timer,
  Plus,
  Plane,
  Gift,
  PartyPopper,
  GraduationCap,
  TreePine,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownEvent {
  id: string;
  title: string;
  date: Date;
  icon: string;
  color: string;
  bgColor: string;
}

const eventIcons: { [key: string]: React.ElementType } = {
  vacation: Plane,
  birthday: Gift,
  party: PartyPopper,
  graduation: GraduationCap,
  holiday: TreePine,
  special: Sparkles,
};

// Sample countdown events - in production this would come from your data store
const sampleEvents: CountdownEvent[] = [
  {
    id: "1",
    title: "Hawaii Vacation",
    date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    icon: "vacation",
    color: "text-sky-600 dark:text-sky-400",
    bgColor: "bg-sky-100 dark:bg-sky-900/30",
  },
  {
    id: "2",
    title: "Emma's Birthday",
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    icon: "birthday",
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
  },
  {
    id: "3",
    title: "Christmas",
    date: new Date(new Date().getFullYear(), 11, 25),
    icon: "holiday",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  {
    id: "4",
    title: "Spring Break",
    date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    icon: "vacation",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
];

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const now = new Date().getTime();
  const target = new Date(targetDate).getTime();
  const difference = target - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
    total: difference,
  };
}

function TimeUnit({
  value,
  label,
  isUrgent,
}: {
  value: number;
  label: string;
  isUrgent: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={cn(
          "text-2xl sm:text-3xl font-bold tabular-nums transition-all duration-300",
          isUrgent ? "text-red-600 dark:text-red-400 animate-pulse" : ""
        )}
      >
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function CountdownTimer({
  event,
  isExpanded,
}: {
  event: CountdownEvent;
  isExpanded: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(
    calculateTimeLeft(event.date)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(event.date));
    }, 1000);

    return () => clearInterval(timer);
  }, [event.date]);

  const IconComponent = eventIcons[event.icon] || Sparkles;
  const isUrgent = timeLeft.days < 3 && timeLeft.total > 0;
  const isToday = timeLeft.days === 0 && timeLeft.total > 0;
  const isPast = timeLeft.total <= 0;

  if (isPast) {
    return (
      <div className="flex items-center justify-between py-3 opacity-50">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", event.bgColor)}>
            <IconComponent className={cn("h-4 w-4", event.color)} />
          </div>
          <span className="text-sm font-medium line-through">{event.title}</span>
        </div>
        <span className="text-xs text-muted-foreground">Event passed</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "transition-all duration-300",
        isExpanded
          ? "p-4 rounded-xl border-2 mb-3"
          : "py-3 border-b last:border-b-0",
        isExpanded && isUrgent
          ? "border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20"
          : isExpanded
          ? "border-muted bg-muted/30"
          : ""
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-lg transition-transform",
              event.bgColor,
              isUrgent && "animate-bounce"
            )}
          >
            <IconComponent className={cn("h-4 w-4", event.color)} />
          </div>
          <div>
            <span className="text-sm font-medium">{event.title}</span>
            <p className="text-xs text-muted-foreground">
              {event.date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        {!isExpanded && (
          <div className="text-right">
            {isToday ? (
              <span className="text-sm font-bold text-green-600 dark:text-green-400 animate-pulse">
                Today!
              </span>
            ) : timeLeft.days === 1 ? (
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                Tomorrow
              </span>
            ) : (
              <span
                className={cn(
                  "text-sm font-semibold",
                  isUrgent ? "text-red-600 dark:text-red-400" : ""
                )}
              >
                {timeLeft.days} days
              </span>
            )}
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <TimeUnit value={timeLeft.days} label="Days" isUrgent={isUrgent} />
          <div className="text-2xl text-muted-foreground/50">:</div>
          <TimeUnit value={timeLeft.hours} label="Hours" isUrgent={isUrgent} />
          <div className="text-2xl text-muted-foreground/50">:</div>
          <TimeUnit value={timeLeft.minutes} label="Mins" isUrgent={isUrgent} />
          <div className="text-2xl text-muted-foreground/50">:</div>
          <TimeUnit value={timeLeft.seconds} label="Secs" isUrgent={isUrgent} />
        </div>
      )}

      {isExpanded && isUrgent && (
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium">
            <Sparkles className="h-3 w-3" />
            Coming up soon!
          </span>
        </div>
      )}
    </div>
  );
}

export function CountdownWidget() {
  const [events, setEvents] = useState<CountdownEvent[]>(sampleEvents);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Sort by date and filter out past events
  const sortedEvents = [...events]
    .filter((e) => calculateTimeLeft(e.date).total > 0)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const displayedEvents = showAll ? sortedEvents : sortedEvents.slice(0, 3);
  const hasMoreEvents = sortedEvents.length > 3;

  // Auto-expand the nearest event
  useEffect(() => {
    if (sortedEvents.length > 0 && !expandedEventId) {
      setExpandedEventId(sortedEvents[0].id);
    }
  }, [sortedEvents, expandedEventId]);

  const toggleExpand = (eventId: string) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-violet-100 dark:bg-violet-900/50">
            <Timer className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <CardTitle className="text-lg">Countdowns</CardTitle>
        </div>
        <Button variant="ghost" size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {sortedEvents.length === 0 ? (
          <div className="text-center py-8">
            <Timer className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-2">No upcoming events</p>
            <Button variant="outline" size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add Countdown
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {displayedEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => toggleExpand(event.id)}
                className="cursor-pointer"
              >
                <CountdownTimer
                  event={event}
                  isExpanded={expandedEventId === event.id}
                />
              </div>
            ))}

            {hasMoreEvents && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 gap-1"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show {sortedEvents.length - 3} More
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Fun animation element for events happening today */}
        {sortedEvents.some(
          (e) =>
            calculateTimeLeft(e.date).days === 0 &&
            calculateTimeLeft(e.date).total > 0
        ) && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
              <PartyPopper className="h-5 w-5 animate-bounce" />
              <span className="font-medium">Something special today!</span>
              <PartyPopper className="h-5 w-5 animate-bounce" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
