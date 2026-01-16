"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ClipboardList,
  Check,
  Star,
  Trophy,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Chore {
  id: string;
  name: string;
  points: number;
  completed: boolean;
}

interface FamilyMember {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  totalPoints: number;
  chores: Chore[];
}

// Sartor family chores - age-appropriate tasks for each child
const sampleMembers: FamilyMember[] = [
  {
    id: "1",
    name: "Vayu",
    initials: "VS",
    totalPoints: 185,
    chores: [
      { id: "c1", name: "Make bed", points: 5, completed: true },
      { id: "c2", name: "Do homework", points: 15, completed: true },
      { id: "c3", name: "Practice piano", points: 10, completed: false },
      { id: "c4", name: "Clean room", points: 20, completed: false },
    ],
  },
  {
    id: "2",
    name: "Vishala",
    initials: "VS",
    totalPoints: 160,
    chores: [
      { id: "c5", name: "Make bed", points: 5, completed: true },
      { id: "c6", name: "Set dinner table", points: 10, completed: true },
      { id: "c7", name: "Gymnastics practice", points: 10, completed: false },
    ],
  },
];

const rewards = [
  { points: 50, reward: "Extra screen time (30 min)", icon: "📱" },
  { points: 100, reward: "Pick dinner choice", icon: "🍕" },
  { points: 200, reward: "Movie night pick", icon: "🎬" },
  { points: 500, reward: "Special outing", icon: "🎢" },
];

function ProgressRing({
  progress,
  size = 48,
  strokeWidth = 4,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        className="text-muted/30"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-emerald-500 transition-all duration-500"
      />
    </svg>
  );
}

export function ChoreChartWidget() {
  const [members, setMembers] = useState<FamilyMember[]>(sampleMembers);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(
    sampleMembers[0]?.id || null
  );
  const [showRewards, setShowRewards] = useState(false);

  const toggleChore = (memberId: string, choreId: string) => {
    setMembers(
      members.map((member) => {
        if (member.id !== memberId) return member;

        const updatedChores = member.chores.map((chore) =>
          chore.id === choreId ? { ...chore, completed: !chore.completed } : chore
        );

        const pointsChange = member.chores.find((c) => c.id === choreId);
        const wasCompleted = pointsChange?.completed || false;
        const pointsDiff = pointsChange
          ? wasCompleted
            ? -pointsChange.points
            : pointsChange.points
          : 0;

        return {
          ...member,
          chores: updatedChores,
          totalPoints: member.totalPoints + pointsDiff,
        };
      })
    );
  };

  const getProgress = (member: FamilyMember) => {
    if (member.chores.length === 0) return 0;
    const completed = member.chores.filter((c) => c.completed).length;
    return Math.round((completed / member.chores.length) * 100);
  };

  const getNextReward = (points: number) => {
    return rewards.find((r) => r.points > points);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
            <ClipboardList className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <CardTitle className="text-lg">Chore Chart</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => setShowRewards(!showRewards)}
          >
            <Gift className="h-4 w-4" />
            Rewards
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Rewards Panel */}
        {showRewards && (
          <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-amber-100/50 to-orange-100/50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-800/50">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Rewards System
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {rewards.map((reward) => (
                <div
                  key={reward.points}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white/50 dark:bg-black/20"
                >
                  <span className="text-xl">{reward.icon}</span>
                  <div>
                    <p className="text-xs font-medium">{reward.reward}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {reward.points} points
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Family Members */}
        <div className="space-y-3">
          {members.map((member) => {
            const progress = getProgress(member);
            const isExpanded = expandedMemberId === member.id;
            const completedCount = member.chores.filter((c) => c.completed).length;
            const nextReward = getNextReward(member.totalPoints);

            return (
              <div
                key={member.id}
                className={cn(
                  "rounded-xl border transition-all duration-300",
                  isExpanded
                    ? "bg-muted/30 border-emerald-200 dark:border-emerald-800"
                    : "hover:bg-muted/20"
                )}
              >
                {/* Member Header */}
                <button
                  onClick={() =>
                    setExpandedMemberId(isExpanded ? null : member.id)
                  }
                  className="w-full flex items-center justify-between p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10 border-2 border-white dark:border-gray-800 shadow-sm">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-400 text-white font-semibold text-sm">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      {progress === 100 && (
                        <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-0.5">
                          <Star className="h-3 w-3 text-white fill-current" />
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {completedCount}/{member.chores.length} tasks today
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-bold">
                          {member.totalPoints}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">points</p>
                    </div>
                    <div className="relative">
                      <ProgressRing progress={progress} />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                        {progress}%
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Chores List */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2">
                    {member.chores.map((chore) => (
                      <div
                        key={chore.id}
                        onClick={() => toggleChore(member.id, chore.id)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all",
                          chore.completed
                            ? "bg-emerald-100/50 dark:bg-emerald-900/20"
                            : "bg-white dark:bg-gray-900/50 hover:bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                              chore.completed
                                ? "bg-emerald-500 border-emerald-500"
                                : "border-muted-foreground/30 hover:border-emerald-400"
                            )}
                          >
                            {chore.completed && (
                              <Check className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <span
                            className={cn(
                              "text-sm transition-all",
                              chore.completed &&
                                "line-through text-muted-foreground"
                            )}
                          >
                            {chore.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star
                            className={cn(
                              "h-3 w-3",
                              chore.completed
                                ? "text-amber-500 fill-amber-500"
                                : "text-muted-foreground/50"
                            )}
                          />
                          <span
                            className={cn(
                              "text-xs font-medium",
                              chore.completed
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-muted-foreground"
                            )}
                          >
                            +{chore.points}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Next Reward Progress */}
                    {nextReward && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-muted-foreground">
                            Next reward:
                          </span>
                          <span className="font-medium">
                            {nextReward.icon} {nextReward.reward}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                (member.totalPoints / nextReward.points) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 text-right">
                          {nextReward.points - member.totalPoints} points to go
                        </p>
                      </div>
                    )}

                    {/* All chores complete celebration */}
                    {progress === 100 && (
                      <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-200 dark:border-emerald-800 text-center">
                        <Sparkles className="h-5 w-5 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          All chores complete!
                        </p>
                        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                          Great job, {member.name}!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Weekly Summary */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Week total:{" "}
            <span className="font-semibold text-foreground">
              {members.reduce(
                (sum, m) => sum + m.chores.filter((c) => c.completed).length,
                0
              )}
            </span>{" "}
            chores completed
          </div>
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            <Plus className="h-3 w-3" />
            Add Chore
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
