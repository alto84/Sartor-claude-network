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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AddItemDialog } from "@/components/vault/add-item-dialog";
import {
  VaultItemCard,
  VaultItemCardCompact,
  type VaultItem,
  type VaultItemType,
} from "@/components/vault/vault-item-card";
import {
  FileText,
  Link as LinkIcon,
  StickyNote,
  User,
  Image,
  Film,
  Folder,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  LayoutList,
  SortAsc,
  SortDesc,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

// Sample vault items with extended data
const initialVaultItems: VaultItem[] = [
  {
    id: "1",
    name: "Family Budget 2024",
    type: "document",
    category: "Finance",
    dateAdded: "2024-01-15",
    dateModified: "2024-01-20",
    starred: true,
    importance: "high",
    size: "245 KB",
    description: "Annual household budget and expense tracking",
    tags: [
      { id: "t1", name: "budget", color: "#22c55e" },
      { id: "t2", name: "2024", color: "#3b82f6" },
    ],
  },
  {
    id: "2",
    name: "Home Insurance Policy",
    type: "document",
    category: "Insurance",
    dateAdded: "2024-01-10",
    starred: true,
    importance: "critical",
    size: "1.2 MB",
    description: "State Farm home insurance - Policy #HO-12345",
    tags: [
      { id: "t3", name: "insurance", color: "#f59e0b" },
      { id: "t4", name: "home", color: "#8b5cf6" },
    ],
  },
  {
    id: "3",
    name: "School Portal",
    type: "link",
    category: "Education",
    dateAdded: "2024-01-08",
    starred: false,
    importance: "medium",
    url: "https://school.example.com",
    description: "Login to check grades and assignments",
    tags: [
      { id: "t5", name: "kids", color: "#ec4899" },
      { id: "t6", name: "school", color: "#06b6d4" },
    ],
  },
  {
    id: "4",
    name: "Dr. Johnson - Pediatrician",
    type: "contact",
    category: "Medical",
    dateAdded: "2024-01-05",
    starred: true,
    importance: "high",
    email: "dr.johnson@pediatrics.com",
    phone: "(555) 234-5678",
    description: "Kids' primary care doctor",
    tags: [
      { id: "t7", name: "doctor", color: "#ef4444" },
      { id: "t8", name: "kids", color: "#ec4899" },
    ],
  },
  {
    id: "5",
    name: "Vacation Planning Notes",
    type: "note",
    category: "Memories",
    dateAdded: "2024-01-02",
    starred: false,
    importance: "low",
    content:
      "Summer vacation ideas:\n- Beach house in Florida\n- National park camping trip\n- Disney World\n\nBudget: ~$5000\nDates: July 15-25",
    tags: [
      { id: "t9", name: "vacation", color: "#f97316" },
      { id: "t10", name: "planning", color: "#84cc16" },
    ],
  },
  {
    id: "6",
    name: "Tax Returns 2023",
    type: "document",
    category: "Finance",
    dateAdded: "2023-12-20",
    starred: true,
    importance: "critical",
    size: "3.5 MB",
    description: "Federal and state tax returns for 2023",
    tags: [
      { id: "t11", name: "taxes", color: "#dc2626" },
      { id: "t12", name: "2023", color: "#6366f1" },
    ],
  },
  {
    id: "7",
    name: "Utility Account Login",
    type: "link",
    category: "Home",
    dateAdded: "2023-12-15",
    starred: false,
    importance: "low",
    url: "https://utility.example.com",
    description: "Electric and gas utility account",
    tags: [{ id: "t13", name: "bills", color: "#0891b2" }],
  },
  {
    id: "8",
    name: "Family Vacation Photos",
    type: "image",
    category: "Memories",
    dateAdded: "2024-01-02",
    starred: false,
    importance: "medium",
    size: "45 MB",
    description: "Photos from our Colorado trip",
    tags: [
      { id: "t14", name: "photos", color: "#a855f7" },
      { id: "t15", name: "vacation", color: "#f97316" },
    ],
  },
  {
    id: "9",
    name: "Plumber - Mike's Services",
    type: "contact",
    category: "Home",
    dateAdded: "2023-11-20",
    starred: false,
    importance: "medium",
    phone: "(555) 987-6543",
    description: "Reliable plumber, fixed bathroom leak",
    tags: [
      { id: "t16", name: "contractor", color: "#78716c" },
      { id: "t17", name: "home", color: "#8b5cf6" },
    ],
  },
  {
    id: "10",
    name: "Grocery List Template",
    type: "note",
    category: "Home",
    dateAdded: "2023-11-15",
    starred: true,
    importance: "low",
    content:
      "Weekly essentials:\n- Milk\n- Bread\n- Eggs\n- Fruits\n- Vegetables\n- Chicken\n- Rice\n- Pasta",
    tags: [
      { id: "t18", name: "groceries", color: "#22c55e" },
      { id: "t19", name: "template", color: "#64748b" },
    ],
  },
];

const categories = [
  { name: "All", icon: Folder, color: "text-gray-600" },
  { name: "Finance", icon: Folder, color: "text-green-600" },
  { name: "Insurance", icon: Folder, color: "text-blue-600" },
  { name: "Education", icon: Folder, color: "text-purple-600" },
  { name: "Medical", icon: Folder, color: "text-red-600" },
  { name: "Memories", icon: Folder, color: "text-pink-600" },
  { name: "Home", icon: Folder, color: "text-orange-600" },
];

type SortOption = "name" | "date" | "importance" | "type";
type ViewMode = "grid" | "list";

function getTypeIcon(type: VaultItemType) {
  switch (type) {
    case "document":
      return FileText;
    case "link":
      return LinkIcon;
    case "note":
      return StickyNote;
    case "contact":
      return User;
    case "image":
      return Image;
    case "video":
      return Film;
    default:
      return FileText;
  }
}

export default function VaultPage() {
  const [vaultItems, setVaultItems] = useState<VaultItem[]>(initialVaultItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<VaultItem | null>(null);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagMap = new Map<string, { name: string; color: string }>();
    vaultItems.forEach((item) => {
      item.tags.forEach((tag) => {
        if (!tagMap.has(tag.name)) {
          tagMap.set(tag.name, { name: tag.name, color: tag.color });
        }
      });
    });
    return Array.from(tagMap.values());
  }, [vaultItems]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let items = vaultItems.filter((item) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((tag) =>
          tag.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

      // Category filter
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      // Tag filter
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tagName) =>
          item.tags.some((tag) => tag.name === tagName)
        );

      return matchesSearch && matchesCategory && matchesTags;
    });

    // Sort items
    items.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "date":
          comparison =
            new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
          break;
        case "importance":
          const importanceOrder = { low: 0, medium: 1, high: 2, critical: 3 };
          comparison =
            importanceOrder[a.importance] - importanceOrder[b.importance];
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return items;
  }, [
    vaultItems,
    searchQuery,
    selectedCategory,
    selectedTags,
    sortBy,
    sortOrder,
  ]);

  const starredItems = filteredItems.filter((item) => item.starred);
  const documentItems = filteredItems.filter((item) => item.type === "document");
  const linkItems = filteredItems.filter((item) => item.type === "link");
  const noteItems = filteredItems.filter((item) => item.type === "note");
  const contactItems = filteredItems.filter((item) => item.type === "contact");

  const handleToggleStar = (item: VaultItem) => {
    setVaultItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, starred: !i.starred } : i))
    );
    toast.success(item.starred ? "Removed from starred" : "Added to starred");
  };

  const handleEdit = (item: VaultItem) => {
    toast.info(`Editing "${item.name}"...`);
    // TODO: Open edit dialog
  };

  const handleDelete = (item: VaultItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      setVaultItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      toast.success(`"${itemToDelete.name}" deleted`);
      setItemToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleShare = (item: VaultItem) => {
    toast.info(`Share functionality coming soon for "${item.name}"`);
  };

  const handleOpen = (item: VaultItem) => {
    toast.info(`Opening "${item.name}"...`);
  };

  const handleItemAdded = (data: unknown) => {
    const formData = data as {
      type: VaultItemType;
      name: string;
      category: string;
      importance: "low" | "medium" | "high" | "critical";
      starred: boolean;
      tags: string[];
      [key: string]: unknown;
    };

    const newItem: VaultItem = {
      id: `${Date.now()}`,
      name: formData.name,
      type: formData.type,
      category: formData.category,
      dateAdded: new Date().toISOString().split("T")[0],
      starred: formData.starred,
      importance: formData.importance,
      tags: formData.tags.map((tag, idx) => ({
        id: `new-${idx}`,
        name: tag,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      })),
      url: formData.url as string | undefined,
      content: formData.content as string | undefined,
      email: formData.email as string | undefined,
      phone: formData.phone as string | undefined,
      description: formData.description as string | undefined,
    };

    setVaultItems((prev) => [newItem, ...prev]);
    toast.success(`"${formData.name}" added to vault`);
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedTags([]);
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCategory !== "All" ||
    selectedTags.length > 0;

  const ItemsGrid = ({ items }: { items: VaultItem[] }) => (
    <div
      className={
        viewMode === "grid"
          ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          : "space-y-2"
      }
    >
      {items.map((item) =>
        viewMode === "grid" ? (
          <VaultItemCard
            key={item.id}
            item={item}
            onToggleStar={handleToggleStar}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onShare={handleShare}
            onOpen={handleOpen}
          />
        ) : (
          <VaultItemCardCompact
            key={item.id}
            item={item}
            onToggleStar={handleToggleStar}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onOpen={handleOpen}
          />
        )
      )}
      {items.length === 0 && (
        <div className="col-span-full text-center py-12">
          <p className="text-muted-foreground">No items found</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Family Vault</h1>
          <p className="text-muted-foreground">
            Store and organize important family documents, links, and notes
          </p>
        </div>
        <AddItemDialog onItemAdded={handleItemAdded} />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search vault..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Filter by Tags
                </p>
                <div className="flex flex-wrap gap-1">
                  {allTags.map((tag) => (
                    <Badge
                      key={tag.name}
                      variant={
                        selectedTags.includes(tag.name) ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag.name)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear all filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
              <SelectItem value="date">Date Added</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="importance">Importance</SelectItem>
              <SelectItem value="type">Type</SelectItem>
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
          {selectedCategory !== "All" && (
            <Badge variant="secondary" className="gap-1">
              Category: {selectedCategory}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setSelectedCategory("All")}
              />
            </Badge>
          )}
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              Tag: {tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleTag(tag)}
              />
            </Badge>
          ))}
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

      {/* Categories Overview */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-7">
        {categories.map((category) => {
          const count =
            category.name === "All"
              ? vaultItems.length
              : vaultItems.filter((item) => item.category === category.name)
                  .length;
          const isSelected = selectedCategory === category.name;
          return (
            <Card
              key={category.name}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "ring-2 ring-primary shadow-md"
                  : "hover:shadow-md"
              }`}
              onClick={() => setSelectedCategory(category.name)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center">
                <category.icon className={`h-6 w-6 ${category.color} mb-2`} />
                <p className="font-medium text-sm">{category.name}</p>
                <p className="text-xs text-muted-foreground">{count} items</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All ({filteredItems.length})</TabsTrigger>
          <TabsTrigger value="starred">
            Starred ({starredItems.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-1.5" />
            Documents ({documentItems.length})
          </TabsTrigger>
          <TabsTrigger value="links">
            <LinkIcon className="h-4 w-4 mr-1.5" />
            Links ({linkItems.length})
          </TabsTrigger>
          <TabsTrigger value="notes">
            <StickyNote className="h-4 w-4 mr-1.5" />
            Notes ({noteItems.length})
          </TabsTrigger>
          <TabsTrigger value="contacts">
            <User className="h-4 w-4 mr-1.5" />
            Contacts ({contactItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ItemsGrid items={filteredItems} />
        </TabsContent>

        <TabsContent value="starred">
          <ItemsGrid items={starredItems} />
        </TabsContent>

        <TabsContent value="documents">
          <ItemsGrid items={documentItems} />
        </TabsContent>

        <TabsContent value="links">
          <ItemsGrid items={linkItems} />
        </TabsContent>

        <TabsContent value="notes">
          <ItemsGrid items={noteItems} />
        </TabsContent>

        <TabsContent value="contacts">
          <ItemsGrid items={contactItems} />
        </TabsContent>
      </Tabs>

      {/* Storage Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Storage Usage</CardTitle>
          <CardDescription>Your vault storage and limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Used</span>
              <span className="font-medium">300 MB of 10 GB</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: "3%" }}
              />
            </div>
            <div className="grid grid-cols-5 gap-4 text-center text-sm">
              <div>
                <p className="font-medium">{documentItems.length}</p>
                <p className="text-xs text-muted-foreground">Documents</p>
              </div>
              <div>
                <p className="font-medium">{linkItems.length}</p>
                <p className="text-xs text-muted-foreground">Links</p>
              </div>
              <div>
                <p className="font-medium">{noteItems.length}</p>
                <p className="text-xs text-muted-foreground">Notes</p>
              </div>
              <div>
                <p className="font-medium">{contactItems.length}</p>
                <p className="text-xs text-muted-foreground">Contacts</p>
              </div>
              <div>
                <p className="font-medium">
                  {vaultItems.filter((i) => i.type === "image").length}
                </p>
                <p className="text-xs text-muted-foreground">Images</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Item
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{itemToDelete?.name}&quot;?
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
    </div>
  );
}
