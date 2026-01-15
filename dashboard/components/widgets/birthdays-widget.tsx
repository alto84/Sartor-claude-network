"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Cake, Gift, PartyPopper, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Birthday {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  date: Date;
  relationship: string;
}

// Sample birthday data - in production this would come from your data store
const sampleBirthdays: Birthday[] = [
  {
    id: "1",
    name: "Emma",
    initials: "ES",
    date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 3),
    relationship: "Daughter",
  },
  {
    id: "2",
    name: "Grandma Rose",
    initials: "GR",
    date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 12),
    relationship: "Grandmother",
  },
  {
    id: "3",
    name: "Uncle Mike",
    initials: "UM",
    date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 21),
    relationship: "Uncle",
  },
  {
    id: "4",
    name: "Sarah",
    initials: "SS",
    date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15),
    relationship: "Spouse",
  },
];

function getDaysUntil(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const birthday = new Date(date);
  birthday.setHours(0, 0, 0, 0);

  // If birthday has passed this year, check next year
  if (birthday < today) {
    birthday.setFullYear(birthday.getFullYear() + 1);
  }

  const diffTime = birthday.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getUpcomingBirthdays(birthdays: Birthday[], days: number = 30): Birthday[] {
  return birthdays
    .map((b) => ({ ...b, daysUntil: getDaysUntil(b.date) }))
    .filter((b) => b.daysUntil <= days && b.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

function formatBirthdayDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function BirthdaysWidget() {
  const [birthdays, setBirthdays] = useState<Birthday[]>(sampleBirthdays);
  const upcomingBirthdays = getUpcomingBirthdays(birthdays);
  const nextBirthday = upcomingBirthdays[0];
  const daysUntilNext = nextBirthday ? getDaysUntil(nextBirthday.date) : null;

  const handleGiftIdeas = (name: string) => {
    // In production, this would navigate to chat with a gift suggestion prompt
    window.location.href = `/chat?prompt=Gift ideas for ${name}'s birthday`;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-pink-100 dark:bg-pink-900/50">
            <Cake className="h-4 w-4 text-pink-600 dark:text-pink-400" />
          </div>
          <CardTitle className="text-lg">Upcoming Birthdays</CardTitle>
        </div>
        <Button variant="ghost" size="sm" className="text-xs">
          <Calendar className="h-3 w-3 mr-1" />
          View All
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Countdown to next birthday */}
        {nextBirthday && (
          <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-pink-100/50 to-purple-100/50 dark:from-pink-900/20 dark:to-purple-900/20 border border-pink-200/50 dark:border-pink-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-pink-300 dark:border-pink-700">
                  <AvatarImage src={nextBirthday.avatar} alt={nextBirthday.name} />
                  <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-400 text-white font-semibold">
                    {nextBirthday.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{nextBirthday.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBirthdayDate(nextBirthday.date)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  {daysUntilNext === 0 ? (
                    <>
                      <PartyPopper className="h-5 w-5 text-pink-500 animate-bounce" />
                      <span className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                        Today!
                      </span>
                    </>
                  ) : daysUntilNext === 1 ? (
                    <span className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                      Tomorrow!
                    </span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                        {daysUntilNext}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">days</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3 gap-2 bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40"
              onClick={() => handleGiftIdeas(nextBirthday.name)}
            >
              <Gift className="h-4 w-4 text-pink-500" />
              Get Gift Ideas
            </Button>
          </div>
        )}

        {/* Other upcoming birthdays */}
        <div className="space-y-3">
          {upcomingBirthdays.slice(1, 4).map((birthday) => {
            const daysUntil = getDaysUntil(birthday.date);
            return (
              <div
                key={birthday.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={birthday.avatar} alt={birthday.name} />
                    <AvatarFallback className="bg-gradient-to-br from-pink-300 to-purple-300 dark:from-pink-700 dark:to-purple-700 text-white text-xs">
                      {birthday.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{birthday.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBirthdayDate(birthday.date)} - {birthday.relationship}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {daysUntil} days
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleGiftIdeas(birthday.name)}
                  >
                    <Gift className="h-4 w-4 text-pink-500" />
                  </Button>
                </div>
              </div>
            );
          })}

          {upcomingBirthdays.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Cake className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No birthdays in the next 30 days</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
