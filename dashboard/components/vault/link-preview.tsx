"use client";

import * as React from "react";
import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Link as LinkIcon,
  Globe,
  Loader2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export interface LinkMetadata {
  url: string;
  title: string;
  description: string;
  favicon: string;
  image?: string;
  siteName?: string;
}

interface LinkPreviewProps {
  onLinkValidated: (metadata: LinkMetadata | null) => void;
  initialUrl?: string;
  className?: string;
}

// Simulated metadata fetch - in production, this would call an API
async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Parse URL to extract domain
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("Invalid URL format");
  }

  // Generate realistic mock data based on URL
  const domain = parsedUrl.hostname.replace("www.", "");
  const siteName = domain.split(".")[0];
  const capitalizedSiteName =
    siteName.charAt(0).toUpperCase() + siteName.slice(1);

  // Simulate common sites
  const commonSites: Record<string, Partial<LinkMetadata>> = {
    "google.com": {
      title: "Google",
      description: "Search the world's information",
      siteName: "Google",
    },
    "github.com": {
      title: `GitHub - ${parsedUrl.pathname.slice(1) || "Home"}`,
      description: "Where the world builds software",
      siteName: "GitHub",
    },
    "youtube.com": {
      title: "YouTube",
      description: "Enjoy the videos and music you love",
      siteName: "YouTube",
    },
    "docs.google.com": {
      title: "Google Docs",
      description: "Create and edit documents online",
      siteName: "Google Docs",
    },
  };

  const siteData = commonSites[domain] || {};

  return {
    url: url,
    title: siteData.title || `${capitalizedSiteName} - ${parsedUrl.pathname || "Home"}`,
    description:
      siteData.description ||
      `Content from ${capitalizedSiteName}. Visit the link for more information.`,
    favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    siteName: siteData.siteName || capitalizedSiteName,
  };
}

function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function LinkPreview({
  onLinkValidated,
  initialUrl = "",
  className,
}: LinkPreviewProps) {
  const [url, setUrl] = useState(initialUrl);
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const fetchMetadata = useCallback(async () => {
    if (!url.trim()) {
      setMetadata(null);
      setError(null);
      setIsValid(false);
      onLinkValidated(null);
      return;
    }

    // Add protocol if missing
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    if (!isValidUrl(normalizedUrl)) {
      setError("Please enter a valid URL");
      setMetadata(null);
      setIsValid(false);
      onLinkValidated(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchLinkMetadata(normalizedUrl);
      setMetadata(data);
      setIsValid(true);
      onLinkValidated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch link preview");
      setMetadata(null);
      setIsValid(false);
      onLinkValidated(null);
    } finally {
      setIsLoading(false);
    }
  }, [url, onLinkValidated]);

  // Debounced fetch on URL change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (url.trim().length > 5) {
        fetchMetadata();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [url, fetchMetadata]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setError(null);
    setIsValid(false);
    if (!newUrl.trim()) {
      setMetadata(null);
      onLinkValidated(null);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* URL Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          ) : isValid ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : error ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : (
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <Input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={handleUrlChange}
          className={cn(
            "pl-10 pr-10",
            error && "border-destructive focus-visible:ring-destructive"
          )}
        />
        {url && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={fetchMetadata}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}

      {/* Link Preview Card */}
      {metadata && !error && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-start gap-4 p-4">
              {/* Favicon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                  {metadata.favicon ? (
                    <img
                      src={metadata.favicon}
                      alt=""
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.target as HTMLImageElement).parentElement!.innerHTML =
                          '<svg class="h-6 w-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
                      }}
                    />
                  ) : (
                    <Globe className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-medium text-sm leading-tight line-clamp-2">
                      {metadata.title}
                    </h4>
                    {metadata.siteName && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {metadata.siteName}
                      </p>
                    )}
                  </div>
                  <a
                    href={metadata.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {metadata.description}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-2 truncate">
                  {metadata.url}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!metadata && !error && !isLoading && url.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <Globe className="h-8 w-8 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground mt-2">
            Enter a URL to see a preview
          </p>
        </div>
      )}
    </div>
  );
}
