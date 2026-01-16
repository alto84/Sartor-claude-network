"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit,
  Trash2,
  User,
} from "lucide-react";

interface FamilyMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  email: string;
  phone: string;
  birthday: string;
  location: string;
  color: string;
}

const familyMembers: FamilyMember[] = [
  {
    id: "1",
    name: "Alton Sartor",
    initials: "AS",
    role: "Parent",
    email: "alton@sartor.family",
    phone: "(555) 123-4567",
    birthday: "March 15",
    location: "Home",
    color: "bg-blue-500",
  },
  {
    id: "2",
    name: "Aneeta Sartor",
    initials: "AS",
    role: "Parent",
    email: "aneeta@sartor.family",
    phone: "(555) 234-5678",
    birthday: "July 22",
    location: "Work",
    color: "bg-pink-500",
  },
  {
    id: "3",
    name: "Vayu Sartor",
    initials: "VS",
    role: "Child",
    email: "vayu@sartor.family",
    phone: "(555) 345-6789",
    birthday: "August 14",
    location: "School",
    color: "bg-purple-500",
  },
  {
    id: "4",
    name: "Vishala Sartor",
    initials: "VS",
    role: "Child",
    email: "vishala@sartor.family",
    phone: "(555) 456-7890",
    birthday: "July 29",
    location: "School",
    color: "bg-green-500",
  },
];

function MemberCard({ member }: { member: FamilyMember }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src="" alt={member.name} />
              <AvatarFallback className={`${member.color} text-white text-lg`}>
                {member.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{member.name}</CardTitle>
              <CardDescription>{member.role}</CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>{member.email}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>{member.phone}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{member.birthday}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{member.location}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function AddMemberDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Family Member</DialogTitle>
          <DialogDescription>
            Add a new member to your family dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input placeholder="Full name" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Input placeholder="Parent, Child, etc." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" placeholder="email@example.com" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone</label>
            <Input type="tel" placeholder="(555) 123-4567" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Birthday</label>
            <Input placeholder="Month Day" />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline">Cancel</Button>
          <Button>Add Member</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function FamilyPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMembers = familyMembers.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const parents = filteredMembers.filter((m) => m.role === "Parent");
  const children = filteredMembers.filter((m) => m.role === "Child");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Family Members</h1>
          <p className="text-muted-foreground">
            Manage your family profiles and information
          </p>
        </div>
        <AddMemberDialog />
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All ({filteredMembers.length})
          </TabsTrigger>
          <TabsTrigger value="parents">
            Parents ({parents.length})
          </TabsTrigger>
          <TabsTrigger value="children">
            Children ({children.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="parents" className="space-y-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {parents.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="children" className="space-y-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {children.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Family Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">{familyMembers.length}</p>
              <p className="text-sm text-muted-foreground">Total Members</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">
                {familyMembers.filter((m) => m.location === "Home").length}
              </p>
              <p className="text-sm text-muted-foreground">At Home</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">
                {familyMembers.filter((m) => m.location === "Work").length}
              </p>
              <p className="text-sm text-muted-foreground">At Work</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">
                {familyMembers.filter((m) => m.location === "School").length}
              </p>
              <p className="text-sm text-muted-foreground">At School</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
