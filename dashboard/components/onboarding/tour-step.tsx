"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  ArrowLeft,
  Calendar,
  CheckSquare,
  Home,
  Brain,
  MessageCircle,
  LayoutDashboard,
} from "lucide-react";
import { brand } from "@/lib/brand";

interface TourStepProps {
  onNext: () => void;
  onBack: () => void;
}

const tourSlides = [
  {
    id: "dashboard",
    title: "Your Family Dashboard",
    description:
      "See everyone's schedule, tasks, and home status at a glance. Your daily command center for family life.",
    icon: LayoutDashboard,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    preview: (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm font-medium">Good Morning!</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-lg p-4 border">
            <div className="text-xs text-muted-foreground mb-2">Today</div>
            <div className="text-2xl font-bold">3 Events</div>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <div className="text-xs text-muted-foreground mb-2">Tasks</div>
            <div className="text-2xl font-bold">5 Pending</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "calendar",
    title: "Unified Calendar",
    description:
      "All family schedules in one view. Color-coded by person, synced in real-time. Never miss an event again.",
    icon: Calendar,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    preview: (
      <div className="p-6 space-y-3">
        {[
          { time: "9:00 AM", event: "School Drop-off", color: "bg-green-500" },
          { time: "11:00 AM", event: "Doctor Appointment", color: "bg-blue-500" },
          { time: "3:00 PM", event: "Soccer Practice", color: "bg-orange-500" },
          { time: "6:00 PM", event: "Family Dinner", color: "bg-purple-500" },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 p-3 bg-card rounded-lg border"
          >
            <div className={`w-3 h-3 rounded-full ${item.color}`} />
            <span className="text-sm text-muted-foreground w-20">{item.time}</span>
            <span className="text-sm font-medium">{item.event}</span>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: "tasks",
    title: "Shared Task Lists",
    description:
      "Assign chores, track homework, manage shopping lists. Everyone knows what they need to do.",
    icon: CheckSquare,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    preview: (
      <div className="p-6 space-y-3">
        {[
          { task: "Take out trash", person: "Dad", done: true },
          { task: "Do homework", person: "Emma", done: false },
          { task: "Grocery shopping", person: "Mom", done: false },
          { task: "Clean room", person: "Jake", done: true },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 p-3 bg-card rounded-lg border"
          >
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                item.done ? "bg-green-500 border-green-500" : "border-gray-300"
              }`}
            >
              {item.done && (
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  className="w-3 h-3 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M5 13l4 4L19 7" />
                </motion.svg>
              )}
            </div>
            <span
              className={`text-sm flex-1 ${
                item.done ? "line-through text-muted-foreground" : "font-medium"
              }`}
            >
              {item.task}
            </span>
            <span className="text-xs text-muted-foreground">{item.person}</span>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: "smart-home",
    title: "Smart Home Control",
    description:
      "Control lights, locks, thermostat and more. Set scenes for bedtime, movie night, or leaving home.",
    icon: Home,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    preview: (
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: "Living Room", status: "On", icon: "💡" },
            { name: "Front Door", status: "Locked", icon: "🔒" },
            { name: "Thermostat", status: "72°F", icon: "🌡️" },
            { name: "Security", status: "Armed", icon: "🛡️" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-lg p-4 border text-center"
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-sm font-medium">{item.name}</div>
              <div className="text-xs text-muted-foreground">{item.status}</div>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "ai",
    title: "AI Assistant",
    description:
      "Ask anything about your family's schedule. Get smart reminders and suggestions based on your routines.",
    icon: Brain,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    preview: (
      <div className="p-6 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            👤
          </div>
          <div className="bg-muted rounded-2xl rounded-tl-none p-3 text-sm">
            What&apos;s happening tomorrow?
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3 flex-row-reverse"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-none p-3 text-sm max-w-[200px]">
            Tomorrow you have 2 meetings and Jake has soccer at 4pm. Don&apos;t forget his cleats!
          </div>
        </motion.div>
      </div>
    ),
  },
];

export function TourStep({ onNext, onBack }: TourStepProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);

  const slide = tourSlides[currentSlide];
  const Icon = slide.icon;

  useEffect(() => {
    if (!autoAdvance) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        if (prev < tourSlides.length - 1) {
          return prev + 1;
        }
        setAutoAdvance(false);
        return prev;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [autoAdvance]);

  const goToSlide = (index: number) => {
    setAutoAdvance(false);
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setAutoAdvance(false);
    if (currentSlide < tourSlides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    setAutoAdvance(false);
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
        >
          <MessageCircle className="h-8 w-8 text-primary" />
        </motion.div>

        <h2 className="text-2xl font-bold mb-2">Quick Tour</h2>
        <p className="text-muted-foreground">
          Here&apos;s what you can do with {brand.name}
        </p>
      </div>

      {/* Tour Preview Card */}
      <Card className="mb-6 overflow-hidden">
        <div className={`p-4 border-b ${slide.bgColor}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-background flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${slide.color}`} />
            </div>
            <div>
              <h3 className="font-semibold">{slide.title}</h3>
              <p className="text-sm text-muted-foreground">{slide.description}</p>
            </div>
          </div>
        </div>
        <CardContent className="p-0 min-h-[250px] bg-muted/30">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {slide.preview}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Slide Navigation */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevSlide}
          disabled={currentSlide === 0}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex gap-2">
          {tourSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide
                  ? "bg-primary w-6"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={nextSlide}
          disabled={currentSlide === tourSlides.length - 1}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Almost Done!
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
