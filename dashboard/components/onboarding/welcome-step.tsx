"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bird, ArrowRight, Sparkles } from "lucide-react";
import { brand } from "@/lib/brand";

interface WelcomeStepProps {
  familyName: string;
  onFamilyNameChange: (name: string) => void;
  onNext: () => void;
}

export function WelcomeStep({
  familyName,
  onFamilyNameChange,
  onNext,
}: WelcomeStepProps) {
  const [inputValue, setInputValue] = useState(familyName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onFamilyNameChange(inputValue.trim());
      onNext();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-lg mx-auto text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center mx-auto mb-8"
      >
        <Bird className="h-10 w-10 text-white" />
      </motion.div>

      <motion.h1
        className="text-3xl font-bold mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Welcome to {brand.name}!
      </motion.h1>

      <motion.p
        className="text-muted-foreground text-lg mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        Let&apos;s build your cozy command center.
        First, what should we call your nest?
      </motion.p>

      <motion.form
        onSubmit={handleSubmit}
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="space-y-2 text-left">
          <Label htmlFor="familyName" className="text-base">
            Family Name
          </Label>
          <div className="relative">
            <Input
              id="familyName"
              placeholder="The Sartor Family"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="text-lg h-12 pr-24"
              autoFocus
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              Family
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            This is how we&apos;ll refer to your household
          </p>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full text-lg h-12"
          disabled={!inputValue.trim()}
        >
          Continue
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.form>

      <motion.div
        className="mt-12 flex items-center justify-center gap-2 text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Sparkles className="h-4 w-4" />
        <span>This only takes a few minutes</span>
      </motion.div>
    </motion.div>
  );
}
