"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Plus,
  X,
  ArrowRight,
  UserPlus,
  Crown,
  Baby,
  User,
} from "lucide-react";
import { FamilyMember } from "@/lib/onboarding-storage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FamilyStepProps {
  familyName: string;
  members: FamilyMember[];
  onAddMember: (member: Omit<FamilyMember, "id">) => void;
  onRemoveMember: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const roleIcons = {
  parent: Crown,
  child: Baby,
  other: User,
};

const roleColors = {
  parent: "bg-purple-500/10 text-purple-600",
  child: "bg-blue-500/10 text-blue-600",
  other: "bg-gray-500/10 text-gray-600",
};

export function FamilyStep({
  familyName,
  members,
  onAddMember,
  onRemoveMember,
  onNext,
  onBack,
}: FamilyStepProps) {
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"parent" | "child" | "other">("parent");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      onAddMember({
        name: newMemberName.trim(),
        role: newMemberRole,
      });
      setNewMemberName("");
      setNewMemberRole("parent");
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddMember();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-lg mx-auto"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
        >
          <Users className="h-8 w-8 text-primary" />
        </motion.div>

        <h2 className="text-2xl font-bold mb-2">
          Who&apos;s in the {familyName} Family?
        </h2>
        <p className="text-muted-foreground">
          Add your family members. You can always add more later.
        </p>
      </div>

      {/* Family Members List */}
      <div className="space-y-3 mb-6">
        <AnimatePresence mode="popLayout">
          {members.map((member, index) => {
            const RoleIcon = roleIcons[member.role];
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${roleColors[member.role]}`}>
                        <RoleIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {member.role}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveMember(member.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add Member Form */}
        <AnimatePresence>
          {isAdding ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="border-primary/50 border-dashed">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Input
                      placeholder="Name"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className="flex-1"
                    />
                    <Select
                      value={newMemberRole}
                      onValueChange={(value: "parent" | "child" | "other") =>
                        setNewMemberRole(value)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAdding(false);
                        setNewMemberName("");
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddMember}
                      disabled={!newMemberName.trim()}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Button
                variant="outline"
                className="w-full h-14 border-dashed"
                onClick={() => setIsAdding(true)}
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Add Family Member
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggested Members */}
      {members.length === 0 && (
        <motion.div
          className="mb-8 p-4 bg-muted/50 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-sm text-muted-foreground text-center mb-3">
            Quick start: Add yourself first
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {["Mom", "Dad", "Parent"].map((name) => (
              <Button
                key={name}
                variant="secondary"
                size="sm"
                onClick={() => onAddMember({ name, role: "parent" })}
              >
                <Plus className="h-3 w-3 mr-1" />
                {name}
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1" disabled={members.length === 0}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {members.length === 0 && (
        <p className="text-sm text-muted-foreground text-center mt-4">
          Add at least one family member to continue
        </p>
      )}
    </motion.div>
  );
}
