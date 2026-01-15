"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  CheckSquare,
  Cloud,
  Sun,
  Zap,
  Plus,
  Mail,
  ShoppingCart,
  Home,
  Clock,
  Settings,
  LayoutGrid,
  Eye,
  EyeOff,
  GripVertical,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Import new widgets
import {
  QuoteWidget,
  BirthdaysWidget,
  WeeklySummaryWidget,
  QuickNotesWidget,
  FamilyPhotoWidget,
  CountdownWidget,
  ChoreChartWidget,
} from "@/components/widgets";

// Placeholder data
const upcomingEvents = [
  { id: 1, title: "AZ AI Innovation Meeting", time: "9:00 AM", color: "bg-blue-500" },
  { id: 2, title: "MKA Pickup - Vayu & Vishala", time: "3:00 PM", color: "bg-green-500" },
  { id: 3, title: "Vishala Gymnastics", time: "4:30 PM", color: "bg-orange-500" },
  { id: 4, title: "Family Dinner", time: "7:00 PM", color: "bg-purple-500" },
];

const tasks = [
  { id: 1, title: "Plan Vasu birthday party (Jan 14)", assignee: "Alton", done: false },
  { id: 2, title: "Solar Inference LLC - CPA call", assignee: "Alton", done: false },
  { id: 3, title: "Homework check", assignee: "Kids", done: true },
  { id: 4, title: "Sante Total IRS letter", assignee: "Alton", done: false },
];

const quickActions = [
  { icon: Mail, label: "Check Email", color: "text-blue-600" },
  { icon: ShoppingCart, label: "Add to List", color: "text-green-600" },
  { icon: Home, label: "Home Control", color: "text-orange-600" },
  { icon: Plus, label: "New Task", color: "text-purple-600" },
];

const familyMembers = [
  { name: "Alton", initials: "AS", status: "home" },
  { name: "Aneeta", initials: "AS", status: "work" },
  { name: "Vayu", initials: "VS", status: "school" },
  { name: "Vishala", initials: "VS", status: "school" },
  { name: "Vasu", initials: "VS", status: "home" },
];

