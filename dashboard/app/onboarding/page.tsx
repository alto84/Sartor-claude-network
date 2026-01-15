"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WelcomeStep } from "@/components/onboarding/welcome-step";
import { FamilyStep } from "@/components/onboarding/family-step";
import { FeaturesStep } from "@/components/onboarding/features-step";
import { TourStep } from "@/components/onboarding/tour-step";
import { CompleteStep } from "@/components/onboarding/complete-step";
import {
  getOnboardingData,
  updateFamilyName,
  addFamilyMember,
  removeFamilyMember,
  toggleFeature,
  setCurrentStep,
  completeStep,
  completeOnboarding,
  FamilyMember,
} from "@/lib/onboarding-storage";
import { Check, Bird } from "lucide-react";
import { brand } from "@/lib/brand";

const TOTAL_STEPS = 5;

const stepLabels = [
  "Welcome",
  "Family",
  "Features",
  "Tour",
  "Ready!",
];

export default function OnboardingPage() {
  const [currentStep, setStep] = useState(0);
  const [familyName, setFamilyName] = useState("");
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved state on mount
  useEffect(() => {
    const data = getOnboardingData();
    setFamilyName(data.familyName);
    setMembers(data.members);
    setEnabledFeatures(data.enabledFeatures);
    setStep(data.currentStep);
    setIsLoaded(true);
  }, []);

  const handleFamilyNameChange = (name: string) => {
    setFamilyName(name);
    updateFamilyName(name);
  };

  const handleAddMember = (member: Omit<FamilyMember, "id">) => {
    const data = addFamilyMember(member);
    setMembers(data.members);
  };

  const handleRemoveMember = (id: string) => {
    const data = removeFamilyMember(id);
    setMembers(data.members);
  };

  const handleToggleFeature = (featureId: string) => {
    const data = toggleFeature(featureId);
    setEnabledFeatures(data.enabledFeatures);
  };

  const goToStep = (step: number) => {
    completeStep(currentStep);
    setStep(step);
    setCurrentStep(step);
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      goToStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    completeOnboarding();
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 rounded-full bg-primary/20" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {/* Header with Progress */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-green-600 text-primary-foreground">
                <Bird className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg">{brand.name}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {TOTAL_STEPS}
            </span>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2">
            {stepLabels.map((label, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div
                  key={index}
                  className="flex-1 flex items-center"
                >
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : isActive
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={`text-xs hidden sm:block ${
                        isActive ? "text-primary font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {index < TOTAL_STEPS - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 transition-colors duration-300 ${
                        isCompleted ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <WelcomeStep
                key="welcome"
                familyName={familyName}
                onFamilyNameChange={handleFamilyNameChange}
                onNext={nextStep}
              />
            )}
            {currentStep === 1 && (
              <FamilyStep
                key="family"
                familyName={familyName}
                members={members}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
                onNext={nextStep}
                onBack={prevStep}
              />
            )}
            {currentStep === 2 && (
              <FeaturesStep
                key="features"
                enabledFeatures={enabledFeatures}
                onToggleFeature={handleToggleFeature}
                onNext={nextStep}
                onBack={prevStep}
              />
            )}
            {currentStep === 3 && (
              <TourStep
                key="tour"
                onNext={nextStep}
                onBack={prevStep}
              />
            )}
            {currentStep === 4 && (
              <CompleteStep
                key="complete"
                familyName={familyName}
                members={members}
                enabledFeatures={enabledFeatures}
                onComplete={handleComplete}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 px-4 text-center text-sm text-muted-foreground">
        <p>Your data is stored locally and never shared without your permission.</p>
      </footer>
    </div>
  );
}
