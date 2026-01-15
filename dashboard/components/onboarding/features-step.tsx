"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Zap,
  ArrowRight,
  Check,
  Calendar,
  CheckSquare,
  Home,
  Brain,
  Shield,
  Heart,
  Sparkles,
} from "lucide-react";
import { availableFeatures } from "@/lib/onboarding-storage";

const iconMap: Record<string, React.ElementType> = {
  Calendar,
  CheckSquare,
  Home,
  Brain,
  Shield,
  Heart,
};

interface FeaturesStepProps {
  enabledFeatures: string[];
  onToggleFeature: (featureId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function FeaturesStep({
  enabledFeatures,
  onToggleFeature,
  onNext,
  onBack,
}: FeaturesStepProps) {
  const enableAll = () => {
    availableFeatures.forEach((feature) => {
      if (!enabledFeatures.includes(feature.id)) {
        onToggleFeature(feature.id);
      }
    });
  };

  const enableRecommended = () => {
    availableFeatures.forEach((feature) => {
      const isEnabled = enabledFeatures.includes(feature.id);
      if (feature.recommended && !isEnabled) {
        onToggleFeature(feature.id);
      } else if (!feature.recommended && isEnabled) {
        onToggleFeature(feature.id);
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
        >
          <Zap className="h-8 w-8 text-primary" />
        </motion.div>

        <h2 className="text-2xl font-bold mb-2">
          What would you like to set up?
        </h2>
        <p className="text-muted-foreground">
          Choose the features you want to use. You can enable more later.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={enableRecommended}>
          <Sparkles className="h-4 w-4 mr-1" />
          Recommended
        </Button>
        <Button variant="outline" size="sm" onClick={enableAll}>
          <Check className="h-4 w-4 mr-1" />
          Enable All
        </Button>
      </div>

      {/* Features Grid */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {availableFeatures.map((feature, index) => {
          const Icon = iconMap[feature.icon] || Zap;
          const isEnabled = enabledFeatures.includes(feature.id);

          return (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isEnabled
                    ? "ring-2 ring-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
                onClick={() => onToggleFeature(feature.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        isEnabled
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{feature.name}</h3>
                        {feature.recommended && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {feature.description}
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isEnabled
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {isEnabled && <Check className="h-4 w-4 text-primary-foreground" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1"
          disabled={enabledFeatures.length === 0}
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {enabledFeatures.length === 0 && (
        <p className="text-sm text-muted-foreground text-center mt-4">
          Select at least one feature to continue
        </p>
      )}
    </motion.div>
  );
}
