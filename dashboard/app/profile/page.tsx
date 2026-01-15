"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  LayoutGrid,
  LayoutList,
  SortAsc,
  SortDesc,
  X,
  AlertTriangle,
  Brain,
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
  Filter,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  useProfile,
  type PersonalProfile,
  type ProfileCategory,
  type CreateProfileInput,
  type UpdateProfileInput,
  CATEGORY_METADATA,
  getAllCategories,
} from "@/hooks/use-profile";
import { InfoCard, CategoryCard, CATEGORY_LABELS } from "@/components/profile/info-card";
import { InfoEditor, QuickAddButton } from "@/components/profile/info-editor";

// ============================================================================
// CONSTANTS
// ============================================================================

// Current member ID - in a real app this would come from auth
const CURRENT_MEMBER_ID = "alton";

type SortOption = "date" | "importance" | "title";
type ViewMode = "grid" | "list";
type PrivacyFilter = "all" | "private" | "public";

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function ProfilePage() {
  // Profile data hook
  const {
    profiles,
    total,
    isLoading,
    error,
    createItem,
    updateItem,
    deleteItem,
    refresh,
  } = useProfile({ memberId: CURRENT_MEMBER_ID });

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ProfileCategory | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [privacyFilter, setPrivacyFilter] = useState<PrivacyFilter>("all");

  // Dialog state
  const [editingProfile, setEditingProfile] = useState<PersonalProfile | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<PersonalProfile | null>(null);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<ProfileCategory | "all", number> = { all: profiles.length } as Record<ProfileCategory | "all", number>;
    for (const cat of getAllCategories()) {
      counts[cat] = profiles.filter((p) => p.category === cat).length;
    }
    return counts;
  }, [profiles]);

  // Filtered and sorted profiles
  const filteredProfiles = useMemo(() => {
    let result = [...profiles];

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Privacy filter
    if (privacyFilter === "private") {
      result = result.filter((p) => p.private);
    } else if (privacyFilter === "public") {
      result = result.filter((p) => !p.private);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.content.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "importance":
          comparison = a.importance - b.importance;
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "date":
        default:
          comparison =
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [profiles, selectedCategory, privacyFilter, searchQuery, sortBy, sortOrder]);

  // Group profiles by category for tab view
  const profilesByCategory = useMemo(() => {
    const grouped: Record<ProfileCategory, PersonalProfile[]> = {} as Record<ProfileCategory, PersonalProfile[]>;
    for (const cat of getAllCategories()) {
      grouped[cat] = filteredProfiles.filter((p) => p.category === cat);
    }
    return grouped;
  }, [filteredProfiles]);

  // High importance profiles
  const highImportanceProfiles = useMemo(
    () => profiles.filter((p) => p.importance >= 0.8),
    [profiles]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSave = async (
    data: CreateProfileInput | { id: string; updates: UpdateProfileInput }
  ) => {
    if ("id" in data) {
      const result = await updateItem(data.id, data.updates);
      if (result) {
        toast.success("Information updated successfully");
      } else {
        toast.error("Failed to update information");
      }
    } else {
      const result = await createItem(data);
      if (result) {
        toast.success("Information saved successfully");
      } else {
        toast.error("Failed to save information");
      }
    }
  };

  const handleEdit = (profile: PersonalProfile) => {
    setEditingProfile(profile);
    setIsEditorOpen(true);
  };

  const handleDelete = (profile: PersonalProfile) => {
    setProfileToDelete(profile);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (profileToDelete) {
      const success = await deleteItem(profileToDelete.id);
      if (success) {
        toast.success(`"${profileToDelete.title}" deleted`);
      } else {
        toast.error("Failed to delete entry");
      }
      setProfileToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleTogglePrivacy = async (profile: PersonalProfile) => {
    const result = await updateItem(profile.id, { private: !profile.private });
    if (result) {
      toast.success(
        result.private ? "Entry is now private" : "Entry is now public"
      );
    }
  };

  const handleAddNew = () => {
    setEditingProfile(null);
    setIsEditorOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setPrivacyFilter("all");
  };

  const hasActiveFilters =
    searchQuery !== "" || selectedCategory !== "all" || privacyFilter !== "all";

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            My Profile
          </h1>
          <p className="text-muted-foreground">
            Store personal information for Claude to remember across conversations
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Information
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">Total Entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{highImportanceProfiles.length}</div>
            <p className="text-xs text-muted-foreground">High Importance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {profiles.filter((p) => p.private).length}
            </div>
            <p className="text-xs text-muted-foreground">Private Entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {Math.max(0, Object.values(categoryCounts).filter((c) => c > 0).length - 1)}
            </div>
            <p className="text-xs text-muted-foreground">Categories Used</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search your profile..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={privacyFilter}
            onValueChange={(v) => setPrivacyFilter(v as PrivacyFilter)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Privacy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="private">
                <span className="flex items-center gap-2">
                  <EyeOff className="h-3 w-3" />
                  Private
                </span>
              </SelectItem>
              <SelectItem value="public">
                <span className="flex items-center gap-2">
                  <Eye className="h-3 w-3" />
                  Public
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortOption)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date Modified</SelectItem>
              <SelectItem value="importance">Importance</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
          >
            {sortOrder === "asc" ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>

          {/* View Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchQuery}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setSearchQuery("")}
              />
            </Badge>
          )}
          {selectedCategory !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Category: {CATEGORY_LABELS[selectedCategory]}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setSelectedCategory("all")}
              />
            </Badge>
          )}
          {privacyFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Privacy: {privacyFilter}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setPrivacyFilter("all")}
              />
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={clearFilters}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Category Cards */}
      <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-7">
        <CategoryCard
          category="bio"
          count={categoryCounts.bio || 0}
          isSelected={selectedCategory === "bio"}
          onClick={() =>
            setSelectedCategory(selectedCategory === "bio" ? "all" : "bio")
          }
        />
        <CategoryCard
          category="work"
          count={categoryCounts.work || 0}
          isSelected={selectedCategory === "work"}
          onClick={() =>
            setSelectedCategory(selectedCategory === "work" ? "all" : "work")
          }
        />
        <CategoryCard
          category="preferences"
          count={categoryCounts.preferences || 0}
          isSelected={selectedCategory === "preferences"}
          onClick={() =>
            setSelectedCategory(
              selectedCategory === "preferences" ? "all" : "preferences"
            )
          }
        />
        <CategoryCard
          category="family"
          count={categoryCounts.family || 0}
          isSelected={selectedCategory === "family"}
          onClick={() =>
            setSelectedCategory(selectedCategory === "family" ? "all" : "family")
          }
        />
        <CategoryCard
          category="health"
          count={categoryCounts.health || 0}
          isSelected={selectedCategory === "health"}
          onClick={() =>
            setSelectedCategory(selectedCategory === "health" ? "all" : "health")
          }
        />
        <CategoryCard
          category="goals"
          count={categoryCounts.goals || 0}
          isSelected={selectedCategory === "goals"}
          onClick={() =>
            setSelectedCategory(selectedCategory === "goals" ? "all" : "goals")
          }
        />
        <CategoryCard
          category="notes"
          count={categoryCounts.notes || 0}
          isSelected={selectedCategory === "notes"}
          onClick={() =>
            setSelectedCategory(selectedCategory === "notes" ? "all" : "notes")
          }
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={refresh} className="ml-auto">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Profiles Grid/List */}
      {!isLoading && !error && (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-2"
          }
        >
          {filteredProfiles.map((profile) => (
            <InfoCard
              key={profile.id}
              profile={profile}
              compact={viewMode === "list"}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTogglePrivacy={handleTogglePrivacy}
              onClick={() => handleEdit(profile)}
            />
          ))}
          {filteredProfiles.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters
                  ? "No entries match your filters"
                  : "No profile information yet"}
              </p>
              {!hasActiveFilters && (
                <Button onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Entry
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tips Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Tips for Better Memory
          </CardTitle>
          <CardDescription>
            Help Claude remember you better
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">*</span>
              <span>
                <strong>Be specific:</strong> Instead of &quot;I like coffee&quot;, try &quot;I prefer
                cold brew with oat milk, no sugar&quot;
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">*</span>
              <span>
                <strong>Set importance:</strong> High importance items are prioritized
                when Claude needs context
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">*</span>
              <span>
                <strong>Use tags:</strong> Tags help organize and find related
                information quickly
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">*</span>
              <span>
                <strong>Keep it updated:</strong> Mark outdated information or update
                it when things change
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Editor Dialog */}
      <InfoEditor
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        profile={editingProfile}
        memberId={CURRENT_MEMBER_ID}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Entry
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{profileToDelete?.title}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Quick Add Button */}
      <QuickAddButton
        memberId={CURRENT_MEMBER_ID}
        onSave={async (data) => {
          const result = await createItem(data);
          if (result) {
            toast.success("Information saved successfully");
          } else {
            toast.error("Failed to save information");
          }
        }}
      />
    </div>
  );
}
