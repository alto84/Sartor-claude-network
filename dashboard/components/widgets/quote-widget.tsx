"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Quote, Share2, RefreshCw, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const familyQuotes = [
  {
    text: "Family is not an important thing. It's everything.",
    author: "Michael J. Fox",
  },
  {
    text: "The love of a family is life's greatest blessing.",
    author: "Unknown",
  },
  {
    text: "In family life, love is the oil that eases friction.",
    author: "Friedrich Nietzsche",
  },
  {
    text: "Other things may change us, but we start and end with family.",
    author: "Anthony Brandt",
  },
  {
    text: "The memories we make with our family is everything.",
    author: "Candace Cameron Bure",
  },
  {
    text: "Family means no one gets left behind or forgotten.",
    author: "David Ogden Stiers",
  },
  {
    text: "A happy family is but an earlier heaven.",
    author: "George Bernard Shaw",
  },
  {
    text: "The greatest thing in life is to keep your mind young.",
    author: "Henry Ford",
  },
  {
    text: "Happiness is homemade.",
    author: "Unknown",
  },
  {
    text: "Together is a wonderful place to be.",
    author: "Unknown",
  },
  {
    text: "Home is where love resides, memories are created, and laughter never ends.",
    author: "Unknown",
  },
  {
    text: "The most important thing in the world is family and love.",
    author: "John Wooden",
  },
  {
    text: "Being a family means you are a part of something very wonderful.",
    author: "Lisa Weed",
  },
  {
    text: "Families are like branches on a tree. We grow in different directions yet our roots remain as one.",
    author: "Unknown",
  },
  {
    text: "A family is a gift that lasts forever.",
    author: "Unknown",
  },
];

function getDailyQuote(): typeof familyQuotes[0] {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  return familyQuotes[dayOfYear % familyQuotes.length];
}

export function QuoteWidget() {
  const [quote, setQuote] = useState(getDailyQuote());
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleShare = async () => {
    const shareText = `"${quote.text}" - ${quote.author}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Quote of the Day",
          text: shareText,
        });
      } catch (err) {
        // User cancelled or share failed
        await navigator.clipboard.writeText(shareText);
      }
    } else {
      await navigator.clipboard.writeText(shareText);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    const randomIndex = Math.floor(Math.random() * familyQuotes.length);
    setQuote(familyQuotes[randomIndex]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
            <Quote className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-lg">Quote of the Day</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleRefresh}
          className={cn(isRefreshing && "animate-spin")}
        >
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="relative">
          <Quote className="absolute -top-2 -left-1 h-6 w-6 text-amber-200 dark:text-amber-800 rotate-180" />
          <blockquote className="pl-6 pr-2">
            <p className="text-lg font-medium italic text-foreground/90 leading-relaxed">
              {quote.text}
            </p>
            <footer className="mt-3 text-sm text-muted-foreground">
              - {quote.author}
            </footer>
          </blockquote>
        </div>
        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn(
              "gap-2 transition-all",
              isLiked && "text-red-500",
              isAnimating && "scale-110"
            )}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-all",
                isLiked && "fill-red-500"
              )}
            />
            <span className="text-xs">Save</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            <span className="text-xs">Share</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
