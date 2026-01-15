"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import {
  User,
  Briefcase,
  Heart,
  Settings,
  Users,
  Target,
  Clock,
  GraduationCap,
  DollarSign,
  Home,
  Palette,
  Calendar,
  StickyNote,
  Plus,
  X,
  Eye,
  EyeOff,
  Sparkles,
  Save,
} from "lucide-react";
import type {
  PersonalProfile,
  ProfileCategory,
  CreateProfileInput,
  UpdateProfileInput,
} from "@/hooks/use-profile";
import { CATEGORY_METADATA, getAllCategories } from "@/hooks/use-profile";

// ============================================================================
// SCHEMA
// ============================================================================

const profileSchema = z.object({
  category: z.enum([
    'bio', 'work', 'health', 'preferences', 'contacts', 'goals',
    'history', 'education', 'financial', 'family', 'hobbies', 'routines', 'notes'
  ] as const),
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  content: z.string().min(1, "Content is required"),
  importance: z.number().min(0).max(1),
  private: z.boolean(),
  tags: z.array(z.string()),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// ============================================================================
// ICON MAPPING
// ============================================================================

const CATEGORY_ICONS: Record<ProfileCategory, React.ComponentType<{ className?: string }>> = {
  bio: User,
  work: Briefcase,
  health: Heart,
  preferences: Settings,
  contacts: Users,
  goals: Target,
  history: Clock,
  education: GraduationCap,
  financial: DollarSign,
  family: Home,
  hobbies: Palette,
  routines: Calendar,
  notes: StickyNote,
};

// ============================================================================
// INFO EDITOR DIALOG
// ============================================================================

interface InfoEditorProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  profile?: PersonalProfile | null;
  memberId: string;
  onSave: (data: CreateProfileInput | { id: string; updates: UpdateProfileInput }) => Promise<void>;
  trigger?: React.ReactNode;
  defaultCategory?: ProfileCategory;
}

export function InfoEditor({
  open: controlledOpen,
  onOpenChange,
  profile,
  memberId,
  onSave,
  trigger,
  defaultCategory,
}: InfoEditorProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const isEditing = !!profile;

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      category: defaultCategory || "notes",
      title: "",
      content: "",
      importance: 0.5,
      private: false,
      tags: [],
    },
  });

  // Reset form when profile changes or dialog opens
  useEffect(() => {
    if (open) {
      if (profile) {
        form.reset({
          category: profile.category,
          title: profile.title,
          content: profile.content,
          importance: profile.importance,
          private: profile.private,
          tags: profile.tags,
        });
      } else {
        form.reset({
          category: defaultCategory || "notes",
          title: "",
          content: "",
          importance: 0.5,
          private: defaultCategory ? CATEGORY_METADATA[defaultCategory].defaultPrivate : false,
          tags: [],
        });
      }
    }
  }, [open, profile, defaultCategory, form]);

  // Update privacy default when category changes
  const watchCategory = form.watch("category");
  useEffect(() => {
    if (!isEditing && watchCategory) {
      const categoryMeta = CATEGORY_METADATA[watchCategory as ProfileCategory];
      form.setValue("private", categoryMeta.defaultPrivate);
    }
  }, [watchCategory, isEditing, form]);

  const handleSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      if (isEditing && profile) {
        await onSave({
          id: profile.id,
          updates: {
            category: data.category,
            title: data.title,
            content: data.content,
            importance: data.importance,
            private: data.private,
            tags: data.tags,
          },
        });
      } else {
        await onSave({
          memberId,
          category: data.category,
          title: data.title,
          content: data.content,
          importance: data.importance,
          private: data.private,
          tags: data.tags,
          source: "user",
        });
      }
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = useCallback(() => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !form.getValues("tags").includes(trimmed)) {
      form.setValue("tags", [...form.getValues("tags"), trimmed]);
      setTagInput("");
    }
  }, [tagInput, form]);

  const removeTag = useCallback(
    (tag: string) => {
      form.setValue(
        "tags",
        form.getValues("tags").filter((t) => t !== tag)
      );
    },
    [form]
  );

  const selectedCategory = form.watch("category") as ProfileCategory;
  const categoryMeta = selectedCategory ? CATEGORY_METADATA[selectedCategory] : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Settings className="h-5 w-5" />
                Edit Information
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Add Personal Information
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your personal information entry."
              : "Store information about yourself for Claude to remember."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Category Selection */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getAllCategories().map((cat) => {
                        const Icon = CATEGORY_ICONS[cat];
                        const meta = CATEGORY_METADATA[cat];
                        return (
                          <SelectItem key={cat} value={cat}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{meta.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {categoryMeta && (
                    <FormDescription>{categoryMeta.description}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        categoryMeta
                          ? `e.g., ${categoryMeta.examples[0]}`
                          : "Enter a title..."
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the information you want Claude to remember..."
                      className="min-h-[150px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Be as detailed as you like. Claude will use this to personalize interactions.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Example suggestions */}
            {categoryMeta && !isEditing && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Example entries for {categoryMeta.label}:
                </p>
                <div className="flex flex-wrap gap-1">
                  {categoryMeta.examples.map((example) => (
                    <Badge
                      key={example}
                      variant="outline"
                      className="text-xs cursor-pointer hover:bg-accent"
                      onClick={() => {
                        if (!form.getValues("title")) {
                          form.setValue("title", example);
                        }
                      }}
                    >
                      {example}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Importance Slider */}
            <FormField
              control={form.control}
              name="importance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    <span>Importance</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {field.value >= 0.8
                        ? "High - Claude will prioritize this"
                        : field.value >= 0.5
                        ? "Medium - Claude will remember this"
                        : "Low - Background information"}
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={[field.value]}
                      onValueChange={([value]) => field.onChange(value)}
                      className="py-4"
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Privacy Toggle */}
            <FormField
              control={form.control}
              name="private"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center gap-2">
                      {field.value ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      Private Information
                    </FormLabel>
                    <FormDescription>
                      {field.value
                        ? "Only you can see this entry"
                        : "Other family members can see this"}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Button
                      type="button"
                      variant={field.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => field.onChange(!field.value)}
                    >
                      {field.value ? "Private" : "Public"}
                    </Button>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}>
                  Add
                </Button>
              </div>
              {form.watch("tags").length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.watch("tags").map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    >
                      {tag}
                      <X className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? "Update" : "Save"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// QUICK ADD BUTTON (Floating Action Button)
// ============================================================================

interface QuickAddButtonProps {
  memberId: string;
  onSave: (data: CreateProfileInput) => Promise<void>;
  className?: string;
}

export function QuickAddButton({ memberId, onSave, className }: QuickAddButtonProps) {
  const [open, setOpen] = useState(false);

  const handleSave = async (data: CreateProfileInput | { id: string; updates: UpdateProfileInput }) => {
    // Quick add only creates new entries
    if ('memberId' in data) {
      await onSave(data);
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
            "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg",
            "hover:scale-105 transition-transform",
            className
          )}
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">Add personal information</span>
        </Button>
      }
    />
  );
}
