"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  PartyPopper,
  ArrowRight,
  Sparkles,
  Calendar,
  CheckSquare,
  Home,
  Brain,
  Shield,
  Heart,
  Bird,
} from "lucide-react";
import confetti from "canvas-confetti";
import { FamilyMember, availableFeatures } from "@/lib/onboarding-storage";
import Link from "next/link";
import { brand } from "@/lib/brand";

interface CompleteStepProps {
  familyName: string;
  members: FamilyMember[];
  enabledFeatures: string[];
  onComplete: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  Calendar,
  CheckSquare,
  Home,
  Brain,
  Shield,
  Heart,
};

export function CompleteStep({
  familyName,
  members,
  enabledFeatures,
  onComplete,
}: CompleteStepProps) {
  const hasConfettiRun = useRef(false);

  useEffect(() => {
    if (hasConfettiRun.current) return;
    hasConfettiRun.current = true;

    // Fire confetti
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Left side confetti
      confetti({
        particleCount: Math.floor(particleCount / 2),
        startVelocity: 30,
        spread: 60,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#a855f7", "#ec4899", "#f97316", "#10b981", "#3b82f6"],
      });

      // Right side confetti
      confetti({
        particleCount: Math.floor(particleCount / 2),
        startVelocity: 30,
        spread: 60,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#a855f7", "#ec4899", "#f97316", "#10b981", "#3b82f6"],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const enabledFeaturesList = availableFeatures.filter((f) =>
    enabledFeatures.includes(f.id)
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-lg mx-auto text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/30"
      >
        <Bird className="h-12 w-12 text-white" />
      </motion.div>

      <motion.h1
        className="text-3xl font-bold mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Welcome, {familyName} Family!
      </motion.h1>

      <motion.p
        className="text-lg text-muted-foreground mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        Your cozy command center is ready. Welcome home to {brand.name}!
      </motion.p>

      {/* Summary Cards */}
      <motion.div
        className="grid grid-cols-2 gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
          <div className="text-3xl font-bold text-primary mb-1">
            {members.length}
          </div>
          <div className="text-sm text-muted-foreground">
            Family Members
          </div>
        </div>
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
          <div className="text-3xl font-bold text-primary mb-1">
            {enabledFeatures.length}
          </div>
          <div className="text-sm text-muted-foreground">
            Features Enabled
          </div>
        </div>
      </motion.div>

      {/* Family Members */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Your Family
        </h3>
        <div className="flex flex-wrap justify-center gap-2">
          {members.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="px-3 py-1.5 bg-muted rounded-full text-sm font-medium"
            >
              {member.name}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Enabled Features */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Ready to Use
        </h3>
        <div className="flex flex-wrap justify-center gap-2">
          {enabledFeaturesList.map((feature, index) => {
            const Icon = iconMap[feature.icon] || Sparkles;
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.05 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
              >
                <Icon className="h-4 w-4" />
                {feature.name}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Button size="lg" className="w-full text-lg h-12" onClick={onComplete} asChild>
          <Link href="/">
            Go to Dashboard
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>

        <p className="text-sm text-muted-foreground mt-4 flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4" />
          You can customize everything in Settings
        </p>
      </motion.div>
    </motion.div>
  );
}
