"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import { FileUpload, type UploadedFile } from "./file-upload";
import { LinkPreview, type LinkMetadata } from "./link-preview";
import {
  Plus,
  FileText,
  Link as LinkIcon,
  StickyNote,
  User,
  X,
  Star,
  AlertTriangle,
} from "lucide-react";

// Zod schemas for each item type
const documentSchema = z.object({
  type: z.literal("document"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  category: z.string().min(1, "Category is required"),
  importance: z.enum(["low", "medium", "high", "critical"]),
  starred: z.boolean(),
  tags: z.array(z.string()),
  description: z.string().optional(),
});

const linkSchema = z.object({
  type: z.literal("link"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  url: z.url("Please enter a valid URL"),
  category: z.string().min(1, "Category is required"),
  importance: z.enum(["low", "medium", "high", "critical"]),
  starred: z.boolean(),
  tags: z.array(z.string()),
  description: z.string().optional(),
});

const noteSchema = z.object({
  type: z.literal("note"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  content: z.string().min(1, "Note content is required"),
  category: z.string().min(1, "Category is required"),
  importance: z.enum(["low", "medium", "high", "critical"]),
  starred: z.boolean(),
  tags: z.array(z.string()),
});

const contactSchema = z.object({
  type: z.literal("contact"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.email("Please enter a valid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  importance: z.enum(["low", "medium", "high", "critical"]),
  starred: z.boolean(),
  tags: z.array(z.string()),
  notes: z.string().optional(),
});

type DocumentFormData = z.infer<typeof documentSchema>;
type LinkFormData = z.infer<typeof linkSchema>;
type NoteFormData = z.infer<typeof noteSchema>;
type ContactFormData = z.infer<typeof contactSchema>;

type FormData = DocumentFormData | LinkFormData | NoteFormData | ContactFormData;

const categories = [
  "Finance",
  "Insurance",
  "Education",
  "Medical",
  "Memories",
  "Home",
  "Work",
  "Personal",
  "Legal",
  "Travel",
];

const importanceLevels = [
  { value: "low", label: "Low", color: "bg-gray-100 text-gray-700" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-700" },
  { value: "critical", label: "Critical", color: "bg-red-100 text-red-700" },
];

interface AddItemDialogProps {
  onItemAdded?: (item: FormData, files?: UploadedFile[]) => void;
  trigger?: React.ReactNode;
}

export function AddItemDialog({ onItemAdded, trigger }: AddItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"document" | "link" | "note" | "contact">("document");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [linkMetadata, setLinkMetadata] = useState<LinkMetadata | null>(null);

  // Document form
  const documentForm = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      type: "document",
      name: "",
      category: "",
      importance: "medium",
      starred: false,
      tags: [],
      description: "",
    },
  });

  // Link form
  const linkForm = useForm<LinkFormData>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      type: "link",
      name: "",
      url: "",
      category: "",
      importance: "medium",
      starred: false,
      tags: [],
      description: "",
    },
  });

  // Note form
  const noteForm = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      type: "note",
      name: "",
      content: "",
      category: "",
      importance: "medium",
      starred: false,
      tags: [],
    },
  });

  // Contact form
  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      type: "contact",
      name: "",
      email: "",
      phone: "",
      company: "",
      category: "Personal",
      importance: "medium",
      starred: false,
      tags: [],
      notes: "",
    },
  });

  const handleLinkValidated = useCallback((metadata: LinkMetadata | null) => {
    setLinkMetadata(metadata);
    if (metadata) {
      linkForm.setValue("url", metadata.url);
      if (!linkForm.getValues("name")) {
        linkForm.setValue("name", metadata.title);
      }
    }
  }, [linkForm]);

  const resetForms = () => {
    documentForm.reset();
    linkForm.reset();
    noteForm.reset();
    contactForm.reset();
    setUploadedFiles([]);
    setLinkMetadata(null);
  };

  const handleSubmit = async () => {
    let isValid = false;
    let data: FormData | null = null;

    switch (activeTab) {
      case "document":
        isValid = await documentForm.trigger();
        if (isValid) data = documentForm.getValues();
        break;
      case "link":
        isValid = await linkForm.trigger();
        if (isValid) data = linkForm.getValues();
        break;
      case "note":
        isValid = await noteForm.trigger();
        if (isValid) data = noteForm.getValues();
        break;
      case "contact":
        isValid = await contactForm.trigger();
        if (isValid) data = contactForm.getValues();
        break;
    }

    if (!isValid || !data) return;

    onItemAdded?.(data, uploadedFiles);
    resetForms();
    setOpen(false);
  };

  // Tag input state for each form
  const [docTagInput, setDocTagInput] = useState("");
  const [linkTagInput, setLinkTagInput] = useState("");
  const [noteTagInput, setNoteTagInput] = useState("");
  const [contactTagInput, setContactTagInput] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add to Family Vault</DialogTitle>
          <DialogDescription>
            Store important documents, links, notes, and contacts securely.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="mt-4"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="document" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Document</span>
            </TabsTrigger>
            <TabsTrigger value="link" className="gap-2">
              <LinkIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Link</span>
            </TabsTrigger>
            <TabsTrigger value="note" className="gap-2">
              <StickyNote className="h-4 w-4" />
              <span className="hidden sm:inline">Note</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Contact</span>
            </TabsTrigger>
          </TabsList>

          {/* Document Tab */}
          <TabsContent value="document" className="mt-4 space-y-4">
            <Form {...documentForm}>
              <form className="space-y-4">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label>Upload Files</Label>
                  <FileUpload
                    onFilesSelected={setUploadedFiles}
                    maxFiles={5}
                    maxFileSize={50 * 1024 * 1024}
                  />
                </div>

                {/* Name */}
                <FormField
                  control={documentForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Family Budget 2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={documentForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of this document..."
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category */}
                <FormField
                  control={documentForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Importance */}
                <FormField
                  control={documentForm.control}
                  name="importance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Importance</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select importance" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {importanceLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              <div className="flex items-center gap-2">
                                {level.value === "critical" && (
                                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                                )}
                                {level.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Starred */}
                <FormField
                  control={documentForm.control}
                  name="starred"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={cn("h-8 gap-2", field.value && "text-yellow-600")}
                          onClick={() => field.onChange(!field.value)}
                        >
                          <Star className={cn("h-4 w-4", field.value && "fill-yellow-500 text-yellow-500")} />
                          {field.value ? "Starred" : "Add to Starred"}
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
                      value={docTagInput}
                      onChange={(e) => setDocTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const currentTags = documentForm.getValues("tags");
                          if (docTagInput.trim() && !currentTags.includes(docTagInput.trim())) {
                            documentForm.setValue("tags", [...currentTags, docTagInput.trim()]);
                            setDocTagInput("");
                          }
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentTags = documentForm.getValues("tags");
                        if (docTagInput.trim() && !currentTags.includes(docTagInput.trim())) {
                          documentForm.setValue("tags", [...currentTags, docTagInput.trim()]);
                          setDocTagInput("");
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {documentForm.watch("tags").length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {documentForm.watch("tags").map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 cursor-pointer"
                          onClick={() => {
                            const currentTags = documentForm.getValues("tags");
                            documentForm.setValue("tags", currentTags.filter((t) => t !== tag));
                          }}
                        >
                          {tag}
                          <X className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* Link Tab */}
          <TabsContent value="link" className="mt-4 space-y-4">
            <Form {...linkForm}>
              <form className="space-y-4">
                {/* URL with Preview */}
                <div className="space-y-2">
                  <Label>URL</Label>
                  <LinkPreview
                    onLinkValidated={handleLinkValidated}
                    initialUrl={linkForm.watch("url")}
                  />
                  {linkForm.formState.errors.url && (
                    <p className="text-sm text-destructive">
                      {linkForm.formState.errors.url.message}
                    </p>
                  )}
                </div>

                {/* Name */}
                <FormField
                  control={linkForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., School Portal" {...field} />
                      </FormControl>
                      <FormDescription>Auto-filled from URL if available</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={linkForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What is this link for..."
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category */}
                <FormField
                  control={linkForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Importance */}
                <FormField
                  control={linkForm.control}
                  name="importance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Importance</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select importance" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {importanceLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              <div className="flex items-center gap-2">
                                {level.value === "critical" && (
                                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                                )}
                                {level.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Starred */}
                <FormField
                  control={linkForm.control}
                  name="starred"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={cn("h-8 gap-2", field.value && "text-yellow-600")}
                          onClick={() => field.onChange(!field.value)}
                        >
                          <Star className={cn("h-4 w-4", field.value && "fill-yellow-500 text-yellow-500")} />
                          {field.value ? "Starred" : "Add to Starred"}
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
                      value={linkTagInput}
                      onChange={(e) => setLinkTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const currentTags = linkForm.getValues("tags");
                          if (linkTagInput.trim() && !currentTags.includes(linkTagInput.trim())) {
                            linkForm.setValue("tags", [...currentTags, linkTagInput.trim()]);
                            setLinkTagInput("");
                          }
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentTags = linkForm.getValues("tags");
                        if (linkTagInput.trim() && !currentTags.includes(linkTagInput.trim())) {
                          linkForm.setValue("tags", [...currentTags, linkTagInput.trim()]);
                          setLinkTagInput("");
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {linkForm.watch("tags").length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {linkForm.watch("tags").map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 cursor-pointer"
                          onClick={() => {
                            const currentTags = linkForm.getValues("tags");
                            linkForm.setValue("tags", currentTags.filter((t) => t !== tag));
                          }}
                        >
                          {tag}
                          <X className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* Note Tab */}
          <TabsContent value="note" className="mt-4 space-y-4">
            <Form {...noteForm}>
              <form className="space-y-4">
                {/* Name */}
                <FormField
                  control={noteForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Important Reminders" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Content */}
                <FormField
                  control={noteForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your note here...

Supports basic formatting:
- Use dashes for lists
- **Bold** with double asterisks
- _Italic_ with underscores"
                          className="resize-none min-h-[200px] font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Rich text editor coming soon</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category */}
                <FormField
                  control={noteForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Importance */}
                <FormField
                  control={noteForm.control}
                  name="importance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Importance</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select importance" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {importanceLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              <div className="flex items-center gap-2">
                                {level.value === "critical" && (
                                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                                )}
                                {level.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Starred */}
                <FormField
                  control={noteForm.control}
                  name="starred"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={cn("h-8 gap-2", field.value && "text-yellow-600")}
                          onClick={() => field.onChange(!field.value)}
                        >
                          <Star className={cn("h-4 w-4", field.value && "fill-yellow-500 text-yellow-500")} />
                          {field.value ? "Starred" : "Add to Starred"}
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
                      value={noteTagInput}
                      onChange={(e) => setNoteTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const currentTags = noteForm.getValues("tags");
                          if (noteTagInput.trim() && !currentTags.includes(noteTagInput.trim())) {
                            noteForm.setValue("tags", [...currentTags, noteTagInput.trim()]);
                            setNoteTagInput("");
                          }
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentTags = noteForm.getValues("tags");
                        if (noteTagInput.trim() && !currentTags.includes(noteTagInput.trim())) {
                          noteForm.setValue("tags", [...currentTags, noteTagInput.trim()]);
                          setNoteTagInput("");
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {noteForm.watch("tags").length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {noteForm.watch("tags").map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 cursor-pointer"
                          onClick={() => {
                            const currentTags = noteForm.getValues("tags");
                            noteForm.setValue("tags", currentTags.filter((t) => t !== tag));
                          }}
                        >
                          {tag}
                          <X className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="mt-4 space-y-4">
            <Form {...contactForm}>
              <form className="space-y-4">
                {/* Name */}
                <FormField
                  control={contactForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Dr. Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  {/* Email */}
                  <FormField
                    control={contactForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone */}
                  <FormField
                    control={contactForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Company */}
                <FormField
                  control={contactForm.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company / Organization</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., City Medical Center" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={contactForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes about this contact..."
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category */}
                <FormField
                  control={contactForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Importance */}
                <FormField
                  control={contactForm.control}
                  name="importance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Importance</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select importance" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {importanceLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              <div className="flex items-center gap-2">
                                {level.value === "critical" && (
                                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                                )}
                                {level.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Starred */}
                <FormField
                  control={contactForm.control}
                  name="starred"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={cn("h-8 gap-2", field.value && "text-yellow-600")}
                          onClick={() => field.onChange(!field.value)}
                        >
                          <Star className={cn("h-4 w-4", field.value && "fill-yellow-500 text-yellow-500")} />
                          {field.value ? "Starred" : "Add to Starred"}
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
                      value={contactTagInput}
                      onChange={(e) => setContactTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const currentTags = contactForm.getValues("tags");
                          if (contactTagInput.trim() && !currentTags.includes(contactTagInput.trim())) {
                            contactForm.setValue("tags", [...currentTags, contactTagInput.trim()]);
                            setContactTagInput("");
                          }
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentTags = contactForm.getValues("tags");
                        if (contactTagInput.trim() && !currentTags.includes(contactTagInput.trim())) {
                          contactForm.setValue("tags", [...currentTags, contactTagInput.trim()]);
                          setContactTagInput("");
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {contactForm.watch("tags").length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {contactForm.watch("tags").map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 cursor-pointer"
                          onClick={() => {
                            const currentTags = contactForm.getValues("tags");
                            contactForm.setValue("tags", currentTags.filter((t) => t !== tag));
                          }}
                        >
                          {tag}
                          <X className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForms();
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Add to Vault
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
