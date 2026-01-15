"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Hook to detect if dark mode is active
 * Handles SSR by returning undefined until mounted
 */
export function useDarkMode() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return undefined;
  }

  return resolvedTheme === "dark";
}

/**
 * Hook to get the current theme with mount safety
 */
export function useCurrentTheme() {
  const { theme, resolvedTheme, setTheme, themes } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    theme: mounted ? theme : undefined,
    resolvedTheme: mounted ? resolvedTheme : undefined,
    setTheme,
    themes,
    mounted,
    isDark: mounted ? resolvedTheme === "dark" : undefined,
    isLight: mounted ? resolvedTheme === "light" : undefined,
    isSystem: mounted ? theme === "system" : undefined,
  };
}

/**
 * Hook to detect system color scheme preference
 * Works even without next-themes
 */
export function useSystemColorScheme() {
  const [colorScheme, setColorScheme] = useState<"dark" | "light" | undefined>(
    undefined
  );

  useEffect(() => {
    // Initial check
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setColorScheme(mediaQuery.matches ? "dark" : "light");

    // Listen for changes
    const handler = (e: MediaQueryListEvent) => {
      setColorScheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return colorScheme;
}
