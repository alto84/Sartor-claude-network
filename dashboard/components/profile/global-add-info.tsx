"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { InfoEditor } from "./info-editor";
import type { CreateProfileInput, UpdateProfileInput } from "@/hooks/use-profile";

// ============================================================================
// GLOBAL ADD INFO BUTTON
// ============================================================================

interface GlobalAddInfoButtonProps {
  memberId?: string;
  className?: string;
}

/**
 * A floating action button that opens the info editor dialog.
 * Place this in the layout to allow quick adding of personal info from any page.
 */
export function GlobalAddInfoButton({
  memberId = "alton",
  className,
}: GlobalAddInfoButtonProps) {
  const [open, setOpen] = useState(false);

  const handleSave = async (
    data: CreateProfileInput | { id: string; updates: UpdateProfileInput }
  ) => {
    // Only handle new entries (the global button doesn't edit)
    if (!("id" in data)) {
      try {
        const response = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to save");
        }

        toast.success("Information saved successfully!");
      } catch (error) {
        console.error("Failed to save profile:", error);
        toast.error("Failed to save information");
        throw error;
      }
    }
  };

  return (
    <InfoEditor
      open={open}
      onOpenChange={setOpen}
      memberId={memberId}
      onSave={handleSave}
      trigger={
        <Button
          size="lg"
          className={cn(
            "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
            "hover:scale-105 transition-transform",
            "bg-primary text-primary-foreground",
            className
          )}
          title="Add personal information"
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">Add personal information</span>
        </Button>
      }
    />
  );
}

export default GlobalAddInfoButton;
