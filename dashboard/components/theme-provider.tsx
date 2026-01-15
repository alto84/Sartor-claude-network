"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

/**
 * Theme provider wrapper for next-themes
 * Provides dark mode support throughout the application
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

/**
 * Hook to access and toggle the theme
 */
export function useTheme() {
  const context = React.useContext(
    React.createContext<{
      theme: string | undefined;
      setTheme: (theme: string) => void;
      resolvedTheme: string | undefined;
    } | null>(null)
  );

  // Re-export from next-themes for convenience
  const { useTheme: useNextTheme } = require("next-themes");
  return useNextTheme();
}