// Widget configuration
interface WidgetConfig {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

const defaultWidgets: WidgetConfig[] = [
  { id: "family-status", name: "Family Status", enabled: true, order: 0 },
  { id: "quote", name: "Quote of the Day", enabled: true, order: 1 },
  { id: "calendar", name: "Today's Schedule", enabled: true, order: 2 },
  { id: "tasks", name: "Tasks", enabled: true, order: 3 },
  { id: "weather", name: "Weather", enabled: true, order: 4 },
  { id: "birthdays", name: "Upcoming Birthdays", enabled: true, order: 5 },
  { id: "countdown", name: "Countdowns", enabled: true, order: 6 },
  { id: "weekly-summary", name: "Weekly Summary", enabled: true, order: 7 },
  { id: "quick-notes", name: "Quick Notes", enabled: true, order: 8 },
  { id: "chore-chart", name: "Chore Chart", enabled: true, order: 9 },
  { id: "family-photo", name: "Family Photos", enabled: true, order: 10 },
  { id: "quick-actions", name: "Quick Actions", enabled: true, order: 11 },
  { id: "upcoming-week", name: "Upcoming This Week", enabled: true, order: 12 },
  { id: "home-status", name: "Home Status", enabled: true, order: 13 },
];

export default function DashboardPage() {
  const [showSettings, setShowSettings] = useState(false);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(defaultWidgets);

  // Load widget preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dashboard-widgets");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge saved preferences with default widgets (in case new widgets were added)
        const merged = defaultWidgets.map((dw) => {
          const saved = parsed.find((sw: WidgetConfig) => sw.id === dw.id);
          return saved ? { ...dw, ...saved } : dw;
        });
        setWidgets(merged);
      } catch (e) {
        console.error("Failed to parse saved widgets", e);
      }
    }
  }, []);

  // Save widget preferences
  const saveWidgets = (newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets);
    localStorage.setItem("dashboard-widgets", JSON.stringify(newWidgets));
  };

  const toggleWidget = (id: string) => {
    const newWidgets = widgets.map((w) =>
      w.id === id ? { ...w, enabled: !w.enabled } : w
    );
    saveWidgets(newWidgets);
  };

  const resetWidgets = () => {
    saveWidgets(defaultWidgets);
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const isWidgetEnabled = (id: string) => {
    return widgets.find((w) => w.id === id)?.enabled ?? true;
  };

  const enabledWidgets = widgets.filter((w) => w.enabled).sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{getGreeting()}, Alton!</h1>
          <p className="text-muted-foreground">{currentDate}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{currentTime}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            Customize
          </Button>
        </div>
      </div>

      {/* Widget Settings Panel */}
      {showSettings && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Dashboard Widgets</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={resetWidgets}>
                  Reset to Default
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowSettings(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription>
              Toggle widgets on or off to customize your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {widgets.map((widget) => (
                <button
                  key={widget.id}
                  onClick={() => toggleWidget(widget.id)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border transition-all text-left",
                    widget.enabled
                      ? "bg-primary/10 border-primary/30 text-foreground"
                      : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted"
                  )}
                >
                  {widget.enabled ? (
                    <Eye className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <EyeOff className="h-4 w-4 shrink-0" />
                  )}
                  <span className="text-sm truncate">{widget.name}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Family Members Quick View */}
      {isWidgetEnabled("family-status") && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Family Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {familyMembers.map((member) => (
                <div key={member.name} className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" alt={member.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {member.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quote of the Day - Full Width */}
      {isWidgetEnabled("quote") && <QuoteWidget />}

      {/* Main Grid - Row 1 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Calendar Widget */}
        {isWidgetEnabled("calendar") && (
          <Card className="md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Today&apos;s Schedule</CardTitle>
              </div>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${event.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {event.time}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tasks Widget */}
        {isWidgetEnabled("tasks") && (
          <Card className="md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Tasks</CardTitle>
              </div>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={task.done}
                      readOnly
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          task.done ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {task.title}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {task.assignee}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weather Widget */}
        {isWidgetEnabled("weather") && (
          <Card className="md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-sky-600" />
                <CardTitle className="text-lg">Weather</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sun className="h-10 w-10 text-yellow-500" />
                    <span className="text-4xl font-bold">72°F</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Partly Cloudy
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>High: 78°F</p>
                  <p>Low: 58°F</p>
                  <p className="mt-2 text-xs">Rain at 3pm</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Grid - Row 2: New Widgets */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isWidgetEnabled("birthdays") && <BirthdaysWidget />}
        {isWidgetEnabled("countdown") && <CountdownWidget />}
        {isWidgetEnabled("weekly-summary") && <WeeklySummaryWidget />}
      </div>

      {/* Main Grid - Row 3 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isWidgetEnabled("quick-notes") && <QuickNotesWidget />}
        {isWidgetEnabled("chore-chart") && <ChoreChartWidget />}
        {isWidgetEnabled("family-photo") && <FamilyPhotoWidget />}
      </div>

      {/* Quick Actions */}
      {isWidgetEnabled("quick-actions") && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </div>
            <CardDescription>Common tasks at your fingertips</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-20 flex-col gap-2"
                >
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                  <span className="text-xs">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        {isWidgetEnabled("upcoming-week") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">Parent-Teacher Conference</p>
                    <p className="text-sm text-muted-foreground">Wednesday, 4:00 PM</p>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">Vayu Dentist Appointment</p>
                    <p className="text-sm text-muted-foreground">Thursday, 10:00 AM</p>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2">
                  <div>
                    <p className="font-medium">Soccer Tournament</p>
                    <p className="text-sm text-muted-foreground">Saturday, 9:00 AM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isWidgetEnabled("home-status") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Home Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Thermostat</span>
                  <span className="font-medium">72°F</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Doors</span>
                  <span className="text-green-600 font-medium">All Locked</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Lights</span>
                  <span className="font-medium">3 On</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Security</span>
                  <span className="text-green-600 font-medium">Armed - Home</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
